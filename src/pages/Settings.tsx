import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Globe, Building2, Landmark, FileText, Save, CheckCircle2, Lock, Shield, Eye, EyeOff, Sparkles } from 'lucide-react';
import { CompanySettings } from '../types';
import { useLanguage } from '../lib/language';
import { subscribeToSettings, saveSettings } from '../lib/storage';

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
  appLabel: '',
  decoderLabel: '',
  panelLabel: '',
  userLabel: '',
  sidebarAdminName: 'Master Admin',
  sidebarTitle: 'Amar Apka',
  appVersion: '1.0',

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

  // Default gateway credentials
  bkashNumber: '01718070273',
  bkashEnabled: true,
  nagadNumber: '01718070273',
  nagadEnabled: true,
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
};

export function Settings() {
  const { t } = useLanguage();
  const [settings, setSettings] = useState<CompanySettings>(DEFAULT_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);

  // Password Change State
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPass, setShowPass] = useState(false);
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToSettings((updatedSettings) => {
      setSettings(updatedSettings);
    });
    return () => unsubscribe && unsubscribe();
  }, []);

  const handlePassChange = (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess(false);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPassError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPassError('Password must be at least 6 characters');
      return;
    }

    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setPassSuccess(true);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPassSuccess(false), 3000);
    }, 1000);
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bank Name</label>
              <input 
                name="bankName"
                value={settings.bankName}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all text-sm font-medium"
              />
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
    </div>
  );
}
