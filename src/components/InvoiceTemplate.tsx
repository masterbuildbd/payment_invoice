import React from 'react';
import { CompanySettings, Invoice } from '../types';
import { Mail, Phone, Globe, MapPin, Landmark, FileText, QrCode, CreditCard } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useLanguage } from '../lib/language';

interface InvoiceTemplateProps {
  invoice: Invoice;
  settings: CompanySettings;
  id?: string;
}

export function InvoiceTemplate({ invoice, settings, id }: InvoiceTemplateProps) {
  const { t } = useLanguage();
  const localPayments = ['bKash', 'Nagad', 'Rocket', 'Upay', 'CellFin'];
  const currency = localPayments.includes(invoice.paymentMethod) ? '৳' : '$';

  // Calculate totals
  const subtotal = invoice.amount;
  const tax = 0;
  const discount = 0;
  const grandTotal = subtotal + tax - discount;

  // Generate a verification URL based on the current domain
  const verificationUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/#/verify/${invoice.id}`;

  const elementId = id || `invoice-print-${invoice.id}`;

  return (
    <div id={elementId} className="bg-white w-[794px] min-h-[1123px] mx-auto p-12 relative overflow-hidden flex flex-col" style={{ color: '#1e293b', backgroundColor: '#ffffff', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div className="flex justify-between items-start mb-10">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 flex items-center justify-center">
            {settings.logoUrl ? (
              <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain" crossOrigin="anonymous" />
            ) : (
              <div className="w-full h-full flex items-center justify-center rounded-lg" style={{ backgroundColor: '#2563eb', color: '#ffffff', fontSize: '24px', fontWeight: 900, fontStyle: 'italic' }}>
                 {settings.companyName.charAt(0)}
              </div>
            )}
          </div>
          <div className="border-l-4 pl-4 h-16 flex flex-col justify-center" style={{ borderLeftColor: '#2563eb' }}>
            <h1 className="text-3xl font-black tracking-tight leading-none" style={{ color: '#1e3a8a' }}>{settings.companyName}</h1>
            <p className="text-[10px] font-bold mt-1 uppercase tracking-widest" style={{ color: '#94a3b8' }}>{settings.slogan}</p>
          </div>
        </div>
        <div className="text-right pt-2">
          <h2 className="text-6xl font-black uppercase tracking-tighter" style={{ color: '#1e3a8a', opacity: 0.15 }}>{t('invoices')}</h2>
        </div>
      </div>

      {/* Contact & Invoice To Info */}
      <div className="grid grid-cols-2 gap-12 mb-10 relative">
        <div className="space-y-2 pt-2">
          <div className="flex items-center gap-3 text-[10px] font-bold" style={{ color: '#475569' }}>
            <div className="w-6 h-6 rounded-full flex items-center justify-center border" style={{ backgroundColor: '#eff6ff', borderColor: '#dbeafe', color: '#2563eb' }}>
              <Phone size={12} />
            </div>
            <span>Phone: {settings.phone}</span>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-bold" style={{ color: '#475569' }}>
            <div className="w-6 h-6 rounded-full flex items-center justify-center border" style={{ backgroundColor: '#eff6ff', borderColor: '#dbeafe', color: '#2563eb' }}>
              <Mail size={12} />
            </div>
            <span>Email: {settings.email}</span>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-bold" style={{ color: '#475569' }}>
            <div className="w-6 h-6 rounded-full flex items-center justify-center border" style={{ backgroundColor: '#eff6ff', borderColor: '#dbeafe', color: '#2563eb' }}>
              <Globe size={12} />
            </div>
            <span>Web: {settings.website}</span>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-bold" style={{ color: '#475569' }}>
            <div className="w-6 h-6 rounded-full flex items-center justify-center border" style={{ backgroundColor: '#eff6ff', borderColor: '#dbeafe', color: '#2563eb' }}>
              <MapPin size={12} />
            </div>
            <span>Address: {settings.address}</span>
          </div>
        </div>

        <div>
          <table className="w-full border-collapse border" style={{ borderColor: '#e2e8f0' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc' }}>
                <th colSpan={2} className="px-3 py-2 text-left text-[10px] font-black uppercase tracking-widest border border-b-2 shadow-sm" style={{ color: '#1e3a8a', borderBottomColor: '#2563eb', borderColor: '#e2e8f0' }}>{t('invoice_to')}</th>
              </tr>
            </thead>
            <tbody className="text-[10px] font-bold uppercase" style={{ color: '#475569' }}>
              <tr>
                <td className="px-3 py-1.5 border w-24" style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}>{t('invoice_no')}</td>
                <td className="px-3 py-1.5 border font-black" style={{ borderColor: '#e2e8f0', color: '#2563eb' }}>{invoice.id}</td>
              </tr>
              <tr>
                <td className="px-3 py-1.5 border" style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}>{t('name')}</td>
                <td className="px-3 py-1.5 border" style={{ borderColor: '#e2e8f0' }}>{invoice.customerName}</td>
              </tr>
              <tr>
                <td className="px-3 py-1.5 border" style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}>{t('phone')}</td>
                <td className="px-3 py-1.5 border" style={{ borderColor: '#e2e8f0' }}>{invoice.customerNumber}</td>
              </tr>
              <tr>
                <td className="px-3 py-1.5 border" style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}>{t('date')}</td>
                <td className="px-3 py-1.5 border" style={{ borderColor: '#e2e8f0' }}>{invoice.createdAt.split(' ')[0]}</td>
              </tr>
              <tr>
                <td className="px-3 py-1.5 border" style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}>{t('time') || 'Time'}</td>
                <td className="px-3 py-1.5 border" style={{ borderColor: '#e2e8f0' }}>{invoice.createdAt.split(' ').slice(1).join(' ') || '--:--:--'}</td>
              </tr>
              <tr>
                <td className="px-3 py-1.5 border" style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}>{t('txn_id')}</td>
                <td className="px-3 py-1.5 border" style={{ color: '#2563eb', borderColor: '#e2e8f0' }}>{invoice.transactionId}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Main Table */}
      <div className="flex-1 mb-10">
        <table className="w-full border-collapse">
          <thead>
            <tr style={{ backgroundColor: '#2563eb', color: '#ffffff' }}>
              <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest border" style={{ borderColor: '#60a5fa' }}>{t('sl_no')}</th>
              <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest border" style={{ borderColor: '#60a5fa' }}>{t('item_description')}</th>
              <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest border" style={{ borderColor: '#60a5fa' }}>{t('unit_price')}</th>
              <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest border" style={{ borderColor: '#60a5fa' }}>{t('quantity')}</th>
              <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest border" style={{ borderColor: '#60a5fa' }}>{t('total')}</th>
            </tr>
          </thead>
          <tbody className="text-[10px] font-bold uppercase" style={{ color: '#475569' }}>
            {invoice.items && invoice.items.length > 0 ? (
              invoice.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="px-4 py-2 text-center border" style={{ borderColor: '#e2e8f0' }}>{(idx + 1).toString().padStart(2, '0')}</td>
                  <td className="px-4 py-2 border" style={{ borderColor: '#e2e8f0' }}>{item.description}</td>
                  <td className="px-4 py-2 text-center border" style={{ borderColor: '#e2e8f0' }}>{currency}{item.price.toFixed(2)}</td>
                  <td className="px-4 py-2 text-center border" style={{ borderColor: '#e2e8f0' }}>{item.quantity}</td>
                  <td className="px-4 py-2 text-center border" style={{ color: '#0f172a', borderColor: '#e2e8f0' }}>{currency}{(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-3 text-center border" style={{ borderColor: '#e2e8f0' }}>01</td>
                <td className="px-4 py-3 border" style={{ borderColor: '#e2e8f0' }}>
                  {invoice.type === 'Apps' ? (settings.appLabel || 'Apps') :
                   invoice.type === 'Panel' ? (settings.panelLabel || 'Panels') :
                   invoice.type === 'Decoder' ? (settings.decoderLabel || 'Decoders') :
                   invoice.type === 'User' ? (settings.userLabel || 'Users') :
                   (invoice.type || 'Service Fulfillment')} - {invoice.id}
                </td>
                <td className="px-4 py-3 text-center border" style={{ borderColor: '#e2e8f0' }}>{currency}{invoice.amount.toFixed(2)}</td>
                <td className="px-4 py-3 text-center border" style={{ borderColor: '#e2e8f0' }}>1</td>
                <td className="px-4 py-3 text-center border" style={{ color: '#0f172a', borderColor: '#e2e8f0' }}>{currency}{invoice.amount.toFixed(2)}</td>
              </tr>
            )}
            {/* Fill empty rows */}
            {[...Array(Math.max(0, 8 - (invoice.items?.length || 1)))].map((_, i) => (
              <tr key={`empty-${i}`}>
                <td className="px-4 py-4 border" style={{ borderColor: '#e2e8f0' }}></td>
                <td className="px-4 py-4 border" style={{ borderColor: '#e2e8f0' }}></td>
                <td className="px-4 py-4 border" style={{ borderColor: '#e2e8f0' }}></td>
                <td className="px-4 py-4 border" style={{ borderColor: '#e2e8f0' }}></td>
                <td className="px-4 py-4 border" style={{ borderColor: '#e2e8f0' }}></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="grid grid-cols-2 gap-12 pt-4 relative">
        <div className="space-y-6 relative">
          {/* Professional Official SVG Seal Design - Restored to Previous Position and Sized Down */}
          <div className="absolute top-[-25px] left-[175px] -rotate-[15deg] pointer-events-none opacity-[0.35] z-0 select-none transform scale-[0.85]">
            <svg width="160" height="160" viewBox="0 0 200 200" className="drop-shadow-xl">
              <defs>
                <linearGradient id="stampGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={invoice.status === 'paid' ? '#059669' : '#e11d48'} />
                  <stop offset="100%" stopColor={invoice.status === 'paid' ? '#047857' : '#be123c'} />
                </linearGradient>
              </defs>

              <g>
                <circle cx="100" cy="100" r="94" fill="none" stroke="url(#stampGradient)" strokeWidth="4" />
                <circle cx="100" cy="100" r="86" fill="none" stroke="url(#stampGradient)" strokeWidth="1.5" strokeDasharray="3 1" />
                <circle cx="100" cy="100" r="82" fill="none" stroke="url(#stampGradient)" strokeWidth="1" />
                
                <path id="curveTop" d="M 30,100 A 70,70 0 0,1 170,100" fill="none" />
                <path id="curveBottom" d="M 30,100 A 70,70 0 0,0 170,100" fill="none" />

                <text fill="url(#stampGradient)" style={{ fontSize: '13px', fontWeight: '900', letterSpacing: '5px' }}>
                  <textPath xlinkHref="#curveTop" startOffset="50%" textAnchor="middle">
                    OFFICIAL VERIFIED
                  </textPath>
                </text>

                <text fill="url(#stampGradient)" style={{ fontSize: '11px', fontWeight: '900', letterSpacing: '4px' }}>
                  <textPath xlinkHref="#curveBottom" startOffset="50%" textAnchor="middle">
                    MASTER BUILD BD
                  </textPath>
                </text>

                <path d="M 45 85 L 155 85 L 155 115 Q 100 135 45 115 Z" fill="none" stroke="url(#stampGradient)" strokeWidth="3" />
                
                <text x="100" y="108" textAnchor="middle" fill="url(#stampGradient)" style={{ fontSize: invoice.status === 'paid' ? '28px' : '20px', fontWeight: '1000' }}>
                  {invoice.status.toUpperCase()}
                </text>

                <text x="100" y="150" textAnchor="middle" fill="url(#stampGradient)" style={{ fontSize: '9px', fontWeight: '900' }}>
                  {invoice.createdAt}
                </text>

                <circle cx="28" cy="100" r="3" fill="url(#stampGradient)" />
                <circle cx="172" cy="100" r="3" fill="url(#stampGradient)" />
              </g>
            </svg>
          </div>
          <div className="space-y-2">
            <h3 className="text-[10px] font-black uppercase flex items-center gap-1" style={{ color: '#1e3a8a' }}>
              <Landmark size={12} />
              {t('bank_info')}
            </h3>
            <div className="text-[9px] font-bold uppercase leading-relaxed" style={{ color: '#64748b' }}>
              <p>{t('bank_name')}: <span style={{ color: '#0f172a' }}>{settings.bankName}</span></p>
              <p>{t('branch_name')}: <span style={{ color: '#0f172a' }}>{settings.branchName}</span></p>
              {settings.accountName && <p>Account Name: <span style={{ color: '#0f172a' }}>{settings.accountName}</span></p>}
              <p>{t('account_no')}: <span className="font-mono italic" style={{ color: '#2563eb' }}>{settings.accountNo}</span></p>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-[10px] font-black uppercase flex items-center gap-1" style={{ color: '#1e3a8a' }}>
              <CreditCard size={12} />
              {t('payment_status')}
            </h3>
            <div className="flex gap-2 items-center">
              <div className="px-4 py-1.5 rounded text-[10px] font-black uppercase tracking-widest border" 
                style={invoice.status === 'paid' ? { backgroundColor: '#ecfdf5', color: '#059669', borderColor: '#a7f3d0' } : { backgroundColor: '#fffbeb', color: '#d97706', borderColor: '#fde68a' }}>
                {invoice.status}
              </div>
              <p className="text-[8px] font-bold uppercase tracking-widest" style={{ color: '#94a3b8' }}>Via {invoice.paymentMethod}</p>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-[10px] font-black uppercase" style={{ color: '#1e3a8a' }}>{t('terms_condition')}</h3>
            <p className="text-[9px] font-medium leading-relaxed max-w-sm" style={{ color: '#64748b' }}>
              {settings.terms}
            </p>
          </div>
        </div>

        <div className="space-y-6 flex flex-col items-end">
          <div className="w-full space-y-1">
            <div className="flex justify-between px-4 py-1.5 text-[10px] font-bold border" style={{ borderColor: '#e2e8f0' }}>
              <span className="uppercase" style={{ color: '#94a3b8' }}>{t('sub_total')}</span>
              <span style={{ color: '#0f172a' }}>{currency}{subtotal.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between px-4 py-1.5 text-[10px] font-bold border" style={{ borderColor: '#e2e8f0', backgroundColor: '#ecfdf54d' }}>
              <span className="uppercase" style={{ color: '#059669' }}>{t('paid_amount')}</span>
              <span style={{ color: '#047857' }}>{currency}{(invoice.paidAmount || 0).toFixed(2)}</span>
            </div>

            {(invoice.dueAmount || 0) > 0 && (
              <div className="flex justify-between px-4 py-1.5 text-[10px] font-bold border" style={{ borderColor: '#e2e8f0', backgroundColor: '#fff1f24d' }}>
                <span className="uppercase" style={{ color: '#e11d48' }}>{t('due_balance')}</span>
                <span style={{ color: '#be123c' }}>{currency}{invoice.dueAmount?.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between px-4 py-3 border" style={{ backgroundColor: '#2563eb', borderColor: '#1d4ed8', color: '#ffffff' }}>
              <span className="text-[12px] font-black uppercase tracking-widest">{t('grand_total')}</span>
              <span className="text-lg font-black">{currency}{grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex items-center gap-8 pt-12 w-full justify-end">
            {/* Secure Verification QR Code */}
            <div className="flex flex-col items-center gap-1.5 p-2 border rounded-xl" style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}>
              <QRCodeSVG 
                value={verificationUrl} 
                size={56} 
                level="H" 
                fgColor="#1e3a8a"
              />
              <span className="text-[7px] font-black uppercase tracking-tighter" style={{ color: '#1e3a8a' }}>{t('scan_to_verify')}</span>
            </div>

            <div className="w-48 text-center relative flex flex-col items-center">
              <div className="mb-2 font-cursive text-3xl italic text-black select-none pb-1 h-10 flex items-end justify-center" style={{ color: '#000000' }}>
                {settings.signatureText || 'Manager'}
              </div>
              <div className="h-px bg-slate-300 w-full mb-1" style={{ backgroundColor: '#cbd5e1' }}></div>
              <p className="text-[10px] font-black uppercase" style={{ color: '#1e3a8a' }}>{settings.signatureName || 'Authorized Manager'}</p>
              <p className="text-[8px] font-bold uppercase tracking-widest" style={{ color: '#94a3b8' }}>{settings.companyName}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t text-center" style={{ borderTopColor: '#f1f5f9' }}>
        <p className="text-[11px] font-black italic tracking-wider" style={{ color: '#1e3a8a' }}>{t('thank_you')}</p>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-4" style={{ backgroundColor: '#2563eb' }}></div>
    </div>
  );
}
