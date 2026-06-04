import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Bell, CheckCircle, Info, ShieldAlert } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { createSystemNotification } from '../lib/storage';

export interface Toast {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  duration?: number;
  actionLabel?: string;
  onAction?: () => void;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const playNotificationChime = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (audioContext.state === 'suspended') {
      return;
    }
    const osc1 = audioContext.createOscillator();
    const gain1 = audioContext.createGain();
    osc1.connect(gain1);
    gain1.connect(audioContext.destination);
    
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
    gain1.gain.setValueAtTime(0.08, audioContext.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    osc1.start(audioContext.currentTime);
    osc1.stop(audioContext.currentTime + 0.3);

    const osc2 = audioContext.createOscillator();
    const gain2 = audioContext.createGain();
    osc2.connect(gain2);
    gain2.connect(audioContext.destination);
    
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.12); // E5
    gain2.gain.setValueAtTime(0, audioContext.currentTime);
    gain2.gain.setValueAtTime(0.08, audioContext.currentTime + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    osc2.start(audioContext.currentTime + 0.12);
    osc2.stop(audioContext.currentTime + 0.5);
  } catch (err) {
    console.warn('Audio play restricted by browser autoplay policy:', err);
  }
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  let authContext: any = null;
  try {
    authContext = useAuth();
  } catch (e) {
    // Graceful fallback if instantiated outside AuthProvider
  }
  const user = authContext?.user;

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
    
    // Play light audio notification chime
    playNotificationChime();

    // Persist as a recent system notification back-end record
    const recipient = user 
      ? (user.role === 'admin' ? 'all_admins' : user.username) 
      : 'all_admins';

    createSystemNotification({
      type: toast.type || 'info',
      title: toast.title,
      message: toast.message,
      recipient
    }).catch((err) => {
      console.warn('Auto-persisting notification failed:', err);
    });
  }, [user]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

interface ToastContainerProps {
  toasts: Toast[];
  removeToast: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
  return (
    <div id="toast-container" className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 w-full max-w-sm px-4 pointer-events-none sm:px-0">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
};

const ToastCard: React.FC<{ toast: Toast; onDismiss: () => void }> = ({ toast, onDismiss }) => {
  const { id, type, title, message, duration = 6000, actionLabel, onAction } = toast;

  useEffect(() => {
    if (duration === Infinity) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  const getTheme = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-emerald-950/95 border-emerald-500/30 text-emerald-100',
          icon: <CheckCircle className="text-emerald-400 shrink-0" size={18} />,
          glow: 'shadow-lg shadow-emerald-900/20'
        };
      case 'warning':
        return {
          bg: 'bg-amber-950/95 border-amber-500/30 text-amber-100',
          icon: <Info className="text-amber-400 shrink-0" size={18} />,
          glow: 'shadow-lg shadow-amber-900/20'
        };
      case 'error':
        return {
          bg: 'bg-rose-950/95 border-rose-500/30 text-rose-100',
          icon: <ShieldAlert className="text-rose-400 shrink-0" size={18} />,
          glow: 'shadow-lg shadow-rose-900/20'
        };
      default:
        return {
          bg: 'bg-slate-900/95 border-indigo-500/30 text-indigo-50',
          icon: <Bell className="text-indigo-400 shrink-0 animate-bounce" size={18} />,
          glow: 'shadow-lg shadow-indigo-950/30'
        };
    }
  };

  const theme = getTheme();

  return (
    <motion.div
      id={`toast-${id}`}
      initial={{ opacity: 0, y: -20, scale: 0.95, x: 20 }}
      animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.9, x: 50, transition: { duration: 0.15 } }}
      className={`pointer-events-auto flex flex-col p-4 rounded-xl border backdrop-blur-md ${theme.bg} ${theme.glow} transition-all max-w-sm w-full`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5">{theme.icon}</div>
          <div className="space-y-1">
            <h4 className="text-xs font-black tracking-wide leading-tight uppercase font-sans">{title}</h4>
            <p className="text-[11px] text-slate-300 leading-relaxed font-sans">{message}</p>
          </div>
        </div>
        <button
          id={`toast-dismiss-${id}`}
          onClick={onDismiss}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-all shrink-0 cursor-pointer"
        >
          <X size={14} />
        </button>
      </div>

      {actionLabel && onAction && (
        <div className="mt-3 flex justify-end pl-7">
          <button
            id={`toast-action-${id}`}
            onClick={() => {
              onAction();
              onDismiss();
            }}
            className="text-[10px] font-black uppercase tracking-widest bg-white/10 hover:bg-white/25 text-white px-3 py-1.5 rounded-lg border border-white/10 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            {actionLabel}
          </button>
        </div>
      )}
    </motion.div>
  );
};
