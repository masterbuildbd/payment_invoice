import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader2, CheckCircle2, ShieldCheck, Mail, Phone, Calendar, Hash, CreditCard } from 'lucide-react';
import { getInvoiceById } from '../lib/storage';
import { Invoice } from '../types';

export function PublicVerify() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInvoice() {
      if (!invoiceId) {
        setLoading(false);
        return;
      }
      
      try {
        const found = await getInvoiceById(invoiceId);
        setInvoice(found || null);
      } catch (err) {
        console.error('Verification failed', err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    }
    
    fetchInvoice();
  }, [invoiceId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <Loader2 className="animate-spin text-indigo-600 mb-4" size={40} />
        <p className="text-slate-500 font-medium animate-pulse">Verifying Authenticity...</p>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mb-6 border border-rose-100">
          <Hash className="text-rose-500" size={32} />
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Invoice Not Found</h1>
        <p className="text-slate-500 mt-2 max-w-xs mx-auto text-sm leading-relaxed">
          The invoice ID you are trying to verify does not exist in our secure database.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Header Banner */}
      <div className="bg-indigo-600 px-6 py-12 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-white rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mb-4 border border-white/30">
            <ShieldCheck className="text-white" size={32} />
          </div>
          <h1 className="text-white text-2xl font-black tracking-tight uppercase">Master Certified</h1>
          <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-[0.2em] mt-1 opacity-80">Official Transaction Record</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 -mt-8 relative z-20">
        {/* Main Details Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-indigo-900/5 border border-slate-200 overflow-hidden">
          <div className="p-8">
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100">
              <div>
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Invoice ID</h2>
                <p className="text-xl font-mono font-black text-indigo-600 leading-none">#{invoice.id}</p>
              </div>
              <div className="text-right">
                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border italic ${
                  invoice.status === 'paid' 
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                    : 'bg-amber-50 text-amber-600 border-amber-100'
                }`}>
                  {invoice.status}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-4 group">
                <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                  <CheckCircle2 size={20} />
                </div>
                <div className="flex-1">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5 leading-none">Billed To</h3>
                  <p className="text-sm font-bold text-slate-900 leading-tight lowercase first-letter:uppercase">{invoice.customerName}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 group">
                <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                  <Calendar size={20} />
                </div>
                <div className="flex-1">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5 leading-none">Date Issued</h3>
                  <p className="text-sm font-bold text-slate-900 leading-tight">{invoice.createdAt}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 group">
                <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                  <CreditCard size={20} />
                </div>
                <div className="flex-1">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5 leading-none">Transaction ID</h3>
                  <p className="text-sm font-bold text-indigo-600 leading-tight font-mono">{invoice.transactionId}</p>
                </div>
              </div>
            </div>

            {/* Amount Section */}
            <div className="mt-10 p-6 bg-slate-900 rounded-2xl text-center shadow-lg shadow-slate-900/10">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 leading-none">Total Paid Amount</h3>
              <p className="text-3xl font-black text-white tracking-tight leading-none italic">৳{invoice.amount.toFixed(2)}</p>
            </div>
          </div>
          
          <div className="bg-slate-50 px-8 py-5 border-t border-slate-100 flex items-center justify-center gap-2">
            <CheckCircle2 className="text-emerald-500" size={14} />
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.15em]">Verified Secure by Master</span>
          </div>
        </div>

        {/* Support Section */}
        <div className="mt-8 text-center space-y-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Need Assistance?</p>
          <div className="flex items-center justify-center gap-6">
            <a href="tel:+123456789" className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-600 hover:text-indigo-600 hover:shadow-indigo-100 transition-all">
              <Phone size={18} />
            </a>
            <a href="mailto:support@master.com" className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-600 hover:text-indigo-600 hover:shadow-indigo-100 transition-all">
              <Mail size={18} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
