import React, { useState, useEffect } from 'react';
import { Plus, Search, MoreHorizontal, Download, Trash2, Edit3, ArrowDownCircle, Printer, X, Eye, FileText } from 'lucide-react';
import { Invoice, CompanySettings } from '../types';
import { Modal } from '../components/Modal';
import { InvoiceTemplate } from '../components/InvoiceTemplate';
import { useAuth } from '../lib/auth';
import { useLanguage } from '../lib/language';
import { getInvoicesSync, subscribeToInvoices, createInvoice, updateInvoice, deleteInvoice, subscribeToCollection, subscribeToSettings } from '../lib/storage';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { toPng } from 'html-to-image';

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
  signatureName: 'Authorized Manager',
  signatureText: 'Manager'
};

const mockAppsData = [
  { id: 'app_1', name: 'Global Messenger', price: 1200 },
  { id: 'app_2', name: 'Data Guardian', price: 1800 },
  { id: 'app_3', name: 'Asset Tracker', price: 950 },
  { id: 'app_4', name: 'Master Connect', price: 2200 },
];

const mockPanelsData = [
  { id: 'p_1', name: 'Reseller Alpha', price: 1500 },
  { id: 'p_2', name: 'Admin Dashboard Pro', price: 5000 },
  { id: 'p_3', name: 'Reseller Premium', price: 3500 },
  { id: 'p_4', name: 'Developer API Access', price: 7500 },
];

const mockDecodersData = [
  { id: 'd_1', username: 'admin_user', model: 'HD-100', price: 1300 },
  { id: 'd_2', username: 'tech_support', model: 'ULTRA-X', price: 2500 },
  { id: 'd_3', username: 'pro_streamer', model: 'MAX-DECO', price: 4200 },
];

const mockUsersData = [
  { id: 'u_1', name: 'Foysal Ahmed', price: 1000 },
  { id: 'u_2', name: 'John Doe', price: 1500 },
  { id: 'u_3', name: 'Mustafa Ali', price: 800 },
];

const mockInvoices: Invoice[] = [
  { id: 'INV-001', customerName: 'Apex Corp', customerNumber: '+256 701 234 567', paymentMethod: 'bKash', transactionId: 'TXN-882194', amount: 1540.00, paidAmount: 1540.00, dueAmount: 0, status: 'paid', createdAt: '2024-05-01', items: [], cashierName: 'Master Admin', type: 'Apps' },
  { id: 'INV-002', customerName: 'Luminary Systems', customerNumber: '+256 782 990 112', paymentMethod: 'Binance', transactionId: '0x882...91a', amount: 890.50, paidAmount: 0, dueAmount: 890.50, status: 'pending', createdAt: '2024-05-03', items: [], cashierName: 'Master Admin', type: 'Panel' },
  { id: 'INV-003', customerName: 'Zenith Ventures', customerNumber: '+256 750 443 221', paymentMethod: 'PayPal', transactionId: 'PAY-882199', amount: 2100.00, paidAmount: 1000.00, dueAmount: 1100.00, status: 'overdue', createdAt: '2024-04-20', items: [], cashierName: 'Master Admin', type: 'Apps' },
  { id: 'INV-004', customerName: 'Nova Retail', customerNumber: '+256 702 334 556', paymentMethod: 'Nagad', transactionId: 'TXN-991122', amount: 450.00, paidAmount: 450.00, dueAmount: 0, status: 'paid', createdAt: '2024-05-05', items: [], cashierName: 'Master Admin', type: 'User' },
];

interface InvoicesProps {
  initialStatusFilter?: 'all' | 'unpaid' | 'paid' | 'pending' | 'overdue';
}

const REGIONS = [
  'Global', 'Bangladesh', 'India', 'Pakistan', 'Saudi Arabia', 'Qatar', 'Oman', 'Kuwait', 'UAE', 'Bahrain', 'Uganda', 'USA', 'UK', 'Singapore', 'Malaysia', 'Italy', 'France', 'Germany'
];

