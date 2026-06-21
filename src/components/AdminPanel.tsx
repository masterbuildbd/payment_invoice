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
    <div className="space-y-7 pb-16 font-sans text-slate-800 dark:text-slate-100 animate-fade-in">
      
      {/* 🌟 Ultra-Premium Glowing Cosmic Banner Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-905 border border-slate-800 rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl text-left">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 px-3.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
              <span className="w-2 h-2 rounded-full bg-indigo-500 absolute" />
              {t('admin_control_desk') || 'System Management Suite'} • লাইভ কন্ট্রোল
            </div>
            
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>{currentUserData?.name || user?.name || 'Master Admin'}</span>
              <span className="text-xl sm:text-2xl animate-bounce">👋</span>
            </h1>
            
            <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
              কোম্পানির আর্থিক লেনদেন, চালান অনুমোদন, অ্যাপ সাবস্ক্রিপশন ও কাস্টমার ডিকোডার লাইসেন্স পোর্টাল রিয়েল-টাইমে পরিচালনা ও মনিটর করুন।
            </p>
          </div>

          {/* Clean minimal date & system status badges */}
          <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 text-left">
              <div className="p-2.5 bg-indigo-500/20 text-indigo-300 rounded-xl">
                <Clock size={18} className="animate-pulse" />
              </div>
              <div>
                <span className="text-[9px] font-extrabold text-indigo-300/80 uppercase tracking-widest block">আজকের তারিখ (Date)</span>
                <span className="text-xs font-bold text-white leading-tight">
                  {new Date().toLocaleDateString('bn-BD', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 bg-emerald-500/10 px-4 py-3.5 rounded-2xl border border-emerald-500/25 text-xs text-emerald-400 font-semibold">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="font-mono text-[10px] tracking-wider uppercase">Uptime: 99.9% (সচল)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 🚀 SEGMENTED TAB LIST (High-End Swiss Style) */}
      <div className="bg-slate-100/80 dark:bg-slate-900/45 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-800/85 flex flex-col lg:flex-row gap-2 items-stretch lg:items-center justify-between shadow-xs">
        <div className="flex flex-wrap items-center gap-1.5 w-full lg:w-auto">
          {[
            { id: 'overview', label: 'Overview', bng: 'সংक्षिप्त বিবরণী', icon: BarChart3 },
            { id: 'approvals', label: 'Approvals', bng: 'লেনদেন অনুমোদন', icon: CheckCircle, badge: invoices.filter(inv => inv.status === 'pending').length },
            { id: 'create_invoice', label: 'Invoice Creator', bng: 'ইনভয়েস ফ্যাক্টরি', icon: Plus },
            { id: 'records', label: 'Ledgers & Logs', bng: 'খতিয়ান ও লগ', icon: FileText },
            { id: 'notes', label: 'Memo Notepad', bng: 'ব্যক্তিগত নোট', icon: Layers },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = adminActiveTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setAdminActiveTab(tab.id as any)}
                className={`flex-1 sm:flex-initial flex items-center justify-center sm:justify-start gap-2.5 px-4.5 py-2 rounded-xl text-xs font-black transition-all duration-200 cursor-pointer text-left border ${
                  isActive 
                    ? 'bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-md border-slate-200 dark:border-slate-700/80 scale-102 font-black' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white/40 dark:hover:bg-slate-850/40 border-transparent'
                }`}
              >
                <Icon size={15} className={`shrink-0 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`} />
                <div className="flex flex-col leading-none text-left">
                  <span className="text-[11px] uppercase tracking-wide">{tab.label}</span>
                  <span className="text-[9px] font-normal text-slate-400 mt-0.5">{tab.bng}</span>
                </div>
                {tab.badge && tab.badge > 0 ? (
                  <span className="bg-rose-500 text-white font-extrabold px-2 py-0.5 rounded-full text-[10px] font-mono leading-none animate-bounce shrink-0 shadow-sm ml-1">
                    {tab.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
        
        <div className="hidden lg:flex items-center gap-2 px-4.5 py-2.5 font-mono text-[10px] font-bold uppercase text-slate-500 dark:text-slate-405 tracking-wider shrink-0 bg-white/40 dark:bg-slate-900/30 rounded-xl border border-slate-200/40 dark:border-slate-800/20">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>Security Level: Master Core</span>
        </div>
      </div>

      {/* Tab Content Cases */}
      {adminActiveTab === 'overview' && (
        <div className="space-y-7 animate-fade-in text-left">
          
          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4.5">
            {[
              { id: 'totalRevenue', val: `৳${stats.totalRevenue.toLocaleString()}`, label: 'Total Revenue', bng: 'মোট সংগ্রহ', icon: Banknote, color: 'text-emerald-500 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/5', progressColor: 'bg-emerald-500' },
              { id: 'totalInvestment', val: `৳${stats.totalInvestment.toLocaleString()}`, label: 'total expenses', bng: 'মোট খরচ/ইনভেস্ট', icon: TrendingDown, color: 'text-rose-500 dark:text-rose-400 bg-rose-500/10 border-rose-500/20 shadow-rose-500/5', progressColor: 'bg-rose-500' },
              { id: 'netProfit', val: `৳${stats.netProfit.toLocaleString()}`, label: 'Net Profit (85%)', bng: 'প্রকৃত লাভ হিসেব', icon: TrendingUp, color: 'text-indigo-500 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20 shadow-indigo-500/5', progressColor: 'bg-indigo-500' },
              { id: 'dueBalance', val: `৳${stats.dueBalance.toLocaleString()}`, label: 'Due Balance', bng: 'বকেয়া পাওনা', icon: Activity, color: 'text-amber-500 dark:text-amber-400 bg-amber-500/10 border-amber-500/20 shadow-amber-500/5', progressColor: 'bg-amber-500' },
              { id: 'totalUsers', val: `${totalUsersCount} জন`, label: 'Total Customers', bng: 'নিবন্ধিত গ্রাহক', icon: Users, color: 'text-sky-500 dark:text-sky-450 bg-sky-500/10 border-sky-500/20 shadow-sky-500/5', progressColor: 'bg-sky-500' }
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.id} className="relative group overflow-hidden bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 hover:scale-102 text-left flex flex-col justify-between min-h-[145px]">
                  {/* Subtle Colored Top Accent Bar */}
                  <div className={`absolute top-0 left-0 right-0 h-1 ${stat.progressColor}`} />
                  
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-0.5">
                      <span className="text-[9.5px] font-extrabold uppercase text-slate-400 dark:text-slate-500 tracking-wider block leading-none">
                        {stat.label}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-405 font-bold block">{stat.bng}</span>
                    </div>
                    <div className={`p-2.5 rounded-xl ${stat.color} shrink-0 border border-current/10 shadow-xs`}>
                      <Icon size={16} />
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-2">
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight leading-none">
                      {stat.val}
                    </h3>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Interactive Graph Box */}
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-7 border border-slate-205 dark:border-slate-800/80 rounded-3xl shadow-sm">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5 border-b border-slate-100 dark:border-slate-850 pb-5 mb-5 text-left">
              <div className="flex items-center gap-3">
                <span className="p-2.5 bg-indigo-500/10 text-indigo-500 rounded-xl border border-indigo-500/10 shadow-xs shrink-0">
                  <BarChart3 size={18} />
                </span>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">আয় ও প্রফিট রিপোর্ট গ্রাফ (Revenue & profit analytics)</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">পরিশোধিত পেমেন্ট এবং অর্জিত লাভের লাইভ তুলনামূলক ইন্টারেক্টিভ লিনিয়ার গ্রাফঃ</p>
                </div>
              </div>

              {/* Advanced premium graph controls */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Metric Mode pills */}
                <div className="bg-slate-50 dark:bg-slate-950 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 flex items-center gap-1">
                  {[
                    { id: 'daily', label: 'দৈনিক আয়' },
                    { id: 'cumulative', label: 'ক্রমবর্ধমান' },
                    { id: 'profit', label: 'প্রফিট (৮৫%)' }
                  ].map(btn => (
                    <button
                      key={btn.id}
                      type="button"
                      onClick={() => setChartMetricMode(btn.id as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        chartMetricMode === btn.id
                          ? 'bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-xs border border-slate-100 dark:border-slate-700/50 scale-102'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-250'
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>

                {/* Graph styling modes */}
                <div className="bg-slate-50 dark:bg-slate-950 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 flex items-center gap-1">
                  {[
                    { id: 'bar', label: 'বার' },
                    { id: 'area', label: 'এরিয়া' },
                    { id: 'line', label: 'লাইন' }
                  ].map(btn => (
                    <button
                      key={btn.id}
                      type="button"
                      onClick={() => setChartVisualType(btn.id as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        chartVisualType === btn.id
                          ? 'bg-indigo-650 hover:bg-indigo-755 text-white shadow-md'
                          : 'text-slate-505 hover:text-slate-800 dark:hover:text-slate-250'
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="h-[290px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                {chartVisualType === 'bar' ? (
                  <BarChart data={dailyRevenueData.data} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f2937" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} dy={8} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 750 }} dx={-4} />
                    <Tooltip 
                      cursor={{ fill: 'rgba(99, 102, 241, 0.04)', radius: 4 }}
                      contentStyle={{ borderRadius: '14px', backgroundColor: '#0f172a', color: '#ffffff', border: 'none', padding: '12px 14px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)' }}
                      formatter={(value: any) => [`৳${Number(value).toLocaleString()}`, chartMetricMode === 'daily' ? 'দৈনিক রেভিনিউ' : chartMetricMode === 'cumulative' ? 'ক্রমবর্ধমান' : 'লাভ']}
                    />
                    <Bar dataKey={chartMetricMode === 'daily' ? 'revenue' : chartMetricMode === 'cumulative' ? 'cumulative' : 'profit'} fill="#4f46e5" radius={[6, 6, 0, 0]} maxBarSize={28}>
                      {dailyRevenueData.data.map((entry, index) => {
                        const val = chartMetricMode === 'daily' ? entry.revenue : chartMetricMode === 'cumulative' ? entry.cumulative : entry.profit;
                        return <Cell key={`cell-${index}`} fill={val > 0 ? (chartMetricMode === 'profit' ? '#10b981' : '#4f46e5') : '#e2e8f0'} />;
                      })}
                    </Bar>
                  </BarChart>
                ) : chartVisualType === 'area' ? (
                  <AreaChart data={dailyRevenueData.data} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={chartMetricMode === 'profit' ? '#10b981' : '#6366f1'} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={chartMetricMode === 'profit' ? '#10b981' : '#6366f1'} stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f2937" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} dy={8} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} dx={-4} />
                    <Tooltip contentStyle={{ borderRadius: '14px', backgroundColor: '#0f172a', color: '#ffffff', border: 'none', padding: '12px 14px' }} />
                    <Area type="monotone" dataKey={chartMetricMode === 'daily' ? 'revenue' : chartMetricMode === 'cumulative' ? 'cumulative' : 'profit'} stroke={chartMetricMode === 'profit' ? '#10b981' : '#6366f1'} strokeWidth={3} fillOpacity={1} fill="url(#colorMetric)" />
                  </AreaChart>
                ) : (
                  <LineChart data={dailyRevenueData.data} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f2937" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} dy={8} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} dx={-4} />
                    <Tooltip contentStyle={{ borderRadius: '14px', backgroundColor: '#0f172a', color: '#ffffff', border: 'none', padding: '12px 14px' }} />
                    <Line type="monotone" dataKey={chartMetricMode === 'daily' ? 'revenue' : chartMetricMode === 'cumulative' ? 'cumulative' : 'profit'} stroke={chartMetricMode === 'profit' ? '#10b981' : '#6366f1'} strokeWidth={3.5} dot={{ r: 3, fill: '#6366f1', strokeWidth: 2 }} />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Business Segments and Health Scores */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Sales Shares progress list */}
            <div className="bg-white dark:bg-slate-905 p-6 sm:p-7 border border-slate-205 dark:border-slate-800/80 rounded-3xl shadow-sm text-left">
              <div className="pb-4 border-b border-slate-100 dark:border-slate-850 mb-5 flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block leading-none mb-1">Service Shares breakdown</span>
                  <h4 className="text-xs sm:text-sm font-black text-slate-850 dark:text-white uppercase">সেবা ভিত্তিক বিক্রয় হিসেব ও শেয়ার (Product shares)</h4>
                </div>
                <span className="text-[10px] font-black text-indigo-700 dark:text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">রিয়েল-টাইম সিঙ্ক</span>
              </div>

              <div className="space-y-4 pt-1">
                {salesBreakdown.map((item, index) => (
                  <div key={index} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="font-bold text-slate-650 dark:text-slate-300 flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full shrink-0 ${item.color}`} />
                        {item.bangla}
                      </span>
                      <span className="font-mono font-black text-slate-900 dark:text-white">
                        ৳{item.value.toLocaleString()} <span className="text-slate-400 font-normal">({item.percentage}%)</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-850 h-2 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${item.color}`} style={{ width: `${item.percentage}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Health Score Circle Box */}
            <div className="bg-white dark:bg-slate-905 p-6 sm:p-7 border border-slate-205 dark:border-slate-800/80 rounded-3xl shadow-sm text-left flex flex-col justify-between">
              <div>
                <div className="pb-4 border-b border-slate-100 dark:border-slate-850 mb-5 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block leading-none mb-1">Audit Risk Tracker</span>
                    <h4 className="text-xs sm:text-sm font-black text-slate-805 dark:text-white uppercase font-sans">কোম্পানির ফাইন্যান্সিয়াল হেলথ স্কোর (Health meter)</h4>
                  </div>
                  <Activity size={16} className="text-emerald-500 animate-pulse" />
                </div>

                <div className="flex items-center gap-6 py-2">
                  <div className="relative w-20 h-20 shrink-0 flex items-center justify-center bg-slate-50 dark:bg-slate-950/40 rounded-full border border-slate-100 dark:border-slate-800/30">
                    <svg className="w-full h-full transform -rotate-90 scale-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" stroke="#f1f5f9" strokeWidth="8" fill="transparent" className="dark:stroke-slate-800" />
                      <circle 
                        cx="50" cy="50" r="40" 
                        stroke={healthScore >= 80 ? "#10b981" : healthScore >= 50 ? "#f59e0b" : "#ef4444"} 
                        strokeWidth="8" fill="transparent" 
                        strokeDasharray={`${2 * Math.PI * 40}`}
                        strokeDashoffset={`${2 * Math.PI * 40 * (1 - healthScore / 100)}`}
                        strokeLinecap="round"
                        className="transition-all duration-700"
                      />
                    </svg>
                    <span className="absolute font-mono font-black text-base text-slate-900 dark:text-white">{healthScore}%</span>
                  </div>

                  <div className="space-y-1.5 text-left">
                    <span className={`text-[9.5px] font-black uppercase px-2.5 py-1 rounded-lg ${
                      healthScore >= 80 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 
                      healthScore >= 55 ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                    }`}>
                      {healthScore >= 80 ? 'Excellent Safety' : healthScore >= 55 ? 'Moderate Risk' : 'High Risk Alert'}
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal max-w-xs font-semibold">
                      ব্যালেন্স শিট, পেন্ডিং বকেয়া এবং ইউজার রিকভারি বিবেচনা করে এই হেলথ স্কোর তৈরি করা হয়েছে।
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3.5 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-800/40 text-[11px] text-slate-600 dark:text-slate-400 font-semibold leading-relaxed">
                <strong>পরামর্শঃ</strong> {healthScore >= 80 ? 'ট্রানজেকশন ব্যালেন্স চমৎকার ও নিরাপদ।' : 'বকেয়া বিল আদায়ে পেন্ডিং কাস্টমার রিকভারি তাগিদ দিন।'}
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

      {/* Floating Action control widget */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2 text-xs font-sans">
        {isQuickActionsOpen && (
          <div 
            className="fixed inset-0 z-10 bg-transparent" 
            onClick={() => setIsQuickActionsOpen(false)}
          />
        )}

        {isQuickActionsOpen && (
          <div className="relative z-20 flex flex-col gap-1.5 bg-white border border-slate-200 text-slate-700 shadow-xl rounded-xl p-2.5 min-w-[190px] animate-fade-in text-left">
            <div className="px-1.5 py-0.5 border-b border-slate-100 mb-1 flex items-center justify-between text-[10px] font-bold uppercase text-slate-400">
              <span>Quick Creation</span>
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
            </div>

            <button
              type="button"
              onClick={() => {
                setAdminActiveTab('create_invoice');
                setActiveInlineForm('create_invoice_direct');
                setIsQuickActionsOpen(false);
              }}
              className="flex items-center gap-2.5 w-full p-2 hover:bg-slate-50 rounded-lg transition-colors text-left group cursor-pointer"
            >
              <div className="p-1.5 rounded bg-indigo-50 text-indigo-650 shrink-0">
                <FileText size={12} />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-800">Create Invoice</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setAdminActiveTab('create_invoice');
                setActiveInlineForm('user');
                setIsQuickActionsOpen(false);
              }}
              className="flex items-center gap-2.5 w-full p-2 hover:bg-slate-50 rounded-lg transition-colors text-left group cursor-pointer"
            >
              <div className="p-1.5 rounded bg-amber-50 text-amber-600 shrink-0">
                <Users size={12} />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-800">Add Customer</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setAdminActiveTab('create_invoice');
                setActiveInlineForm('decoder');
                setIsQuickActionsOpen(false);
              }}
              className="flex items-center gap-2.5 w-full p-2 hover:bg-slate-50 rounded-lg transition-colors text-left group cursor-pointer"
            >
              <div className="p-1.5 rounded bg-emerald-50 text-emerald-600 shrink-0">
                <Cpu size={12} />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-805">Register Decoder</p>
              </div>
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => setIsQuickActionsOpen(!isQuickActionsOpen)}
          className="relative z-20 flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-950 text-white rounded-full shadow-md font-bold transition-all hover:scale-102 active:scale-95 group focus:outline-none cursor-pointer"
        >
          <div className={`transition-transform duration-250 ${isQuickActionsOpen ? 'rotate-45' : ''}`}>
            <Plus size={16} />
          </div>
          <span className="text-[11px] font-extrabold uppercase tracking-wider">Quick actions</span>
        </button>
      </div>

    </div>
  );
}
