import React, { useState, useMemo } from 'react';
import { 
  Wallet, Search, Copy, Check, Info, FileText, 
  CreditCard, ChevronRight, AlertCircle, Phone, 
  MessageSquare, ExternalLink, ShieldCheck
} from 'lucide-react';

// SVGs for Gateway Logos
const bkashLogo = (
  <div className="w-10 h-10 rounded-xl bg-[#E2136E] flex items-center justify-center text-white font-sans font-black text-xs shadow-sm shrink-0">bK</div>
);
const nagadLogo = (
  <div className="w-10 h-10 rounded-xl bg-[#F15A22] flex items-center justify-center text-white font-sans font-black text-xs shadow-sm shrink-0">N</div>
);
const upayLogo = (
  <div className="w-10 h-10 rounded-xl bg-[#005CA9] flex items-center justify-center text-white font-sans font-black text-xs shadow-sm shrink-0">Up</div>
);
const rocketLogo = (
  <div className="w-10 h-10 rounded-xl bg-[#8C3494] flex items-center justify-center text-white font-sans font-black text-xs shadow-sm shrink-0">R</div>
);
const mcashLogo = (
  <div className="w-10 h-10 rounded-xl bg-[#0F9D58] flex items-center justify-center text-white font-sans font-black text-xs shadow-sm shrink-0">mC</div>
);
const bankLogo = (
  <div className="w-10 h-10 rounded-xl bg-[#1E3A8A] flex items-center justify-center text-white shadow-sm shrink-0">
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M10 14v4M14 14v4" />
    </svg>
  </div>
);
const binanceLogo = (
  <div className="w-10 h-10 rounded-xl bg-[#F0B90B] flex items-center justify-center text-black shadow-sm shrink-0">
    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
      <path d="M12 2L16.5 6.5L19.5 3.5L12 11L4.5 3.5L7.5 6.5L12 2ZM12 22L7.5 17.5L4.5 20.5L12 13L19.5 20.5L16.5 17.5L12 22ZM19.5 12L12 4.5L4.5 12L12 19.5L19.5 12ZM16.5 12L12 8.5L7.5 12L12 15.5L16.5 12Z" />
    </svg>
  </div>
);
const paypalLogo = (
  <div className="w-10 h-10 rounded-xl bg-[#003087] flex items-center justify-center text-white font-sans font-black text-xs shadow-sm shrink-0">PP</div>
);

interface PaymentAccountsProps {
  settings: any;
  onTabChange?: (tab: string) => void;
  onSelectGatewayForForm?: (gateway: string) => void;
}

