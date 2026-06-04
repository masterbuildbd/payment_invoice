import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Globe, Building2, Landmark, FileText, Save, CheckCircle2, Lock, Shield, Eye, EyeOff, Sparkles, MessageSquare, Plus, Trash2, Edit3, PlusCircle, Info, CreditCard, Database, RefreshCw, ArrowUp, ArrowDown } from 'lucide-react';
import { CompanySettings, User } from '../types';
import { useLanguage } from '../lib/language';
import { subscribeToSettings, saveSettings, subscribeToCollection, updateDocument, safeStringify } from '../lib/storage';
import { useAuth } from '../lib/auth';
import { useToast } from '../components/Toast';

const DEFAULT_SETTINGS: CompanySettings = {
  id: 'global',
  companyName: 'MY COMPANY',
  slogan: 'YOUR BUSINESS SLOGAN HERE',
  phone: '0000 0000 0000',
  email: 'Your Email Address Here',
  website: 'Your Web Address Here',
  address: 'Your Address Line Here',
  bankName: 'Bank Name',
  branchName: 'Bank Name',
  accountNo: '00 000 000 000',
  terms: 'Example terms and conditions. Every day eventually is a business synergize vs a sticky workbook etc.',
  loginPageName: 'Master Terminal',
  loginPageLogoUrl: '',
  signatureName: 'Authorized Manager',
  signatureText: 'Manager',
  appLabel: 'অ্যান্ড্রয়েড অ্যাপ্স (Android Apps)',
  decoderLabel: 'ডিকোড লাইসেন্স (Decoder Licenses)',
  panelLabel: 'রিসেলার প্যানেল (Reseller Panels)',
  userLabel: 'গ্রাহক তালিকা (Users Registry)',
  sidebarAdminName: 'Master Admin',
  sidebarTitle: 'Amar Apka',
  appVersion: '1.0',
  
  // Admin menu options defaults
  adminDashboardLabel: 'সারাংশ (Admin Dashboard)',
  adminPaymentRequestsLabel: 'পেমেন্ট রিকোয়েস্ট (Payment Requests)',
  adminInvoicesLabel: 'ইনভয়েস লিস্ট (Invoice List)',
  adminUnpaidLabel: 'বকেয়া ইনভয়েস (Unpaid Invoices)',
  adminPendingUsersLabel: 'পেন্ডিং গ্রাহক (Pending Registrations)',
  adminFinancesLabel: 'ফাইন্যান্সিয়াল খতিয়ান (Financial Accounts)',
  adminSmsLabel: 'এসএমএস পোর্টাল (SMS Portal)',
  adminSettingsLabel: 'সেটিংস কন্ট্রোল (Admin Configs)',
  
  // Client menu options defaults
  clientDashboardLabel: 'সারাংশ (Dashboard Overview)',
  clientDashboardEnabled: true,
  clientInvoicesLabel: 'ইনভয়েস শো (Invoices Show)',
  clientInvoicesEnabled: true,
  clientAccountLabel: 'অ্যাকাউন্ট অপশন (Payment Accounts)',
  clientAccountEnabled: true,
  clientPaymentLabel: 'পেমেন্ট অপশন (Payment Form)',
  clientPaymentEnabled: true,
  clientSmsLabel: 'এসএমএস ইনবক্স (SMS Inbox)',
  clientSmsEnabled: true,
  clientSettingsLabel: 'সেটিংস অপশন (User Settings)',
  clientSettingsEnabled: true,
  clientRejectedInvoicesLabel: 'রিজেক্ট ইনভয়েস (Rejected Invoices)',
  clientRejectedInvoicesEnabled: true,

  // Default Client Payment Form Values
  clientPaymentFormTitle: 'পেমেন্ট রিপোর্টিং অপশন (Submit Payment Ticket Form)',
  clientPaymentFormSubtitle: 'টাকা প্রেরণের পর পেমেন্ট রশিদ ভেরিফিকেশন ফর্মে আপনার পরিশোধিত মাধ্যম, অ্যামাউন্ট এবং লাস্ট নম্বর বা ট্রানজেকশন আইডি প্রদান করে ব্যালেন্স রিকোয়েস্ট তৈরি করুন:',
  clientPaymentPurposeLabel: 'পেমেন্ট উদ্দেশ্য (Purpose / Product) *',
  clientPaymentMethodLabel: 'পেমেন্ট মাধ্যম (Payment Method) *',
  clientPaymentTxnLabel: 'প্রেরক নাম্বার / লাস্ট ৫ ডিজিট *',
  clientPaymentAmountLabel: 'অনুরোধকৃত মোট জমার পরিমাণ *',
  clientPaymentPaidLabel: 'টোটাল পেইড এমাউন্ট (Paid Amount)',
  clientPaymentDueLabel: 'টোটাল ডিউ এমাউন্ট (Due Amount)',
  clientPaymentSubmitButtonLabel: 'পেমেন্ট রিকোয়েস্ট সাবমিট করুন (Submit Payment Ticket)',
  clientPaymentSuccessMessage: 'পেমেন্ট রিকোয়েস্ট ("{purpose}") এডমিনের কাছে জমা হয়েছে! এডমিন শীঘ্রই এটি ভেরিফাই করে ব্যালেন্স আপডেট করে দেবেন।',
  clientPaymentErrorMessage: 'অনুগ্রহ করে পেমেন্ট করার সকল অপশন এবং প্রয়োজনীয় তথ্য সঠিকভাবে নির্বাচন/পূরণ করুন।',

  // Default gateway credentials
  bkashNumber: '01718070273',
  bkashEnabled: true,
  nagadNumber: '01718070273',
  nagadEnabled: true,
  upayNumber: '01718070273',
  upayEnabled: true,
  binancePayId: '542901726',
  binanceEnabled: true,
  binanceUsdtAddress: 'TYm7A8WqyY4fFsh9SgH8eD2c1T9Z9sK8nQ',
  paypalEmail: 'masterbuild14@gmail.com',
  paypalEnabled: true,
  bankEnabled: true,
  runningNotice: 'প্রিয় গ্রাহক, আমাদের যেকোনো নতুন আপডেট বা অফার সম্পর্কিত তথ্য এখন থেকে আপনি সরাসরি এখানে লাইভ দেখতে পাবেন। পেমেন্ট করার পর ৫-১০ মিনিট ধৈর্য ধরুন, আমাদের টিম আপনার পেমেন্টটি রিয়েলটাইমে চেক ও অ্যাক্টিভেট করে দিবে। ধন্যবাদ।',

  // Customizable Reseller Panel rates
  panelPrice1m: 1300,
  panelPrice2m: 2600,
  panelPrice3m: 3900,
  panelPrice4m: 5200,
  panelPrice5m: 6500,
  panelPrice6m: 7800,
  panelPrice12m: 15600,

  // Customizable Decoder rates
  decoderPrice1m: 1500,
  decoderPrice2m: 2500,
  decoderPrice3m: 3500,
  decoderPrice4m: 4500,
  decoderPrice5m: 5500,
  decoderPrice6m: 6500,
  decoderPrice12m: 8600,
  smsTemplates: [
    {
      id: 'welcome',
      label: '🎉 স্বাগতম মেসেজ (Welcome Welcoming)',
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
  ],
  weeklySmsReportEnabled: true,
  weeklySmsReportEmail: 'foysolahmedtapader@gmail.com',
  weeklySmsReportDay: 'Friday',
  paymentApproveWaTemplate: 'আসসালামু আলাইকুম {name}!\n\nআপনার BDT {paid} মূল্যের পেমেন্ট আবেদনটি আমাদের সিস্টেমে সফলভাবে অনুমোদিত (Approved) হয়েছে। 🎉\n\n📌 বিবরণ:\n- পেমেন্ট উদ্দেশ্য: {purpose}\n- পেমেন্ট মাধ্যম: {method}\n- ট্রানজেকশন ID: {txn}\n- চলতি বকেয়া: ৳{due}\n\nআমাদের সেবা ব্যবহারের জন্য আপনাকে ধন্যবাদ!\n- {company}',
  paymentApproveEmailSubjectTemplate: '🎉 Payment Approved & Receipt Confirmed - {id}',
  paymentApproveEmailBodyTemplate: 'আসসালামু আলাইকুম {name}!\n\nআমরা আনন্দের সাথে জানাচ্ছি যে আপনার পেমেন্ট রিকোয়েস্টটি সফলভাবে অনুমোদিত হয়েছে এবং আপনার অ্যাকাউন্ট ব্যালেন্স সচল করা হয়েছে।\n\n📌 বিবরণ:\n- পেমেন্ট উদ্দেশ্য: {purpose}\n- পেমেন্ট মাধ্যম: {method}\n- ট্রানজেকশন ID: {txn}\n- পরিশোধকৃত মোট অ্যামাউন্ট: ৳{paid}\n- চলতি বকেয়া (Due Amount): ৳{due}\n- ইনভয়েস আইডি: INV-{id}\n\nযেকোনো সমস্যায় লাইভ চ্যাট অথবা কাস্টমার কেয়ারে যোগাযোগ করুন।\n\nধন্যবাদ,\n{company} টিম',
  autoDailyBackupEnabled: false,
  lastBackupDate: '',
};

const BANGLADESH_BANKS = [
  "Pubali Bank PLC (পূবালী ব্যাংক)",
  "Sonali Bank PLC (সোনালী ব্যাংক)",
  "BRAC Bank PLC (ব্র্যাক ব্যাংক)",
  "Dutch-Bangla Bank PLC (ডাচ-বাংলা ব্যাংক)",
  "Islami Bank Bangladesh PLC (ইসলামী ব্যাংক)",
  "The City Bank PLC (সিটি ব্যাংক)",
  "United Commercial Bank PLC (ইউসিবি)",
  "Mutual Trust Bank PLC (এমটিবি)",
  "Eastern Bank PLC (ইবিএল)",
  "Dhaka Bank PLC (ঢাকা ব্যাংক)",
  "Bank Asia PLC (ব্যাংক এশিয়া)",
  "Prime Bank PLC (প্রাইম ব্যাংক)",
  "National Bank Limited (ন্যাশনাল ব্যাংক)",
  "Mercantile Bank PLC (মার্কেন্টাইল ব্যাংক)",
  "One Bank PLC (ওয়ান ব্যাংক)",
  "Southeast Bank PLC (সাউথইস্ট ব্যাংক)",
  "Al-Arafah Islami Bank PLC (আল-আরাফাহ ইসলামী ব্যাংক)",
  "Social Islami Bank PLC (সোশ্যাল ইসলামী ব্যাংক)",
  "First Security Islami Bank PLC (ফার্স্ট সিকিউরিটি ইসলামী ব্যাংক)",
  "EXIM Bank PLC (এক্সিম ব্যাংক)",
  "Jamuna Bank PLC (যমুনা ব্যাংক)",
  "Trust Bank PLC (ট্রাস্ট ব্যাংক)",
  "South Bangla Agriculture & Commerce Bank (এসবিএসি)",
  "Standard Bank PLC (স্ট্যান্ডার্ড ব্যাংক)",
  "Union Bank PLC (ইউনিয়ন ব্যাংক)",
  "Janata Bank PLC (জনতা ব্যাংক)",
  "Agrani Bank PLC (অগ্রণী ব্যাংক)",
  "Rupali Bank PLC (রূপালী ব্যাংক)",
  "Standard Chartered Bank (স্ট্যান্ডার্ড চার্টার্ড)",
  "HSBC (এইচএসবিসি)",
  "Community Bank Bangladesh PLC (কমিউনিটি ব্যাংক)",
  "Shimanto Bank PLC (সীমান্ত ব্যাংক)",
  "Global Islami Bank PLC (গ্লোবাল ইসলামী ব্যাংক)"
];

export function Settings() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { addToast } = useToast();
  const [currentUserData, setCurrentUserData] = useState<User | null>(null);
  const [settings, setSettings] = useState<CompanySettings>(DEFAULT_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);

  useEffect(() => {
    if (user) {
      const unsubUser = subscribeToCollection<User>('users', (allUsers) => {
        const found = allUsers.find(u => u.username === user.username);
        if (found) {
          setCurrentUserData(found);
        }
      });
      return () => unsubUser && unsubUser();
    }
  }, [user]);

  // Custom SMS Templates Local States
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [templateLabel, setTemplateLabel] = useState('');
  const [templateText, setTemplateText] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [smsError, setSmsError] = useState('');

  const handleEditTemplate = (tpl: { id: string; label: string; text: string }) => {
    setEditingTemplateId(tpl.id);
    setTemplateLabel(tpl.label);
    setTemplateText(tpl.text);
    setIsAddingNew(false);
    setSmsError('');
  };

  const handleStartAddTemplate = () => {
    setEditingTemplateId(null);
    setTemplateLabel('');
    setTemplateText('');
    setIsAddingNew(true);
    setSmsError('');
  };

  const handleCancelTemplateEdit = () => {
    setEditingTemplateId(null);
    setIsAddingNew(false);
    setTemplateLabel('');
    setTemplateText('');
    setSmsError('');
  };

  const handleSaveTemplate = () => {
    if (!templateLabel.trim()) {
      setSmsError('Template Title/Label is required');
      return;
    }
    if (!templateText.trim()) {
      setSmsError('Template message content is required');
      return;
    }

    const currentTemplates = settings.smsTemplates || DEFAULT_SETTINGS.smsTemplates || [];
    let updatedTemplates = [...currentTemplates];

    if (editingTemplateId) {
      // update existing
      updatedTemplates = updatedTemplates.map(t => 
        t.id === editingTemplateId ? { ...t, label: templateLabel, text: templateText } : t
      );
    } else {
      // create new
      const uniqueId = `custom_${Date.now()}`;
      updatedTemplates.push({
        id: uniqueId,
        label: templateLabel,
        text: templateText
      });
    }

    setSettings(prev => ({ ...prev, smsTemplates: updatedTemplates }));
    
    // reset editor states
    setEditingTemplateId(null);
    setIsAddingNew(false);
    setTemplateLabel('');
    setTemplateText('');
    setSmsError('');
  };

  const handleDeleteTemplate = (idToDelete: string) => {
    const currentTemplates = settings.smsTemplates || DEFAULT_SETTINGS.smsTemplates || [];
    const updatedTemplates = currentTemplates.filter(t => t.id !== idToDelete);
    setSettings(prev => ({ ...prev, smsTemplates: updatedTemplates }));
  };

  // Password Change State
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPass, setShowPass] = useState(false);
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState(false);

  // States & helper for manual backup
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupMessage, setBackupMessage] = useState<string | null>(null);
  const [backupType, setBackupType] = useState<'success' | 'error' | null>(null);

  const handleManualBackup = async () => {
    setIsBackingUp(true);
    setBackupMessage(null);
    setBackupType(null);
    try {
      const { runDailyBackup } = await import('../lib/storage');
      const res = await runDailyBackup(settings, true);
      if (res.success) {
        setBackupType('success');
        setBackupMessage(`সফলভাবে ব্যাকআপ সম্পন্ন হয়েছে! তারিখ: ${res.date}`);
        setSettings(prev => ({ ...prev, lastBackupDate: res.date }));
      } else {
        setBackupType('error');
        setBackupMessage(`ব্যাকআপ ব্যর্থ হয়েছে: ${res.error}`);
      }
    } catch (err: any) {
      setBackupType('error');
      setBackupMessage(`ব্যতিক্রমী ত্রুটি: ${err.message || err}`);
    } finally {
      setIsBackingUp(false);
    }
  };

  useEffect(() => {
    const unsubscribe = subscribeToSettings((updatedSettings) => {
      setSettings(prev => ({
        ...DEFAULT_SETTINGS,
        ...updatedSettings
      }));
    });
    return () => unsubscribe && unsubscribe();
  }, []);

  const handlePassChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess(false);

    const currentPassFromDb = (currentUserData?.password || user?.password || '').trim();

    if (currentPassFromDb && passwordData.currentPassword.trim() !== currentPassFromDb) {
      setPassError('Current password is incorrect');
      return;
    }

    if (passwordData.newPassword.trim() !== passwordData.confirmPassword.trim()) {
      setPassError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.trim().length < 6) {
      setPassError('Password must be at least 6 characters');
      return;
    }

    setIsSaving(true);
    try {
      const userId = currentUserData?.id || user?.id;
      if (!userId) {
        throw new Error('User session not found');
      }

      const trimmedNewPass = passwordData.newPassword.trim();
      await updateDocument<User>('users', userId, { password: trimmedNewPass });

      if (user) {
        const updatedLocalUser = { ...user, password: trimmedNewPass };
        localStorage.setItem('master_user', safeStringify(updatedLocalUser));
      }

      setPassSuccess(true);
      addToast({
        type: 'success',
        title: 'Password Changed',
        message: 'Your administrator password has been updated successfully.'
      });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPassSuccess(false), 4000);
    } catch (err: any) {
      setPassError('Failed to change password. Please try again.');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      await saveSettings(settings);
      setIsSaving(false);
      setShowSavedToast(true);
      setTimeout(() => setShowSavedToast(false), 3000);
    } catch (error) {
      console.error('Failed to save settings', error instanceof Error ? error.message : String(error));
      setIsSaving(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'login' | 'company') => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        alert('File size too large. Please upload an image smaller than 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'login') {
          setSettings(prev => ({ ...prev, loginPageLogoUrl: reader.result as string }));
        } else {
          setSettings(prev => ({ ...prev, logoUrl: reader.result as string }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleToggle = (name: keyof CompanySettings) => {
    setSettings(prev => ({ ...prev, [name]: !prev[name] }));
  };

  return (
    <div className="space-y-8 max-w-4xl pb-12">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Settings</h1>
          <p className="text-slate-500 text-sm">Configure your brand identity and invoice details</p>
        </div>
        {showSavedToast && (
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100 animate-in fade-in slide-in-from-right-4">
            <CheckCircle2 size={16} />
            <span className="text-xs font-bold">Settings Saved Successfully</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Login Page Customization */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
              <Shield size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Auth Page Customization</h2>
              <p className="text-xs text-slate-500">Configure how the login screen appears to users</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Login Page Name</label>
              <input 
                name="loginPageName"
                value={settings.loginPageName || ''}
                onChange={handleChange}
                placeholder="Master Terminal"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all text-sm font-medium"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center md:text-left">Login Page Logo</label>
              <div className="flex flex-col md:flex-row items-center gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="w-16 h-16 bg-white rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm">
                  {settings.loginPageLogoUrl ? (
                    <img src={settings.loginPageLogoUrl} alt="Logo Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Shield className="text-slate-200" size={32} />
                  )}
                </div>
                <div className="flex-1 space-y-2 w-full">
                  <label className="block">
                    <span className="sr-only">Choose logo file</span>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => handleLogoUpload(e, 'login')}
                      className="block w-full text-xs text-slate-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-xs file:font-black
                        file:bg-indigo-50 file:text-indigo-700
                        hover:file:bg-indigo-100
                        cursor-pointer"
                    />
                  </label>
                  <p className="text-[9px] text-slate-400 font-medium">Recommended: Square SVG or PNG with transparent background. Max 2MB.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Company Identity */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
              <Building2 size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Company Identity</h2>
              <p className="text-xs text-slate-500">How your business appears on invoices and reports</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Company Name</label>
                <input 
                  name="companyName"
                  value={settings.companyName}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all text-sm font-medium"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Business Slogan</label>
                <input 
                  name="slogan"
                  value={settings.slogan}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all text-sm font-medium"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">App Version</label>
                <select 
                  name="appVersion"
                  value={settings.appVersion || '1.0'}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all text-sm font-medium"
                >
                  {Array.from({ length: 20 }, (_, i) => (i + 1).toFixed(1)).map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center md:text-left">Company Logo (Invoice)</label>
              <div className="flex flex-col md:flex-row items-center gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="w-16 h-16 bg-white rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm transition-all hover:scale-105">
                  {settings.logoUrl ? (
                    <img src={settings.logoUrl} alt="Company Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Building2 className="text-slate-200" size={32} />
                  )}
                </div>
                <div className="flex-1 space-y-2 w-full">
                  <label className="block">
                    <span className="sr-only">Choose logo file</span>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => handleLogoUpload(e, 'company')}
                      className="block w-full text-xs text-slate-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-xs file:font-black
                        file:bg-indigo-50 file:text-indigo-700
                        hover:file:bg-indigo-100
                        cursor-pointer"
                    />
                  </label>
                  <p className="text-[9px] text-slate-400 font-medium">Recommended: Rectangular or Square logo. High resolution. Max 2MB.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center text-sky-600">
              <Globe size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Contact Details</h2>
              <p className="text-xs text-slate-500">Contact info displayed in the invoice header</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Phone Number</label>
              <input 
                name="phone"
                value={settings.phone}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all text-sm font-medium"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Address</label>
              <input 
                name="email"
                value={settings.email}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all text-sm font-medium"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Website URL</label>
              <input 
                name="website"
                value={settings.website}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all text-sm font-medium"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Physical Address</label>
              <input 
                name="address"
                value={settings.address}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all text-sm font-medium"
              />
            </div>
          </div>
        </div>

        {/* Bank Information */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                <Landmark size={20} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Bank Information</h2>
                <p className="text-xs text-slate-500">Preferred payment destination details</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input 
                type="checkbox"
                checked={settings.bankEnabled !== false}
                onChange={() => handleToggle('bankEnabled')}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
              <span className="text-xs font-bold text-slate-500 ml-2">{settings.bankEnabled !== false ? 'Enabled' : 'Disabled'}</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bank Name (ব্যাংকের নাম)</label>
              {(() => {
                const isKnownBank = !settings.bankName || BANGLADESH_BANKS.includes(settings.bankName) || settings.bankName === 'Bank Name';
                const selectValue = isKnownBank ? (settings.bankName || '') : 'other';
                return (
                  <div className="space-y-2">
                    <select
                      value={selectValue}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'other') {
                          setSettings(prev => ({ ...prev, bankName: 'Custom Bank' }));
                        } else {
                          setSettings(prev => ({ ...prev, bankName: val }));
                        }
                      }}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all text-sm font-medium"
                    >
                      <option value="">নির্বাচন করুন (Select Bank)</option>
                      {BANGLADESH_BANKS.map((bank) => (
                        <option key={bank} value={bank}>{bank}</option>
                      ))}
                      <option value="other">অন্যান্য (Other Bank / Custom Write)</option>
                    </select>
                    {!isKnownBank && (
                      <input 
                        type="text"
                        name="bankName"
                        value={settings.bankName || ''}
                        onChange={handleChange}
                        placeholder="আপনার ব্যাংকের নাম লিখুন (Type custom bank name)"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all text-sm font-medium animate-in slide-in-from-top-1 duration-200"
                      />
                    )}
                  </div>
                );
              })()}
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Branch Name</label>
              <input 
                name="branchName"
                value={settings.branchName}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all text-sm font-medium"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Account Holder Name</label>
              <input 
                name="accountName"
                value={settings.accountName || ''}
                onChange={handleChange}
                placeholder="Account Owner Name"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all text-sm font-medium"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Account Number</label>
              <input 
                name="accountNo"
                value={settings.accountNo}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all text-sm font-medium"
              />
            </div>
          </div>
        </div>

        {/* Terms & Footer */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Invoice Policies</h2>
              <p className="text-xs text-slate-500">Terms and conditions shown at the bottom</p>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Terms & Conditions</label>
            <textarea 
              name="terms"
              value={settings.terms}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all text-sm font-medium resize-none"
            />
          </div>
        </div>

        {/* Client Dashboard Announcement Banner */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
              <Sparkles size={20} className="animate-pulse text-amber-500" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">রানিং টেক্সট বিজ্ঞপ্তি সেটিংস (Running Notice Dashboard Settings)</h2>
              <p className="text-xs text-slate-500">গ্রাহক ড্যাশবোর্ডে সচল স্ক্রলিং টেক্সট নোটিফিকেশন সংশোধন করুন</p>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">স্ক্রলিং নোটিশ বার্তা (Marquee Announcement Notice)</label>
            <textarea 
              name="runningNotice"
              value={settings.runningNotice || ''}
              onChange={handleChange}
              rows={3}
              placeholder="গ্রাহকের স্ক্রিনের স্বাগতম ব্যানার এর নিচে সচল রানিং টেক্সট দেখার জন্য বার্তাটি লিখুন..."
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all text-sm font-medium resize-none"
            />
          </div>
        </div>

        {/* Signature Settings */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
              <SettingsIcon size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">E-Signature Configuration</h2>
              <p className="text-xs text-slate-500">Customize the signature block on your invoices</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Signature Display Name</label>
              <input 
                name="signatureName"
                value={settings.signatureName || ''}
                onChange={handleChange}
                placeholder="Authorized Manager"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all text-sm font-medium"
              />
              <p className="text-[9px] text-slate-400">The title shown below the signature line.</p>
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Signature Script Text</label>
              <input 
                name="signatureText"
                value={settings.signatureText || ''}
                onChange={handleChange}
                placeholder="Manager"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all text-sm font-medium"
              />
              <p className="text-[9px] text-slate-400">This text will appear in a handwriting-style font as the signature.</p>
            </div>
          </div>
        </div>

        {/* Category Labels Customization */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
              <SettingsIcon size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Module Labeling</h2>
              <p className="text-xs text-slate-500">Customize the name of categories used throughout the app</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Apps Label</label>
              <input 
                name="appLabel"
                value={settings.appLabel ?? ''}
                onChange={handleChange}
                placeholder="Apps"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all text-sm font-medium"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Panels Label</label>
              <input 
                name="panelLabel"
                value={settings.panelLabel ?? ''}
                onChange={handleChange}
                placeholder="Panels"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all text-sm font-medium"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Decoders Label</label>
              <input 
                name="decoderLabel"
                value={settings.decoderLabel ?? ''}
                onChange={handleChange}
                placeholder="Decoders"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all text-sm font-medium"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Users Label</label>
              <input 
                name="userLabel"
                value={settings.userLabel ?? ''}
                onChange={handleChange}
                placeholder="Users"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all text-sm font-medium"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sidebar Admin Name</label>
              <input 
                name="sidebarAdminName"
                value={settings.sidebarAdminName ?? ''}
                onChange={handleChange}
                placeholder="Master Admin"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all text-sm font-medium"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sidebar Title</label>
              <input 
                name="sidebarTitle"
                value={settings.sidebarTitle ?? ''}
                onChange={handleChange}
                placeholder="Amar Apka"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all text-sm font-medium"
              />
            </div>
          </div>
        </div>

        {/* Admin Sidebar Menu Options Configuration */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
              <SettingsIcon size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Admin Sidebar Option Labels (এডমিন মেনু অপশন লেবেল)</h2>
              <p className="text-xs text-slate-500">Customize the specific names of options on the administrative menu bar / sidebar</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dashboard Option</label>
              <input 
                name="adminDashboardLabel"
                value={settings.adminDashboardLabel ?? ''}
                onChange={handleChange}
                placeholder="সারাংশ"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all text-sm font-medium"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Payment Requests Option</label>
              <input 
                name="adminPaymentRequestsLabel"
                value={settings.adminPaymentRequestsLabel ?? ''}
                onChange={handleChange}
                placeholder="পেমেন্ট রিকোয়েস্ট"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all text-sm font-medium"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Invoices Option</label>
              <input 
                name="adminInvoicesLabel"
                value={settings.adminInvoicesLabel ?? ''}
                onChange={handleChange}
                placeholder="ইনভয়েস"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all text-sm font-medium"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Unpaid Bills Option</label>
              <input 
                name="adminUnpaidLabel"
                value={settings.adminUnpaidLabel ?? ''}
                onChange={handleChange}
                placeholder="বকেয়া বিল"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all text-sm font-medium"
              />
            </div>
            
            {/* Newly added core module option names inside Admin Sidebar configuration */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Apps Management Option</label>
              <input 
                name="appLabel"
                value={settings.appLabel ?? ''}
                onChange={handleChange}
                placeholder="অ্যান্ড্রয়েড অ্যাপ্স"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all text-sm font-medium"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Panels Management Option</label>
              <input 
                name="panelLabel"
                value={settings.panelLabel ?? ''}
                onChange={handleChange}
                placeholder="রিসেলার প্যানেল"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all text-sm font-medium"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Decoders Management Option</label>
              <input 
                name="decoderLabel"
                value={settings.decoderLabel ?? ''}
                onChange={handleChange}
                placeholder="ডিকোড লাইসেন্স"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all text-sm font-medium"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Users Management Option</label>
              <input 
                name="userLabel"
                value={settings.userLabel ?? ''}
                onChange={handleChange}
                placeholder="গ্রাহক তালিকা"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all text-sm font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pending Users Option</label>
              <input 
                name="adminPendingUsersLabel"
                value={settings.adminPendingUsersLabel ?? ''}
                onChange={handleChange}
                placeholder="পেন্ডিং ইউজার"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all text-sm font-medium"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Finances Option</label>
              <input 
                name="adminFinancesLabel"
                value={settings.adminFinancesLabel ?? ''}
                onChange={handleChange}
                placeholder="অর্থ হিসাব"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all text-sm font-medium"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">SMS Portal Option</label>
              <input 
                name="adminSmsLabel"
                value={settings.adminSmsLabel ?? ''}
                onChange={handleChange}
                placeholder="এসএমএস পোর্টাল"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all text-sm font-medium"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Settings Option</label>
              <input 
                name="adminSettingsLabel"
                value={settings.adminSettingsLabel ?? ''}
                onChange={handleChange}
                placeholder="সিস্টেম সেটিংস"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all text-sm font-medium"
              />
            </div>
          </div>
        </div>

        {/* Client Portal Menu Customization */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
              <SettingsIcon size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Client Portal Menu & Systems Config</h2>
              <p className="text-xs text-slate-500">Configure label names and change/enable/disable options for the client sidebar menu</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Dashboard Tab */}
              <div className="p-4 border border-slate-100 rounded-xl bg-slate-50/20 flex flex-col justify-between gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">1. Dashboard Overview</span>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input 
                      type="checkbox"
                      checked={settings.clientDashboardEnabled !== false}
                      onChange={() => handleToggle('clientDashboardEnabled')}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Menu Label</label>
                  <input
                    name="clientDashboardLabel"
                    value={settings.clientDashboardLabel ?? ''}
                    onChange={handleChange}
                    placeholder="সারাংশ (Dashboard Overview)"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-semibold text-slate-700"
                  />
                </div>
              </div>

              {/* Invoices Tab */}
              <div className="p-4 border border-slate-100 rounded-xl bg-slate-50/20 flex flex-col justify-between gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">2. Invoices Show</span>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input 
                      type="checkbox"
                      checked={settings.clientInvoicesEnabled !== false}
                      onChange={() => handleToggle('clientInvoicesEnabled')}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Menu Label</label>
                  <input
                    name="clientInvoicesLabel"
                    value={settings.clientInvoicesLabel ?? ''}
                    onChange={handleChange}
                    placeholder="ইনভয়েস শো (Invoices Show)"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-semibold text-slate-700"
                  />
                </div>
              </div>

              {/* Account Option Tab */}
              <div className="p-4 border border-slate-100 rounded-xl bg-slate-50/20 flex flex-col justify-between gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">3. Payment Accounts Details</span>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input 
                      type="checkbox"
                      checked={settings.clientAccountEnabled !== false}
                      onChange={() => handleToggle('clientAccountEnabled')}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Menu Label</label>
                  <input
                    name="clientAccountLabel"
                    value={settings.clientAccountLabel ?? ''}
                    onChange={handleChange}
                    placeholder="অ্যাকাউন্ট অপশন (Payment Accounts)"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-semibold text-slate-700"
                  />
                </div>
              </div>

              {/* Payment Sub-Tab */}
              <div className="p-4 border border-slate-100 rounded-xl bg-slate-50/20 flex flex-col justify-between gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">4. Payment Form submission</span>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input 
                      type="checkbox"
                      checked={settings.clientPaymentEnabled !== false}
                      onChange={() => handleToggle('clientPaymentEnabled')}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Menu Label</label>
                  <input
                    name="clientPaymentLabel"
                    value={settings.clientPaymentLabel ?? ''}
                    onChange={handleChange}
                    placeholder="পেমেন্ট অপশন (Payment Form)"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-semibold text-slate-700"
                  />
                </div>
              </div>

              {/* Client Settings Tab */}
              <div className="p-4 border border-slate-100 rounded-xl bg-slate-50/20 flex flex-col justify-between gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">5. Client Profile Settings</span>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input 
                      type="checkbox"
                      checked={settings.clientSettingsEnabled !== false}
                      onChange={() => handleToggle('clientSettingsEnabled')}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Menu Label</label>
                  <input
                    name="clientSettingsLabel"
                    value={settings.clientSettingsLabel ?? ''}
                    onChange={handleChange}
                    placeholder="সেটিংস অপশন (User Settings)"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-semibold text-slate-700"
                  />
                </div>
              </div>

              {/* Client SMS Tab */}
              <div className="p-4 border border-slate-100 rounded-xl bg-slate-50/20 flex flex-col justify-between gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">6. Client SMS Inbox Option</span>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input 
                      type="checkbox"
                      checked={settings.clientSmsEnabled !== false}
                      onChange={() => handleToggle('clientSmsEnabled')}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Menu Label</label>
                  <input
                    name="clientSmsLabel"
                    value={settings.clientSmsLabel ?? ''}
                    onChange={handleChange}
                    placeholder="এসএমএস ইনবক্স (SMS Inbox)"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-semibold text-slate-700"
                  />
                </div>
              </div>

              {/* Client Rejected Invoices Tab */}
              <div className="p-4 border border-slate-100 rounded-xl bg-slate-50/20 flex flex-col justify-between gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">7. Client Rejected Invoices Option</span>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input 
                      type="checkbox"
                      checked={settings.clientRejectedInvoicesEnabled !== false}
                      onChange={() => handleToggle('clientRejectedInvoicesEnabled')}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Menu Label</label>
                  <input
                    name="clientRejectedInvoicesLabel"
                    value={settings.clientRejectedInvoicesLabel ?? ''}
                    onChange={handleChange}
                    placeholder="রিজেক্ট ইনভয়েস (Rejected Invoices)"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-semibold text-slate-700"
                  />
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Global Online Payment Gateways Configuration */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
              <Landmark size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Online Mobile & Crypto Gateways</h2>
              <p className="text-xs text-slate-500">Add or edit numbers/IDs for automatic wallets shown to client portal users</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">BKASH PERSONAL NUMBER</label>
                <label className="relative inline-flex items-center cursor-pointer scale-75 select-none">
                  <input 
                    type="checkbox"
                    checked={settings.bkashEnabled !== false}
                    onChange={() => handleToggle('bkashEnabled')}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  <span className="text-[10px] font-bold text-slate-500 ml-1.5">{settings.bkashEnabled !== false ? 'Enabled' : 'Disabled'}</span>
                </label>
              </div>
              <input 
                name="bkashNumber"
                value={settings.bkashNumber ?? ''}
                onChange={handleChange}
                placeholder="01718070273"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all text-sm font-medium font-mono"
              />
              <p className="text-[9px] text-slate-400">BKash wallet number displayed under payment accounts & invoice top-ups.</p>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">NAGAD PERSONAL NUMBER</label>
                <label className="relative inline-flex items-center cursor-pointer scale-75 select-none">
                  <input 
                    type="checkbox"
                    checked={settings.nagadEnabled !== false}
                    onChange={() => handleToggle('nagadEnabled')}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  <span className="text-[10px] font-bold text-slate-500 ml-1.5">{settings.nagadEnabled !== false ? 'Enabled' : 'Disabled'}</span>
                </label>
              </div>
              <input 
                name="nagadNumber"
                value={settings.nagadNumber ?? ''}
                onChange={handleChange}
                placeholder="01718070273"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all text-sm font-medium font-mono"
              />
              <p className="text-[9px] text-slate-400">Nagad wallet number displayed under payment accounts & invoice top-ups.</p>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">UPAY PERSONAL NUMBER</label>
                <label className="relative inline-flex items-center cursor-pointer scale-75 select-none">
                  <input 
                    type="checkbox"
                    checked={settings.upayEnabled !== false}
                    onChange={() => handleToggle('upayEnabled')}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  <span className="text-[10px] font-bold text-slate-500 ml-1.5">{settings.upayEnabled !== false ? 'Enabled' : 'Disabled'}</span>
                </label>
              </div>
              <input 
                name="upayNumber"
                value={settings.upayNumber ?? ''}
                onChange={handleChange}
                placeholder="01718070273"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all text-sm font-medium font-mono"
              />
              <p className="text-[9px] text-slate-400">Upay wallet number displayed under payment accounts & invoice top-ups.</p>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">BINANCE PAY ID</label>
                <label className="relative inline-flex items-center cursor-pointer scale-75 select-none">
                  <input 
                    type="checkbox"
                    checked={settings.binanceEnabled !== false}
                    onChange={() => handleToggle('binanceEnabled')}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  <span className="text-[10px] font-bold text-slate-500 ml-1.5">{settings.binanceEnabled !== false ? 'Enabled' : 'Disabled'}</span>
                </label>
              </div>
              <input 
                name="binancePayId"
                value={settings.binancePayId ?? ''}
                onChange={handleChange}
                placeholder="542901726"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all text-sm font-medium font-mono"
              />
              <p className="text-[9px] text-slate-400">Your Binance Account Pay ID for internal instant transfers.</p>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">USDT WALLET (TRC-20) ADDRESS</label>
              <input 
                name="binanceUsdtAddress"
                value={settings.binanceUsdtAddress ?? ''}
                onChange={handleChange}
                placeholder="TYm7A8WqyY4fFsh9SgH8eD2c1T9Z9sK8nQ"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all text-sm font-medium font-mono"
              />
              <p className="text-[9px] text-slate-400">Secure TRC20 token reception address.</p>
            </div>

            <div className="space-y-1 md:col-span-2">
              <div className="flex justify-between items-center">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">PAYPAL REGISTERED EMAIL</label>
                <label className="relative inline-flex items-center cursor-pointer scale-75 select-none">
                  <input 
                    type="checkbox"
                    checked={settings.paypalEnabled !== false}
                    onChange={() => handleToggle('paypalEnabled')}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  <span className="text-[10px] font-bold text-slate-500 ml-1.5">{settings.paypalEnabled !== false ? 'Enabled' : 'Disabled'}</span>
                </label>
              </div>
              <input 
                name="paypalEmail"
                type="email"
                value={settings.paypalEmail ?? ''}
                onChange={handleChange}
                placeholder="masterbuild14@gmail.com"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all text-sm font-medium font-mono"
              />
              <p className="text-[9px] text-slate-400">Preferred Paypal primary account email for invoice billing or international transfers.</p>
            </div>
          </div>
        </div>

      {/* Customer Top-Up Rates & Plan Pricing */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
            <Sparkles size={20} className="text-indigo-600 animate-spin-slow animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">টপ-আপ রেট ও মেয়াদ মূল্য সেটিংস (Client Plan Rates & Pricing)</h2>
            <p className="text-xs text-slate-500">মেয়াদ ও লাইসেন্স অনুযায়ী ক্রয়ের জন্য প্রতি প্যাকেজেস এর মূল্য নির্ধারণ করুন</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Reseller Panel Durations Price Configuration Block */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-rose-600 tracking-wider uppercase flex items-center gap-1.5 bg-rose-50 px-3 py-1.5 rounded-lg w-fit">
              {settings.panelLabel || 'Reseller Panel'} Duration Custom Rates
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
              {[
                { field: 'panelPrice1m', label: '1 Month' },
                { field: 'panelPrice2m', label: '2 Month' },
                { field: 'panelPrice3m', label: '3 Month' },
                { field: 'panelPrice4m', label: '4 Month' },
                { field: 'panelPrice5m', label: '5 Month' },
                { field: 'panelPrice6m', label: '6 Month' },
                { field: 'panelPrice12m', label: '12 Month' },
              ].map(item => (
                <div key={item.field} className="space-y-1">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest">{item.label}</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-black text-slate-400">৳</span>
                    <input 
                      type="number"
                      name={item.field}
                      value={(settings as any)[item.field] ?? ''}
                      onChange={handleChange}
                      placeholder="0"
                      className="w-full pl-6 pr-2 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-500/10 focus:bg-white text-xs font-semibold font-mono"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Decoder License System Price Configuration Block */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-indigo-600 tracking-wider uppercase flex items-center gap-1.5 bg-indigo-50 px-3 py-1.5 rounded-lg w-fit">
              {settings.decoderLabel || 'Decoder System'} Duration Custom Rates
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
              {[
                { field: 'decoderPrice1m', label: '1 Month' },
                { field: 'decoderPrice2m', label: '2 Month' },
                { field: 'decoderPrice3m', label: '3 Month' },
                { field: 'decoderPrice4m', label: '4 Month' },
                { field: 'decoderPrice5m', label: '5 Month' },
                { field: 'decoderPrice6m', label: '6 Month' },
                { field: 'decoderPrice12m', label: '12 Month' },
              ].map(item => (
                <div key={item.field} className="space-y-1">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest">{item.label}</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-black text-slate-400">৳</span>
                    <input 
                      type="number"
                      name={item.field}
                      value={(settings as any)[item.field] ?? ''}
                      onChange={handleChange}
                      placeholder="0"
                      className="w-full pl-6 pr-2 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/10 focus:bg-white text-xs font-semibold font-mono"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

        {/* SMS Templates Configuration */}
        <div id="sms-templates-section" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 animate-in fade-in duration-300">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                <MessageSquare size={20} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Predefined SMS Templates (এসএমএস টেমপ্লেট কনফিগারেশন)</h2>
                <p className="text-xs text-slate-500 font-medium">Configure and customize dynamic text templates for quick-send SMS notifications</p>
              </div>
            </div>
            {!editingTemplateId && !isAddingNew && (
              <button
                type="button"
                onClick={handleStartAddTemplate}
                className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-sm shadow-indigo-100 active:scale-95"
              >
                <Plus size={14} className="stroke-[2.5]" />
                Add Template (টেমপ্লেট যোগ করুন)
              </button>
            )}
          </div>

          {/* Placeholders Guide info block */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-start gap-4">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 mt-0.5">
              <Info size={16} />
            </div>
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-indigo-900">ডাইনামিক প্লেসহোল্ডার কোডসমূহ (Available Template Tags)</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                আপনার তৈরি করা মেসেজগুলোতে নিচের ব্র্যাকেট কোডগুলো ব্যবহার করলে এসএমএস পাঠানোর সময় সেগুলো স্বয়ংক্রিয়ভাবে পরিবর্তিত হয়ে গ্রাহকের রিয়েল-টাইম তথ্য দেখাবে:
              </p>
              <div className="flex flex-wrap gap-2 pt-1 font-mono text-[10px]">
                <span className="bg-indigo-100/60 text-indigo-800 px-2.5 py-1 rounded-md font-bold">
                  {"{name}"} &rarr; গ্রাহকের নাম (Customer Name)
                </span>
                <span className="bg-rose-100/60 text-rose-800 px-2.5 py-1 rounded-md font-bold">
                  {"{due}"} &rarr; বকেয়া টাকার পরিমাণ (Due Amount)
                </span>
                <span className="bg-emerald-100/60 text-emerald-800 px-2.5 py-1 rounded-md font-bold">
                  {"{paid}"} &rarr; পেমেন্ট বা জমাকৃত টাকা (Paid Amount)
                </span>
                <span className="bg-amber-100/60 text-amber-800 px-2.5 py-1 rounded-md font-bold">
                  {"{company}"} &rarr; কোম্পানির নাম (Company Brand)
                </span>
              </div>
            </div>
          </div>

          {/* If Editing or Adding, show Form */}
          {(editingTemplateId || isAddingNew) ? (
            <div className="bg-indigo-50/40 p-5 rounded-2xl border border-indigo-100 space-y-4 animate-in slide-in-from-top-2 duration-300">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-black text-indigo-700 tracking-wider uppercase">
                  {editingTemplateId ? 'Edit Predefined Template' : 'Add New SMS Template'}
                </h3>
                <span className="text-[10px] font-bold text-slate-400 capitalize">
                  {editingTemplateId ? `ID: ${editingTemplateId}` : 'New Custom Template'}
                </span>
              </div>

              {smsError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-bold">
                  {smsError}
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-550 uppercase tracking-widest ms-1">
                    Template Title / Label * (টেমপ্লেট টাইটেল)
                  </label>
                  <input
                    type="text"
                    value={templateLabel}
                    onChange={(e) => setTemplateLabel(e.target.value)}
                    placeholder="e.g. 🎉 স্বাগতম বার্তা (Welcome Notification)"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-semibold text-slate-800"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center ms-1">
                    <label className="block text-[10px] font-black text-slate-550 uppercase tracking-widest">
                      Template Message Content * (টেমপ্লেট বার্তা)
                    </label>
                    <span className="text-[10px] text-slate-400">
                      Length: <span className="font-bold text-indigo-600">{templateText.length}</span> chars
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    value={templateText}
                    onChange={(e) => setTemplateText(e.target.value)}
                    placeholder="প্রিয় {name}, আপনার মোট বিল ৳{due} বকেয়া রয়েছে..."
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-medium text-slate-800"
                  />

                  {/* Tap buttons to insert dynamic shortcuts */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                    <span className="text-[10px] text-slate-400 me-2 font-bold">Tap to insert variable:</span>
                    <button
                      type="button"
                      onClick={() => setTemplateText(prev => prev + '{name}')}
                      className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-bold text-indigo-600 transition-all hover:scale-105 active:scale-95"
                    >
                      + Name {"{name}"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setTemplateText(prev => prev + '{due}')}
                      className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-bold text-indigo-600 transition-all hover:scale-105 active:scale-95"
                    >
                      + Due {"{due}"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setTemplateText(prev => prev + '{paid}')}
                      className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-bold text-indigo-600 transition-all hover:scale-105 active:scale-95"
                    >
                      + Paid {"{paid}"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setTemplateText(prev => prev + '{company}')}
                      className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-bold text-indigo-600 transition-all hover:scale-105 active:scale-95"
                    >
                      + Company {"{company}"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCancelTemplateEdit}
                  className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 active:scale-95 transition-all"
                >
                  Cancel (বাতিল)
                </button>
                <button
                  type="button"
                  onClick={handleSaveTemplate}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold active:scale-95 transition-all shadow-sm"
                >
                  Confirm Template (নিশ্চিত করুন)
                </button>
              </div>
            </div>
          ) : null}

          {/* Templates Grid List */}
          <div className="space-y-3.5">
            <h3 className="text-xs font-black text-slate-400 tracking-wider uppercase">
              Current predefined templates (বিদ্যমান টেমপ্লেটসমূহ)
            </h3>

            {(() => {
              const currentTemplates = settings.smsTemplates || DEFAULT_SETTINGS.smsTemplates || [];
              if (currentTemplates.length === 0) {
                return (
                  <div className="text-center py-8 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                    <p className="text-sm font-semibold text-slate-400">কোন এসএমএস টেমপ্লেট পাওয়া যায়নি। টেমপ্লেট যুক্ত করুন।</p>
                    <p className="text-xs text-slate-400/80 font-medium">No SMS templates found. Start by creating one!</p>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentTemplates.map((tpl) => (
                    <div 
                      key={tpl.id} 
                      className="bg-slate-50/50 p-4 rounded-2xl border border-slate-200 relative hover:border-slate-300 hover:bg-white transition-all duration-300 group flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="space-y-0.5">
                            <h4 className="text-xs font-bold text-slate-800 tracking-tight pr-14 leading-snug">
                              {tpl.label}
                            </h4>
                            <span className="inline-block px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[8px] font-mono font-black uppercase tracking-wider">
                              ID: {tpl.id}
                            </span>
                          </div>

                          {/* Controls */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleEditTemplate(tpl)}
                              className="p-1.5 bg-white text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-150 rounded-lg transition-all"
                              title="Edit"
                            >
                              <Edit3 size={12} className="stroke-[2.5]" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteTemplate(tpl.id)}
                              className="p-1.5 bg-white text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-150 rounded-lg transition-all"
                              title="Delete"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-500 bg-white/60 p-3 rounded-xl border border-slate-100 font-semibold leading-relaxed pr-2 break-words">
                          "{tpl.text}"
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>

        {/* Client Payment Form Customization */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
              <CreditCard size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Client Payment Ticket Form Customization</h2>
              <p className="text-xs text-slate-500">গ্রাহকের পেমেন্ট রিকোয়েস্ট উইজেট ও ফর্মের সব লেখা এবং অনুবাদ পরিবর্তন করুন</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Form Title (ফর্মের শিরোনাম)</label>
              <input 
                name="clientPaymentFormTitle"
                value={settings.clientPaymentFormTitle || ''}
                onChange={handleChange}
                placeholder="পেমেন্ট রিপোর্টিং অপশন (Submit Payment Ticket Form)"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all text-sm font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Purpose Select Label (পেমেন্ট উদ্দেশ্য কলাম)</label>
              <input 
                name="clientPaymentPurposeLabel"
                value={settings.clientPaymentPurposeLabel || ''}
                onChange={handleChange}
                placeholder="পেমেন্ট উদ্দেশ্য (Purpose / Product) *"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all text-sm font-medium"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Form Subtitle / Instructions (ফর্ম সংক্রান্ত নির্দেশনা ও বর্ণনা)</label>
              <textarea 
                name="clientPaymentFormSubtitle"
                value={settings.clientPaymentFormSubtitle || ''}
                onChange={handleChange}
                rows={2}
                placeholder="টাকা প্রেরণের পর পেমেন্ট রশিদ ভেরিফিকেশন ফর্মে আপনার পরিশোধিত মাধ্যম, অ্যামাউন্ট এবং লাস্ট নম্বর বা ট্রানজেকশন আইডি প্রদান করে ব্যালেন্স রিকোয়েস্ট তৈরি করুন:"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all text-sm font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Payment Method Label (পেমেন্ট মাধ্যম কলাম)</label>
              <input 
                name="clientPaymentMethodLabel"
                value={settings.clientPaymentMethodLabel || ''}
                onChange={handleChange}
                placeholder="পেমেন্ট মাধ্যম (Payment Method) *"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all text-sm font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sender ID / Phone Label (প্রেরক কলাম)</label>
              <input 
                name="clientPaymentTxnLabel"
                value={settings.clientPaymentTxnLabel || ''}
                onChange={handleChange}
                placeholder="প্রেরক নাম্বার / লাস্ট ৫ ডিজিট *"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all text-sm font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Requested Amount Label (জমাকৃত মোট অ্যামাউন্ট কলাম)</label>
              <input 
                name="clientPaymentAmountLabel"
                value={settings.clientPaymentAmountLabel || ''}
                onChange={handleChange}
                placeholder="অনুরোধকৃত মোট জমার পরিমাণ *"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all text-sm font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Paid Amount Label (টোটাল পেইড কলাম)</label>
              <input 
                name="clientPaymentPaidLabel"
                value={settings.clientPaymentPaidLabel || ''}
                onChange={handleChange}
                placeholder="টোটাল পেইড এমাউন্ট (Paid Amount)"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all text-sm font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Due Amount Label (ডিউ অ্যামাউন্ট কলাম)</label>
              <input 
                name="clientPaymentDueLabel"
                value={settings.clientPaymentDueLabel || ''}
                onChange={handleChange}
                placeholder="টোটাল ডিউ এমাউন্ট (Due Amount)"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all text-sm font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Submit Button Label (সাবমিট বোতামের টেক্সট)</label>
              <input 
                name="clientPaymentSubmitButtonLabel"
                value={settings.clientPaymentSubmitButtonLabel || ''}
                onChange={handleChange}
                placeholder="পেমেন্ট রিকোয়েস্ট সাবমিট করুন (Submit Payment Ticket)"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all text-sm font-medium"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Form Validation Error Message (অপশন ফিলাপ না হলে এরর মেসেজ)
              </label>
              <input 
                name="clientPaymentErrorMessage"
                value={settings.clientPaymentErrorMessage || ''}
                onChange={handleChange}
                placeholder="অনুগ্রহ করে পেমেন্ট করার সকল অপশন এবং প্রয়োজনীয় তথ্য সঠিকভাবে নির্বাচন/পূরণ করুন।"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all text-sm font-medium"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Success Alert Message (সফলভাবে সাবমিট হলে মেসেজ)
              </label>
              <textarea 
                name="clientPaymentSuccessMessage"
                value={settings.clientPaymentSuccessMessage || ''}
                onChange={handleChange}
                rows={2}
                placeholder='পেমেন্ট রিকোয়েস্ট ("{purpose}") এডমিনের কাছে জমা হয়েছে! এডমিন শীঘ্রই এটি ভেরিফাই করে ব্যালেন্স আপডেট করে দেবেন।'
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all text-sm font-medium"
              />
              <p className="text-[10px] text-slate-400 font-medium">💡 ব্যবহার বিধি: <code className="font-mono bg-slate-100 text-indigo-650 px-1 py-0.5 rounded">{"{purpose}"}</code> কোড ব্যবহার করলে এটি স্বয়ংক্রিয়ভাবে ব্যবহারকারীর নির্বাচিত উদ্দেশ্য দ্বারা প্রতিস্থাপিত হবে।</p>
            </div>
          </div>
        </div>

        {/* Payment Approved Notification Customization */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Payment Approved Notification Customization</h2>
              <p className="text-xs text-slate-500">পেমেন্ট অনুমোদন হওয়ার পর গ্রাহককে হোয়াটসঅ্যাপ বা ইমেইলে নোটিফিকেশন পাঠানোর কাস্টম টেমপ্লেট</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">WhatsApp Approval Template (হোয়াটসঅ্যাপ নোটিফিকেশন মেসেজ)</label>
              <textarea 
                name="paymentApproveWaTemplate"
                value={settings.paymentApproveWaTemplate || ''}
                onChange={handleChange}
                rows={5}
                placeholder='আসসালামু আলাইকুম {name}!...'
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all text-sm font-medium font-sans"
              />
              <p className="text-[10px] text-slate-400 font-medium">💡 ডাইনামিক ফিল্ড কোড ব্যবহার করুন: <code className="font-mono bg-slate-100 text-indigo-650 px-1 py-0.5 rounded">{"{name}"}</code>, <code className="font-mono bg-slate-100 text-indigo-650 px-1 py-0.5 rounded">{"{paid}"}</code>, <code className="font-mono bg-slate-100 text-indigo-650 px-1 py-0.5 rounded">{"{due}"}</code>, <code className="font-mono bg-slate-100 text-indigo-650 px-1 py-0.5 rounded">{"{purpose}"}</code>, <code className="font-mono bg-slate-100 text-indigo-650 px-1 py-0.5 rounded">{"{id}"}</code>, <code className="font-mono bg-slate-100 text-indigo-650 px-1 py-0.5 rounded">{"{method}"}</code>, <code className="font-mono bg-slate-100 text-indigo-650 px-1 py-0.5 rounded">{"{txn}"}</code>, <code className="font-mono bg-slate-100 text-indigo-650 px-1 py-0.5 rounded">{"{company}"}</code></p>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Approval Subject (ইমেইল বিষয়/Subject)</label>
              <input 
                name="paymentApproveEmailSubjectTemplate"
                value={settings.paymentApproveEmailSubjectTemplate || ''}
                onChange={handleChange}
                placeholder="🎉 Payment Approved & Receipt Confirmed - {id}"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all text-sm font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Approval Body (ইমেইল বডি মেসেজ)</label>
              <textarea 
                name="paymentApproveEmailBodyTemplate"
                value={settings.paymentApproveEmailBodyTemplate || ''}
                onChange={handleChange}
                rows={6}
                placeholder="আসসালামু আলাইকুম {name}!..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all text-sm font-medium font-sans"
              />
              <p className="text-[10px] text-slate-400 font-medium">💡 ডাইনামিক ফিল্ড কোড ব্যবহার করুন: <code className="font-mono bg-slate-100 text-indigo-650 px-1 py-0.5 rounded">{"{name}"}</code>, <code className="font-mono bg-slate-100 text-indigo-650 px-1 py-0.5 rounded">{"{paid}"}</code>, <code className="font-mono bg-slate-100 text-indigo-650 px-1 py-0.5 rounded">{"{due}"}</code>, <code className="font-mono bg-slate-100 text-indigo-650 px-1 py-0.5 rounded">{"{purpose}"}</code>, <code className="font-mono bg-slate-100 text-indigo-650 px-1 py-0.5 rounded">{"{id}"}</code>, <code className="font-mono bg-slate-100 text-indigo-650 px-1 py-0.5 rounded">{"{method}"}</code>, <code className="font-mono bg-slate-100 text-indigo-650 px-1 py-0.5 rounded">{"{txn}"}</code>, <code className="font-mono bg-slate-100 text-indigo-650 px-1 py-0.5 rounded">{"{company}"}</code></p>
            </div>
          </div>
        </div>

        {/* System Daily Backups Config */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                <Database size={20} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">স্বয়ংক্রিয় দৈনিক ব্যাকআপ (Automatic Daily Backups)</h2>
                <p className="text-xs text-slate-500">Enable automated daily backups of users and invoices data directly to Google Firestore backups collection</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input 
                type="checkbox"
                checked={settings.autoDailyBackupEnabled === true}
                onChange={() => handleToggle('autoDailyBackupEnabled')}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
              <span className="text-[10px] font-bold text-slate-500 ml-1.5">{settings.autoDailyBackupEnabled === true ? 'Enabled' : 'Disabled'}</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="space-y-1">
              <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                যখন এই অপশনটি চালু থাকবে, যেকোনো গ্রাহক বা এডমিন উইন্ডো ওপেন করলে সিস্টেম স্বয়ংক্রিয়ভাবে প্রতিদিন একবার সমস্ত ইউজার প্রোফাইল ও ইনভয়েস ডেটা <code className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-mono text-[10px]">backups</code> ফায়ারস্টোর কালেকশনে নিরাপদে স্টোর করে রাখবে। অফলাইন বা নেটওয়ার্ক সমস্যায় এটি ব্রাউজারের লোকাল-স্টোরেজেও ব্যাকআপ রাখার ব্যবস্থা করে।
              </p>
              {settings.lastBackupDate && (
                <div className="pt-2 flex items-center gap-2 text-xs font-bold text-slate-550">
                  <span className="text-slate-550">সর্বশেষ সফল ব্যাকআপ তারিখ (Last Backup):</span>
                  <span className="font-mono bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-lg text-[10px]">{settings.lastBackupDate}</span>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center justify-center space-y-3">
              <span className="text-[11px] font-bold text-slate-605 uppercase tracking-wider">তাত্ক্ষণিক ব্যাকআপ ইউটিলিটি (Instant Backup Utility)</span>
              <button
                type="button"
                disabled={isBackingUp}
                onClick={handleManualBackup}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs disabled:opacity-50 flex items-center gap-2 active:scale-95 transition-all shadow-md cursor-pointer"
              >
                <RefreshCw size={14} className={isBackingUp ? "animate-spin" : ""} />
                {isBackingUp ? 'ব্যাকআপ নেওয়া হচ্ছে...' : 'তাত্ক্ষণিক ব্যাকআপ নিন (Run Backup Now)'}
              </button>
              
              {backupMessage && (
                <div className={`text-[10px] font-bold px-3 py-1.5 rounded-xl border ${
                  backupType === 'success' 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}>
                  {backupMessage}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Security / Password Change */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600">
              <Lock size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Security Settings</h2>
              <p className="text-xs text-slate-500">Update your administrative credentials</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Password</label>
              <div className="relative">
                <input 
                  type={showPass ? "text" : "password"}
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all text-sm font-medium"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">New Password</label>
              <input 
                type={showPass ? "text" : "password"}
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all text-sm font-medium"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Confirm New Password</label>
              <div className="relative">
                <input 
                  type={showPass ? "text" : "password"}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all text-sm font-medium pr-10"
                />
                <button 
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          {passError && <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest">{passError}</p>}
          {passSuccess && <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Password updated successfully!</p>}
          
          <button 
            type="button"
            onClick={handlePassChange}
            className="px-6 py-2 bg-slate-900 text-white font-bold rounded-lg text-xs hover:bg-black active:scale-95 transition-all shadow-md"
          >
            Update Password
          </button>
        </div>

        <div className="flex justify-end pt-4">
          <button 
            type="submit"
            disabled={isSaving}
            className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl text-sm hover:bg-indigo-700 active:scale-95 transition-all shadow-lg shadow-indigo-200 flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t('saving')}
              </span>
            ) : (
              <>
                <Save size={18} />
                {t('save_changes')}
              </>
            )}
          </button>
        </div>
      </form>

      {/* Floating Scroll Navigators (উপরে এবং নিচে যাওয়ার জন্য দুটি বাটন) */}
      <div className="fixed bottom-6 left-6 flex flex-col gap-3 z-50">
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="p-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-xl shadow-slate-200/50 dark:shadow-none flex items-center justify-center transition-all hover:scale-110 active:scale-95 group focus:ring-4 focus:ring-indigo-200 cursor-pointer border border-indigo-500 ml-2"
          title="Scroll up (উপরে যান)"
        >
          <ArrowUp size={22} className="group-hover:-translate-y-0.5 transition-transform stroke-[2.5px]" />
        </button>
        <button
          type="button"
          onClick={() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' })}
          className="p-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-xl shadow-slate-200/50 dark:shadow-none flex items-center justify-center transition-all hover:scale-110 active:scale-95 group focus:ring-4 focus:ring-indigo-200 cursor-pointer border border-indigo-500 ml-2"
          title="Scroll down (নিচে যান)"
        >
          <ArrowDown size={22} className="group-hover:translate-y-0.5 transition-transform stroke-[2.5px]" />
        </button>
      </div>
    </div>
  );
}
