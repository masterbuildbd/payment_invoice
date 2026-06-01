import React, { useMemo, useState } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { 
  TrendingUp, 
  Mail, 
  CheckCircle, 
  Percent, 
  Zap,
  Sparkles,
  RefreshCw,
  Info
} from 'lucide-react';
import { motion } from 'motion/react';

interface SmsLog {
  id: string;
  sender: string;
  recipientPhone: string;
  recipientName: string;
  message: string;
  createdAt: string;
  status: 'delivered' | 'failed' | 'pending';
  provider: string;
}

interface SmsAnalyticsProps {
  logs: SmsLog[];
}

export function SmsAnalytics({ logs }: SmsAnalyticsProps) {
  const [includeDemoData, setIncludeDemoData] = useState(true);

  // Generate last 7 days list
  const chartData = useMemo(() => {
    const days = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      
      // Format to "DD MMM", e.g., "01 Jun" or "31 May"
      const formattedDate = d.toLocaleDateString('bn-BD', { day: '2-digit', month: 'short' });
      const isoString = d.toISOString().split('T')[0];
      
      days.push({
        displayName: formattedDate,
        dateString: isoString,
        rawDate: d,
        demoSent: 12 + (i % 3) * 8 + Math.floor(Math.sin(i) * 5),
        demoSuccessRate: 94 + (i % 2) * 4 + (i === 0 ? 2 : 0),
      });
    }

    // Aggregate real log counts
    return days.map(day => {
      // Filter logs of this day
      const realLogs = logs.filter(log => {
        if (!log.createdAt) return false;
        const logDateStr = log.createdAt.split('T')[0];
        return logDateStr === day.dateString;
      });

      const realCount = realLogs.length;
      const realDelivered = realLogs.filter(l => l.status === 'delivered').length;
      const realSuccessRate = realCount > 0 ? Math.round((realDelivered / realCount) * 100) : 100;

      // Merge behavior
      let finalSent = realCount;
      let finalSuccessRate = realSuccessRate;

      if (includeDemoData) {
        finalSent += day.demoSent;
        // Weighted average of success rate
        const totalDemoDelivered = Math.round((day.demoSent * day.demoSuccessRate) / 100);
        const aggregatedSent = finalSent;
        const aggregatedDelivered = realDelivered + totalDemoDelivered;
        finalSuccessRate = aggregatedSent > 0 ? Math.round((aggregatedDelivered / aggregatedSent) * 100) : 100;
      }

      return {
        name: day.displayName,
        'ব্যবহৃত এসএমএস (SMS Sent)': finalSent,
        'সাফল্যের হার (Success Rate)': finalSuccessRate,
      };
    });
  }, [logs, includeDemoData]);

  // Aggregate global stats based on active dataset
  const stats = useMemo(() => {
    let totalSent = logs.length;
    let totalDelivered = logs.filter(l => l.status === 'delivered').length;
    
    // Seed adjustment
    if (includeDemoData) {
      // Sum demo data
      const demoSum = 120 + Math.floor(Math.random() * 10);
      const demoDelSum = Math.round(demoSum * 0.96);
      totalSent += demoSum;
      totalDelivered += demoDelSum;
    }

    const avgSuccessRate = totalSent > 0 ? Math.round((totalDelivered / totalSent) * 100) : 100;
    const estimatedCost = totalSent * 0.35; // 0.35 BDT per sms part

    return {
      totalSent,
      totalDelivered,
      avgSuccessRate,
      estimatedCost
    };
  }, [logs, includeDemoData]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="bg-white border border-slate-200 rounded-[1.5rem] p-5 shadow-xs space-y-5"
    >
      {/* Header section with status triggers */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rose-50/10 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="p-1 px-2 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-black tracking-widest uppercase flex items-center gap-1">
              <Sparkles size={11} className="animate-spin" style={{ animationDuration: '3s' }} /> ANALYTICS ACTIVE
            </span>
          </div>
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp size={16} className="text-indigo-650" />
            এসএমএস ডেলিভারি ও রিয়েলটাইম পারফরম্যান্স গ্রাফ
          </h2>
          <p className="text-[10px] text-slate-500">
            বিগত ৭ দিনের এসএমএস ব্যবহার এবং সফলতার হারের একটি ভিজ্যুয়াল বিশ্লেষণ চিত্র।
          </p>
        </div>

        {/* Preset configuration switcher */}
        <div className="flex items-center gap-2">
          <label className="inline-flex items-center gap-1.5 p-1 px-3 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-bold text-slate-500 hover:bg-slate-100 transition-all cursor-pointer">
            <input 
              type="checkbox" 
              checked={includeDemoData}
              onChange={(e) => setIncludeDemoData(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500 w-3 h-3"
            />
            <span>ডেমো হিস্টোরি ডেটা যুক্ত করুন (Simulate history)</span>
          </label>
        </div>
      </div>

      {/* 4 Premium Metric Visualizers */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* Metric 1 */}
        <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100/50 flex items-center justify-center text-indigo-600 flex-shrink-0">
            <Mail size={18} />
          </div>
          <div>
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">মোট প্রেরিত (Total Sent)</div>
            <div className="text-lg font-black text-slate-800 leading-none">
              {stats.totalSent} <span className="text-[10px] text-slate-400 font-bold">টি</span>
            </div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100/50 flex items-center justify-center text-emerald-600 flex-shrink-0">
            <CheckCircle size={18} />
          </div>
          <div>
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">সফল ডেলিভারি (Delivered)</div>
            <div className="text-lg font-black text-emerald-650 leading-none">
              {stats.totalDelivered} <span className="text-[10px] text-emerald-500/80 font-bold">টি</span>
            </div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100/50 flex items-center justify-center text-amber-600 flex-shrink-0">
            <Percent size={18} />
          </div>
          <div>
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">গড় সফলতার হার (Success rate)</div>
            <div className="text-lg font-black text-slate-800 leading-none">
              {stats.avgSuccessRate} <span className="text-[10px] text-slate-400 font-bold">%</span>
            </div>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100/50 flex items-center justify-center text-teal-600 flex-shrink-0">
            <Zap size={18} />
          </div>
          <div>
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">আনুমানিক খরচ (Est Cost)</div>
            <div className="text-lg font-black text-slate-800 leading-none">
              ৳ {stats.estimatedCost.toFixed(2)}
            </div>
          </div>
        </div>

      </div>

      {/* Main Graph Area */}
      <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 relative">
        <div className="h-64 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 15, right: 15, left: -10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} 
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
              />
              <YAxis 
                yAxisId="left"
                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
                allowDecimals={false}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                domain={[80, 100]}
                tick={{ fill: '#059669', fontSize: 10, fontWeight: 'bold' }}
                axisLine={{ stroke: '#a7f3d0' }}
                tickLine={false}
                unit="%"
              />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '1rem', 
                  backgroundColor: '#0f172a', 
                  border: 'none',
                  color: '#fff',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend 
                verticalAlign="top" 
                height={36} 
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingBottom: '10px' }}
              />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="ব্যবহৃত এসএমএস (SMS Sent)" 
                stroke="#4f46e5" 
                strokeWidth={3}
                activeDot={{ r: 6 }} 
                dot={{ stroke: '#4f46e5', strokeWidth: 2, r: 3, fill: '#fff' }}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="সাফল্যের হার (Success Rate)" 
                stroke="#10b981" 
                strokeWidth={3}
                activeDot={{ r: 6 }}
                dot={{ stroke: '#10b981', strokeWidth: 2, r: 3, fill: '#fff' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* Decorative dynamic gateway helper badge */}
        <div className="absolute bottom-3 right-4 hidden md:flex items-center gap-1.5 p-1 px-2.5 bg-white border border-slate-100 rounded-lg text-[9px] font-black text-slate-400 hover:text-indigo-600 transition-colors">
          <Info size={11} className="text-slate-400" />
          <span>২টি ভিন্ন Y-Axes: বাম পাশে সংখ্যা, ডান পাশে ডেলিভারি পারসেন্টেজ</span>
        </div>
      </div>
    </motion.div>
  );
}
