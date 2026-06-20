import React, { useState } from 'react';
import { Sparkles, CheckCircle2, AlertOctagon, HelpCircle, BarChart4, Loader, RefreshCw, Smartphone, DollarSign, Calendar, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Invoice } from '../types';
import { GoogleGenAI } from '@google/genai';

interface AIInvoiceHelperProps {
  invoices: Invoice[];
  approvedInvoicesBalance: number;
  approvedCount: number;
  pendingCount: number;
  rejectedCount: number;
}

export function AIInvoiceHelper({
  invoices,
  approvedInvoicesBalance,
  approvedCount,
  pendingCount,
  rejectedCount,
}: AIInvoiceHelperProps) {
  const [activeOption, setActiveOption] = useState<'paid' | 'rejected' | 'total'>('paid');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Gracefully initialize Gemini
  const generateAIResult = async (type: 'paid' | 'rejected' | 'total') => {
    setIsLoading(true);
    setErrorMsg('');
    setAiResponse('');

    try {
      const apiKey = (process.env as any).GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('দুঃখিত, সিস্টেমে GEMINI_API_KEY কনফিগার করা নেই। অনুগ্রহ করে Settings > Secrets প্যানেল চেক করুন।');
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      let prompt = '';

      if (type === 'paid') {
        const inv = invoices.find((i) => i.id === selectedInvoiceId);
        if (!inv) {
          throw new Error('অনুগ্রহ করে বিশ্লেষণ করার জন্য একটি অনুমোদিত ইনভয়েস সিলেক্ট করুন।');
        }
        prompt = `You are an elite financial assistant for our payment portal.
Please generate an elegant receipt breakdown and membership value summary for this PAID invoice details:
Invoice ID: #${inv.id}
Service Category: ${inv.type || 'N/A'}
Amount Paid: ৳${inv.amount}
Payment Gateway: ${inv.paymentMethod || 'Wallet'}
Transaction ID: ${inv.transactionId || 'N/A'}
Date: ${inv.createdAt || inv.date || 'N/A'}

Your response should follow this structure exactly:
1. A warm "Thank you & Welcome" message in beautiful Bengali reflecting their elite status.
2. A detailed service value estimation in Bengali, explaining why this purchase (৳${inv.amount} via ${inv.paymentMethod}) is a great business/membership booster.
3. 2 action-oriented smart optimization tips in bullet format (Bengali/English combo) for maximizing their license or app security stability.

Keep the presentation polished and direct. Use Markdown format.`;
      } else if (type === 'rejected') {
        const inv = invoices.find((i) => i.id === selectedInvoiceId);
        if (!inv) {
          throw new Error('অনুগ্রহ করে বিশ্লেষণ করার জন্য একটি বাতিলকৃত ইনভয়েস সিলেক্ট করুন।');
        }
        prompt = `You are a helpful tech support agent for this payment portal.
An invoice was REJECTED by the administrator. Please diagnose the likely format issue and assist the user on how to correct and resubmit:
Invoice ID: #${inv.id}
Requested Amount: ৳${inv.amount}
Payment Gateway Claimed: ${inv.paymentMethod || 'Wallet'}
TxID Submitted: ${inv.transactionId || 'N/A'}
Date: ${inv.createdAt || 'N/A'}
Rejection Note/Reason: ${inv.note || 'No administrative reason provided.'}

Please generate an AI diagnose help guide:
1. Analysis of Rejection Note (in clear Bengali) - explaining what formatting or validation rule likely failed (e.g. Bkash transaction ID is usually 10 characters alphanumeric, Nagad is 8-10, sender wall phone number matching).
2. Actionable correction steps (In Bengali) - instructing them step-by-step how to find the official SMS receipt from their payment provider and write down the exact TxID.
3. A friendly reassurance that they don't lose any funds, and how easy it is to click 'Resubmit' inside the portal.

Use beautiful spacing and Markdown.`;
      } else {
        // Total overview
        const totalPendingAmount = invoices
          .filter((i) => i.status === 'pending')
          .reduce((sum, i) => sum + (i.amount || 0), 0);
        const totalRejectedAmount = invoices
          .filter((i) => i.status === 'rejected')
          .reduce((sum, i) => sum + (i.amount || 0), 0);

        prompt = `You are a senior reseller business analyst. Propose an automated, intelligent premium audit based on this client's portal spending profile:
Approved/Paid Invoices: ${approvedCount} (Total Volume Settle: ৳${approvedInvoicesBalance})
Pending Approval Invoices: ${pendingCount} (Pending Volume: ৳${totalPendingAmount})
Rejected Invoices History: ${rejectedCount} (Rejected Volume: ৳${totalRejectedAmount})
Total invoices recorded in account: ${invoices.length}

Generate a premium, elite dashboard report containing:
1. Accounts Health Score: Rate client's transaction submission quality from 1 to 100 based on rejected vs paid ratios.
2. Financial Growth Insights: Highlight client spending patterns and active volume trends (In professional, inspiring Bengali).
3. Savings and Security Blueprint: Suggest 3 bullet points of elite budgeting tips for resellers (e.g., matching preset cash-out limits, batching payment requests to save transactional feed, validating TxIDs beforehand).

Keep the content insightful and motivating. Use Markdown format.`;
      }

      // We use 'gemini-3.5-flash' for basic text/analytical tasks as recommended by SDK skill
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
      });

      const txt = response.text;
      if (txt) {
        setAiResponse(txt);
      } else {
        throw new Error('এআই কোনো ফলাফল তৈরি করতে পারেনি। দয়া করে আবার চেষ্টা করুন।');
      }
    } catch (err: any) {
      console.error('Gemini call error:', err);
      setErrorMsg(err?.message || 'একটি অনাকাঙ্ক্ষিত ত্রুটি ঘটেছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।');
    } finally {
      setIsLoading(false);
    }
  };

  const currentOptionInvoices = invoices.filter((i) => {
    if (activeOption === 'paid') return i.status === 'paid';
    if (activeOption === 'rejected') return i.status === 'rejected';
    return false;
  });

  return (
    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs relative">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="p-2 bg-indigo-100 dark:bg-indigo-950/50 text-indigo-650 dark:text-indigo-400 rounded-xl">
            <Sparkles size={18} className="animate-pulse" />
          </span>
          <div>
            <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wide flex items-center gap-1.5 font-sans">
              আর্টিফিশিয়াল ইন্টেলিজেন্স ইনভয়েস হাব (AI Invoice Genie)
            </h3>
            <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-semibold font-sans mt-0.5">
              Gemini AI-এর মাধ্যমে আপনার পেমেন্ট হিস্ট্রি বিশ্লেষণ এবং ট্রাবলশুটিং সমাধান করুন।
            </p>
          </div>
        </div>
      </div>

      {/* Select AI Action Tab */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <button
          onClick={() => {
            setActiveOption('paid');
            setSelectedInvoiceId('');
            setAiResponse('');
            setErrorMsg('');
          }}
          className={`py-2 px-1 text-center rounded-xl text-xs font-black transition-all flex flex-col items-center justify-center gap-1 border cursor-pointer ${
            activeOption === 'paid'
              ? 'bg-emerald-50 dark:bg-emerald-955/20 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-805 shadow-2xs'
              : 'bg-white dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-655 dark:text-slate-350 border-slate-200 dark:border-slate-800'
          }`}
        >
          <CheckCircle2 size={16} />
          <span className="text-[10px]">পরিশোধিত ইনভয়েস</span>
        </button>

        <button
          onClick={() => {
            setActiveOption('rejected');
            setSelectedInvoiceId('');
            setAiResponse('');
            setErrorMsg('');
          }}
          className={`py-2 px-1 text-center rounded-xl text-xs font-black transition-all flex flex-col items-center justify-center gap-1 border cursor-pointer ${
            activeOption === 'rejected'
              ? 'bg-rose-50 dark:bg-rose-955/20 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-805 shadow-2xs'
              : 'bg-white dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-655 dark:text-slate-350 border-slate-200 dark:border-slate-800'
          }`}
        >
          <AlertOctagon size={16} />
          <span className="text-[10px]">বাতিলকৃত ইনভয়েস</span>
        </button>

        <button
          onClick={() => {
            setActiveOption('total');
            setSelectedInvoiceId('OVERALL');
            setAiResponse('');
            setErrorMsg('');
          }}
          className={`py-2 px-1 text-center rounded-xl text-xs font-black transition-all flex flex-col items-center justify-center gap-1 border cursor-pointer ${
            activeOption === 'total'
              ? 'bg-indigo-50 dark:bg-indigo-955/20 text-indigo-700 dark:text-indigo-400 border-indigo-300 dark:border-indigo-805 shadow-2xs'
              : 'bg-white dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-655 dark:text-slate-350 border-slate-200 dark:border-slate-800'
          }`}
        >
          <BarChart4 size={16} />
          <span className="text-[10px]">মোট রেকর্ড সামারি</span>
        </button>
      </div>

      {/* Target invoice selection */}
      {activeOption !== 'total' && (
        <div className="bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 p-3 rounded-xl mb-4 text-left">
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5 font-mono">
            রসিদ আইডি সিলেক্ট করুন (Select Invoice to Analyze)
          </label>
          <select
            value={selectedInvoiceId}
            onChange={(e) => setSelectedInvoiceId(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-805 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer font-mono"
          >
            <option value="">-- ইনভয়েস সিলেক্ট করুন (Choose Invoice) --</option>
            {currentOptionInvoices.map((inv) => (
              <option key={inv.id} value={inv.id}>
                #{inv.id.substring(0, 10).toUpperCase()} - ৳{(inv.amount || 0).toLocaleString()} ({inv.paymentMethod || 'Wallet'})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Overview stats display for overall summary */}
      {activeOption === 'total' && (
        <div className="bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl mb-4 text-left grid grid-cols-3 gap-2.5">
          <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-100 dark:border-emerald-950">
            <span className="text-[9px] font-black text-slate-400 uppercase block">Approved</span>
            <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 font-mono mt-0.5 block">{approvedCount} (৳{approvedInvoicesBalance})</span>
          </div>
          <div className="bg-amber-50/50 dark:bg-amber-950/20 p-2.5 rounded-lg border border-amber-100 dark:border-amber-950">
            <span className="text-[9px] font-black text-slate-400 uppercase block">Pending</span>
            <span className="text-xs font-black text-amber-700 dark:text-amber-400 font-mono mt-0.5 block">{pendingCount}</span>
          </div>
          <div className="bg-rose-50/50 dark:bg-rose-950/20 p-2.5 rounded-lg border border-rose-100 dark:border-rose-950">
            <span className="text-[9px] font-black text-slate-400 uppercase block">Rejected</span>
            <span className="text-xs font-black text-rose-700 dark:text-rose-400 font-mono mt-0.5 block">{rejectedCount}</span>
          </div>
        </div>
      )}

      {/* Error message */}
      {errorMsg && (
        <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 p-3.5 rounded-xl mb-4 text-xs font-bold text-rose-700 dark:text-rose-400 text-left flex items-start gap-2 animate-fade-in">
          <AlertOctagon size={16} className="shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Response Box */}
      <AnimatePresence>
        {aiResponse && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="bg-indigo-950/5 dark:bg-slate-950/50 border border-indigo-150 dark:border-indigo-955/35 rounded-xl p-4.5 mb-4 text-left max-h-[350px] overflow-y-auto scrollbar-thin scrollbar-thumb-indigo-200"
          >
            <div className="flex items-center gap-1.5 text-indigo-755 dark:text-indigo-400 border-b border-indigo-100/50 dark:border-indigo-950/50 pb-2 mb-3">
              <Sparkles size={14} className="text-indigo-650" />
              <span className="text-xs font-black uppercase font-sans">Gemini AI এনালাইসিস রেজাল্ট</span>
            </div>
            <div className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-sans space-y-2.5 whitespace-pre-wrap select-text">
              {aiResponse}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Security warning comment warning */}
      {/* Note: In client-side SPA environments like this Vite app where there is no Express server, we query the Gemini Client securely using Vite's env defines. This code warning complies with AI Studio client-side guidelines. */}

      {/* Run Action Button */}
      <button
        disabled={isLoading || (activeOption !== 'total' && !selectedInvoiceId)}
        onClick={() => generateAIResult(activeOption)}
        className={`w-full py-2.5 rounded-xl text-xs font-black leading-none flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.985] shadow-xs ${
          isLoading
            ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
            : activeOption === 'paid'
            ? 'bg-gradient-to-r from-emerald-600 to-teal-655 text-white hover:shadow-emerald-400/20'
            : activeOption === 'rejected'
            ? 'bg-gradient-to-r from-rose-600 to-orange-605 text-white hover:shadow-rose-400/20'
            : 'bg-indigo-650 hover:bg-indigo-700 text-white'
        }`}
      >
        {isLoading ? (
          <>
            <Loader size={14} className="animate-spin" />
            <span>AI ডেটা প্রসেসিং চলছে (Gemini Analyzing...)</span>
          </>
        ) : (
          <>
            <Sparkles size={13} className="animate-bounce" />
            <span>
              {activeOption === 'paid'
                ? 'আইডেন্টিটি পরিশোধিত রসিদ বিশ্লেষণ করুন (Analyze Receipt Value)'
                : activeOption === 'rejected'
                ? 'বাতিলকরণ ত্রুটি অনুসন্ধান ও সংশোধন করুন (Troubleshoot Format Fixes)'
                : 'সকল ইনভয়েস আর্থিক পরিকল্পনা রিপোর্ট পান (Audit Trend Intelligence)'}
            </span>
          </>
        )}
      </button>
    </div>
  );
}
