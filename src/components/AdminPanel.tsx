import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Activity, 
  FileText, 
  Banknote, 
  Check, 
  X, 
  Clock, 
  CheckCircle, 
  Sparkles, 
  Users, 
  Plus, 
  BarChart3, 
  Search, 
  Mail, 
  Cpu, 
  Layers, 
  RefreshCw,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Pin
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { Modal } from './Modal';
import { CreateAppForm, CreateDecoderForm, CreatePanelForm, CreateUserForm } from './CreateForms';
import { InvoiceTemplate } from './InvoiceTemplate';
import { CompanySettings } from '../types';

interface AdminPanelProps {
  user: any;
  currentUserData: any;
  settings: any;
  invoices: any[];
  investments: any[];
  activities: any[];
  totalUsersCount: number;
  stats: {
    totalRevenue: number;
    dueBalance: number;
    totalInvestment: number;
    netProfit: number;
    pendingInvoicesCount: number;
  };
  salesBreakdown: any[];
  healthScore: number;
  dailyRevenueData: { data: any[] };
  chartMetricMode: 'daily' | 'cumulative' | 'profit';
  setChartMetricMode: (mode: 'daily' | 'cumulative' | 'profit') => void;
  chartVisualType: 'bar' | 'area' | 'line';
  setChartVisualType: (type: 'bar' | 'area' | 'line') => void;
  isProcessingApproval: string | null;
  handleRejectRequest: (inv: any) => void;
  handleApproveRequest: (inv: any) => void;
  localCountryCodes: any[];
  directInvoiceNum: string;
  setDirectInvoiceNum: (num: string) => void;
  directInvoiceType: string;
  setDirectInvoiceType: (type: string) => void;
  directInvoiceCustomerName: string;
  setDirectInvoiceCustomerName: (name: string) => void;
  directInvoiceCountryCode: string;
  setDirectInvoiceCountryCode: (code: string) => void;
  directInvoicePhone: string;
  setDirectInvoicePhone: (phone: string) => void;
  directInvoicePaymentMethod: string;
  setDirectInvoicePaymentMethod: (method: string) => void;
  directInvoiceTxnId: string;
  setDirectInvoiceTxnId: (id: string) => void;
  directInvoiceAmount: string;
  setDirectInvoiceAmount: (amt: string) => void;
  directInvoicePaid: string;
  setDirectInvoicePaid: (paid: string) => void;
  directInvoiceDue: string;
  setDirectInvoiceDue: (due: string) => void;
  directInvoiceNote: string;
  setDirectInvoiceNote: (note: string) => void;
  isDirectInvoiceSaving: boolean;
  handleCreateDirectInvoiceSubmit: (e: React.FormEvent) => void;
  handleDirectInvoiceAmountChange: (val: string, type: 'amount' | 'paid') => void;
  selectedUserInvoice: any;
  setSelectedUserInvoice: (inv: any) => void;
  showInvoicePreviewModal: boolean;
  setShowInvoicePreviewModal: (show: boolean) => void;
  handleUserDownloadInvoice: (inv: any) => void;
  isUserGeneratingPdf: boolean;
  approvedNotificationModal: any;
  setApprovedNotificationModal: (val: any) => void;
  adminNotes: string;
  setAdminNotes: (notes: string) => void;
  notesSaveSuccess: boolean;
  setNotesSaveSuccess: (success: boolean) => void;
  handleCreateSuccess: () => void;
  t: (key: string) => string;
  activeModal: any;
  setActiveModal: (modal: any) => void;
}

