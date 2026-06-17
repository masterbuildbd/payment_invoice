import React from 'react';
import { Menu, LogOut, Info, Sun, Moon, Bell, BellOff, X, Check, Trash2 } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useLanguage, Language } from '../lib/language';
import { 
  subscribeToSettings, 
  subscribeToCollection,
  markNotificationRead,
  markAllNotificationsRead,
  deleteSystemNotification,
  clearAllNotifications
} from '../lib/storage';
import { CompanySettings, User, SystemNotification } from '../types';
import firebaseConfig from '../../firebase-applet-config.json';
import { motion, AnimatePresence } from 'motion/react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onMenuToggle?: () => void;
  onLogoutRequest?: () => void;
}

export function Layout({ children, activeTab, onMenuToggle, onLogoutRequest }: LayoutProps) {
  const { user } = useAuth();
  const { language: activeLang, setLanguage, t } = useLanguage();
  const [isLangOpen, setIsLangOpen] = React.useState(false);
  const [currentUserData, setCurrentUserData] = React.useState<User | null>(null);

  const [darkMode, setDarkMode] = React.useState(() => {
    return localStorage.getItem('dark_mode_theme') === 'dark';
  });

  const [settings, setSettings] = React.useState<Partial<CompanySettings>>({});

  // Notifications state
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<SystemNotification[]>([]);
  const [activeFilter, setActiveFilter] = React.useState<'all' | 'unread'>('all');

  React.useEffect(() => {
    const unsubscribe = subscribeToSettings((updatedSettings) => {
      setSettings(updatedSettings);
    });
    return () => unsubscribe && unsubscribe();
  }, []);

  React.useEffect(() => {
    if (user) {
      const unsubUser = subscribeToCollection<User>('users', (allUsers) => {
        const found = allUsers.find(u => u.username === user.username);
        if (found) {
          setCurrentUserData(found);
        }
      });
      return () => unsubUser && unsubUser();
    }
  }, [user]);

  // Notifications subscription
  React.useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    const unsubscribe = subscribeToCollection<SystemNotification>('notifications', (items) => {
      if (user.role === 'admin' || currentUserData?.role === 'admin') {
        // Admins can view all notifications
        setNotifications(items);
      } else {
        // Clients view notifications targeted specifically to their username or 'all'
        const filtered = items.filter(
          (n) => n.recipient === user.username || n.recipient === 'all' || n.recipient === 'all_admins'
        );
        setNotifications(filtered);
      }
    }, 'createdAt');

    return () => unsubscribe && unsubscribe();
  }, [user, currentUserData]);

  const isAdmin = currentUserData?.role === 'admin' || user?.role === 'admin';

  React.useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('dark_mode_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('dark_mode_theme', 'light');
    }
  }, [darkMode]);

  const getLabel = (tab: string) => {
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

    const labels: Record<string, string> = {
      // Client tabs
      'dashboard': isAdmin 
        ? getVal(settings.adminDashboardLabel, 'adminDashboardLabel', 'dashboard') 
        : getVal(settings.clientDashboardLabel, 'clientDashboardLabel', 'dashboard'),
      'client_invoices': getVal(settings.clientInvoicesLabel, 'clientInvoicesLabel', 'client_invoices'),
      'client_rejected_invoices': getVal(settings.clientRejectedInvoicesLabel, 'clientRejectedInvoicesLabel', 'client_rejected_invoices'),
      'client_account': getVal(settings.clientAccountLabel, 'clientAccountLabel', 'client_account'),
      'client_payment': getVal(settings.clientPaymentLabel, 'clientPaymentLabel', 'client_payment'),
      'client_settings': getVal(settings.clientSettingsLabel, 'clientSettingsLabel', 'client_settings'),
      'client_sms': getVal(settings.clientSmsLabel, 'clientSmsLabel', 'client_sms'),

      // Admin tabs
      'payment_requests': getVal(settings.adminPaymentRequestsLabel, 'adminPaymentRequestsLabel', 'payment_requests'),
      'invoices': getVal(settings.adminInvoicesLabel, 'adminInvoicesLabel', 'invoices'),
      'unpaid': getVal(settings.adminUnpaidLabel, 'adminUnpaidLabel', 'unpaid'),
      'apps': getVal(settings.appLabel, 'appLabel', 'apps'),
      'panels': getVal(settings.panelLabel, 'panelLabel', 'panels'),
      'decoders': getVal(settings.decoderLabel, 'decoderLabel', 'decoders'),
      'users': getVal(settings.userLabel, 'userLabel', 'users'),
      'pending_users': getVal(settings.adminPendingUsersLabel, 'adminPendingUsersLabel', 'pending_users'),
      'finances': getVal(settings.adminFinancesLabel, 'adminFinancesLabel', 'finances'),
      'sms': getVal(settings.adminSmsLabel, 'adminSmsLabel', 'sms'),
      'settings': getVal(settings.adminSettingsLabel, 'adminSettingsLabel', 'settings'),
    };
    return labels[tab] || t(tab) || tab;
  };

  const languages = [
    { code: 'EN', label: 'English', flag: '🇺🇸' },
    { code: 'BN', label: 'Bangla', flag: '🇧🇩' },
    { code: 'UR', label: 'Urdu', flag: '🇵🇰' },
    { code: 'HI', label: 'Hindi', flag: '🇮🇳' },
    { code: 'AR', label: 'Arabic', flag: '🇸🇦' },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  const filteredNotifications = notifications.filter(n => {
    if (activeFilter === 'unread') return !n.read;
    return true;
  });

  const formatTimeAgo = (dateString: string) => {
    try {
      const now = new Date();
      const date = new Date(dateString);
      const diffMs = now.getTime() - date.getTime();
      
      if (isNaN(diffMs) || diffMs < 0) return 'Just now';
      
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHr = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHr / 24);
      
      if (diffSec < 60) return 'Just now';
      if (diffMin < 60) return `${diffMin}m ago`;
      if (diffHr < 24) return `${diffHr}h ago`;
      return `${diffDay}d ago`;
    } catch (e) {
      return 'Recently';
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#f8fafc] w-full max-w-full overflow-x-hidden md:dark:bg-slate-900 dark:bg-slate-950">
      <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-8 sticky top-0 z-30 w-full">
        <div className="flex items-center gap-4">
          <button 
            onClick={onMenuToggle}
            className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-800"
          >
            <Menu size={20} />
          </button>
          
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em] leading-none">Master Admin</span>
            </div>
            <span className="text-[13px] font-bold text-slate-800 dark:text-slate-100 tracking-tight mt-0.5">{getLabel(activeTab)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* Universal Dark Mode Theme Toggle */}
          <button 
            type="button"
            onClick={() => setDarkMode(!darkMode)}
            className="flex items-center justify-center p-2 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-amber-400 transition-all cursor-pointer shadow-sm active:scale-95"
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {darkMode ? (
              <Sun size={15} className="text-amber-500 fill-amber-500 animate-pulse" />
            ) : (
              <Moon size={15} className="text-indigo-600 fill-indigo-100" />
            )}
          </button>

          {/* System Notifications Bell */}
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="relative flex items-center justify-center p-2 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300 transition-all cursor-pointer shadow-sm active:scale-95"
            title="System Notifications & Alerts"
          >
            <Bell size={15} className={unreadCount > 0 ? "text-indigo-600 dark:text-indigo-400 animate-pulse" : ""} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white font-black text-[8px] flex items-center justify-center rounded-full ring-2 ring-white dark:ring-slate-900 animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>

          <div className="flex items-center gap-1.5 bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-lg border border-slate-200 dark:border-slate-800 shadow-inner">
            {/* Language Selector */}
            <div className="relative">
              <button 
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="flex items-center gap-1.5 px-2 py-1.5 text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md hover:bg-slate-50 dark:hover:bg-slate-850 transition-all shadow-sm"
              >
                {languages.find(l => l.code === activeLang)?.flag} {activeLang}
              </button>
              
              {isLangOpen && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setIsLangOpen(false)} />
                  <div className="absolute top-full end-0 mt-2 w-32 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl z-30 py-1 overflow-hidden">
                    {languages.map((lang) => (
                      <button 
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.code as Language);
                          setIsLangOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-bold transition-colors ${activeLang === lang.code ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-850'}`}
                      >
                        <span>{lang.label}</span>
                        <span className="text-xs">{lang.flag}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <button 
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-black text-rose-600 bg-white dark:bg-slate-900 border border-rose-100 dark:border-rose-950/50 rounded-lg shadow-sm hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:border-rose-200 dark:hover:border-rose-900 transition-all uppercase tracking-widest" 
            onClick={onLogoutRequest}
          >
            <LogOut size={14} className="stroke-[3px]" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      <main className="p-4 sm:p-8 flex-1 overflow-x-hidden dark:bg-slate-950">
        <div className="max-w-7xl mx-auto h-full flex flex-col">
          {children}
        </div>
      </main>

      {/* Slide-over Notifications Drawer Panel */}
      <AnimatePresence>
        {isDrawerOpen && (
          <div className="fixed inset-0 z-[999]" id="notifications-overlay-portal">
            {/* Dark background overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="absolute inset-0 bg-slate-950/55 backdrop-blur-xs cursor-pointer"
            />

            {/* Sliding Container panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="absolute inset-y-0 right-0 w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col h-full focus:outline-none"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl text-indigo-600 dark:text-indigo-400">
                    <Bell size={18} />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">Notifications Library</h3>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                      {unreadCount} unread / {notifications.length} total
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllNotificationsRead(notifications)}
                      className="p-1 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[10px] font-black text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-900 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition-all cursor-pointer uppercase tracking-widest flex items-center gap-1"
                      title="Mark all read"
                    >
                      <Check size={12} className="stroke-[3px]" />
                      <span>All Read</span>
                    </button>
                  )}
                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer border border-slate-200 dark:border-slate-800"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Filtering tabs */}
              <div className="flex px-6 py-3 gap-2 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                <button
                  type="button"
                  onClick={() => setActiveFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                    activeFilter === 'all'
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-100 dark:shadow-none'
                      : 'text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750'
                  }`}
                >
                  All ({notifications.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('unread')}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                    activeFilter === 'unread'
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-100 dark:shadow-none'
                      : 'text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750'
                  }`}
                >
                  Unread ({unreadCount})
                </button>
              </div>

              {/* Scrollable Notifications list */}
              <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-slate-50/40 dark:bg-slate-900/30">
                {filteredNotifications.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200/80 dark:border-slate-800 my-4 shadow-sm">
                    <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 border border-slate-100 dark:border-slate-750">
                      <BellOff size={24} className="text-slate-300 dark:text-slate-600" />
                    </div>
                    <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">Inbox is empty</h4>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 max-w-xs font-medium font-sans">
                      {activeFilter === 'unread' 
                        ? "You have processed all incoming alerts! Zero unread left." 
                        : "There are no notifications in your dashboard archives yet."}
                    </p>
                  </div>
                ) : (
                  filteredNotifications.map((notif) => {
                    const typeTheme = () => {
                      switch (notif.type) {
                        case 'success':
                          return {
                            bg: notif.read 
                              ? 'bg-white dark:bg-slate-900 border-slate-200/60 dark:border-slate-800/80 shadow-xs' 
                              : 'bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-500/20 dark:border-emerald-500/35 shadow-sm shadow-emerald-50/50 dark:shadow-none',
                            iconBg: 'bg-emerald-100/70 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-450',
                            bar: 'bg-emerald-500 dark:bg-emerald-600',
                            timeColor: 'text-emerald-600/70 dark:text-emerald-450/70'
                          };
                        case 'warning':
                          return {
                            bg: notif.read 
                              ? 'bg-white dark:bg-slate-900 border-slate-200/60 dark:border-slate-800/80 shadow-xs' 
                              : 'bg-amber-50/30 dark:bg-amber-950/10 border-amber-500/20 dark:border-amber-500/35 shadow-sm shadow-amber-50/50 dark:shadow-none',
                            iconBg: 'bg-amber-100/70 dark:bg-amber-950/40 text-amber-600 dark:text-amber-450',
                            bar: 'bg-amber-500 dark:bg-amber-600',
                            timeColor: 'text-amber-600/70 dark:text-amber-450/70'
                          };
                        case 'error':
                          return {
                            bg: notif.read 
                              ? 'bg-white dark:bg-slate-900 border-slate-200/60 dark:border-slate-800/85 shadow-xs' 
                              : 'bg-rose-50/30 dark:bg-rose-950/10 border-rose-500/20 dark:border-rose-500/35 shadow-sm shadow-rose-50/50 dark:shadow-none',
                            iconBg: 'bg-rose-100/70 dark:bg-rose-950/40 text-rose-600 dark:text-rose-450',
                            bar: 'bg-rose-500 dark:bg-rose-600',
                            timeColor: 'text-rose-600/70 dark:text-rose-450/70'
                          };
                        default:
                          return {
                            bg: notif.read 
                              ? 'bg-white dark:bg-slate-900 border-slate-200/60 dark:border-slate-800/80 shadow-xs' 
                              : 'bg-indigo-50/35 dark:bg-indigo-950/10 border-indigo-500/20 dark:border-indigo-500/35 shadow-sm shadow-indigo-50/50 dark:shadow-none',
                            iconBg: 'bg-indigo-100/70 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400',
                            bar: 'bg-indigo-500 dark:bg-indigo-600',
                            timeColor: 'text-indigo-600/70 dark:text-indigo-400/70'
                          };
                      }
                    };
                    const theme = typeTheme();

                    return (
                      <motion.div
                        key={notif.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`flex gap-3.5 p-4 rounded-xl border relative transition-all group overflow-hidden ${theme.bg}`}
                      >
                        {/* Indicator Ribbon for Unread status */}
                        {!notif.read && (
                          <div className={`absolute left-0 top-0 bottom-0 w-1 ${theme.bar}`} />
                        )}

                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${theme.iconBg}`}>
                          <Bell size={13} className="stroke-[2.5px]" />
                        </div>

                        <div className="flex-1 min-w-0 pr-6">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className={`text-[11px] font-black uppercase tracking-wide truncate ${notif.read ? 'text-slate-500 dark:text-slate-400' : 'text-slate-800 dark:text-slate-100'}`}>
                              {notif.title}
                            </h4>
                            <span className={`text-[9px] font-bold ${theme.timeColor} whitespace-nowrap`}>
                              {formatTimeAgo(notif.createdAt)}
                            </span>
                          </div>
                          <p className={`text-[11px] leading-relaxed mt-1 break-words font-sans ${notif.read ? 'text-slate-400 dark:text-slate-500' : 'text-slate-600 dark:text-slate-300'}`}>
                            {notif.message}
                          </p>
                        </div>

                        {/* Actions Overlay */}
                        <div className="absolute right-3 top-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity bg-inherit pl-2">
                          {!notif.read && (
                            <button
                              onClick={() => markNotificationRead(notif.id)}
                              className="p-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-100 dark:hover:border-indigo-900 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition-all cursor-pointer"
                              title="Mark as read"
                            >
                              <Check size={12} className="stroke-[2.5px]" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteSystemNotification(notif.id)}
                            className="p-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-450 hover:border-rose-100 dark:hover:border-rose-955 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-all cursor-pointer"
                            title="Delete notification"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>

              {/* Drawer Footer Area */}
              {notifications.length > 0 && (
                <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between shadow-xs">
                  <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    Synchronized across devices
                  </span>
                  <button
                    type="button"
                    onClick={() => clearAllNotifications(notifications)}
                    className="p-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-[9px] font-black text-rose-600 hover:text-white dark:text-rose-450 hover:bg-rose-600 hover:border-rose-500 transition-all cursor-pointer uppercase tracking-widest flex items-center gap-1.5"
                  >
                    <Trash2 size={12} />
                    <span>Clear All</span>
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
