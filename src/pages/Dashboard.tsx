import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, Activity, FileText, Banknote, Check, X, Clock, CreditCard, CheckCircle, ShieldAlert, Sparkles, PhoneCall, Gift, RefreshCw, Users, Settings, Lock, Eye, EyeOff, Megaphone, Bell, Plus, ExternalLink, ChevronRight, BarChart3, Copy, MessageSquare, Search, AlertCircle, Mail, Cpu, Layers, Play, Sliders, ChevronUp, ChevronDown, Pin, PinOff, ArrowLeft, ArrowRight, Download, ShieldCheck, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../lib/auth';
import { updateDocument, safeStringify } from '../lib/storage';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { Modal } from '../components/Modal';
import { AdminPanel } from '../components/AdminPanel';
import { CreateAppForm, CreateDecoderForm, CreatePanelForm, CreateUserForm } from '../components/CreateForms';
import { Invoice, Investment, ActivityLog, User } from '../types';
import { subscribeToInvoices, createDocument, subscribeToSettings, subscribeToCollection, updateInvoice, createInvoice } from '../lib/storage';
import { useLanguage } from '../lib/language';
import { CompanySettings } from '../types';
import { InvoiceTemplate } from '../components/InvoiceTemplate';
import { AIInvoiceHelper } from '../components/AIInvoiceHelper';
import { PaymentWizard } from '../components/PaymentWizard';
import { PaymentAccounts } from '../components/PaymentAccounts';
import { ClientDashboard } from '../components/ClientDashboard';
import jsPDF from 'jspdf';
import { toPng } from 'html-to-image';

const defaultChartData = [
  { name: 'Mon', income: 4000 },
  { name: 'Tue', income: 3000 },
  { name: 'Wed', income: 2000 },
  { name: 'Thu', income: 2780 },
  { name: 'Fri', income: 1890 },
  { name: 'Sat', income: 2390 },
  { name: 'Sun', income: 3490 },
];

type ModalType = 'app' | 'decoder' | 'panel' | 'user' | 'invoice' | 'create_invoice_direct' | null;