export function AdminPanel({
  user,
  currentUserData,
  settings,
  invoices,
  investments,
  activities,
  totalUsersCount,
  stats,
  salesBreakdown,
  healthScore,
  dailyRevenueData,
  chartMetricMode,
  setChartMetricMode,
  chartVisualType,
  setChartVisualType,
  isProcessingApproval,
  handleRejectRequest,
  handleApproveRequest,
  localCountryCodes,
  directInvoiceNum,
  setDirectInvoiceNum,
  directInvoiceType,
  setDirectInvoiceType,
  directInvoiceCustomerName,
  setDirectInvoiceCustomerName,
  directInvoiceCountryCode,
  setDirectInvoiceCountryCode,
  directInvoicePhone,
  setDirectInvoicePhone,
  directInvoicePaymentMethod,
  setDirectInvoicePaymentMethod,
  directInvoiceTxnId,
  setDirectInvoiceTxnId,
  directInvoiceAmount,
  setDirectInvoiceAmount,
  directInvoicePaid,
  setDirectInvoicePaid,
  directInvoiceDue,
  setDirectInvoiceDue,
  directInvoiceNote,
  setDirectInvoiceNote,
  isDirectInvoiceSaving,
  handleCreateDirectInvoiceSubmit,
  handleDirectInvoiceAmountChange,
  selectedUserInvoice,
  setSelectedUserInvoice,
  showInvoicePreviewModal,
  setShowInvoicePreviewModal,
  handleUserDownloadInvoice,
  isUserGeneratingPdf,
  approvedNotificationModal,
  setApprovedNotificationModal,
  adminNotes,
  setAdminNotes,
  notesSaveSuccess,
  setNotesSaveSuccess,
  handleCreateSuccess,
  t,
  activeModal,
  setActiveModal
}: AdminPanelProps) {
  const [adminActiveTab, setAdminActiveTab] = useState<'overview' | 'approvals' | 'create_invoice' | 'records' | 'notes'>('overview');
  const [adminLogSearch, setAdminLogSearch] = useState('');
  const [adminInvoiceSearch, setAdminInvoiceSearch] = useState('');
  const [activeInlineForm, setActiveInlineForm] = useState<'app' | 'decoder' | 'panel' | 'user' | 'create_invoice_direct'>('create_invoice_direct');
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);

  // Breathtaking Futuristic Slate & Deep Indigo Premium Theme
  return (
    <div className="space-y-7 pb-16 font-sans text-slate-800 dark:text-slate-100 animate-fade-in text-left">
      
      {/* 🌟 Simple and Elegant Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/60 dark:border-slate-800/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>{currentUserData?.name || user?.name || 'এডমিন ড্যাশবোর্ড'}</span>
            <span className="text-lg sm:text-xl">👋</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium leading-relaxed">
            কোম্পানির লেনদেন, চালান অনুমোদন এবং গ্রাহক লাইসেন্স পরিচালনা ও পর্যবেক্ষণ করুন।
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Active Status Badge */}
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 dark:bg-slate-900 text-slate-650 dark:text-slate-400 text-xs font-bold rounded-full border border-slate-200 dark:border-slate-800">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
            <span>সিস্টেম অনলাইন (System Active)</span>
          </div>
        </div>
      </div>

      {/* 🚀 Sleek Swiss Capsule Navigation Bar */}
      <div className="bg-slate-50/65 dark:bg-slate-900/40 p-3 sm:p-4 rounded-3xl border border-slate-200/50 dark:border-slate-800/55 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.03)] mb-4 flex flex-col md:flex-row gap-2 items-stretch md:items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 w-full">
          {[
            { id: 'overview', label: 'OVERVIEW', bng: 'সংक्षिप्त বিবরণী', icon: BarChart3 },
            { id: 'approvals', label: 'APPROVALS', bng: 'লেনদেন অনুমোদন', icon: CheckCircle, badge: invoices.filter(inv => inv.status === 'pending').length },
            { id: 'create_invoice', label: 'INVOICE CREATOR', bng: 'ইনভয়েস ফ্যাক্টরি', icon: Plus },
            { id: 'records', label: 'LEDGERS & LOGS', bng: 'খতিয়ান ও লগ', icon: FileText },
            { id: 'notes', label: 'MEMO NOTEPAD', bng: 'ব্যক্তিগত নোট', icon: Layers },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = adminActiveTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setAdminActiveTab(tab.id as any)}
                className={`flex-1 sm:flex-initial flex items-center gap-3.5 px-5 py-4 rounded-2xl transition-all duration-200 cursor-pointer text-left border ${
                  isActive 
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-[0_4px_16px_-3px_rgba(99,102,241,0.08)] border-slate-200 dark:border-slate-700/85 scale-[1.03]' 
                    : 'text-slate-450 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-white/40 dark:hover:bg-slate-900/35 border-transparent'
                }`}
              >
                <div className={`p-2 rounded-xl shrink-0 ${isActive ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400' : 'bg-slate-100/50 dark:bg-slate-900/20 text-slate-400 dark:text-slate-505'}`}>
                  <Icon size={16} />
                </div>
                <div className="flex flex-col leading-tight text-left min-w-0">
                  <span className={`text-[10.5px] uppercase tracking-wider block font-black ${isActive ? 'text-slate-900 dark:text-white font-black' : 'text-slate-500 dark:text-slate-400 font-bold'}`}>{tab.label}</span>
                  <span className="text-[8.5px] font-semibold text-slate-400 dark:text-slate-500 mt-1 block truncate">{tab.bng}</span>
                </div>
                {tab.badge && tab.badge > 0 ? (
                  <span className="bg-rose-500 text-white font-extrabold px-1.5 py-0.5 rounded-full text-[9px] font-mono leading-none animate-bounce shrink-0 shadow-xs ml-2">
                    {tab.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content Cases */}
      {adminActiveTab === 'overview' && (
        <div className="space-y-7 animate-fade-in text-left">
          
          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4.5">
            {[
              { 
                id: 'totalRevenue', 
                val: `৳${stats.totalRevenue.toLocaleString()}`, 
                label: 'Total Revenue', 
                bng: 'মোট সংগ্রহ (Credited Paid)', 
                icon: Banknote, 
                bgClass: 'bg-gradient-to-br from-emerald-50/70 via-white to-emerald-100/20 dark:from-slate-900/40 dark:via-slate-900 dark:to-emerald-955/20',
                borderClass: 'border-emerald-150 dark:border-slate-800',
                hoverClass: 'hover:border-emerald-350 dark:hover:border-emerald-900',
                iconBgClass: 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-450 border border-emerald-100/30 dark:border-emerald-900/30',
                desc: 'মোট অর্জিত ও সফল পেমেন্ট সংগ্রহ ভলিউম।',
                pulseClass: 'bg-emerald-500'
              },
              { 
                id: 'totalInvestment', 
                val: `৳${stats.totalInvestment.toLocaleString()}`, 
                label: 'total expenses', 
                bng: 'মোট খরচ/ইনভেস্ট (Expenses Paid)', 
                icon: TrendingDown, 
                bgClass: 'bg-gradient-to-br from-rose-50/70 via-white to-rose-100/20 dark:from-slate-900/40 dark:via-slate-900 dark:to-rose-955/20',
                borderClass: 'border-rose-150 dark:border-slate-800',
                hoverClass: 'hover:border-rose-350 dark:hover:border-rose-905',
                iconBgClass: 'bg-rose-50 dark:bg-rose-950 text-rose-650 dark:text-rose-450 border border-rose-100/30 dark:border-rose-900/40',
                desc: 'হার্ডওয়্যার, এপিআই, সার্ভার ও লস ইনভেস্ট।',
                pulseClass: 'bg-rose-500'
              },
              { 
                id: 'netProfit', 
                val: `৳${stats.netProfit.toLocaleString()}`, 
                label: 'Net Profit (85%)', 
                bng: 'প্রকৃত লাভ হিসেব (Net Revenue)', 
                icon: TrendingUp, 
                bgClass: 'bg-gradient-to-br from-indigo-50/70 via-white to-indigo-100/20 dark:from-slate-900/40 dark:via-slate-900 dark:to-indigo-955/20',
                borderClass: 'border-indigo-150 dark:border-slate-800',
                hoverClass: 'hover:border-indigo-350 dark:hover:border-indigo-900',
                iconBgClass: 'bg-indigo-50 dark:bg-indigo-950 text-indigo-650 dark:text-indigo-400 border border-indigo-100/30 dark:border-indigo-900/30',
                desc: '৮৫% ওনারশিপ প্রফিট শেয়ারিং পুল ফান্ড।',
                pulseClass: 'bg-indigo-550 animate-pulse'
              },
              { 
                id: 'dueBalance', 
                val: `৳${stats.dueBalance.toLocaleString()}`, 
                label: 'Due Balance', 
                bng: 'বকেয়া পাওনা বিল (Remaining Due)', 
                icon: Activity, 
                bgClass: 'bg-gradient-to-br from-amber-50/70 via-white to-amber-100/20 dark:from-slate-900/40 dark:via-slate-900 dark:to-amber-955/20',
                borderClass: 'border-amber-150 dark:border-slate-800',
                hoverClass: 'hover:border-amber-350 dark:hover:border-amber-900',
                iconBgClass: 'bg-amber-50 dark:bg-amber-955 text-amber-750 dark:text-amber-450 border border-amber-100/30 dark:border-amber-900/40',
                desc: 'গ্রাহকদের নিকট কোম্পানির মোট বকেয়া পাওনা।',
                pulseClass: 'bg-amber-500 animate-pulse'
              },
              { 
                id: 'totalUsers', 
                val: `${totalUsersCount} জন`, 
                label: 'Total Customers', 
                bng: 'নিবন্ধিত গ্রাহক (Registered Clients)', 
                icon: Users, 
                bgClass: 'bg-gradient-to-br from-sky-50/70 via-white to-sky-100/20 dark:from-slate-900/40 dark:via-slate-900 dark:to-sky-955/20',
                borderClass: 'border-sky-150 dark:border-slate-800',
                hoverClass: 'hover:border-sky-350 dark:hover:border-sky-900',
                iconBgClass: 'bg-sky-50 dark:bg-sky-955 text-sky-700 dark:text-sky-450 border border-sky-100/30 dark:border-sky-900/40',
                desc: 'সিস্টেমে মোট সক্রিয় ও ভেরিফাইড গ্রাহক।',
                pulseClass: 'bg-sky-500'
              }
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div 
                  key={stat.id} 
                  className={`relative overflow-hidden ${stat.bgClass} border ${stat.borderClass} p-5 rounded-2xl shadow-3xs hover:shadow-xs transition-all duration-300 hover:scale-[1.015] ${stat.hoverClass} text-left flex flex-col justify-between min-h-[160px]`}
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="space-y-1">
                      <span className="text-[9.5px] font-black uppercase text-indigo-500/80 dark:text-indigo-400 tracking-widest block leading-none font-sans">
                        {stat.label}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block">{stat.bng}</span>
                    </div>
                    <span className={`p-2 rounded-xl shrink-0 ${stat.iconBgClass}`}>
                      <Icon size={17} className="stroke-[2.5]" />
                    </span>
                  </div>
                  
                  <div className="mt-4">
                    <h3 className="text-xl sm:text-2xl font-black text-slate-855 dark:text-white font-mono tracking-tight leading-none">
                      {stat.val}
                    </h3>
                  </div>

                  <div className="mt-4 flex items-center gap-1.5 text-[9.5px] font-bold text-slate-500 dark:text-slate-400 border-t border-slate-100/60 dark:border-slate-850 pt-2.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${stat.pulseClass}`} />
                    <span>{stat.desc}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 📊 Interactive Analytical Intelligence Deck */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
            
            {/* Left Deck: Dynamic Analytics Chart (takes 2 columns) */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 shadow-3xs flex flex-col justify-between text-left">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-4 mb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-100/40 dark:border-indigo-900/30">
                      <BarChart3 size={17} />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">আয় ও লাভ বিশ্লেষণ গ্রাফ (Revenue Analytics)</h3>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">কোম্পানির মোট আয় এবং লাভ লেন্সের তুলনামূলক চিত্রঃ</p>
                    </div>
                  </div>

                  {/* High-End Swiss Style Visual Controls */}
                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    {/* Metric Selectors */}
                    <div className="bg-slate-55 dark:bg-slate-950 p-1 rounded-xl border border-slate-200/50 dark:border-slate-800/60 flex items-center gap-0.5">
                      {[
                        { id: 'daily', label: 'দৈনিক আয়' },
                        { id: 'cumulative', label: 'ক্রমবর্ধমান' },
                        { id: 'profit', label: 'লাভ (৮৫%)' }
                      ].map(btn => (
                        <button
                          key={btn.id}
                          type="button"
                          onClick={() => setChartMetricMode(btn.id as any)}
                          className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black transition-all cursor-pointer ${
                            chartMetricMode === btn.id
                              ? 'bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-xs border border-slate-100/80 dark:border-slate-700/50 scale-[1.02] font-black'
                              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-250 font-bold'
                          }`}
                        >
                          {btn.label}
                        </button>
                      ))}
                    </div>

                    {/* Chart Style Switchers */}
                    <div className="bg-slate-55 dark:bg-slate-950 p-1 rounded-xl border border-slate-200/50 dark:border-slate-800/60 flex items-center gap-0.5">
                      {[
                        { id: 'area', label: 'এরিয়া' },
                        { id: 'bar', label: 'বার' },
                        { id: 'line', label: 'লাইন' }
                      ].map(btn => (
                        <button
                          key={btn.id}
                          type="button"
                          onClick={() => setChartVisualType(btn.id as any)}
                          className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black transition-all cursor-pointer ${
                            chartVisualType === btn.id
                              ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-xs font-black'
                              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-250 font-bold'
                          }`}
                        >
                          {btn.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Main Graph Area */}
                <div className="h-[250px] w-full pt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    {chartVisualType === 'bar' ? (
                      <BarChart data={dailyRevenueData.data} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f2937" opacity={0.08} />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} dy={8} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} dx={-4} />
                        <Tooltip 
                          cursor={{ fill: 'rgba(99, 102, 241, 0.03)', radius: 4 }}
                          contentStyle={{ borderRadius: '12px', backgroundColor: '#0f172a', color: '#ffffff', border: 'none', padding: '10px 12px', fontSize: '11px', fontWeight: 'bold' }}
                        />
                        <Bar dataKey={chartMetricMode === 'daily' ? 'revenue' : chartMetricMode === 'cumulative' ? 'cumulative' : 'profit'} fill="#4f46e5" radius={[4, 4, 0, 0]} maxBarSize={20}>
                          {dailyRevenueData.data.map((entry: any, index: number) => {
                            const val = chartMetricMode === 'daily' ? entry.revenue : chartMetricMode === 'cumulative' ? entry.cumulative : entry.profit;
                            return <Cell key={`cell-${index}`} fill={val > 0 ? (chartMetricMode === 'profit' ? '#10b981' : '#4f46e5') : '#e2e8f0'} />;
                          })}
                        </Bar>
                      </BarChart>
                    ) : chartVisualType === 'area' ? (
                      <AreaChart data={dailyRevenueData.data} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={chartMetricMode === 'profit' ? '#10b981' : '#6366f1'} stopOpacity={0.2}/>
                            <stop offset="95%" stopColor={chartMetricMode === 'profit' ? '#10b981' : '#6366f1'} stopOpacity={0.0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f2937" opacity={0.08} />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} dy={8} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} dx={-4} />
                        <Tooltip contentStyle={{ borderRadius: '12px', backgroundColor: '#0f172a', color: '#ffffff', border: 'none', padding: '10px 12px', fontSize: '11px', fontWeight: 'bold' }} />
                        <Area type="monotone" dataKey={chartMetricMode === 'daily' ? 'revenue' : chartMetricMode === 'cumulative' ? 'cumulative' : 'profit'} stroke={chartMetricMode === 'profit' ? '#10b981' : '#6366f1'} strokeWidth={2.5} fillOpacity={1} fill="url(#colorMetric)" />
                      </AreaChart>
                    ) : (
                      <LineChart data={dailyRevenueData.data} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f2937" opacity={0.08} />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} dy={8} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} dx={-4} />
                        <Tooltip contentStyle={{ borderRadius: '12px', backgroundColor: '#0f172a', color: '#ffffff', border: 'none', padding: '10px 12px', fontSize: '11px', fontWeight: 'bold' }} />
                        <Line type="monotone" dataKey={chartMetricMode === 'daily' ? 'revenue' : chartMetricMode === 'cumulative' ? 'cumulative' : 'profit'} stroke={chartMetricMode === 'profit' ? '#10b981' : '#6366f1'} strokeWidth={3} dot={{ r: 2.5, fill: '#6366f1', strokeWidth: 1.5 }} />
                      </LineChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Right Deck: Circular Health Index & Revenue Contribution Shares */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 shadow-3xs flex flex-col justify-between text-left">
              <div>
                <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
                  <div className="p-2.5 bg-amber-50 dark:bg-amber-955/20 text-amber-600 dark:text-amber-450 rounded-xl border border-amber-100/40 dark:border-amber-900/30">
                    <Activity size={16} />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">কোম্পানি হেলথ ও সার্ভিস শেয়ার</h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">আর্থিক প্রবাহ নিরাপত্তা সূচক ও প্রোডাক্ট কন্ট্রিবিউশনঃ</p>
                  </div>
                </div>

                {/* Animated SVG Circle Progress Gauge */}
                <div className="flex items-center gap-4.5 p-3.5 bg-slate-50/60 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850/50 rounded-2xl mb-5">
                  <div className="relative shrink-0 flex items-center justify-center">
                    <svg className="w-14 h-14 transform -rotate-90">
                      <circle cx="28" cy="28" r="23" className="stroke-slate-250 dark:stroke-slate-800" strokeWidth="4.5" fill="transparent" />
                      <circle 
                        cx="28" 
                        cy="28" 
                        r="23" 
                        className={`transition-all duration-700 ease-out ${
                          healthScore >= 80 
                            ? 'stroke-emerald-500' 
                            : healthScore >= 55 
                              ? 'stroke-amber-500' 
                              : 'stroke-rose-500'
                        }`} 
                        strokeWidth="4.5" 
                        fill="transparent" 
                        strokeDasharray={2 * Math.PI * 23} 
                        strokeDashoffset={2 * Math.PI * 23 * (1 - healthScore / 100)} 
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute text-[11px] font-black text-slate-800 dark:text-white font-mono">{healthScore}%</span>
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <span className={`inline-block text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full mb-1 border ${
                      healthScore >= 80 
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-500/10' 
                        : healthScore >= 55 
                          ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-500/10' 
                          : 'bg-rose-50 dark:bg-rose-950/40 text-rose-650 dark:text-rose-400 border-rose-500/15'
                    }`}>
                      {healthScore >= 80 ? 'Excellent Status' : healthScore >= 55 ? 'Moderate Flow' : 'Risk Attention'}
                    </span>
                    <p className="text-[9.5px] text-slate-500 dark:text-slate-400 leading-normal font-semibold">
                      মোট সংগ্রহ বনাম বকেয়া অনুপাতে লাইভ হেলথ সূচক।
                    </p>
                  </div>
                </div>

                {/* Progress Contribution Share List */}
                <div className="space-y-3.5">
                  {salesBreakdown && salesBreakdown.length > 0 ? (
                    salesBreakdown.map((item) => (
                      <div key={item.name} className="space-y-1 text-left">
                        <div className="flex justify-between items-center text-[10.5px]">
                          <span className="font-bold text-slate-700 dark:text-slate-300">{item.bangla}</span>
                          <div className="font-mono font-bold text-slate-500 dark:text-slate-400">
                            <span className="text-[10px] text-slate-800 dark:text-white font-extrabold">৳{item.value.toLocaleString()}</span>
                            <span className="text-[8.5px] ml-1 opacity-75">({item.percentage}%)</span>
                          </div>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden">
                          <div className={`h-full ${item.color} rounded-full transition-all duration-500`} style={{ width: `${item.percentage}%` }} />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-[10px] text-slate-400 text-center py-2">কোনো ব্রেকডাউন ডাটা নেই।</div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-5 text-[9px] text-slate-500 dark:text-slate-400 font-bold leading-normal text-left">
                💡 {healthScore >= 80 ? 'অর্থপ্রবাহ চমৎকার ও নিরাপদ। বকেয়া আদায় সন্তোষজনক।' : 'বকেয়া বিল আদায়ে পেন্ডিং কাস্টমার রিকভারি তাগিদ দিন।'}
              </div>
            </div>

          </div>

          {/* Side-by-Side Decks: Overview & Activity Logs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
            
            {/* Left Deck: Recent Paid Bills */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 shadow-3xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-indigo-50/70 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-100/40 dark:border-indigo-900/30">
                      <FileText size={16} />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">সাম্প্রতিক সফল লেনদেন (Recent Paid Bills)</h3>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">সর্বশেষ ৫টি পরিশোধিত চালানের তালিকাঃ</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {invoices.filter(i => i.status === 'approved').slice(0, 5).length > 0 ? (
                    invoices.filter(i => i.status === 'approved').slice(0, 5).map((inv) => (
                      <div key={inv.id} className="flex items-center justify-between p-3 bg-slate-5/50 dark:bg-slate-950/20 border border-slate-100/60 dark:border-slate-850/50 rounded-xl hover:border-slate-200 dark:hover:border-slate-800 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-indigo-100/50 dark:bg-indigo-950/20 text-indigo-650 dark:text-indigo-400 font-bold text-xs uppercase flex items-center justify-center shrink-0 border border-indigo-100/10">
                            {inv.customerName?.substring(0, 2).toUpperCase() || 'CU'}
                          </div>
                          <div className="min-w-0 text-left">
                            <h4 className="text-[11.5px] font-bold text-slate-800 dark:text-slate-200 truncate leading-tight">{inv.customerName}</h4>
                            <p className="text-[9px] text-slate-405 font-mono mt-0.5 uppercase truncate tracking-wider">#{inv.id?.substring(0, 8) || 'DOC-F'}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0 pl-2">
                          <span className="text-[11px] font-mono font-extrabold text-indigo-650 dark:text-indigo-400 block leading-tight">৳{inv.amount?.toLocaleString()}</span>
                          <span className="text-[8.5px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/45 border border-emerald-100/50 dark:border-emerald-900/30 px-2 py-0.5 rounded-full mt-1 inline-block uppercase tracking-wider scale-90">PAID</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs italic border border-dashed border-slate-200/50 dark:border-slate-800 rounded-xl">
                      কোনো সফল চালানের ইতিহাস পাওয়া যায়নি।
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-5 border-t border-slate-100 dark:border-slate-800 mt-5 flex justify-end font-sans">
                <button 
                  type="button" 
                  onClick={() => setAdminActiveTab('records')}
                  className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 hover:text-indigo-850 flex items-center gap-1 uppercase tracking-wider transition-colors cursor-pointer"
                >
                  <span>সব চালান বিস্তারিত দেখুন</span>
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>

            {/* Right Deck: Recent Admin Activity Logs */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 shadow-3xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-450 rounded-xl border border-amber-100/40 dark:border-amber-900/30">
                      <Layers size={16} />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">সাম্প্রতিক অ্যাক্টিভিটি লগ (Admin Logs)</h3>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">নিবন্ধিত এডমিনদের সর্বশেষ ৫টি কাজের বিবরণীঃ</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {activities.slice(0, 5).length > 0 ? (
                    activities.slice(0, 5).map((log) => {
                      const rawUser = log.user || 'admin@master';
                      const cleanUser = rawUser.split('@')[0];
                      return (
                        <div key={log.id} className="flex gap-3 text-left">
                          <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-650 dark:text-amber-400 text-[10px] font-bold uppercase flex items-center justify-center shrink-0 border border-amber-100/30 dark:border-amber-900/30">
                            {cleanUser.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1 text-left">
                            <p className="text-[11.5px] font-semibold text-slate-700 dark:text-slate-300 leading-normal select-all">
                              {log.message}
                            </p>
                            <div className="flex items-center gap-2 mt-1 text-[8.5px] text-slate-400 dark:text-slate-500 font-mono font-bold uppercase pointer-events-none">
                              <span className="bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded">{cleanUser}</span>
                              <span>•</span>
                              <span>{new Date(log.timestamp).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs italic border border-dashed border-slate-200/50 dark:border-slate-800 rounded-xl">
                      কোনো লগ রেকর্ড খুঁজে পাওয়া যায়নি।
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-5 border-t border-slate-100 dark:border-slate-800 mt-5 flex justify-end font-sans">
                <button 
                  type="button" 
                  onClick={() => setAdminActiveTab('records')}
                  className="text-[10px] font-extrabold text-amber-650 dark:text-amber-400 hover:text-amber-800 flex items-center gap-1 uppercase tracking-wider transition-colors cursor-pointer"
                >
                  <span>সব অ্যাক্টিভিটি লগ দেখুন</span>
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Tab: approvals (Clearance) */}
      {adminActiveTab === 'approvals' && (
        <div className="space-y-4 animate-fade-in text-left">
          <div className="bg-white border border-slate-150 rounded-2xl p-5 sm:p-6 shadow-2xs">
            <div className="pb-3 border-b border-slate-100 mb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 uppercase">
                  <CheckCircle size={14} className="text-emerald-500" />
                  পেন্ডিং পেমেন্ট পোর্টালে যাচাই ও এপ্রুভাল রিকোয়েস্ট ({invoices.filter(inv => inv.status === 'pending').length} পেন্ডিং)
                </h3>
                <p className="text-[11px] text-slate-500 font-sans mt-0.5">কাস্টমার কর্তৃক ব্যাংক বা মোবাইল ফাইনান্সিয়াল পেমেন্ট রিসিভ মিলিয়ে সচল করে দিনঃ</p>
              </div>
            </div>

            {invoices.filter(i => i.status === 'pending').length === 0 ? (
              <div className="py-12 text-center rounded-xl bg-slate-50 border border-slate-150 border-dashed">
                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3.5 border border-emerald-100">
                  <CheckCircle size={18} />
                </div>
                <h4 className="text-xs font-bold text-slate-800 uppercase">সব পেমেন্ট অনুমোদিত!</h4>
                <p className="text-[10.5px] text-slate-500 mt-1">পেন্ডিং এই মুহূর্তে কোনো পোর্টালে জমা নেই।</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {invoices.filter(i => i.status === 'pending').map((inv) => (
                  <div key={inv.id} className="bg-white border border-slate-150 rounded-xl p-4 flex flex-col justify-between hover:border-slate-300 transition-colors shadow-2xs">
                    <div>
                      <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                        <span className="text-[9.5px] font-mono bg-slate-100 text-slate-650 px-2 py-0.5 rounded font-bold uppercase border border-slate-150/70">
                          #{inv.id?.substring(0, 8).toUpperCase()}
                        </span>
                        <span className="text-[9px] text-slate-400 font-bold font-mono">{inv.date}</span>
                      </div>

                      <div className="space-y-2.5 text-xs">
                        <div>
                          <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">গ্রাহকের নাম</span>
                          <strong className="text-slate-750 font-bold text-slate-850">{inv.customerName}</strong>
                          <span className="text-[10px] text-indigo-650 font-bold block">@{inv.username}</span>
                        </div>

                        <div>
                          <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">ক্যাটাগরি / উদ্দেশ্য</span>
                          <span className="font-bold text-slate-700">{inv.type || 'Wallet Top-Up'}</span>
                          {inv.appName && <p className="text-[9.5px] text-slate-450 italic mt-0.5">App: {inv.appName}</p>}
                        </div>

                        {/* Transaction Receipt style bar */}
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-150 flex justify-between items-center text-xs">
                          <div>
                            <span className="text-[8.5px] text-slate-400 font-bold uppercase block">মেথড / TxID</span>
                            <span className="font-bold text-slate-700 block mt-0.5">{inv.paymentMethod}</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[9px] text-slate-600 font-mono bg-white px-1.5 py-0.5 rounded border select-all font-bold">
                                {inv.transactionId || 'No TxID'}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-[8.5px] text-slate-400 font-bold uppercase block">অ্যামাউন্ট</span>
                            <span className="text-sm font-extrabold text-indigo-750 font-mono">৳{(inv.amount || 0).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        disabled={isProcessingApproval !== null}
                        onClick={() => handleRejectRequest(inv)}
                        className="flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        রিজেক্ট
                      </button>
                      <button
                        type="button"
                        disabled={isProcessingApproval !== null}
                        onClick={() => handleApproveRequest(inv)}
                        className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold uppercase shadow-2xs transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1"
                      >
                        {isProcessingApproval === inv.id ? (
                          <>
                            <RefreshCw size={10} className="animate-spin" />
                            প্রসেস...
                          </>
                        ) : (
                          <>
                            <Check size={10} />
                            অনুমোদন
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: create_invoice (Invoice Factory) */}
      {adminActiveTab === 'create_invoice' && (
        <div className="bg-white border border-slate-150 rounded-2xl p-5 sm:p-6 shadow-2xs text-left text-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-5">
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase flex items-center gap-1.5">
                <Sparkles size={14} className="text-indigo-600" />
                চালান নির্মাতা ও কনস্ট্রাকশন হাব (Invoice Factory)
              </h3>
              <p className="text-[11px] text-slate-505 font-sans mt-0.5">যে কোনো ইনভয়েস বিল ড্রাফট করে সরাসরি সিস্টেমে রিলিজ করতে টাইপ সিলেক্ট করুনঃ</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200/60 w-full md:w-auto">
              {[
                { id: 'create_invoice_direct', label: 'সাধারণ বিল' },
                { id: 'app', label: 'অ্যাপ প্যাক' },
                { id: 'decoder', label: 'ডিকোডার' },
                { id: 'panel', label: 'রিসেলার' },
                { id: 'user', label: 'নতুন ইউজার' },
              ].map((btn) => (
                <button
                  key={btn.id}
                  type="button"
                  onClick={() => setActiveInlineForm(btn.id as any)}
                  className={`flex-1 md:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeInlineForm === btn.id
                      ? 'bg-slate-900 text-white shadow-3xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
            {activeInlineForm === 'create_invoice_direct' ? (
              <form onSubmit={handleCreateDirectInvoiceSubmit} className="space-y-4 text-left font-sans text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Invoice ID / Number</label>
                    <input
                      type="text"
                      required
                      value={directInvoiceNum}
                      onChange={(e) => setDirectInvoiceNum(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-500 text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Service category</label>
                    <select
                      value={directInvoiceType}
                      onChange={(e) => setDirectInvoiceType(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none text-xs font-bold cursor-pointer font-sans"
                    >
                      <option value="Apps">Android Apps</option>
                      <option value="Decoder">Decoder Package</option>
                      <option value="Panel">Reseller Panel</option>
                      <option value="User">User Account</option>
                      <option value="Finance">General Service</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Customer Name (গ্রাহকের নাম)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Abdur Rahman"
                    value={directInvoiceCustomerName}
                    onChange={(e) => setDirectInvoiceCustomerName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-500 text-xs font-semibold"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Country</label>
                    <select
                      value={directInvoiceCountryCode}
                      onChange={(e) => setDirectInvoiceCountryCode(e.target.value)}
                      className="w-full px-2 py-2 bg-white border border-slate-200 rounded-lg outline-none text-xs font-bold cursor-pointer font-sans"
                    >
                      {localCountryCodes.map((c) => (
                        <option key={c.code} value={c.code}>{c.label} {c.code}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Phone Number</label>
                    <input
                      type="tel"
                      required
                      placeholder="17XXXXXXXX"
                      value={directInvoicePhone}
                      onChange={(e) => setDirectInvoicePhone(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-500 text-xs font-semibold font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Payment Method</label>
                    <select
                      value={directInvoicePaymentMethod}
                      onChange={(e) => setDirectInvoicePaymentMethod(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none text-xs font-semibold cursor-pointer font-sans"
                    >
                      <option value="bKash">bKash</option>
                      <option value="Nagad">Nagad</option>
                      <option value="Rocket">Rocket</option>
                      <option value="Upay">Upay</option>
                      <option value="CellFin">CellFin</option>
                      <option value="Bank">Bank Transfer</option>
                      <option value="Binance">Binance (USDT)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Transaction ID</label>
                    <input
                      type="text"
                      required
                      placeholder="TXN-XXXXXX"
                      value={directInvoiceTxnId}
                      onChange={(e) => setDirectInvoiceTxnId(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-500 text-xs font-semibold font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Fee (টাকা)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      placeholder="0"
                      value={directInvoiceAmount}
                      onChange={(e) => handleDirectInvoiceAmountChange(e.target.value, 'amount')}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-500 text-xs font-bold font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Paid Amount (পরিশোধ)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      placeholder="0"
                      value={directInvoicePaid}
                      onChange={(e) => handleDirectInvoiceAmountChange(e.target.value, 'paid')}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-500 text-xs font-bold font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Due Amount (বকেয়া)</label>
                    <input
                      type="text"
                      readOnly
                      value={`৳${directInvoiceDue}`}
                      className="w-full px-3 py-2 bg-slate-100 border border-slate-250 rounded-lg text-slate-500 cursor-not-allowed outline-none text-xs font-bold font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Note (মন্তব্য)</label>
                  <textarea
                    placeholder="e.g. Service charge notes"
                    value={directInvoiceNote}
                    onChange={(e) => setDirectInvoiceNote(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-500 text-xs font-medium resize-none"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isDirectInvoiceSaving}
                    className="px-5 py-2.5 bg-indigo-650 hover:bg-indigo-755 text-white text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {isDirectInvoiceSaving ? (
                      <>
                        <RefreshCw size={12} className="animate-spin" />
                        সংরক্ষণ হচ্ছে...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={13} />
                        রিলিজ করুন (Release Bill)
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : activeInlineForm === 'app' ? (
              <div className="text-left bg-white p-5 rounded-xl border border-slate-205 font-sans">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded mb-4 inline-block">Android Pack Configuration</span>
                <CreateAppForm onSuccess={handleCreateSuccess} onCancel={() => setAdminActiveTab('overview')} />
              </div>
            ) : activeInlineForm === 'decoder' ? (
              <div className="text-left bg-white p-5 rounded-xl border border-slate-205 font-sans">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded mb-4 inline-block">Decoder Management Specs</span>
                <CreateDecoderForm onSuccess={handleCreateSuccess} onCancel={() => setAdminActiveTab('overview')} />
              </div>
            ) : activeInlineForm === 'panel' ? (
              <div className="text-left bg-white p-5 rounded-xl border border-slate-205 font-sans">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-violet-700 bg-violet-50 border border-violet-100 px-2 py-0.5 rounded mb-4 inline-block">Reseller Registry Form</span>
                <CreatePanelForm onSuccess={handleCreateSuccess} onCancel={() => setAdminActiveTab('overview')} />
              </div>
            ) : (
              <div className="text-left bg-white p-5 rounded-xl border border-slate-205 font-sans">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded mb-4 inline-block">Customer Profile Builder</span>
                <CreateUserForm onSuccess={handleCreateSuccess} onCancel={() => setAdminActiveTab('overview')} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: records */}
      {adminActiveTab === 'records' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in text-left">
          
          {/* Invoice Book Card */}
          <div className="bg-white border border-slate-150 rounded-2xl overflow-hidden flex flex-col h-full shadow-2xs">
            <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50">
              <div className="flex items-center gap-2">
                <FileText size={14} className="text-indigo-650" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">কোম্পানির বিগত মোট রশিদ খাতা</h3>
              </div>
              <div className="relative shrink-0 w-full sm:w-48">
                <Search size={11} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="গ্রাহক বা আইডি খুঁজুন..."
                  value={adminInvoiceSearch}
                  onChange={(e) => setAdminInvoiceSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10.5px] outline-none focus:border-indigo-500 font-medium"
                />
              </div>
            </div>

            <div className="p-4 space-y-3.5 overflow-y-auto max-h-[460px] divide-y divide-slate-100">
              {invoices.filter(inv => {
                const term = adminInvoiceSearch.toLowerCase();
                if (!term) return true;
                return (inv.customerName || '').toLowerCase().includes(term) || (inv.id || '').toLowerCase().includes(term) || (inv.type || '').toLowerCase().includes(term);
              }).length > 0 ? (
                invoices.filter(inv => {
                  const term = adminInvoiceSearch.toLowerCase();
                  if (!term) return true;
                  return (inv.customerName || '').toLowerCase().includes(term) || (inv.id || '').toLowerCase().includes(term) || (inv.type || '').toLowerCase().includes(term);
                }).map((inv) => (
                  <div key={inv.id} className="flex items-start justify-between gap-4 pt-3.5 first:pt-0 bg-transparent text-left">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${
                        inv.status === 'paid' ? 'bg-emerald-500' : 
                        inv.status === 'pending' ? 'bg-amber-500' : 'bg-rose-500'
                      }`} />
                      <div className="min-w-0 text-xs">
                        <span className="text-[9px] uppercase font-bold text-slate-405 font-mono">#{inv.id.substring(0, 8).toUpperCase()}</span>
                        <h4 className="text-xs font-bold text-slate-800 truncate mt-0.5">
                          {inv.customerName}
                        </h4>
                        <p className="text-[10.5px] font-medium mt-0.5 text-slate-500">
                          ৳{(inv.amount || 0).toLocaleString()} • {inv.type || 'Service'} • {inv.cashierName || 'Cashier'}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end shrink-0 gap-1 text-xs">
                      <span className={`text-[8.5px] font-bold uppercase font-mono px-2 py-0.2 rounded ${
                        inv.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                        inv.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
                      }`}>
                        {inv.status === 'paid' ? 'PAID' : inv.status === 'pending' ? 'PENDING' : 'REJECTED'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedUserInvoice(inv);
                          setShowInvoicePreviewModal(true);
                        }}
                        className="text-[9.5px] font-bold text-indigo-650 hover:text-indigo-800 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded cursor-pointer leading-tight"
                      >
                        রশিদ দিন (PDF)
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-slate-400 text-xs italic">
                  কোনো ইনভয়েস রেকর্ড পাওয়া যায়নি।
                </div>
              )}
            </div>
          </div>

          {/* Activity Logs Card */}
          <div className="bg-white border border-slate-150 rounded-2xl overflow-hidden flex flex-col h-full shadow-2xs">
            <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-indigo-650" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">রিয়েল-টাইম সিস্টেম অ্যাক্টিভিটি লগ</h3>
              </div>
              <div className="relative shrink-0 w-full sm:w-44">
                <Search size={11} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="অ্যাকশন বা সার্চ..."
                  value={adminLogSearch}
                  onChange={(e) => setAdminLogSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10.5px] outline-none focus:border-indigo-500 font-medium"
                />
              </div>
            </div>

            <div className="p-4 space-y-3.5 overflow-y-auto max-h-[460px] divide-y divide-slate-100">
              {activities.filter(log => {
                const term = adminLogSearch.toLowerCase();
                if (!term) return true;
                return (log.message || '').toLowerCase().includes(term) || (log.user || '').toLowerCase().includes(term);
              }).length > 0 ? (
                activities.filter(log => {
                  const term = adminLogSearch.toLowerCase();
                  if (!term) return true;
                  return (log.message || '').toLowerCase().includes(term) || (log.user || '').toLowerCase().includes(term);
                }).map((log) => {
                  const rawUser = log.user || 'admin@master';
                  const cleanUser = rawUser.split('@')[0];
                  return (
                    <div key={log.id} className="flex gap-2.5 pt-3.5 first:pt-0 bg-transparent text-left">
                      <div className="w-6.5 h-6.5 rounded bg-indigo-50 text-indigo-755 text-[9.5px] font-bold uppercase flex items-center justify-center shrink-0 border border-indigo-100">
                        {cleanUser.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 text-xs">
                        <p className="font-semibold text-slate-750 leading-normal select-all">
                          {log.message}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-[9px] text-slate-400 font-mono font-semibold">
                          <span className="bg-slate-50 border text-slate-600 px-1 rounded uppercase font-bold">{cleanUser}</span>
                          <span>•</span>
                          <span>{new Date(log.timestamp).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center text-slate-400 text-xs italic">
                  কোনো সিস্টেম লগ পাওয়া যায়নি।
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* Tab: notes (Memo Pad) */}
      {adminActiveTab === 'notes' && (
        <div className="space-y-4 animate-fade-in text-left">
          <div className="bg-white border border-slate-150 p-6 sm:p-8 rounded-2xl shadow-2xs max-w-3xl mx-auto text-left">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-5">
              <div>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Real-time Notepad Core</span>
                <h3 className="text-sm font-bold text-slate-805 uppercase">নিরাপদ এডমিন ক্যাকটাস কুইক মেমো নোটস</h3>
              </div>
              <div className="flex items-center gap-2">
                {notesSaveSuccess && (
                   <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 border border-emerald-100 rounded">সংরক্ষিত</span>
                )}
                <FileText size={15} className="text-indigo-600" />
              </div>
            </div>

            <textarea
              value={adminNotes}
              onChange={(e) => {
                setAdminNotes(e.target.value);
                localStorage.setItem('admin_desktop_sticky_notes', e.target.value);
                setNotesSaveSuccess(true);
                setTimeout(() => setNotesSaveSuccess(false), 1500);
              }}
              rows={11}
              placeholder="এখানে আপনার জরুরী কাজের বিবরণী, ইনভয়েস ট্র্যাকিং নম্বর, গ্রাহকদের নোটিফিকেশন তথ্য বা অন্য যেকোনো বার্তা লিখে রাখতে পারেন। এটি ব্রাউজারে স্বয়ংক্রিয় ও নিরাপদভাবে সংরক্ষিত হয়ে থাকবে..."
              className="w-full p-4 text-xs font-semibold leading-relaxed text-slate-700 bg-amber-50/10 border border-amber-200/40 rounded-xl focus:outline-none focus:bg-amber-50/20 focus:border-amber-300 resize-none font-sans"
            />

            <div className="pt-4 border-t border-slate-100 mt-5 flex items-center justify-between">
              <button 
                type="button"
                onClick={() => {
                  if (window.confirm('আপনি কি নোটপ্যাডের সব লেখা মুছে দিতে চান?')) {
                    setAdminNotes('');
                    localStorage.removeItem('admin_desktop_sticky_notes');
                    setNotesSaveSuccess(true);
                    setTimeout(() => setNotesSaveSuccess(false), 1500);
                  }
                }}
                className="text-[10px] font-bold text-rose-505 uppercase hover:bg-rose-50 px-3 py-1.5 rounded-lg border border-transparent hover:border-rose-100 transition-all cursor-pointer font-sans"
              >
                সব মুছুন
              </button>
              <span className="text-[10px] font-mono text-slate-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                লোকাল ড্রাফট সিঙ্ক সচল
              </span>
            </div>
          </div>
        </div>
      )}

      {/* standard compatible Modal Wrappers */}
      <Modal 
        isOpen={activeModal === 'app'} 
        onClose={() => setActiveModal(null)} 
        title={`${t('create_new_invoice')} - ${settings.appLabel || t('apps')}`}
      >
        <CreateAppForm onSuccess={handleCreateSuccess} onCancel={() => setActiveModal(null)} />
      </Modal>

      <Modal 
        isOpen={activeModal === 'decoder'} 
        onClose={() => setActiveModal(null)} 
        title={`${t('create_new_invoice')} - ${settings.decoderLabel || t('decoders')}`}
      >
        <CreateDecoderForm onSuccess={handleCreateSuccess} onCancel={() => setActiveModal(null)} />
      </Modal>

      <Modal 
        isOpen={activeModal === 'panel'} 
        onClose={() => setActiveModal(null)} 
        title={`${t('create_new_invoice')} - ${settings.panelLabel || t('panels')}`}
      >
        <CreatePanelForm onSuccess={handleCreateSuccess} onCancel={() => setActiveModal(null)} />
      </Modal>

      <Modal 
        isOpen={activeModal === 'user'} 
        onClose={() => setActiveModal(null)} 
        title={`${t('create_new_invoice')} - ${settings.userLabel || t('users')}`}
      >
        <CreateUserForm onSuccess={handleCreateSuccess} onCancel={() => setActiveModal(null)} />
      </Modal>

      <Modal
        isOpen={activeModal === 'create_invoice_direct'}
        onClose={() => setActiveModal(null)}
        title="📝 নতুন ইনভয়েস তৈরি করুন (Create General Invoice)"
      >
        <form onSubmit={handleCreateDirectInvoiceSubmit} className="space-y-4 font-sans text-left text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-404 uppercase tracking-wider mb-1">Invoice Number</label>
              <input
                type="text"
                required
                value={directInvoiceNum}
                onChange={(e) => setDirectInvoiceNum(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none font-semibold text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-404 uppercase tracking-wider mb-1">Service / Invoice Type</label>
              <select
                value={directInvoiceType}
                onChange={(e) => setDirectInvoiceType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none font-bold text-xs"
              >
                <option value="Apps">Android Apps</option>
                <option value="Decoder">Decoder Package</option>
                <option value="Panel">Reseller Panel</option>
                <option value="User">User Account</option>
                <option value="Finance">General Service</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-404 uppercase tracking-wider mb-1">Customer Name</label>
            <input
              type="text"
              required
              value={directInvoiceCustomerName}
              onChange={(e) => setDirectInvoiceCustomerName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none text-xs"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-404 uppercase tracking-wider mb-1">Country</label>
              <select
                value={directInvoiceCountryCode}
                onChange={(e) => setDirectInvoiceCountryCode(e.target.value)}
                className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none text-xs"
              >
                {localCountryCodes.map((c) => (
                  <option key={c.code} value={c.code}>{c.label} {c.code}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-[10px] font-bold text-slate-404 uppercase tracking-wider mb-1">Phone Number</label>
              <input
                type="tel"
                required
                value={directInvoicePhone}
                onChange={(e) => setDirectInvoicePhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none font-mono text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-404 uppercase tracking-wider mb-1">Payment Method</label>
              <select
                value={directInvoicePaymentMethod}
                onChange={(e) => setDirectInvoicePaymentMethod(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none text-xs font-semibold"
              >
                <option value="bKash">bKash</option>
                <option value="Nagad">Nagad</option>
                <option value="Rocket">Rocket</option>
                <option value="Upay">Upay</option>
                <option value="CellFin">CellFin</option>
                <option value="Bank">Bank Transfer</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-404 uppercase tracking-wider mb-1">Transaction ID</label>
              <input
                type="text"
                required
                value={directInvoiceTxnId}
                onChange={(e) => setDirectInvoiceTxnId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none font-mono text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-404 uppercase tracking-wider mb-1">Total Fee</label>
              <input
                type="number"
                required
                value={directInvoiceAmount}
                onChange={(e) => handleDirectInvoiceAmountChange(e.target.value, 'amount')}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none font-mono font-bold text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-404 uppercase tracking-wider mb-1">Paid Amount</label>
              <input
                type="number"
                required
                value={directInvoicePaid}
                onChange={(e) => handleDirectInvoiceAmountChange(e.target.value, 'paid')}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none font-mono font-bold text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-404 uppercase tracking-wider mb-1">Due Amount</label>
              <input
                type="text"
                readOnly
                value={`৳${directInvoiceDue}`}
                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg font-mono text-slate-500 cursor-not-allowed text-xs font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-404 uppercase tracking-wider mb-1">Note / Description</label>
            <textarea
              value={directInvoiceNote}
              onChange={(e) => setDirectInvoiceNote(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none resize-none text-xs"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="px-4 py-1.5 border border-slate-200 text-slate-500 font-bold rounded-lg hover:bg-slate-50 text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs cursor-pointer"
            >
              Generate Invoice
            </button>
          </div>
        </form>
      </Modal>

      {/* User Invoice Preview Modal */}
      {selectedUserInvoice && showInvoicePreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-[800px] w-full max-h-[90vh] flex flex-col my-8 font-sans">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900">ইনভয়েস বা বিল রশিদ (Invoice Statement Preview)</h4>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  type="button"
                  onClick={() => handleUserDownloadInvoice(selectedUserInvoice)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg font-bold text-xs hover:bg-indigo-700 shadow-3xs transition-all active:scale-95 cursor-pointer"
                >
                  <FileText size={12} />
                  ডাউনলোড PDF
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    setShowInvoicePreviewModal(false);
                    setSelectedUserInvoice(null);
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-800 bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto p-4 bg-slate-50">
              <div id={`user-invoice-preview-${selectedUserInvoice.id}`} className="bg-white shadow-md rounded-lg mx-auto p-2" style={{ width: '100%', maxWidth: '750px' }}>
                <InvoiceTemplate 
                  id={`invoice-${selectedUserInvoice.id}`}
                  invoice={selectedUserInvoice} 
                  settings={settings as CompanySettings} 
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User PDF Generation loading screen */}
      {isUserGeneratingPdf && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/30 backdrop-blur-xs">
          <div className="bg-white p-6 rounded-xl shadow-md flex flex-col items-center">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-xs font-bold text-slate-800">PDF রেন্ডার হচ্ছে...</p>
          </div>
        </div>
      )}

      {/* Dynamic Payment Approval Success Notification Modal */}
      <Modal
        isOpen={approvedNotificationModal.isOpen}
        onClose={() => setApprovedNotificationModal((prev: any) => ({ ...prev, isOpen: false }))}
        title="🎉 পেমেন্ট সফলভাবে অনুমোদিত হয়েছে! (Payment Approved)"
      >
        {approvedNotificationModal.invoice && (() => {
          const inv = approvedNotificationModal.invoice;
          const u = approvedNotificationModal.user;
          
          const defaultWa = 'আসসালামু আলাইকুম {name}!\n\nআপনার BDT {paid} মূল্যের পেমেন্ট আবেদনটি আমাদের সিস্টেমে সফলভাবে অনুমোদিত (Approved) হয়েছে। 🎉\n\n📌 বিবরণ:\n- পেমেন্ট উদ্দেশ্য: {purpose}\n- পেমেন্ট মাধ্যম: {method}\n- ট্রানজেকশন ID: {txn}\n- চলতি বকেয়া: ৳{due}\n\nআমাদের সেবা ব্যবহারের জন্য আপনাকে ধন্যবাদ!\n- {company}';
          const defaultSubject = '🎉 Payment Approved & Receipt Confirmed - {id}';
          const defaultBody = 'আসসালামু আলাইকুম {name}!\n\nআমরা আনন্দের সাথে জানাচ্ছি যে আপনার পেমেন্ট রিকোয়েস্টটি সফলভাবে অনুমোদিত হয়েছে এবং আপনার অ্যাকাউন্ট ব্যালেন্স সচল করা হয়েছে।\n\n📌 বিবরণ:\n- পেমেন্ট উদ্দেশ্য: {purpose}\n- পেমেন্ট মাধ্যম: {method}\n- ট্রানজেকশন ID: {txn}\n- পরিশোধকৃত মোট অ্যামাউন্ট: ৳{paid}\n- চলতি বকেয়া (Due Amount): ৳{due}\n- ইনভয়েস আইডি: INV-{id}\n\nযেকোনো সমস্যায় লাইভ চ্যাট অথবা কাস্টমার কেয়ারে যোগাযোগ করুন।\n\nধন্যবাদ,\n{company} টিম';

          const waTemplate = settings.paymentApproveWaTemplate || defaultWa;
          const subjectTemplate = settings.paymentApproveEmailSubjectTemplate || defaultSubject;
          const bodyTemplate = settings.paymentApproveEmailBodyTemplate || defaultBody;

          const shortId = inv.id ? inv.id.substring(0, 8).toUpperCase() : 'N/A';
          const currentDue = u ? (u.dueAmount ?? 0) : (inv.dueAmount ?? 0);
          const purpose = inv.type || 'Wallet Top-Up';
          const method = inv.paymentMethod || 'Bkash/Nagad';
          const txn = inv.transactionId || 'N/A';
          const companyName = settings.companyName || settings.sidebarTitle || 'Master Service';
          const customerName = inv.customerName || u?.name || 'গ্রাহক';

          const resolveFields = (text: string) => {
            return text
              .replace(/{name}/g, customerName)
              .replace(/{paid}/g, (inv.amount || 0).toLocaleString())
              .replace(/{due}/g, currentDue.toLocaleString())
              .replace(/{purpose}/g, purpose)
              .replace(/{id}/g, shortId)
              .replace(/{method}/g, method)
              .replace(/{txn}/g, txn)
              .replace(/{company}/g, companyName);
          };

          const finalWaMsg = resolveFields(waTemplate);
          const finalSubj = resolveFields(subjectTemplate);
          const finalBody = resolveFields(bodyTemplate);

          const cleanPhone = (phone: string) => {
            let cleaned = phone.replace(/[^\d]/g, '');
            if (cleaned.startsWith('880880')) {
              cleaned = cleaned.slice(3);
            } else if (cleaned.startsWith('8800')) {
              cleaned = '880' + cleaned.slice(4);
            }
            if (cleaned.startsWith('0') && cleaned.length === 11) {
              cleaned = '88' + cleaned;
            } else if (cleaned.length === 10 && /^[13456789]/.test(cleaned)) {
              cleaned = '880' + cleaned;
            }
            return cleaned;
          };

          const recipientNumber = inv.customerNumber || (inv as any).phone || u?.phone || '';
          const phoneForWa = cleanPhone(recipientNumber);
          const emailAddress = inv.customerEmail || (inv as any).email || u?.email || '';

          const waUrl = `https://api.whatsapp.com/send?phone=${phoneForWa}&text=${encodeURIComponent(finalWaMsg)}`;
          const waUrlBus = `https://wa.me/${phoneForWa}?text=${encodeURIComponent(finalWaMsg)}`;
          const mailtoUrl = `mailto:${emailAddress}?subject=${encodeURIComponent(finalSubj)}&body=${encodeURIComponent(finalBody)}`;

          return (
            <div className="space-y-4 text-left py-1 text-xs">
              <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl flex items-center gap-2.5">
                <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-bold">
                  ✓
                </div>
                <div>
                  <h4 className="font-bold text-emerald-800">পেমেন্ট সফলভাবে অনুমোদিত হয়েছে!</h4>
                  <p className="text-[11px] text-emerald-600 font-medium">রশীদ: INV-{shortId} | পরিমান: ৳{(inv.amount || 0).toLocaleString()}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="border border-slate-150 rounded-xl overflow-hidden shadow-2xs">
                  <div className="bg-slate-50 px-3.5 py-1.5 border-b border-slate-150 flex justify-between items-center text-[10.5px]">
                    <span className="font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                      <MessageSquare size={12} className="text-emerald-555" />
                      Option A: WhatsApp Alert
                    </span>
                    <span className="font-mono text-slate-400">📞 {phoneForWa || 'None'}</span>
                  </div>
                  <div className="p-3 bg-white space-y-2.5">
                    <div className="bg-slate-50 p-2.5 rounded-lg text-slate-700 whitespace-pre-line border border-slate-100 max-h-32 overflow-y-auto">
                      {finalWaMsg}
                    </div>
                    {phoneForWa ? (
                      <div className="grid grid-cols-2 gap-2">
                        <a 
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setApprovedNotificationModal((prev: any) => ({ ...prev, isOpen: false }))}
                          className="flex items-center justify-center gap-1 py-1.5 bg-emerald-600 hover:bg-emerald-750 text-white rounded-lg text-[11px] font-bold shadow-2ns active:scale-95 text-center cursor-pointer"
                        >
                          Send WhatsApp
                        </a>
                        <a 
                          href={waUrlBus}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setApprovedNotificationModal((prev: any) => ({ ...prev, isOpen: false }))}
                          className="flex items-center justify-center gap-1 py-1.5 bg-teal-600 hover:bg-teal-750 text-white rounded-lg text-[11px] font-bold shadow-2ns active:scale-95 text-center cursor-pointer"
                        >
                          WA Business
                        </a>
                      </div>
                    ) : (
                      <p className="text-[10px] text-rose-500 font-bold bg-rose-50 p-2 rounded text-center">⚠️ হোয়াটসঅ্যাপ করা সম্ভব হচ্ছে না।</p>
                    )}
                  </div>
                </div>

                <div className="border border-slate-150 rounded-xl overflow-hidden shadow-2xs">
                  <div className="bg-slate-50 px-3.5 py-1.5 border-b border-slate-150 flex justify-between items-center text-[10.5px]">
                    <span className="font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                      <Mail size={12} className="text-indigo-500" />
                      Option B: Email confirmation
                    </span>
                    <span className="font-mono text-slate-400">✉️ {emailAddress || 'None'}</span>
                  </div>
                  <div className="p-3 bg-white space-y-2">
                    <div className="space-y-1">
                      <span className="font-bold text-slate-405 uppercase text-[9px] tracking-widest block">Subject Preview</span>
                      <div className="bg-slate-50 p-2 rounded border border-slate-100 font-bold text-slate-700">{finalSubj}</div>
                    </div>
                    {emailAddress ? (
                      <a 
                        href={mailtoUrl}
                        onClick={() => setApprovedNotificationModal((prev: any) => ({ ...prev, isOpen: false }))}
                        className="flex items-center justify-center gap-1.5 w-full py-1.5 bg-indigo-600 hover:bg-indigo-750 text-white rounded-lg text-[11px] font-bold shadow-2ns active:scale-95 text-center cursor-pointer"
                      >
                        Send Email
                      </a>
                    ) : (
                      <p className="text-[10px] text-amber-600 font-bold bg-amber-50 p-1.5 rounded text-center">💡 ইমেইল সেট করা নাই।</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => setApprovedNotificationModal((prev: any) => ({ ...prev, isOpen: false }))}
                  className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Close (শেষ)
                </button>
              </div>
            </div>
          );
        })()}
      </Modal>

    </div>
  );
}
