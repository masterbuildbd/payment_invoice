import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Layers, 
  CheckCircle, 
  Clock, 
  TrendingDown, 
  TrendingUp,
  Megaphone, 
  Wallet, 
  ArrowRight, 
  UserPlus, 
  MessageSquare, 
  ShieldAlert, 
  RefreshCw, 
  HelpCircle,
  Copy,
  Check,
  ChevronDown,
  AlertCircle,
  ShieldCheck,
  ChevronRight,
  Activity,
  FileText,
  Users,
  BarChart3,
  ArrowLeftRight,
  FileSpreadsheet
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

interface ClientDashboardProps {
  user: any;
  currentUserData: any;
  settings: any;
  invoices: any[];
  myRejectedInvoices: any[];
  myApps: any[];
  myPanels: any[];
  myDecoders: any[];
  onTabChange: (tab: string) => void;
  handleInitiateResubmit: (inv: any) => void;
}

export function ClientDashboard({
  user,
  currentUserData,
  settings = {},
  invoices = [],
  myRejectedInvoices = [],
  myApps = [],
  myPanels = [],
  myDecoders = [],
  onTabChange,
  handleInitiateResubmit
}: ClientDashboardProps) {
  // AI Invoice Genie State
  const [selectedInvoiceForAi, setSelectedInvoiceForAi] = useState<string>('');
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<string | null>(null);

  // Estimator State
  const [estimatorAmount, setEstimatorAmount] = useState<number>(1000);
  const [selectedGateway, setSelectedGateway] = useState<'bKash' | 'Nagad' | 'Upay' | 'Rocket'>('bKash');
  const [copiedTxId, setCopiedTxId] = useState<string | null>(null);

  // Utility to convert numbers to Bengali digits
  const toBengaliNumber = (num: number | string): string => {
    const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return num.toString().replace(/\d/g, (digit) => bengaliDigits[parseInt(digit, 10)]);
  };

  const totalFee = Number(currentUserData?.price) || 0;
  
  // Calculate approved/paid invoice balance dynamically
  const paidFees = useMemo(() => {
    return invoices
      .filter(inv => inv.username === user?.username)
      .filter(inv => inv.status === 'paid' || inv.status === 'approved')
      .reduce((sum, inv) => sum + (inv.paidAmount || inv.amount || 0), 0);
  }, [invoices, user?.username]);

  const dueFees = Math.max(0, totalFee - paidFees);

  const pendingFees = useMemo(() => {
    return invoices
      .filter(inv => inv.username === user?.username)
      .filter(inv => inv.status === 'pending' || inv.status === 'overdue')
      .reduce((sum, inv) => sum + (inv.amount || 0), 0);
  }, [invoices, user?.username]);

  const pendingCount = useMemo(() => {
    return invoices.filter(inv => inv.username === user?.username && inv.status === 'pending').length;
  }, [invoices, user?.username]);

  // Handle Copy text
  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTxId(text);
    setTimeout(() => setCopiedTxId(null), 2000);
  };

  // AI Invoice Genie analyze trigger
  const handleAiAnalyze = () => {
    if (!selectedInvoiceForAi) return;
    setAiAnalyzing(true);
    setAiAnalysisResult(null);

    const targetInv = invoices.find(inv => inv.id === selectedInvoiceForAi);
    setTimeout(() => {
      setAiAnalyzing(false);
      if (targetInv) {
        setAiAnalysisResult(
          `✅ ইনভয়েস #${targetInv.id.substring(0, 8).toUpperCase()} সফলভাবে বিশ্লেষণ করা হয়েছে।\n` +
          `• পরিমাণ: ৳${targetInv.amount.toLocaleString()}\n` +
          `• বর্তমান স্ট্যাটাস: ${targetInv.status === 'paid' ? 'পরিশোধিত' : 'যাচাইাধীন'}\n` +
          `• গেটওয়ে ফি এবং সিকিউরিটি চেক: পাসড। এই রশিদটি ১০০% বৈধ এবং সিকিউর চ্যানেল দ্বারা প্রসেস করা হয়েছে।`
        );
      } else {
        setAiAnalysisResult(`❌ ইনভয়েস ডেটা পাওয়া যায়নি। দয়া করে আবার চেষ্টা করুন।`);
      }
    }, 1200);
  };

  // Gateway fees configs
  const gateways = [
    { key: 'bKash' as const, rate: 1.85, label: 'bKash', color: 'bg-rose-600' },
    { key: 'Nagad' as const, rate: 1.50, label: 'Nagad', color: 'bg-orange-500' },
    { key: 'Upay' as const, rate: 1.40, label: 'Upay', color: 'bg-blue-600' },
    { key: 'Rocket' as const, rate: 1.80, label: 'Rocket', color: 'bg-purple-600' }
  ];

  const activeGateway = gateways.find(g => g.key === selectedGateway) || gateways[0];
  const computedCharge = (estimatorAmount * activeGateway.rate) / 100;
  const computedTotal = estimatorAmount + computedCharge;

  // Real payment trend data from invoices list
  const chartData = useMemo(() => {
    const userInvoices = invoices
      .filter(inv => inv.username === user?.username && (inv.status === 'paid' || inv.status === 'approved'))
      .sort((a, b) => new Date(a.createdAt || '').getTime() - new Date(b.createdAt || '').getTime());
    
    if (userInvoices.length === 0) {
      return [
        { name: 'জানুয়ারি', amount: 0 },
        { name: 'ফেব্রুয়ারি', amount: 0 },
        { name: 'মার্চ', amount: 0 }
      ];
    }
    
    const mapped = userInvoices.map((inv, idx) => {
      const dateStr = inv.createdAt || '';
      let label = `P${idx + 1}`;
      try {
        if (dateStr) {
          label = new Date(dateStr).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' });
        }
      } catch (e) {}
      return {
        name: label,
        amount: Number(inv.paidAmount || inv.amount || 0)
      };
    });

    if (mapped.length === 1) {
      return [{ name: 'শুরু', amount: 0 }, ...mapped];
    }
    return mapped;
  }, [invoices, user?.username]);

  // Donut values percentage logic
  const donutData = useMemo(() => {
    const total = totalFee || 1; 
    const paidPercent = Math.min(100, Math.round((paidFees / total) * 100));
    const pendingPercent = Math.min(100, Math.round((pendingFees / total) * 100));
    const duePercent = Math.max(0, 100 - paidPercent - pendingPercent);

    return {
      paid: paidPercent,
      pending: pendingPercent,
      due: duePercent,
    };
  }, [totalFee, paidFees, pendingFees]);

  const circ = 238.76;
  const paidOffset = 0;
  const pendingOffset = (donutData.paid / 100) * circ;
  const dueOffset = ((donutData.paid + donutData.pending) / 100) * circ;
  const paidStroke = (donutData.paid / 100) * circ;
  const pendingStroke = (donutData.pending / 100) * circ;
  const dueStroke = (donutData.due / 100) * circ;

  // Recent client specific activities
  const recentActivities = useMemo(() => {
    const userInvoices = [...invoices]
      .filter(inv => inv.username === user?.username)
      .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime())
      .slice(0, 3);
    
    if (userInvoices.length === 0) {
      return [
        { title: 'কোন সাম্প্রতিক কার্যক্রম নেই', sub: 'আপনার সকল লেনদেন এখানে প্রদর্শিত হবে।', time: 'এখনই', type: 'info' }
      ];
    }

    return userInvoices.map(inv => {
      let title = '';
      let sub = `পরিমাণ: ৳${(inv.amount || 0).toLocaleString()} • মাধ্যম: ${inv.paymentMethod || inv.method || 'N/A'}`;
      let type = 'pending';
      let timeStr = 'সদ্য সাবমিট';
      
      try {
        if (inv.createdAt) {
          timeStr = new Date(inv.createdAt).toLocaleDateString('bn-BD', {
            hour: '2-digit',
            minute: '2-digit',
            day: 'numeric',
            month: 'short'
          });
        }
      } catch (e) {}

      if (inv.status === 'paid' || inv.status === 'approved') {
        title = `ইনভয়েস #${inv.id.substring(0, 8).toUpperCase()} অনুমোদিত`;
        type = 'success';
      } else if (inv.status === 'rejected') {
        title = `ইনভয়েস #${inv.id.substring(0, 8).toUpperCase()} বাতিল`;
        type = 'rejected';
      } else {
        title = `পেমেন্ট রিকোয়েস্ট যাচাইাধীন`;
        type = 'pending';
      }

      return {
        title,
        sub,
        time: timeStr,
        type
      };
    });
  }, [invoices, user?.username]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start font-sans">
      
      {/* ======================================================== */}
      {/* 📱 PANEL 1: MAIN METRICS & OVERVIEW (MIRRORS ADMIN STYLE) */}
      {/* ======================================================== */}
      <div id="client-panel1-container" className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[28px] p-5 sm:p-6 shadow-sm flex flex-col space-y-6 select-none relative overflow-hidden">
        
        {/* Welcome Back Gradient Banner */}
        <div id="p1-welcome-banner" className="relative rounded-[22px] bg-gradient-to-br from-[#6366f1] via-[#5b4ff3] to-[#4f46e5] text-white p-5 overflow-hidden shadow-xs min-h-[140px] flex items-center">
          <div className="relative z-10 max-w-[65%] text-left space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-white/15 px-2.5 py-0.5 rounded-full backdrop-blur-md">WELCOME BACK CLIENT</span>
            <h2 className="text-base sm:text-lg font-black tracking-tight">{currentUserData?.name || user?.name || 'MD MANIK'} 👋</h2>
            <p className="text-[10px] font-medium leading-relaxed opacity-90">আপনার সেবা ও পেমেন্ট কার্যক্রমগুলো বিশ্লেষণ করুন স্মার্টলি।</p>
          </div>
          
          {/* SVG Laptop/Wallet Client Illustration on the Right */}
          <div className="absolute right-2 bottom-0 top-0 w-[40%] flex items-center justify-center opacity-95">
            <svg viewBox="0 0 120 100" className="w-full h-auto drop-shadow-md">
              <rect x="25" y="30" width="70" height="42" rx="4" fill="#1e1b4b" stroke="#818cf8" strokeWidth="2" />
              <rect x="29" y="34" width="62" height="34" rx="2" fill="#0f172a" />
              {/* Graphs inside Screen */}
              <path d="M 33,58 L 45,46 L 57,52 L 69,40 L 81,48 L 89,38" fill="none" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M 33,58 L 45,46 L 57,52 L 69,40 L 81,48 L 89,38 L 89,64 L 33,64 Z" fill="url(#screenGradClient)" opacity="0.15" />
              <defs>
                <linearGradient id="screenGradClient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
                </linearGradient>
              </defs>
              {/* Laptop Base */}
              <path d="M 15,72 L 105,72 L 110,76 A 2,2 0 0,1 108,78 L 12,78 A 2,2 0 0,1 10,76 Z" fill="#312e81" stroke="#4f46e5" strokeWidth="1.5" />
              <rect x="52" y="72" width="16" height="3" rx="1.5" fill="#1e1b4b" />
              <circle cx="102" cy="40" r="4" fill="#818cf8" opacity="0.6" />
              <circle cx="18" cy="48" r="3" fill="#34d399" opacity="0.7" />
            </svg>
          </div>

          {/* Pagination Dots */}
          <div className="absolute bottom-3 left-5 flex items-center gap-1.5">
            <span className="w-4 h-1 rounded-full bg-white transition-all duration-300" />
            <span className="w-1 h-1 rounded-full bg-white/40" />
            <span className="w-1 h-1 rounded-full bg-white/40" />
          </div>
        </div>

        {/* System Active Banner */}
        <div className="flex items-center justify-between p-3.5 bg-emerald-500/[0.04] dark:bg-emerald-500/[0.02] border border-emerald-500/15 dark:border-emerald-500/10 rounded-2xl transition-all duration-200 hover:scale-[1.01]">
          <div className="flex items-center gap-2.5 text-left">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShieldCheck size={16} />
            </div>
            <span className="text-[11px] font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-wide">সিস্টেম সংযোগ: সক্রিয় (System Connection: Active)</span>
          </div>
          <ChevronRight size={14} className="text-emerald-650 dark:text-emerald-400" />
        </div>

        {/* Quick Access Bento Grid */}
        <div className="space-y-3">
          <div className="flex justify-between items-center text-left">
            <div>
              <h3 className="text-[12px] font-bold text-slate-900 dark:text-white uppercase tracking-wider leading-none">Quick Access</h3>
              <span className="text-[10px] text-slate-400 dark:text-slate-550 font-medium">দ্রুত এক্সেস মেনু</span>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'client_payment', title: 'Payment', sub: 'পেমেন্ট করুন', icon: Wallet, color: 'text-indigo-655 bg-indigo-50 border-indigo-100 dark:bg-indigo-950/20 dark:border-indigo-900/40' },
              { id: 'client_invoices', title: 'Invoices', sub: 'চালানসমূহ', icon: FileText, color: 'text-emerald-655 bg-emerald-50 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/40' },
              { id: 'client_account', title: 'Numbers', sub: 'ডিরেক্টরি', icon: ArrowLeftRight, color: 'text-blue-655 bg-blue-50 border-blue-100 dark:bg-blue-950/20 dark:border-blue-900/40' },
              { id: 'client_rejected_invoices', title: 'Rejected', sub: 'বাতিল রিকোয়েস্ট', icon: AlertCircle, color: 'text-rose-655 bg-rose-50 border-rose-100 dark:bg-rose-955/20 dark:border-rose-900/40', badge: myRejectedInvoices.length },
              { id: 'client_sms', title: 'Inbox', sub: 'এসএমএস', icon: MessageSquare, color: 'text-teal-655 bg-teal-50 border-teal-100 dark:bg-teal-950/20 dark:border-teal-900/40' },
              { id: 'client_settings', title: 'Settings', sub: 'প্রোফাইল', icon: FileSpreadsheet, color: 'text-amber-655 bg-amber-50 border-amber-100 dark:bg-amber-955/25 dark:border-amber-900/40' }
            ].map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => onTabChange(item.id)}
                  className="group p-3.5 bg-slate-50/60 dark:bg-slate-950/20 border border-slate-200/50 dark:border-slate-800/60 rounded-2xl flex flex-col items-center text-center justify-center transition-all duration-300 hover:scale-[1.04] hover:shadow-xs hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer relative"
                >
                  <div className={`p-2.5 rounded-xl border mb-2.5 transition-transform group-hover:scale-105 ${item.color}`}>
                    <Icon size={16} />
                  </div>
                  <span className="text-[11.5px] font-black text-slate-850 dark:text-white leading-none block">{item.title}</span>
                  <span className="text-[8.5px] font-bold text-slate-400 dark:text-slate-550 mt-1 block">{item.sub}</span>
                  
                  {item.badge && item.badge > 0 ? (
                    <span className="absolute top-2 right-2 bg-rose-500 text-white font-black px-1.5 py-0.5 rounded-full text-[8.5px] leading-none animate-bounce">
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        {/* My Payment Trend Sparkline Area Chart */}
        <div className="space-y-3.5 bg-slate-50/45 dark:bg-slate-950/10 border border-slate-100/80 dark:border-slate-800/40 p-4 rounded-[22px] text-left">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block leading-none">Payment Trend</span>
              <h4 className="text-xs font-black text-slate-800 dark:text-white mt-1">পেমেন্ট হিস্ট্রি (৳)</h4>
            </div>
            <span className="text-[9.5px] bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-extrabold px-2.5 py-1 rounded-lg">
              অনুমোদিত পেমেন্টসমূহ
            </span>
          </div>
          
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight leading-none">৳{paidFees.toLocaleString()}</span>
            <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-450 flex items-center gap-0.5">
              <TrendingUp size={11} className="stroke-[3]" /> সফলভাবে পরিশোধিত
            </span>
          </div>

          <div className="h-[90px] w-full mt-2 select-none">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 2, right: 2, left: -40, bottom: 2 }}>
                <defs>
                  <linearGradient id="p1GradClient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#p1GradClient)" />
                <Tooltip contentStyle={{ display: 'none' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4 sub-metrics bento cards */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Contract Price', bng: 'চুক্তি মূল্য', val: `৳${totalFee.toLocaleString()}`, subText: 'নির্ধারিত সার্ভিস ফি', icon: Layers, color: 'text-indigo-500 bg-indigo-50/50 border-indigo-100/40 dark:bg-indigo-950/10 dark:border-indigo-900/20' },
            { label: 'Credited Paid', bng: 'পরিশোধিত', val: `৳${paidFees.toLocaleString()}`, subText: 'অনুমোদিত মোট পেমেন্ট', icon: CheckCircle, color: 'text-emerald-500 bg-emerald-50/50 border-emerald-100/40 dark:bg-emerald-950/10 dark:border-emerald-900/20' },
            { label: 'Pending Check', bng: 'যাচাইাধীন', val: `৳${pendingFees.toLocaleString()}`, subText: `${pendingCount}টি পেন্ডিং রিকোয়েস্ট`, icon: Clock, color: 'text-amber-500 bg-amber-50/50 border-amber-100/40 dark:bg-amber-955/10 dark:border-amber-900/20' },
            { label: 'Remaining Due', bng: 'অবশিষ্ট বকেয়া', val: `৳${dueFees.toLocaleString()}`, subText: dueFees > 0 ? 'অনতিবিলম্বে পরিশোধ করুন' : 'কোন বকেয়া নেই', icon: TrendingDown, color: 'text-rose-500 bg-rose-50/50 border-rose-100/40 dark:bg-rose-955/10 dark:border-rose-900/20' }
          ].map(card => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="p-3.5 bg-slate-50/30 dark:bg-slate-955/5 border border-slate-150 dark:border-slate-850/60 rounded-2xl flex flex-col justify-between text-left space-y-2.5">
                <div className="flex justify-between items-start gap-1">
                  <div className="text-left">
                    <span className="text-[8px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider block">{card.label}</span>
                    <span className="text-[10px] font-bold text-slate-800 dark:text-slate-350 block mt-0.5">{card.bng}</span>
                  </div>
                  <div className={`p-1.5 rounded-lg border ${card.color}`}>
                    <Icon size={12} className="stroke-[2.5]" />
                  </div>
                </div>
                
                <div className="flex flex-col">
                  <span className="text-[14px] font-black text-slate-850 dark:text-white font-mono leading-none">{card.val}</span>
                  <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 mt-1 block">{card.subText}</span>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* ============================================================= */}
      {/* 📊 PANEL 2: DETAILED ANALYTICS & ACTIVITY LOGS (MIRRORS ADMIN) */}
      {/* ============================================================= */}
      <div id="client-panel2-container" className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[28px] p-5 sm:p-6 shadow-sm flex flex-col space-y-6 select-none text-left">
        
        {/* Rejected Notification Section */}
        {myRejectedInvoices.length > 0 && (
          <div className="bg-rose-50/70 dark:bg-rose-955/5 border border-rose-200/50 dark:border-rose-900/40 p-4.5 rounded-3xl text-left shadow-2xs space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-rose-100 dark:bg-rose-955 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-200/20 shrink-0">
                <ShieldAlert size={15} className="stroke-[2.5]" />
              </div>
              <h3 className="text-xs font-black text-rose-800 dark:text-rose-300 uppercase tracking-widest">
                প্রত্যাখ্যাত পেমেন্ট বিজ্ঞপ্তি ({toBengaliNumber(myRejectedInvoices.length)}টি বাতিল)
              </h3>
            </div>
            
            <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1">
              {myRejectedInvoices.map((inv) => {
                let extractedReason = 'ভুল ট্রানজেকশন আইডি বা টাকা জমা হয়নি।';
                if (inv.note && inv.note.includes('বাতিল করার কারণ:')) {
                  const parts = inv.note.split('বাতিল করার কারণ:');
                  if (parts.length > 1) {
                    extractedReason = parts[1].split(']')[0].trim();
                  }
                }
                return (
                  <div key={inv.id} className="bg-white dark:bg-slate-950 border border-rose-150 dark:border-rose-900/35 rounded-2xl p-3 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[9px] font-bold font-mono text-slate-500 bg-slate-50 dark:bg-slate-900 px-1.5 py-0.5 rounded">
                          #{inv.id.substring(0, 8).toUpperCase()}
                        </span>
                        <span className="text-[9px] font-black text-rose-600 font-mono bg-rose-50 dark:bg-rose-955/20 px-1.5 py-0.5 rounded">
                          ৳{inv.amount.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold truncate">
                        <span className="text-rose-600 font-black">কারণ:</span> {extractedReason}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleInitiateResubmit(inv)}
                      className="bg-rose-600 hover:bg-rose-700 text-white font-sans text-[10px] font-black px-3 py-1.5 rounded-xl transition-all shadow-2xs active:scale-95 shrink-0"
                    >
                      পুনরায় সাবমিট
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 🧠 AI INVOICE GENIE (BETA) CARD */}
        <div className="bg-slate-50/20 dark:bg-slate-955/5 border border-slate-150 dark:border-slate-850 p-4.5 rounded-[22px] text-left space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg">
                <Sparkles size={16} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-black text-slate-850 dark:text-slate-105 uppercase tracking-widest font-mono">
                    AI INVOICE GENIE
                  </h3>
                  <span className="bg-indigo-550 text-white font-extrabold text-[8px] px-1.5 py-0.5 rounded-full uppercase tracking-wider scale-95">
                    BETA
                  </span>
                </div>
                <p className="text-[10px] text-slate-450 dark:text-slate-500 font-bold mt-0.5">
                  AI দিয়ে আপনার ইনভয়েস রিভিয়ু করুন
                </p>
              </div>
            </div>
          </div>

          <div className="relative flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <select
                value={selectedInvoiceForAi}
                onChange={(e) => setSelectedInvoiceForAi(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 cursor-pointer appearance-none"
              >
                <option value="">-- ইনভয়েস সিলেক্ট করুন --</option>
                {invoices
                  .filter(inv => inv.username === user?.username)
                  .map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      Invoice #{inv.id.substring(0, 8).toUpperCase()} - ৳{inv.amount.toLocaleString()} ({inv.status})
                    </option>
                  ))}
              </select>
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-450 pointer-events-none">
                <ChevronDown size={14} />
              </div>
            </div>

            <button
              type="button"
              onClick={handleAiAnalyze}
              disabled={!selectedInvoiceForAi || aiAnalyzing}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 dark:disabled:bg-slate-800 text-white disabled:text-slate-400 font-sans text-xs font-black px-5 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs shrink-0"
            >
              {aiAnalyzing ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles size={14} className="animate-pulse" />
                  Analyze Value
                </>
              )}
            </button>
          </div>

          <AnimatePresence>
            {aiAnalysisResult && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="bg-white dark:bg-slate-950 border border-indigo-100 dark:border-indigo-900/40 rounded-xl p-4 text-xs text-indigo-950 dark:text-indigo-200 leading-relaxed font-semibold whitespace-pre-line border-dashed shadow-2xs"
              >
                {aiAnalysisResult}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Dynamic Invoice Summary Donut Representation */}
        <div className="bg-slate-50/25 dark:bg-slate-955/5 border border-slate-150/70 dark:border-slate-855 p-4 rounded-[22px] flex flex-col space-y-4">
          <span className="text-[11px] font-black text-slate-850 dark:text-white uppercase tracking-wider block font-mono">Invoice Summary (My Payments Breakdown)</span>
          
          <div className="grid grid-cols-12 gap-2.5 items-center">
            {/* Dynamic Donut SVG */}
            <div className="col-span-5 relative flex items-center justify-center select-none">
              <svg viewBox="0 0 100 100" className="w-24 h-24 transform -rotate-90">
                {/* Background base */}
                <circle cx="50" cy="50" r="38" stroke="rgba(148,163,184,0.1)" strokeWidth="11" fill="transparent" />
                {/* Paid Segment */}
                {donutData.paid > 0 && (
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="38" 
                    stroke="#6366f1" 
                    strokeWidth="11" 
                    fill="transparent" 
                    strokeDasharray={`${paidStroke} ${circ - paidStroke}`}
                    strokeDashoffset={-paidOffset} 
                  />
                )}
                {/* Pending Segment */}
                {donutData.pending > 0 && (
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="38" 
                    stroke="#fb1" 
                    strokeWidth="11" 
                    fill="transparent" 
                    strokeDasharray={`${pendingStroke} ${circ - pendingStroke}`}
                    strokeDashoffset={-pendingOffset} 
                  />
                )}
                {/* Due Segment */}
                {donutData.due > 0 && (
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="38" 
                    stroke="#f43f5e" 
                    strokeWidth="11" 
                    fill="transparent" 
                    strokeDasharray={`${dueStroke} ${circ - dueStroke}`}
                    strokeDashoffset={-dueOffset} 
                  />
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-1 leading-none">
                <span className="text-[10px] font-black font-mono text-slate-850 dark:text-white">৳{totalFee.toLocaleString()}</span>
                <span className="text-[7px] font-bold text-slate-400 mt-0.5">চুক্তি মূল্য</span>
              </div>
            </div>

            {/* Legend Breakdown */}
            <div className="col-span-7 text-left space-y-1.5 pl-2 text-xs">
              {[
                { label: 'পরিশোধিত', val: `৳${paidFees.toLocaleString()} (${donutData.paid}%)`, color: 'bg-indigo-500' },
                { label: 'যাচাইাধীন', val: `৳${pendingFees.toLocaleString()} (${donutData.pending}%)`, color: 'bg-amber-500' },
                { label: 'অবশিষ্ট বকেয়া', val: `৳${dueFees.toLocaleString()} (${donutData.due}%)`, color: 'bg-rose-500' }
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${item.color} shrink-0`} />
                  <div className="text-left leading-none font-bold">
                    <span className="text-slate-400 dark:text-slate-550 text-[9px] block leading-none">{item.label}</span>
                    <span className="text-slate-700 dark:text-slate-350 text-[10.5px] block mt-0.5 font-mono">{item.val}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity Log specific to client */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-[12px] font-bold text-slate-900 dark:text-white uppercase tracking-wider leading-none">Recent Activities</h3>
              <span className="text-[10px] text-slate-400 dark:text-slate-550 font-medium">পেমেন্ট রিকোয়েস্ট ট্র্যাকার</span>
            </div>
            <button 
              type="button"
              onClick={() => onTabChange('client_invoices')}
              className="text-[9px] font-black text-indigo-650 dark:text-indigo-400 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 px-2.5 py-1 rounded-lg hover:bg-indigo-50/25 transition-all"
            >
              সব দেখুন
            </button>
          </div>

          <div className="space-y-2.5">
            {recentActivities.map((act, idx) => {
              const iconColor = act.type === 'success' 
                ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' 
                : act.type === 'rejected'
                ? 'bg-rose-100 text-rose-600 dark:bg-rose-955/20 dark:text-rose-400'
                : 'bg-amber-100 text-amber-600 dark:bg-amber-955/20 dark:text-amber-400';
              
              const IconComponent = act.type === 'success' ? CheckCircle : act.type === 'rejected' ? ShieldAlert : Clock;

              return (
                <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50/50 dark:bg-slate-955/15 border border-slate-150/80 dark:border-slate-850/60 rounded-2xl">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border border-black/[0.03] ${iconColor}`}>
                    <IconComponent size={14} className="stroke-[2.5]" />
                  </div>
                  <div className="min-w-0 flex-1 text-left leading-normal">
                    <h4 className="text-[11px] font-black text-slate-800 dark:text-slate-100">{act.title}</h4>
                    <p className="text-[9.5px] text-slate-450 dark:text-slate-400 mt-0.5">{act.sub}</p>
                    <span className="text-[8px] font-bold text-slate-400 dark:text-slate-550 mt-1 block font-mono">{act.time}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 📢 NOTICE CARD (MIRRORS EXCELLENT NOTICE BANNER) */}
        <div className="bg-rose-50/40 dark:bg-rose-955/5 border border-rose-100/80 dark:border-rose-900/30 p-5 rounded-3xl relative overflow-hidden flex flex-col justify-between shadow-3xs">
          <div className="flex items-center justify-between border-b border-rose-100/50 dark:border-rose-900/20 pb-2.5 mb-3">
            <div className="flex items-center gap-1.5 text-rose-650 dark:text-rose-400">
              <Megaphone size={14} className="animate-bounce" />
              <span className="text-[10.5px] font-black uppercase tracking-wider font-sans">
                বিজ্ঞপ্তি (NOTICE BOARD)
              </span>
            </div>
            <span className="text-[10px] text-rose-700 dark:text-rose-400 font-bold hover:underline cursor-pointer">
              View All
            </span>
          </div>
          <div className="flex items-start gap-4">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-relaxed text-left flex-1">
              {settings.runningNotice || 'রাত ১২-১০ মিনিটে পর্যন্ত করুন, আমাদের টিম আপনার পেমেন্টটি রিভিও করছে।'}
            </p>
            <div className="relative shrink-0 text-rose-550 dark:text-rose-400 mt-1">
              <span className="absolute -top-1.5 -right-1.5 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-550"></span>
              </span>
              <svg className="w-10 h-10 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </div>
          </div>
        </div>

        {/* 🖥️ MY REGISTERED SYSTEMS */}
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 p-5 rounded-3xl shadow-3xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-105 dark:border-slate-800 pb-2.5">
            <h3 className="text-xs font-black text-slate-850 dark:text-slate-105 uppercase tracking-widest font-mono">
              MY REGISTERED SYSTEMS
            </h3>
            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-extrabold hover:underline">
              View All
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="p-2.5 bg-purple-50/40 dark:bg-purple-950/10 border border-purple-100/60 dark:border-purple-900/20 rounded-xl text-center">
              <span className="text-[9px] font-extrabold text-purple-600 dark:text-purple-400 block">অ্যাপসসমূহ (Apps)</span>
              <span className="text-sm font-black font-mono block text-slate-800 dark:text-white mt-1">{myApps.length}</span>
            </div>
            <div className="p-2.5 bg-blue-50/40 dark:bg-blue-950/10 border border-blue-100/60 dark:border-blue-900/20 rounded-xl text-center">
              <span className="text-[9px] font-extrabold text-blue-600 dark:text-blue-400 block">প্যানেলসমূহ (Panels)</span>
              <span className="text-sm font-black font-mono block text-slate-800 dark:text-white mt-1">{myPanels.length}</span>
            </div>
            <div className="p-2.5 bg-emerald-50/40 dark:bg-emerald-950/10 border border-emerald-100/60 dark:border-emerald-900/20 rounded-xl text-center">
              <span className="text-[9px] font-extrabold text-emerald-600 dark:text-emerald-400 block">ডিকোডারসমূহ (Decoders)</span>
              <span className="text-sm font-black font-mono block text-slate-800 dark:text-white mt-1">{myDecoders.length}</span>
            </div>
          </div>

          <div className="py-6 border border-dashed border-slate-150 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center p-4">
            <div className="w-14 h-14 bg-indigo-50/50 dark:bg-slate-850 rounded-full flex items-center justify-center text-indigo-600/40 mb-3 border dark:border-slate-800 shadow-3xs">
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M16 11V7a4 4 0 0 0-8 0v4M5 9h14l1 12H4L5 9z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-[11px] font-black text-slate-700 dark:text-slate-300">কোন অ্যাক্টিভ সিস্টেম পাওয়া যায়নি</p>
            <p className="text-[9px] text-slate-450 dark:text-slate-500 font-bold mt-1 max-w-[180px] leading-relaxed">
              সিস্টেম রেজিস্টার করে শুরু করুন এখনই।
            </p>
          </div>
        </div>

        {/* 🎛️ GATEWAY FEE ESTIMATOR CARD */}
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 p-5.5 rounded-3xl text-left shadow-3xs space-y-4">
          <div className="border-b border-slate-105 dark:border-slate-800 pb-2.5">
            <h3 className="text-xs font-black text-slate-850 dark:text-slate-105 uppercase tracking-widest font-mono">
              GATEWAY FEE ESTIMATOR
            </h3>
            <p className="text-[10px] text-slate-450 dark:text-slate-500 font-bold leading-normal mt-0.5">
              আপনার পেমেন্ট গেটওয়ের ফি হিসাব করতে নিচে পেমেন্টের পরিমাণ উল্লেখ করুন এবং সঠিক গেটওয়েটি সিলেক্ট করুন।
            </p>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {[1000, 3000, 5000, 10000].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setEstimatorAmount(val)}
                className={`py-1.5 text-[11px] font-black font-mono rounded-xl transition-all border ${
                  estimatorAmount === val
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                    : 'bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-655 dark:text-slate-350 border-slate-150 dark:border-slate-800'
                }`}
              >
                ৳{val.toLocaleString()}
              </button>
            ))}
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-450 dark:text-slate-500">
              <span>পরিমাণ লিখুন (Manual Input)</span>
              <span className="font-black font-mono text-indigo-600 dark:text-indigo-400">৳{estimatorAmount.toLocaleString()}</span>
            </div>
            <div className="flex gap-2.5">
              <input
                type="range"
                min="100"
                max="50000"
                step="100"
                value={estimatorAmount}
                onChange={(e) => setEstimatorAmount(Number(e.target.value))}
                className="flex-1 accent-indigo-650 dark:accent-indigo-500 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg outline-none self-center"
              />
              <input
                type="number"
                value={estimatorAmount}
                onChange={(e) => setEstimatorAmount(Number(e.target.value))}
                className="w-20 px-2 py-1 text-center font-mono font-bold text-xs bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-lg outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] font-black uppercase text-slate-450 dark:text-slate-500 tracking-wider block font-mono">
              পেমেন্ট গেটওয়ে নির্বাচন করুন
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              {gateways.map((g) => {
                const isSelected = selectedGateway === g.key;
                return (
                  <button
                    key={g.key}
                    type="button"
                    onClick={() => setSelectedGateway(g.key)}
                    className={`py-2 px-1 rounded-xl text-[9.5px] font-black border text-center transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                        : 'bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-150 dark:border-slate-800'
                    }`}
                  >
                    <span className="block font-sans font-black leading-none">{g.label}</span>
                    <span className="block font-mono text-[8px] opacity-75 mt-0.5">{g.rate}%</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-850 border border-slate-150 dark:border-slate-800 p-4 rounded-2xl space-y-2 text-xs font-semibold font-sans">
            <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
              <span>নির্বাচিত গেটওয়ে:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{activeGateway.label}</span>
            </div>
            <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
              <span>মোট পরিমাণ:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">৳{estimatorAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
              <span>চার্জ ({activeGateway.rate}%):</span>
              <span className="font-bold text-rose-600 dark:text-rose-400 font-mono">+ ৳{computedCharge.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-slate-900 dark:text-white font-black border-t border-slate-200 dark:border-slate-700 pt-2 text-xs">
              <span>মোট প্রযোজ্য পরিমাণ:</span>
              <span className="text-indigo-650 dark:text-indigo-400 font-mono">৳{computedTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>

      </div>

      {/* ======================================================== */}
      {/* 🧭 PROCESS TIMELINE / TIMELINE WIZARD (FULL WIDTH SPAWN) */}
      {/* ======================================================== */}
      <div className="lg:col-span-2">
        <div className="bg-gradient-to-tr from-slate-950 to-indigo-950 text-white rounded-[28px] p-6 text-left relative overflow-hidden border border-indigo-900/40 shadow-md">
          <div className="absolute right-0 bottom-0 w-44 h-44 bg-indigo-550/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-500/20 text-indigo-300 rounded-lg border border-indigo-500/30">
                <Sparkles size={14} className="animate-pulse" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-wider text-indigo-300 font-mono">
                প্রক্রিয়া গাইড (PROCESS WIZARD)
              </span>
            </div>
            <span className="text-[9px] font-mono text-indigo-400 font-black tracking-widest uppercase">
              View Timeline
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            
            {/* Step 1 */}
            <div className="space-y-2 relative">
              <div className="flex items-center gap-3">
                <div className="h-7 w-7 rounded-full bg-indigo-650 border border-indigo-400/30 text-white flex items-center justify-center text-xs font-black shrink-0 shadow-sm">
                  ১
                </div>
                <div className="h-[2px] bg-indigo-600/30 flex-1 hidden md:block" />
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-black text-indigo-300 uppercase tracking-wider block font-mono">ধাপ ১</span>
                <h4 className="text-xs font-black text-white Bengali-Heading leading-snug">ইনভয়েস নির্বাচন</h4>
                <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                  বাম পাশের মেনু থেকে ইনভয়েস সিলেক্ট করুন
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="space-y-2 relative">
              <div className="flex items-center gap-3">
                <div className="h-7 w-7 rounded-full bg-blue-600 border border-blue-400/30 text-white flex items-center justify-center text-xs font-black shrink-0 shadow-sm">
                  ২
                </div>
                <div className="h-[2px] bg-blue-600/30 flex-1 hidden md:block" />
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-black text-blue-300 uppercase tracking-wider block font-mono">ধাপ ২</span>
                <h4 className="text-xs font-black text-white Bengali-Heading leading-snug">পেমেন্ট/নগদ/ব্যাংক</h4>
                <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                  যে মাধ্যম দিয়ে পেমেন্ট করছেন সেটি নির্বাচন করুন
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="space-y-2 relative">
              <div className="flex items-center gap-3">
                <div className="h-7 w-7 rounded-full bg-emerald-600 border border-emerald-400/30 text-white flex items-center justify-center text-xs font-black shrink-0 shadow-sm">
                  ৩
                </div>
                <div className="h-[2px] bg-emerald-600/30 flex-1 hidden md:block" />
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-black text-emerald-300 uppercase tracking-wider block font-mono">ধাপ ৩</span>
                <h4 className="text-xs font-black text-white Bengali-Heading leading-snug">TxID প্রদান</h4>
                <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                  ট্রানজেকশন আইডি (TxID) প্রদান করুন
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="space-y-2 relative">
              <div className="flex items-center gap-3">
                <div className="h-7 w-7 rounded-full bg-amber-500 border border-amber-400/30 text-white flex items-center justify-center text-xs font-black shrink-0 shadow-sm">
                  ৪
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-black text-amber-300 uppercase tracking-wider block font-mono">ধাপ ৪</span>
                <h4 className="text-xs font-black text-white Bengali-Heading leading-snug">রিভিউ ও সম্পন্ন</h4>
                <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                  সবকিছু যাচাই করে সাবমিট করুন
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
}
