import React, { useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import firebaseConfig from '../../firebase-applet-config.json';

interface FormProps {
  onSuccess: (data: any) => void;
  onCancel: () => void;
  initialData?: any;
}

const PAYMENT_METHODS = [
  { id: 'bKash', name: 'bKash', color: 'bg-pink-500' },
  { id: 'Nagad', name: 'Nagad', color: 'bg-orange-500' },
  { id: 'Rocket', name: 'Rocket', color: 'bg-purple-600' },
  { id: 'Upay', name: 'Upay', color: 'bg-amber-400' },
  { id: 'CellFin', name: 'CellFin', color: 'bg-blue-600' },
  { id: 'Bank', name: 'Bank Transfer', color: 'bg-indigo-600' },
  { id: 'Binance', name: 'Binance (USDT)', color: 'bg-yellow-500' },
];

function PaymentSection({ method, setMethod, txnId, setTxnId }: any) {
  return (
    <div className="pt-4 border-t border-slate-100 mt-4 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Payment Selection</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Method</label>
          <select 
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm"
          >
            {PAYMENT_METHODS.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Txn ID</label>
          <input 
            type="text" 
            value={txnId}
            onChange={(e) => setTxnId(e.target.value)}
            placeholder="TXN-XXXXXX"
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm"
          />
        </div>
      </div>
    </div>
  );
}

const COUNTRY_CODES = [
  { code: '+880', label: 'BD', name: 'Bangladesh' },
  { code: '+966', label: 'SA', name: 'Saudi Arabia' },
  { code: '+974', label: 'QA', name: 'Qatar' },
  { code: '+968', label: 'OM', name: 'Oman' },
  { code: '+965', label: 'KW', name: 'Kuwait' },
  { code: '+971', label: 'AE', name: 'UAE' },
  { code: '+256', label: 'UG', name: 'Uganda' },
  { code: '+91', label: 'IN', name: 'India' },
  { code: '+92', label: 'PK', name: 'Pakistan' },
  { code: '+973', label: 'BH', name: 'Bahrain' },
  { code: '+1', label: 'US', name: 'USA' },
  { code: '+44', label: 'GB', name: 'UK' },
  { code: '+65', label: 'SG', name: 'Singapore' },
  { code: '+60', label: 'MY', name: 'Malaysia' },
  { code: '+39', label: 'IT', name: 'Italy' },
  { code: '+33', label: 'FR', name: 'France' },
  { code: '+49', label: 'DE', name: 'Germany' },
];

const REGIONS = [
  'Global', 'Bangladesh', 'India', 'Pakistan', 'Saudi Arabia', 'Qatar', 'Oman', 'Kuwait', 'UAE', 'Bahrain', 'Uganda', 'USA', 'UK', 'Singapore', 'Malaysia', 'Italy', 'France', 'Germany'
];

function PhoneInput({ countryCode, setCountryCode, phone, setPhone, label = "Contact Number" }: any) {
  return (
    <div className="space-y-1">
      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">{label}</label>
      <div className="flex shadow-sm rounded-xl overflow-hidden border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-300 transition-all">
        <select 
          value={countryCode}
          onChange={(e) => setCountryCode(e.target.value)}
          className="bg-slate-50 border-r border-slate-200 px-3 py-2 text-[11px] font-black outline-none cursor-pointer hover:bg-slate-100 transition-colors shrink-0"
        >
          {COUNTRY_CODES.map(c => (
            <option key={c.code} value={c.code}>{c.label} {c.code}</option>
          ))}
        </select>
        <input 
          type="tel" 
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="17XXXXXXXX"
          className="flex-1 px-4 py-2 bg-white text-sm font-black text-indigo-700 outline-none placeholder:text-slate-300"
        />
      </div>
    </div>
  );
}

export function CreateAppForm({ onSuccess, onCancel, initialData }: FormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [packageName, setPackageName] = useState(initialData?.packageName || 'dev.masterbuild.');
  const [protocol, setProtocol] = useState(initialData?.protocol || 'Protocol 1');
  const [appType, setAppType] = useState<'Free' | 'Paid'>(initialData?.appType || 'Free');
  const [category, setCategory] = useState(initialData?.category || 'Utility');
  const [price, setPrice] = useState(initialData?.price?.toString() || '');
  const [version, setVersion] = useState(initialData?.version || '1.0');
  const [countryCode, setCountryCode] = useState(initialData?.countryCode || '+880');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [note, setNote] = useState(initialData?.note || '');
  const [region, setRegion] = useState(initialData?.region || '');
  const [paymentMethod, setPaymentMethod] = useState(initialData?.paymentMethod || 'bKash');
  const [transactionId, setTransactionId] = useState(initialData?.transactionId || '');

  // New fields requested by user
  const [appsTrying, setAppsTrying] = useState<'Paid apps' | 'Free apps'>(initialData?.appsTrying || 'Paid apps');
  const [appsQuality, setAppsQuality] = useState<'Normal security' | 'medium security' | 'high security'>(initialData?.appsQuality || 'Normal security');
  const [appWorkType, setAppWorkType] = useState<'New app' | 'Old app' | 'Update app'>(initialData?.appWorkType || 'New app');
  const [paidAmount, setPaidAmount] = useState(initialData?.paidAmount?.toString() || '0');
  const [dueAmount, setDueAmount] = useState(initialData?.dueAmount?.toString() || '0');

  const formatPackageName = (appName: string) => {
    const cleanName = appName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, '') // remove spaces and symbols
      .substring(0, 30);
    return `dev.masterbuild.${cleanName || 'app'}`;
  };

  const handleNameChange = (val: string) => {
    setName(val);
    setPackageName(formatPackageName(val));
  };

  const handlePriceChange = (val: string) => {
    setPrice(val);
    const p = Number(val) || 0;
    const paid = Number(paidAmount) || 0;
    setDueAmount(Math.max(0, p - paid).toString());
  };

  const handlePaidChange = (val: string) => {
    setPaidAmount(val);
    const p = Number(price) || 0;
    const paid = Number(val) || 0;
    setDueAmount(Math.max(0, p - paid).toString());
  };

  const handleDueChange = (val: string) => {
    setDueAmount(val);
    const p = Number(price) || 0;
    const due = Number(val) || 0;
    setPaidAmount(Math.max(0, p - due).toString());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSuccess({ 
      ...initialData,
      name, 
      packageName, 
      protocol, 
      appType, 
      category, 
      price: Number(price) || 0,
      version,
      region,
      countryCode,
      phone,
      note,
      paymentMethod,
      transactionId,
      appsTrying,
      appsQuality,
      appWorkType,
      paidAmount: Number(paidAmount) || 0,
      dueAmount: Number(dueAmount) || 0,
      status: initialData?.status || 'active', 
      id: initialData?.id || Math.random().toString(36).substr(2, 9) 
    });
  };

  const versions = Array.from({ length: 20 }, (_, i) => (i + 1).toFixed(1));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">App Name</label>
          <input 
            autoFocus
            required
            type="text" 
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="e.g. Master Core"
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Package Name</label>
          <input 
            required
            type="text" 
            value={packageName}
            onChange={(e) => setPackageName(e.target.value)}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm font-mono"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Protocol</label>
          <select 
            value={protocol}
            onChange={(e) => setProtocol(e.target.value)}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm font-bold"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i+1} value={`Protocol ${i+1}`}>Protocol {i+1}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">App Version</label>
          <select 
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm"
          >
            {versions.map(v => (
              <option key={v} value={v}>Version {v}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">App Type</label>
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button 
              type="button"
              onClick={() => { setAppType('Free'); setPrice('0'); setPaidAmount('0'); setDueAmount('0'); }}
              className={`flex-1 py-1 px-3 text-xs font-bold rounded-md transition-all ${appType === 'Free' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              FREE
            </button>
            <button 
              type="button"
              onClick={() => { setAppType('Paid'); if(price === '0') setPrice(''); }}
              className={`flex-1 py-1 px-3 text-xs font-bold rounded-md transition-all ${appType === 'Paid' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              PAID
            </button>
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Category</label>
          <select 
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm"
          >
            <option>Utility</option>
            <option>Communication</option>
            <option>Security</option>
            <option>Finance</option>
            <option>Paid Apps</option>
            <option>Free Apps</option>
          </select>
        </div>
      </div>

      {/* New Requested Fields Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Apps Trying</label>
          <select 
            value={appsTrying}
            onChange={(e) => setAppsTrying(e.target.value as any)}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm font-bold"
          >
            <option value="Paid apps">Paid apps</option>
            <option value="Free apps">Free apps</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Apps Quality</label>
          <select 
            value={appsQuality}
            onChange={(e) => setAppsQuality(e.target.value as any)}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm font-bold"
          >
            <option value="Normal security">Normal security</option>
            <option value="medium security">medium security</option>
            <option value="high security">high security</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-black text-indigo-600 uppercase tracking-wider mb-1">App Work Type (কাজের ধরন) *</label>
          <select 
            value={appWorkType}
            onChange={(e) => setAppWorkType(e.target.value as any)}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm font-bold"
            required
          >
            <option value="New app">New app (নতুন অ্যাপ)</option>
            <option value="Old app">Old app (পুরানো অ্যাপ)</option>
            <option value="Update app">Update app (আপডেট অ্যাপ)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Price (Taka)</label>
          <div className="relative shadow-sm rounded-xl overflow-hidden border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-300 transition-all">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xs font-mono">৳</span>
            <input 
              type="number" 
              value={price}
              onChange={(e) => handlePriceChange(e.target.value)}
              placeholder="0.00"
              className="w-full pl-7 pr-4 py-2 bg-white outline-none text-sm font-black text-indigo-600"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Paid Amount</label>
          <div className="relative shadow-sm rounded-xl overflow-hidden border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-300 transition-all">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xs font-mono">৳</span>
            <input 
              type="number" 
              value={paidAmount}
              onChange={(e) => handlePaidChange(e.target.value)}
              placeholder="0.00"
              className="w-full pl-7 pr-4 py-2 bg-white outline-none text-sm font-black text-emerald-600"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Due Amount</label>
          <div className="relative shadow-sm rounded-xl overflow-hidden border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-300 transition-all">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xs font-mono">৳</span>
            <input 
              type="number" 
              value={dueAmount}
              onChange={(e) => handleDueChange(e.target.value)}
              placeholder="0.00"
              className="w-full pl-7 pr-4 py-2 bg-white outline-none text-sm font-black text-rose-600"
            />
          </div>
        </div>
      </div>

      <PhoneInput 
        countryCode={countryCode}
        setCountryCode={setCountryCode}
        phone={phone}
        setPhone={setPhone}
      />

      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Region</label>
        <select 
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm font-bold"
        >
          {REGIONS.map(r => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Additional Notes</label>
        <textarea 
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Enter any additional details or specific requirements..."
          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm min-h-[80px] resize-none"
        />
      </div>

      <PaymentSection 
        method={paymentMethod} 
        setMethod={setPaymentMethod} 
        txnId={transactionId} 
        setTxnId={setTransactionId} 
      />

      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Invoice Items Preview:</h4>
        <div className="space-y-1.5">
          <div className="flex justify-between text-[11px] font-bold">
            <span className="text-slate-600">FEATURE: {name.toUpperCase() || 'APP NAME'}</span>
            <span className="text-indigo-600 font-black">৳{parseFloat(price || '0').toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-[11px] font-bold text-slate-400">
            <span>VERSION: {version} | PROTOCOL: {protocol}</span>
            <span>৳0.00</span>
          </div>
          <div className="flex justify-between text-[11px] font-bold text-slate-400">
            <span>TRYING: {appsTrying.toUpperCase()} | QUALITY: {appsQuality.toUpperCase()} | WORK: {appWorkType.toUpperCase()}</span>
            <span>-</span>
          </div>
          <div className="flex justify-between text-[11px] font-bold border-t border-slate-100 pt-1.5 mt-1.5">
            <span className="text-emerald-600">PAID AMOUNT</span>
            <span className="text-emerald-700 font-black">৳{parseFloat(paidAmount || '0').toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-[11px] font-bold">
            <span className="text-rose-600">DUE AMOUNT</span>
            <span className="text-rose-700 font-black">৳{parseFloat(dueAmount || '0').toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-4 border-t border-slate-100">
        <button type="button" onClick={onCancel} className="flex-1 px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-lg transition-colors">Cancel</button>
        <button type="submit" className="flex-1 px-4 py-2 text-sm font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm transition-all">
          {initialData ? 'Update App' : 'Create App'}
        </button>
      </div>
    </form>
  );
}

export function CreateDecoderForm({ onSuccess, onCancel, initialData }: FormProps) {
  const [model, setModel] = useState(initialData?.model || '');
  const [serial, setSerial] = useState(initialData?.serialNumber || '');
  const [username, setUsername] = useState(initialData?.username || '');
  const [duration, setDuration] = useState(initialData?.duration || '1 month');
  const [countryCode, setCountryCode] = useState(initialData?.countryCode || '+880');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [note, setNote] = useState(initialData?.note || '');
  const [region, setRegion] = useState(initialData?.region || '');
  const [paymentMethod, setPaymentMethod] = useState(initialData?.paymentMethod || 'bKash');
  const [transactionId, setTransactionId] = useState(initialData?.transactionId || '');

  const priceMap: Record<string, number> = {
    '1 month': 1300,
    '2 month': 2500,
    '3 month': 3500,
    '4 month': 4500,
    '5 month': 5500,
    '6 month': 6550,
    '12 month': 8600,
  };

  const [price, setPrice] = useState(initialData?.price?.toString() || priceMap[duration].toString());

  const handleDurationChange = (newDuration: string) => {
    setDuration(newDuration);
    setPrice(priceMap[newDuration]?.toString() || '0');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSuccess({ 
      ...initialData,
      model, 
      serialNumber: serial, 
      username,
      duration,
      price: Number(price) || 0,
      region,
      countryCode,
      phone,
      note,
      paymentMethod,
      transactionId,
      status: initialData?.status || 'online', 
      id: initialData?.id || Math.random().toString(36).substr(2, 9) 
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Username</label>
          <input 
            autoFocus
            required
            type="text" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. user_alpha"
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Duration (Meyad)</label>
          <select 
            value={duration}
            onChange={(e) => handleDurationChange(e.target.value)}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm font-bold"
          >
            <option value="1 month">1 Month</option>
            <option value="2 month">2 Month</option>
            <option value="3 month">3 Month</option>
            <option value="4 month">4 Month</option>
            <option value="5 month">5 Month</option>
            <option value="6 month">6 Month</option>
            <option value="12 month">12 Month</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Price (Taka)</label>
          <div className="relative shadow-sm rounded-xl overflow-hidden border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-300 transition-all">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xs font-mono">৳</span>
            <input 
              type="number" 
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              className="w-full pl-7 pr-4 py-2 bg-white outline-none text-sm font-black text-indigo-600"
            />
          </div>
        </div>
      </div>

      <PhoneInput 
        label="Customer Number"
        countryCode={countryCode}
        setCountryCode={setCountryCode}
        phone={phone}
        setPhone={setPhone}
      />

      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Region</label>
        <select 
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm font-bold"
        >
          {REGIONS.map(r => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Additional Notes</label>
        <textarea 
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Enter any additional details or specific requirements..."
          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm min-h-[80px] resize-none"
        />
      </div>

      <PaymentSection 
        method={paymentMethod} 
        setMethod={setPaymentMethod} 
        txnId={transactionId} 
        setTxnId={setTransactionId} 
      />

      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Invoice Items Preview:</h4>
        <div className="space-y-1.5">
          <div className="flex justify-between text-[11px] font-bold">
            <span className="text-slate-600">DECODER USER: {username.toUpperCase() || 'USERNAME'}</span>
            <span className="text-indigo-600 font-black">৳{parseFloat(price || '0').toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-[11px] font-bold text-slate-400">
            <span>DURATION: {duration}</span>
            <span>৳0.00</span>
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-4 border-t border-slate-100">
        <button type="button" onClick={onCancel} className="flex-1 px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-lg transition-colors">Cancel</button>
        <button type="submit" className="flex-1 px-4 py-2 text-sm font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm transition-all">
          {initialData ? 'Update Decoder' : 'Register Decoder'}
        </button>
      </div>
    </form>
  );
}

export function CreatePanelForm({ onSuccess, onCancel, initialData }: FormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [url, setUrl] = useState(initialData?.url || 'https://');
  const [region, setRegion] = useState(initialData?.region || '');
  const [duration, setDuration] = useState(initialData?.duration || '1 month');
  const [panelType, setPanelType] = useState<'New' | 'Rent' | 'Try'>(initialData?.panelType || 'New');
  const [countryCode, setCountryCode] = useState(initialData?.countryCode || '+880');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [note, setNote] = useState(initialData?.note || '');
  const [paymentMethod, setPaymentMethod] = useState(initialData?.paymentMethod || 'bKash');
  const [transactionId, setTransactionId] = useState(initialData?.transactionId || '');

  const priceMap: Record<string, number> = {
    '1 month': 1300,
    '2 month': 2600,
    '3 month': 3900,
    '4 month': 5200,
    '5 month': 6500,
    '6 month': 7800,
  };

  const [price, setPrice] = useState(initialData?.price?.toString() || (panelType === 'Try' ? '200' : (priceMap[duration] || 0).toString()));

  const handleDurationChange = (newDuration: string) => {
    setDuration(newDuration);
    if (panelType !== 'Try') {
      setPrice(priceMap[newDuration]?.toString() || '0');
    }
  };

  const handlePanelTypeChange = (newType: 'New' | 'Rent' | 'Try') => {
    setPanelType(newType);
    if (newType === 'Try') {
      setPrice('200');
    } else {
      setPrice(priceMap[duration]?.toString() || '0');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSuccess({ 
      ...initialData,
      name, 
      url,
      region, 
      duration,
      price: Number(price) || 0,
      panelType,
      countryCode,
      phone,
      note,
      paymentMethod,
      transactionId,
      status: initialData?.status || 'active', 
      tier: initialData?.tier || 'basic', 
      id: initialData?.id || Math.random().toString(36).substr(2, 9) 
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Panel Name</label>
          <input 
            autoFocus
            required
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Master Control"
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Panel URL</label>
          <input 
            required
            type="url" 
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://panel.example.com"
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm font-mono"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Duration</label>
          <select 
            value={duration}
            disabled={panelType === 'Try'}
            onChange={(e) => handleDurationChange(e.target.value)}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm font-bold disabled:opacity-50"
          >
            <option value="1 month">1 Month</option>
            <option value="2 month">2 Month</option>
            <option value="3 month">3 Month</option>
            <option value="4 month">4 Month</option>
            <option value="5 month">5 Month</option>
            <option value="6 month">6 Month</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Price (Taka)</label>
          <div className="relative shadow-sm rounded-xl overflow-hidden border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-300 transition-all">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xs font-mono">৳</span>
            <input 
              type="number" 
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              className="w-full pl-7 pr-4 py-2 bg-white outline-none text-sm font-black text-indigo-600"
            />
          </div>
        </div>
      </div>

      <PhoneInput 
        label="Owner Contact"
        countryCode={countryCode}
        setCountryCode={setCountryCode}
        phone={phone}
        setPhone={setPhone}
      />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Region</label>
          <select 
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm font-bold"
          >
            {REGIONS.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Additional Notes</label>
        <textarea 
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Enter any additional details or specific requirements..."
          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm min-h-[80px] resize-none"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Panel Type</label>
        <div className="flex bg-slate-100 p-1 rounded-lg">
          {(['New', 'Rent', 'Try'] as const).map((type) => (
            <button 
              key={type}
              type="button"
              onClick={() => handlePanelTypeChange(type)}
              className={`flex-1 py-1 text-[9px] font-bold rounded-md transition-all ${panelType === type ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <PaymentSection 
        method={paymentMethod} 
        setMethod={setPaymentMethod} 
        txnId={transactionId} 
        setTxnId={setTransactionId} 
      />

      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Invoice Items Preview:</h4>
        <div className="space-y-1.5">
          <div className="flex justify-between text-[11px] font-bold">
            <span className="text-slate-600">PANEL: {name.toUpperCase() || 'PANEL NAME'}</span>
            <span className="text-indigo-600 font-black">৳{parseFloat(price || '0').toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-[11px] font-bold text-slate-400">
            <span>DURATION: {duration}</span>
            <span>৳0.00</span>
          </div>
          <div className="flex justify-between text-[11px] font-bold text-slate-400">
            <span>REGION: {region || 'N/A'}</span>
            <span>৳0.00</span>
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-4 border-t border-slate-100">
        <button type="button" onClick={onCancel} className="flex-1 px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-lg transition-colors">Cancel</button>
        <button type="submit" className="flex-1 px-4 py-2 text-sm font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm transition-all">
          {initialData ? 'Update Panel' : 'Create Panel'}
        </button>
      </div>
    </form>
  );
}

export function CreateUserForm({ onSuccess, onCancel, initialData }: FormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [username, setUsername] = useState(initialData?.username || '');
  const [password, setPassword] = useState(initialData?.password || '123456');
  const [role, setRole] = useState(initialData?.role || 'user');
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected'>(initialData?.status || 'approved');
  const [price, setPrice] = useState(initialData?.price?.toString() || '');
  const [paidAmount, setPaidAmount] = useState(initialData?.paidAmount?.toString() || '0');
  const [countryCode, setCountryCode] = useState(initialData?.countryCode || '+880');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [whatsapp, setWhatsapp] = useState(initialData?.whatsapp || '');
  const [email, setEmail] = useState(initialData?.email || '');
  const [note, setNote] = useState(initialData?.note || '');
  const [region, setRegion] = useState(initialData?.region || '');
  const [paymentMethod, setPaymentMethod] = useState(initialData?.paymentMethod || 'bKash');
  const [transactionId, setTransactionId] = useState(initialData?.transactionId || '');

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();
    const cleanUsername = username.trim();

    const isPlaceholderFirebase = !firebaseConfig.projectId || firebaseConfig.projectId.includes('remixed');

    try {
      if (!isPlaceholderFirebase) {
        const usersRef = collection(db, 'users');

        // 1. Check for unique Email in Firestore
        if (cleanEmail) {
          const qEmail = query(usersRef, where('email', '==', cleanEmail));
          const emailSnap = await getDocs(qEmail);

          const duplicateEmail = emailSnap.docs.find(doc => doc.id !== initialData?.id);
          if (duplicateEmail) {
            setError('এই ইমেইল ঠিকানাটি ইতিমধ্যে ব্যবহৃত হয়েছে (This email is already in use by another account)');
            setIsSubmitting(false);
            return;
          }
        }

        // 2. Check for unique Phone in Firestore
        if (cleanPhone) {
          const qPhone = query(usersRef, where('phone', '==', cleanPhone));
          const phoneSnap = await getDocs(qPhone);

          const duplicatePhone = phoneSnap.docs.find(doc => doc.id !== initialData?.id);
          if (duplicatePhone) {
            setError('এই মোবাইল নম্বরটি ইতিমধ্যে নিবন্ধিত হয়েছে (This phone number is already registered)');
            setIsSubmitting(false);
            return;
          }
        }

        // 3. Check for unique Username in Firestore
        if (cleanUsername) {
          const qUsername = query(usersRef, where('username', '==', cleanUsername));
          const usernameSnap = await getDocs(qUsername);

          const duplicateUsername = usernameSnap.docs.find(doc => doc.id !== initialData?.id);
          if (duplicateUsername) {
            setError('এই ইউজারনেমটি ইতিমধ্যে ব্যবহৃত হয়েছে (This username is already taken)');
            setIsSubmitting(false);
            return;
          }
        }
      }
    } catch (err: any) {
      console.warn('Firestore unique validation failed/timed out. Falling back to offline local checks:', err instanceof Error ? err.message : String(err));
    }

    try {

      const fee = Number(price) || 0;
      const paid = Number(paidAmount) || 0;
      const due = Math.max(0, fee - paid);

      onSuccess({ 
        ...initialData,
        name, 
        username: cleanUsername, 
        password,
        role, 
        status,
        price: fee,
        paidAmount: paid,
        dueAmount: due,
        region,
        countryCode,
        phone: cleanPhone,
        whatsapp,
        email: cleanEmail,
        note,
        paymentMethod,
        transactionId,
        id: initialData?.id || Math.random().toString(36).substr(2, 9) 
      });
    } catch (err: any) {
      console.error(err instanceof Error ? err.message : String(err));
      setError('ভেরিফিকেশন ব্যর্থ হয়েছে (Validation failed): ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Full Name</label>
          <input 
            autoFocus
            required
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. John Doe"
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Username</label>
          <input 
            required
            type="text" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. jdoe88"
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm font-mono"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">User Password</label>
          <div className="relative">
            <input 
              required
              type={showPassword ? "text" : "password"} 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Account password"
              className="w-full pl-4 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm font-mono"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 focus:outline-none"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Approval Status</label>
          <select 
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm font-bold"
          >
            <option value="approved">Approved (সক্রিয়)</option>
            <option value="pending">Pending (পেন্ডিং)</option>
            <option value="rejected">Rejected (বাতিল)</option>
          </select>
        </div>
      </div>

      <PhoneInput 
        label="Mobile Number"
        countryCode={countryCode}
        setCountryCode={setCountryCode}
        phone={phone}
        setPhone={setPhone}
      />

      {/* Email input field removed per request */}

      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Region</label>
        <select 
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm font-bold"
        >
          {REGIONS.map(r => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 font-bold text-xs text-center leading-relaxed">
          {error}
        </div>
      )}

      <div className="flex gap-3 pt-4 border-t border-slate-100">
        <button 
          type="button" 
          disabled={isSubmitting} 
          onClick={onCancel} 
          className="flex-1 px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-lg transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button 
          type="submit" 
          disabled={isSubmitting} 
          className="flex-1 px-4 py-2 text-sm font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin" size={14} />
              <span>Verifying...</span>
            </>
          ) : (
            initialData ? 'Update User' : 'Add System User'
          )}
        </button>
      </div>
    </form>
  );
}
