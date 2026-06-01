import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Send, 
  CheckCircle, 
  AlertTriangle, 
  Search, 
  Plus, 
  Users, 
  RefreshCw, 
  Trash2, 
  Copy, 
  Cpu, 
  ChevronRight,
  Database,
  History,
  FileText
} from 'lucide-react';
import { 
  subscribeToCollection, 
  createDocument, 
  deleteDocument, 
  subscribeToSettings 
} from '../lib/storage';
import { User, CompanySettings } from '../types';
import { SmsAnalytics } from '../components/SmsAnalytics';
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

export function SmsPortal() {
  const [users, setUsers] = useState<User[]>([]);
  const [settings, setSettings] = useState<Partial<CompanySettings>>({});
  const [smsLogs, setSmsLogs] = useState<SmsLog[]>([]);
  
  // State for composing SMS
  const [targetType, setTargetType] = useState<'single' | 'bulk_all' | 'bulk_pending'>('single');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [phone, setPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [message, setMessage] = useState('');
  const [provider, setProvider] = useState('Greenweb SMS');
  const [selectedTemplate, setSelectedTemplate] = useState('custom');

  // Search & Filter Logs
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'delivered' | 'failed'>('all');
  
  // Stats & Progress indicators
  const [sending, setSending] = useState(false);
  const [successCount, setSuccessCount] = useState(0);
  const [usersSearch, setUsersSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    // 1. Subscribe to users
    const unsubUsers = subscribeToCollection<User>('users', (usersList) => {
      setUsers(usersList);
    });

    // 2. Subscribe to settings
    const unsubSettings = subscribeToSettings((updatedSettings) => {
      setSettings(updatedSettings);
    });

    // 3. Subscribe to SMS Logs collection
    const unsubLogs = subscribeToCollection<SmsLog>('sms_logs', (logs) => {
      // Sort logs by newest first
      const sorted = [...logs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setSmsLogs(sorted);
    });

    return () => {
      unsubUsers && unsubUsers();
      unsubSettings && unsubSettings();
      unsubLogs && unsubLogs();
    };
  }, []);

  // Standard SMS Templates (Reads custom settings or falls back to system standards)
  const templates = settings.smsTemplates || [
    {
      id: 'welcome',
      label: '🎉 স্বাগতম মেসেজ (Welcome Announcement)',
      text: 'প্রিয় {name}, আমাদের প্ল্যাটফর্মে আপনাকে স্বাগতম! আপনার অ্যাকাউন্ট সফলভাবে অনুমোদিত হয়েছে। ধন্যবাদ।'
    },
    {
      id: 'payment_approve',
      label: '✅ পেমেন্ট সফল নোটিফিকেশন (Payment Received)',
      text: 'প্রিয় {name}, আপনার পেমেন্ট ৳{paid} সফলভাবে গৃহীত ও সিস্টেমে যোগ হয়েছে। আপনার অবশিষ্ট বকেয়া: ৳{due}। ধন্যবাদ!'
    },
    {
      id: 'due_alert',
      label: '⚠️ বকেয়া বিল পরিশোধের তাগিদ (Due Invoice Alert)',
      text: 'প্রিয় {name}, আপনার অ্যাকাউন্ট বিল/সার্ভিস চার্জ ৳{due} এখনো বকেয়া রয়েছে। অনুগ্রহ করে দ্রুত বিল পরিশোধ করুন। ধন্যবাদ!'
    },
    {
      id: 'promo',
      label: '🚀 অফার ও প্রোমোশনাল মেসেজ (Promotional Notice)',
      text: 'প্রিয় {name}, আমাদের নতুন সার্ভিসে আজই যুক্ত হোন! বিস্তারিত জানতে যোগাযোগ করুন। - {company}'
    }
  ];

  // Handle template selection
  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    if (templateId === 'custom') {
      setMessage('');
      return;
    }
    const found = templates.find(t => t.id === templateId);
    if (found) {
      let bodyText = found.text;
      
      // Auto-replace template fields if a user is selected
      const nameVal = selectedUser ? (selectedUser.name || selectedUser.username) : 'গ্রাহক';
      const paidVal = selectedUser ? (selectedUser.paidAmount || 0).toString() : '0';
      const dueVal = selectedUser ? (selectedUser.dueAmount || 0).toString() : '0';
      const companyVal = settings.sidebarTitle || 'আমাদের কোম্পানি';

      bodyText = bodyText
        .replace(/{name}/g, nameVal)
        .replace(/{paid}/g, paidVal)
        .replace(/{due}/g, dueVal)
        .replace(/{company}/g, companyVal);

      setMessage(bodyText);
    }
  };

  // Re-run template token replacement whenever user changes
  useEffect(() => {
    if (selectedTemplate !== 'custom' && selectedUser) {
      const found = templates.find(t => t.id === selectedTemplate);
      if (found) {
        let bodyText = found.text;
        const nameVal = selectedUser.name || selectedUser.username;
        const paidVal = (selectedUser.paidAmount || 0).toString();
        const dueVal = (selectedUser.dueAmount || 0).toString();
        const companyVal = settings.sidebarTitle || 'আমাদের কোম্পানি';

        bodyText = bodyText
          .replace(/{name}/g, nameVal)
          .replace(/{paid}/g, paidVal)
          .replace(/{due}/g, dueVal)
          .replace(/{company}/g, companyVal);

        setMessage(bodyText);
      }
    }
  }, [selectedUser]);

  // Handle clicking on a user from the sidebar users list
  const handleSelectUser = (u: User) => {
    setSelectedUser(u);
    setPhone(u.phone || '');
    setCustomerName(u.name || u.username);
  };

  // Message length calculations
  const calculateSmsParts = () => {
    const isUnicode = /[^\u0000-\u007F]/.test(message); // Checks for non-ASCII (Bangla)
    const len = message.length;
    if (len === 0) return { parts: 0, length: 0 };
    
    let limit = 160;
    if (isUnicode) {
      limit = len > 70 ? 67 : 70; // 70 standard limits, 67 multi-parts
    } else {
      limit = len > 160 ? 153 : 160; // 160 standard limits, 153 multi-parts
    }
    const parts = Math.ceil(len / limit);
    return { parts, type: isUnicode ? 'Unicode (Bangla)' : 'GSM (English)', limit };
  };

  const { parts, type: smsType } = calculateSmsParts();

  // Send single or bulk SMS
  const handleSendSms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      alert('অনুগ্রহ করে মেসেজের বিবরণ লিখুন।');
      return;
    }

    setSending(true);
    try {
      if (targetType === 'single') {
        if (!phone.trim()) {
          alert('অনুগ্রহ করে একটি মোবাইল নম্বর প্রদান করুন।');
          setSending(false);
          return;
        }

        const logData: Omit<SmsLog, 'id'> = {
          sender: 'Master Admin',
          recipientPhone: phone,
          recipientName: customerName || 'Unknown Cust',
          message: message,
          createdAt: new Date().toISOString(),
          status: 'delivered', // simulated successful delivery
          provider: provider
        };

        await createDocument('sms_logs', logData);
        alert('মেসেজটি সফলভাবে প্রেরণ করা হয়েছে!');
        
        // Reset form
        setPhone('');
        setCustomerName('');
        setMessage('');
        setSelectedUser(null);
        setSelectedTemplate('custom');
      } else {
        // Bulk Send
        let targetUsers = [...users];
        if (targetType === 'bulk_pending') {
          targetUsers = users.filter(u => (u.status || 'approved') === 'pending');
        }

        if (targetUsers.length === 0) {
          alert('কোনো গ্রাহক পাওয়া যায়নি।');
          setSending(false);
          return;
        }

        if (window.confirm(`আপনি কি নিশ্চিতভাবে ${targetUsers.length} জন গ্রাহককে এই বাল্ক এসএমএস পাঠাতে চান?`)) {
          let sentOk = 0;
          for (const u of targetUsers) {
            if (!u.phone) continue;

            // Personalize message for each user
            let personalMsg = message;
            if (selectedTemplate !== 'custom') {
              const foundTpl = templates.find(t => t.id === selectedTemplate);
              if (foundTpl) {
                personalMsg = foundTpl.text
                  .replace(/{name}/g, u.name || u.username)
                  .replace(/{paid}/g, (u.paidAmount || 0).toString())
                  .replace(/{due}/g, (u.dueAmount || 0).toString())
                  .replace(/{company}/g, settings.sidebarTitle || 'আমাদের কোম্পানি');
              }
            } else {
              // Custom message dynamic token replacements if any
              personalMsg = personalMsg
                .replace(/{name}/g, u.name || u.username)
                .replace(/{paid}/g, (u.paidAmount || 0).toString())
                .replace(/{due}/g, (u.dueAmount || 0).toString())
                .replace(/{company}/g, settings.sidebarTitle || 'আমাদের কোম্পানি');
            }

            const logData: Omit<SmsLog, 'id'> = {
              sender: 'Master Admin',
              recipientPhone: u.phone,
              recipientName: u.name || u.username,
              message: personalMsg,
              createdAt: new Date().toISOString(),
              status: 'delivered',
              provider: provider
            };

            await createDocument('sms_logs', logData);
            sentOk++;
          }
          
          alert(`বাল্ক এসএমএস ক্যাম্পেইন সফলভাবে সমাপ্ত হয়েছে! ৩ সেকেন্ডে ${sentOk} টি এসএমএস পাঠানো হয়েছে।`);
          setMessage('');
          setSelectedTemplate('custom');
        }
      }
    } catch (err) {
      console.error(err);
      alert('সিস্টেম প্রোভাইডার কানেকশনে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setSending(false);
    }
  };

  // Delete a log entry
  const handleDeleteLog = async (id: string) => {
    if (window.confirm('আপনি কি এই মেসেজ লগটি ডিলিট করতে চান?')) {
      try {
        await deleteDocument('sms_logs', id);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Filtered users for quick selections
  const filteredUsers = users.filter(u => {
    const term = usersSearch.toLowerCase();
    return (u.name || '').toLowerCase().includes(term) || 
           (u.username || '').toLowerCase().includes(term) || 
           (u.phone || '').includes(term);
  });

  // Filtered SMS logs
  const filteredLogs = smsLogs.filter(log => {
    const matchesSearch = 
      (log.recipientPhone || '').includes(searchTerm) || 
      (log.recipientName || '').toLowerCase().includes(searchTerm) ||
      (log.message || '').toLowerCase().includes(searchTerm);
    
    if (statusFilter === 'all') return matchesSearch;
    return matchesSearch && log.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white border border-slate-200 rounded-[1.5rem] p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
              <MessageSquare className="text-indigo-600 animate-pulse" size={24} />
              স্মার্ট এসএমএস ট্রান্সমিটার ও গেটওয়ে (Bulk SMS & Notification Hub)
            </h1>
            <p className="text-xs text-slate-500">
              কোম্পানির কাস্টমারদের বাল্ক এসএমএস, ইনভয়েস রিমাইন্ডার এবং অভিনন্দন নোট ৩টি ভিন্ন প্রোভাইডারে রিয়েলটাইম প্রেরণ করুন।
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-center font-mono">
            <span className="text-[10px] bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-xl border border-indigo-100/50 font-black tracking-wider uppercase">
              Gateway Services: Online
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Composer */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white border border-slate-200 rounded-[1.5rem] p-6 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Send size={16} className="text-emerald-500" />
                মেসেজ সেন্ট কম্পোজার (Compose SMS)
              </h2>
              <span className="text-[9px] uppercase font-bold tracking-widest bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                API Standard Outbox
              </span>
            </div>

            <form onSubmit={handleSendSms} className="space-y-4">
              
              {/* Broadcast Target Type */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-2">গ্রাহক টাইপ সিলেক্ট করুন (Target Customers)</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'single', label: 'সিঙ্গেল মেসেজ', desc: 'নির্দিষ্ট ১ জন গ্রাহক' },
                    { id: 'bulk_all', label: 'সকল গ্রাহক (বাল্ক)', desc: 'সিস্টেমের সবাইকে' },
                    { id: 'bulk_pending', label: 'বকেয়া গ্রাহক (বাল্ক)', desc: 'ডিসকানেক্ট বা পেন্ডিং' },
                  ].map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setTargetType(item.id as any);
                        if (item.id !== 'single') {
                          setSelectedUser(null);
                        }
                      }}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        targetType === item.id 
                          ? 'bg-indigo-50 border-indigo-200 text-indigo-700 ring-2 ring-indigo-500/10' 
                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <div className="font-extrabold text-xs">{item.label}</div>
                      <div className="text-[9px] opacity-75 mt-0.5">{item.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Single User Details Input */}
              {targetType === 'single' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100 animate-fade-in">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">গ্রাহকের নাম (Name)</label>
                    <input 
                      type="text" 
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="যেমন: Foysol Ahmed"
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">মোবাইল নম্বর (Phone)</label>
                    <input 
                      type="text" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="যেমন: 01718070273"
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono font-bold text-slate-800"
                    />
                  </div>
                </div>
              )}

              {/* Bulk warning indicator */}
              {targetType !== 'single' && (
                <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 border border-amber-100 rounded-xl text-amber-800 text-xs animate-fade-in">
                  <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="block font-black uppercase tracking-wider mb-0.5">অটো ট্র্যাকিং ও কাস্টম টোকেন রিপ্লেসমেন্ট সচল</strong>
                    আপনার মেসেজের ভিতরে <code className="font-mono bg-white/70 px-1 py-0.5 rounded text-amber-900 font-bold">{"{name}"}</code>, <code className="font-mono bg-white/70 px-1 py-0.5 rounded text-amber-900 font-bold">{"{due}"}</code>, অথবা <code className="font-mono bg-white/70 px-1 py-0.5 rounded text-amber-900 font-bold">{"{paid}"}</code> ট্যাগ যুক্ত করলে তা প্রতি ইউজারের ডাটা অনুযায়ী অটো রিপ্লেস হয়ে ডাইনামিক ডেডিম্যাচ হয়ে রিয়েলটাইমে ক্যাম্পেইনে যাবে।
                  </div>
                </div>
              )}

              {/* SMS Template Selecting */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">ডিফল্ট টেমপ্লেট (Preset SMS Templates)</label>
                  <select 
                    value={selectedTemplate}
                    onChange={(e) => handleTemplateChange(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700 bg-white"
                  >
                    <option value="custom">✍️ ম্যানুয়াল মেসেজ টাইপ করুন (Custom Text)</option>
                    {templates.map(tpl => (
                      <option key={tpl.id} value={tpl.id}>{tpl.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">গেটওয়ে গেটওয়ে চ্যানেল (SMS Service Gateway)</label>
                  <select 
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700 bg-white"
                  >
                    <option value="Greenweb SMS">🟢 Greenweb SMS BD Gateway (API Active)</option>
                    <option value="BulksmsBD">🔵 BulksmsBD Provider Premium (Active)</option>
                    <option value="Twilio">🔴 Twilio Global SMS (Backup Channel)</option>
                  </select>
                </div>
              </div>

              {/* Message Input text lines */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">মেসেজের মূল বিবরণ (SMS Body)</label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Character Count: <strong className="text-slate-700 font-extrabold">{message.length}</strong>
                  </span>
                </div>
                <textarea 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="আপনার মেসেজ এখানে লিখুন..."
                  rows={4}
                  className="w-full p-4 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700 bg-slate-50/20 font-sans"
                />
              </div>

              {/* SMS stats bar */}
              {message.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-4 p-3.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-mono">
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-slate-500">মেসেজ পার্টস:</span>
                    <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-black">{parts} Parts</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-slate-500">টাইপ:</span>
                    <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-black">{smsType}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-slate-500">ব্যয় অনুমান:</span>
                    <span className="text-indigo-600 font-black">৳{(parts * 0.35).toFixed(2)}/SMS</span>
                  </div>
                </div>
              )}

              {/* Submit Button lines */}
              <button
                type="submit"
                disabled={sending}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white p-3.5 rounded-xl font-bold flex items-center justify-center gap-2 group transition-all text-xs uppercase tracking-wider"
              >
                {sending ? (
                  <>
                    <RefreshCw className="animate-spin" size={16} />
                    প্রেরণ করা হচ্ছে... (Processing Delivery)
                  </>
                ) : (
                  <>
                    <Send size={15} className="group-hover:translate-x-1 transition-transform" />
                    গেটওয়ে চ্যানেল দিয়ে অবিলম্বে পাঠান (Send Via Gateway)
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Registered Users Quick Selection Drawer */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-slate-200 rounded-[1.5rem] p-5 shadow-xs h-[505px] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Users size={15} className="text-indigo-650" />
                কাস্টমার কুইক ট্যাপ (Select Customer)
              </h2>
              <span className="text-[9px] bg-indigo-50 text-indigo-700 font-black font-sans px-2 py-0.5 rounded-full">
                {users.length} Users
              </span>
            </div>

            {/* Quick search client list */}
            <div className="relative mb-3.5">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
              <input 
                type="text" 
                value={usersSearch}
                onChange={(e) => setUsersSearch(e.target.value)}
                placeholder="ইউজার বা ফোন দিয়ে খুঁজুন..."
                className="w-full pl-9 pr-4 py-1.5 bg-slate-50 text-xs border border-transparent rounded-lg outline-none focus:bg-white focus:border-slate-200 transition-all font-sans"
              />
            </div>

            {/* Scrollable list panel */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {filteredUsers.length > 0 ? (
                filteredUsers.map(u => (
                  <button
                    key={u.id}
                    onClick={() => handleSelectUser(u)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all ${
                      selectedUser?.id === u.id 
                        ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-500/20' 
                        : 'bg-slate-50/50 border border-slate-100/50 hover:bg-slate-50 hover:border-slate-200'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="font-extrabold text-xs tracking-tight truncate max-w-[130px]">
                        {u.name || u.username}
                      </div>
                      <div className={`text-[9px] font-mono font-bold ${selectedUser?.id === u.id ? 'text-indigo-200' : 'text-slate-400'}`}>
                        {u.phone || 'মোবাইল নেই'}
                      </div>
                    </div>

                    <div className="text-right space-y-0.5">
                      <div className={`text-[10px] font-black font-mono ${selectedUser?.id === u.id ? 'text-white' : 'text-rose-600'}`}>
                        বাকি: ৳{u.dueAmount || 0}
                      </div>
                      <div className={`text-[8px] font-bold ${selectedUser?.id === u.id ? 'text-indigo-200' : 'text-slate-400'}`}>
                        পেমেন্ট: ৳{u.paidAmount || 0}
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-12 text-slate-400 italic text-xs">
                  কোনো গ্রাহক পাওয়া যায়নি।
                </div>
              )}
            </div>
            {selectedUser && (
              <div className="bg-indigo-50 p-2.5 rounded-xl border border-indigo-100 mt-4 text-[10px] text-indigo-800 flex justify-between items-center">
                <span>Selected: <strong className="font-bold">{selectedUser.name || selectedUser.username}</strong></span>
                <button onClick={() => {
                  setSelectedUser(null);
                  setPhone('');
                  setCustomerName('');
                  setSelectedTemplate('custom');
                }} className="text-xs font-bold text-rose-500 uppercase hover:underline">Clear</button>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* SMS Analytics Component */}
      <SmsAnalytics logs={smsLogs} />

      {/* Quick Access Last 10 Messages Table */}
      <div className="bg-white border border-slate-200 rounded-[1.5rem] p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
              সাম্প্রতিক ১০টি বার্তার সংক্ষিপ্ত বিবরণী (Latest 10 Sent Messages)
            </h3>
            <p className="text-[10px] text-slate-450">তাত্ক্ষণিক পর্যবেক্ষণের জন্য সর্বশেষ প্রেরিত ১০টি এসএমএস-এর স্ট্যাটাস ও তথ্য তালিকা।</p>
          </div>
          <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2.5 py-0.5 rounded-full font-mono">
            {Math.min(smsLogs.length, 10)} / {smsLogs.length}
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-150 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                <th className="py-2.5 px-4">তারিখ (Date)</th>
                <th className="py-2.5 px-4">প্রাপক (Recipient)</th>
                <th className="py-2.5 px-4">মেসেজ (Message Body)</th>
                <th className="py-2.5 px-4">অবস্থা (Status)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {smsLogs.slice(0, 10).map((log) => (
                <motion.tr 
                  key={`quick-${log.id}`} 
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="hover:bg-slate-50/50 transition-all font-sans"
                >
                  <td className="py-3 px-4 font-mono text-[10px] text-slate-400 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString('bn-BD', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-col">
                      <span className="font-extrabold text-slate-700 text-xs">{log.recipientName || 'Unregistered'}</span>
                      <code className="text-[10px] font-mono text-indigo-600 bg-indigo-50/50 self-start px-1 py-0.2 rounded mt-0.5">{log.recipientPhone}</code>
                    </div>
                  </td>
                  <td className="py-3 px-4 max-w-xs md:max-w-md">
                    <p className="truncate text-slate-600 text-xs" title={log.message}>
                      {log.message}
                    </p>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    {log.status === 'delivered' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 uppercase tracking-wide">
                        <CheckCircle size={10} className="text-emerald-500" />
                        Delivered
                      </span>
                    ) : log.status === 'failed' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100 uppercase tracking-wide">
                        <AlertTriangle size={10} className="text-rose-500" />
                        Failed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100 uppercase tracking-wide">
                        <RefreshCw size={10} className="text-amber-500 animate-spin" />
                        Pending
                      </span>
                    )}
                  </td>
                </motion.tr>
              ))}
              {smsLogs.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400 italic">
                    কোনো এসএমএস কুইক লগ পাওয়া যায়নি।
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Database Sent SMS logs panel */}
      <div className="bg-white border border-slate-200 rounded-[1.5rem] p-6 shadow-xs relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-6">
          <div className="flex items-center gap-2">
            <History size={18} className="text-slate-600" />
            <div>
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                বার্তা প্রেরণ রেজিস্ট্রি ও লগবুক (Sent SMS History)
              </h2>
              <p className="text-[10px] text-slate-450 mt-0.5 font-sans">সিস্টেম থেকে প্রেরিত মেসেজসমূহের রিয়েলটাইম ইতিহাস ও ডেলিভারি স্ট্যাটাস ট্র্যাকার।</p>
            </div>
          </div>

          {/* Search Table & status filter controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="মেসেজ বা নম্বর দিয়ে খুঁজুন..."
                className="w-full sm:w-60 pl-9 pr-4 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs outline-none bg-white text-slate-700"
              >
                <option value="all">সব লোগ বা বার্তা</option>
                <option value="delivered">সফল (Delivered)</option>
                <option value="failed">ব্যর্থ (Failed)</option>
              </select>
            </div>
          </div>
        </div>

        {/* LOGS TABLE PANEL */}
        <div className="overflow-x-auto min-h-[250px]">
          {filteredLogs.length > 0 ? (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  <th className="py-3 px-4">তারিখ ও সময় (Date)</th>
                  <th className="py-3 px-4">প্রাপক বিবরণ (Recipient)</th>
                  <th className="py-3 px-4">মেসেজ (Message Body)</th>
                  <th className="py-3 px-4">প্রোভাইডার (Provider)</th>
                  <th className="py-3 px-4">অবস্থা (Status)</th>
                  <th className="py-3 px-4 text-right">অ্যাকশন (Action)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {filteredLogs.map(log => (
                  <motion.tr 
                    key={log.id} 
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                    className="hover:bg-slate-50/50 transition-all font-sans"
                  >
                    <td className="py-3.5 px-4 font-mono text-[10px] text-slate-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('bn-BD', { hour12: true })}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <div className="font-extrabold text-slate-800 text-xs">{log.recipientName}</div>
                        <code className="text-[10px] font-mono text-indigo-600 bg-indigo-50/35 px-1 py-0.5 rounded font-bold">{log.recipientPhone}</code>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 max-w-sm">
                      <p className="line-clamp-2 leading-relaxed text-slate-700 text-xs" title={log.message}>
                        {log.message}
                      </p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="bg-slate-100 text-slate-600 text-[9px] font-bold px-2 py-0.5 rounded-full font-mono uppercase border border-slate-200/50">
                        {log.provider || 'Gateway 1'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100/50 uppercase tracking-wide">
                        <CheckCircle size={10} strokeWidth={3} className="text-emerald-500" />
                        Delivered
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button 
                        onClick={() => handleDeleteLog(log.id)}
                        className="p-1 px-1.5 text-rose-500 hover:text-white hover:bg-rose-500 rounded transition-all inline-flex items-center justify-center border border-rose-100/30 font-bold"
                        title="Delete Log"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-16 text-slate-400 italic">
              কোনো এসএমএস লগ বা রেকর্ড ডাটা পাওয়া যায়নি।
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
