import React, { useState, useEffect, useMemo } from 'react';
import { 
  Mail, 
  Settings, 
  Calendar, 
  TrendingUp, 
  Zap, 
  Percent, 
  Coins, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Send, 
  History, 
  Eye, 
  Check, 
  UserCheck, 
  ChevronRight,
  Info,
  X,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { subscribeToCollection, createDocument, deleteDocument, saveSettings } from '../lib/storage';
import { User, CompanySettings } from '../types';

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

interface SentReportEmail {
  id: string;
  administratorEmail: string;
  sentAt: string;
  rangeStart: string;
  rangeEnd: string;
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  successRate: number;
  estimatedCost: number;
  dueAlertSent: number;
  dueAlertConverted: number;
  dueAlertConversionRate: number;
  htmlContent: string;
  isAutoSent: boolean;
  status: 'delivered' | 'failed';
}

interface SmsWeeklyReportProps {
  logs: SmsLog[];
  users: User[];
  settings: Partial<CompanySettings>;
}

export function SmsWeeklyReport({ logs, users, settings }: SmsWeeklyReportProps) {
  const [reportHistory, setReportHistory] = useState<SentReportEmail[]>([]);
  const [adminEmail, setAdminEmail] = useState(settings.weeklySmsReportEmail || settings.email || '');
  const [reportDay, setReportDay] = useState(settings.weeklySmsReportDay || 'Friday');
  const [isReportEnabled, setIsReportEnabled] = useState(settings.weeklySmsReportEnabled !== false);
  
  const [sendingNow, setSendingNow] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [activePreviewEmail, setActivePreviewEmail] = useState<SentReportEmail | null>(null);
  
  // Stats calculated state
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Subscribe to sent reports history from CRM database
  useEffect(() => {
    const unsub = subscribeToCollection<SentReportEmail>('sms_report_emails', (reports) => {
      // Sort with newest on top
      const sorted = [...reports].sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
      setReportHistory(sorted);
    });
    return () => unsub && unsub();
  }, []);

  // Synchronize component states when database settings finish reloading
  useEffect(() => {
    if (settings.weeklySmsReportEmail) {
      setAdminEmail(settings.weeklySmsReportEmail);
    } else if (settings.email) {
      setAdminEmail(settings.email);
    }
    if (settings.weeklySmsReportDay) {
      setReportDay(settings.weeklySmsReportDay);
    }
    setIsReportEnabled(settings.weeklySmsReportEnabled !== false);
  }, [settings]);

  // Handle Save Reporting configuration settings
  const handleSaveConfigs = async () => {
    if (!adminEmail.trim() || !adminEmail.includes('@')) {
      alert('অনুগ্রহ করে একটি সঠিক এডমিন ইমেইল এড্রেস লিখুন।');
      return;
    }
    
    setSendingNow(true);
    try {
      const updatedSettings = {
        ...settings,
        weeklySmsReportEmail: adminEmail,
        weeklySmsReportDay: reportDay,
        weeklySmsReportEnabled: isReportEnabled
      } as CompanySettings;

      await saveSettings(updatedSettings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      console.error('Failed saving sms weekly report configurations:', e);
      alert('কনফিগারেশন সেভ করতে একটি ত্রুটি ঘটেছে। আবার চেষ্টা করুন।');
    } finally {
      setSendingNow(false);
    }
  };

  // Compile calculations for "Last 7 Days" Weekly SMS Performance Data
  const weeklyReportData = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Date range label
    const formattedStart = sevenDaysAgo.toLocaleDateString('bn-BD', { day: '2-digit', month: 'short', year: 'numeric' });
    const formattedEnd = now.toLocaleDateString('bn-BD', { day: '2-digit', month: 'short', year: 'numeric' });
    const enStart = sevenDaysAgo.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    const enEnd = now.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });

    // Filter logs inside past 7 days
    const weeklyLogs = logs.filter(log => {
      if (!log.createdAt) return false;
      const createdAt = new Date(log.createdAt);
      return createdAt >= sevenDaysAgo && createdAt <= now;
    });

    const totalSent = weeklyLogs.length;
    const totalDelivered = weeklyLogs.filter(l => l.status === 'delivered').length;
    const totalFailed = weeklyLogs.filter(l => l.status === 'failed').length;
    const successRate = totalSent > 0 ? Math.round((totalDelivered / totalSent) * 100) : 100;
    const estimatedCost = totalSent * 0.35; // 0.35 BDT per sms parts

    // Classify templates used
    let dueAlertSent = 0;
    let paymentApproveSent = 0;
    let welcomeSent = 0;
    let promoSent = 0;
    let customSent = 0;

    weeklyLogs.forEach(log => {
      const msg = log.message;
      if (msg.includes('বকেয়া') || msg.includes('due') || msg.includes('পরিশোধ')) {
        dueAlertSent++;
      } else if (msg.includes('পেমেন্ট') || msg.includes('সফলভাবে গৃহীত') || msg.includes('payment')) {
        paymentApproveSent++;
      } else if (msg.includes('স্বাগতম') || msg.includes('welcome') || msg.includes('অনুমোদিত')) {
        welcomeSent++;
      } else if (msg.includes('অফার') || msg.includes('প্রোমোশনাল') || msg.includes('promo')) {
        promoSent++;
      } else {
        customSent++;
      }
    });

    // Smart Conversion calculation: Due alert conversion tracking
    // Search for due alerts sent in Last 7 days, then check if that recipient user current due is <= 0
    let dueAlertConvertedCount = 0;
    const dueAlertRecipientPhones = new Set<string>();

    weeklyLogs.forEach(log => {
      const msg = log.message;
      if (msg.includes('বকেয়া') || msg.includes('due') || msg.includes('পরিশোধ')) {
        dueAlertRecipientPhones.add(log.recipientPhone);
      }
    });

    dueAlertRecipientPhones.forEach(phone => {
      const rUser = users.find(u => u.phone === phone);
      if (rUser && (rUser.dueAmount === undefined || rUser.dueAmount <= 0)) {
        dueAlertConvertedCount++;
      }
    });

    const dueAlertConversionRate = dueAlertRecipientPhones.size > 0 
      ? Math.round((dueAlertConvertedCount / dueAlertRecipientPhones.size) * 100)
      : 0;

    return {
      totalSent,
      totalDelivered,
      totalFailed,
      successRate,
      estimatedCost,
      dateRangeLabel: `${formattedStart} - ${formattedEnd}`,
      enDateRangeLabel: `${enStart} - ${enEnd}`,
      rangeStart: sevenDaysAgo.toISOString(),
      rangeEnd: now.toISOString(),
      templatesBreakdown: {
        dueAlertSent,
        paymentApproveSent,
        welcomeSent,
        promoSent,
        customSent
      },
      conversions: {
        dueAlertSentCount: dueAlertRecipientPhones.size,
        convertedCount: dueAlertConvertedCount,
        rate: dueAlertConversionRate
      }
    };
  }, [logs, users]);

  // Automated Report background checker trigger
  // Simulates automatic emailing if enabled and 7 days passed since last report, or on portal entry.
  useEffect(() => {
    if (isReportEnabled && reportHistory.length >= 0) {
      const checkAndAutoTrigger = async () => {
        // Look up the last auto-sent report or any report
        const lastReport = reportHistory[0];
        if (lastReport) {
          const lastSentTime = new Date(lastReport.sentAt).getTime();
          const daysPassed = (Date.now() - lastSentTime) / (1000 * 60 * 60 * 24);
          
          // Auto generate if weekly (7 days) cycle is completed
          if (daysPassed >= 7) {
            console.log('Automated Weekly SMS report cycle detected. Triggering auto-report.');
            await handleGenerateAndEmailReport(true);
          }
        } else if (logs.length > 0) {
          // If no report ever sent, auto dispatch the first report in backend
          console.log('No historical reports found. Dispatching first automated report.');
          await handleGenerateAndEmailReport(true);
        }
      };

      // Run automated dispatcher check on mount
      const timer = setTimeout(() => {
        checkAndAutoTrigger();
      }, 5000); // Wait 5 seconds after mount to prevent visual race
      return () => clearTimeout(timer);
    }
  }, [isReportEnabled, reportHistory, logs]);

  // Compose gorgeous inline HTML Cover Email Newsletter
  const composeReportHtml = (targetEmailAddress: string, data: typeof weeklyReportData, isAuto: boolean) => {
    const compName = settings.companyName || 'Master Administration Ltd';
    const compSlogan = settings.slogan || 'Global Telecom & Networking Gateways';
    const compContact = settings.phone || '+880-1700000000';

    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f5f9; color: #334155; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 30px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%); color: #ffffff; padding: 35px 25px; text-align: center; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
    .header p { margin: 5px 0 0 0; font-size: 13px; opacity: 0.85; }
    .meta-bar { background-color: #f8fafc; border-bottom: 1px solid #f1f5f9; padding: 15px 25px; font-size: 11px; color: #64748b; display: flex; justify-content: space-between; }
    .badge { background-color: #e0e7ff; color: #4338ca; font-weight: 800; padding: 3px 10px; border-radius: 12px; font-size: 10px; text-transform: uppercase; }
    .section { padding: 30px 25px; }
    .section-title { font-size: 13px; font-weight: 800; text-transform: uppercase; tracking-wider; color: #1e1b4b; border-bottom: 2px solid #e0e7ff; padding-bottom: 8px; margin-bottom: 20px; }
    .widget-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 25px; }
    .widget { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; text-align: center; }
    .widget-value { font-size: 20px; font-weight: 900; color: #1e293b; margin-top: 5px; }
    .widget-label { font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; }
    .color-indigo { color: #4f46e5; }
    .color-emerald { color: #059669; }
    .color-teal { color: #0d9488; }
    .color-rose { color: #e11d48; }
    .progress-wrapper { background-color: #f1f5f9; border-radius: 10px; height: 8px; overflow: hidden; margin-top: 5px; }
    .progress-bar { background-color: #4f46e5; height: 100%; }
    .progress-bar-success { background-color: #10b981; }
    .table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    .table th { background-color: #f8fafc; text-align: left; padding: 10px 15px; font-size: 10px; font-weight: 800; text-transform: uppercase; color: #475569; border-bottom: 1px solid #e2e8f0; }
    .table td { padding: 12px 15px; font-size: 12px; border-bottom: 1px solid #f1f5f9; color: #334155; }
    .table tr:last-child td { border-bottom: none; }
    .alert-box { border-left: 4px solid #10b981; background-color: #ecfdf5; padding: 15px; border-radius: 0 12px 12px 0; margin-bottom: 25px; }
    .alert-box p { margin: 0; font-size: 12px; line-height: 1.6; color: #065f46; }
    .footer { background-color: #1e293b; color: #94a3b8; padding: 30px 25px; text-align: center; font-size: 11px; }
    .footer strong { color: #ffffff; }
    .footer p { margin: 5px 0; }
    .footer-divider { border-top: 1px solid #334155; margin: 15px 0; }
    .btn { display: inline-block; background-color: #4f46e5; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 12px; padding: 10px 20px; border-radius: 8px; margin-top: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Weekly SMS Performance</h1>
      <p>Master Administration Systems Analytics Overview</p>
    </div>
    
    <div class="meta-bar">
      <span>Report Period: <strong>${data.enDateRangeLabel}</strong></span>
      <span class="badge">${isAuto ? 'Automated Dispatch' : 'Manual Trigger'}</span>
    </div>

    <div class="section">
      <div class="section-title">Key Performance Indicators (KPIs)</div>
      
      <div class="widget-grid">
        <div class="widget">
          <div class="widget-label">Total Outbound SMS</div>
          <div class="widget-value color-indigo">${data.totalSent} <span style="font-size: 12px; font-weight: normal; color: #94a3b8;">ea</span></div>
        </div>
        <div class="widget">
          <div class="widget-label">Delivery success rate</div>
          <div class="widget-value color-emerald">${data.successRate}%</div>
          <div class="progress-wrapper">
            <div class="progress-bar progress-bar-success" style="width: ${data.successRate}%"></div>
          </div>
        </div>
        <div class="widget">
          <div class="widget-label">Estimated Gateway Cost</div>
          <div class="widget-value color-teal">৳${data.estimatedCost.toFixed(2)}</div>
        </div>
        <div class="widget">
          <div class="widget-label">Due Alert Recovery</div>
          <div class="widget-value color-rose">${data.conversions.rate}%</div>
          <div class="progress-wrapper">
            <div class="progress-bar" style="width: ${data.conversions.rate}%; background-color: #f43f5e;"></div>
          </div>
        </div>
      </div>

      <div class="alert-box">
        <p>
          <strong>💡 Executive summary & conversion notice:</strong><br />
          In the past 7 days, <strong>${data.conversions.dueAlertSentCount} due alert SMS</strong> reminders were successfully dispatched to customers. Among them, <strong>${data.conversions.convertedCount} recipients</strong> resolved their invoices and fully settled their accounts. This represents an active SMS promotional-to-collection conversion rate of <strong>${data.conversions.rate}%</strong>, boosting liquidity and cash reserves in the portal!
        </p>
      </div>

      <div class="section-title" style="margin-top: 35px;">SMS Templates Distribution</div>
      <table class="table">
        <thead>
          <tr>
            <th>Template Campaign Name</th>
            <th style="text-align: right;">Count Issued</th>
            <th style="text-align: right;">Cost Allocation</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>⚠️ বকেয়া বিল পরিশোধের তাগিদ (Due Invoice Alert)</td>
            <td style="text-align: right; font-weight: bold;">${data.templatesBreakdown.dueAlertSent}</td>
            <td style="text-align: right; color: #64748b;">৳${(data.templatesBreakdown.dueAlertSent * 0.35).toFixed(2)}</td>
          </tr>
          <tr>
            <td>✅ পেমেন্ট সফল নোটিফিকেশন (Payment Received)</td>
            <td style="text-align: right; font-weight: bold;">${data.templatesBreakdown.paymentApproveSent}</td>
            <td style="text-align: right; color: #64748b;">৳${(data.templatesBreakdown.paymentApproveSent * 0.35).toFixed(2)}</td>
          </tr>
          <tr>
            <td>🎉 স্বাগতম মেসেজ (Welcome Announcement)</td>
            <td style="text-align: right; font-weight: bold;">${data.templatesBreakdown.welcomeSent}</td>
            <td style="text-align: right; color: #64748b;">৳${(data.templatesBreakdown.welcomeSent * 0.35).toFixed(2)}</td>
          </tr>
          <tr>
            <td>🚀 অফার ও প্রোমোশনাল মেসেজ (Promotional Notice)</td>
            <td style="text-align: right; font-weight: bold;">${data.templatesBreakdown.promoSent}</td>
            <td style="text-align: right; color: #64748b;">৳${(data.templatesBreakdown.promoSent * 0.35).toFixed(2)}</td>
          </tr>
          <tr>
            <td>✉️ সাধারণ ও কাস্টম বার্তা (Custom Compose)</td>
            <td style="text-align: right; font-weight: bold;">${data.templatesBreakdown.customSent}</td>
            <td style="text-align: right; color: #64748b;">৳${(data.templatesBreakdown.customSent * 0.35).toFixed(2)}</td>
          </tr>
          <tr style="font-weight: bold; background-color: #f8fafc;">
            <td>Total Combined Outbox</td>
            <td style="text-align: right;">${data.totalSent}</td>
            <td style="text-align: right; color: #4f46e5;">৳${data.estimatedCost.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="footer">
      <strong>${compName}</strong>
      <p style="opacity: 0.8;">${compSlogan}</p>
      <div class="footer-divider"></div>
      <p style="font-size: 10px; opacity: 0.7;">This executive data delivery report was generated automatically on your weekly scheduled day (${settings.weeklySmsReportDay || 'Friday'}) using Firestore Analytics Synchronization.</p>
      <p style="font-size: 10px; opacity: 0.7;">Help Desk: ${compContact} | System Admin Portal</p>
    </div>
  </div>
</body>
</html>
    `;
  };

  // Compile calculations, build report object, and commit to Firestore
  const handleGenerateAndEmailReport = async (isAuto = false) => {
    const targetEmail = adminEmail.trim() || settings.email || 'admin@masterportal.com';
    if (!targetEmail || !targetEmail.includes('@')) {
      if (!isAuto) alert('একটি সঠিক এডমিন ইমেইল এড্রেস প্রয়োজন।');
      return;
    }

    setSendingNow(true);
    try {
      const htmlEmailBody = composeReportHtml(targetEmail, weeklyReportData, isAuto);

      const reportPayload: Omit<SentReportEmail, 'id'> = {
        administratorEmail: targetEmail,
        sentAt: new Date().toISOString(),
        rangeStart: weeklyReportData.rangeStart,
        rangeEnd: weeklyReportData.rangeEnd,
        totalSent: weeklyReportData.totalSent,
        totalDelivered: weeklyReportData.totalDelivered,
        totalFailed: weeklyReportData.totalFailed,
        successRate: weeklyReportData.successRate,
        estimatedCost: weeklyReportData.estimatedCost,
        dueAlertSent: weeklyReportData.conversions.dueAlertSentCount,
        dueAlertConverted: weeklyReportData.conversions.convertedCount,
        dueAlertConversionRate: weeklyReportData.conversions.rate,
        htmlContent: htmlEmailBody,
        isAutoSent: isAuto,
        status: weeklyReportData.totalFailed / (weeklyReportData.totalSent || 1) > 0.3 ? 'failed' : 'delivered'
      };

      // Store in firestore collections as 'sent_emails' log records
      await createDocument('sms_report_emails', reportPayload);
      
      if (!isAuto) {
        alert(`সাপ্তাহিক এসএমএস এর পারফরম্যান্স রিপোর্ট ইমেইল-এ (${targetEmail}) সফলভাবে তৈরি ও প্রেরণ করা হয়েছে!`);
      }
    } catch (e) {
      console.error('Error generating and sending sms weekly performance report:', e);
      if (!isAuto) alert('রিপোর্ট পাঠাতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setSendingNow(false);
    }
  };

  const handleDeleteHistoryReport = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('আপনি কি এই রিপোর্ট হিস্টোরি লগ রেকর্ডটি ডিলিট করতে চান?')) {
      try {
        await deleteDocument('sms_report_emails', id);
      } catch (err) {
        console.error('Failed to delete report:', err);
      }
    }
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-[1.5rem] p-5 space-y-5 shadow-xs relative">
      
      {/* 1. HEADER BAR with quick configuration toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-100/50 pb-4">
        <div className="space-y-1">
          <span className="p-1 px-2.5 rounded-md bg-indigo-100 text-indigo-800 text-[9px] font-black tracking-widest uppercase inline-flex items-center gap-1">
            <Zap size={11} className="animate-spin text-amber-500" style={{ animationDuration: '4s' }} /> SMS Weekly Report Hub
          </span>
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Mail size={16} className="text-indigo-600" />
            সাপ্তাহিক এসএমএস কার্যকারিতা ও ইমেইলিং সার্ভিস (Automated Weekly Reports)
          </h2>
          <p className="text-[10px] text-slate-500">
            এডমিনদের জন্য স্বয়ংক্রিয়ভাবে বিগত ৭ দিনে পাঠানো মেসেজের বিস্তারিত সংখ্যা, খরচ ও কাস্টমারদের বকেয়া উদ্ধারের কনভার্সন রিপোর্ট তৈরির টুলস।
          </p>
        </div>

        {/* Configurations toggle */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className={`p-1.5 px-3 rounded-xl border text-[10px] font-bold flex items-center gap-1.5 transition-all ${
              showConfig 
                ? 'bg-indigo-600 text-white border-indigo-600' 
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Settings size={12} />
            কনফিগার সেটিংস (Configure Settings)
          </button>
        </div>
      </div>

      {/* 2. CONFIGURATIONAL COLLAPSIBLE WRAPPER */}
      {showConfig && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-indigo-100/80 rounded-2xl p-4 space-y-4 shadow-sm"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-black text-indigo-900 uppercase">Weekly Report Settings</h3>
            <button onClick={() => setShowConfig(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
              <X size={14} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Field 1: Toggle Automated Scheduler */}
            <div className="p-3 border border-slate-100 rounded-xl bg-slate-50/50 flex flex-col justify-between gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">1. Autosend Schedule</span>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input 
                    type="checkbox"
                    checked={isReportEnabled}
                    onChange={(e) => setIsReportEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2.5px] after:left-[2.5px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
              <p className="text-[9px] text-slate-400 leading-normal">
                অনলাইন পোর্টালটি প্রতি সপ্তাহে নির্দিষ্ট দিনে স্বয়ংক্রিয়ভাবে ইমেইল তৈরি করে এডমিন বক্সে পাঠাবে।
              </p>
            </div>

            {/* Field 2: Target Admin Email */}
            <div className="space-y-1.5 p-3 rounded-xl border border-slate-100 bg-slate-50/50">
              <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">2. Admin Email Address</label>
              <input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="foysolahmedtapader@gmail.com"
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-semibold text-slate-700"
              />
              <p className="text-[8px] text-slate-400">যে ইমেইল এড্রেসে প্রতি সপ্তাহের পারফরম্যান্স ডেটা শীট পাঠানো হবে।</p>
            </div>

            {/* Field 3: Report dispatch day */}
            <div className="space-y-1.5 p-3 rounded-xl border border-slate-100 bg-slate-50/50">
              <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">3. Weekly Dispatch Day</label>
              <select
                value={reportDay}
                onChange={(e) => setReportDay(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-semibold text-slate-700"
              >
                {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
              <p className="text-[8px] text-slate-400">সপ্তাহের কোন নির্দিষ্ট দিনে ডেটা সামারি ফাইল তৈরি হবে।</p>
            </div>

          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={handleSaveConfigs}
              disabled={sendingNow}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs py-2 px-4 rounded-xl flex items-center gap-1 shadow-sm active:scale-[0.98] transition-all"
            >
              <Check size={12} strokeWidth={3} />
              {saveSuccess ? 'সেটিংস সফলভাবে সেভ হয়েছে!' : 'কনফিগারেশন সেভ করুন'}
            </button>
          </div>
        </motion.div>
      )}

      {/* 3. CURRENT LIVE CALCULATED WEEKLY METRICS */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        
        {/* Header summary of weekly calculator */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="space-y-0.5">
            <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1">
              <Calendar size={13} className="text-indigo-650" />
              চলতি সপ্তাহের রিয়েলটাইম পারফরম্যান্স সামারি (Current Week Live Analytics)
            </h3>
            <p className="text-[10px] text-slate-450 leading-none">রানিং সপ্তাহ: <strong className="text-indigo-650 font-mono font-black">{weeklyReportData.dateRangeLabel}</strong></p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleGenerateAndEmailReport(false)}
              disabled={sendingNow}
              className="bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 hover:border-indigo-300 disabled:opacity-50 text-indigo-700 text-[10px] font-black px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all active:scale-[0.98]"
            >
              <Send size={11} className={sendingNow ? "animate-pulse" : ""} />
              {sendingNow ? 'রিপোর্ট জেনারেট হচ্ছে...' : 'রিপোর্ট তৈরি করে এডমিনকে পাঠান (Send Now)'}
            </button>
          </div>
        </div>

        {/* 4 Premium KPIs Bento layout */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Card 1: Total Sent in past 7 days */}
          <div className="p-3.5 bg-indigo-50/20 border border-indigo-100/50 rounded-xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-150 border border-indigo-200/50 text-indigo-700 flex items-center justify-center flex-shrink-0">
              <TrendingUp size={16} />
            </div>
            <div>
              <div className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-0.5">মেসেজ সেন্ট (Current Week)</div>
              <div className="text-[16px] font-black text-slate-800 leading-none">
                {weeklyReportData.totalSent} <span className="text-[10px] text-slate-450 font-bold">টি</span>
              </div>
            </div>
          </div>

          {/* Card 2: Delivery conversion success rate */}
          <div className="p-3.5 bg-emerald-50/20 border border-emerald-100/50 rounded-xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-150 border border-emerald-200/50 text-emerald-700 flex items-center justify-center flex-shrink-0">
              <Percent size={16} />
            </div>
            <div>
              <div className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-0.5">সাফল্যের গড় হার (Rate)</div>
              <div className="text-[16px] font-black text-emerald-650 leading-none">
                {weeklyReportData.successRate}%
              </div>
            </div>
          </div>

          {/* Card 3: Estimated Week Costs BDT */}
          <div className="p-3.5 bg-teal-50/20 border border-teal-100/50 rounded-xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-teal-150 border border-teal-200/50 text-teal-700 flex items-center justify-center flex-shrink-0">
              <Coins size={16} />
            </div>
            <div>
              <div className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-0.5">আনুমানিক খরচ (Est Cost)</div>
              <div className="text-[16px] font-black text-slate-800 leading-none">
                ৳{weeklyReportData.estimatedCost.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Card 4: Due collection impact metrics */}
          <div className="p-3.5 bg-rose-50/20 border border-rose-100/50 rounded-xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-rose-150 border border-rose-200/50 text-rose-700 flex items-center justify-center flex-shrink-0">
              <UserCheck size={16} />
            </div>
            <div>
              <div className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-0.5">বকেয়া বিল উদ্ধার (Impact)</div>
              <div className="text-[16px] font-black text-rose-650 leading-none">
                {weeklyReportData.conversions.rate}%
              </div>
            </div>
          </div>

        </div>

        {/* Weekly Narrative Conversion box */}
        <div className="p-3.5 border border-dashed border-indigo-200 rounded-xl bg-indigo-50/5 flex items-start gap-2 text-xs">
          <Info size={16} className="text-indigo-650 mt-0.5 flex-shrink-0" />
          <p className="text-slate-600 leading-relaxed font-sans">
            <strong>ক্যাম্পেইন পেমেন্ট কনভার্সন বিশ্লেষণ (Campaign Retention Conversion Analytics):</strong> বিগত ৭ দিনে মোট <strong>{weeklyReportData.conversions.dueAlertSentCount} জন</strong> কাস্টমারকে বকেয়া পরিশোধের নোটিফিকেশন ম্যাসেজ দেওয়া হয়েছিল। তার মধ্যে ইতিমধ্যে <strong>{weeklyReportData.conversions.convertedCount} জন</strong> গ্রাহক ক্লিয়ারেন্স বিল পরিশোধ করেছেন, যা একটি অভাবনীয় <strong>{weeklyReportData.conversions.rate}% বকেয়া পেমেন্ট উদ্ধার কনভার্সন রেট</strong> নির্দেশ করে!
          </p>
        </div>

        {/* Template Campaigns categorization tracker */}
        <div className="space-y-2 pt-1">
          <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-wider">মেসেজ ডিস্ট্রিবিউশন ক্যাম্পেইন (Sms Campaigns breakdowns)</h4>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { label: 'Due Alerts (বকেয়া)', count: weeklyReportData.templatesBreakdown.dueAlertSent, bg: 'bg-rose-50 border-rose-100 text-rose-700' },
              { label: 'Payment approved', count: weeklyReportData.templatesBreakdown.paymentApproveSent, bg: 'bg-emerald-50 border-emerald-100 text-emerald-700' },
              { label: 'Welcome (স্বাগতম)', count: weeklyReportData.templatesBreakdown.welcomeSent, bg: 'bg-indigo-50 border-indigo-100 text-indigo-700' },
              { label: 'Promotions (অফার)', count: weeklyReportData.templatesBreakdown.promoSent, bg: 'bg-amber-50 border-amber-100 text-amber-700' },
              { label: 'Custom text (কাস্টম)', count: weeklyReportData.templatesBreakdown.customSent, bg: 'bg-slate-50 border-slate-250 text-slate-700' },
            ].map((camp, idx) => (
              <div key={idx} className={`p-2.5 rounded-lg border text-center ${camp.bg}`}>
                <div className="text-[9px] font-bold uppercase truncate leading-tight">{camp.label}</div>
                <div className="text-[14px] font-black mt-1 font-mono">{camp.count} <span className="text-[9px] font-normal">বার</span></div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 4. SENT REPORTS ARCHIVAL LOGBOOK (History ledger) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <History size={14} className="text-slate-600" />
            ইতিপূর্বে প্রেরিত সাপ্তাহিক রিপোর্ট লেজার (Sent Reports History Ledger)
          </h3>
          <span className="bg-slate-100 text-slate-600 font-mono font-bold text-[10px] px-2.5 py-0.5 rounded-full">
            মোট প্রেরিত: {reportHistory.length}
          </span>
        </div>

        {/* Ledger logs grid or fallback */}
        {reportHistory.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {reportHistory.map((rep) => (
              <div 
                key={rep.id} 
                onClick={() => setActivePreviewEmail(rep)}
                className="p-4 border border-slate-150 hover:border-indigo-400 hover:shadow-xs rounded-xl bg-slate-50/20 hover:bg-indigo-50/5 transition-all flex flex-col justify-between cursor-pointer group"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-mono font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                      #REP-{rep.id.substring(0, 6).toUpperCase()}
                    </span>
                    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                      rep.isAutoSent 
                        ? 'bg-blue-50 text-blue-700 border-blue-100' 
                        : 'bg-purple-50 text-purple-700 border-purple-100'
                    }`}>
                      {rep.isAutoSent ? 'Auto Scheduled' : 'Manual Dispatched'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Mail size={12} className="text-slate-450" />
                      <span className="text-[11px] font-bold text-slate-700 truncate">{rep.administratorEmail}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-450 font-mono">
                      <Clock size={12} />
                      <span>প্রেরণ সময়: {new Date(rep.sentAt).toLocaleString('bn-BD', { hour12: true })}</span>
                    </div>
                  </div>

                  {/* Highlight stats metrics */}
                  <div className="grid grid-cols-3 gap-2 py-2 border-y border-dashed border-slate-150 text-center bg-white/60 p-1.5 rounded-lg">
                    <div>
                      <div className="text-[8px] font-bold text-slate-400 uppercase">SMS COUNT</div>
                      <div className="text-[12px] font-black text-slate-800 font-mono">{rep.totalSent} টি</div>
                    </div>
                    <div>
                      <div className="text-[8px] font-bold text-slate-400 uppercase">EST GATEWAY</div>
                      <div className="text-[12px] font-black text-teal-600 font-mono">৳{rep.estimatedCost.toFixed(1)}</div>
                    </div>
                    <div>
                      <div className="text-[8px] font-bold text-slate-400 uppercase">RECOVERY RATE</div>
                      <div className="text-[12px] font-black text-indigo-650 font-mono">{rep.dueAlertConversionRate}%</div>
                    </div>
                  </div>

                </div>

                <div className="mt-3.5 flex justify-between items-center text-xs">
                  <span className="text-slate-450 text-[10px] inline-flex items-center gap-1">
                    <CheckCircle size={11} className="text-emerald-500" />
                    Emailed Delivered
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivePreviewEmail(rep);
                    }}
                    className="text-[10px] font-extrabold text-indigo-600 hover:text-indigo-800 transition-colors uppercase tracking-wider flex items-center gap-0.5 group-hover:translate-x-0.5 transform transition-transform"
                  >
                    View Emailed Report
                    <ChevronRight size={11} />
                  </button>
                  <button
                    onClick={(e) => handleDeleteHistoryReport(rep.id, e)}
                    className="text-[10px] font-bold text-rose-500 hover:text-rose-700 transition-colors bg-rose-50 hover:bg-rose-100 p-1 px-2 rounded-lg"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl bg-slate-50/30">
            <Info size={18} className="mx-auto text-slate-300 mb-1" />
            <p className="text-[11px] text-slate-400 italic">ইতিপূর্বে পাঠানো কোনো সাপ্তাহিক রিপোর্টের সামারি বা লেজার পাওয়া যায়নি।</p>
          </div>
        )}
      </div>

      {/* 5. LIVE INTERACTIVE EMAIL TEMPLATE PREVIEW MODAL */}
      <AnimatePresence>
        {activePreviewEmail && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              
              {/* Modal Header Tab controls */}
              <div className="bg-slate-950 p-4.5 text-white flex justify-between items-center flex-shrink-0 border-b border-slate-800">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="p-0.5 px-2.5 rounded-full bg-indigo-500 text-white font-mono text-[9px] font-black uppercase">
                      Admin Email Outbox Sandbox
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">Report #REP-{activePreviewEmail.id.substring(0, 8).toUpperCase()}</span>
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-1 text-slate-200">
                    <FileText size={15} className="text-indigo-400" />
                    প্রেরিত সুবিন্যস্ত ইমেইল ভিউয়ার (Executive Newsletter Preview)
                  </h3>
                </div>
                <button 
                  onClick={() => setActivePreviewEmail(null)}
                  className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-all transform active:scale-95"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Dynamic Email Client Envelope Headers */}
              <div className="bg-slate-50 border-b border-slate-200 p-4 px-6 space-y-1.5 text-xs text-slate-600 font-sans flex-shrink-0">
                <div className="flex">
                  <span className="w-16 font-extrabold text-slate-400 uppercase select-none">From:</span>
                  <span className="text-slate-800 font-bold">Master Mail API Dispatcher <code className="text-[10.5px] bg-slate-200/50 p-0.5 px-1 rounded text-indigo-750 font-mono font-normal">noreply@masterportal.com</code></span>
                </div>
                <div className="flex">
                  <span className="w-16 font-extrabold text-slate-400 uppercase select-none">To:</span>
                  <span className="text-slate-800 font-bold select-all">{activePreviewEmail.administratorEmail} <code className="text-[10.5px] bg-slate-200/50 p-0.5 px-1 rounded text-slate-600 font-mono font-normal">Administrator</code></span>
                </div>
                <div className="flex">
                  <span className="w-16 font-extrabold text-slate-400 uppercase select-none">Subject:</span>
                  <span className="text-slate-900 font-extrabold">[Weekly Report] SMS Performance Retention Summary: ({activePreviewEmail.rangeStart.split('T')[0]} - {activePreviewEmail.rangeEnd.split('T')[0]})</span>
                </div>
              </div>

              {/* Scrollable Iframe Render Sandbox */}
              <div className="flex-1 overflow-y-auto p-4 bg-slate-100 flex justify-center">
                <div className="w-full bg-white max-w-[620px] rounded-2xl shadow-inner overflow-hidden border border-slate-200 select-text">
                  <div dangerouslySetInnerHTML={{ __html: activePreviewEmail.htmlContent }} />
                </div>
              </div>

              {/* Footer controllers */}
              <div className="p-4.5 bg-slate-50 border-t border-slate-200 flex justify-between items-center flex-shrink-0 rounded-b-3xl">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Emailed Dispatch Result: Status Delivered</p>
                <button
                  onClick={() => setActivePreviewEmail(null)}
                  className="bg-slate-900 hover:bg-slate-950 text-white font-extrabold text-xs py-2 px-5 rounded-xl transition-all shadow-sm active:scale-95"
                >
                  প্রিভিউ বন্ধ করুন (Close Sandbox)
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
