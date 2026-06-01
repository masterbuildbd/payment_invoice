import React from 'react';
import { Menu, LogOut, Info, Sun, Moon } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useLanguage, Language } from '../lib/language';
import firebaseConfig from '../../firebase-applet-config.json';

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

  const [darkMode, setDarkMode] = React.useState(() => {
    return localStorage.getItem('dark_mode_theme') === 'dark';
  });

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
    const clientsLabels: Record<string, string> = {
      'dashboard': 'সারাংশ (Dashboard Overview)',
      'client_invoices': 'ইনভয়েস শো (Invoices Show)',
      'client_account': 'অ্যাকাউন্ট অপশন (Payment Accounts)',
      'client_payment': 'পেমেন্ট অপশন (Payment Form)',
      'client_settings': 'সেটিংস অপশন (User Settings)'
    };
    return clientsLabels[tab] || t(tab) || tab;
  };

  const languages = [
    { code: 'EN', label: 'English', flag: '🇺🇸' },
    { code: 'BN', label: 'Bangla', flag: '🇧🇩' },
    { code: 'UR', label: 'Urdu', flag: '🇵🇰' },
    { code: 'HI', label: 'Hindi', flag: '🇮🇳' },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#f8fafc] w-full max-w-full overflow-x-hidden">
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 sticky top-0 z-10 w-full">
        <div className="flex items-center gap-4">
          <button 
            onClick={onMenuToggle}
            className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
          >
            <Menu size={20} />
          </button>
          
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black text-indigo-600 uppercase tracking-[0.2em] leading-none">Master Admin</span>
              {!firebaseConfig.projectId || firebaseConfig.projectId.includes('remixed') ? (
                <span className="bg-amber-100 text-amber-700 font-mono text-[8px] font-bold px-1.5 py-0.5 rounded-sm uppercase scale-90 origin-left">Mock Local DB</span>
              ) : (
                <span className="bg-emerald-100 text-emerald-700 font-mono text-[8px] font-black px-1.5 py-0.5 rounded-sm uppercase scale-90 origin-left flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse inline-block"></span>
                  Cloud Live Sync
                </span>
              )}
            </div>
            <span className="text-[13px] font-bold text-slate-800 tracking-tight mt-0.5">{getLabel(activeTab)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* Universal Dark Mode Theme Toggle */}
          <button 
            type="button"
            onClick={() => setDarkMode(!darkMode)}
            className="flex items-center justify-center p-2 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 border border-slate-200 text-slate-500 dark:text-amber-400 transition-all cursor-pointer shadow-sm active:scale-95"
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {darkMode ? (
              <Sun size={15} className="text-amber-500 fill-amber-500 animate-pulse" />
            ) : (
              <Moon size={15} className="text-indigo-600 fill-indigo-100" />
            )}
          </button>

          <div className="flex items-center gap-1.5 bg-slate-100/50 p-1 rounded-lg border border-slate-200 shadow-inner">
            {/* Language Selector */}
            <div className="relative">
              <button 
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="flex items-center gap-1.5 px-2 py-1.5 text-[10px] font-bold text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-all shadow-sm"
              >
                {languages.find(l => l.code === activeLang)?.flag} {activeLang}
              </button>
              
              {isLangOpen && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setIsLangOpen(false)} />
                  <div className="absolute top-full end-0 mt-2 w-32 bg-white border border-slate-200 rounded-lg shadow-xl z-30 py-1 overflow-hidden">
                    {languages.map((lang) => (
                      <button 
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.code as Language);
                          setIsLangOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-bold transition-colors ${activeLang === lang.code ? 'text-indigo-600 bg-indigo-50' : 'text-slate-500 hover:bg-slate-50'}`}
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
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-black text-rose-600 bg-white border border-rose-100 rounded-lg shadow-sm hover:bg-rose-50 hover:border-rose-200 transition-all uppercase tracking-widest" 
            onClick={onLogoutRequest}
          >
            <LogOut size={14} className="stroke-[3px]" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      <main className="p-4 sm:p-8 flex-1 overflow-x-hidden">
        <div className="max-w-7xl mx-auto h-full flex flex-col">
          {children}
        </div>
      </main>
    </div>
  );
}
