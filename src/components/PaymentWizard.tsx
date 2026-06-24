import React, { useState, useEffect, useMemo } from 'react';
import { 
  Wallet, Search, X, ChevronRight, ArrowLeft, HelpCircle, 
  Copy, Check, CheckCircle2, Lock, FileText, Clock, 
  CreditCard, ChevronDown, ChevronUp, AlertCircle, RefreshCw, 
  Phone, Server, Key, Megaphone, CheckCircle, HelpCircle as SupportIcon,
  MessageSquare, BookOpen, FileQuestion
} from 'lucide-react';

// SVGs for Gateway Logos
const bkashLogo = (
  <div className="w-9 h-9 rounded-xl bg-[#E2136E] flex items-center justify-center text-white font-sans font-black text-xs shadow-sm">bK</div>
);
const nagadLogo = (
  <div className="w-9 h-9 rounded-xl bg-[#F15A22] flex items-center justify-center text-white font-sans font-black text-xs shadow-sm">N</div>
);
const upayLogo = (
  <div className="w-9 h-9 rounded-xl bg-[#005CA9] flex items-center justify-center text-white font-sans font-black text-xs shadow-sm">Up</div>
);
const rocketLogo = (
  <div className="w-9 h-9 rounded-xl bg-[#8C3494] flex items-center justify-center text-white font-sans font-black text-xs shadow-sm">R</div>
);
const mcashLogo = (
  <div className="w-9 h-9 rounded-xl bg-[#0F9D58] flex items-center justify-center text-white font-sans font-black text-xs shadow-sm">mC</div>
);
const bankLogo = (
  <div className="w-9 h-9 rounded-xl bg-[#1E3A8A] flex items-center justify-center text-white shadow-sm">
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M10 14v4M14 14v4" />
    </svg>
  </div>
);
const binanceLogo = (
  <div className="w-9 h-9 rounded-xl bg-[#F0B90B] flex items-center justify-center text-black shadow-sm">
    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
      <path d="M12 2L16.5 6.5L19.5 3.5L12 11L4.5 3.5L7.5 6.5L12 2ZM12 22L7.5 17.5L4.5 20.5L12 13L19.5 20.5L16.5 17.5L12 22ZM19.5 12L12 4.5L4.5 12L12 19.5L19.5 12ZM16.5 12L12 8.5L7.5 12L12 15.5L16.5 12Z" />
    </svg>
  </div>
);
const paypalLogo = (
  <div className="w-9 h-9 rounded-xl bg-[#003087] flex items-center justify-center text-white font-sans font-black text-xs shadow-sm">PP</div>
);

interface PaymentWizardProps {
  settings: any;
  activeSubTab: string;
  onTabChange?: (tab: string) => void;
  currentUserData: any;
  user: any;
  clientInvoiceNumber: string;
  clientInvoiceDate: string;
  clientInvoiceTime: string;
  generateNewInvoiceMeta: () => void;
  createInvoice: (inv: any) => Promise<any>;
  setMyInvoices: React.Dispatch<React.SetStateAction<any[]>>;
  myRejectedInvoices: any[];
  setMyRejectedInvoices: React.Dispatch<React.SetStateAction<any[]>>;
  resubmittingInvoiceId: string | null;
  setResubmittingInvoiceId: (id: string | null) => void;
}

