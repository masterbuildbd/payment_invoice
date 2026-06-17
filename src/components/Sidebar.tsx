import React from 'react';
import { 
  LayoutDashboard, 
  FileText,
  AlertCircle,
  AppWindow, 
  LayoutGrid,
  Cpu, 
  Users, 
  Banknote,
  Settings, 
  ChevronRight,
  Wallet,
  X,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
  onLogoutRequest?: () => void;
}

import { useLanguage } from '../lib/language';
import { useAuth } from '../lib/auth';
import { subscribeToSettings, subscribeToCollection, subscribeToInvoices } from '../lib/storage';
import { CompanySettings, User } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ activeTab, setActiveTab, isOpen, onClose }: SidebarProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [settings, setSettings] = React.useState<Partial<CompanySettings>>({});
  const [pendingCount, setPendingCount] = React.useState(0);
  const [pendingPaymentsCount, setPendingPaymentsCount] = React.useState(0);
  const [currentUserData, setCurrentUserData] = React.useState<User | null>(null);
  const [shouldPulse, setShouldPulse] = React.useState(false);

  const isFirstRender = React.useRef(true);
  const prevCountRef = React.useRef(0);

  React.useEffect(() => {
    const unsubscribe = subscribeToSettings((updatedSettings) => {
      setSettings(updatedSettings);
    });
    
    const unsubUsers = subscribeToCollection<User>('users', (usersList) => {
      const count = usersList.filter(u => (u.status || 'approved') === 'pending').length;
      setPendingCount(count);

      if (user) {
        const found = usersList.find(u => u.username === user.username);
        if (found) {
          setCurrentUserData(found);
        }
      }
    });

    const unsubInvoices = subscribeToInvoices((invoicesList) => {
      const count = invoicesList.filter(inv => 
        inv.status === 'pending' && 
        (inv.transactionId || (inv.note && inv.note.includes('ভেরিফিকেশন')))
      ).length;
      setPendingPaymentsCount(count);
    });

    return () => {
      unsubscribe && unsubscribe();
      unsubUsers && unsubUsers();
      unsubInvoices && unsubInvoices();
    };
  }, [user]);

  React.useEffect(() => {
    if (isFirstRender.current) {
      prevCountRef.current = pendingPaymentsCount;
      isFirstRender.current = false;
      return;
    }

    if (pendingPaymentsCount > prevCountRef.current) {
      setShouldPulse(true);
      const timer = setTimeout(() => setShouldPulse(false), 4000);
      prevCountRef.current = pendingPaymentsCount;
      return () => clearTimeout(timer);
    } else {
      prevCountRef.current = pendingPaymentsCount;
    }
  }, [pendingPaymentsCount]);

  const isAdmin = currentUserData?.role === 'admin' || user?.role === 'admin';

  const DEFAULTS_MAP: Record<string, string> = {
    adminDashboardLabel: 'সারাংশ (Admin Dashboard)',
    clientDashboardLabel: 'সারাংশ (Dashboard Overview)',
    clientInvoicesLabel: 'ইনভয়েস শো (Invoices Show)',
    clientRejectedInvoicesLabel: 'রিজেক্ট ইনভয়েস (Rejected Invoices)',
    clientAccountLabel: 'অ্যাকাউন্ট অপশন (Payment Accounts)',
    clientPaymentLabel: 'পেমেন্ট অপশন (Payment Form)',
    clientSmsLabel: 'এসএমএস ইনবক্স (SMS Inbox)',
    clientSettingsLabel: 'সেটিংস অপশন (User Settings)',
    adminPaymentRequestsLabel: 'পেমেন্ট রিকোয়েস্ট (Payment Requests)',
    adminInvoicesLabel: 'ইনভয়েস লিস্ট (Invoice List)',
    adminUnpaidLabel: 'বকেয়া ইনভয়েস (Unpaid Invoices)',
    adminPendingUsersLabel: 'পেন্ডিং গ্রাহক (Pending Registrations)',
    adminFinancesLabel: 'ফাইন্যান্সিয়াল খতিয়ান (Financial Accounts)',
    adminSmsLabel: 'এসএমএস পোর্টাল (SMS Portal)',
    adminSettingsLabel: 'সেটিংস কন্ট্রোল (Admin Configs)',
    appLabel: 'অ্যান্ড্রয়েড অ্যাপ্স (Android Apps)',
    decoderLabel: 'ডিকোড লাইসেন্স (Decoder Licenses)',
    panelLabel: 'রিসেলার প্যানেল (Reseller Panels)',
    userLabel: 'গ্রাহক তালিকা (Users Registry)'
  };

  const getVal = (val: string | undefined, mapKey: string, fallbackKey: string) => {
    if (!val || val === DEFAULTS_MAP[mapKey]) {
      return t(fallbackKey);
    }
    return val;
  };
  
  const rawClientItems = [
    { id: 'dashboard', label: getVal(settings.clientDashboardLabel, 'clientDashboardLabel', 'dashboard'), icon: LayoutDashboard, enabled: settings.clientDashboardEnabled !== false },
    { id: 'client_invoices', label: getVal(settings.clientInvoicesLabel, 'clientInvoicesLabel', 'client_invoices'), icon: FileText, enabled: settings.clientInvoicesEnabled !== false },
    { id: 'client_rejected_invoices', label: getVal(settings.clientRejectedInvoicesLabel, 'clientRejectedInvoicesLabel', 'client_rejected_invoices'), icon: AlertCircle, enabled: settings.clientRejectedInvoicesEnabled !== false },
    { id: 'client_account', label: getVal(settings.clientAccountLabel, 'clientAccountLabel', 'client_account'), icon: Wallet, enabled: settings.clientAccountEnabled !== false },
    { id: 'client_payment', label: getVal(settings.clientPaymentLabel, 'clientPaymentLabel', 'client_payment'), icon: Banknote, enabled: settings.clientPaymentEnabled !== false },
    { id: 'client_sms', label: getVal(settings.clientSmsLabel, 'clientSmsLabel', 'client_sms'), icon: MessageSquare, enabled: settings.clientSmsEnabled !== false },
    { id: 'client_settings', label: getVal(settings.clientSettingsLabel, 'clientSettingsLabel', 'client_settings'), icon: Settings, enabled: settings.clientSettingsEnabled !== false },
  ];

  const menuItems = isAdmin ? [
    { id: 'dashboard', label: getVal(settings.adminDashboardLabel, 'adminDashboardLabel', 'dashboard'), icon: LayoutDashboard },
    { id: 'payment_requests', label: getVal(settings.adminPaymentRequestsLabel, 'adminPaymentRequestsLabel', 'payment_requests'), icon: Banknote, badge: pendingPaymentsCount > 0 ? pendingPaymentsCount : undefined },
    { id: 'invoices', label: getVal(settings.adminInvoicesLabel, 'adminInvoicesLabel', 'invoices'), icon: FileText },
    { id: 'unpaid', label: getVal(settings.adminUnpaidLabel, 'adminUnpaidLabel', 'unpaid'), icon: AlertCircle },
    { id: 'apps', label: getVal(settings.appLabel, 'appLabel', 'apps'), icon: AppWindow },
    { id: 'panels', label: getVal(settings.panelLabel, 'panelLabel', 'panels'), icon: LayoutGrid },
    { id: 'decoders', label: getVal(settings.decoderLabel, 'decoderLabel', 'decoders'), icon: Cpu },
    { id: 'users', label: getVal(settings.userLabel, 'userLabel', 'users'), icon: Users },
    { id: 'pending_users', label: getVal(settings.adminPendingUsersLabel, 'adminPendingUsersLabel', 'pending_users'), icon: Users, badge: pendingCount > 0 ? pendingCount : undefined },
    { id: 'finances', label: getVal(settings.adminFinancesLabel, 'adminFinancesLabel', 'finances'), icon: Banknote },
    { id: 'sms', label: getVal(settings.adminSmsLabel, 'adminSmsLabel', 'sms'), icon: MessageSquare },
    { id: 'settings', label: getVal(settings.adminSettingsLabel, 'adminSettingsLabel', 'settings'), icon: Settings },
  ] : rawClientItems.filter(item => item.enabled);
  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside className={`
        fixed inset-y-0 start-0 z-50 w-64 bg-white border-e border-slate-200 flex flex-col transition-transform duration-300 transform 
        lg:translate-x-0 lg:static lg:h-screen lg:sticky lg:top-0
        ${isOpen ? 'translate-x-0' : (document.documentElement.dir === 'rtl' ? 'translate-x-full' : '-translate-x-full')}
      `}>
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-indigo-600 tracking-tight">{settings.sidebarTitle || 'Amar Apka'}</h1>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 mt-1">{t('management_portal')}</p>
          </div>
          <button onClick={onClose} className="lg:hidden p-2 text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        
        <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors font-medium group ${
                activeTab === item.id 
                  ? 'bg-slate-50 text-indigo-600' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-indigo-600'
              }`}
            >
              <item.icon size={20} className={activeTab === item.id ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-500'} />
              <span className="text-sm">{item.label}</span>
              {item.badge !== undefined && (
                <motion.span
                  animate={item.id === 'payment_requests' && shouldPulse ? {
                    scale: [1, 1.35, 0.95, 1.15, 1],
                    boxShadow: [
                      '0 0 0 0 rgba(244, 63, 94, 0.7)',
                      '0 0 0 10px rgba(244, 63, 94, 0)',
                      '0 0 0 0 rgba(244, 63, 94, 0)',
                      '0 0 0 6px rgba(244, 63, 94, 0)',
                      '0 0 0 0 rgba(244, 63, 94, 0)'
                    ]
                  } : {}}
                  transition={item.id === 'payment_requests' && shouldPulse ? {
                    duration: 1.4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  } : {}}
                  className={`ms-2 text-white font-black text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] h-[18px] flex items-center justify-center origin-center transition-all duration-300 ${
                    item.id === 'payment_requests' && shouldPulse 
                      ? 'bg-rose-500 ring-4 ring-rose-100 shadow-lg scale-110 font-sans' 
                      : 'bg-amber-500 animate-pulse'
                  }`}
                >
                  {item.badge}
                </motion.span>
              )}
              {activeTab === item.id && (
                <motion.div layoutId="active-indicator" className="ms-auto rtl:rotate-180">
                  <ChevronRight size={16} />
                </motion.div>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          {user && (
            <div className="flex items-center gap-3 px-3 py-2 bg-slate-50 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-indigo-600 border border-slate-100 shadow-sm font-bold text-xs uppercase">
                {(settings.sidebarAdminName || user.name).charAt(0)}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest truncate">{settings.sidebarAdminName || user.name}</p>
                <p className="text-[10px] text-slate-400 capitalize">{user.role}</p>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