export function Invoices({ initialStatusFilter = 'all' }: InvoicesProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [showCreate, setShowCreate] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [appsData, setAppsData] = useState<any[]>(mockAppsData);
  const [panelsData, setPanelsData] = useState<any[]>(mockPanelsData);
  const [decodersData, setDecodersData] = useState<any[]>(mockDecodersData);
  const [usersData, setUsersData] = useState<any[]>(mockUsersData);

  useEffect(() => {
    const unsubInvoices = subscribeToInvoices((updatedInvoices) => {
      const sorted = [...updatedInvoices].sort((a, b) => {
        const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        return bTime - aTime;
      });
      setInvoices(sorted);
    });

    const unsubApps = subscribeToCollection<any>('apps', (data) => {
      setAppsData(data.length > 0 ? data : mockAppsData);
    }, 'name');

    const unsubPanels = subscribeToCollection<any>('panels', (data) => {
      setPanelsData(data.length > 0 ? data : mockPanelsData);
    }, 'name');

    const unsubDecoders = subscribeToCollection<any>('decoders', (data) => {
      setDecodersData(data.length > 0 ? data : mockDecodersData);
    }, 'serialNumber');

    const unsubUsers = subscribeToCollection<any>('users', (data) => {
      setUsersData(data.length > 0 ? data : mockUsersData);
    }, 'name');

    const unsubSettings = subscribeToSettings((updatedSettings) => {
      setCompanySettings(updatedSettings as CompanySettings);
    });

    return () => {
      unsubInvoices && unsubInvoices();
      unsubApps && unsubApps();
      unsubPanels && unsubPanels();
      unsubDecoders && unsubDecoders();
      unsubUsers && unsubUsers();
      unsubSettings && unsubSettings();
    };
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unpaid' | 'paid' | 'pending' | 'overdue'>(initialStatusFilter);
  const [companySettings, setCompanySettings] = useState<CompanySettings>(DEFAULT_SETTINGS);

  // Form states
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [customerName, setCustomerName] = useState('');
  const [countryCode, setCountryCode] = useState('+880');
  const [customerNumber, setCustomerNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bKash');
  const [transactionId, setTransactionId] = useState('');
  const [amount, setAmount] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [dueAmount, setDueAmount] = useState('');
  const [cashierName, setCashierName] = useState(user?.name || '');
  const [invoiceType, setInvoiceType] = useState('Apps');
  const [items, setItems] = useState<{ description: string; quantity: number; price: number }[]>([]);
  const [importSource, setImportSource] = useState<'none' | 'app' | 'panel' | 'decoder' | 'user'>('none');
  const [importId, setImportId] = useState('');
  const [note, setNote] = useState('');
  const [region, setRegion] = useState('');

  // Preview state
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('company_settings');
    if (saved) {
      try {
        setCompanySettings(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse settings', e);
      }
    }
  }, []);

  const countries = [
    { code: '+880', name: 'BD', flag: '🇧🇩' },
    { code: '+968', name: 'OM', flag: '🇴🇲' },
    { code: '+965', name: 'KW', flag: '🇰🇼' },
    { code: '+974', name: 'QA', flag: '🇶🇦' },
    { code: '+966', name: 'SA', flag: '🇸🇦' },
    { code: '+971', name: 'AE', flag: '🇦🇪' },
    { code: '+973', name: 'BH', flag: '🇧🇭' },
    { code: '+60', name: 'MY', flag: '🇲🇾' },
    { code: '+256', name: 'UG', flag: '🇺🇬' },
    { code: '+1', name: 'US', flag: '🇺🇸' },
    { code: '+44', name: 'UK', flag: '🇬🇧' },
    { code: '+91', name: 'IN', flag: '🇮🇳' },
  ];

  const localPayments = ['bKash', 'Nagad', 'Rocket', 'Upay', 'CellFin', 'Bank', 'Binance'];
  const isTaka = ['bKash', 'Nagad', 'Rocket', 'Upay', 'CellFin'].includes(paymentMethod);

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         inv.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'all') return matchesSearch;
    if (statusFilter === 'unpaid') return matchesSearch && (inv.status === 'pending' || inv.status === 'overdue');
    return matchesSearch && inv.status === statusFilter;
  });

  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'paid': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'pending': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'overdue': return 'bg-rose-50 text-rose-600 border-rose-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const dispatchUpdate = () => {
    window.dispatchEvent(new CustomEvent('invoices_updated'));
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const fullDate = `${invoiceDate} ${timeStr}`;

    const invoiceData: Invoice = {
      id: invoiceNumber,
      customerName,
      customerNumber: `${countryCode} ${customerNumber}`,
      paymentMethod,
      transactionId,
      amount: parseFloat(amount) || 0,
      paidAmount: parseFloat(paidAmount) || 0,
      dueAmount: parseFloat(dueAmount) || 0,
      status: (parseFloat(dueAmount) || 0) > 0 ? 'pending' : 'paid',
      createdAt: isEditing ? invoiceDate : fullDate,
      cashierName,
      type: invoiceType,
      note,
      region,
      items: items
    };

    if (isEditing && editingInvoiceId) {
      if (editingInvoiceId !== invoiceNumber) {
        // Handle ID change by recreating document at new path
        await deleteInvoice(editingInvoiceId);
        await createInvoice(invoiceData);
      } else {
        await updateInvoice(editingInvoiceId, invoiceData as Partial<Invoice>);
      }
    } else {
      await createInvoice(invoiceData);
    }
    
    setShowCreate(false);
    resetForm();
  };

  const handleEditClick = (inv: Invoice) => {
    setIsEditing(true);
    setEditingInvoiceId(inv.id);
    setInvoiceNumber(inv.id);
    setInvoiceDate(inv.createdAt);
    setCustomerName(inv.customerName);
    
    // Parse country code and number
    const parts = inv.customerNumber.split(' ');
    if (parts.length > 1) {
      setCountryCode(parts[0]);
      setCustomerNumber(parts.slice(1).join(' '));
    } else {
      setCustomerNumber(inv.customerNumber);
    }
    
    setPaymentMethod(inv.paymentMethod);
    setTransactionId(inv.transactionId);
    setAmount(inv.amount.toString());
    setPaidAmount((inv.paidAmount || 0).toString());
    setDueAmount((inv.dueAmount || 0).toString());
    setCashierName(inv.cashierName || user?.name || '');
    setInvoiceType(inv.type || 'User Panel');
    setItems(inv.items || []);
    setNote(inv.note || '');
    setRegion(inv.region || '');
    setShowCreate(true);
  };

  const handleDeleteInvoice = async () => {
    if (invoiceToDelete) {
      await deleteInvoice(invoiceToDelete);
      setInvoiceToDelete(null);
      setShowDeleteConfirm(false);
    }
  };

  const confirmDelete = (id: string) => {
    setInvoiceToDelete(id);
    setShowDeleteConfirm(true);
  };

  const handleDirectDownload = async (inv: Invoice) => {
    if (isGeneratingPdf) return;
    
    setIsGeneratingPdf(true);
    try {
      console.log('Starting PDF generation for:', inv.id);
      setSelectedInvoice(inv);
      
      // Wait for DOM to stabilize
      await new Promise(resolve => setTimeout(resolve, 1000));

      const elementId = `invoice-direct-download`;
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error('Invoice template element not found');
      }

      // Use html-to-image (toPng) which is much more robust against oklch/modern CSS
      // because it uses SVG foreignObject rendering.
      const imgData = await toPng(element, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        style: {
          visibility: 'visible',
          display: 'flex',
          opacity: '1',
          position: 'static',
        },
        // We can add a font-family bypass if needed
      });
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: 'a4' // Use standard A4 for better compatibility
      });

      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Invoice_${inv.id}.pdf`);
    } catch (error) {
      console.error('Direct download failed:', error instanceof Error ? error.message : String(error));
      alert('Failed to generate PDF. Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
      
      // Fallback: If html-to-image fails, try to suggest printing
      const confirmPrint = window.confirm('Automatic PDF generation failed. Would you like to open the print dialog instead?');
      if (confirmPrint) {
        handlePrint();
      }
    } finally {
      setIsGeneratingPdf(false);
      setSelectedInvoice(null);
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById(`invoice-print-${selectedInvoice?.id}`);
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice - ${selectedInvoice?.id}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Meow+Script&display=swap');
            body { font-family: 'Inter', sans-serif; margin: 0; padding: 0; }
            .font-cursive { font-family: 'Meow Script', cursive; }
            @media print {
              body { -webkit-print-color-adjust: exact; }
              @page { size: auto; margin: 0; }
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            ${printContent.innerHTML}
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleImport = (source: string, id: string) => {
    setImportSource(source as any);
    setImportId(id);
    if (!id) return;

    let selectedItem: any = null;
    let newItems: { description: string; quantity: number; price: number }[] = [];

    switch(source) {
      case 'app':
        selectedItem = appsData.find(a => a.id === id);
        if (selectedItem) {
          setCustomerName(selectedItem.name);
          setInvoiceType('Apps');
          const price = selectedItem.price || 0;
          setAmount(price.toString());
          setPaidAmount(price.toString());
          setDueAmount('0');

          newItems = [
            { description: `FEATURE: ${selectedItem.name.toUpperCase()}`, quantity: 1, price: price },
            { description: `PACKAGE: ${selectedItem.packageName || 'N/A'}`, quantity: 1, price: 0 },
            { description: `PROTOCOL: ${selectedItem.protocol || 'N/A'}`, quantity: 1, price: 0 },
            { description: `VERSION: ${selectedItem.version || 'N/A'}`, quantity: 1, price: 0 },
            { description: `TYPE: ${selectedItem.appType || 'N/A'}`, quantity: 1, price: 0 },
            { description: `REGION: ${selectedItem.region || 'N/A'}`, quantity: 1, price: 0 },
            { description: `NOTE: ${selectedItem.note || 'N/A'}`, quantity: 1, price: 0 }
          ].filter(item => !item.description.includes('N/A'));
        }
        break;
      case 'panel':
        selectedItem = panelsData.find(p => p.id === id);
        if (selectedItem) {
          setCustomerName(selectedItem.name);
          const price = selectedItem.price || 0;
          setAmount(price.toString());
          setPaidAmount(price.toString());
          setDueAmount('0');
          setInvoiceType('Panel');

          newItems = [
            { description: `PANEL: ${selectedItem.name.toUpperCase()}`, quantity: 1, price: price },
            { description: `URL: ${selectedItem.url || 'N/A'}`, quantity: 1, price: 0 },
            { description: `REGION: ${selectedItem.region || 'N/A'}`, quantity: 1, price: 0 },
            { description: `DURATION: ${selectedItem.duration || 'N/A'}`, quantity: 1, price: 0 },
            { description: `NOTE: ${selectedItem.note || 'N/A'}`, quantity: 1, price: 0 }
          ].filter(item => !item.description.includes('N/A'));
        }
        break;
      case 'decoder':
        selectedItem = decodersData.find(d => d.id === id);
        if (selectedItem) {
          setCustomerName(selectedItem.username || selectedItem.model);
          const price = selectedItem.price || 0;
          setAmount(price.toString());
          setPaidAmount(price.toString());
          setDueAmount('0');
          setInvoiceType('Decoder');

          newItems = [
            { description: `DECODER USER: ${selectedItem.username.toUpperCase()}`, quantity: 1, price: price },
            { description: `REGION: ${selectedItem.region || 'N/A'}`, quantity: 1, price: 0 },
            { description: `DURATION: ${selectedItem.duration || 'N/A'}`, quantity: 1, price: 0 },
            { description: `NOTE: ${selectedItem.note || 'N/A'}`, quantity: 1, price: 0 }
          ].filter(item => !item.description.includes('N/A'));
        }
        break;
      case 'user':
        selectedItem = usersData.find(u => u.id === id);
        if (selectedItem) {
          setCustomerName(selectedItem.name);
          setInvoiceType('User');
          const price = selectedItem.price || 0;
          setAmount(price.toString());
          setPaidAmount(price.toString());
          setDueAmount('0');

          newItems = [
            { description: `SYSTEM USER: ${selectedItem.name.toUpperCase()}`, quantity: 1, price: price },
            { description: `USERNAME: ${selectedItem.username || 'N/A'}`, quantity: 1, price: 0 },
            { description: `ROLE: ${selectedItem.role || 'N/A'}`, quantity: 1, price: 0 },
            { description: `REGION: ${selectedItem.region || 'N/A'}`, quantity: 1, price: 0 },
            { description: `NOTE: ${selectedItem.note || 'N/A'}`, quantity: 1, price: 0 },
            { description: `STATUS: ACTIVE`, quantity: 1, price: 0 }
          ].filter(item => !item.description.includes('N/A'));
        }
        break;
    }

    setItems(newItems);

    if (selectedItem) {
      // Use values from selectedItem if they exist, otherwise fallback to defaults
      const txnId = selectedItem.transactionId || 'TXN-' + Math.random().toString(36).substring(2, 9).toUpperCase();
      const payMethod = selectedItem.paymentMethod || 'bKash';
      
      setTransactionId(txnId);
      setPaymentMethod(payMethod);

      // Auto-import contact details & notes
      if (selectedItem.phone) {
        setCustomerNumber(selectedItem.phone);
      }
      if (selectedItem.countryCode) {
        setCountryCode(selectedItem.countryCode);
      }
      if (selectedItem.note) {
        setNote(selectedItem.note);
      }
      if (selectedItem.region) {
        setRegion(selectedItem.region);
      }
    }
  };

  const [newItemDescription, setNewItemDescription] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');

  const addItem = () => {
    if (newItemDescription && newItemPrice) {
      const p = parseFloat(newItemPrice) || 0;
      setItems([...items, { description: newItemDescription, quantity: 1, price: p }]);
      setNewItemDescription('');
      setNewItemPrice('');
      
      // Update total amount
      const currentTotal = parseFloat(amount) || 0;
      setAmount((currentTotal + p).toString());
      setPaidAmount((currentTotal + p).toString());
      setDueAmount('0');
    }
  };

  const removeItem = (index: number) => {
    const itemToRemove = items[index];
    const newItemsList = items.filter((_, i) => i !== index);
    setItems(newItemsList);
    
    // Update total amount
    const currentTotal = parseFloat(amount) || 0;
    const newTotal = Math.max(0, currentTotal - itemToRemove.price);
    setAmount(newTotal.toFixed(2));
    setPaidAmount(newTotal.toFixed(2));
    setDueAmount('0');
  };

  const resetForm = () => {
    setEditingInvoiceId(null);
    setIsEditing(false);
    setInvoiceNumber('');
    setInvoiceDate(new Date().toISOString().split('T')[0]);
    setCustomerName('');
    setCountryCode('+880');
    setCustomerNumber('');
    setPaymentMethod('bKash');
    setTransactionId('');
    setAmount('');
    setPaidAmount('');
    setDueAmount('');
    setCashierName(user?.name || '');
    setInvoiceType('Apps');
    setItems([]);
    setImportSource('none');
    setImportId('');
    setNote('');
    setRegion('');
    setNewItemDescription('');
    setNewItemPrice('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {statusFilter === 'unpaid' ? t('unpaid') : t('invoice_management')}
          </h1>
          <p className="text-slate-500 text-sm">
            {statusFilter === 'unpaid' ? t('unpaid_invoices_desc') : t('billing_records_desc')}
          </p>
        </div>
        <button 
          onClick={() => {
            setIsEditing(false);
            setInvoiceNumber(`INV-${Math.floor(1000 + Math.random() * 9000)}`);
            setShowCreate(true);
          }}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-sm"
        >
          <Plus size={18} />
          {t('create_new_invoice')}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder={t('filter_invoices')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 italic text-slate-400 text-[10px] uppercase tracking-widest font-bold">
              <tr>
                <th className="px-6 py-3">{t('id_date')}</th>
                <th className="px-6 py-3">{t('source')}</th>
                <th className="px-6 py-3">{t('client_method')}</th>
                <th className="px-6 py-3 text-right">{t('total')}</th>
                <th className="px-6 py-3">{t('status')}</th>
                <th className="px-6 py-3 text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-mono text-[11px] font-bold text-indigo-600">{inv.id}</span>
                      <span className="text-[10px] text-slate-400">{inv.createdAt}</span>
                      {inv.cashierName && (
                        <span className="text-[9px] font-black text-rose-500 italic mt-1 uppercase tracking-tighter">By: {inv.cashierName}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${
                      inv.type?.toLowerCase().includes('app') ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                      inv.type?.toLowerCase().includes('panel') ? 'bg-amber-50 text-amber-600 border-amber-100' :
                      inv.type?.toLowerCase().includes('decoder') ? 'bg-purple-50 text-purple-600 border-purple-100' :
                      inv.type?.toLowerCase().includes('user') ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                      'bg-slate-50 text-slate-600 border-slate-100'
                    }`}>
                      {inv.type === 'Apps' ? (companySettings.appLabel || 'Apps') :
                       inv.type === 'Panel' ? (companySettings.panelLabel || 'Panels') :
                       inv.type === 'Decoder' ? (companySettings.decoderLabel || 'Decoders') :
                       inv.type === 'User' ? (companySettings.userLabel || 'Users') :
                       (inv.type || 'N/A')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-900">{inv.customerName}</span>
                      <span className="text-[10px] text-slate-400 font-medium">{inv.paymentMethod} • {inv.customerNumber || 'N/A'}</span>
                      {inv.appName && (
                        <div className="mt-1 p-1 bg-slate-50 border border-slate-100 rounded text-[9.5px] text-slate-600 font-bold max-w-xs">
                          <div>APP: <span className="text-indigo-600 font-black text-left">{inv.appName}</span> ({inv.packageName})</div>
                          <div className="flex gap-1.5 mt-0.5 text-[8.5px] text-slate-500">
                            <span>{inv.protocol}</span> • <span>{inv.appsQuality}</span> • <span>{inv.appsTrying}</span>
                            {inv.appWorkType && (
                              <span className="text-indigo-700 bg-indigo-50 px-1 rounded text-[7.5px] font-black uppercase tracking-wider">{inv.appWorkType}</span>
                            )}
                          </div>
                        </div>
                      )}
                      {inv.panelName && (
                        <div className="mt-1 p-1 bg-slate-50 border border-slate-100 rounded text-[9.5px] text-slate-600 font-bold max-w-xs text-left">
                          <div>PANEL: <span className="text-teal-650 font-black text-left uppercase">{inv.panelName}</span></div>
                          <div className="truncate text-[8.5px] text-slate-400 font-mono mt-0.5" title={inv.panelUrl}>URL: {inv.panelUrl || 'N/A'}</div>
                          <div className="flex gap-1.5 mt-1 text-[8px] text-slate-500 items-center">
                            <span className="bg-slate-100 px-1 rounded text-slate-600">{inv.panelDuration}</span>
                            {inv.panelType && (
                              <span className="text-teal-700 bg-teal-50 px-1 rounded text-[7.5px] font-black uppercase tracking-wider">{inv.panelType}</span>
                            )}
                          </div>
                        </div>
                      )}
                      {inv.decoderUsername && (
                        <div className="mt-1 p-1 bg-slate-50 border border-slate-100 rounded text-[9.5px] text-slate-600 font-bold max-w-xs text-left">
                          <div>DECODER USER: <span className="text-amber-600 font-black text-left">{inv.decoderUsername}</span></div>
                          <div className="flex gap-1.5 mt-1 text-[8px] text-slate-500 items-center">
                            <span className="bg-slate-100 px-1 rounded text-slate-600">{inv.decoderDuration}</span>
                            {inv.decoderUserType && (
                              <span className="text-amber-700 bg-amber-50 px-1 rounded text-[7.5px] font-black uppercase tracking-wider">{inv.decoderUserType}</span>
                            )}
                          </div>
                        </div>
                      )}
                      {inv.serviceDetails && (
                        <div className="mt-1 p-1 bg-slate-50 border border-slate-100 rounded text-[9.5px] text-slate-600 font-bold max-w-xs text-left">
                          <span className="text-[8px] font-black uppercase text-indigo-500 tracking-wider block">SERVICE DETAILS:</span>
                          <div className="whitespace-pre-wrap text-[9px] text-slate-700 font-semibold mt-1 bg-white p-1 rounded border border-slate-100 font-sans">{inv.serviceDetails}</div>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-bold text-slate-900">
                      {localPayments.includes(inv.paymentMethod || 'bKash') ? '৳' : '$'}{inv.amount.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusStyle(inv.status)}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button 
                        onClick={() => handleDirectDownload(inv)}
                        className="p-2.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-all"
                        title={t('download_pdf')}
                      >
                        <Download size={16} />
                      </button>
                      <button 
                        onClick={() => {
                          setPreviewInvoice(inv);
                          setShowPreview(true);
                        }}
                        className="p-2.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-all"
                        title={t('preview_invoice')}
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                        onClick={() => handleEditClick(inv)}
                        className="p-2.5 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded-xl transition-all"
                        title={t('edit_invoice')}
                      >
                        <Edit3 size={16} />
                      </button>
                      <button 
                        onClick={() => confirmDelete(inv.id)}
                        className="p-2.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-xl transition-all"
                        title={t('delete_invoice')}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hidden container for direct printing */}
      <div className="fixed top-0 left-0 -z-[100] pointer-events-none opacity-0 overflow-visible" style={{ width: '800px', height: 'auto' }}>
        <div id="pdf-render-context" style={{ width: '794px' }}>
          {selectedInvoice && (
            <InvoiceTemplate 
              id="invoice-direct-download"
              invoice={selectedInvoice} 
              settings={companySettings} 
            />
          )}
        </div>
      </div>

      {/* Loading Overlay for PDF Generation */}
      {isGeneratingPdf && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-sm font-black text-slate-900 uppercase tracking-widest">{t('generating_pdf')}</p>
            <p className="text-[10px] text-slate-400 mt-2">{t('please_wait_pdf')}</p>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewInvoice && showPreview && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 ${showPreview ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-[850px] w-full max-h-[90vh] flex flex-col scale-in">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{t('invoice_preview')}</h2>
                <p className="text-xs text-slate-500">{t('prof_layout_desc')}</p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => previewInvoice && handleDirectDownload(previewInvoice)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 shadow-md shadow-indigo-100"
                >
                  <Download size={16} />
                  {t('download_pdf')}
                </button>
                <button 
                  onClick={() => {
                    setShowPreview(false);
                    setPreviewInvoice(null);
                  }}
                  className="p-2.5 text-slate-400 hover:text-slate-900 bg-slate-100 rounded-xl transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto p-8 bg-slate-50">
              <div className="shadow-xl rounded-sm mx-auto transform scale-[0.85] origin-top">
                <InvoiceTemplate 
                  id={`invoice-preview-${previewInvoice.id}`}
                  invoice={previewInvoice} 
                  settings={companySettings} 
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <Modal 
        isOpen={showCreate} 
        onClose={() => { setShowCreate(false); resetForm(); }} 
        title={isEditing ? "Edit Invoice" : "Create New Invoice"}
      >
        <div className="mb-6 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100/50">
          <div className="flex items-center gap-2 mb-3">
            <ArrowDownCircle size={16} className="text-indigo-600" />
            <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-widest leading-none">Quick Import</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <select 
                value={importSource}
                onChange={(e) => {
                  setImportSource(e.target.value as any);
                  setImportId('');
                }}
                className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm font-bold text-indigo-700 pr-8 cursor-pointer"
              >
                <option value="none">-- Category --</option>
                <option value="app">{companySettings.appLabel || 'Apps'}</option>
                <option value="panel">{companySettings.panelLabel || 'Panels'}</option>
                <option value="decoder">{companySettings.decoderLabel || 'Decoders'}</option>
                <option value="user">{companySettings.userLabel || 'Users'}</option>
              </select>
            </div>
            <div>
              <select 
                disabled={importSource === 'none'}
                value={importId}
                onChange={(e) => handleImport(importSource, e.target.value)}
                className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm font-bold text-slate-700 disabled:opacity-50 pr-8 cursor-pointer"
              >
                <option value="">-- Select Item --</option>
                {importSource === 'app' && appsData.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                {importSource === 'panel' && panelsData.map(p => <option key={p.id} value={p.id}>{p.name} (৳{p.price})</option>)}
                {importSource === 'decoder' && decodersData.map(d => <option key={d.id} value={d.id}>{d.username || d.model} (৳{d.price})</option>)}
                {importSource === 'user' && usersData.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleCreateInvoice}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Invoice Number</label>
              <input 
                required
                type="text" 
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm font-mono" 
                placeholder="INV-XXXX" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Invoice Date</label>
              <input 
                required
                type="date" 
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm" 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Customer Name</label>
              <input 
                required
                type="text" 
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm" 
                placeholder="e.g. Apex Corp" 
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Customer Number</label>
              <div className="flex shadow-sm rounded-xl overflow-hidden border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-300 transition-all">
                <select 
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="bg-slate-50 border-r border-slate-200 px-3 py-2 text-[11px] font-black outline-none cursor-pointer hover:bg-slate-100 transition-colors shrink-0"
                >
                  {countries.map(c => (
                    <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                  ))}
                </select>
                <input 
                  required
                  type="tel" 
                  value={customerNumber}
                  onChange={(e) => setCustomerNumber(e.target.value)}
                  className="flex-1 px-4 py-2 bg-white text-sm font-black text-indigo-700 outline-none placeholder:text-slate-300" 
                  placeholder="17XXXXXXXX" 
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="h-px bg-slate-100 flex-1"></span>
              Payment Information
              <span className="h-px bg-slate-100 flex-1"></span>
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Payment Method</label>
                <select 
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm font-bold"
                >
                  <optgroup label="Local (Mobile Banking)">
                    <option value="bKash">bKash</option>
                    <option value="Nagad">Nagad</option>
                    <option value="Rocket">Rocket</option>
                    <option value="Upay">Upay</option>
                    <option value="CellFin">CellFin</option>
                  </optgroup>
                  <optgroup label="Global & Bank">
                    <option value="Bank">Bank Transfer</option>
                    <option value="Binance">Binance (USDT)</option>
                    <option value="PayPal">PayPal</option>
                  </optgroup>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Transaction ID</label>
                <input 
                  required
                  type="text" 
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm font-mono" 
                  placeholder="TXN-XXXXXX" 
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Amount ({isTaka ? '৳' : '$'})</label>
              <input 
                required
                type="number" 
                step="0.01"
                value={amount}
                onChange={(e) => {
                  const val = e.target.value;
                  setAmount(val);
                  setPaidAmount(val);
                  setDueAmount('0');
                }}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm font-bold" 
                placeholder={isTaka ? "৳0.00" : "$0.00"} 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Paid Amount</label>
              <input 
                type="number" 
                step="0.01"
                value={paidAmount}
                onChange={(e) => {
                  const paid = e.target.value;
                  setPaidAmount(paid);
                  const total = parseFloat(amount) || 0;
                  const p = parseFloat(paid) || 0;
                  setDueAmount(Math.max(0, total - p).toFixed(2));
                }}
                className="w-full px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm font-bold text-emerald-700" 
                placeholder="৳0.00" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-rose-600 uppercase tracking-wider mb-1">Due Amount</label>
              <input 
                type="number" 
                step="0.01"
                value={dueAmount}
                onChange={(e) => {
                  const due = e.target.value;
                  setDueAmount(due);
                  const total = parseFloat(amount) || 0;
                  const d = parseFloat(due) || 0;
                  setPaidAmount(Math.max(0, total - d).toFixed(2));
                }}
                className="w-full px-4 py-2 bg-rose-50 border border-rose-100 rounded-lg outline-none focus:ring-2 focus:ring-rose-500/20 transition-all text-sm font-bold text-rose-700" 
                placeholder="৳0.00" 
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Invoice Source / Type</label>
            <select 
              value={invoiceType}
              onChange={(e) => setInvoiceType(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm font-bold text-slate-800"
            >
              <option value="Apps">{companySettings.appLabel || 'Apps'}</option>
              <option value="Decoder">{companySettings.decoderLabel || 'Decoders'}</option>
              <option value="Panel">{companySettings.panelLabel || 'Panels'}</option>
              <option value="User">{companySettings.userLabel || 'Users'}</option>
              <option value="Other">Other Category</option>
            </select>
          </div>

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
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Internal Note / Details</label>
            <textarea 
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Customer requested urgent delivery..."
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm min-h-[60px] resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Cashier Name</label>
            <input 
              required
              type="text" 
              value={cashierName}
              onChange={(e) => setCashierName(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm font-bold text-indigo-700" 
              placeholder={`e.g. ${companySettings.sidebarAdminName || 'Master Admin'}`} 
            />
          </div>

          <div className="mt-2 p-4 bg-slate-50/50 rounded-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between mb-3 px-1">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <FileText size={12} className="text-slate-400" />
                Items Included (Invoice Breakdown)
              </h4>
              <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-wider">
                {items.length} {items.length === 1 ? 'Item' : 'Items'}
              </span>
            </div>
            
            <div className="space-y-3">
              {/* Item Adder */}
              <div className="flex gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-sm mb-4">
                <input 
                  type="text" 
                  value={newItemDescription}
                  onChange={(e) => setNewItemDescription(e.target.value)}
                  placeholder="Item description..."
                  className="flex-1 bg-transparent px-2 text-xs font-bold outline-none border-none placeholder:text-slate-300"
                />
                <div className="w-24 relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-300 font-bold text-[10px]">{isTaka ? '৳' : '$'}</span>
                  <input 
                    type="number" 
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-50 border border-slate-100 pl-5 pr-2 py-1.5 rounded-lg text-xs font-black text-indigo-600 outline-none"
                  />
                </div>
                <button 
                  type="button"
                  onClick={addItem}
                  className="bg-indigo-600 text-white p-1.5 rounded-lg hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-100 shrink-0"
                >
                  <Plus size={16} />
                </button>
              </div>

              {items.length > 0 && (
                <div className="max-h-48 overflow-auto rounded-xl border border-slate-100">
                  <table className="w-full text-[10px] font-bold uppercase">
                    <thead className="bg-slate-100 text-slate-500 sticky top-0 z-10 font-black">
                      <tr>
                        <th className="px-3 py-2 text-left tracking-widest">Description</th>
                        <th className="px-3 py-2 text-right tracking-widest">Price</th>
                        <th className="w-10 px-3 py-2"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-600 bg-white/50">
                      {items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-100/50 transition-colors">
                          <td className="px-3 py-2 leading-tight">{item.description}</td>
                          <td className="px-3 py-2 text-right font-black text-indigo-700">
                            {isTaka ? '৳' : '$'}{item.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-3 py-2">
                            <button 
                              type="button"
                              onClick={() => removeItem(idx)}
                              className="text-slate-300 hover:text-rose-500 transition-colors"
                            >
                              <X size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {items.length === 0 && (
                <div className="py-8 text-center bg-white/30 rounded-xl border border-dashed border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No items added yet</p>
                  <p className="text-[9px] text-slate-300 mt-1">Import a category above or add manually</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={() => { setShowCreate(false); resetForm(); }} className="flex-1 px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-lg transition-colors">Cancel</button>
            <button type="submit" className="flex-1 px-4 py-2 text-sm font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm transition-all">
              {isEditing ? "Update Invoice" : "Create Invoice"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => { setShowDeleteConfirm(false); setInvoiceToDelete(null); }}
        title="Delete Confirmation"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-4 text-rose-600 bg-rose-50 p-4 rounded-xl border border-rose-100">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-rose-100 shadow-sm">
              <Trash2 size={20} />
            </div>
            <div>
              <p className="text-sm font-bold">Are you sure?</p>
              <p className="text-xs opacity-80">This action will permanently delete invoice <span className="font-mono font-black">{invoiceToDelete}</span>.</p>
            </div>
          </div>
          
          <div className="flex gap-3 pt-2">
            <button 
              onClick={() => { setShowDeleteConfirm(false); setInvoiceToDelete(null); }} 
              className="flex-1 px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-lg transition-colors border border-slate-100"
            >
              No, Keep it
            </button>
            <button 
              onClick={handleDeleteInvoice}
              className="flex-1 px-4 py-2 text-sm font-bold bg-rose-600 text-white rounded-lg hover:bg-rose-700 shadow-md shadow-rose-200 transition-all"
            >
              Yes, Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