export function PaymentWizard({
  settings,
  activeSubTab,
  onTabChange,
  currentUserData,
  user,
  clientInvoiceNumber,
  clientInvoiceDate,
  clientInvoiceTime,
  generateNewInvoiceMeta,
  createInvoice,
  setMyInvoices,
  myRejectedInvoices,
  setMyRejectedInvoices,
  resubmittingInvoiceId,
  setResubmittingInvoiceId
}: PaymentWizardProps) {
  
  // Base provider structures
  const allProviders = useMemo(() => [
    { key: 'bKash', label: 'bKash (বিকাশ)', category: 'mfs', logo: bkashLogo, brandColor: '#E2136E', textAccent: 'text-rose-600', enabled: settings?.bkashEnabled !== false, feePercent: 1.85, notes: 'বিকাশ পার্সোনাল সেন্ড মানি', accNo: settings?.bkashNumber || '01718070273', personal: true },
    { key: 'Nagad', label: 'Nagad (নগদ)', category: 'mfs', logo: nagadLogo, brandColor: '#F15A22', textAccent: 'text-orange-600', enabled: settings?.nagadEnabled !== false, feePercent: 1.50, notes: 'নগদ পার্সোনাল সেন্ড মানি', accNo: settings?.nagadNumber || '01718070273', personal: true },
    { key: 'Upay', label: 'Upay (ইউপে)', category: 'mfs', logo: upayLogo, brandColor: '#005CA9', textAccent: 'text-blue-600', enabled: settings?.upayEnabled !== false, feePercent: 1.40, notes: 'ইউপে পার্সোনাল সেন্ড মানি', accNo: settings?.upayNumber || '01718070273', personal: true },
    { key: 'Rocket', label: 'Rocket (রকেট)', category: 'mfs', logo: rocketLogo, brandColor: '#8C3494', textAccent: 'text-purple-600', enabled: settings?.rocketEnabled !== false, feePercent: 1.80, notes: 'রকেট পার্সোনাল সেন্ড মানি', accNo: settings?.rocketNumber || '017180702738', personal: true },
    { key: 'Mcash', label: 'Mcash (এমক্যাশ)', category: 'mfs', logo: mcashLogo, brandColor: '#0F9D58', textAccent: 'text-emerald-600', enabled: settings?.mcashEnabled !== false, feePercent: 1.50, notes: 'এমক্যাশ পার্সোনাল সেন্ড মানি', accNo: settings?.mcashNumber || '01718070273', personal: true },
    { key: 'Bank', label: 'Bank Transfer (ব্যাংক)', category: 'bank', logo: bankLogo, brandColor: '#1E3A8A', textAccent: 'text-indigo-600', enabled: settings?.bankEnabled !== false, feePercent: 0.00, notes: 'ব্যাংক একাউন্ট পেমেন্ট ট্রান্সফার', accNo: settings?.accountNo || '15012019487120398', personal: false, bankName: settings?.bankName || 'Dutch Bangla Bank', accountName: settings?.accountName || 'Master Tech Limited', branch: settings?.branchName || 'Dhaka Main Branch' },
    { key: 'Binance', label: 'Binance (ইউএসডিটি)', category: 'crypto', logo: binanceLogo, brandColor: '#F0B90B', textAccent: 'text-yellow-600', enabled: settings?.binanceEnabled !== false, feePercent: 0.00, notes: 'Binance Pay / USDT-TRC20', accNo: settings?.binancePayId || '542901726', personal: false, usdtAddress: settings?.binanceUsdtAddress || 'TYm7A8WqyY4fFsh9SgH8eD2c1T9Z9sK8nQ' },
    { key: 'PayPal', label: 'PayPal (ডলার)', category: 'crypto', logo: paypalLogo, brandColor: '#003087', textAccent: 'text-blue-800', enabled: settings?.paypalEnabled !== false, feePercent: 0.00, notes: 'PayPal Int. Payment/Gift', accNo: settings?.paypalEmail || 'masterbuild14@gmail.com', personal: false },
  ], [settings]);

  // States
  const [paymentStep, setPaymentStep] = useState<number>(1);
  const [selectedGateway, setSelectedGateway] = useState<string>('bKash');
  const [amountInput, setAmountInput] = useState<string>('1000');
  const [txnIdInput, setTxnIdInput] = useState<string>('');
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<'all' | 'mfs' | 'bank' | 'global'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  
  // Core Invoice/Ticket form values (preserved for database sync)
  const [topUpPurpose, setTopUpPurpose] = useState<string>('Wallet Top-Up');
  const [ticketAppName, setTicketAppName] = useState('');
  const [ticketAppPackageName, setTicketAppPackageName] = useState('dev.masterbuild.');
  const [ticketAppProtocol, setTicketAppProtocol] = useState('');
  const [ticketAppQuality, setTicketAppQuality] = useState('');
  const [ticketAppType, setTicketAppType] = useState('');
  const [ticketAppWorkType, setTicketAppWorkType] = useState('');

  const [ticketPanelName, setTicketPanelName] = useState('');
  const [ticketPanelUrl, setTicketPanelUrl] = useState('');
  const [ticketPanelDuration, setTicketPanelDuration] = useState('');
  const [ticketPanelType, setTicketPanelType] = useState('');

  const [ticketDecoderUsername, setTicketDecoderUsername] = useState('');
  const [ticketDecoderUserType, setTicketDecoderUserType] = useState('');
  const [ticketDecoderDuration, setTicketDecoderDuration] = useState('');
  const [ticketServiceDetails, setTicketServiceDetails] = useState('');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string>('');
  const [lastSubmittedInvoice, setLastSubmittedInvoice] = useState<any>(null);

  // Sync subtab to correct step
  useEffect(() => {
    if (activeSubTab === 'payment') {
      setPaymentStep(2);
    } else if (activeSubTab === 'account') {
      setPaymentStep(1);
    }
  }, [activeSubTab]);

  // Fetch current provider details
  const activeProvider = useMemo(() => {
    return allProviders.find(p => p.key === selectedGateway) || allProviders[0];
  }, [allProviders, selectedGateway]);

  const parsedAmount = parseFloat(amountInput) || 1000;
  const computedCharge = (parsedAmount * activeProvider.feePercent) / 100;
  const computedTotal = parsedAmount + computedCharge;

  // Handle Copy
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // List of active providers based on filters
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
        return p.label.toLowerCase().includes(q) || p.notes.toLowerCase().includes(q) || p.key.toLowerCase().includes(q);
      }
      return true;
    });
  }, [allProviders, selectedCategoryTab, searchQuery]);

  // Validation
  const isFormValid = useMemo(() => {
    if (!txnIdInput.trim()) return false;
    if (parsedAmount <= 0) return false;

    if (topUpPurpose === 'Android App Purchase') {
      if (!ticketAppName.trim() || !ticketAppPackageName.trim() || !ticketAppProtocol || !ticketAppQuality || !ticketAppType || !ticketAppWorkType) {
        return false;
      }
    } else if (topUpPurpose === 'Reseller Panel Purchase') {
      if (!ticketPanelName || !ticketPanelUrl.trim() || !ticketPanelDuration || !ticketPanelType) {
        return false;
      }
    } else if (topUpPurpose === 'Decoder License Purchase') {
      if (!ticketDecoderUsername.trim() || !ticketDecoderUserType || !ticketDecoderDuration) {
        return false;
      }
    } else if (['Binance $ Purchase', 'Redotpay $ Purchase', 'Facebook Boost', 'Banner Making', 'Logo Making', 'Others / Etc'].includes(topUpPurpose)) {
      if (!ticketServiceDetails.trim()) {
        return false;
      }
    }
    return true;
  }, [txnIdInput, parsedAmount, topUpPurpose, ticketAppName, ticketAppPackageName, ticketAppProtocol, ticketAppQuality, ticketAppType, ticketAppWorkType, ticketPanelName, ticketPanelUrl, ticketPanelDuration, ticketPanelType, ticketDecoderUsername, ticketDecoderUserType, ticketDecoderDuration, ticketServiceDetails]);

  // Submit Handler
  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
      setSubmitError('অনুগ্রহ করে ট্রানজেকশন ID এবং অন্যান্য প্রয়োজনীয় তথ্য সঠিকভাবে পূরণ করুন।');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const now = new Date();
      const finalInvoiceNum = resubmittingInvoiceId || clientInvoiceNumber || `INV-${Math.floor(100000 + Math.random() * 900000)}`;
      const backupTimeStr = now.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const backupInvoiceDate = now.toISOString().split('T')[0];
      const finalDate = clientInvoiceDate || backupInvoiceDate;
      const finalTimeStr = clientInvoiceTime || backupTimeStr;
      const fullDate = `${finalDate} ${finalTimeStr}`;

      // Build extraNote suffix for rich metadata
      let extraNoteSuffix = '';
      let generatedItems: { description: string; quantity: number; price: number }[] = [];

      if (topUpPurpose === 'Android App Purchase') {
        extraNoteSuffix = `\n[App Name: ${ticketAppName}, Package: ${ticketAppPackageName}, Protocol: ${ticketAppProtocol}, Quality: ${ticketAppQuality}, Type: ${ticketAppType}, Work: ${ticketAppWorkType}]`;
        generatedItems = [
          { description: `APP: ${ticketAppName.toUpperCase()}`, quantity: 1, price: parsedAmount },
          { description: `PACKAGE: ${ticketAppPackageName || 'N/A'}`, quantity: 1, price: 0 },
          { description: `WORK: ${ticketAppWorkType || 'N/A'}`, quantity: 1, price: 0 }
        ].filter(item => !item.description.includes('N/A'));
      } else if (topUpPurpose === 'Reseller Panel Purchase') {
        extraNoteSuffix = `\n[Panel Name: ${ticketPanelName}, URL: ${ticketPanelUrl}, Duration: ${ticketPanelDuration}, Type: ${ticketPanelType}]`;
        generatedItems = [
          { description: `PANEL: ${ticketPanelName.toUpperCase()}`, quantity: 1, price: parsedAmount },
          { description: `URL: ${ticketPanelUrl || 'N/A'}`, quantity: 1, price: 0 }
        ].filter(item => !item.description.includes('N/A'));
      } else if (topUpPurpose === 'Decoder License Purchase') {
        extraNoteSuffix = `\n[Decoder User: ${ticketDecoderUsername}, Type: ${ticketDecoderUserType}, Duration: ${ticketDecoderDuration}]`;
        generatedItems = [
          { description: `DECODER USER: ${ticketDecoderUsername.toUpperCase()}`, quantity: 1, price: parsedAmount },
          { description: `DURATION: ${ticketDecoderDuration || 'N/A'}`, quantity: 1, price: 0 }
        ].filter(item => !item.description.includes('N/A'));
      } else if (['Binance $ Purchase', 'Redotpay $ Purchase', 'Facebook Boost', 'Banner Making', 'Logo Making', 'Others / Etc'].includes(topUpPurpose)) {
        extraNoteSuffix = `\n[Service Details: ${ticketServiceDetails}]`;
        generatedItems = [
          { description: `${topUpPurpose.toUpperCase()}`, quantity: 1, price: parsedAmount },
          { description: `DETAILS: ${ticketServiceDetails || 'N/A'}`, quantity: 1, price: 0 }
        ];
      } else {
        generatedItems = [
          { description: `WALLET RECHARGE: ${topUpPurpose}`, quantity: 1, price: parsedAmount }
        ];
      }

      const invoiceData = {
        id: finalInvoiceNum,
        customerName: currentUserData?.name || user?.name || 'Customer',
        username: currentUserData?.username || user?.username,
        amount: parsedAmount,
        paidAmount: parsedAmount,
        dueAmount: 0,
        status: 'pending',
        date: finalDate,
        createdAt: fullDate,
        phone: currentUserData?.phone || '',
        customerNumber: currentUserData?.phone ? `+88 ${currentUserData.phone}` : 'N/A',
        method: selectedGateway,
        paymentMethod: selectedGateway,
        transactionId: txnIdInput,
        note: `পেমেন্ট উদ্দেশ্য: ${topUpPurpose}. কাস্টমার ওয়ালেট টপ-আপ রিকোয়েস্ট ভেরিফিকেশন${extraNoteSuffix}`,
        type: topUpPurpose,
        items: generatedItems,
        appName: ticketAppName || undefined,
        packageName: ticketAppPackageName || undefined,
        protocol: ticketAppProtocol || undefined,
        appsQuality: ticketAppQuality || undefined,
        appsTrying: ticketAppType || undefined,
        appWorkType: ticketAppWorkType || undefined,
        panelName: ticketPanelName || undefined,
        panelUrl: ticketPanelUrl || undefined,
        panelDuration: ticketPanelDuration || undefined,
        panelType: ticketPanelType || undefined,
        decoderUsername: ticketDecoderUsername || undefined,
        decoderUserType: ticketDecoderUserType || undefined,
        decoderDuration: ticketDecoderDuration || undefined,
        serviceDetails: ticketServiceDetails || undefined
      };

      if (resubmittingInvoiceId) {
        await createInvoice(invoiceData); // overwrite/recreate as pending
        setMyRejectedInvoices(prev => prev.filter(i => i.id !== resubmittingInvoiceId));
        setResubmittingInvoiceId(null);
      } else {
        await createInvoice(invoiceData);
      }

      // Pre-populate actual submitted list local state
      setMyInvoices(prev => [invoiceData as any, ...prev]);

      // Save success summary details
      setLastSubmittedInvoice({
        invoiceNumber: finalInvoiceNum,
        amount: parsedAmount,
        feePercent: activeProvider.feePercent,
        chargeAmount: computedCharge,
        totalAmount: computedTotal,
        method: selectedGateway,
        transactionId: txnIdInput,
        date: `${finalDate} ${finalTimeStr}`,
        purpose: topUpPurpose,
      });

      // Go to success screen!
      setPaymentStep(3);

      // Clean up form values
      setTxnIdInput('');
      generateNewInvoiceMeta();
    } catch (err) {
      console.error(err);
      setSubmitError('সার্ভারে রিকোয়েস্ট পাঠাতে সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto Bengali-Heading">
      
      {/* ==================== STEP 1: ALL PAYMENTS GRID ==================== */}
      {paymentStep === 1 && (
        <div className="bg-white border border-slate-200 rounded-[2rem] p-5 sm:p-7 shadow-xs animate-fade-in space-y-6 text-left">
          
          {/* Header Banner */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-650 via-indigo-600 to-indigo-700 p-5 sm:p-6 text-white shadow-sm">
            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-xl" />
            <div className="relative z-10 space-y-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-[9px] font-black tracking-widest uppercase">
                Company Wallet Portal
              </span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-1">সব পেমেন্ট গেটওয়ে / All Payment</h2>
              <p className="text-xs text-indigo-100 max-w-md mt-0.5 leading-relaxed">
                সব ধরনের পেমেন্ট গেটওয়ে এখানে ব্যবস্থাপনা করুন। নিচে তালিকা থেকে আপনার পছন্দের পেমেন্ট মাধ্যম নির্বাচন করুন।
              </p>
            </div>
          </div>

          {/* Selector Categories Horizontal Row */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-slate-50 p-3.5 border border-slate-200/60 rounded-2xl">
            <div className="flex flex-wrap gap-1.5">
              {[
                { key: 'all', label: 'সব গেটওয়ে', count: allProviders.filter(p => p.enabled).length },
                { key: 'mfs', label: 'মোবাইল ওয়ালেট', count: allProviders.filter(p => p.enabled && p.category === 'mfs').length },
                { key: 'bank', label: 'ব্যাংক ট্রান্সফার', count: allProviders.filter(p => p.enabled && p.category === 'bank').length },
                { key: 'global', label: 'গ্লোবাল পেমেন্ট', count: allProviders.filter(p => p.enabled && p.category === 'crypto').length }
              ].map(cat => {
                const isSelected = selectedCategoryTab === cat.key;
                return (
                  <button
                    key={cat.key}
                    onClick={() => setSelectedCategoryTab(cat.key as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all duration-200 flex items-center gap-1.5 ${
                      isSelected 
                        ? 'bg-indigo-600 text-white shadow-2xs' 
                        : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/80 shadow-3xs'
                    }`}
                  >
                    <span>{cat.label}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold ${
                      isSelected ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {cat.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Simple Search bar */}
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="গেটওয়ে খুঁজুন... (e.g. bkash)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-220 rounded-xl pl-9 pr-8 py-1.5 text-xs font-semibold text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-3xs"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5">
                  <X className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              )}
            </div>
          </div>

          {/* Grid Layout of enabled Gateways */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredProviders.map(prov => {
              const isSelected = selectedGateway === prov.key;
              return (
                <div
                  key={prov.key}
                  onClick={() => {
                    setSelectedGateway(prov.key);
                    setPaymentStep(2);
                  }}
                  className={`group relative flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 select-none bg-white hover:bg-slate-50/50 hover:border-slate-300 ${
                    isSelected 
                      ? 'border-indigo-500 bg-indigo-50/15' 
                      : 'border-slate-100 shadow-3xs'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className="shrink-0 group-hover:scale-105 transition-transform duration-200">
                      {prov.logo}
                    </div>
                    <div>
                      <span className="font-extrabold text-slate-800 text-xs block tracking-tight group-hover:text-indigo-650 transition-colors">
                        {prov.label}
                      </span>
                      <span className="text-[10px] text-slate-400 font-extrabold block tracking-wide mt-0.5 uppercase">
                        {prov.notes}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 text-[8px] font-black tracking-wide uppercase border border-emerald-100/50">
                      Active
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              );
            })}
          </div>

          {filteredProviders.length === 0 && (
            <div className="py-12 border border-dashed border-slate-200 rounded-2xl text-center bg-slate-50/50">
              <AlertCircle className="w-7 h-7 text-slate-400 mx-auto mb-2 animate-bounce" />
              <p className="text-xs font-bold text-slate-500">কোন পেমেন্ট গেটওয়ে খুঁজে পাওয়া যায়নি</p>
              <p className="text-[10px] text-slate-400 mt-1">অনুগ্রহ করে ভিন্ন কোনো শব্দ লিখে সার্চ করে দেখুন।</p>
            </div>
          )}

        </div>
      )}

      {/* ==================== STEP 2: DETAILS & FORM ==================== */}
      {paymentStep === 2 && (
        <div className="bg-white border border-slate-200 rounded-[2rem] p-5 sm:p-7 shadow-xs animate-fade-in space-y-6 text-left relative">
          
          {/* Form Header with Back Arrow */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <button 
                type="button"
                onClick={() => setPaymentStep(1)}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-indigo-650" />
                  পেমেন্ট পাঠান / Send Money
                </h2>
                <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                  কোম্পানির অফিশিয়াল অ্যাকাউন্টে পেমেন্ট প্রেরণ করে ফর্মটি পূরণ করুন
                </p>
              </div>
            </div>
            <a 
              href="https://wa.me/8801718070273" 
              target="_blank" 
              rel="noreferrer"
              className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-indigo-600 transition-colors"
              title="সহায়তা কেন্দ্রের সাথে কথা বলুন"
            >
              <HelpCircle className="w-5 h-5" />
            </a>
          </div>

          {/* Display Fee Charge Card */}
          <div className="rounded-2xl p-4 sm:p-4.5 text-white flex items-center justify-between bg-gradient-to-br from-indigo-900 to-indigo-950 border border-indigo-800/40 shadow-sm relative overflow-hidden">
            <div className="absolute right-0 bottom-0 opacity-10 font-sans font-black text-6xl select-none translate-x-4 translate-y-4">
              {activeProvider.key}
            </div>
            <div className="space-y-0.5">
              <span className="text-[9px] font-black uppercase tracking-widest text-indigo-300 font-mono">
                লেনদেন চার্জ ও ক্যাশ-আউট ফি
              </span>
              <h3 className="text-xl sm:text-2xl font-sans font-black tracking-tight leading-none mt-1 text-amber-400">
                {activeProvider.feePercent > 0 ? `${activeProvider.feePercent}%` : '০% ফ্রি / No Fees'}
              </h3>
            </div>
            <div className="text-right text-[10px] font-bold text-indigo-200">
              <span className="block text-[8.5px] font-mono tracking-widest uppercase text-indigo-400">চার্জ পলিসি</span>
              প্রেরিত এমাউন্টের ওপর চার্জ প্রযোজ্য হবে
            </div>
          </div>

          <form onSubmit={handleCheckoutSubmit} className="space-y-5">
            
            {/* Enter Amount Input & Slider */}
            <div className="bg-slate-50/70 border border-slate-200/80 p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">
                  পাঠানোর পরিমাণ দিন / Enter Target Due Bill Amount
                </label>
                <span className="text-[9.5px] font-mono font-extrabold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
                  কারেন্সি: BDT (৳)
                </span>
              </div>

              {/* Amount Box */}
              <div className="relative flex items-center bg-white border border-slate-220 rounded-2xl p-1 shadow-3xs focus-within:ring-4 focus-within:ring-indigo-500/5 focus-within:border-indigo-500 transition-all">
                <span className="text-xl font-mono font-black pl-4 text-slate-400">৳</span>
                <input
                  type="number"
                  min="10"
                  max="50000"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  className="w-full bg-transparent border-none py-3.5 px-2 text-2xl font-mono font-black text-slate-800 outline-none focus:outline-none focus:ring-0"
                  placeholder="0.00"
                  required
                />
                <span className="bg-slate-100 text-slate-600 px-4 py-2.5 rounded-xl font-mono font-black text-xs uppercase shrink-0 mr-1 select-none">
                  BDT
                </span>
              </div>

              {/* Slider Component */}
              <div className="space-y-1">
                <input
                  type="range"
                  min="10"
                  max="50000"
                  step="50"
                  value={parsedAmount}
                  onChange={(e) => setAmountInput(e.target.value)}
                  className="w-full accent-indigo-650 h-1.5 bg-slate-200 rounded-lg cursor-pointer transition-all"
                />
                <div className="flex justify-between text-[8.5px] font-mono font-black text-slate-400 uppercase tracking-widest px-1">
                  <span>৳১০ BDT</span>
                  <span>৳৫০,০০০ BDT</span>
                </div>
              </div>

              {/* Preset Chips */}
              <div className="flex flex-wrap gap-1.5 pt-1.5">
                {[500, 1000, 2500, 5000, 10000].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAmountInput(String(val))}
                    className="px-3 py-1.5 bg-white border border-slate-220 hover:bg-slate-100 hover:border-slate-300 text-slate-700 text-xs font-mono font-black rounded-lg shadow-3xs transition-all active:scale-95"
                  >
                    ৳{val.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Summary details */}
            <div className="bg-slate-50/70 border border-slate-200/80 p-4 sm:p-5 rounded-2xl text-xs space-y-3 font-sans">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider block border-b border-slate-200/60 pb-2">
                সারাংশ (Billing Calculation Summary)
              </h4>
              <div className="space-y-2.5">
                <div className="flex justify-between items-center text-slate-600">
                  <span className="font-semibold">ব্যাবসার অ্যামাউন্ট (Required Amount):</span>
                  <span className="font-mono font-extrabold text-slate-800">৳{parsedAmount.toFixed(2)} BDT</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span className="font-semibold">লেনদেন সার্ভিস চার্জ ({activeProvider.feePercent}%):</span>
                  <span className="font-mono font-extrabold text-rose-600">+ ৳{computedCharge.toFixed(2)} BDT</span>
                </div>
                <div className="border-t border-slate-200/60 pt-2.5 flex justify-between items-center text-slate-800 text-sm">
                  <span className="font-black">মোট পেমেন্ট (Send Money Total):</span>
                  <span className="font-mono font-black text-indigo-650 bg-indigo-50/50 border border-indigo-100/50 px-2.5 py-1 rounded-xl">
                    ৳{computedTotal.toFixed(2)} BDT
                  </span>
                </div>
              </div>
            </div>

            {/* Official Accounts copy section */}
            <div className="bg-slate-900 border border-slate-850 p-5 rounded-2xl text-white space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  অ্যাকাউন্ট ডিটেইল (Copy Credential)
                </span>
                <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-wider border border-emerald-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Active
                </span>
              </div>

              {/* Details of Gateway Number or Address */}
              <div className="space-y-3 text-xs">
                
                {/* Regular Wallet */}
                {activeProvider.category === 'mfs' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase text-indigo-300 tracking-wider flex items-center gap-2">
                        {activeProvider.logo} {activeProvider.key} Active Channel
                      </span>
                      <span className="text-[9px] bg-indigo-600 text-white font-mono font-black px-2 py-0.5 rounded uppercase">Instant Transfer</span>
                    </div>

                    <div className="bg-white/5 border border-white/5 rounded-xl p-4 space-y-1 relative">
                      <span className="text-[9px] text-indigo-300 font-bold uppercase block tracking-wider font-mono">
                        মোবাইল নম্বর ({activeProvider.key} Number)
                      </span>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-1.5">
                        <div className="text-2xl sm:text-3xl font-mono font-black text-white tracking-wider select-all">{activeProvider.accNo}</div>
                        <button
                          type="button"
                          onClick={() => handleCopy(activeProvider.accNo)}
                          className="flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/20 text-white font-sans font-black text-[10px] px-3.5 py-1.5 rounded-lg border border-white/5 transition-all self-start sm:self-center cursor-pointer"
                        >
                          {copiedText === activeProvider.accNo ? (
                            <><Check className="w-3.5 h-3.5 text-emerald-400" /> কপি হয়েছে!</>
                          ) : (
                            <><Copy className="w-3.5 h-3.5" /> কপি করুন</>
                          )}
                        </button>
                      </div>
                      <span className="inline-block bg-rose-600 text-white text-[8.5px] font-black px-2.5 py-0.5 rounded-full mt-2.5 uppercase tracking-widest font-mono">
                        personal (ব্যক্তিগত অ্যাকাউন্ট)
                      </span>
                    </div>
                  </div>
                )}

                {/* Bank Account Details */}
                {activeProvider.key === 'Bank' && (
                  <div className="space-y-3 text-left">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black uppercase text-indigo-300 tracking-wider flex items-center gap-2">
                        {activeProvider.logo} Bank Payment Channel
                      </span>
                      <span className="text-[9px] bg-sky-600 text-white font-mono font-black px-2 py-0.5 rounded uppercase">Bank Deposit</span>
                    </div>

                    <div className="bg-white/5 border border-white/5 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-0.5">
                        <span className="text-[8.5px] text-indigo-300 block uppercase font-mono">Bank Name</span>
                        <span className="font-extrabold text-sm text-slate-100 block">{activeProvider.bankName}</span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[8.5px] text-indigo-300 block uppercase font-mono">Account Name</span>
                        <span className="font-extrabold text-sm text-slate-100 block">{activeProvider.accountName}</span>
                      </div>
                      <div className="sm:col-span-2 bg-white/5 p-3 rounded-lg border border-white/5 flex items-center justify-between">
                        <div>
                          <span className="text-[8.5px] text-indigo-300 block uppercase font-mono">Account Number</span>
                          <span className="font-mono font-black select-all tracking-wider text-base text-white">{activeProvider.accNo}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(activeProvider.accNo)}
                          className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white font-mono font-bold text-[10px] px-3.5 py-1.5 rounded-lg border border-white/5 transition-all cursor-pointer"
                        >
                          {copiedText === activeProvider.accNo ? <><Check className="w-3 h-3 text-emerald-400" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                        </button>
                      </div>
                      <div className="sm:col-span-2 text-[10.5px] text-slate-350 leading-relaxed font-sans">
                        <strong>Branch Name:</strong> {activeProvider.branch}
                      </div>
                    </div>
                  </div>
                )}

                {/* Binance details */}
                {activeProvider.key === 'Binance' && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black uppercase text-indigo-300 tracking-wider flex items-center gap-2">
                        {activeProvider.logo} Crypto Payment Channel
                      </span>
                      <span className="text-[9px] bg-amber-500 text-black font-mono font-black px-2 py-0.5 rounded uppercase">USDT TRC20</span>
                    </div>

                    <div className="bg-white/5 border border-white/5 rounded-xl p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[8.5px] text-indigo-300 block uppercase font-mono">بাইনান্স পে আইডি (Binance Pay ID)</span>
                          <span className="text-lg font-mono font-black text-white select-all">{activeProvider.accNo}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(activeProvider.accNo)}
                          className="flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white font-mono font-bold text-[9px] px-2.5 py-1.5 rounded-lg transition-all"
                        >
                          {copiedText === activeProvider.accNo ? 'Copied' : 'Copy ID'}
                        </button>
                      </div>
                      <div className="border-t border-white/5 pt-3.5">
                        <span className="text-[8.5px] text-indigo-300 block uppercase font-mono mb-1">ইউএসডিটি এড্রেস (USDT TRC20 Address)</span>
                        <div className="bg-black/20 p-2.5 rounded-lg border border-white/5 flex items-center justify-between gap-4 mt-1">
                          <span className="text-[10px] font-mono font-bold text-slate-200 select-all break-all">{activeProvider.usdtAddress}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(activeProvider.usdtAddress || '')}
                            className="flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white font-mono font-bold text-[9px] px-2.5 py-1.5 rounded-lg shrink-0 transition-all"
                          >
                            {copiedText === activeProvider.usdtAddress ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* PayPal details */}
                {activeProvider.key === 'PayPal' && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black uppercase text-indigo-300 tracking-wider flex items-center gap-2">
                        {activeProvider.logo} PayPal Gateway
                      </span>
                      <span className="text-[9px] bg-blue-600 text-white font-mono font-black px-2 py-0.5 rounded uppercase">USD Gift</span>
                    </div>

                    <div className="bg-white/5 border border-white/5 rounded-xl p-4 flex items-center justify-between gap-4">
                      <div>
                        <span className="text-[8.5px] text-indigo-300 block uppercase font-mono">PayPal Account Email</span>
                        <span className="text-sm font-mono font-black text-white select-all break-all">{activeProvider.accNo}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(activeProvider.accNo)}
                        className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white font-mono font-bold text-[10px] px-3.5 py-1.5 rounded-lg border border-white/5 transition-all cursor-pointer shrink-0"
                      >
                        {copiedText === activeProvider.accNo ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Alert lock box info */}
                <div className="bg-white/5 p-3.5 rounded-xl border border-white/5 flex gap-3 text-left">
                  <Lock className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                  <p className="text-[10.5px] text-slate-300 font-medium leading-relaxed">
                    প্রদত্ত ইউএসডি পার্সোনাল নাম্বারে সেন্ড মানি (Send Money) সফল করুন। সেন্ট করার পরে যোগাযোগ করুন এবং ট্রানজেকশন ID সহকারে পেমেন্ট ট্রানজেকশন REPORT বা লাস্ট ডিজিট দিন।
                  </p>
                </div>

              </div>
            </div>

            {/* Core checkout transaction Inputs form */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
              <h4 className="text-[11px] font-black text-indigo-650 uppercase tracking-wider block border-b border-slate-100 pb-2.5">
                পেমেন্ট তথ্য এবং সার্ভিস ফর্ম (Transaction verification info)
              </h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Select Purpose */}
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                    পেমেন্ট উদ্দেশ্য (Payment Purpose) *
                  </label>
                  <select
                    value={topUpPurpose}
                    onChange={(e) => setTopUpPurpose(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl py-3 px-3.5 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 transition-all cursor-pointer shadow-3xs"
                    required
                  >
                    <option value="Wallet Top-Up">Wallet Top-Up (ওয়ালেট টপ-আপ রিচার্জ)</option>
                    <option value="Android App Purchase">Android App Purchase (অ্যান্ড্রয়েড অ্যাপ তৈরি)</option>
                    <option value="Reseller Panel Purchase">Reseller Panel Purchase (রিসেলার প্যানেল এক্টিভেশন)</option>
                    <option value="Decoder License Purchase">Decoder License Purchase (ডিকোড লাইসেন্স কি)</option>
                    <option value="Binance $ Purchase">Binance $ Purchase (ডলার ক্রয়)</option>
                    <option value="Redotpay $ Purchase">Redotpay $ Purchase (রেডটপে ডলার)</option>
                    <option value="Facebook Boost">Facebook Boost (ফেসবুক পেজ বুস্টিং)</option>
                    <option value="Banner Making">Banner Making (ব্যানার মেকিং)</option>
                    <option value="Logo Making">Logo Making (লোগো মেকিং)</option>
                    <option value="Others / Etc">Others / Etc (অন্যান্য সার্ভিস পেমেন্ট)</option>
                  </select>
                </div>

                {/* Dynamic Extra fields based on purpose */}
                {topUpPurpose === 'Android App Purchase' && (
                  <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-indigo-50/40 p-4 border border-indigo-100 rounded-2xl animate-fade-in text-left">
                    <div>
                      <label className="block text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1.5">অ্যাপের নাম (App Name) *</label>
                      <input 
                        type="text" 
                        value={ticketAppName} 
                        onChange={(e) => setTicketAppName(e.target.value)}
                        className="w-full bg-white border border-indigo-200 rounded-xl py-2.5 px-3.5 text-xs font-bold text-slate-800 focus:border-indigo-500 outline-none"
                        placeholder="e.g. My Custom App"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1.5">অ্যাপ প্যাকেজ নেম (App Package Name) *</label>
                      <input 
                        type="text" 
                        value={ticketAppPackageName} 
                        onChange={(e) => setTicketAppPackageName(e.target.value)}
                        className="w-full bg-white border border-indigo-200 rounded-xl py-2.5 px-3.5 text-xs font-mono font-bold text-slate-800 focus:border-indigo-500 outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1.5">অ্যাপ কোয়ালিটি / টাইপ *</label>
                      <select 
                        value={ticketAppQuality} 
                        onChange={(e) => setTicketAppQuality(e.target.value)}
                        className="w-full bg-white border border-indigo-200 rounded-xl py-2.5 px-3.5 text-xs font-bold text-slate-800 outline-none"
                        required
                      >
                        <option value="">-- কোয়ালিটি সিলেক্ট * --</option>
                        {['Standard Layout (স্ট্যান্ডার্ড)', 'Premium HD Quality (প্রিমিয়াম)', 'Custom Premium UI (কাস্টম ডিজাইন)'].map(q => (
                          <option key={q} value={q}>{q}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1.5">অ্যাপ টাইপ সিলেক্ট *</label>
                      <select 
                        value={ticketAppType} 
                        onChange={(e) => setTicketAppType(e.target.value)}
                        className="w-full bg-white border border-indigo-200 rounded-xl py-2.5 px-3.5 text-xs font-bold text-slate-800 outline-none"
                        required
                      >
                        <option value="">-- অ্যাপ টাইপ সিলেক্ট * --</option>
                        {['Single App', 'Multi App', 'Reseller App'].map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1.5">কাজের ধরণ (Work Type) *</label>
                      <select 
                        value={ticketAppWorkType} 
                        onChange={(e) => setTicketAppWorkType(e.target.value)}
                        className="w-full bg-white border border-indigo-200 rounded-xl py-2.5 px-3.5 text-xs font-bold text-slate-800 outline-none"
                        required
                      >
                        <option value="">-- কাজের ধরণ সিলেক্ট * --</option>
                        {['New app compilation', 'App update config', 'App logo & name change'].map(w => (
                          <option key={w} value={w}>{w}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {topUpPurpose === 'Reseller Panel Purchase' && (
                  <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-indigo-50/40 p-4 border border-indigo-100 rounded-2xl animate-fade-in text-left">
                    <div>
                      <label className="block text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1.5">প্যানেলের নাম (Panel Name) *</label>
                      <input 
                        type="text" 
                        value={ticketPanelName} 
                        onChange={(e) => setTicketPanelName(e.target.value)}
                        className="w-full bg-white border border-indigo-200 rounded-xl py-2.5 px-3.5 text-xs font-bold text-slate-800 focus:border-indigo-500 outline-none"
                        placeholder="e.g. Master Reseller"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1.5">প্যানেল URL (Panel Website / App URL) *</label>
                      <input 
                        type="text" 
                        value={ticketPanelUrl} 
                        onChange={(e) => setTicketPanelUrl(e.target.value)}
                        className="w-full bg-white border border-indigo-200 rounded-xl py-2.5 px-3.5 text-xs font-bold text-slate-800 focus:border-indigo-500 outline-none"
                        placeholder="e.g. panel.example.com"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1.5">মেয়াদ (Duration) *</label>
                      <select
                        value={ticketPanelDuration}
                        onChange={(e) => setTicketPanelDuration(e.target.value)}
                        className="w-full bg-white border border-indigo-200 rounded-xl py-2.5 px-3.5 text-xs font-bold text-slate-800 outline-none"
                        required
                      >
                        <option value="">-- মেয়াদ সিলেক্ট করুন --</option>
                        {['1 month', '3 months', '6 months', '12 months', 'Lifetime'].map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1.5">প্যানেলের টাইপ (Panel Type) *</label>
                      <select
                        value={ticketPanelType}
                        onChange={(e) => setTicketPanelType(e.target.value)}
                        className="w-full bg-white border border-indigo-200 rounded-xl py-2.5 px-3.5 text-xs font-bold text-slate-800 outline-none"
                        required
                      >
                        <option value="">-- প্যানেল টাইপ সিলেক্ট করুন --</option>
                        {['New panel compilation', 'Existing panel subscription renewal'].map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {topUpPurpose === 'Decoder License Purchase' && (
                  <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-indigo-50/40 p-4 border border-indigo-100 rounded-2xl animate-fade-in text-left">
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1.5">ডিকোড ইউজারনেম (Decoder Username) *</label>
                      <input 
                        type="text" 
                        value={ticketDecoderUsername} 
                        onChange={(e) => setTicketDecoderUsername(e.target.value)}
                        className="w-full bg-white border border-indigo-200 rounded-xl py-2.5 px-3.5 text-xs font-bold text-slate-800 focus:border-indigo-500 outline-none"
                        placeholder="e.g. mydecoderusername"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1.5">ইউজার ধরন (User Type) *</label>
                      <select
                        value={ticketDecoderUserType}
                        onChange={(e) => setTicketDecoderUserType(e.target.value)}
                        className="w-full bg-white border border-indigo-200 rounded-xl py-2.5 px-3.5 text-xs font-bold text-slate-800 outline-none"
                        required
                      >
                        <option value="">-- ধরন সিলেক্ট করুন --</option>
                        {['New user compilation', 'Existing user license renewal'].map(u => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1.5">লাইসেন্স মেয়াদ (License Duration) *</label>
                      <select
                        value={ticketDecoderDuration}
                        onChange={(e) => setTicketDecoderDuration(e.target.value)}
                        className="w-full bg-white border border-indigo-200 rounded-xl py-2.5 px-3.5 text-xs font-bold text-slate-800 outline-none"
                        required
                      >
                        <option value="">-- মেয়াদ সিলেক্ট করুন --</option>
                        {['1 month', '3 months', '6 months', '12 months', 'Lifetime'].map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {['Binance $ Purchase', 'Redotpay $ Purchase', 'Facebook Boost', 'Banner Making', 'Logo Making', 'Others / Etc'].includes(topUpPurpose) && (
                  <div className="sm:col-span-2 grid grid-cols-1 gap-4 bg-indigo-50/40 p-4 border border-indigo-100 rounded-2xl animate-fade-in text-left">
                    <div>
                      <label className="block text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1.5">
                        সার্ভিস বিবরণ ও অতিরিক্ত তথ্য *
                      </label>
                      <textarea 
                        value={ticketServiceDetails}
                        onChange={(e) => setTicketServiceDetails(e.target.value)}
                        rows={3}
                        className="w-full bg-white border border-indigo-200 rounded-xl py-2.5 px-3.5 text-xs font-sans font-bold text-slate-800 focus:border-indigo-500 outline-none"
                        placeholder="আপনার রিকোয়েস্টকৃত সার্ভিসটির বিস্তারিত বিবরণ এখানে প্রদান করুন"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Invoice ID Metadata */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                    রশিদ/ইনভয়েস নম্বর (Invoice Number)
                  </label>
                  <input
                    type="text"
                    value={clientInvoiceNumber}
                    readOnly
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-mono font-black text-slate-600 outline-none select-all cursor-not-allowed"
                  />
                </div>

                {/* Transaction ID input */}
                <div>
                  <label className="block text-[10px] font-black text-indigo-650 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                    <Key className="w-3.5 h-3.5" /> ট্রানজেকশন আইডি (Transaction ID / TxID) *
                  </label>
                  <input
                    type="text"
                    required
                    value={txnIdInput}
                    onChange={(e) => setTxnIdInput(e.target.value)}
                    className="w-full bg-white border border-slate-220 rounded-xl py-2.5 px-3.5 text-xs font-mono font-black text-slate-800 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all"
                    placeholder="e.g. 8N7X2B9K4D"
                  />
                </div>

              </div>
            </div>

            {submitError && (
              <div className="bg-rose-50 text-rose-600 border border-rose-200 rounded-xl p-4 text-xs font-bold flex items-center gap-2 animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || !isFormValid}
                className="w-full py-4 bg-indigo-650 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-450 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    পেমেন্ট যাচাই করা হচ্ছে...
                  </>
                ) : (
                  <>আমি পেমেন্ট করেছি</>
                )}
              </button>
              <span className="block text-center text-[10.5px] text-slate-400 font-bold mt-3">
                সাধারণত ১-৫ মিনিটের মধ্যে পেমেন্ট কনফার্ম হয়
              </span>
            </div>

          </form>
        </div>
      )}

      {/* ==================== STEP 3: SUCCESS RECEIPT ==================== */}
      {paymentStep === 3 && lastSubmittedInvoice && (
        <div className="bg-white border border-slate-200 rounded-[2rem] p-5 sm:p-7 shadow-xs animate-fade-in space-y-6 text-left">
          
          {/* Animated Green Circle Checkmark Check */}
          <div className="flex flex-col items-center justify-center text-center space-y-2 py-4">
            <div className="w-16 h-16 bg-emerald-100 border-4 border-emerald-50 rounded-full flex items-center justify-center text-emerald-600 animate-scale-in">
              <Check className="w-9 h-9 stroke-[3]" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">পেমেন্ট সফল!</h2>
            <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
              Your payment has been initiated successfully. We are verifying your request.
            </p>
          </div>

          {/* Receipt Info list */}
          <div className="bg-slate-50/70 border border-slate-200/80 p-5 rounded-2xl space-y-3.5">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest block border-b border-slate-220 pb-2">
              লেনদেন রশিদ বিবরণী (Transaction Info)
            </h4>

            <div className="space-y-2.5 text-xs font-sans text-slate-650">
              
              <div className="flex justify-between items-center">
                <span>ইনভয়েস আইডি (Invoice ID):</span>
                <span className="font-mono font-black text-slate-800 select-all">{lastSubmittedInvoice.invoiceNumber}</span>
              </div>

              <div className="flex justify-between items-center">
                <span>ট্রানজেকশন আইডি:</span>
                <div className="flex items-center gap-1.5 font-mono font-black text-indigo-650">
                  <span className="select-all">{lastSubmittedInvoice.transactionId}</span>
                  <button 
                    onClick={() => handleCopy(lastSubmittedInvoice.transactionId)}
                    className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600 shrink-0"
                    title="কপি করুন"
                  >
                    {copiedText === lastSubmittedInvoice.transactionId ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span>পাঠানো পরিমাণ (Amount):</span>
                <span className="font-mono font-extrabold text-slate-800">৳{lastSubmittedInvoice.amount.toFixed(2)} BDT</span>
              </div>

              <div className="flex justify-between items-center">
                <span>সার্ভিস চার্জ ({lastSubmittedInvoice.feePercent}%):</span>
                <span className="font-mono font-extrabold text-slate-800">৳{lastSubmittedInvoice.chargeAmount.toFixed(2)} BDT</span>
              </div>

              <div className="flex justify-between items-center font-extrabold text-slate-800">
                <span>মোট পেমেন্ট:</span>
                <span className="font-mono font-black text-indigo-650 bg-indigo-50/50 border border-indigo-100/50 px-2.5 py-0.5 rounded-lg">৳{lastSubmittedInvoice.totalAmount.toFixed(2)} BDT</span>
              </div>

              <div className="flex justify-between items-center">
                <span>পেমেন্ট গেটওয়ে (Gateway):</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  {lastSubmittedInvoice.method}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span>তারিখ ও সময়:</span>
                <span className="font-mono font-bold text-slate-600">{lastSubmittedInvoice.date}</span>
              </div>

              <div className="flex justify-between items-center">
                <span>স্ট্যাটাস (Status):</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 text-[9px] font-black uppercase tracking-wider">
                  সফল হয়েছে
                </span>
              </div>

            </div>
          </div>

          {/* Quick Track Row */}
          <div 
            onClick={() => {
              if (onTabChange) onTabChange('client_invoices');
            }}
            className="group p-4 bg-indigo-50/15 hover:bg-indigo-50/30 border border-indigo-100 rounded-2xl flex items-center justify-between cursor-pointer transition-all duration-200"
          >
            <div className="space-y-0.5">
              <span className="text-[10px] font-black text-indigo-650 uppercase tracking-widest block">
                লেনদেন ট্র্যাক করুন
              </span>
              <p className="text-[11px] text-slate-500 font-semibold">
                আপনার পেমেন্ট রিকোয়েস্টের স্ট্যাটাস এখান থেকে ট্র্যাক করুন
              </p>
            </div>
            <span className="text-[11px] font-black text-indigo-650 flex items-center gap-1 select-none group-hover:translate-x-0.5 transition-all">
              ট্র্যাক স্ট্যাটাস দেখুন <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>

          {/* Advertisement/Footer Banner */}
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center gap-4 text-left">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl shrink-0 shadow-3xs animate-bounce">
              <Megaphone className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <span className="text-[10.5px] font-black text-slate-800 block">আপনার ব্যবসা বাড়ান</span>
              <p className="text-[10.5px] text-slate-500 font-bold leading-relaxed">
                নিয়মিত লেনদেন করুন এবং সেরা কোম্পানির ফাস্ট কাস্টমার সাপোর্ট ও প্রমোশনাল বোনাস অফার উপভোগ করুন।
              </p>
            </div>
          </div>

          {/* Assistive help center support */}
          <div className="space-y-2 border-t border-slate-100 pt-5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
              প্রয়োজনীয় সহায়তা
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[
                { label: 'হেল্প সেন্টার', url: 'https://wa.me/8801718070273', icon: <SupportIcon className="w-4 h-4" /> },
                { label: 'যোগাযোগ করুন', url: 'https://wa.me/8801718070273', icon: <Phone className="w-4 h-4" /> },
                { label: 'টিকিট তৈরি করুন', url: 'https://wa.me/8801718070273', icon: <MessageSquare className="w-4 h-4" /> }
              ].map(help => (
                <a
                  key={help.label}
                  href={help.url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-3 bg-white hover:bg-slate-50 border border-slate-220 hover:border-slate-300 rounded-xl text-center text-xs font-bold text-slate-700 flex items-center justify-center gap-2 transition-all shadow-3xs active:scale-95"
                >
                  {help.icon}
                  <span>{help.label}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
            <button
              onClick={() => {
                if (onTabChange) onTabChange('dashboard');
              }}
              className="w-full py-3.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            >
              ড্যাশবোর্ডে ফিরে যান
            </button>
            <button
              onClick={() => {
                setPaymentStep(1);
                setLastSubmittedInvoice(null);
              }}
              className="w-full py-3.5 bg-white border border-slate-220 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            >
              আবার পেমেন্ট করুন
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
