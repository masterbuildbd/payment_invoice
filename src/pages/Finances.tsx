import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3, Banknote, Search, TrendingUp, TrendingDown, Wallet, PieChart, Calendar, Activity, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Investment, Invoice } from '../types';
import { Modal } from '../components/Modal';
import { subscribeToCollection, createDocument, updateDocument, deleteDocument } from '../lib/storage';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

// Custom Tooltip component for Recharts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-800 p-3.5 rounded-xl shadow-xl text-xs space-y-1.5 text-white">
        <p className="font-extrabold text-slate-300 border-b border-white/10 pb-1.5 mb-1.5">{label}</p>
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 font-bold text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            Income:
          </span>
          <span className="font-black font-mono">৳{payload[0].value.toLocaleString()}</span>
        </div>
        {payload[1] && (
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 font-bold text-rose-400">
              <span className="w-2 h-2 rounded-full bg-rose-400"></span>
              Expense:
            </span>
            <span className="font-black font-mono">৳{payload[1].value.toLocaleString()}</span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

export default function Finances() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [investmentToDelete, setInvestmentToDelete] = useState<Investment | null>(null);
  const [search, setSearch] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: 'Apps Invest',
    date: new Date().toISOString().split('T')[0],
    note: ''
  });

  useEffect(() => {
    const unsubInvestments = subscribeToCollection<Investment>('investments', setInvestments, 'date');
    const unsubInvoices = subscribeToCollection<Invoice>('invoices', setInvoices, 'createdAt');
    return () => {
      unsubInvestments();
      unsubInvoices();
    };
  }, []);

  const totalRevenue = invoices
    .filter(inv => inv.status === 'paid' || inv.status === 'approved')
    .reduce((sum, inv) => sum + (inv.paidAmount || inv.amount || 0), 0);
  const totalInvestment = investments.reduce((sum, inv) => sum + inv.amount, 0);
  const netProfit = totalRevenue - totalInvestment;

  // Process last 30 days Income/Expense Trend data
  const last30DaysData = React.useMemo(() => {
    const dates: { dateStr: string; label: string; income: number; expense: number }[] = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const label = `${monthNames[d.getMonth()]} ${d.getDate()}`;
      dates.push({ dateStr, label, income: 0, expense: 0 });
    }

    invoices.forEach(inv => {
      if (inv.status !== 'paid' && inv.status !== 'approved') return;
      const invDateStr = (inv.createdAt || '').split('T')[0] || (inv.createdAt || '').split(' ')[0];
      const match = dates.find(d => d.dateStr === invDateStr);
      if (match) {
        match.income += (inv.paidAmount || inv.amount || 0);
      }
    });

    investments.forEach(inst => {
      const instDateStr = (inst.date || '').split('T')[0];
      const match = dates.find(d => d.dateStr === instDateStr);
      if (match) {
        match.expense += (inst.amount || 0);
      }
    });

    return dates;
  }, [invoices, investments]);

  // Aggregate insights statistics
  const thirtyDayStats = React.useMemo(() => {
    let totalIncome30 = 0;
    let totalExpense30 = 0;
    let peakIncome = { amount: 0, label: 'N/A' };
    let peakExpense = { amount: 0, label: 'N/A' };

    last30DaysData.forEach(d => {
      totalIncome30 += d.income;
      totalExpense30 += d.expense;
      if (d.income > peakIncome.amount) {
        peakIncome = { amount: d.income, label: d.label };
      }
      if (d.expense > peakExpense.amount) {
        peakExpense = { amount: d.expense, label: d.label };
      }
    });

    return {
      avgIncome: totalIncome30 / 30,
      avgExpense: totalExpense30 / 30,
      peakIncome,
      peakExpense
    };
  }, [last30DaysData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      amount: Number(formData.amount)
    };

    if (editingInvestment) {
      await updateDocument<Investment>('investments', editingInvestment.id, data);
    } else {
      await createDocument<Investment>('investments', data);
    }

    handleClose();
  };

  const handleEdit = (inv: Investment) => {
    setEditingInvestment(inv);
    setFormData({
      title: inv.title,
      amount: inv.amount.toString(),
      category: inv.category,
      date: inv.date,
      note: inv.note || ''
    });
    setShowCreate(true);
  };

  const handleDelete = (inv: Investment) => {
    setInvestmentToDelete(inv);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (investmentToDelete) {
      await deleteDocument('investments', investmentToDelete.id);
      setShowDeleteConfirm(false);
      setInvestmentToDelete(null);
    }
  };

  const handleClose = () => {
    setShowCreate(false);
    setEditingInvestment(null);
    setFormData({
      title: '',
      amount: '',
      category: 'Apps Invest',
      date: new Date().toISOString().split('T')[0],
      note: ''
    });
  };

  const filteredInvestments = investments.filter(inv => 
    inv.title.toLowerCase().includes(search.toLowerCase()) ||
    inv.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Financial Reports</h1>
          <p className="text-sm text-slate-500 font-medium">Manage investments and track system profit</p>
        </div>
        <button 
          onClick={() => setShowCreate(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
        >
          <Plus size={18} />
          Add Investment
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 border border-emerald-100">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Revenue</p>
            <p className="text-xl font-black text-slate-900 tracking-tight">৳{totalRevenue.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 border border-amber-100">
            <TrendingDown size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Investment</p>
            <p className="text-xl font-black text-slate-900 tracking-tight">৳{totalInvestment.toLocaleString()}</p>
          </div>
        </div>

        <div className={`p-6 rounded-2xl border flex items-center gap-4 ${netProfit >= 0 ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-rose-600 text-white border-rose-500'}`}>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${netProfit >= 0 ? 'bg-white/10 border-white/20' : 'bg-white/10 border-white/20'}`}>
            <Wallet size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Net Profit</p>
            <p className="text-xl font-black tracking-tight">৳{netProfit.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Analytics Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trends Chart Card */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-50 pb-4 mb-6">
              <div>
                <h2 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse"></span>
                  Income vs Expense Trends
                </h2>
                <p className="text-xs text-slate-400 font-medium">Daily visualization of revenue inflows against business expenses (Past 30 days)</p>
              </div>
              <div className="flex items-center gap-3 bg-slate-50/80 px-3 py-1.5 rounded-xl border border-slate-100 text-[11px] text-slate-500 font-bold w-fit">
                <Calendar size={13} className="text-slate-400" />
                <span>Last 30 Days</span>
              </div>
            </div>

            {/* Recharts Render Container */}
            <div className="h-72 w-full font-sans text-[10px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={last30DaysData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="label" 
                    tickLine={false} 
                    axisLine={false} 
                    stroke="#94a3b8" 
                    dy={10} 
                  />
                  <YAxis 
                    tickLine={false} 
                    axisLine={false} 
                    stroke="#94a3b8" 
                    tickFormatter={(val) => `৳${val}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    verticalAlign="top" 
                    height={36} 
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => <span className="text-slate-500 text-[11px] font-sans font-bold capitalize">{value}</span>}
                  />
                  <Area 
                    name="income"
                    type="monotone" 
                    dataKey="income" 
                    stroke="#10b981" 
                    strokeWidth={2.5}
                    fillOpacity={1} 
                    fill="url(#colorIncome)" 
                  />
                  <Area 
                    name="expense"
                    type="monotone" 
                    dataKey="expense" 
                    stroke="#f43f5e" 
                    strokeWidth={2.5}
                    fillOpacity={1} 
                    fill="url(#colorExpense)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Analytics Insights Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-50 pb-3 flex items-center gap-2">
              <Activity size={15} className="text-indigo-600" />
              Financial Insights
            </h3>
            
            <div className="space-y-4">
              {/* Insight 1: Avg Income */}
              <div className="p-3.5 bg-slate-50/50 rounded-2xl border border-slate-100/50 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Avg. Daily Income</p>
                  <h4 className="text-base font-black text-slate-800 tracking-tight mt-0.5">৳{Math.round(thirtyDayStats.avgIncome).toLocaleString()}</h4>
                </div>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100/50 flex items-center justify-center text-emerald-600">
                  <ArrowUpRight size={18} />
                </div>
              </div>

              {/* Insight 2: Avg Expense */}
              <div className="p-3.5 bg-slate-50/50 rounded-2xl border border-slate-100/50 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Avg. Daily Expense</p>
                  <h4 className="text-base font-black text-slate-800 tracking-tight mt-0.5">৳{Math.round(thirtyDayStats.avgExpense).toLocaleString()}</h4>
                </div>
                <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-100/50 flex items-center justify-center text-rose-600">
                  <ArrowDownRight size={18} />
                </div>
              </div>

              {/* Insight 3: Peak Day Details */}
              <div className="p-3.5 bg-slate-50/50 rounded-2xl border border-slate-100/50 space-y-2.5">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100 pb-1.5">30-Day Peak Activities</p>
                
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Peak Income:
                  </span>
                  <div className="text-right">
                    <span className="text-slate-800 font-black font-sans font-mono">৳{thirtyDayStats.peakIncome.amount.toLocaleString()}</span>
                    <span className="block text-[9px] text-slate-400 font-bold">{thirtyDayStats.peakIncome.label}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                    Peak Expense:
                  </span>
                  <div className="text-right">
                    <span className="text-slate-800 font-black font-sans font-mono">৳{thirtyDayStats.peakExpense.amount.toLocaleString()}</span>
                    <span className="block text-[9px] text-slate-400 font-bold">{thirtyDayStats.peakExpense.label}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-indigo-50/40 border border-indigo-100/30 p-3 rounded-2xl text-[10px] text-indigo-600/90 font-medium text-center mt-4">
            Pro Tip: Keep the investments updated daily for accurate cashflow profiling.
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text"
              placeholder="Search investments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
            />
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
            <PieChart size={14} />
            <span>{filteredInvestments.length} Records</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] uppercase tracking-widest font-bold text-slate-400">
                <th className="px-6 py-4">Investment Details</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredInvestments.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 border border-indigo-100 font-bold text-xs">
                        {inv.title.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{inv.title}</p>
                        {inv.note && <p className="text-[10px] text-slate-400 font-medium truncate max-w-[200px]">{inv.note}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold uppercase tracking-tight">
                      {inv.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs font-medium text-slate-500">{new Date(inv.date).toLocaleDateString()}</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p className="text-sm font-black text-rose-600">৳{inv.amount.toLocaleString()}</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 transition-opacity">
                      <button 
                        onClick={() => handleEdit(inv)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button 
                        onClick={() => handleDelete(inv)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredInvestments.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300">
                        <Banknote size={24} />
                      </div>
                      <p className="text-sm font-bold text-slate-400">No investment records found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showCreate}
        onClose={handleClose}
        title={editingInvestment ? 'Edit Investment' : 'New Investment Record'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Investment Title</label>
            <input 
              required
              type="text" 
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. New Server Setup"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Amount (Taka)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs font-mono">৳</span>
                <input 
                  required
                  type="number" 
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm font-black text-rose-600"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Date</label>
              <input 
                required
                type="date" 
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Category</label>
            <select 
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm font-bold"
            >
              <option value="Apps Invest">Apps Invest</option>
              <option value="Panel Invest">Panel Invest</option>
              <option value="Decoder Invest">Decoder Invest</option>
              <option value="Hosting Bill">Hosting Bill</option>
              <option value="Marketing">Marketing</option>
              <option value="Salary">Salary</option>
              <option value="Office Rent">Office Rent</option>
              <option value="Utility Bills">Utility Bills</option>
              <option value="Other Expenses">Other Expenses</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Note (Optional)</label>
            <textarea 
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              rows={3}
              placeholder="Additional details..."
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm font-medium resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button 
              type="button"
              onClick={handleClose} 
              className="flex-1 px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors border border-slate-100 uppercase tracking-widest"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="flex-1 px-4 py-2.5 text-xs font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all uppercase tracking-widest"
            >
              {editingInvestment ? 'Update' : 'Save'} Record
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Investment Record"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-500 font-medium">Are you sure you want to delete this record? This action cannot be undone.</p>
          <div className="bg-rose-50 p-4 rounded-xl border border-rose-100">
            <p className="text-xs font-bold text-rose-900">{investmentToDelete?.title}</p>
            <p className="text-[10px] text-rose-500 font-bold uppercase mt-1">৳{investmentToDelete?.amount.toLocaleString()}</p>
          </div>
          <div className="flex gap-3 pt-2">
            <button 
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1 px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors border border-slate-100 uppercase tracking-widest"
            >
              Cancel
            </button>
            <button 
              onClick={confirmDelete}
              className="flex-1 px-4 py-2.5 text-xs font-bold bg-rose-600 text-white rounded-xl hover:bg-rose-700 shadow-lg shadow-rose-100 transition-all uppercase tracking-widest"
            >
              Delete Forever
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
