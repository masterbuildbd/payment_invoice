import React, { useState, useEffect, useRef } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import { LanguageProvider } from './lib/language';
import { Login } from './pages/Login';
import { Sidebar } from './components/Sidebar';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Invoices } from './pages/Invoices';
import { Apps } from './pages/Apps';
import { Panels } from './pages/Panels';
import { Decoders } from './pages/Decoders';
import { Users } from './pages/Users';
import { Settings } from './pages/Settings';
import Finances from './pages/Finances';
import { PublicVerify } from './pages/PublicVerify';
import { PaymentRequests } from './pages/PaymentRequests';
import { SmsPortal } from './pages/SmsPortal';
import { Loader2, LogOut, Clock, AlertTriangle } from 'lucide-react';
import { Modal } from './components/Modal';
import { motion, AnimatePresence } from 'motion/react';
import { subscribeToCollection, subscribeToInvoices, subscribeToSettings } from './lib/storage';
import { User, CompanySettings } from './types';
import { ToastProvider, useToast } from './components/Toast';

function ProtectedApp() {
  const { user, logout } = useAuth();
  const [settings, setSettings] = useState<Partial<CompanySettings>>({});
  const [activeTab, setActiveTabBase] = useState(() => {
    return localStorage.getItem('master_active_tab') || 'dashboard';
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [currentUserData, setCurrentUserData] = useState<User | null>(null);
  const backupAttemptedRef = useRef(false);

  const [showInactivityWarning, setShowInactivityWarning] = useState(false);
  const [inactivityCountdown, setInactivityCountdown] = useState(60);
  const lastActiveTimeRef = useRef<number>(Date.now());
  const countdownIntervalRef = useRef<any>(null);

  // Constants
  const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  const WARNING_DURATION = 60; // 60 seconds grace period

  useEffect(() => {
    if (!user) return;

    const handleActivity = () => {
      lastActiveTimeRef.current = Date.now();
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);
    window.addEventListener('touchstart', handleActivity);

    const checkInterval = setInterval(() => {
      if (showInactivityWarning) return;

      const now = Date.now();
      const inactiveDuration = now - lastActiveTimeRef.current;

      if (inactiveDuration >= INACTIVITY_TIMEOUT) {
        setShowInactivityWarning(true);
        setInactivityCountdown(WARNING_DURATION);
      }
    }, 5000);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      clearInterval(checkInterval);
    };
  }, [user, showInactivityWarning]);

  useEffect(() => {
    if (showInactivityWarning) {
      countdownIntervalRef.current = setInterval(() => {
        setInactivityCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownIntervalRef.current);
            logout();
            setShowInactivityWarning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    }

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [showInactivityWarning, logout]);

  const handleExtendSession = () => {
    lastActiveTimeRef.current = Date.now();
    setShowInactivityWarning(false);
  };

  useEffect(() => {
    const unsubscribe = subscribeToSettings(setSettings);
    return () => unsubscribe && unsubscribe();
  }, []);

  useEffect(() => {
    if (settings && settings.autoDailyBackupEnabled && !backupAttemptedRef.current) {
      const today = new Date().toISOString().split('T')[0];
      if (settings.lastBackupDate !== today) {
        backupAttemptedRef.current = true;
        import('./lib/storage').then(({ runDailyBackup }) => {
          runDailyBackup(settings as CompanySettings);
        }).catch(err => {
          console.error("Auto daily backup error:", err);
        });
      }
    }
  }, [settings]);

  useEffect(() => {
    if (user) {
      const unsubscribe = subscribeToCollection<User>('users', (allUsers) => {
        const found = allUsers.find(u => u.username === user.username);
        if (found) {
          setCurrentUserData(found);
        }
      });
      return () => {
        unsubscribe && unsubscribe();
      };
    }
  }, [user]);

  const setActiveTab = (tab: string) => {
    setActiveTabBase(tab);
    localStorage.setItem('master_active_tab', tab);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  const { addToast } = useToast();
  const isInitializedRef = useRef(false);
  const existingInvoicesRef = useRef<Set<string>>(new Set());

  const isAdmin = currentUserData?.role === 'admin' || user?.role === 'admin';

  useEffect(() => {
    if (!isAdmin) {
      isInitializedRef.current = false;
      existingInvoicesRef.current.clear();
      return;
    }

    const unsubscribe = subscribeToInvoices((invoicesList) => {
      // On first load, record existing invoice IDs to avoid notifying on historical entries
      if (!isInitializedRef.current) {
        const ids = invoicesList.map(inv => inv.id).filter(Boolean);
        existingInvoicesRef.current = new Set(ids);
        isInitializedRef.current = true;
        return;
      }

      // Check each invoice
      invoicesList.forEach((inv) => {
        if (!inv.id) return;

        const isNew = !existingInvoicesRef.current.has(inv.id);
        if (isNew) {
          existingInvoicesRef.current.add(inv.id);

          // Alert only if status is pending
          if (inv.status === 'pending') {
            addToast({
              type: 'info',
              title: 'নতুন পেমেন্ট রিকোয়েস্ট (New Payment Report)',
              message: `${inv.customerName} বকেয়া পরিশোধের জন্য ৳${(inv.amount || 0).toLocaleString()} পেমেন্ট পাঠিয়েছেন (${inv.paymentMethod || (inv as any).method || 'Unknown'})।`,
              actionLabel: 'ইনভয়েস দেখুন (View Invoices)',
              onAction: () => {
                handleTabChange('invoices');
              },
              duration: 15000 // Display for 15 seconds
            });
          }
        }
      });
    });

    return () => {
      unsubscribe && unsubscribe();
    };
  }, [isAdmin, addToast]);

  const renderContent = () => {
    if (!isAdmin) {
      const clientTabs = [
        { id: 'dashboard', enabled: settings.clientDashboardEnabled !== false },
        { id: 'client_invoices', enabled: settings.clientInvoicesEnabled !== false },
        { id: 'client_rejected_invoices', enabled: settings.clientRejectedInvoicesEnabled !== false },
        { id: 'client_account', enabled: settings.clientAccountEnabled !== false },
        { id: 'client_payment', enabled: settings.clientPaymentEnabled !== false },
        { id: 'client_sms', enabled: settings.clientSmsEnabled !== false },
        { id: 'client_settings', enabled: settings.clientSettingsEnabled !== false }
      ];

      const allowedClientTabs = clientTabs.filter(ct => ct.enabled).map(ct => ct.id);
      const resolvedTab = allowedClientTabs.includes(activeTab) ? activeTab : (allowedClientTabs[0] || 'dashboard');
      
      const subTabMap: Record<string, string> = {
        'dashboard': 'dashboard',
        'client_invoices': 'invoices',
        'client_rejected_invoices': 'rejected_invoices',
        'client_account': 'account',
        'client_payment': 'payment',
        'client_sms': 'sms',
        'client_settings': 'settings'
      };
      
      return <Dashboard activeSubTab={subTabMap[resolvedTab] || 'dashboard'} onLogoutRequest={() => setShowLogoutConfirm(true)} onTabChange={handleTabChange} />;
    }

    switch (activeTab) {
      case 'dashboard': return <Dashboard activeSubTab="dashboard" onLogoutRequest={() => setShowLogoutConfirm(true)} />;
      case 'payment_requests': return <PaymentRequests />;
      case 'invoices': return <Invoices />;
      case 'unpaid': return <Invoices initialStatusFilter="unpaid" />;
      case 'apps': return <Apps />;
      case 'panels': return <Panels />;
      case 'decoders': return <Decoders />;
      case 'users': return <Users />;
      case 'pending_users': return <Users initialFilter="pending" />;
      case 'finances': return <Finances />;
      case 'sms': return <SmsPortal />;
      case 'settings': return <Settings />;
      default: return <Dashboard activeSubTab="dashboard" onLogoutRequest={() => setShowLogoutConfirm(true)} />;
    }
  };

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-white selection:bg-indigo-100 selection:text-indigo-900 overflow-x-hidden">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={handleTabChange} 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
        onLogoutRequest={() => setShowLogoutConfirm(true)}
      />
      <Layout 
        activeTab={activeTab} 
        onMenuToggle={() => setIsMobileMenuOpen(true)}
        onLogoutRequest={() => setShowLogoutConfirm(true)}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="h-full"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </Layout>

      <Modal 
        isOpen={showLogoutConfirm} 
        onClose={() => setShowLogoutConfirm(false)} 
        title="Confirm Logout"
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-100">
            <LogOut size={32} className="text-rose-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Are you sure?</h3>
          <p className="text-sm text-slate-500 mt-2">You will need to login again to access the management portal.</p>
          
          <div className="flex gap-3 mt-8">
            <button 
              onClick={() => setShowLogoutConfirm(false)}
              className="flex-1 px-4 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors border border-slate-200"
            >
              No, Stay here
            </button>
            <button 
              onClick={() => {
                logout();
                setShowLogoutConfirm(false);
              }}
              className="flex-1 px-4 py-2.5 text-sm font-bold bg-rose-600 text-white rounded-xl hover:bg-rose-700 shadow-sm transition-all"
            >
              Sign Out
            </button>
          </div>
        </div>
      </Modal>

      {/* Auto-logout warning modal for inactivity */}
      <Modal 
        isOpen={showInactivityWarning} 
        onClose={handleExtendSession} 
        title="Session Inactivity Warning"
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-100 animate-pulse">
            <AlertTriangle size={32} className="text-amber-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-850">You have been inactive!</h3>
          <p className="text-sm text-slate-500 mt-2">
            For security, you will be logged out automatically in:
          </p>
          
          <div className="my-6 inline-flex items-center gap-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 px-5 py-3 rounded-2xl border border-slate-150 transition-colors font-mono">
            <Clock size={18} className="text-indigo-600 animate-spin" style={{ animationDuration: '6s' }} />
            <span className="text-xl font-black tracking-tight text-indigo-600">{inactivityCountdown} seconds</span>
          </div>

          <p className="text-xs text-slate-400">
            Click 'Extend Session' below to stay logged in.
          </p>
          
          <div className="flex gap-3 mt-8">
            <button 
              onClick={() => {
                logout();
                setShowInactivityWarning(false);
              }}
              className="flex-1 px-4 py-2.5 text-sm font-bold text-rose-500 hover:bg-rose-50 rounded-xl transition-all border border-rose-100"
            >
              Logout Now
            </button>
            <button 
              onClick={handleExtendSession}
              className="flex-1 px-4 py-2.5 text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-150/40 dark:shadow-none hover:shadow-indigo-200 transition-all active:scale-[0.98] cursor-pointer"
            >
              Extend Session
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function AppRoutes() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />
      <Route path="/verify/:invoiceId" element={<PublicVerify />} />
      <Route path="/*" element={<ProtectedApp />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <LanguageProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </LanguageProvider>
      </AuthProvider>
    </Router>
  );
}