export function PaymentAccounts({ settings, onTabChange, onSelectGatewayForForm }: PaymentAccountsProps) {
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<'all' | 'mfs' | 'bank' | 'global'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // List of all payment options with details
  const allProviders = useMemo(() => [
    { 
      key: 'bKash', 
      label: 'bKash (বিকাশ)', 
      category: 'mfs', 
      logo: bkashLogo, 
      brandColor: '#E2136E', 
      textAccent: 'text-rose-600', 
      enabled: settings?.bkashEnabled !== false, 
      feePercent: 1.85, 
      notes: 'বিকাশ পার্সোনাল সেন্ড মানি', 
      accNo: settings?.bkashNumber || '01718070273', 
      personal: true 
    },
    { 
      key: 'Nagad', 
      label: 'Nagad (নগদ)', 
      category: 'mfs', 
      logo: nagadLogo, 
      brandColor: '#F15A22', 
      textAccent: 'text-orange-600', 
      enabled: settings?.nagadEnabled !== false, 
      feePercent: 1.50, 
      notes: 'নগদ পার্সোনাল সেন্ড মানি', 
      accNo: settings?.nagadNumber || '01718070273', 
      personal: true 
    },
    { 
      key: 'Upay', 
      label: 'Upay (ইউপে)', 
      category: 'mfs', 
      logo: upayLogo, 
      brandColor: '#005CA9', 
      textAccent: 'text-blue-600', 
      enabled: settings?.upayEnabled !== false, 
      feePercent: 1.40, 
      notes: 'ইউপে পার্সোনাল সেন্ড মানি', 
      accNo: settings?.upayNumber || '01718070273', 
      personal: true 
    },
    { 
      key: 'Rocket', 
      label: 'Rocket (রকেট)', 
      category: 'mfs', 
      logo: rocketLogo, 
      brandColor: '#8C3494', 
      textAccent: 'text-purple-600', 
      enabled: settings?.rocketEnabled !== false, 
      feePercent: 1.80, 
      notes: 'রকেট পার্সোনাল সেন্ড মানি', 
      accNo: settings?.rocketNumber || '017180702738', 
      personal: true 
    },
    { 
      key: 'Mcash', 
      label: 'Mcash (এমক্যাশ)', 
      category: 'mfs', 
      logo: mcashLogo, 
      brandColor: '#0F9D58', 
      textAccent: 'text-emerald-600', 
      enabled: settings?.mcashEnabled !== false, 
      feePercent: 1.50, 
      notes: 'এমক্যাশ পার্সোনাল সেন্ড মানি', 
      accNo: settings?.mcashNumber || '01718070273', 
      personal: true 
    },
    { 
      key: 'Bank', 
      label: 'Bank Transfer (ব্যাংক)', 
      category: 'bank', 
      logo: bankLogo, 
      brandColor: '#1E3A8A', 
      textAccent: 'text-indigo-600', 
      enabled: settings?.bankEnabled !== false, 
      feePercent: 0.00, 
      notes: 'ব্যাংক একাউন্ট ডিপোজিট', 
      accNo: settings?.accountNo || '15012019487120398', 
      personal: false, 
      bankName: settings?.bankName || 'Dutch Bangla Bank', 
      accountName: settings?.accountName || 'Master Tech Limited', 
      branch: settings?.branchName || 'Dhaka Main Branch' 
    },
    { 
      key: 'Binance', 
      label: 'Binance (ক্রিপ্টো)', 
      category: 'crypto', 
      logo: binanceLogo, 
      brandColor: '#F0B90B', 
      textAccent: 'text-yellow-600', 
      enabled: settings?.binanceEnabled !== false, 
      feePercent: 0.00, 
      notes: 'Binance Pay / USDT-TRC20', 
      accNo: settings?.binancePayId || '542901726', 
      personal: false, 
      usdtAddress: settings?.binanceUsdtAddress || 'TYm7A8WqyY4fFsh9SgH8eD2c1T9Z9sK8nQ' 
    },
    { 
      key: 'PayPal', 
      label: 'PayPal (ডলার)', 
      category: 'crypto', 
      logo: paypalLogo, 
      brandColor: '#003087', 
      textAccent: 'text-blue-800', 
      enabled: settings?.paypalEnabled !== false, 
      feePercent: 0.00, 
      notes: 'PayPal Int. Payment/Gift', 
      accNo: settings?.paypalEmail || 'masterbuild14@gmail.com', 
      personal: false 
    },
  ], [settings]);

  // Handle Copy
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Filter accounts
  const filteredProviders = useMemo(() => {
    return allProviders.filter(p => {
      if (!p.enabled) return false;
      
      // Category filter
      if (selectedCategoryTab === 'mfs' && p.category !== 'mfs') return false;
      if (selectedCategoryTab === 'bank' && p.category !== 'bank') return false;
      if (selectedCategoryTab === 'global' && p.category !== 'crypto') return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return p.label.toLowerCase().includes(q) || p.notes.toLowerCase().includes(q) || p.key.toLowerCase().includes(q) || p.accNo.includes(q);
      }
      return true;
    });
  }, [allProviders, selectedCategoryTab, searchQuery]);

  // Route directly to payment form with gateway selected
  const handleInitiatePayment = (gatewayKey: string) => {
    if (onSelectGatewayForForm) {
      onSelectGatewayForForm(gatewayKey);
    }
    if (onTabChange) {
      onTabChange('client_payment');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-left Bengali-Heading max-w-5xl mx-auto">
      
      {/* Banner Card */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-md border border-indigo-800/20">
        <div className="absolute right-0 bottom-0 opacity-15 translate-x-10 translate-y-10 scale-150 text-indigo-400">
          <Wallet size={220} className="stroke-[1]" />
        </div>
        <div className="relative z-10 space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 text-[10px] font-black tracking-widest uppercase border border-indigo-500/20">
            <ShieldCheck size={12} /> Official Payment Hub
          </span>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">কোম্পানি পেমেন্ট অ্যাকাউন্টসমূহ (Official Accounts)</h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed font-sans font-medium">
            নিচে আমাদের কোম্পানির সকল ভেরিফাইড পেমেন্ট চ্যানেল ও হিসাবের তালিকা দেওয়া হলো। আপনার সুবিধামত মাধ্যমে পেমেন্ট সম্পন্ন করে হিসাব নম্বর কপি করুন এবং <span className="text-indigo-300 font-bold">পেমেন্ট নোটিফিকেশন ফর্ম</span> সাবমিট করুন।
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={() => onTabChange && onTabChange('client_payment')}
              className="px-5 py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm hover:shadow-md cursor-pointer active:scale-95 flex items-center gap-2"
            >
              <CreditCard size={14} />
              পেমেন্ট ফর্ম খুলুন (Open Form)
            </button>
          </div>
        </div>
      </div>

      {/* Categories Horizontal Selector & Search Row */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white p-4 border border-slate-200 rounded-2xl shadow-3xs">
        <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
          {[
            { key: 'all', label: 'সব অ্যাকাউন্ট', count: allProviders.filter(p => p.enabled).length },
            { key: 'mfs', label: 'মোবাইল ওয়ালেট (MFS)', count: allProviders.filter(p => p.enabled && p.category === 'mfs').length },
            { key: 'bank', label: 'ব্যাংক হিসাব', count: allProviders.filter(p => p.enabled && p.category === 'bank').length },
            { key: 'global', label: 'ক্রিপ্টো ও গ্লোবাল', count: allProviders.filter(p => p.enabled && p.category === 'crypto').length }
          ].map(cat => {
            const isSelected = selectedCategoryTab === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setSelectedCategoryTab(cat.key as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all duration-200 flex items-center gap-2 ${
                  isSelected 
                    ? 'bg-indigo-600 text-white shadow-2xs' 
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-100'
                }`}
              >
                <span>{cat.label}</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold ${
                  isSelected ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-200 text-slate-500'
                }`}>
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input Bar */}
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="অ্যাকাউন্ট সার্চ করুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-8 py-2.5 text-xs font-semibold text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-3xs"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5">
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          )}
        </div>
      </div>

      {/* Grid of Accounts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredProviders.map(prov => {
          return (
            <div 
              key={prov.key}
              className="bg-white border border-slate-200 rounded-[1.75rem] shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-200 overflow-hidden flex flex-col justify-between"
            >
              {/* Account Card Header */}
              <div className="p-5 flex items-start gap-4 border-b border-slate-100 bg-slate-50/50">
                <div className="shrink-0 scale-105">
                  {prov.logo}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-slate-800 text-sm tracking-tight truncate">{prov.label}</h3>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 text-[8.5px] font-black uppercase tracking-wider border border-emerald-100/40">
                      Active
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mt-0.5 font-sans">
                    {prov.notes} {prov.feePercent > 0 ? `(ফি: ${prov.feePercent}%)` : '(ফি নেই / Free)'}
                  </p>
                </div>
              </div>

              {/* Account Details Box */}
              <div className="p-5 flex-1 space-y-4">
                {prov.category === 'mfs' && (
                  <div className="space-y-3">
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 space-y-1">
                      <span className="text-[8.5px] text-slate-400 font-black uppercase tracking-wider block font-mono">
                        MFS Account Mobile Number
                      </span>
                      <div className="flex items-center justify-between gap-3 mt-1">
                        <span className="text-xl font-mono font-black text-slate-800 tracking-wider select-all">{prov.accNo}</span>
                        <button
                          onClick={() => handleCopy(prov.accNo)}
                          className="flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold text-[10px] px-2.5 py-1.5 rounded-lg border border-indigo-100 transition-all cursor-pointer"
                        >
                          {copiedText === prov.accNo ? (
                            <><Check size={12} className="text-emerald-500" /> Copied</>
                          ) : (
                            <><Copy size={12} /> Copy</>
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="inline-block bg-indigo-50 text-indigo-600 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider font-mono">
                        Personal (পার্সোনাল)
                      </span>
                      <span className="inline-block bg-rose-50 text-rose-600 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider font-mono">
                        Send Money (সেন্ড মানি)
                      </span>
                    </div>
                  </div>
                )}

                {prov.key === 'Bank' && (
                  <div className="space-y-3 font-sans">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <span className="text-[8.5px] text-slate-400 block font-bold uppercase font-mono">Bank Name</span>
                        <span className="font-extrabold text-slate-800 block text-xs mt-0.5">{prov.bankName}</span>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <span className="text-[8.5px] text-slate-400 block font-bold uppercase font-mono">Account Name</span>
                        <span className="font-extrabold text-slate-800 block text-xs mt-0.5">{prov.accountName}</span>
                      </div>
                    </div>
                    <div className="bg-indigo-50/20 border border-indigo-100/50 p-3 rounded-xl flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <span className="text-[8.5px] text-indigo-600 block font-black uppercase font-mono">Account Number</span>
                        <span className="font-mono font-black text-slate-800 select-all tracking-wider text-base block truncate">{prov.accNo}</span>
                      </div>
                      <button
                        onClick={() => handleCopy(prov.accNo)}
                        className="flex items-center gap-1.5 bg-white border border-indigo-200 hover:bg-slate-50 text-indigo-600 font-bold text-[10px] px-3 py-1.5 rounded-lg transition-all shadow-3xs cursor-pointer shrink-0"
                      >
                        {copiedText === prov.accNo ? <><Check size={11} className="text-emerald-500" /> Copied</> : <><Copy size={11} /> Copy</>}
                      </button>
                    </div>
                    <div className="text-[10px] text-slate-500 font-bold">
                      <strong>Branch:</strong> {prov.branch}
                    </div>
                  </div>
                )}

                {prov.key === 'Binance' && (
                  <div className="space-y-3 font-mono">
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center justify-between gap-4">
                      <div>
                        <span className="text-[8.5px] text-slate-400 block font-bold uppercase">Binance Pay ID</span>
                        <span className="text-sm font-black text-slate-800 select-all block mt-0.5">{prov.accNo}</span>
                      </div>
                      <button
                        onClick={() => handleCopy(prov.accNo)}
                        className="flex items-center gap-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-[9px] px-2.5 py-1.5 rounded-lg transition-all"
                      >
                        {copiedText === prov.accNo ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <div className="bg-indigo-50/15 border border-indigo-100/50 rounded-xl p-3">
                      <span className="text-[8.5px] text-indigo-600 block font-black uppercase mb-1">USDT Address (TRC-20)</span>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-[9.5px] font-bold text-slate-700 select-all break-all block">{prov.usdtAddress}</span>
                        <button
                          onClick={() => handleCopy(prov.usdtAddress || '')}
                          className="flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold text-[9px] px-2.5 py-1.5 rounded-lg shrink-0 transition-all border border-indigo-100"
                        >
                          {copiedText === prov.usdtAddress ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {prov.key === 'PayPal' && (
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 flex items-center justify-between gap-4 font-mono">
                    <div className="min-w-0">
                      <span className="text-[8.5px] text-slate-400 block font-bold uppercase">PayPal Email Address</span>
                      <span className="text-xs font-black text-slate-800 select-all break-all block mt-0.5 truncate">{prov.accNo}</span>
                    </div>
                    <button
                      onClick={() => handleCopy(prov.accNo)}
                      className="flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-[10px] px-3.5 py-1.5 rounded-lg transition-all cursor-pointer shrink-0"
                    >
                      {copiedText === prov.accNo ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                )}
              </div>

              {/* Bottom Call-To-Action to report payment directly */}
              <div className="px-5 pb-5 pt-1">
                <button
                  onClick={() => handleInitiatePayment(prov.key)}
                  className="w-full py-2.5 bg-indigo-50/50 hover:bg-indigo-600 text-indigo-600 hover:text-white border border-indigo-100 hover:border-indigo-600 rounded-xl text-xs font-black transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  পেমেন্ট সাবমিট করুন (Send Notification)
                  <ChevronRight size={14} />
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {filteredProviders.length === 0 && (
        <div className="py-16 border-2 border-dashed border-slate-200 rounded-[2rem] text-center bg-slate-50/50 max-w-lg mx-auto">
          <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-3 animate-bounce" />
          <p className="text-sm font-black text-slate-600">কোন পেমেন্ট অ্যাকাউন্ট খুঁজে পাওয়া যায়নি</p>
          <p className="text-xs text-slate-400 mt-1">অনুগ্রহ করে আপনার সার্চ ফিল্টার পরিবর্তন করে পুনরায় চেষ্টা করুন।</p>
        </div>
      )}

      {/* Security note box */}
      <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl flex gap-4 text-xs font-sans">
        <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
        <div className="space-y-1 text-slate-650 leading-relaxed">
          <strong>নিরাপত্তা সতর্কি (Security Information):</strong>
          <p>
            উপরে উল্লেখিত সকল নাম্বার বা অ্যাকাউন্ট আমাদের কোম্পানির একমাত্র অফিশিয়াল ও লাইভ পেমেন্ট চ্যানেল। অন্য কোনো নাম্বারে লেনদেন করে প্রতারিত হবেন না। যেকোনো পেমেন্ট বা ট্রান্সফার সংক্রান্ত জটিলতায় সরাসরি আমাদের সাপোর্ট সেন্টারে যোগাযোগ করুন।
          </p>
        </div>
      </div>

    </div>
  );
}
