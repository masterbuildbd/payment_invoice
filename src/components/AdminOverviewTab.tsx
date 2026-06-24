import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  FileText, 
  Users, 
  Plus, 
  BarChart3, 
  ArrowLeftRight,
  ShieldCheck,
  ChevronRight,
  Shield,
  Menu,
  Bell,
  Sparkles,
  Check,
  CheckCircle,
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

interface AdminOverviewTabProps {
  stats: any;
  dailyRevenueData: any;
  chartMetricMode: any;
  setChartMetricMode: (val: any) => void;
  healthScore: number;
  totalUsersCount: number;
  invoices: any[];
  activities: any[];
  setAdminActiveTab: (tab: any) => void;
  setActiveInlineForm: (form: any) => void;
}

export function AdminOverviewTab({
  stats,
  dailyRevenueData,
  chartMetricMode,
  setChartMetricMode,
  healthScore,
  totalUsersCount,
  invoices,
  activities,
  setAdminActiveTab,
  setActiveInlineForm
}: AdminOverviewTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      {/* ============================================== */}
      {/* 📱 PANEL 1: MAIN METRICS & OVERVIEW            */}
      {/* ============================================== */}
      <div id="admin-panel1-container" className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[28px] p-5 sm:p-6 shadow-sm flex flex-col space-y-6 select-none relative overflow-hidden">
        

        {/* Greeting Banner Slider */}
        <div id="p1-welcome-banner" className="relative rounded-[22px] bg-gradient-to-br from-[#6366f1] via-[#5b4ff3] to-[#4f46e5] text-white p-5 overflow-hidden shadow-xs min-h-[140px] flex items-center">
          <div className="relative z-10 max-w-[65%] text-left space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-white/15 px-2.5 py-0.5 rounded-full backdrop-blur-md">WELCOME BACK</span>
            <h2 className="text-base sm:text-lg font-black tracking-tight">Master Admin 👋</h2>
            <p className="text-[10px] font-medium leading-relaxed opacity-90">আপনার ব্যবসার সফল কার্যক্রম পর্যবেক্ষণ ও পরিচালনা করুন সহজেই।</p>
          </div>
          
          {/* SVG Laptop Analytics Illustration on the Right */}
          <div className="absolute right-2 bottom-0 top-0 w-[40%] flex items-center justify-center opacity-95">
            <svg viewBox="0 0 120 100" className="w-full h-auto drop-shadow-md">
              <rect x="25" y="30" width="70" height="42" rx="4" fill="#1e1b4b" stroke="#818cf8" strokeWidth="2" />
              <rect x="29" y="34" width="62" height="34" rx="2" fill="#0f172a" />
              {/* Graphs inside Screen */}
              <path d="M 33,58 L 45,46 L 57,52 L 69,40 L 81,48 L 89,38" fill="none" stroke="#818cf8" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M 33,58 L 45,46 L 57,52 L 69,40 L 81,48 L 89,38 L 89,64 L 33,64 Z" fill="url(#screenGrad)" opacity="0.15" />
              <defs>
                <linearGradient id="screenGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#818cf8" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#818cf8" stopOpacity={0} />
                </linearGradient>
              </defs>
              {/* Laptop Base */}
              <path d="M 15,72 L 105,72 L 110,76 A 2,2 0 0,1 108,78 L 12,78 A 2,2 0 0,1 10,76 Z" fill="#312e81" stroke="#4f46e5" strokeWidth="1.5" />
              <rect x="52" y="72" width="16" height="3" rx="1.5" fill="#1e1b4b" />
              {/* Little circles representing stats */}
              <circle cx="102" cy="40" r="4" fill="#a78bfa" opacity="0.6" />
              <circle cx="18" cy="48" r="3" fill="#34d399" opacity="0.7" />
              <circle cx="106" cy="62" r="2.5" fill="#fb7185" opacity="0.5" />
            </svg>
          </div>

          {/* Pagination Dots */}
          <div className="absolute bottom-3 left-5 flex items-center gap-1.5">
            <span className="w-4 h-1 rounded-full bg-white transition-all duration-300" />
            <span className="w-1 h-1 rounded-full bg-white/40" />
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
            <span className="text-[11px] font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-wide">সিস্টেম নিরাপদ (System Active)</span>
          </div>
          <ChevronRight size={14} className="text-emerald-650 dark:text-emerald-400" />
        </div>

        {/* Quick Access Bento Grid */}
        <div className="space-y-3">
          <div className="flex justify-between items-center text-left">
            <div>
              <h3 className="text-[12px] font-bold text-slate-900 dark:text-white uppercase tracking-wider leading-none">Quick Access</h3>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">দ্রুত এক্সেস মেনু</span>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'overview', title: 'Overview', sub: 'সার্বিক বিবরণ', icon: BarChart3, color: 'text-indigo-650 bg-indigo-50 border-indigo-100 dark:bg-indigo-950/20 dark:border-indigo-900/40' },
              { id: 'approvals', title: 'Approvals', sub: 'অনুমোদন', icon: CheckCircle, color: 'text-emerald-650 bg-emerald-50 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/40', badge: invoices.filter(inv => inv.status === 'pending').length },
              { id: 'records', title: 'Invoices', sub: 'চালানসমূহ', icon: FileText, color: 'text-blue-650 bg-blue-50 border-blue-100 dark:bg-blue-950/20 dark:border-blue-900/40' },
              { id: 'create_invoice', title: 'Customers', sub: 'গ্রাহকসমূহ', icon: Users, color: 'text-amber-650 bg-amber-50 border-amber-100 dark:bg-amber-950/20 dark:border-amber-900/40' },
              { id: 'records', title: 'Transactions', sub: 'লেনদেন', icon: ArrowLeftRight, color: 'text-teal-650 bg-teal-50 border-teal-100 dark:bg-teal-950/20 dark:border-teal-900/40' },
              { id: 'records', title: 'Reports', sub: 'রিপোর্টস', icon: FileSpreadsheet, color: 'text-rose-650 bg-rose-50 border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/40' }
            ].map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => setAdminActiveTab(item.id as any)}
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

        {/* Revenue Overview Line Chart Section */}
        <div className="space-y-3.5 bg-slate-50/45 dark:bg-slate-950/10 border border-slate-100/80 dark:border-slate-800/40 p-4 rounded-[22px] text-left">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block leading-none">Revenue Overview</span>
              <h4 className="text-xs font-black text-slate-800 dark:text-white mt-1">মোট আয় (৳)</h4>
            </div>
            <select className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-[10px] font-bold text-slate-550 dark:text-slate-400 px-2 py-1 rounded-lg outline-none cursor-pointer">
              <option>This Month</option>
              <option>Last Month</option>
              <option>This Year</option>
            </select>
          </div>
          
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight leading-none">৳{stats.totalRevenue.toLocaleString()}</span>
            <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-450 flex items-center gap-0.5">
              <TrendingUp size={11} className="stroke-[3]" /> +12.5% গত মাসের তুলনায়
            </span>
          </div>

          {/* Area Chart trend sparkline */}
          <div className="h-[90px] w-full mt-2 select-none">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyRevenueData.data} margin={{ top: 2, right: 2, left: -40, bottom: 2 }}>
                <defs>
                  <linearGradient id="p1Grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#p1Grad)" />
                <Tooltip contentStyle={{ display: 'none' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4 sub-metrics bento cards */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Total Expenses', bng: 'মোট খরচ', val: `৳${stats.totalInvestment.toLocaleString()}`, trend: '-8.3%', down: true, icon: TrendingDown, color: 'text-rose-500 bg-rose-50/50 border-rose-100/40 dark:bg-rose-950/10 dark:border-rose-900/20' },
            { label: 'Net Profit (85%)', bng: 'নেট প্রফিট', val: `৳${stats.netProfit.toLocaleString()}`, trend: '+15.8%', down: false, icon: TrendingUp, color: 'text-indigo-500 bg-indigo-50/50 border-indigo-100/40 dark:bg-indigo-950/10 dark:border-indigo-900/20' },
            { label: 'Due Balance', bng: 'বকেয়া ব্যালেন্স', val: `৳${stats.dueBalance.toLocaleString()}`, trend: '+5.6%', down: false, icon: Activity, color: 'text-amber-500 bg-amber-50/50 border-amber-100/40 dark:bg-amber-950/10 dark:border-amber-900/20' },
            { label: 'Total Customers', bng: 'মোট কাস্টমার', val: `${totalUsersCount} জন`, trend: '+5.6%', down: false, icon: Users, color: 'text-blue-500 bg-blue-50/50 border-blue-100/40 dark:bg-blue-950/10 dark:border-blue-900/20' }
          ].map(card => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="p-3.5 bg-slate-50/30 dark:bg-slate-950/5 border border-slate-150 dark:border-slate-850/60 rounded-2xl flex flex-col justify-between text-left space-y-2.5">
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
                  <span className={`text-[8.5px] font-black mt-1 flex items-center gap-0.5 ${card.down ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {card.down ? '▼' : '▲'} {card.trend}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Company Health Circle Gauge */}
        <div className="bg-slate-50/35 dark:bg-slate-950/15 border border-slate-150/80 dark:border-slate-850/50 p-4 rounded-[22px] flex flex-col space-y-4">
          <div className="flex items-center gap-4 text-left">
            {/* Radial Progress Circle */}
            <div className="relative flex items-center justify-center shrink-0 w-16 h-16">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="32" cy="32" r="27" className="stroke-slate-200 dark:stroke-slate-800" strokeWidth="5.5" fill="transparent" />
                <circle 
                  cx="32" 
                  cy="32" 
                  r="27" 
                  className="stroke-emerald-500 transition-all duration-700 ease-out" 
                  strokeWidth="5.5" 
                  fill="transparent" 
                  strokeDasharray={2 * Math.PI * 27} 
                  strokeDashoffset={2 * Math.PI * 27 * (1 - healthScore / 100)} 
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-xs sm:text-sm font-black text-slate-850 dark:text-white font-mono">{healthScore}%</span>
            </div>
            
            <div className="text-left leading-snug">
              <h4 className="text-[11.5px] font-black uppercase text-indigo-500/90 tracking-wider">Company Health</h4>
              <span className="text-[12.5px] font-black text-slate-850 dark:text-white block mt-0.5">Excellent Status</span>
              <p className="text-[9.5px] font-bold text-slate-400 dark:text-slate-500 mt-0.5">আপনার সিস্টেম সম্পূর্ণ নিরাপদ ও কার্যকর রয়েছে।</p>
            </div>
          </div>

          {/* Criteria Checklist with tick icons */}
          <div className="grid grid-cols-2 gap-2 text-left pt-1 border-t border-slate-150/40 dark:border-slate-850/40">
            {[
              { label: 'আর্থিক তথ্য' },
              { label: 'গ্রাহকসেবা স্ট্যাটাস' },
              { label: 'ডাটাবেস নিরাপত্তা' },
              { label: 'সার্ভার ও সিস্টেম' }
            ].map(cri => (
              <div key={cri.label} className="flex items-center gap-1.5 text-[10.5px] font-bold text-slate-650 dark:text-slate-300">
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-500/10">
                  <Check size={9} className="stroke-[3.5]" />
                </span>
                <span className="truncate">{cri.label}</span>
                <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-450 font-black ml-auto">100%</span>
              </div>
            ))}
          </div>

          <button 
            type="button"
            onClick={() => setAdminActiveTab('notes')}
            className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 hover:text-indigo-850 flex items-center justify-center gap-1 uppercase tracking-wider py-1 border border-indigo-100 dark:border-indigo-900/50 hover:bg-indigo-50/20 rounded-xl transition-all cursor-pointer"
          >
            <span>বিস্তারিত হেলথ রিপোর্ট দেখুন</span>
            <ChevronRight size={12} />
          </button>
        </div>

        {/* Floating action plus button */}
        <button 
          type="button"
          onClick={() => {
            setAdminActiveTab('create_invoice');
            setActiveInlineForm('create_invoice_direct');
          }}
          className="absolute bottom-5 right-5 w-11 h-11 rounded-full bg-gradient-to-tr from-indigo-650 to-violet-550 text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          <Plus size={20} className="stroke-[3]" />
        </button>

      </div>


      {/* ============================================== */}
      {/* 📊 PANEL 2: DETAILED ANALYTICS & ACTIVITY LOGS */}
      {/* ============================================== */}
      <div id="admin-panel2-container" className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[28px] p-5 sm:p-6 shadow-sm flex flex-col space-y-6 select-none text-left">
        
        {/* Revenue Analytics Card */}
        <div className="space-y-4">
          <div className="flex justify-between items-center text-left">
            <div className="text-left">
              <h3 className="text-[12px] font-bold text-slate-900 dark:text-white uppercase tracking-wider leading-none">Revenue Analytics</h3>
              <span className="text-[10px] text-slate-400 dark:text-slate-550 font-medium">আয় ও লাভ বিশ্লেষণ গ্রাফ</span>
            </div>
            <button className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-all border border-slate-200/50 dark:border-slate-800">
              <Plus size={14} />
            </button>
          </div>

          {/* Pill tabs matching screenshot */}
          <div className="bg-slate-50 dark:bg-slate-950 p-1 rounded-xl border border-slate-200/40 dark:border-slate-850 flex items-center justify-between gap-1">
            {[
              { id: 'daily', label: 'দৈনিক' },
              { id: 'weekly', label: 'সাপ্তাহিক' },
              { id: 'monthly', label: 'মাসিক' },
              { id: 'yearly', label: 'বার্ষিক' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  if (tab.id === 'daily') setChartMetricMode('daily');
                  if (tab.id === 'weekly') setChartMetricMode('cumulative');
                  if (tab.id === 'monthly' || tab.id === 'yearly') setChartMetricMode('profit');
                }}
                className="flex-1 py-1 px-1.5 text-center text-[10.5px] font-black rounded-lg transition-all cursor-pointer"
                style={{
                  backgroundColor: (tab.id === 'monthly' && chartMetricMode === 'profit') || (tab.id === 'daily' && chartMetricMode === 'daily') || (tab.id === 'weekly' && chartMetricMode === 'cumulative') ? '#6366f1' : 'transparent',
                  color: (tab.id === 'monthly' && chartMetricMode === 'profit') || (tab.id === 'daily' && chartMetricMode === 'daily') || (tab.id === 'weekly' && chartMetricMode === 'cumulative') ? '#ffffff' : '#64748b'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Curve Line Chart with Dot Markers */}
          <div className="h-[140px] w-full select-none relative pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyRevenueData.data} margin={{ top: 10, right: 10, left: -42, bottom: 2 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#64748b" opacity={0.05} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 700 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 9 }} />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900/95 dark:bg-slate-950/95 text-white px-3 py-1.5 rounded-xl border border-indigo-500/20 shadow-lg text-[10px] font-bold">
                          <p className="opacity-75">20 May 2024</p>
                          <p className="text-indigo-400 font-mono mt-0.5">৳ {Number(payload[0].value).toLocaleString()}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line type="monotone" dataKey={chartMetricMode === 'daily' ? 'revenue' : 'cumulative'} stroke="#6366f1" strokeWidth={3} dot={{ r: 3, fill: '#6366f1', strokeWidth: 1 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Total Customers Box Card */}
        <div className="bg-slate-50/50 dark:bg-slate-955/20 border border-slate-150 dark:border-slate-850 p-4 rounded-2xl flex items-center justify-between text-left">
          <div className="space-y-0.5 text-left">
            <span className="text-[9.5px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Total Customers</span>
            <span className="text-[10px] font-bold text-slate-550 dark:text-slate-400 block">মোট গ্রাহক</span>
            <h4 className="text-[17px] font-black text-slate-850 dark:text-white font-mono leading-none mt-1.5">{totalUsersCount} জন</h4>
          </div>
          <div className="w-10 h-10 rounded-full bg-violet-100/70 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100/20 dark:border-indigo-900/35 flex items-center justify-center shrink-0">
            <Users size={18} />
          </div>
        </div>

        {/* Invoice Summary Card */}
        <div className="bg-slate-50/25 dark:bg-slate-955/5 border border-slate-150/70 dark:border-slate-855 p-4 rounded-[22px] flex flex-col space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-[11.5px] font-black text-slate-850 dark:text-white uppercase tracking-tight">Invoice Summary</span>
          </div>

          <div className="grid grid-cols-12 gap-2.5 items-center">
            {/* Donut Chart representation */}
            <div className="col-span-5 relative flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-24 h-24 transform -rotate-90">
                {/* Paid (53%) */}
                <circle cx="50" cy="50" r="38" stroke="#6366f1" strokeWidth="11" fill="transparent" strokeDasharray="238" strokeDashoffset="0" />
                {/* Unpaid (30%) */}
                <circle cx="50" cy="50" r="38" stroke="#3b82f6" strokeWidth="11" fill="transparent" strokeDasharray="238" strokeDashoffset="126" />
                {/* Pending (17%) */}
                <circle cx="50" cy="50" r="38" stroke="#f59e0b" strokeWidth="11" fill="transparent" strokeDasharray="238" strokeDashoffset="198" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-1 leading-none select-none">
                <span className="text-[10.5px] font-black font-mono text-slate-850 dark:text-white">৳85,430</span>
                <span className="text-[7.5px] font-bold text-slate-400 mt-0.5">মোট ইনভয়েস</span>
              </div>
            </div>

            {/* Legend Items */}
            <div className="col-span-7 text-left space-y-1.5 pl-2 text-xs">
              {[
                { label: 'পেইড', val: '৳ 45,250 (53%)', color: 'bg-indigo-500' },
                { label: 'আনপেইড', val: '৳ 25,430 (30%)', color: 'bg-blue-500' },
                { label: 'পেন্ডিং', val: '৳ 14,750 (17%)', color: 'bg-amber-500' }
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${item.color} shrink-0`} />
                  <div className="text-left leading-none font-bold">
                    <span className="text-slate-400 dark:text-slate-500 text-[9px] block leading-none">{item.label}</span>
                    <span className="text-slate-700 dark:text-slate-350 text-[10.5px] block mt-0.5 font-mono">{item.val}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button 
            type="button"
            onClick={() => setAdminActiveTab('records')}
            className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 hover:text-indigo-850 flex items-center justify-center gap-1 uppercase tracking-wider py-1 border border-indigo-100 dark:border-indigo-900/50 hover:bg-indigo-50/20 rounded-xl transition-all cursor-pointer"
          >
            <span>সম্পূর্ণ ইনভয়েস দেখুন</span>
            <ChevronRight size={12} />
          </button>
        </div>

        {/* Rocket Marketing Banner Card */}
        <div className="relative rounded-[22px] bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4.5 overflow-hidden shadow-xs flex items-center">
          <div className="relative z-10 max-w-[65%] text-left space-y-1">
            <h4 className="text-xs sm:text-sm font-black tracking-tight flex items-center gap-1.5">
              <Sparkles size={13} className="text-yellow-350" />
              স্মার্ট বিজনেস, সফল ভবিষ্যৎ
            </h4>
            <p className="text-[9.5px] opacity-90 leading-normal">ডেটা ভিত্তিক সিদ্ধান্ত নিন আর এগিয়ে থাকুন প্রতিযোগিতায়।</p>
          </div>
          {/* Rocket SVG illustration blasting off */}
          <div className="absolute right-3 bottom-0 top-0 w-[30%] flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-14 h-14 drop-shadow-md">
              {/* Rocket */}
              <path d="M 50,15 C 60,35 60,55 55,75 L 45,75 C 40,55 40,35 50,15 Z" fill="#ffffff" />
              <path d="M 50,15 C 47,35 45,55 45,75 L 50,75 Z" fill="#e2e8f0" />
              <circle cx="50" cy="35" r="5" fill="#3b82f6" />
              {/* Wings */}
              <path d="M 43,55 L 25,70 L 41,70 Z" fill="#f43f5e" />
              <path d="M 57,55 L 75,70 L 59,70 Z" fill="#f43f5e" />
              {/* Fire */}
              <path d="M 45,76 L 50,95 L 55,76 Z" fill="#f59e0b" className="animate-pulse" />
              <path d="M 47,76 L 50,88 L 53,76 Z" fill="#ef4444" />
            </svg>
          </div>
        </div>

        {/* Recent Activities Section */}
        <div className="space-y-3">
          <div className="flex justify-between items-center text-left">
            <div>
              <h3 className="text-[12px] font-bold text-slate-900 dark:text-white uppercase tracking-wider leading-none">Recent Activities</h3>
              <span className="text-[10px] text-slate-400 dark:text-slate-550 font-medium">সাম্প্রতিক অ্যাক্টিভিটি লগ</span>
            </div>
            <button 
              type="button"
              onClick={() => setAdminActiveTab('records')}
              className="text-[9.5px] font-black text-indigo-650 dark:text-indigo-400 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-lg transition-all cursor-pointer hover:bg-indigo-50/20"
            >
              সব দেখুন
            </button>
          </div>

          <div className="space-y-2.5">
            {[
              { title: 'নতুন গ্রাহক নিবন্ধিত হয়েছে', sub: 'রাকিবুল ইসলাম (ID: #1024)', time: '২ মিনিট আগে', color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400', icon: Users },
              { title: 'চালান #INV-2024-0001 অনুমোদিত', sub: 'পরিমাণ: ৳ 5,000', time: '১০ মিনিট আগে', color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400', icon: FileText },
              { title: 'লেনদেন অনুমোদিত হয়েছে', sub: 'Transaction ID: TXN-1024', time: '১৫ মিনিট আগে', color: 'bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400', icon: CheckCircle }
            ].map((act, i) => {
              const Icon = act.icon;
              return (
                <div key={i} className="flex items-start gap-3 p-3.5 bg-slate-50/50 dark:bg-slate-950/15 border border-slate-150/80 dark:border-slate-850/60 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors">
                  <div className={`w-8.5 h-8.5 rounded-xl flex items-center justify-center shrink-0 border border-black/[0.03] ${act.color}`}>
                    <Icon size={14} className="stroke-[2.5]" />
                  </div>
                  <div className="min-w-0 flex-1 text-left leading-normal">
                    <h4 className="text-[11.5px] font-black text-slate-800 dark:text-slate-100">{act.title}</h4>
                    <p className="text-[10px] text-slate-450 dark:text-slate-400 mt-0.5">{act.sub}</p>
                    <span className="text-[8.5px] font-bold text-slate-400 dark:text-slate-550 mt-1 block font-mono">{act.time}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