export function Dashboard({ onLogoutRequest, activeSubTab = 'dashboard', onTabChange }: { onLogoutRequest: () => void; activeSubTab?: string; onTabChange?: (tab: string) => void }) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [adminActiveTab, setAdminActiveTab] = useState<'overview' | 'approvals' | 'create_invoice' | 'records' | 'notes'>('overview');
  const [adminLogSearch, setAdminLogSearch] = useState('');
  const [adminInvoiceSearch, setAdminInvoiceSearch] = useState('');
  const [activeInlineForm, setActiveInlineForm] = useState<'app' | 'decoder' | 'panel' | 'user' | 'create_invoice_direct'>('create_invoice_direct');

  // Client Dashboard Realtime Clock
  const [clientLocalTime, setClientLocalTime] = useState<string>('');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setClientLocalTime(now.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Floating Quick Actions States
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
  const [directInvoiceNum, setDirectInvoiceNum] = useState('');
  const [directInvoiceType, setDirectInvoiceType] = useState('Apps');
  const [directInvoiceCustomerName, setDirectInvoiceCustomerName] = useState('');
  const [directInvoiceCountryCode, setDirectInvoiceCountryCode] = useState('+880');
  const [directInvoicePhone, setDirectInvoicePhone] = useState('');
  const [directInvoicePaymentMethod, setDirectInvoicePaymentMethod] = useState('bKash');
  const [directInvoiceTxnId, setDirectInvoiceTxnId] = useState('');
  const [directInvoiceAmount, setDirectInvoiceAmount] = useState('');
  const [directInvoicePaid, setDirectInvoicePaid] = useState('');
  const [directInvoiceDue, setDirectInvoiceDue] = useState('0');
  const [directInvoiceNote, setDirectInvoiceNote] = useState('');
  const [isDirectInvoiceSaving, setIsDirectInvoiceSaving] = useState(false);

  const localCountryCodes = [
    { code: '+880', label: 'BD' },
    { code: '+966', label: 'SA' },
    { code: '+974', label: 'QA' },
    { code: '+968', label: 'OM' },
    { code: '+965', label: 'KW' },
    { code: '+971', label: 'AE' },
    { code: '+256', label: 'UG' },
    { code: '+91', label: 'IN' },
    { code: '+92', label: 'PK' },
    { code: '+973', label: 'BH' },
  ];

  // Hook to generate unique ID and reset inputs when direct invoice modal is opened
  useEffect(() => {
    if (activeModal === 'create_invoice_direct') {
      const uniqueId = `INV-${Math.floor(100000 + Math.random() * 900000)}`;
      setDirectInvoiceNum(uniqueId);
      setDirectInvoiceCustomerName('');
      setDirectInvoicePhone('');
      setDirectInvoiceTxnId('');
      setDirectInvoiceAmount('');
      setDirectInvoicePaid('');
      setDirectInvoiceDue('0');
      setDirectInvoiceNote('');
    }
  }, [activeModal]);

  const handleDirectInvoiceAmountChange = (val: string, type: 'amount' | 'paid') => {
    if (type === 'amount') {
      setDirectInvoiceAmount(val);
      const amt = parseFloat(val) || 0;
      const pd = parseFloat(directInvoicePaid) || 0;
      setDirectInvoiceDue(Math.max(0, amt - pd).toString());
    } else {
      setDirectInvoicePaid(val);
      const amt = parseFloat(directInvoiceAmount) || 0;
      const pd = parseFloat(val) || 0;
      setDirectInvoiceDue(Math.max(0, amt - pd).toString());
    }
  };

  const handleCreateDirectInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsDirectInvoiceSaving(true);
    try {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const dateStr = now.toISOString().split('T')[0];
      const fullDate = `${dateStr} ${timeStr}`;

      const amt = parseFloat(directInvoiceAmount) || 0;
      const pd = parseFloat(directInvoicePaid) || 0;
      const due = Math.max(0, amt - pd);

      const invoiceData: any = {
        id: directInvoiceNum,
        customerName: directInvoiceCustomerName,
        customerNumber: `${directInvoiceCountryCode} ${directInvoicePhone}`,
        paymentMethod: directInvoicePaymentMethod,
        transactionId: directInvoiceTxnId,
        amount: amt,
        paidAmount: pd,
        dueAmount: due,
        status: due > 0 ? 'pending' : 'paid',
        createdAt: fullDate,
        date: dateStr,
        cashierName: currentUserData?.name || user?.name || 'Administrator',
        type: directInvoiceType,
        note: directInvoiceNote,
        items: [{ description: `${directInvoiceType} Service`, quantity: 1, price: amt }]
      };

      await createInvoice(invoiceData);
      setActiveModal(null);
    } catch (err) {
      console.error('Error creating direct invoice:', err);
    } finally {
      setIsDirectInvoiceSaving(false);
    }
  };
  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    try {
      const cached = localStorage.getItem('cached_dashboard_invoices');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [investments, setInvestments] = useState<Investment[]>(() => {
    try {
      const cached = localStorage.getItem('cached_dashboard_investments');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [activities, setActivities] = useState<ActivityLog[]>(() => {
    try {
      const cached = localStorage.getItem('cached_dashboard_activities');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [settings, setSettings] = useState<Partial<CompanySettings>>(() => {
    try {
      const cached = localStorage.getItem('cached_dashboard_settings');
      return cached ? JSON.parse(cached) : {};
    } catch {
      return {};
    }
  });
  const [chartVisualType, setChartVisualType] = useState<'bar' | 'area' | 'line'>('area');
  const [chartMetricMode, setChartMetricMode] = useState<'daily' | 'cumulative' | 'profit'>('daily');

  const [currentUserData, setCurrentUserData] = useState<any>(() => {
    try {
      const cached = localStorage.getItem('cached_dashboard_current_user_data');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [totalUsersCount, setTotalUsersCount] = useState<number>(() => {
    try {
      const cached = localStorage.getItem('cached_dashboard_total_users_count');
      return cached ? Number(cached) : 0;
    } catch {
      return 0;
    }
  });
  const [allUsers, setAllUsers] = useState<any[]>(() => {
    try {
      const cached = localStorage.getItem('cached_dashboard_all_users');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [isProcessingApproval, setIsProcessingApproval] = useState<string | null>(null);
  const [approvedNotificationModal, setApprovedNotificationModal] = useState<{
    isOpen: boolean;
    invoice: Invoice | null;
    user?: User | null;
  }>({ isOpen: false, invoice: null, user: null });

  // Customer top-up states
  const [topUpAmount, setTopUpAmount] = useState('');
  const [ticketPaidAmount, setTicketPaidAmount] = useState('');
  const [ticketDueAmount, setTicketDueAmount] = useState('');
  const [topUpMethod, setTopUpMethod] = useState('');
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [topUpTxn, setTopUpTxn] = useState('');
  const [topUpPurpose, setTopUpPurpose] = useState('');
  const [topUpSuccess, setTopUpSuccess] = useState('');
  const [topUpError, setTopUpError] = useState('');
  const [isTopUpLoading, setIsTopUpLoading] = useState(false);
  const [resubmittingInvoiceId, setResubmittingInvoiceId] = useState<string | null>(null);

  // Automated fields for Client Invoice metadata
  const [clientInvoiceNumber, setClientInvoiceNumber] = useState('');
  const [clientInvoiceDate, setClientInvoiceDate] = useState('');
  const [clientInvoiceTime, setClientInvoiceTime] = useState('');

  const generateNewInvoiceMeta = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random6Digits = Math.floor(100000 + Math.random() * 900000);
    const dateStr = `${year}-${month}-${day}`;
    // Formatted time, e.g. "12:35:45 PM"
    const timeStr = now.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setClientInvoiceNumber(`INV-${random6Digits}`);
    setClientInvoiceDate(dateStr);
    setClientInvoiceTime(timeStr);
  };

  const handleInitiateResubmit = (inv: any) => {
    setResubmittingInvoiceId(inv.id);
    setTopUpMethod(inv.paymentMethod || inv.method || 'bKash');
    setTopUpAmount(String(inv.amount || 0));
    setTopUpTxn(inv.transactionId || '');
    setTopUpPurpose(inv.type || 'Wallet Top-Up');
    setTicketPaidAmount(String(inv.paidAmount || 0));
    setTicketDueAmount(String(inv.dueAmount || 0));
    
    if (inv.date) {
      setClientInvoiceDate(inv.date);
    }
    setClientInvoiceNumber(inv.id);

    if (onTabChange) {
      onTabChange('client_payment');
    }
    
    setTopUpSuccess('');
    setTopUpError('');
    
    setTimeout(() => {
      const el = document.getElementById('client-billing-form-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 150);
  };

  // Generate when subtab is loaded
  useEffect(() => {
    if (activeSubTab === 'payment') {
      setPaymentWizardStep(2);
      if (!topUpMethod) {
        setTopUpMethod('bKash');
        setSelectedAccountTab('bKash');
      }
      generateNewInvoiceMeta();
    } else if (activeSubTab === 'account') {
      setPaymentWizardStep(1);
    }
  }, [activeSubTab]);

  // Fallback trigger if empty on mount
  useEffect(() => {
    if (!clientInvoiceNumber) {
      generateNewInvoiceMeta();
    }
  }, []);

  // New fields for App detail tickets requested by user
  const [ticketAppName, setTicketAppName] = useState('');
  const [ticketAppPackageName, setTicketAppPackageName] = useState('dev.masterbuild.');
  const [ticketAppProtocol, setTicketAppProtocol] = useState('');
  const [ticketAppQuality, setTicketAppQuality] = useState('');
  const [ticketAppType, setTicketAppType] = useState('');
  const [ticketAppWorkType, setTicketAppWorkType] = useState('');

  // New fields for Panel detail tickets requested by user
  const [ticketPanelName, setTicketPanelName] = useState('');
  const [ticketPanelUrl, setTicketPanelUrl] = useState('');
  const [ticketPanelDuration, setTicketPanelDuration] = useState('');
  const [ticketPanelType, setTicketPanelType] = useState('');

  // New fields for Decoder detail tickets requested by user
  const [ticketDecoderUsername, setTicketDecoderUsername] = useState('');
  const [ticketDecoderUserType, setTicketDecoderUserType] = useState('');
  const [ticketDecoderDuration, setTicketDecoderDuration] = useState('');

  // Generic details for new services
  const [ticketServiceDetails, setTicketServiceDetails] = useState('');

  // Client Password Change states
  const [clientCurrentPassword, setClientCurrentPassword] = useState('');
  const [clientNewPassword, setClientNewPassword] = useState('');
  const [clientConfirmPassword, setClientConfirmPassword] = useState('');
  const [showClientPass, setShowClientPass] = useState(false);
  const [clientPassError, setClientPassError] = useState('');
  const [clientPassSuccess, setClientPassSuccess] = useState('');
  const [isClientPassSaving, setIsClientPassSaving] = useState(false);

  // Customer sub-assets States
  const [myApps, setMyApps] = useState<any[]>(() => {
    try {
      const cached = localStorage.getItem('cached_dashboard_my_apps');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [myDecoders, setMyDecoders] = useState<any[]>(() => {
    try {
      const cached = localStorage.getItem('cached_dashboard_my_decoders');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [myPanels, setMyPanels] = useState<any[]>(() => {
    try {
      const cached = localStorage.getItem('cached_dashboard_my_panels');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  // Admin sticky notepad persistence state
  const [adminNotes, setAdminNotes] = useState<string>(() => {
    return localStorage.getItem('admin_desktop_sticky_notes') || '';
  });
  const [notesSaveSuccess, setNotesSaveSuccess] = useState(false);

  // --- Admin Customizable Pinned Metrics & Dynamic Widgets Configuration System ---
  // System-level list states for widgets (exclusive to Admin)
  const [allDecoders, setAllDecoders] = useState<any[]>(() => {
    try {
      const cached = localStorage.getItem('cached_dashboard_all_decoders');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [allApps, setAllApps] = useState<any[]>(() => {
    try {
      const cached = localStorage.getItem('cached_dashboard_all_apps');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [allPanels, setAllPanels] = useState<any[]>(() => {
    try {
      const cached = localStorage.getItem('cached_dashboard_all_panels');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const isAdminUser = currentUserData?.role === 'admin' || user?.role === 'admin';
    if (isAdminUser) {
      const unsubAllDecoders = subscribeToCollection<any>('decoders', (list) => {
        setAllDecoders(list);
        try {
          localStorage.setItem('cached_dashboard_all_decoders', JSON.stringify(list));
        } catch {}
      });
      const unsubAllApps = subscribeToCollection<any>('apps', (list) => {
        setAllApps(list);
        try {
          localStorage.setItem('cached_dashboard_all_apps', JSON.stringify(list));
        } catch {}
      });
      const unsubAllPanels = subscribeToCollection<any>('panels', (list) => {
        setAllPanels(list);
        try {
          localStorage.setItem('cached_dashboard_all_panels', JSON.stringify(list));
        } catch {}
      });
      return () => {
        unsubAllDecoders && unsubAllDecoders();
        unsubAllApps && unsubAllApps();
        unsubAllPanels && unsubAllPanels();
      };
    }
  }, [currentUserData?.role, user?.role]);

  // Widgets state
  const [widgets, setWidgets] = useState<any[]>(() => {
    try {
      const cached = localStorage.getItem('cached_dashboard_pinned_widgets');
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      console.error('Error parsing cached pinned widgets:', e);
    }
    // Default system fallback
    return [
      { id: 'totalRevenue', label: 'Total Revenue', bangla: 'সর্বমোট রেভিনিউ', icon: 'Banknote', color: 'bg-indigo-50 text-indigo-600 border-indigo-150/40', isPinned: true },
      { id: 'totalInvestment', label: 'Total Investment', bangla: 'সর্বমোট ইনভেস্টমেন্ট', icon: 'TrendingDown', color: 'bg-rose-50 text-rose-600 border-rose-150/40', isPinned: true },
      { id: 'netProfit', label: 'Net Profit', bangla: 'প্রকৃত প্রফিট', icon: 'TrendingUp', color: 'bg-emerald-50 text-emerald-700 border-emerald-150/40', isPinned: true },
      { id: 'dueBalance', label: 'Due Balance', bangla: 'গ্রাহক বকেয়া ঋণ', icon: 'Activity', color: 'bg-slate-900 text-rose-300 border-slate-800', isPinned: true, isDark: true },
      { id: 'totalUsers', label: 'Registered Customers', bangla: 'রেজিস্টার্ড গ্রাহক', icon: 'Users', color: 'bg-violet-50 text-violet-600 border-violet-150/40', isPinned: true },
      { id: 'todayPending', label: 'Today\'s Pending Payments', bangla: 'আজকের পেন্ডিং পেমেন্ট', icon: 'Clock', color: 'bg-amber-50 text-amber-600 border-amber-150/40', isPinned: false },
      { id: 'todayRevenue', label: 'Today\'s Revenue', bangla: 'আজকের মোট কালেকশন', icon: 'Wallet', color: 'bg-teal-50 text-teal-600 border-teal-150/40', isPinned: false },
      { id: 'activeDecoders', label: 'Total Active Decoders', bangla: 'মোট সক্রিয় ডিকোডার', icon: 'Cpu', color: 'bg-sky-50 text-sky-600 border-sky-150/40', isPinned: false },
      { id: 'activePanels', label: 'Total Active Panels', bangla: 'মোট সক্রিয় প্যানেল', icon: 'Layers', color: 'bg-fuchsia-50 text-fuchsia-600 border-fuchsia-150/40', isPinned: false },
      { id: 'activeApps', label: 'Total Created Apps', bangla: 'তৈরিকৃত মোট অ্যাপস', icon: 'Play', color: 'bg-red-50 text-red-650 border-red-150/40', isPinned: false },
    ];
  });

  const [isWidgetModalOpen, setIsWidgetModalOpen] = useState(false);
  const [draggedWidgetIndex, setDraggedWidgetIndex] = useState<number | null>(null);

  // Today-specific pending/revenue stats calculations
  const todayPendingPayments = React.useMemo(() => {
    const now = new Date();
    const yearStr = now.getFullYear();
    const monthStr = String(now.getMonth() + 1).padStart(2, '0');
    const dayStr = String(now.getDate()).padStart(2, '0');
    const todayDateStr = `${yearStr}-${monthStr}-${dayStr}`;
    
    return invoices.filter(inv => {
      const isPending = inv.status === 'pending' || inv.status === 'overdue';
      return isPending && inv.date === todayDateStr;
    });
  }, [invoices]);

  const todayPendingPaymentsCount = todayPendingPayments.length;
  const todayPendingPaymentsAmount = todayPendingPayments.reduce((sum, inv) => sum + (inv.amount || 0), 0);

  const todayCollectedRevenue = React.useMemo(() => {
    const now = new Date();
    const yearStr = now.getFullYear();
    const monthStr = String(now.getMonth() + 1).padStart(2, '0');
    const dayStr = String(now.getDate()).padStart(2, '0');
    const todayDateStr = `${yearStr}-${monthStr}-${dayStr}`;
    
    return invoices
      .filter(inv => (inv.status === 'paid' || inv.status === 'approved') && inv.date === todayDateStr)
      .reduce((sum, inv) => sum + (inv.paidAmount || inv.amount || 0), 0);
  }, [invoices]);

  const toggleWidgetPin = (widgetId: string) => {
    const updated = widgets.map(w => {
      if (w.id === widgetId) {
        return { ...w, isPinned: !w.isPinned };
      }
      return w;
    });
    setWidgets(updated);
    try {
      localStorage.setItem('cached_dashboard_pinned_widgets', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const moveWidget = (index: number, direction: 'up' | 'down') => {
    const nextIndex = direction === 'up' ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= widgets.length) return;

    const reordered = [...widgets];
    const temp = reordered[index];
    reordered[index] = reordered[nextIndex];
    reordered[nextIndex] = temp;

    setWidgets(reordered);
    try {
      localStorage.setItem('cached_dashboard_pinned_widgets', JSON.stringify(reordered));
    } catch (e) {
      console.error(e);
    }
  };

  // Drag and drop event handlers
  const handleDragStart = (index: number) => {
    setDraggedWidgetIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (index: number) => {
    if (draggedWidgetIndex === null) return;
    const reordered = [...widgets];
    const [removed] = reordered.splice(draggedWidgetIndex, 1);
    reordered.splice(index, 0, removed);
    setWidgets(reordered);
    try {
      localStorage.setItem('cached_dashboard_pinned_widgets', JSON.stringify(reordered));
    } catch (e) {
      console.error(e);
    }
    setDraggedWidgetIndex(null);
  };

  const getWidgetIcon = (iconName: string) => {
    switch (iconName) {
      case 'Banknote': return <Banknote size={18} />;
      case 'TrendingDown': return <TrendingDown size={18} />;
      case 'TrendingUp': return <TrendingUp size={18} />;
      case 'Activity': return <Activity size={18} />;
      case 'Users': return <Users size={18} />;
      case 'Clock': return <Clock size={15} className="animate-spin" style={{ animationDuration: '4s' }} />;
      case 'Wallet': return <Wallet size={18} />;
      case 'Cpu': return <Cpu size={18} />;
      case 'Layers': return <Layers size={18} />;
      case 'Play': return <Play size={18} />;
      default: return <Activity size={18} />;
    }
  };

  const getWidgetValueAndInfo = (id: string) => {
    switch (id) {
      case 'totalRevenue':
        return {
          value: `৳${stats.totalRevenue.toLocaleString()}`,
          subText: 'সংগৃহীত সর্বমোট টাকা',
          bottomText: 'রিয়েলটাইম লিংকার',
          sparkLine: true,
          sparkColor: 'text-emerald-500',
        };
      case 'totalInvestment':
        return {
          value: `৳${stats.totalInvestment.toLocaleString()}`,
          subText: 'সর্বমোট কাজের খরচ',
          bottomText: 'Expenses Tracked',
          sparkLine: true,
          sparkColor: 'text-rose-500',
          sparkDown: true,
        };
      case 'netProfit':
        return {
          value: `৳${stats.netProfit.toLocaleString()}`,
          subText: 'অর্জিত প্রকৃত প্রফিট',
          bottomText: 'Yielding Ledger Yield',
          badge: true,
          badgeColor: stats.netProfit >= 0 ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white',
        };
      case 'dueBalance':
        return {
          value: `৳${stats.dueBalance.toLocaleString()}`,
          subText: 'গ্রাহকদের মোট বাকি বা বকেয়া',
          bottomText: `${stats.pendingInvoicesCount} ${t('pending_invoices_status')}`,
          badge: true,
          badgeColor: 'bg-rose-500/25 text-rose-300',
          badgeLabel: '● Pending Review',
        };
      case 'totalUsers':
        return {
          value: `${totalUsersCount} জন`,
          subText: 'অ্যাক্টিভ গ্রাহক তালিকা সংখ্যা',
          bottomText: 'Database Users list',
          avatars: true,
        };
      case 'todayPending':
        return {
          value: `${todayPendingPaymentsCount} টি`,
          subText: `আজকের পেন্ডিং পেমেন্ট (৳${todayPendingPaymentsAmount.toLocaleString()})`,
          bottomText: 'পেমেন্ট অনুমোদনের অপেক্ষা',
          iconAlert: true,
        };
      case 'todayRevenue':
        return {
          value: `৳${todayCollectedRevenue.toLocaleString()}`,
          subText: 'আজকের সর্বমোট কালেকশন',
          bottomText: "Today's Approved/Paid Revenue",
          indicator: 'bg-emerald-500',
        };
      case 'activeDecoders':
        return {
          value: `${allDecoders.length} টি`,
          subText: 'মোট সক্রিয় ডিকোডার সংযোগসমূহ',
          bottomText: 'Decoder Licenses Count',
          indicator: 'bg-amber-500',
        };
      case 'activePanels':
        return {
          value: `${allPanels.length} টি`,
          subText: 'সক্রিয় রিসেলার প্যানেলসমূহ',
          bottomText: 'Reseller Panels Pack Count',
          indicator: 'bg-indigo-500',
        };
      case 'activeApps':
        return {
          value: `${allApps.length} টি`,
          subText: 'তৈরিকৃত মোট অ্যান্ড্রয়েড অ্যাপ',
          bottomText: 'Client-built Applications List',
          indicator: 'bg-purple-500',
        };
      default:
        return {
          value: 'N/A',
          subText: '',
          bottomText: '',
        };
    }
  };

  // Sync customer SMS logs
  const [allSmsLogs, setAllSmsLogs] = useState<any[]>(() => {
    try {
      const cached = localStorage.getItem('cached_dashboard_all_sms_logs');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  useEffect(() => {
    if (user) {
      const unsubSms = subscribeToCollection<any>('sms_logs', (list) => {
        setAllSmsLogs(list);
        try {
          localStorage.setItem('cached_dashboard_all_sms_logs', JSON.stringify(list));
        } catch (e) {
          console.error(e);
        }
      });
      return () => {
        unsubSms && unsubSms();
      };
    }
  }, [user]);

  // Compute filtered SMS logs for the current logged-in client
  const mySmsLogs = React.useMemo(() => {
    if (!currentUserData) return [];
    const clientPhone = currentUserData.phone || '';
    const clientName = currentUserData.name || '';
    const clientUsername = currentUserData.username || '';
    
    const cleanPhone = (p: string) => p.replace(/\D/g, '').slice(-10);
    const targetCleanPhone = cleanPhone(clientPhone);

    return allSmsLogs.filter(log => {
      if (log.recipientPhone && targetCleanPhone && cleanPhone(log.recipientPhone) === targetCleanPhone) {
        return true;
      }
      if (log.recipientName && (
        log.recipientName.toLowerCase().trim() === clientName.toLowerCase().trim() ||
        log.recipientName.toLowerCase().trim() === clientUsername.toLowerCase().trim()
      )) {
        return true;
      }
      return false;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [allSmsLogs, currentUserData]);

  // User receipt preview/download states
  const [selectedUserInvoice, setSelectedUserInvoice] = useState<Invoice | null>(null);
  const [showInvoicePreviewModal, setShowInvoicePreviewModal] = useState(false);
  const [isUserGeneratingPdf, setIsUserGeneratingPdf] = useState(false);
  const [clientInvoiceSearch, setClientInvoiceSearch] = useState('');
  const [clientInvoiceStatusFilter, setClientInvoiceStatusFilter] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');

  const handleClientPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setClientPassError('');
    setClientPassSuccess('');

    const currentPassFromDb = (currentUserData?.password || user?.password || '').trim();

    if (currentPassFromDb && clientCurrentPassword.trim() !== currentPassFromDb) {
      setClientPassError('বর্তমান পাসওয়ার্ডটি সঠিক নয় (Current password is incorrect)');
      return;
    }

    if (clientNewPassword.trim() !== clientConfirmPassword.trim()) {
      setClientPassError('নতুন পাসওয়ার্ড দুটি মেলেনি (New passwords do not match)');
      return;
    }

    if (clientNewPassword.trim().length < 6) {
      setClientPassError('পাসওয়ার্ডটি কমপক্ষে ৬ অক্ষরের হতে হবে (Password must be at least 6 characters)');
      return;
    }

    setIsClientPassSaving(true);
    try {
      const userId = currentUserData?.id || user?.id;
      if (!userId) {
        throw new Error('User session not found');
      }

      const trimmedNewPassword = clientNewPassword.trim();
      await updateDocument<User>('users', userId, { password: trimmedNewPassword });

      if (user) {
        const updatedLocalUser = { ...user, password: trimmedNewPassword };
        localStorage.setItem('master_user', safeStringify(updatedLocalUser));
      }

      setClientPassSuccess('পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে! (Password updated successfully!)');
      setClientCurrentPassword('');
      setClientNewPassword('');
      setClientConfirmPassword('');
      setTimeout(() => setClientPassSuccess(''), 4000);
    } catch (err: any) {
      setClientPassError('পাসওয়ার্ড পরিবর্তন করতে ব্যর্থ হয়েছে। দয়া করে আবার চেষ্টা করুন।');
    } finally {
      setIsClientPassSaving(false);
    }
  };

  const handleUserPreviewInvoice = (inv: Invoice) => {
    setSelectedUserInvoice(inv);
    setShowInvoicePreviewModal(true);
  };

  const handleUserDownloadInvoice = async (inv: Invoice) => {
    if (isUserGeneratingPdf) return;
    setIsUserGeneratingPdf(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const elementId = `user-invoice-preview-${inv.id}`;
      const element = document.getElementById(elementId);
      if (!element) throw new Error('Preview element not found');

      const imgData = await toPng(element, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: 'a4'
      });

      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`invoice-${inv.id?.substring(0, 8) || 'receipt'}.pdf`);
    } catch (err) {
      console.error(err);
      alert('PDF ডাউনলোড করতে সমস্যা হয়েছে।');
    } finally {
      setIsUserGeneratingPdf(false);
    }
  };

  const handleApproveRequest = async (invoice: Invoice) => {
    setIsProcessingApproval(invoice.id);
    const hasDue = invoice.dueAmount && invoice.dueAmount > 0;
    const approveStatus = hasDue ? 'overdue' : 'paid';
    const finalPaidAmount = hasDue ? (invoice.paidAmount ?? 0) : invoice.amount;
    const finalDueAmount = hasDue ? invoice.dueAmount : 0;

    try {
      // 1. Update invoice status to 'overdue' or 'paid' (approved) and preserve actual values
      await updateInvoice(invoice.id, {
        status: approveStatus,
        paidAmount: finalPaidAmount,
        dueAmount: finalDueAmount,
        cashierName: settings.signatureName || 'Admin Approved',
        note: (invoice.note || '') + ` [APPROVED BY DASHBOARD AS ${approveStatus.toUpperCase()}]`
      });

      // 2. See if there is a matching user to auto-approve their account
      if (invoice.username) {
        const matchingUser = allUsers.find(
          u => u.username?.trim().toLowerCase() === invoice.username?.trim().toLowerCase()
        );

        if (matchingUser) {
          // Calculate new financial details for the user
          const parsedAmount = finalPaidAmount;
          const currentPaid = Number(matchingUser.paidAmount) || 0;
          const totalPaid = currentPaid + parsedAmount;
          const userPrice = Number(matchingUser.price) || 0;
          const newDue = Math.max(0, userPrice - totalPaid);

          await updateDocument<User>('users', matchingUser.id, {
            status: 'approved',
            paidAmount: totalPaid,
            dueAmount: newDue
          });
        }
      }

      // 3. Auto-provision the requested item depending on billing purpose / invoice.type
      if (invoice.username) {
        if (invoice.type === 'Android App Purchase' && invoice.appName) {
          await createDocument('apps', {
            name: invoice.appName,
            packageName: invoice.packageName || 'dev.masterbuild.' + invoice.appName.toLowerCase().replace(/\s+/g, ''),
            protocol: invoice.protocol || 'Default',
            appType: invoice.appsTrying === 'Free apps' ? 'Free' : 'Paid',
            category: 'Approved APP',
            status: 'active',
            price: Number(invoice.amount) || 0,
            username: invoice.username,
            appsQuality: invoice.appsQuality || 'Normal security',
            appsTrying: invoice.appsTrying || 'Paid apps',
            appWorkType: invoice.appWorkType || 'New app',
            note: `Approved via purchase invoice request #${invoice.id.substring(0, 8).toUpperCase()}. Approved on ${new Date().toLocaleDateString()}`
          });
        } else if (invoice.type === 'Reseller Panel Purchase' && invoice.panelName) {
          await createDocument('panels', {
            name: invoice.panelName,
            url: invoice.panelUrl || '',
            region: invoice.region || 'Default',
            duration: invoice.panelDuration || '1 month',
            price: Number(invoice.amount) || 0,
            panelType: invoice.panelType === 'Panel Rent' ? 'Rent' : 'New',
            tier: 'basic',
            status: 'active',
            username: invoice.username,
            note: `Approved via panel invoice request #${invoice.id.substring(0, 8).toUpperCase()}. Approved on ${new Date().toLocaleDateString()}`
          });
        } else if (invoice.type === 'Decoder License Purchase' && invoice.decoderUsername) {
          const randomSerial = 'DEC-' + Math.random().toString(36).substring(2, 10).toUpperCase();
          await createDocument('decoders', {
            model: 'Decoder Premium System',
            serialNumber: randomSerial,
            username: invoice.decoderUsername,
            duration: invoice.decoderDuration || '1 month',
            price: Number(invoice.amount) || 0,
            status: 'online',
            clientUsername: invoice.username, // keep track of whose username requested it
            note: `Approved via decoder invoice request #${invoice.id.substring(0, 8).toUpperCase()}. Approved on ${new Date().toLocaleDateString()}`
          });
        }
      }

      // Find matching user and get updated budget metrics to pass to notification templates
      const matchingUser = invoice.username ? allUsers.find(
        u => u.username?.trim().toLowerCase() === invoice.username?.trim().toLowerCase()
      ) : null;

      let updatedUser = matchingUser ? { ...matchingUser } : null;
      if (updatedUser) {
        const parsedAmount = finalPaidAmount;
        const currentPaid = Number(matchingUser?.paidAmount) || 0;
        const totalPaid = currentPaid + parsedAmount;
        const userPrice = Number(matchingUser?.price) || 0;
        const newDue = Math.max(0, userPrice - totalPaid);
        updatedUser.paidAmount = totalPaid;
        updatedUser.dueAmount = newDue;
      }

      // Also update the local state of the invoice passed to the WhatsApp/Email template preview
      const updatedInvoiceForNotification = {
        ...invoice,
        status: approveStatus,
        paidAmount: finalPaidAmount,
        dueAmount: finalDueAmount,
      };

      setApprovedNotificationModal({
        isOpen: true,
        invoice: updatedInvoiceForNotification,
        user: updatedUser
      });
    } catch (err) {
      console.error(err);
      alert('অনুমোদন করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setIsProcessingApproval(null);
    }
  };

  const handleRejectRequest = async (invoice: Invoice) => {
    if (!window.confirm(`আপনি কি এই রিকোয়েস্টটি প্রত্যাখ্যান করতে চান?`)) return;
    setIsProcessingApproval(invoice.id);
    try {
      await updateInvoice(invoice.id, {
        status: 'rejected',
        dueAmount: 0,
        paidAmount: 0,
        note: (invoice.note || '') + ' [REJECTED BY DASHBOARD]'
      });
      alert(`রিকোয়েস্ট #${invoice.id.substring(0, 8).toUpperCase()} প্রত্যাখ্যান করা হয়েছে।`);
    } catch (err) {
      console.error(err);
      alert('প্রত্যাখ্যান করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setIsProcessingApproval(null);
    }
  };

  useEffect(() => {
    const unsubInvoices = subscribeToInvoices((data) => {
      const sorted = [...data].sort((a, b) => {
        const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        return bTime - aTime;
      });
      setInvoices(sorted);
      try {
        localStorage.setItem('cached_dashboard_invoices', JSON.stringify(sorted));
      } catch (e) {
        console.error(e);
      }
    }, 200);

    const unsubInvestments = subscribeToCollection<Investment>('investments', (list) => {
      setInvestments(list);
      try {
        localStorage.setItem('cached_dashboard_investments', JSON.stringify(list));
      } catch (e) {
        console.error(e);
      }
    }, 'date');

    const unsubActivities = subscribeToCollection<ActivityLog>('activities', (logs) => {
      const top10 = logs.slice(0, 10);
      setActivities(top10); // Top 10 activities
      try {
        localStorage.setItem('cached_dashboard_activities', JSON.stringify(top10));
      } catch (e) {
        console.error(e);
      }
    }, 'timestamp', 25);

    const unsubSettings = subscribeToSettings((updatedSettings) => {
      setSettings(updatedSettings);
      try {
        localStorage.setItem('cached_dashboard_settings', JSON.stringify(updatedSettings));
      } catch (e) {
        console.error(e);
      }
    });

    return () => {
      unsubInvoices && unsubInvoices();
      unsubInvestments && unsubInvestments();
      unsubActivities && unsubActivities();
      unsubSettings && unsubSettings();
    };
  }, []);

  // Sync current user states live from Firebase Users
  useEffect(() => {
    if (user) {
      const unsubscribe = subscribeToCollection<any>('users', (usersList) => {
        const found = usersList.find(u => u.username === user.username);
        let updatedUser = user;
        if (found) {
          setCurrentUserData(found);
          updatedUser = found;
        } else {
          setCurrentUserData(user);
        }
        setTotalUsersCount(usersList.length);
        setAllUsers(usersList);

        try {
          localStorage.setItem('cached_dashboard_current_user_data', JSON.stringify(updatedUser));
          localStorage.setItem('cached_dashboard_total_users_count', String(usersList.length));
          localStorage.setItem('cached_dashboard_all_users', JSON.stringify(usersList));
        } catch (e) {
          console.error(e);
        }
      });
      return () => {
        unsubscribe && unsubscribe();
      };
    }
  }, [user]);

  // Sync my active tool/assets from database
  useEffect(() => {
    if (user) {
      const unsubApps = subscribeToCollection<any>('apps', (list) => {
        const filtered = list.filter(item => item.username === user.username);
        setMyApps(filtered);
        try {
          localStorage.setItem('cached_dashboard_my_apps', JSON.stringify(filtered));
        } catch (e) {
          console.error(e);
        }
      }, 'name');
      const unsubDecoders = subscribeToCollection<any>('decoders', (list) => {
        const filtered = list.filter(item => item.username === user.username);
        setMyDecoders(filtered);
        try {
          localStorage.setItem('cached_dashboard_my_decoders', JSON.stringify(filtered));
        } catch (e) {
          console.error(e);
        }
      }, 'name');
      const unsubPanels = subscribeToCollection<any>('panels', (list) => {
        const filtered = list.filter(item => item.username === user.username);
        setMyPanels(filtered);
        try {
          localStorage.setItem('cached_dashboard_my_panels', JSON.stringify(filtered));
        } catch (e) {
          console.error(e);
        }
      }, 'name');

      return () => {
        unsubApps && unsubApps();
        unsubDecoders && unsubDecoders();
        unsubPanels && unsubPanels();
      };
    }
  }, [user]);

  const getPanelPrice = (duration: string) => {
    switch (duration) {
      case '1 month': return Number(settings?.panelPrice1m) || 1300;
      case '2 month': return Number(settings?.panelPrice2m) || 2600;
      case '3 month': return Number(settings?.panelPrice3m) || 3900;
      case '4 month': return Number(settings?.panelPrice4m) || 5200;
      case '5 month': return Number(settings?.panelPrice5m) || 6500;
      case '6 month': return Number(settings?.panelPrice6m) || 7800;
      case '12 month': return Number(settings?.panelPrice12m) || 15600;
      default: return 0;
    }
  };

  const getDecoderPrice = (duration: string) => {
    switch (duration) {
      case '1 month': return Number(settings?.decoderPrice1m) || 1500;
      case '2 month': return Number(settings?.decoderPrice2m) || 2500;
      case '3 month': return Number(settings?.decoderPrice3m) || 3500;
      case '4 month': return Number(settings?.decoderPrice4m) || 4500;
      case '5 month': return Number(settings?.decoderPrice5m) || 5500;
      case '6 month': return Number(settings?.decoderPrice6m) || 6500;
      case '12 month': return Number(settings?.decoderPrice12m) || 8600;
      default: return 0;
    }
  };

  const isFormValid = (() => {
    if (!topUpPurpose) return false;
    if (!topUpMethod) return false;
    if (!topUpAmount || Number(topUpAmount) <= 0) return false;
    if (!topUpTxn.trim()) return false;

    if (topUpPurpose === 'Android App Purchase') {
      if (!ticketAppName.trim() || !ticketAppPackageName.trim() || !ticketAppProtocol || !ticketAppQuality || !ticketAppType || !ticketAppWorkType) {
        return false;
      }
    } else if (topUpPurpose === 'Reseller Panel Purchase') {
      if (!ticketPanelName || !ticketPanelUrl.trim() || !ticketPanelDuration || !ticketPanelType) {
        return false;
      }
    } else if (topUpPurpose === 'Decoder License Purchase') {
      if (!ticketDecoderUsername.trim() || !ticketDecoderUserType || !ticketDecoderDuration) {
        return false;
      }
    } else if (['Binance $ Purchase', 'Redotpay $ Purchase', 'Facebook Boost', 'Banner Making', 'Logo Making', 'Others / Etc'].includes(topUpPurpose)) {
      if (!ticketServiceDetails.trim()) {
        return false;
      }
    }
    return true;
  })();

  const handleTopUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
      const errorMsg = settings.clientPaymentErrorMessage || 'অনুগ্রহ করে পেমেন্ট করার সকল অপশন এবং প্রয়োজনীয় তথ্য সঠিকভাবে নির্বাচন/পূরণ করুন।';
      setTopUpError(errorMsg);
      return;
    }
    setIsTopUpLoading(true);
    setTopUpError('');
    setTopUpSuccess('');

    try {
      const now = new Date();
      const backupTimeStr = now.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const backupInvoiceDate = now.toISOString().split('T')[0];

      const finalInvoiceNumber = clientInvoiceNumber || `INV-${Math.floor(100000 + Math.random() * 900000)}`;
      const finalDate = clientInvoiceDate || backupInvoiceDate;
      const finalTimeStr = clientInvoiceTime || backupTimeStr;
      const fullDate = `${finalDate} ${finalTimeStr}`;

      const isAppPurchase = topUpPurpose === 'Android App Purchase';
      const appNameVal = isAppPurchase ? ticketAppName : '';
      const packageNameVal = isAppPurchase ? ticketAppPackageName : '';
      const protocolVal = isAppPurchase ? ticketAppProtocol : '';
      const appsQualityVal = isAppPurchase ? (ticketAppQuality as any) : undefined;
      const appsTryingVal = isAppPurchase ? (ticketAppType as any) : undefined;
      const appWorkTypeVal = isAppPurchase ? (ticketAppWorkType as any) : undefined;

      const isPanelPurchase = topUpPurpose === 'Reseller Panel Purchase';
      const panelNameVal = isPanelPurchase ? ticketPanelName : '';
      const panelUrlVal = isPanelPurchase ? ticketPanelUrl : '';
      const panelDurationVal = isPanelPurchase ? ticketPanelDuration : '';
      const panelTypeVal = isPanelPurchase ? ticketPanelType : '';

      const isDecoderPurchase = topUpPurpose === 'Decoder License Purchase';
      const decoderUsernameVal = isDecoderPurchase ? ticketDecoderUsername : '';
      const decoderUserTypeVal = isDecoderPurchase ? (ticketDecoderUserType as any) : undefined;
      const decoderDurationVal = isDecoderPurchase ? ticketDecoderDuration : '';

      const isOtherService = ['Binance $ Purchase', 'Redotpay $ Purchase', 'Facebook Boost', 'Banner Making', 'Logo Making', 'Others / Etc'].includes(topUpPurpose);
      const serviceDetailsVal = isOtherService ? ticketServiceDetails : '';

      const extraNoteSuffix = isAppPurchase 
        ? `\n[App Name: ${appNameVal}, Package: ${packageNameVal}, Protocol: ${protocolVal}, Quality: ${appsQualityVal}, Type: ${appsTryingVal}, Work: ${appWorkTypeVal}]` 
        : isPanelPurchase
        ? `\n[Panel Name: ${panelNameVal}, URL: ${panelUrlVal}, Duration: ${panelDurationVal}, Type: ${panelTypeVal}]`
        : isDecoderPurchase
        ? `\n[Decoder User: ${decoderUsernameVal}, Type: ${decoderUserTypeVal}, Duration: ${decoderDurationVal}]`
        : isOtherService
        ? `\n[Service Details: ${serviceDetailsVal}]`
        : '';

      const finalPaidAmount = ticketPaidAmount ? (Number(ticketPaidAmount) || 0) : (Number(topUpAmount) || 0);
      const finalDueAmount = ticketDueAmount ? (Number(ticketDueAmount) || 0) : 0;

      // Build dynamic items list to show individual rows inside the invoice item description
      const totalAmt = Number(topUpAmount) || 0;
      let generatedItems: { description: string; quantity: number; price: number }[] = [];

      if (isAppPurchase) {
        generatedItems = [
          { description: `APP: ${appNameVal.toUpperCase()}`, quantity: 1, price: totalAmt },
          { description: `PACKAGE: ${packageNameVal || 'N/A'}`, quantity: 1, price: 0 },
          { description: `WORK: ${appWorkTypeVal || 'N/A'}`, quantity: 1, price: 0 },
          { description: `PROTOCOL: ${protocolVal || 'N/A'}`, quantity: 1, price: 0 },
          { description: `QUALITY: ${appsQualityVal || 'N/A'}`, quantity: 1, price: 0 },
          { description: `TYPE: ${appsTryingVal || 'N/A'}`, quantity: 1, price: 0 },
          { description: `REGION: ${currentUserData?.region || 'BANGLADESH'}`, quantity: 1, price: 0 }
        ].filter(item => !item.description.includes('N/A'));
      } else if (isPanelPurchase) {
        generatedItems = [
          { description: `PANEL: ${panelNameVal.toUpperCase()}`, quantity: 1, price: totalAmt },
          { description: `URL: ${panelUrlVal || 'N/A'}`, quantity: 1, price: 0 },
          { description: `REGION: ${currentUserData?.region || 'BANGLADESH'}`, quantity: 1, price: 0 },
          { description: `DURATION: ${panelDurationVal || 'N/A'}`, quantity: 1, price: 0 },
          { description: `TYPE: ${panelTypeVal || 'N/A'}`, quantity: 1, price: 0 }
        ].filter(item => !item.description.includes('N/A'));
      } else if (isDecoderPurchase) {
        generatedItems = [
          { description: `DECODER USER: ${decoderUsernameVal.toUpperCase()}`, quantity: 1, price: totalAmt },
          { description: `REGION: ${currentUserData?.region || 'BANGLADESH'}`, quantity: 1, price: 0 },
          { description: `DURATION: ${decoderDurationVal || 'N/A'}`, quantity: 1, price: 0 },
          { description: `TYPE: ${decoderUserTypeVal || 'N/A'}`, quantity: 1, price: 0 }
        ].filter(item => !item.description.includes('N/A'));
      } else if (isOtherService) {
        generatedItems = [
          { description: `${topUpPurpose.toUpperCase()}`, quantity: 1, price: totalAmt },
          { description: `DETAILS: ${serviceDetailsVal || 'N/A'}`, quantity: 1, price: 0 },
          { description: `REGION: ${currentUserData?.region || 'BANGLADESH'}`, quantity: 1, price: 0 }
        ].filter(item => !item.description.includes('N/A'));
      } else {
        generatedItems = [
          { description: `WALLET RECHARGE / TOP-UP: ${topUpPurpose || 'Wallet Credit'}`, quantity: 1, price: totalAmt },
          { description: `REGION: ${currentUserData?.region || 'BANGLADESH'}`, quantity: 1, price: 0 }
        ];
      }

      if (resubmittingInvoiceId) {
        const origInv = myRejectedInvoices.find(i => i.id === resubmittingInvoiceId);
        const originalNotes = origInv?.note || '';
        const correctionNote = `[সংশোধিত পেমেন্ট রিকোয়েস্ট: নতুন TxID: ${topUpTxn} • পরিমাণ: ৳${topUpAmount} • মেথড: ${topUpMethod}]`;
        const updatedNotes = originalNotes 
          ? `${originalNotes}\n${correctionNote}` 
          : `পেমেন্ট উদ্দেশ্য: ${topUpPurpose}. কাস্টমার ওয়ালেট টপ-আপ রিকোয়েস্ট সংশোধন${extraNoteSuffix}\n${correctionNote}`;

        await updateInvoice(resubmittingInvoiceId, {
          amount: Number(topUpAmount) || 0,
          paidAmount: finalPaidAmount,
          dueAmount: finalDueAmount,
          status: 'pending',
          date: finalDate,
          method: topUpMethod,
          paymentMethod: topUpMethod,
          transactionId: topUpTxn,
          note: updatedNotes,
          type: topUpPurpose,
          items: generatedItems,
          appName: appNameVal || undefined,
          packageName: packageNameVal || undefined,
          protocol: protocolVal || undefined,
          appsQuality: appsQualityVal || undefined,
          appsTrying: appsTryingVal || undefined,
          appWorkType: appWorkTypeVal || undefined,
          panelName: panelNameVal || undefined,
          panelUrl: panelUrlVal || undefined,
          panelDuration: panelDurationVal || undefined,
          panelType: panelTypeVal || undefined,
          decoderUsername: decoderUsernameVal || undefined,
          decoderUserType: decoderUserTypeVal || undefined,
          decoderDuration: decoderDurationVal || undefined,
          serviceDetails: serviceDetailsVal || undefined
        });

        setMyRejectedInvoices(prev => prev.filter(i => i.id !== resubmittingInvoiceId));
        setResubmittingInvoiceId(null);
      } else {
        await createInvoice({
          id: finalInvoiceNumber,
          customerName: currentUserData?.name || user?.name || 'Customer',
          username: currentUserData?.username || user?.username,
          amount: Number(topUpAmount) || 0,
          paidAmount: finalPaidAmount,
          dueAmount: finalDueAmount,
          status: 'pending',
          date: finalDate,
          createdAt: fullDate,
          phone: currentUserData?.phone || '',
          customerNumber: currentUserData?.phone ? `+88 ${currentUserData.phone}` : 'N/A',
          method: topUpMethod,
          paymentMethod: topUpMethod, // standard
          transactionId: topUpTxn,
          note: `পেমেন্ট উদ্দেশ্য: ${topUpPurpose}. কাস্টমার ওয়ালেট টপ-আপ রিকোয়েস্ট ভেরিফিকেশন${extraNoteSuffix}`,
          type: topUpPurpose, // standard type
          items: generatedItems, // standard schema items
          appName: appNameVal || undefined,
          packageName: packageNameVal || undefined,
          protocol: protocolVal || undefined,
          appsQuality: appsQualityVal || undefined,
          appsTrying: appsTryingVal || undefined,
          appWorkType: appWorkTypeVal || undefined,
          panelName: panelNameVal || undefined,
          panelUrl: panelUrlVal || undefined,
          panelDuration: panelDurationVal || undefined,
          panelType: panelTypeVal || undefined,
          decoderUsername: decoderUsernameVal || undefined,
          decoderUserType: decoderUserTypeVal || undefined,
          decoderDuration: decoderDurationVal || undefined,
          serviceDetails: serviceDetailsVal || undefined
        });

        setMyInvoices(prev => [{
          id: finalInvoiceNumber,
          customerName: currentUserData?.name || user?.name || 'Customer',
          username: currentUserData?.username || user?.username,
          amount: Number(topUpAmount) || 0,
          paidAmount: finalPaidAmount,
          dueAmount: finalDueAmount,
          status: 'pending',
          date: finalDate,
          createdAt: fullDate,
          phone: currentUserData?.phone || '',
          customerNumber: currentUserData?.phone ? `+88 ${currentUserData.phone}` : 'N/A',
          method: topUpMethod,
          paymentMethod: topUpMethod,
          type: topUpPurpose,
          transactionId: topUpTxn,
          note: `পেমেন্ট উদ্দেশ্য: ${topUpPurpose}. কাস্টমার ওয়ালেট টপ-আপ রিকোয়েস্ট ভেরিফিকেশন${extraNoteSuffix}`,
          items: generatedItems,
          appName: appNameVal || undefined,
          packageName: packageNameVal || undefined,
          protocol: protocolVal || undefined,
          appsQuality: appsQualityVal || undefined,
          appsTrying: appsTryingVal || undefined,
          appWorkType: appWorkTypeVal || undefined,
          panelName: panelNameVal || undefined,
          panelUrl: panelUrlVal || undefined,
          panelDuration: panelDurationVal || undefined,
          panelType: panelTypeVal || undefined,
          decoderUsername: decoderUsernameVal || undefined,
          decoderUserType: decoderUserTypeVal || undefined,
          decoderDuration: decoderDurationVal || undefined,
          serviceDetails: serviceDetailsVal || undefined
        } as any, ...prev]);
      }

      const successTemplate = settings.clientPaymentSuccessMessage || 'পেমেন্ট রিকোয়েস্ট ("{purpose}") এডমিনের কাছে জমা হয়েছে! এডমিন শীঘ্রই এটি ভেরিফাই করে ব্যালেন্স আপডেট করে দেবেন।';
      const resolvedSuccess = successTemplate.replace('{purpose}', topUpPurpose);
      setTopUpSuccess(resolvedSuccess);

      // Save submission details for Step 3 Success screen
      const feesMap: Record<string, number> = {
        bKash: 1.85,
        Nagad: 1.50,
        Upay: 1.40,
        Rocket: 1.80,
        Mcash: 1.50
      };
      const activeFeePercent = feesMap[topUpMethod] || 0;
      const computedCharge = (Number(topUpAmount) * activeFeePercent) / 100;
      const computedTotal = (Number(topUpAmount) || 0) + computedCharge;

      setLastSubmittedInvoice({
        invoiceNumber: finalInvoiceNumber,
        amount: Number(topUpAmount) || 0,
        feePercent: activeFeePercent,
        chargeAmount: computedCharge,
        totalAmount: computedTotal,
        method: topUpMethod,
        transactionId: topUpTxn,
        date: `${finalDate} ${finalTimeStr}`,
        purpose: topUpPurpose,
      });

      setPaymentWizardStep(3);

      generateNewInvoiceMeta(); // Auto-change the invoice number for the next submit ticket!
      setTopUpAmount('');
      setTicketPaidAmount('');
      setTicketDueAmount('');
      setTopUpTxn('');
      setTicketAppName('');
      setTicketAppPackageName('dev.masterbuild.');
      setTicketAppWorkType('New app');
      setTicketPanelName('administer');
      setTicketPanelUrl('');
      setTicketPanelDuration('1 month');
      setTicketPanelType('New panel');
      setTicketDecoderUsername('');
      setTicketDecoderUserType('New user');
      setTicketDecoderDuration('1 month');
      setTicketServiceDetails('');
    } catch (err) {
      setTopUpError('রিকোয়েস্ট প্রেরণে ব্যর্থ হয়েছে। দয়া করে আবার চেষ্টা করুন।');
    } finally {
      setIsTopUpLoading(false);
    }
  };

  // State hook for dynamic client invoices preview
  const [myInvoices, setMyInvoices] = useState<any[]>([]);
  const [myRejectedInvoices, setMyRejectedInvoices] = useState<any[]>([]);
  useEffect(() => {
    if (user) {
      // Exclude 'rejected' invoices from the customer invoices list view entirely
      setMyInvoices(invoices.filter(inv => inv.username === user.username && inv.status !== 'rejected'));
      // Include ONLY 'rejected' invoices in the customer rejected invoices list view
      setMyRejectedInvoices(invoices.filter(inv => inv.username === user.username && inv.status === 'rejected'));
    }
  }, [user, invoices]);

  const stats = React.useMemo(() => {
    const activeInvoices = invoices.filter(inv => inv.status !== 'rejected');
    const paidInvoices = invoices.filter(inv => inv.status === 'paid' || inv.status === 'approved');
    const totalRevenue = paidInvoices.reduce((sum, inv) => sum + (inv.paidAmount || inv.amount || 0), 0);
    const dueBalance = activeInvoices.reduce((sum, inv) => sum + (inv.dueAmount || 0), 0);
    const totalInvestment = investments.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    const pendingInvoicesCount = activeInvoices.filter(inv => inv.status === 'pending' || inv.status === 'overdue').length;

    return {
      totalRevenue,
      dueBalance,
      totalInvestment,
      netProfit: totalRevenue - totalInvestment,
      pendingInvoicesCount
    };
  }, [invoices, investments]);

  // Integrated Services Breakthrough & Category Contribution
  const salesBreakdown = React.useMemo(() => {
    let appsTotal = 0;
    let panelsTotal = 0;
    let decodersTotal = 0;
    let topupsTotal = 0;

    const paidInvoices = invoices.filter(inv => inv.status === 'paid' || inv.status === 'approved');
    paidInvoices.forEach(inv => {
      const amount = inv.paidAmount || inv.amount || 0;
      if (inv.type === 'Android App Purchase' || inv.appName) {
        appsTotal += amount;
      } else if (inv.type === 'Reseller Panel Purchase' || inv.panelName) {
        panelsTotal += amount;
      } else if (inv.type === 'Decoder License Purchase' || inv.decoderUsername) {
        decodersTotal += amount;
      } else {
        topupsTotal += amount;
      }
    });

    const grandTotal = appsTotal + panelsTotal + decodersTotal + topupsTotal || 1; // avoid division by zero
    
    return [
      { name: 'Android Apps', bangla: 'অ্যান্ড্রয়েড অ্যাপ্লিকেশন্স', value: appsTotal, percentage: Math.round((appsTotal / grandTotal) * 100), color: 'bg-blue-500', textClassName: 'text-blue-500' },
      { name: 'Reseller Panels', bangla: 'রিসেলার প্যানেল প্যাক', value: panelsTotal, percentage: Math.round((panelsTotal / grandTotal) * 100), color: 'bg-violet-500', textClassName: 'text-violet-500' },
      { name: 'Decoder Licenses', bangla: 'ডিকোডার লাইসেন্সসমূহ', value: decodersTotal, percentage: Math.round((decodersTotal / grandTotal) * 100), color: 'bg-emerald-500', textClassName: 'text-emerald-500' },
      { name: 'Wallet Top-ups', bangla: 'ওয়ালেট রিচার্জ ও টপ-আপ', value: topupsTotal, percentage: Math.round((topupsTotal / grandTotal) * 100), color: 'bg-amber-500', textClassName: 'text-amber-500' },
    ];
  }, [invoices]);

  // Integrated Dashboard Company Health Index Score
  const healthScore = React.useMemo(() => {
    const rev = stats.totalRevenue || 0;
    const due = stats.dueBalance || 0;
    if (rev === 0 && due === 0) return 100;
    const ratio = rev / (rev + due || 1);
    return Math.max(15, Math.min(100, Math.round(ratio * 100)));
  }, [stats]);

  const dailyRevenueData = React.useMemo(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonthNum = today.getMonth(); // 0-indexed
    
    // Format current month prefix (e.g. "2026-06")
    const yearStr = currentYear.toString();
    const monthStr = String(currentMonthNum + 1).padStart(2, '0');
    const currentMonthPrefix = `${yearStr}-${monthStr}`;

    // Get number of days in the current month
    const daysInMonth = new Date(currentYear, currentMonthNum + 1, 0).getDate();

    // Initialize daily revenue map
    const dailyMap: Record<number, number> = {};
    for (let d = 1; d <= daysInMonth; d++) {
      dailyMap[d] = 0;
    }

    // Filter, process and accumulate paid invoices of current month
    invoices.forEach(inv => {
      if (inv.status === 'paid' || inv.status === 'approved') {
        const invDateStr = inv.date; // "YYYY-MM-DD"
        if (invDateStr && invDateStr.startsWith(currentMonthPrefix)) {
          const parts = invDateStr.split('-');
          const dayVal = parseInt(parts[2], 10);
          if (dayVal >= 1 && dayVal <= daysInMonth) {
            const revenue = inv.paidAmount || inv.amount || 0;
            dailyMap[dayVal] += revenue;
          }
        }
      }
    });

    const monthNamesEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthNamesBng = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
    const currentMonthName = monthNamesEn[currentMonthNum];
    const currentMonthNameBng = monthNamesBng[currentMonthNum];
    
    let cumulative = 0;
    let peakDay = 0;
    let peakDayAmount = 0;
    let activeDaysCount = 0;

    const chartData = Array.from({ length: daysInMonth }, (_, idx) => {
      const dayNum = idx + 1;
      const val = dailyMap[dayNum];
      cumulative += val;
      if (val > peakDayAmount) {
        peakDayAmount = val;
        peakDay = dayNum;
      }
      if (val > 0) {
        activeDaysCount++;
      }
      return {
        day: `${dayNum}`,
        revenue: val,
        cumulative: cumulative,
        profit: Math.round(val * 0.85), // Estimated 85% profit margin
        fullDate: `${yearStr}-${monthStr}-${String(dayNum).padStart(2, '0')}`
      };
    });

    const currentMonthTotal = cumulative;
    const averageRevenue = activeDaysCount > 0 ? Math.round(currentMonthTotal / activeDaysCount) : 0;
    const overallDailyAverage = Math.round(currentMonthTotal / daysInMonth);

    return {
      monthName: currentMonthName,
      monthNameBng: currentMonthNameBng,
      year: currentYear,
      data: chartData,
      total: currentMonthTotal,
      peakDay,
      peakDayAmount,
      activeDaysCount,
      averageRevenue,
      overallDailyAverage
    };
  }, [invoices]);

  const handleCreateSuccess = async (data: any) => {
    const collectionMap: Record<string, string> = {
      'app': 'apps',
      'decoder': 'decoders',
      'panel': 'panels',
      'user': 'users'
    };
    
    if (activeModal && collectionMap[activeModal]) {
      const entityData = { ...data };
      delete entityData.id;
      await createDocument(collectionMap[activeModal], entityData);
    }
    setActiveModal(null);
  };

  const isAdmin = currentUserData?.role === 'admin' || user?.role === 'admin';

  // Filter invoices related to this logged-in account
  const userInvoicesList = React.useMemo(() => {
    const targetUsername = currentUserData?.username || user?.username;
    if (!targetUsername) return [];
    return invoices.filter(inv => inv.username === targetUsername);
  }, [invoices, currentUserData?.username, user?.username]);

  // Calculate approved/paid invoice balance dynamically
  const approvedInvoicesBalance = React.useMemo(() => {
    return userInvoicesList
      .filter(inv => inv.status === 'paid' || inv.status === 'approved')
      .reduce((sum, inv) => sum + (inv.paidAmount || inv.amount || 0), 0);
  }, [userInvoicesList]);

  // Statistics counts representing approved, pending, and rejected invoices
  const approvedCount = React.useMemo(() => {
    return userInvoicesList.filter(inv => inv.status === 'paid' || inv.status === 'approved').length;
  }, [userInvoicesList]);

  const pendingCount = React.useMemo(() => {
    return userInvoicesList.filter(inv => inv.status === 'pending').length;
  }, [userInvoicesList]);

  const rejectedCount = React.useMemo(() => {
    return userInvoicesList.filter(inv => inv.status === 'rejected').length;
  }, [userInvoicesList]);

  // States for Selected Payment Account Channel Viewer
  const [selectedAccountTab, setSelectedAccountTab] = useState<'bKash' | 'Nagad' | 'Upay' | 'Rocket' | 'Mcash' | 'Bank' | 'Binance' | 'PayPal'>('bKash');
  const [gatewayViewStyle, setGatewayViewStyle] = useState<'mockup' | 'standard'>('mockup');
  const [paymentWizardStep, setPaymentWizardStep] = useState<number>(1);
  const [lastSubmittedInvoice, setLastSubmittedInvoice] = useState<any>(null);
  const [selectedGatewayForPayment, setSelectedGatewayForPayment] = useState<string>('bKash');

  const activeProviders = React.useMemo(() => {
    return [
      { key: 'bKash', enabled: settings?.bkashEnabled !== false },
      { key: 'Nagad', enabled: settings?.nagadEnabled !== false },
      { key: 'Upay', enabled: settings?.upayEnabled !== false },
      { key: 'Rocket', enabled: settings?.rocketEnabled !== false },
      { key: 'Mcash', enabled: settings?.mcashEnabled !== false },
      { key: 'Bank', enabled: settings?.bankEnabled !== false },
      { key: 'Binance', enabled: settings?.binanceEnabled !== false },
      { key: 'PayPal', enabled: settings?.paypalEnabled !== false },
    ].filter(p => p.enabled).map(p => p.key);
  }, [settings]);

  const totalFee = Number(currentUserData?.price) || 0;
  const paidFees = approvedInvoicesBalance;
  const dueFees = Math.max(0, totalFee - paidFees);

  if (!isAdmin) {
    return (
      <div className="space-y-6 pb-12">
        {activeSubTab === 'dashboard' && (
          <ClientDashboard
            user={user}
            currentUserData={currentUserData}
            settings={settings}
            invoices={invoices}
            myRejectedInvoices={myRejectedInvoices}
            myApps={myApps}
            myPanels={myPanels}
            myDecoders={myDecoders}
            onTabChange={onTabChange}
            handleInitiateResubmit={handleInitiateResubmit}
          />
        )}

        {/* 3. ACCOUNT OPTIONS SUB-TAB: SHOW OFFICIAL PAYMENT ACCOUNTS DIRECTLY FOR VIEW/COPY */}
        {activeSubTab === 'account' && (
          <PaymentAccounts
            settings={settings}
            onTabChange={onTabChange}
            onSelectGatewayForForm={(gateway) => setSelectedGatewayForPayment(gateway)}
          />
        )}

        {/* 4. PAYMENT FORM SUB-TAB: SUBMIT DIRECT PAYMENT REPORT FOR ANY ACTIVE GATEWAY */}
        {activeSubTab === 'payment' && (
          <PaymentWizard
            settings={settings}
            activeSubTab={activeSubTab}
            onTabChange={onTabChange}
            currentUserData={currentUserData}
            user={user}
            clientInvoiceNumber={clientInvoiceNumber}
            clientInvoiceDate={clientInvoiceDate}
            clientInvoiceTime={clientInvoiceTime}
            generateNewInvoiceMeta={generateNewInvoiceMeta}
            createInvoice={createInvoice}
            setMyInvoices={setMyInvoices}
            myRejectedInvoices={myRejectedInvoices}
            setMyRejectedInvoices={setMyRejectedInvoices}
            resubmittingInvoiceId={resubmittingInvoiceId}
            setResubmittingInvoiceId={setResubmittingInvoiceId}
            initialGateway={selectedGatewayForPayment}
          />
        )}
        				{/* 1.5 CLIENT INVOICES SUB-TAB: SHOW ACTIVE INVOICES */}
        {activeSubTab === 'invoices' && (
          <div className="bg-white border border-slate-200 rounded-[1.5rem] p-6 shadow-xs relative animate-fade-in space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <FileText size={16} className="text-indigo-650" />
                  আপনার ইনভয়েস ও রসিদ খতিয়ান (Your Invoices & Receipts)
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed font-sans mt-0.5">
                  আপনার সকল জমাকৃত পেমেন্ট রিকোয়েস্ট, ব্যালেন্স ইতিহাস ও অনুমোদিত মেম্বারশিপের বিবরণ নিচে দেখতে পারেন।
                </p>
              </div>
            </div>

            {/* Sub-tab invoice lookup filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                <input
                  type="text"
                  placeholder="ইনভয়েস আইডি, ট্রানজেকশন আইডি বা মেথড অনুসন্ধান করুন..."
                  value={clientInvoiceSearch}
                  onChange={(e) => setClientInvoiceSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-sans"
                />
              </div>
              <div className="sm:w-48">
                <select
                  value={clientInvoiceStatusFilter}
                  onChange={(e) => setClientInvoiceStatusFilter(e.target.value as any)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-755 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer font-sans"
                >
                  <option value="all">সকল স্ট্যাটাস (All Status)</option>
                  <option value="paid">অনুমোদিত/পরিশোধিত (Paid)</option>
                  <option value="pending">মূলতুবি (Pending)</option>
                  <option value="overdue">오버두 (Overdue)</option>
                </select>
              </div>
            </div>

            {/* Filtered list evaluation */}
            {(() => {
              const query = clientInvoiceSearch.toLowerCase().trim();
              const filteredList = userInvoicesList.filter(inv => {
                // Exclude 'rejected' here from regular invoices list as it is shown in the rejected_invoices tab
                if (inv.status === 'rejected') return false;

                if (clientInvoiceStatusFilter !== 'all') {
                  const s = inv.status;
                  if (clientInvoiceStatusFilter === 'paid' && s !== 'paid' && s !== 'approved') return false;
                  if (clientInvoiceStatusFilter === 'pending' && s !== 'pending') return false;
                  if (clientInvoiceStatusFilter === 'overdue' && s !== 'overdue') return false;
                }

                if (query) {
                  const idMatch = inv.id?.toLowerCase().includes(query);
                  const txnMatch = inv.transactionId?.toLowerCase().includes(query);
                  const methodMatch = (inv.paymentMethod || (inv as any).method || '').toLowerCase().includes(query);
                  const typeMatch = (inv.type || '').toLowerCase().includes(query);
                  return idMatch || txnMatch || methodMatch || typeMatch;
                }

                return true;
              });

              if (filteredList.length === 0) {
                return (
                  <div className="p-12 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                    <FileText size={42} className="mx-auto text-slate-300 mb-3 block" />
                    <span className="text-xs font-black text-slate-700 block font-sans">কোনো রশিদ বা ইনভয়েস রেকর্ড পাওয়া যায়নি</span>
                    <span className="text-[10px] text-slate-400 font-semibold mt-1 block font-sans">আপনার কোনো রিকোয়েস্ট পেন্ডিং খতিয়ানে থাকলে অথবা অন্য কোনো ক্যাটাগরি ফিল্টারে থাকলে চেক করুন।</span>
                  </div>
                );
              }

              return (
                <div className="overflow-hidden border border-slate-150 rounded-2xl shadow-3xs bg-white">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-xs font-medium text-slate-500">
                      <thead className="bg-slate-50/75 border-b border-slate-150 text-slate-700 font-black uppercase text-[10px] tracking-wider font-sans">
                        <tr>
                          <th className="p-4">ইনভয়েস # / তারিখ</th>
                          <th className="p-4">সার্ভিস টাইপ</th>
                          <th className="p-4">পেমেন্ট ডিটেইলস</th>
                          <th className="p-4">মোট টাকা</th>
                          <th className="p-4">অবস্থা</th>
                          <th className="p-4 text-right font-sans">অ্যাকশন</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-sans">
                        {filteredList.map((inv) => {
                          const isPaid = inv.status === 'paid' || inv.status === 'approved';
                          const isPending = inv.status === 'pending';
                          
                          return (
                            <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="p-4 whitespace-nowrap">
                                <span className="font-mono font-black text-indigo-700 bg-indigo-50/50 border border-indigo-100 px-1.5 py-0.5 rounded text-[10px] block w-fit mb-1">
                                  #{inv.id.substring(0, 12).toUpperCase()}
                                </span>
                                <span className="text-[10px] text-slate-400 font-semibold font-mono block">
                                  {inv.createdAt || inv.date || 'N/A'}
                                </span>
                              </td>
                              <td className="p-4 whitespace-nowrap">
                                <span className="p-1 px-2.5 rounded-lg bg-slate-100 text-slate-755 font-black text-[10px] uppercase font-mono">
                                  {inv.type || 'P-UP'}
                                </span>
                              </td>
                              <td className="p-4">
                                <div className="space-y-0.5">
                                  <div className="text-slate-800 font-black text-[11px] flex items-center gap-1">
                                    <span className="p-0.5 px-1.5 bg-slate-100 border rounded text-[9px] font-mono uppercase">
                                      {inv.paymentMethod || 'Wallet'}
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-semibold font-mono">
                                    TxID: <span className="text-slate-600 font-black select-all">{inv.transactionId || 'N/A'}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4 whitespace-nowrap">
                                <span className="text-xs font-black text-slate-900 font-mono">
                                  ৳{(inv.amount || 0).toLocaleString()}
                                </span>
                              </td>
                              <td className="p-4 whitespace-nowrap">
                                {isPaid ? (
                                  <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-150 px-2 py-0.5 rounded-md">
                                    ● {settings.clientPaymentSuccessStatusLabel || 'Approved'}
                                  </span>
                                ) : isPending ? (
                                  <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-150 px-2 py-0.5 rounded-md">
                                    ● {settings.clientPaymentPendingStatusLabel || 'Pending'}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-rose-700 bg-rose-50 border border-rose-150 px-2 py-0.5 rounded-md">
                                    ● ${settings.clientPaymentOverdueStatusLabel || 'Overdue'}
                                  </span>
                                )}
                              </td>
                              <td className="p-4 text-right whitespace-nowrap font-sans">
                                {isPaid ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg">
                                    সফলভাবে সম্পন্ন আছে।
                                  </span>
                                ) : isPending ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-lg">
                                    অপেক্ষমান আছে
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-black text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-lg">
                                    বকেয়া আছে
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* 1.6 REJECTED INVOICES HANDLER - SUB-TAB */}
        {activeSubTab === 'rejected_invoices' && (
          <div className="bg-white border border-slate-200 rounded-[1.5rem] p-6 shadow-xs relative animate-fade-in space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <ShieldAlert size={16} className="text-rose-600" />
                  বাতিলকৃত পেমেন্ট রিকোয়েস্ট (Rejected Payment Requests)
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed font-sans mt-0.5">
                  আপনার বাতিলকৃত পেমেন্ট রিকোয়েস্টগুলো সঠিক তথ্য দিয়ে সংশোধন করে পুনরায় পাঠান।
                </p>
              </div>
            </div>

            {(() => {
              const rejectedList = userInvoicesList.filter(inv => inv.status === 'rejected');
              if (rejectedList.length === 0) {
                return (
                  <div className="p-12 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                    <CheckCircle size={42} className="mx-auto text-emerald-400 mb-3 block" />
                    <span className="text-xs font-black text-slate-700 block font-sans">কোনো বাতিলকৃত ইনভয়েস নেই</span>
                    <span className="text-[10px] text-slate-400 font-semibold mt-1 block font-sans">আপনার সকল পেমেন্ট রিকোয়েস্ট সফলভাবে সম্পন্ন আছে।</span>
                  </div>
                );
              }

            return (
                <div className="space-y-4">
                  {rejectedList.map((inv) => {
                    let extractedReason = 'ভুল ট্রানজেকশন আইডি বা টাকা জমা হয়নি।';
                    if (inv.note && inv.note.includes('বাতিল করার কারণ:')) {
                      const parts = inv.note.split('বাতিল করার কারণ:');
                      if (parts.length > 1) {
                        extractedReason = parts[1].split(']')[0].trim();
                      }
                    } else if (inv.note && inv.note.includes('[REJECTED')) {
                      extractedReason = 'এডমিন কর্তৃক রিকোয়েস্ট বাতিল করা হয়েছে।';
                    }

                    return (
                      <div key={inv.id} className="bg-white border border-rose-150 rounded-2xl p-4.5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-rose-350 shadow-2xs">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-black text-slate-850 font-mono bg-slate-50 border border-slate-150 px-2 py-0.5 rounded-md">
                              #{inv.id.substring(0, 10).toUpperCase()}
                            </span>
                            <span className="text-[9.5px] uppercase font-mono font-black tracking-wider px-2 py-0.5 rounded-md bg-rose-100 text-rose-700">
                              {inv.paymentMethod || (inv as any).method}
                            </span>
                            <span className="text-xs font-black text-rose-650 font-mono bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-md">
                              ৳{(inv.amount || 0).toLocaleString()}
                            </span>
                          </div>
                          
                          <p className="text-[11px] font-bold text-slate-600 leading-relaxed font-sans pt-0.5">
                            <strong className="text-rose-700 font-black">বাতিলের কারণ:</strong> {extractedReason}
                          </p>

                          <div className="text-[10px] text-slate-400 font-semibold font-mono pt-0.5">
                            পূর্বের TxID: <span className="bg-slate-50 border border-rose-100 px-1.5 py-0.5 rounded text-rose-600 select-all font-black">{inv.transactionId || 'N/A'}</span> • {inv.createdAt}
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center">
                          <button
                            type="button"
                            onClick={() => handleInitiateResubmit(inv)}
                            className="bg-indigo-650 hover:bg-indigo-700 text-white font-sans text-xs font-black px-4 py-2.5 rounded-xl transition-all shadow-sm shadow-indigo-150 active:scale-95 flex items-center gap-1.5 cursor-pointer"
                          >
                            <RefreshCw size={12} className="animate-spin-slow" />
                            সংশোধন করুন (Edit & Retry)
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {/* 1.6.5 SMS INBOX HANDLER - SUB-TAB (tawk sms system) */}
        {activeSubTab === 'client_sms' && (
          <div className="bg-white border border-slate-200 rounded-[1.5rem] p-6 shadow-xs relative animate-fade-in space-y-6 text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <MessageSquare size={16} className="text-indigo-600" />
                  এসএমএস ইনবক্স (Official SMS Inbox & Logs)
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed font-sans mt-0.5">
                  কোম্পানি থেকে আপনার মোবাইলে প্রেরিত সকল অফিসিয়াল নোটিফিকেশন ও এসএমএস লগসমূহ নিচে দেখুন।
                </p>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/60">
                <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-ping shrink-0" />
                <span className="text-[10px] font-black text-indigo-700 uppercase tracking-wide font-sans">
                  Live Sync Connected
                </span>
              </div>
            </div>

            {/* Stats Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-slate-50/50 border border-slate-150 p-4 rounded-2xl flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                  <MessageSquare size={18} />
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wide">সর্বমোট নোটিফিকেশন (Total SMS)</span>
                  <span className="text-base font-black text-slate-800 font-mono">{mySmsLogs.length} টি</span>
                </div>
              </div>
              <div className="bg-slate-50/50 border border-slate-150 p-4 rounded-2xl flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                  <PhoneCall size={18} />
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wide">সক্রিয় মোবাইল নম্বর (Registered Mobile)</span>
                  <span className="text-xs font-black text-slate-800 font-mono">{currentUserData?.phone || 'N/A'}</span>
                </div>
              </div>
              <div className="bg-slate-50/50 border border-slate-150 p-4 rounded-2xl flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                  <span className="text-xs font-black font-mono">৳</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wide">সার্ভিস স্ট্যাটাস (System Status)</span>
                  <span className="text-xs font-black text-emerald-600 flex items-center gap-1 font-sans">🟢 active</span>
                </div>
              </div>
            </div>

            {/* List of Messages */}
            {mySmsLogs.length === 0 ? (
              <div className="p-16 text-center border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/30 max-w-xl mx-auto">
                <MessageSquare size={42} className="mx-auto text-slate-300 mb-3 block animate-pulse" />
                <span className="text-xs font-black text-slate-700 block font-sans">কোনো এসএমএস নোটিফিকেশন নেই</span>
                <span className="text-[10px] text-slate-400 font-semibold mt-1.5 block font-sans leading-relaxed">
                  আপনার মোবাইল নম্বরে কোনো অফিসিয়াল বার্তা বা নোটিফিকেশন প্রেরণ করা হলে তা সাথে সাথে এখানে লাইভ দেখতে পাবেন।
                </span>
              </div>
            ) : (
              <div className="space-y-4">
                {mySmsLogs.map((log) => {
                  return (
                    <div key={log.id} className="bg-white border border-slate-150 rounded-[1.25rem] p-4.5 hover:border-indigo-250 transition-all shadow-3xs flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="flex gap-3 items-start">
                        <div className="p-2 bg-indigo-50/70 text-indigo-600 rounded-xl shrink-0 mt-0.5">
                          <MessageSquare size={16} />
                        </div>
                        <div className="space-y-2 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md font-mono">
                              {log.provider || 'Gateway System'}
                            </span>
                            <span className="text-[9.5px] uppercase font-mono font-black tracking-wider px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100">
                              {log.status || 'Delivered'}
                            </span>
                            <span className="text-[9px] text-slate-400 font-bold font-mono">
                              {log.createdAt}
                            </span>
                          </div>
                          
                          <p className="text-xs text-slate-700 font-medium leading-relaxed select-all break-words font-sans bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                            {log.message || log.body}
                          </p>

                          <div className="flex gap-4 text-[9.5px] text-slate-400 font-semibold font-mono">
                            <span>প্রাপক: <strong className="text-slate-600">{log.recipientName || 'You'}</strong></span>
                            <span>নম্বর: <strong className="text-slate-600">{log.recipientPhone}</strong></span>
                            {log.parts && <span>পার্টস: <strong className="text-slate-600">{log.parts} SMS</strong></span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 1.7 USER PROFILE & ACCOUNT SETTINGS SUB-TAB */}
        {activeSubTab === 'settings' && (
          <div className="bg-white border border-slate-200 rounded-[1.5rem] p-6 shadow-xs relative animate-fade-in space-y-6">
            <div>
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Lock size={16} className="text-indigo-650" />
                আমার প্রোফাইল ও ইউজার সেটিংস (Profile & Security)
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed font-sans mt-0.5">
                আপনার পাসওয়ার্ড পরিবর্তন করুন এবং বিলিং সংক্রান্ত সাময়িক সারাংশ দেখুন।
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Profile Card & Billing Balance */}
              <div className="bg-indigo-50/15 border border-indigo-100/70 p-5 rounded-3xl relative overflow-hidden flex flex-col justify-between h-[340px]">
                <div>
                  <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full uppercase font-mono font-black">Account Overview</span>
                  <div className="mt-4">
                    <h4 className="text-sm font-black text-slate-800 font-sans">{currentUserData?.name || user?.name || 'User'}</h4>
                    <span className="text-xs text-slate-400 font-mono">@{currentUserData?.username || user?.username}</span>
                  </div>
                </div>

                <div className="mt-6 border-t border-indigo-100/40 pt-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500 font-bold">মোট বিলিং ফিঃ</span>
                    <strong className="text-sm text-slate-800 font-black">৳{totalFee.toLocaleString()}</strong>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <div className="p-2 bg-white rounded-xl border border-indigo-50/60 font-mono">
                      <span className="text-[9px] text-emerald-500 font-bold block">পরিশোধিত</span>
                      <strong className="text-emerald-600 font-black">৳{paidFees.toLocaleString()}</strong>
                    </div>
                    <div className="p-2 bg-white rounded-xl border border-indigo-50/60 font-mono">
                      <span className="text-[9px] text-rose-500 font-bold block">বকেয়া বিল</span>
                      <strong className="text-rose-600 font-black">৳{dueFees.toLocaleString()}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Password change block */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-1.5">
                  <Lock size={14} className="text-indigo-650" />
                  নিরাপত্তা ও পাসওয়ার্ড পরিবর্তন (Account Settings)
                </h3>

                <form onSubmit={handleClientPasswordChange} className="space-y-4">
                  {clientPassError && (
                    <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-[11px] font-bold text-rose-600 leading-relaxed">
                      ❌ {clientPassError}
                    </div>
                  )}

                  {clientPassSuccess && (
                    <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl text-[11px] font-bold text-emerald-600 leading-relaxed">
                      ✅ {clientPassSuccess}
                    </div>
                  )}

                  <div className="space-y-1.5 relative">
                    <label className="text-[10.5px] font-black text-slate-650 uppercase tracking-wide block">বর্তমান পাসওয়ার্ড (Current Password)</label>
                    <div className="relative">
                      <input
                        type={showClientPass ? "text" : "password"}
                        required
                        value={clientCurrentPassword}
                        onChange={(e) => setClientCurrentPassword(e.target.value)}
                        placeholder="আপনার বর্তমান অ্যাকাউন্ট পাসওয়ার্ড দিন"
                        className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800"
                      />
                      <button
                        type="button"
                        onClick={() => setShowClientPass(!showClientPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-655 focus:outline-none"
                      >
                        {showClientPass ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1.5">
                      <label className="text-[10.5px] font-black text-slate-655 uppercase block">নতুন পাসওয়ার্ড (New Password)</label>
                      <input
                        type={showClientPass ? "text" : "password"}
                        required
                        value={clientNewPassword}
                        onChange={(e) => setClientNewPassword(e.target.value)}
                        placeholder="কমপক্ষে ৬ অক্ষর"
                        className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10.5px] font-black text-slate-655 uppercase block">পাসওয়ার্ড নিশ্চিত করুন (Confirm)</label>
                      <input
                        type={showClientPass ? "text" : "password"}
                        required
                        value={clientConfirmPassword}
                        onChange={(e) => setClientConfirmPassword(e.target.value)}
                        placeholder="পাসওয়ার্ডটি পুনরায় টাইপ করুন"
                        className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isClientPassSaving}
                    className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-2 border border-slate-900 cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    {isClientPassSaving ? (
                      <>
                        <RefreshCw size={13} className="animate-spin" />
                        সংরক্ষণ করা হচ্ছে...
                      </>
                    ) : (
                      'পাসওয়ার্ড আপডেট করুন (Update Password)'
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}


      </div>
    );
  }

  return (
    <AdminPanel
      user={user}
      currentUserData={currentUserData}
      settings={settings}
      invoices={invoices}
      investments={investments}
      activities={activities}
      totalUsersCount={totalUsersCount}
      stats={stats}
      salesBreakdown={salesBreakdown}
      healthScore={healthScore}
      dailyRevenueData={dailyRevenueData}
      chartMetricMode={chartMetricMode}
      setChartMetricMode={setChartMetricMode}
      chartVisualType={chartVisualType}
      setChartVisualType={setChartVisualType}
      isProcessingApproval={isProcessingApproval}
      handleRejectRequest={handleRejectRequest}
      handleApproveRequest={handleApproveRequest}
      localCountryCodes={localCountryCodes}
      directInvoiceNum={directInvoiceNum}
      setDirectInvoiceNum={setDirectInvoiceNum}
      directInvoiceType={directInvoiceType}
      setDirectInvoiceType={setDirectInvoiceType}
      directInvoiceCustomerName={directInvoiceCustomerName}
      setDirectInvoiceCustomerName={setDirectInvoiceCustomerName}
      directInvoiceCountryCode={directInvoiceCountryCode}
      setDirectInvoiceCountryCode={setDirectInvoiceCountryCode}
      directInvoicePhone={directInvoicePhone}
      setDirectInvoicePhone={setDirectInvoicePhone}
      directInvoicePaymentMethod={directInvoicePaymentMethod}
      setDirectInvoicePaymentMethod={setDirectInvoicePaymentMethod}
      directInvoiceTxnId={directInvoiceTxnId}
      setDirectInvoiceTxnId={setDirectInvoiceTxnId}
      directInvoiceAmount={directInvoiceAmount}
      setDirectInvoiceAmount={setDirectInvoiceAmount}
      directInvoicePaid={directInvoicePaid}
      setDirectInvoicePaid={setDirectInvoicePaid}
      directInvoiceDue={directInvoiceDue}
      setDirectInvoiceDue={setDirectInvoiceDue}
      directInvoiceNote={directInvoiceNote}
      setDirectInvoiceNote={setDirectInvoiceNote}
      isDirectInvoiceSaving={isDirectInvoiceSaving}
      handleCreateDirectInvoiceSubmit={handleCreateDirectInvoiceSubmit}
      handleDirectInvoiceAmountChange={handleDirectInvoiceAmountChange}
      selectedUserInvoice={selectedUserInvoice}
      setSelectedUserInvoice={setSelectedUserInvoice}
      showInvoicePreviewModal={showInvoicePreviewModal}
      setShowInvoicePreviewModal={setShowInvoicePreviewModal}
      handleUserDownloadInvoice={handleUserDownloadInvoice}
      isUserGeneratingPdf={isUserGeneratingPdf}
      approvedNotificationModal={approvedNotificationModal}
      setApprovedNotificationModal={setApprovedNotificationModal}
      adminNotes={adminNotes}
      setAdminNotes={setAdminNotes}
      notesSaveSuccess={notesSaveSuccess}
      setNotesSaveSuccess={setNotesSaveSuccess}
      handleCreateSuccess={() => {}}
      activeModal={activeModal}
      setActiveModal={setActiveModal}
      t={t}
    />
  );
}
