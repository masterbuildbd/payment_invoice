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
      generateNewInvoiceMeta();
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

  useEffect(() => {
    if (activeProviders.length > 0 && !activeProviders.includes(selectedAccountTab)) {
      setSelectedAccountTab(activeProviders[0] as any);
    }
  }, [activeProviders, selectedAccountTab]);

  const [copiedText, setCopiedText] = useState<string | null>(null);
  
  // Custom states for revamped interactive gateway selector
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<'all' | 'mfs' | 'bank' | 'global'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [customEstimatorAmount, setCustomEstimatorAmount] = useState<string>('');
  const [paymentWizardStep, setPaymentWizardStep] = useState<number>(1);
  const [activeSystemTab, setActiveSystemTab] = useState<'apps' | 'panels' | 'decoders'>('apps');

  const pendingFees = React.useMemo(() => {
    return userInvoicesList
      .filter(inv => inv.status === 'pending' || inv.status === 'overdue')
      .reduce((sum, inv) => sum + (inv.amount || 0), 0);
  }, [userInvoicesList]);

  const rejectedFees = React.useMemo(() => {
    return userInvoicesList
      .filter(inv => inv.status === 'rejected' || inv.status === 'cancelled')
      .reduce((sum, inv) => sum + (inv.amount || 0), 0);
  }, [userInvoicesList]);

  // Join date calculations (date, month, year)
  const joinedDateFormatted = React.useMemo(() => {
    const rawDate = currentUserData?.createdAt || user?.createdAt;
    if (!rawDate) return 'N/A';
    try {
      const dObj = new Date(rawDate);
      if (isNaN(dObj.getTime())) return rawDate;
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${dObj.getDate()} ${months[dObj.getMonth()]} ${dObj.getFullYear()}`;
    } catch {
      return rawDate;
    }
  }, [currentUserData?.createdAt, user?.createdAt]);

  const joinedDateBengali = React.useMemo(() => {
    const rawDate = currentUserData?.createdAt || user?.createdAt;
    if (!rawDate) return 'N/A';
    try {
      const dObj = new Date(rawDate);
      if (isNaN(dObj.getTime())) return rawDate;
      const bmonths = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
      return `${dObj.getDate()} ${bmonths[dObj.getMonth()]} ${dObj.getFullYear()}`;
    } catch {
      return rawDate;
    }
  }, [currentUserData?.createdAt, user?.createdAt]);

  if (!isAdmin) {
    const totalFee = Number(currentUserData?.price) || 0;
    const paidFees = approvedInvoicesBalance;
    const dueFees = Math.max(0, totalFee - paidFees);

    const bKashLogo = (
      <svg className="w-6 h-6 flex-shrink-0 animate-pulse" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#E2136E" />
        <path d="M12 24L20 15L28 24" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="20" cy="26" r="2.5" fill="white" />
      </svg>
    );

    const nagadLogo = (
      <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#F15A22" />
        <circle cx="20" cy="20" r="8" stroke="white" strokeWidth="3" />
        <circle cx="20" cy="20" r="3" fill="white" />
      </svg>
    );

    const upayLogo = (
      <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#005CA9" />
        <path d="M14 14H26V20H14V26H26" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );

    const rocketLogo = (
      <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#8C3494" />
        <path d="M15 15L20 10L25 15L25 28L15 28Z" fill="white" />
        <circle cx="20" cy="19" r="2.5" fill="#8C3494" />
      </svg>
    );

    const mcashLogo = (
      <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#0F9D58" />
        <path d="M14 18L18 22L26 14" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );

    const bankLogo = (
      <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#1E3A8A" />
        <path d="M12 28H28M15 18V24M20 18V24M25 18V24M12 18H28M20 12L11 18H29L20 12Z" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );

    const binanceLogo = (
      <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#F0B90B" />
        <path d="M20 12L25.5 17.5L28.5 14.5L20 6L11.5 14.5L14.5 17.5L20 12Z" fill="black" />
        <path d="M20 28L14.5 22.5L11.5 25.5L20 34L28.5 25.5L25.5 22.5L20 28Z" fill="black" />
        <path d="M28 20L20 12L12 20L20 28L28 20ZM16.5 20L20 16.5L23.5 20L20 23.5L16.5 20Z" fill="black" fillRule="evenodd" clipRule="evenodd" />
      </svg>
    );

    const paypalLogo = (
      <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#003087" />
        <path d="M16 12H21C23.5 12 25 13 25 15C25 17.5 23 19 20.5 19H17.5L16 28H13L16 12Z" fill="white" opacity="0.8" />
        <path d="M19 15H24C26.5 15 28 16 28 18C28 20.5 26 22 23.5 22H20.5L19 31H16L19 15Z" fill="white" />
      </svg>
    );

    const allProviders = [
      { key: 'bKash', label: 'bKash (বিকাশ)', category: 'mfs', logo: bKashLogo, activeBg: 'from-pink-50/80 to-rose-100/90 border-rose-300 text-rose-700 shadow-md ring-4 ring-rose-500/10 scale-[1.03]', textAccent: 'text-rose-500', enabled: settings?.bkashEnabled !== false, feePercent: 1.85, notes: 'বিকাশ পার্সোনাল সেন্ড মানি' },
      { key: 'Nagad', label: 'Nagad (নগদ)', category: 'mfs', logo: nagadLogo, activeBg: 'from-orange-50/80 to-amber-100/90 border-orange-300 text-orange-700 shadow-md ring-4 ring-orange-500/10 scale-[1.03]', textAccent: 'text-orange-500', enabled: settings?.nagadEnabled !== false, feePercent: 1.50, notes: 'নগদ পার্সোনাল সেন্ড মানি' },
      { key: 'Upay', label: 'Upay (ইউপে)', category: 'mfs', logo: upayLogo, activeBg: 'from-blue-50/80 to-indigo-100/90 border-indigo-300 text-indigo-850 shadow-md ring-4 ring-indigo-500/10 scale-[1.03]', textAccent: 'text-indigo-500', enabled: settings?.upayEnabled !== false, feePercent: 1.40, notes: 'ইউপে পার্সোনাল সেন্ড মানি' },
      { key: 'Rocket', label: 'Rocket (রকেট)', category: 'mfs', logo: rocketLogo, activeBg: 'from-purple-50/80 to-fuchsia-100/90 border-purple-300 text-purple-700 shadow-md ring-4 ring-purple-500/10 scale-[1.03]', textAccent: 'text-purple-500', enabled: settings?.rocketEnabled !== false, feePercent: 1.80, notes: 'রকেট পার্সোনাল সেন্ড মানি' },
      { key: 'Mcash', label: 'Mcash (এমক্যাশ)', category: 'mfs', logo: mcashLogo, activeBg: 'from-green-50/80 to-emerald-100/90 border-green-300 text-green-700 shadow-md ring-4 ring-green-500/10 scale-[1.03]', textAccent: 'text-green-500', enabled: settings?.mcashEnabled !== false, feePercent: 1.50, notes: 'এমক্যাশ পার্সোনাল সেন্ড মানি' },
      { key: 'Bank', label: 'Bank Transfer (ব্যাংক)', category: 'bank', logo: bankLogo, activeBg: 'from-blue-50/80 to-indigo-100/90 border-blue-300 text-indigo-700 shadow-md ring-4 ring-blue-500/10 scale-[1.03]', textAccent: 'text-blue-600', enabled: settings?.bankEnabled !== false, feePercent: 0.00, notes: 'ব্যাংক একাউন্ট পেমেন্ট ট্রান্সফার' },
      { key: 'Binance', label: 'Binance (ইউএসডিটি)', category: 'crypto', logo: binanceLogo, activeBg: 'from-yellow-50/80 to-amber-100/90 border-yellow-300 text-amber-700 shadow-md ring-4 ring-yellow-500/10 scale-[1.03]', textAccent: 'text-yellow-600', enabled: settings?.binanceEnabled !== false, feePercent: 0.00, notes: 'Binance Pay / USDT-TRC20 Transfer' },
      { key: 'PayPal', label: 'PayPal (ডলার)', category: 'crypto', logo: paypalLogo, activeBg: 'from-blue-50/80 to-sky-100/90 border-blue-300 text-blue-700 shadow-md ring-4 ring-blue-500/10 scale-[1.03]', textAccent: 'text-blue-500', enabled: settings?.paypalEnabled !== false, feePercent: 0.00, notes: 'PayPal International Payment/Gift' },
    ];

    const enabledProviders = allProviders.filter(p => p.enabled);
    const activeProviderDetails = allProviders.find(p => p.key === selectedAccountTab);
    const activeFeePercent = activeProviderDetails?.feePercent || 0;
    const numDueFees = Number(dueFees) || 0;
    const parsedAmount = parseFloat(customEstimatorAmount) || (numDueFees > 0 ? numDueFees : 1000);
    const computedCharge = (parsedAmount * activeFeePercent) / 100;
    const computedTotal = parsedAmount + computedCharge;

    const handleCopyText = (text: string) => {
      navigator.clipboard.writeText(text);
      setCopiedText(text);
      setTimeout(() => {
        setCopiedText(null);
      }, 2000);
    };

    return (
      <div className="space-y-6 pb-12">
        {activeSubTab === 'dashboard' && (
          <>

        {/* Elite Running Marquee Text Announcement Bar */}
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-xl flex items-center gap-3 shadow-3xs relative overflow-hidden">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-rose-500 to-indigo-650 text-white rounded-lg text-[9px] font-extrabold uppercase tracking-widest shrink-0 shadow-3xs leading-none">
            <Megaphone size={11} className="animate-pulse" />
            <span>বিজ্ঞপ্তি (Notice)</span>
          </div>
          <div className="flex-1 overflow-hidden leading-none">
            <marquee 
              behavior="scroll" 
              direction="left" 
              scrollamount="3" 
              onMouseOver={(e: any) => e.currentTarget.stop()}
              onMouseOut={(e: any) => e.currentTarget.start()}
              className="text-slate-655 dark:text-slate-300 text-[11px] font-bold leading-none cursor-pointer select-none block"
            >
              {settings.runningNotice || 'প্রিয় গ্রাহক, আমাদের যেকোনো নতুন আপডেট বা অফার সম্পর্কিত তথ্য এখন থেকে আপনি সরাসরি এখানে লাইভ দেখতে পাবেন। পেমেন্ট করার পর ৫-১০ মিনিট ধৈর্য ধরুন, আমাদের টিম আপনার পেমেন্টটি ভেরিফাই করার কাজ করছে। ধন্যবাদ!'}
            </marquee>
          </div>
        </div>

        {/* 🤖 GEMINI AI INTELLIGENCE DASHBOARD COMPANION */}
        <AIInvoiceHelper 
          invoices={userInvoicesList}
          approvedInvoicesBalance={approvedInvoicesBalance}
          approvedCount={approvedCount}
          pendingCount={pendingCount}
          rejectedCount={rejectedCount}
        />

        {/* 🚨 REJECTED INVOICES HANDLER - RE-SUBMISSION PANEL */}
            {myRejectedInvoices.length > 0 && (
              <div className="bg-rose-50/70 dark:bg-rose-950/10 border border-rose-200 dark:border-rose-900/40 p-5 rounded-3xl text-left shadow-2xs">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="h-7 w-7 rounded-lg bg-rose-100 dark:bg-rose-955 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-200 dark:border-rose-900/50 shrink-0">
                    <ShieldAlert size={15} className="stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-rose-800 dark:text-rose-300 uppercase tracking-widest font-sans">
                      প্রত্যাখ্যাত পেমেন্ট রিকোয়েস্ট ({myRejectedInvoices.length}টি বাতিল)
                    </h3>
                    <p className="text-[10px] text-rose-650 dark:text-rose-455 font-bold mt-0.5 font-sans leading-none">
                      নিচের পেমেন্ট রিকোয়েস্টগুলো এডমিন বাতিল করেছেন। সঠিক তথ্য দিয়ে সংশোধন করে সাবমিট করুন।
                    </p>
                  </div>
                </div>

                <div className="space-y-3 mt-4">
                  {myRejectedInvoices.map((inv) => {
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
                      <div key={inv.id} className="bg-white dark:bg-slate-900 border border-rose-150 dark:border-rose-900/30 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-rose-350 dark:hover:border-rose-700 shadow-2xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-black text-slate-800 dark:text-slate-205 font-mono bg-slate-50 dark:bg-slate-850 border border-slate-150 dark:border-slate-800 px-2 py-0.5 rounded-md">
                              #{inv.id.substring(0, 10).toUpperCase()}
                            </span>
                            <span className="text-[9px] uppercase font-mono font-black tracking-wider px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-955 text-rose-700 dark:text-rose-350">
                              {inv.paymentMethod || inv.method}
                            </span>
                            <span className="text-xs font-black text-rose-650 dark:text-rose-400 font-mono bg-rose-50 dark:bg-rose-955/20 border border-rose-100/30 px-2 py-0.5 rounded-md">
                              ৳{(inv.amount || 0).toLocaleString()}
                            </span>
                          </div>
                          
                          <p className="text-[11px] font-bold text-slate-655 dark:text-slate-350 leading-relaxed font-sans pt-1">
                            <strong className="text-rose-705 dark:text-rose-450 font-black">বাতিলের কারণ:</strong> {extractedReason}
                          </p>

                          <div className="text-[10px] text-slate-400 font-semibold font-mono pt-0.5">
                            পূর্বের TxID: <span className="bg-slate-50 dark:bg-slate-800 border dark:border-slate-705 px-1.5 py-0.5 rounded text-rose-700 dark:text-rose-400 select-all font-black">{inv.transactionId || 'N/A'}</span> • {inv.createdAt}
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center">
                          <button
                            type="button"
                            onClick={() => handleInitiateResubmit(inv)}
                            className="bg-indigo-650 hover:bg-indigo-700 text-white font-sans text-xs font-black px-4 py-2 rounded-xl transition-all shadow-sm shadow-indigo-150 active:scale-95 flex items-center gap-1.5 cursor-pointer"
                          >
                            <RefreshCw size={12} />
                            সংশোধন করুন (Edit & Retry)
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 🔋 UNIQUE & UNCOMMON HIGH-GLOW FINANCIAL METRICS GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {/* Stat 1: Total Service Contracts */}
              <div className="bg-gradient-to-br from-indigo-50/70 via-white to-indigo-100/20 dark:from-slate-900/40 dark:via-slate-900 dark:to-indigo-955/20 border border-indigo-150 dark:border-slate-800 p-5 rounded-2xl shadow-3xs relative overflow-hidden group hover:shadow-xs hover:border-indigo-350 dark:hover:border-indigo-900 transition-all duration-300 text-left flex flex-col justify-between">
                <div className="flex justify-between items-start gap-2">
                  <div className="space-y-1">
                    <span className="text-[9.5px] font-black uppercase text-indigo-500 tracking-widest block leading-none font-sans">মোট সার্ভিস চুক্তি বিল (Contract Price)</span>
                    <h3 className="text-lg sm:text-xl md:text-2xl font-black text-slate-855 dark:text-slate-100 font-mono tracking-tight leading-none mt-1.5">৳{totalFee.toLocaleString()}</h3>
                  </div>
                  <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-650 dark:text-indigo-400 shrink-0 border border-indigo-100/30 dark:border-indigo-900/30">
                    <Layers size={17} className="stroke-[2.5]" />
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-1.5 text-[9.5px] font-bold text-indigo-555 dark:text-slate-400 border-t border-slate-100/60 dark:border-slate-850 pt-2.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-550 animate-pulse" />
                  <span>কোম্পানি নির্ধারিত চুক্তিবদ্ধ মোট সার্ভিস ফি।</span>
                </div>
              </div>

              {/* Stat 2: Total Approved / Paid Amount */}
              <div className="bg-gradient-to-br from-emerald-50/70 via-white to-emerald-100/20 dark:from-slate-900/40 dark:via-slate-900 dark:to-emerald-955/20 border border-emerald-150 dark:border-slate-800 p-5 rounded-2xl shadow-3xs relative overflow-hidden group hover:shadow-xs hover:border-emerald-350 dark:hover:border-emerald-900 transition-all duration-300 text-left flex flex-col justify-between">
                <div className="flex justify-between items-start gap-2">
                  <div className="space-y-1">
                    <span className="text-[9.5px] font-black uppercase text-emerald-600 tracking-widest block leading-none font-sans font-black">পরিশোধিত ব্যালেন্স (Credited Paid)</span>
                    <h3 className="text-lg sm:text-xl md:text-2xl font-black text-emerald-905 dark:text-emerald-400 font-mono tracking-tight leading-none mt-1.5">৳{paidFees.toLocaleString()}</h3>
                  </div>
                  <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-450 shrink-0 border border-emerald-100/30 dark:border-emerald-900/30">
                    <CheckCircle size={17} className="stroke-[2.5]" />
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-1.5 text-[9.5px] font-bold text-emerald-655 dark:text-slate-400 border-t border-slate-100/60 dark:border-slate-855 pt-2.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span>অনুমোদিত সফল পেমেন্টসমূহ ({approvedCount}টি রসিদ)</span>
                </div>
              </div>

              {/* Stat 3: Pending Balance Under Verification */}
              <div className="bg-gradient-to-br from-amber-50/70 via-white to-amber-100/20 dark:from-slate-900/40 dark:via-slate-900 dark:to-amber-955/20 border border-amber-150 dark:border-slate-800 p-5 rounded-2xl shadow-3xs relative overflow-hidden group hover:shadow-xs hover:border-amber-350 dark:hover:border-amber-900 transition-all duration-300 text-left flex flex-col justify-between">
                <div className="flex justify-between items-start gap-2">
                  <div className="space-y-1">
                    <span className="text-[9.5px] font-black uppercase text-amber-600 tracking-widest block leading-none font-sans font-black">যাচাইাধীন ব্যালেন্স (Pending Check)</span>
                    <h3 className="text-lg sm:text-xl md:text-2xl font-black text-amber-905 dark:text-amber-400 font-mono tracking-tight leading-none mt-1.5">৳{pendingFees.toLocaleString()}</h3>
                  </div>
                  <span className="p-2 rounded-xl bg-amber-50 dark:bg-amber-955 text-amber-700 dark:text-amber-450 shrink-0 border border-amber-100/30 dark:border-amber-900/40">
                    <Clock size={17} className="stroke-[2.5]" />
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-1.5 text-[9.5px] font-bold text-amber-655 dark:text-slate-400 border-t border-slate-100/60 dark:border-slate-855 pt-2.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${pendingFees > 0 ? 'bg-amber-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-700'}`} />
                  <span>{pendingCount}টি পেমেন্ট রিভিউ অপেক্ষারত</span>
                </div>
              </div>

              {/* Stat 4: Remaining Due Payment */}
              <div className="bg-gradient-to-br from-rose-50/70 via-white to-rose-100/20 dark:from-slate-900/40 dark:via-slate-900 dark:to-rose-955/20 border border-rose-150 dark:border-slate-800 p-5 rounded-xl shadow-3xs relative overflow-hidden group hover:shadow-xs hover:border-rose-350 dark:hover:border-rose-900 transition-all duration-300 text-left flex flex-col justify-between">
                <div className="flex justify-between items-start gap-2">
                  <div className="space-y-1">
                    <span className="text-[9.5px] font-black uppercase text-rose-600 tracking-widest block leading-none font-sans font-black">অবशिष्ट বকেয়া (Remaining Due)</span>
                    <h3 className="text-lg sm:text-xl md:text-2xl font-black text-rose-955 dark:text-rose-455 font-mono tracking-tight leading-none mt-1.5">৳{dueFees.toLocaleString()}</h3>
                  </div>
                  <span className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-650 dark:text-rose-400 shrink-0 border border-rose-100/30 dark:border-rose-900/40">
                    <TrendingDown size={17} className="stroke-[2.5]" />
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-1.5 text-[9.5px] font-bold text-rose-655 dark:text-slate-400 border-t border-slate-100/60 dark:border-slate-850 pt-2.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${dueFees > 0 ? 'bg-rose-550 animate-ping' : 'bg-emerald-500'}`} />
                  <span>{dueFees > 0 ? 'অনতিবிழமை বকেয়া পরিশোধ করুন।' : 'সার্ভিস ফি ক্লিয়ার, ধন্যবাদ!'}</span>
                </div>
              </div>
            </div>

            {/* 🔥 HIGH-END UNCOMMON LAUNCHPAD: GORGEOUS BENTO QUICK TRIGGER SHORTCUTS */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 rounded-3xl text-left shadow-[0_8px_30px_rgb(0,0,0,0.015)] space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
              <div className="border-b border-slate-150/70 dark:border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs font-black text-slate-805 dark:text-slate-100 uppercase tracking-widest flex items-center gap-2 font-mono">
                    <Sparkles size={14} className="text-indigo-600 dark:text-indigo-400 animate-pulse" />
                    সহজ ড্যাশবোর্ড লঞ্চ প্যাড (Interactive Quick Launch Deck)
                  </h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold font-sans mt-0.5">
                    এক ক্লিকে আপনার সবচেয়ে বেশি ব্যবহৃত পোর্টাল ফিচারসমূহে সরাসরি প্রবেশ করুন।
                  </p>
                </div>
                <div className="flex items-center gap-1.5 self-start sm:self-auto">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[9px] bg-indigo-500/10 dark:bg-indigo-950 text-indigo-650 dark:text-indigo-400 font-mono font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border border-indigo-100 dark:border-indigo-900/30">Active Deck</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Shortcut 1: Send Payment Form */}
                <motion.div
                  onClick={() => onTabChange?.('client_payment')}
                  whileHover={{ scale: 1.025, y: -3 }}
                  whileTap={{ scale: 0.985 }}
                  className="p-5 bg-gradient-to-b from-indigo-50/40 via-white to-white dark:from-indigo-950/10 dark:to-slate-900/50 hover:shadow-md border border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-400 dark:hover:border-indigo-600 rounded-2xl cursor-pointer text-left transition-all duration-300 flex flex-col justify-between h-36 group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 text-[8.5px] font-black uppercase bg-indigo-500/10 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 px-2.5 py-1 rounded-bl-xl font-mono border-l border-b border-indigo-100/10">Deposit</div>
                  <div className="flex items-center justify-between">
                    <span className="p-2.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-650 dark:text-indigo-400 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-2xs">
                      <Banknote size={16} />
                    </span>
                    <ChevronRight size={14} className="text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-1.5 transition-all duration-300" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 Bengali-Heading group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">পেমেন্ট রশিদ পাঠান</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold leading-normal pt-1">সেন্ড মানি করার পর ট্রানজেকশন স্লিপ জমা দিতে এখানে চাপুন।</p>
                  </div>
                </motion.div>

                {/* Shortcut 2: View Payment Accounts */}
                <motion.div
                  onClick={() => onTabChange?.('client_account')}
                  whileHover={{ scale: 1.025, y: -3 }}
                  whileTap={{ scale: 0.985 }}
                  className="p-5 bg-gradient-to-b from-amber-50/40 via-white to-white dark:from-amber-955/5 dark:to-slate-900/50 hover:shadow-md border border-slate-200/80 dark:border-slate-800/80 hover:border-amber-400 dark:hover:border-amber-600 rounded-2xl cursor-pointer text-left transition-all duration-300 flex flex-col justify-between h-36 group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 text-[8.5px] font-black uppercase bg-amber-500/10 text-amber-600 dark:bg-amber-955/10 dark:text-amber-400 px-2.5 py-1 rounded-bl-xl font-mono border-l border-b border-amber-100/10">Accounts</div>
                  <div className="flex items-center justify-between">
                    <span className="p-2.5 bg-amber-100 dark:bg-amber-955/30 text-amber-700 dark:text-amber-450 rounded-xl group-hover:bg-amber-500 group-hover:text-white transition-all duration-300 shadow-2xs">
                      <Wallet size={16} />
                    </span>
                    <ChevronRight size={14} className="text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 group-hover:translate-x-1.5 transition-all duration-300" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 Bengali-Heading group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">নম্বর ডিরেক্টরি</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold leading-normal pt-1">কোম্পানির অফিশিয়াল বিকাশ, নগদ ও ব্যাংক একাউন্ট বিবরণ।</p>
                  </div>
                </motion.div>

                {/* Shortcut 3: Invoice Archives */}
                <motion.div
                  onClick={() => onTabChange?.('client_invoices')}
                  whileHover={{ scale: 1.025, y: -3 }}
                  whileTap={{ scale: 0.985 }}
                  className="p-5 bg-gradient-to-b from-emerald-50/40 via-white to-white dark:from-emerald-955/5 dark:to-slate-900/50 hover:shadow-md border border-slate-200/80 dark:border-slate-800/80 hover:border-emerald-400 dark:hover:border-emerald-600 rounded-2xl cursor-pointer text-left transition-all duration-300 flex flex-col justify-between h-36 group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 text-[8.5px] font-black uppercase bg-emerald-500/10 text-emerald-600 dark:bg-emerald-955/10 dark:text-emerald-400 px-2.5 py-1 rounded-bl-xl font-mono border-l border-b border-emerald-100/10">History</div>
                  <div className="flex items-center justify-between">
                    <span className="p-2.5 bg-emerald-100 dark:bg-emerald-955/30 text-emerald-700 dark:text-emerald-450 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 shadow-2xs">
                      <FileText size={16} />
                    </span>
                    <ChevronRight size={14} className="text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:translate-x-1.5 transition-all duration-300" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 Bengali-Heading group-hover:text-emerald-600 dark:group-hover:text-emerald-405 transition-colors">রশিদ ও পেমেন্ট হিস্ট্রি</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold leading-normal pt-1">সকল জমা রসিদ, অনুমোদিত ব্যালেন্স ও পিডিএফ ভাউচার আর্কাইভ।</p>
                  </div>
                </motion.div>

                {/* Shortcut 4: Help & Support Center */}
                <motion.div
                  onClick={() => {
                    if (settings.phone) {
                      window.open(`https://wa.me/${settings.phone.replace(/[^0-9]/g, '')}`, '_blank');
                    } else {
                      window.open('https://wa.me/8801718070273', '_blank');
                    }
                  }}
                  whileHover={{ scale: 1.025, y: -3 }}
                  whileTap={{ scale: 0.985 }}
                  className="p-5 bg-gradient-to-b from-rose-50/40 via-white to-white dark:from-rose-955/5 dark:to-slate-900/50 hover:shadow-md border border-slate-200/80 dark:border-slate-800/80 hover:border-rose-400 dark:hover:border-rose-600 rounded-2xl cursor-pointer text-left transition-all duration-300 flex flex-col justify-between h-36 group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 text-[8.5px] font-black uppercase bg-rose-500/10 text-rose-600 dark:bg-rose-955/10 dark:text-rose-400 px-2.5 py-1 rounded-bl-xl font-mono border-l border-b border-rose-100/10">Support</div>
                  <div className="flex items-center justify-between">
                    <span className="p-2.5 bg-rose-100 dark:bg-rose-955/30 text-rose-700 dark:text-rose-455 rounded-xl group-hover:bg-rose-500 group-hover:text-white transition-all duration-300 shadow-2xs">
                      <MessageSquare size={16} />
                    </span>
                    <ExternalLink size={12} className="text-slate-400 group-hover:text-rose-655 dark:group-hover:text-rose-400 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all duration-300" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 Bengali-Heading group-hover:text-rose-655 dark:group-hover:text-rose-400 transition-colors">সরাসরি হোয়াটসঅ্যাপ সাপোর্ট</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold leading-normal pt-1">পেমেন্ট জটিলতা বা রিকোয়েস্ট দ্রুত এপ্রুভ করতে সরাসরি হেল্পডেস্ক কথা বলুন।</p>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* 🖥️ MY REGISTERED ACTIVE SYSTEMS (আমার রেজিস্ট্রিকৃত সচল সিস্টেমসমূহ) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 rounded-3xl text-left shadow-[0_8px_30px_rgb(0,0,0,0.015)] space-y-5 animate-fade-in">
              <div className="border-b border-slate-150/70 dark:border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest flex items-center gap-2 font-mono">
                    <Layers size={14} className="text-indigo-600 dark:text-indigo-400 animate-pulse" />
                    আমার সচল রেজিস্ট্রিকৃত সিস্টেমসমূহ (My Registered Active Systems)
                  </h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold font-sans mt-0.5">
                    আপনার ইউজারনেমের অধীনে সক্রিয় ও সংরক্ষিত সকল ডিজিটাল সার্ভিস এবং অ্যাপ্লিকেশন লাইভ ট্র্যাকিং।
                  </p>
                </div>
                {/* Systems Counts Summary Badges */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[9px] bg-slate-50 border dark:bg-slate-800 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-mono font-black uppercase tracking-wider px-2.5 py-1 rounded-lg">
                    অ্যাপ্স: {myApps.length}
                  </span>
                  <span className="text-[9px] bg-slate-50 border dark:bg-slate-800 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-mono font-black uppercase tracking-wider px-2.5 py-1 rounded-lg">
                    প্যানেল: {myPanels.length}
                  </span>
                  <span className="text-[9px] bg-slate-50 border dark:bg-slate-800 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-mono font-black uppercase tracking-wider px-2.5 py-1 rounded-lg">
                    ডিকোড: {myDecoders.length}
                  </span>
                </div>
              </div>

              {/* Sub-Tabs for Systems Switcher */}
              <div className="flex border-b border-slate-100 dark:border-slate-800/80 pb-0.5 gap-2">
                {[
                  { key: 'apps', label: '📱 আমার অ্যান্ড্রয়েড অ্যাপ্স (' + myApps.length + ')', color: 'text-indigo-600 border-indigo-600 bg-indigo-50/10' },
                  { key: 'panels', label: '🖥️ রিসেলার প্যানেল (' + myPanels.length + ')', color: 'text-blue-600 border-blue-600 bg-blue-50/10' },
                  { key: 'decoders', label: '🔑 ডিকোড লাইসেন্স (' + myDecoders.length + ')', color: 'text-emerald-600 border-emerald-600 bg-emerald-50/10' },
                ].map((tab) => {
                  const isActive = activeSystemTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveSystemTab(tab.key as any)}
                      className={`px-4 py-2 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                        isActive
                          ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/30'
                          : 'border-transparent text-slate-400 hover:text-slate-605 hover:bg-slate-50/50'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Tab Contents */}
              <div className="min-h-[140px]">
                {/* APPS TAB */}
                {activeSystemTab === 'apps' && (
                  <div>
                    {myApps.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {myApps.map((app) => (
                          <div key={app.id} className="p-4 bg-slate-50/60 dark:bg-slate-850/30 border border-slate-200/60 dark:border-slate-800 rounded-2xl flex flex-col justify-between space-y-3 hover:border-indigo-300 dark:hover:border-indigo-900 group transition-all duration-300">
                            <div>
                              <div className="flex items-start justify-between">
                                <div className="space-y-0.5">
                                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight font-sans">{app.name}</h4>
                                  <span className="text-[9.5px] font-mono text-slate-400 uppercase tracking-wider truncate block select-all">
                                    {app.packageName || 'dev.masterbuild'}
                                  </span>
                                </div>
                                <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-bold uppercase tracking-wider border ${
                                  app.status === 'active' 
                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                    : 'bg-slate-100 text-slate-500 border-slate-200'
                                }`}>
                                  {app.status === 'active' ? 'Active' : 'Inactive'}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-dashed border-slate-200/60 dark:border-slate-800 text-[10px] font-bold">
                                <div>
                                  <span className="text-slate-400 uppercase block text-[8px] font-black">Protocol</span>
                                  <span className="text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded inline-block font-mono mt-0.5">{app.protocol || 'Default'}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 uppercase block text-[8px] font-black">App Quality</span>
                                  <span className="text-slate-700 dark:text-slate-300 font-sans block truncate mt-0.5">{app.appsQuality || 'Standard'}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 text-center flex flex-col items-center justify-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                        <AlertCircle size={28} className="text-slate-300 animate-pulse mb-2" />
                        <p className="text-xs font-bold text-slate-400">কোন অ্যান্ড্রয়েড অ্যাপ পাওয়া যায়নি</p>
                        <p className="text-[9.5px] text-slate-400 mt-1">পেমেন্ট রিকোয়েস্ট ফর্মে নতুন অ্যাপ কেনার রিকোয়েস্ট পাঠান।</p>
                      </div>
                    )}
                  </div>
                )}

                {/* PANELS TAB */}
                {activeSystemTab === 'panels' && (
                  <div>
                    {myPanels.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {myPanels.map((panel) => (
                          <div key={panel.id} className="p-4 bg-slate-50/60 dark:bg-slate-850/30 border border-slate-200/60 dark:border-slate-800 rounded-2xl flex flex-col justify-between space-y-3 hover:border-blue-300 dark:hover:border-blue-900 group transition-all duration-300">
                            <div>
                              <div className="flex items-start justify-between">
                                <div className="space-y-0.5">
                                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight font-sans">{panel.name}</h4>
                                  <a 
                                    href={panel.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="text-[9.5px] text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 font-mono tracking-tight mt-1"
                                  >
                                    <ExternalLink size={10} />
                                    {panel.url || 'No URL Configured'}
                                  </a>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 text-center flex flex-col items-center justify-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                        <AlertCircle size={28} className="text-slate-300 animate-pulse mb-2" />
                        <p className="text-xs font-bold text-slate-400">কোন রিসেলার প্যানেল পাওয়া যায়নি</p>
                        <p className="text-[9.5px] text-slate-400 mt-1">পেমেন্ট রিকোয়েস্ট ফর্মে নতুন প্যানেল কেনার রিকোয়েস্ট পাঠান।</p>
                      </div>
                    )}
                  </div>
                )}

                {/* DECODERS TAB */}
                {activeSystemTab === 'decoders' && (
                  <div>
                    {myDecoders.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {myDecoders.map((dec) => (
                          <div key={dec.id} className="p-4 bg-slate-50/60 dark:bg-slate-850/30 border border-slate-200/60 dark:border-slate-800 rounded-2xl flex flex-col justify-between space-y-3 hover:border-emerald-300 dark:hover:border-emerald-900 group transition-all duration-300">
                            <div>
                              <div className="flex items-start justify-between">
                                <div className="space-y-0.5">
                                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight font-sans">{dec.name || 'License Key'}</h4>
                                  <p className="text-[10px] font-mono text-emerald-650 dark:text-emerald-400 font-bold select-all">{dec.licenseKey || 'No key configured'}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 text-center flex flex-col items-center justify-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                        <AlertCircle size={28} className="text-slate-300 animate-pulse mb-2" />
                        <p className="text-xs font-bold text-slate-400">কোন ডিকোড লাইসেন্স পাওয়া যায়নি</p>
                        <p className="text-[9.5px] text-slate-400 mt-1">পেমেন্ট রিকোয়েস্ট ফর্মে নতুন ডিকোড লাইসেন্স কেনার রিকোয়েস্ট পাঠান।</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 📢 DYNAMIC INTERACTIVE BILLING ESTIMATOR & STEPPED PROCESS GUIDE */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              
              {/* Interactive Estimator Slider / Presets Deck */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5.5 rounded-3xl text-left shadow-xs flex flex-col justify-between space-y-4">
                <div className="border-b border-slate-100 dark:border-slate-850 pb-2.5">
                  <h3 className="text-xs font-black text-slate-855 dark:text-slate-100 uppercase tracking-widest flex items-center gap-1.5">
                    <Sliders size={14} className="text-indigo-650 animate-pulse" />
                    ইন্টারেক্টিভ চার্জ ক্যালকুলেটর (Gateway Fee Estimator)
                  </h3>
                  <p className="text-[10.5px] text-[#64748b] dark:text-slate-400 font-medium leading-normal pt-0.5 animate-fade-in">
                    রিসার্চ করতে ইচ্ছুক অর্থ ট্যাপ করুন এবং কাঙ্ক্ষিত পেমেন্ট অপশন অনুযায়ী প্রসেসিং ফি ও সর্বশেষ সর্বমোট জমাদানের পরিমাণ লাইভ দেখুন।
                  </p>
                </div>

                {/* Amount Slider and Presets inside Estimator */}
                <div className="space-y-4">
                  {/* Presets Grid */}
                  <div>
                    <span className="text-[10px] font-black uppercase text-indigo-505 tracking-wider block mb-2 font-mono">টাকা সিলেক্ট করুন (Preset Amount)</span>
                    <div className="grid grid-cols-4 gap-2">
                      {[1000, 3000, 5000, 10000].map((presetAmt) => {
                        const isSelected = parsedAmount === presetAmt;
                        return (
                          <button
                            key={presetAmt}
                            type="button"
                            onClick={() => setCustomEstimatorAmount(presetAmt.toString())}
                            className={`py-2 text-xs font-black font-mono rounded-xl transition-all ${
                              isSelected
                                ? 'bg-indigo-650 text-white shadow-xs'
                                : 'bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-655 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
                            }`}
                          >
                            ৳{presetAmt.toLocaleString()}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Manual Amount Slider/Input Field */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-black text-[#64748b] dark:text-slate-400 uppercase tracking-wider font-mono">
                      <span>ম্যানুয়াল পরিমাণ (Manual Input)</span>
                      <span className="text-indigo-600 dark:text-indigo-455 font-black">৳{parsedAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex gap-3">
                      <input
                        type="range"
                        min="200"
                        max="50000"
                        step="100"
                        value={parsedAmount}
                        onChange={(e) => setCustomEstimatorAmount(e.target.value)}
                        className="flex-1 accent-indigo-600 dark:accent-indigo-550 h-2 bg-slate-100 dark:bg-slate-800 rounded-lg outline-none self-center"
                      />
                      <input
                        type="number"
                        placeholder="৳ এমাউন্ট"
                        value={customEstimatorAmount}
                        onChange={(e) => setCustomEstimatorAmount(e.target.value)}
                        className="w-24 px-2.5 py-1.5 text-xs font-bold font-mono text-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-705 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-550 focus:border-indigo-550"
                      />
                    </div>
                  </div>

                  {/* Selector Channel Selection Indicator */}
                  <div>
                    <span className="text-[10px] font-black uppercase text-[#64748b] dark:text-slate-400 tracking-wider block mb-2 font-mono">পেমেন্ট মেথড গেটওয়ে সিলেক্ট করুন</span>
                    <div className="flex gap-2 overflow-x-auto pb-1 max-w-full scrollbar-none">
                      {enabledProviders.map((prov) => {
                        const isChosen = selectedAccountTab === prov.key;
                        return (
                          <button
                            key={prov.key}
                            type="button"
                            onClick={() => setSelectedAccountTab(prov.key as any)}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black whitespace-nowrap border shrink-0 transition-all ${
                              isChosen
                                ? 'bg-indigo-650 text-white border-indigo-655 shadow-2xs'
                                : 'bg-slate-50/50 dark:bg-slate-850 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-[#334155] dark:text-slate-300 border-slate-200/80'
                            }`}
                          >
                            {prov.key} ({prov.feePercent}% ফি)
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Dynamic Breakdowns Row */}
                  <div className="bg-slate-50 dark:bg-slate-850/50 border border-slate-150 dark:border-slate-800/60 p-4.5 rounded-2xl space-y-2 text-xs font-mono">
                    <div className="flex justify-between items-center text-slate-550 dark:text-slate-400 font-bold">
                      <span>নির্বাচিত গেটওয়ে:</span>
                      <span className="font-sans font-black dark:text-slate-200 text-slate-800">{activeProviderDetails?.label || selectedAccountTab}</span>
                    </div>
                    <div className="flex justify-between items-center text-[#64748b] dark:text-slate-400 font-bold font-mono">
                      <span>নেট রিচার্জ অর্থ:</span>
                      <span className="font-black text-slate-800 dark:text-white">৳{parsedAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-[#64748b] dark:text-slate-400 font-bold font-mono">
                      <span>প্রসেসিং ফি ({activeFeePercent}%):</span>
                      <span className="font-bold text-rose-605 dark:text-rose-455">+ ৳{computedCharge.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-855 dark:text-slate-100 font-black border-t border-dashed border-slate-200/80 dark:border-slate-700/60 pt-2 text-sm font-mono">
                      <span>মোট প্রয়োজনীয় পরিশোধ:</span>
                      <span className="text-indigo-650 dark:text-indigo-400">৳{computedTotal.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step By Step Guidelines Tool Card with Neon Progress */}
              <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 p-6 rounded-3xl text-white text-left relative overflow-hidden flex flex-col justify-between shadow-[0_10px_35px_rgba(99,102,241,0.15)] border border-slate-800">
                <div className="absolute right-0 bottom-0 w-36 h-36 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                
                <div>
                  <div className="flex items-center justify-between border-b border-white/10 pb-3.5 mb-5">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-indigo-550/20 text-indigo-300 flex items-center justify-center border border-indigo-500/30">
                        <Sparkles size={14} className="stroke-[2.5]" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#818cf8] font-mono">
                        পেমেন্ট ও রিচার্জ নির্দেশাবলী (Process Wizard)
                      </span>
                    </div>
                    <span className="text-[9px] bg-indigo-500/20 text-indigo-200 border border-indigo-500/30 px-2 py-0.5 rounded-full uppercase font-mono font-black">Timeline Guide</span>
                  </div>

                  {/* Vertical Timeline Process Flow */}
                  <div className="relative pl-6 border-l border-white/10 space-y-6 ml-3">
                    {/* Step 1 */}
                    <div className="relative">
                      <div className="absolute -left-[31px] top-0 h-4.5 w-4.5 rounded-full bg-slate-900 border-2 border-indigo-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400 font-mono">ধাপ ১ : নম্বর ডিরেক্টরি</span>
                      <p className="text-[11.5px] font-bold text-slate-200 leading-relaxed Bengali-Heading mt-0.5">
                        বামপাশের মেনুবার অথবা ওপরের <span className="text-indigo-300">‘নম্বর ডিরেক্টরি’</span> বাটনে চাপ দিয়ে কোম্পানির ট্রাস্টেড নম্বরসমূহ কপি করুন।
                      </p>
                    </div>

                    {/* Step-2 */}
                    <div className="relative">
                      <div className="absolute -left-[31px] top-0 h-4.5 w-4.5 rounded-full bg-slate-900 border-2 border-emerald-500 flex items-center justify-center shadow-md shadow-emerald-500/20">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-emerald-450 font-mono">ধাপ ২ : সেন্ড মানি করুন</span>
                      <p className="text-[11.5px] font-bold text-slate-205 leading-relaxed Bengali-Heading mt-0.5">
                        আপনার বিকাশ/নগদ/রকেট/বাইনান্স ওয়ালেট থেকে নির্দিষ্ট অর্থ সেন্ড মানি (মেক পেমেন্ট) সম্পন্ন করুন।
                      </p>
                    </div>

                    {/* Step 3 */}
                    <div className="relative">
                      <div className="absolute -left-[31px] top-0 h-4.5 w-4.5 rounded-full bg-slate-900 border-2 border-amber-500 flex items-center justify-center shadow-md shadow-amber-500/20">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-amber-400 font-mono">ধাপ ৩ : স্লিপ সাবমিট</span>
                      <p className="text-[11.5px] font-bold text-slate-205 leading-relaxed Bengali-Heading mt-0.5">
                        রিচার্জ রশিদ ফর্মে আপনার প্রেরক নম্বর, সঠিক এমাউন্ট ও ট্রানজেকশন আইডি (TxID) প্রদান করে রিকোয়েস্টটি সাবমিট করুন।
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-[9.5px] text-slate-400 font-bold tracking-normal italic mt-6 border-t border-white/5 pt-3 flex items-center gap-1.5 leading-tight">
                  <span>⚠️ ভুল বা অসত্য তথ্য প্রদান করলে সিস্টেম স্বয়ংক্রিয়ভাবে রিকোয়েস্ট ফিল্টার করবে।</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* 3. ACCOUNT OPTIONS SUB-TAB: SHOW BKASH, NAGAD, BANK ACCOUNT, BINANCE, PAYPAL DETAILS */}
        {(activeSubTab === 'account' || activeSubTab === 'payment') && (() => {
          const enabledProviders = allProviders.filter(p => p.enabled);
          const filteredProviders = enabledProviders.filter(provider => {
            if (selectedCategoryTab !== 'all' && provider.category !== selectedCategoryTab) return false;
            
            if (searchQuery.trim() !== '') {
              const q = searchQuery.toLowerCase();
              const labelMatch = provider.label.toLowerCase().includes(q);
              const keyMatch = provider.key.toLowerCase().includes(q);
              const notesMatch = provider.notes.toLowerCase().includes(q);
              return labelMatch || keyMatch || notesMatch;
            }
            return true;
          });

          const activeProviderDetails = allProviders.find(p => p.key === selectedAccountTab);
          const activeFeePercent = activeProviderDetails?.feePercent || 0;
          
          const numDueFees = Number(dueFees) || 0;
          const parsedAmount = parseFloat(customEstimatorAmount) || (numDueFees > 0 ? numDueFees : 1000);
          const computedCharge = (parsedAmount * activeFeePercent) / 100;
          const computedTotal = parsedAmount + computedCharge;

          return (
            <div className="bg-white border border-slate-200 rounded-[1.8rem] p-6 sm:p-7 shadow-xs animate-fade-in space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-1 px-1.5 flex items-center gap-2">
                  <Wallet size={16} className="text-indigo-600 animate-bounce" />
                  {activeSubTab === 'payment' ? 'পেমেন্ট রশিদ ও ভেরিফিকেশন ফর্ম (Payment Verification Form)' : 'কোম্পানির অফিশিয়াল পেমেন্ট গেটওয়ে এবং অ্যাকাউন্ট অপশন (Active Gateways)'}
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed px-1.5">
                  {activeSubTab === 'payment' 
                    ? 'নিচের ফর্মটি যথাযথ পেমেন্ট রিকোয়েস্ট এবং হিসাব আইডি দিয়ে পূরণ করে জমা দিন। প্রয়োজনে সচল লেনদেনের চ্যানেল সিলেক্ট করে পেমেন্ট সম্পন্ন করতে পারেন:'
                    : 'নিচে কোম্পানির সচল লেনদেনের চ্যানেলসমূহ দেওয়া হলো। নিচে প্রথম ধাপ থেকে কাঙ্ক্ষিত পেমেন্ট অপশনটি সিলেক্ট করুন এবং দ্বিতীয় ধাপ থেকে অ্যাকাউন্ট বিবরণী কপি করে নিন:'}
                </p>
              </div>

              {/* Step 1: Selector Filters & Discovery */}
              {activeSubTab === 'account' && (
                <>
                  <div className="space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50/75 p-4 border border-slate-200/50 rounded-2xl">
                  {/* Category Filter Pills */}
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { key: 'all', label: 'সব গেটওয়ে (All)' },
                      { key: 'mfs', label: 'মোবাইল ওয়ালেট (MFS)' },
                      { key: 'bank', label: 'ব্যাংক ট্র্যান্সফার (Bank)' },
                      { key: 'global', label: 'গ্লোবাল ও ক্রিপ্টো (Global)' }
                    ].map(category => {
                      const count = enabledProviders.filter(p => category.key === 'all' || p.category === category.key).length;
                      const isSelected = selectedCategoryTab === category.key;
                      return (
                        <button
                          key={category.key}
                          type="button"
                          onClick={() => setSelectedCategoryTab(category.key as any)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                            isSelected
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 shadow-2xs'
                          }`}
                        >
                          {category.label}
                          <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${
                            isSelected ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Search Bar Input */}
                  <div className="relative w-full lg:max-w-xs">
                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="খুঁজুন... (e.g. bkash, bank)"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-white border border-slate-200/90 rounded-xl pl-9 pr-8 py-1.5 text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-2xs"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded"
                      >
                        <X size={12} className="stroke-[3]" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-3.5">

                  
                  {filteredProviders.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {filteredProviders.map(provider => {
                        const isSelected = selectedAccountTab === provider.key;
                        return (
                          <button
                            key={provider.key}
                            type="button"
                            onClick={() => setSelectedAccountTab(provider.key as any)}
                            className={`group relative flex flex-col items-center justify-center p-5 rounded-[1.5rem] border text-center transition-all duration-300 pointer-events-auto cursor-pointer ${
                              isSelected 
                                ? `bg-gradient-to-br ${provider.activeBg}`
                                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200/80 hover:scale-[1.015] shadow-2xs hover:shadow-xs'
                            }`}
                          >
                            {/* Selected Indicator Checkmark badge */}
                            {isSelected && (
                              <span className="absolute -top-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm ring-2 ring-white animate-fade-in">
                                <Check size={11} className="stroke-[3]" />
                              </span>
                            )}

                            <div className={`p-3 rounded-2xl bg-white shadow-2xs group-hover:scale-105 transition-transform duration-300 ${isSelected ? 'ring-2 ring-white/50' : ''}`}>
                              {provider.logo}
                            </div>

                            <div className="mt-3 space-y-0.5">
                              <span className="font-extrabold text-slate-800 text-xs block">{provider.label}</span>
                              <span className={`text-[8.5px] font-black uppercase font-mono tracking-widest ${isSelected ? provider.textAccent : 'text-slate-400'}`}>
                                {isSelected ? 'Active Selection' : 'Click to View'}
                              </span>
                              <span className="text-[9px] text-slate-400 font-bold block pt-1 line-clamp-1">{provider.notes}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 px-4 border border-dashed border-slate-200 bg-slate-50 rounded-2xl text-center">
                      <AlertCircle size={28} className="text-slate-400 mb-2 animate-pulse" />
                      <p className="text-xs font-black text-slate-700">কোনো পেমেন্ট চ্যানেল খুঁজে পাওয়া যায়নি!</p>
                      <p className="text-[10px] text-slate-400 mt-1 max-w-xs">অনুগ্রহ করে অন্য কোনো কিওয়ার্ড দিয়ে সার্চ ট্রাই করুন অথবা ক্যাটাগরি ফিল্টার পরিবর্তন করুন।</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Revamped Interactive Cash-out Estimator */}
              <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-[1.8rem] p-5 sm:p-6 border border-slate-800 shadow-md relative overflow-hidden">
                <div className="absolute right-0 bottom-0 w-40 h-40 bg-indigo-600/10 rounded-full blur-2xl"></div>
                <div className="absolute left-10 top-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl"></div>
                
                <div className="relative z-10 space-y-4">
                  {/* Estimator Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles size={16} className="text-amber-400 animate-spin animate-none" />
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-white">লেনদেন ভ্যালু ও ক্যাশ-আউট ফি ক্যালকুলেটর</h4>
                        <p className="text-[10px] text-slate-400 leading-none">গেটওয়ে সেন্ড মানি খরচ ও অতিরিক্ত চার্জ হিসাব করুন</p>
                      </div>
                    </div>
                    {activeFeePercent > 0 ? (
                      <span className="text-[10px] bg-indigo-500/30 text-indigo-300 font-mono font-black border border-indigo-400/20 px-2.5 py-1 rounded-lg">
                        ফি হার: {activeFeePercent}%
                      </span>
                    ) : (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-black border border-emerald-450/20 px-2.5 py-1 rounded-lg">
                        ফি ফ্রি (0% Charge)
                      </span>
                    )}
                  </div>

                  {/* Pricing Inputs */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                    {/* Presets and text input */}
                    <div className="md:col-span-7 space-y-3 font-sans">
                      <div className="flex flex-col gap-1.5 font-sans">
                        <label className="text-[10px] text-slate-450 font-black uppercase tracking-widest font-sans">বিল মূল্য টাইপ করুন (Enter Target Due Bill Amount):</label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-extrabold text-base font-sans">৳</span>
                          <input
                            type="number"
                            min="10"
                            placeholder={dueFees > 0 ? String(dueFees) : "1000"}
                            value={customEstimatorAmount}
                            onChange={(e) => setCustomEstimatorAmount(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-12 py-2 text-sm font-black text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-all font-mono"
                          />
                          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase text-indigo-300">BDT</span>
                        </div>
                      </div>

                      {/* Slider Input for quick drag */}
                      <div className="space-y-1">
                        <input
                          type="range"
                          min="10"
                          max="50000"
                          step="10"
                          value={parsedAmount}
                          onChange={(e) => setCustomEstimatorAmount(e.target.value)}
                          className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-505"
                        />
                        <div className="flex justify-between text-[9px] font-mono text-slate-450">
                          <span>৳10 BDT</span>
                          <span>৳50,000 BDT</span>
                        </div>
                      </div>

                      {/* Presets for fast select */}
                      <div className="flex flex-wrap gap-1.5 pt-1.5">
                        {[500, 1000, 2500, 5000, 10000].map(val => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setCustomEstimatorAmount(String(val))}
                            className="px-2 py-1 rounded-md text-[10px] font-mono font-black bg-white/5 hover:bg-indigo-650 border border-white/5 hover:border-indigo-500 hover:text-white transition-all cursor-pointer"
                          >
                            ৳{val}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Cost Computation Card */}
                    <div className="md:col-span-5 bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3.5">
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">ব্যালেন্স অ্যামাউন্ট (Required):</span>
                          <span className="font-mono font-extrabold text-indigo-200 font-bold">৳{parsedAmount.toFixed(2)} BDT</span>
                        </div>
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-400 font-sans">লেনদেন সার্ভিস চার্জ ({activeFeePercent}%):</span>
                          <span className="font-mono font-extrabold text-amber-300 font-sans">+ ৳{computedCharge.toFixed(2)} BDT</span>
                        </div>
                      </div>
                      <div className="border-t border-white/10 pt-2.5 flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-350">মোট পেমেন্ট (Send Money Total):</span>
                        <span className="font-mono font-black text-lg text-emerald-450">৳{computedTotal.toFixed(2)} BDT</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
                </>
              )}

              {/* Step 2: Information Credentials Channels Card */}
              {activeSubTab === 'account' && (
                <div className="bg-slate-900 border border-slate-800 rounded-[1.8rem] p-5 sm:p-6 text-white relative">
                <div className="absolute top-4 right-4 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </div>

                <div className="space-y-4">
                  <div className="border-b border-white/10 pb-3 flex justify-between items-center sm:flex-row flex-col gap-2">
                    <span className="text-[10px] uppercase font-black tracking-widest text-slate-450 flex items-center gap-2">
                      অ্যাকাউন্ট পেমেন্ট কপি করে নিন (Copy Account Credentials Detail)
                    </span>
                    <span className="text-[9px] font-mono font-bold bg-white/5 px-2.5 py-1 rounded-md text-indigo-305 tracking-wide self-end">
                      সেটিং পোর্টাল: Active
                    </span>
                  </div>

                  <div className="p-1">
                    {selectedAccountTab === 'bKash' && (
                      <div className="space-y-4 animate-fade-in">
                        <div className="flex justify-between items-center border-b border-white/10 pb-3">
                          <span className="text-xs font-black uppercase text-rose-450 tracking-wider flex items-center gap-2">
                            {bKashLogo} bKash Active Channel
                          </span>
                          <span className="text-[9px] bg-rose-500 text-white font-mono font-black px-2 py-0.5 rounded-full uppercase">Instant Transfer</span>
                        </div>
                        <div className="space-y-1 bg-white/5 p-4 rounded-xl border border-white/5">
                          <span className="text-[10px] text-rose-405 font-bold uppercase block tracking-wider font-mono">মোবাইল নম্বর (bKash Number)</span>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-1">
                            <div className="text-3xl font-mono font-black text-white select-all">{settings.bkashNumber || '01718070273'}</div>
                            <button
                              type="button"
                              onClick={() => handleCopyText(settings.bkashNumber || '01718070273')}
                              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 select-none text-white font-mono font-bold text-[10px] px-3.5 py-1.5 rounded-lg border border-white/5 transition-all self-start sm:self-center"
                            >
                              {copiedText === (settings.bkashNumber || '01718070273') ? (
                                <>
                                  <CheckCircle size={12} className="text-emerald-450" />
                                  কপি হয়েছে!
                                </>
                              ) : (
                                <>
                                  <Copy size={12} />
                                  কপি করুন
                                </>
                              )}
                            </button>
                          </div>
                          <span className="inline-block bg-rose-500 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full mt-3 uppercase tracking-widest font-mono">
                            personal (ব্যক্তিগত অ্যাকাউন্ট)
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed pt-2 font-sans">
                          প্রদত্ত ইউপে পার্সোনাল নাম্বারে সেবামূল্য সেন্ড মানি (Send Money) সম্পন্ন করুন। সেন্ডিং সম্পন্ন হলে প্রাপ্ত ট্রানজেকশন ID অথবা পেমেন্ট ট্রানজেকশন স্ক্রিনশট বা লাস্ট ডিজিট দিয়ে পেমেন্ট অপশন থেকে রিপোর্ট জমা দিন।
                        </p>
                      </div>
                    )}

                    {selectedAccountTab === 'Rocket' && (
                      <div className="space-y-4 animate-fade-in text-left">
                        <div className="flex justify-between items-center border-b border-white/10 pb-3">
                          <span className="text-xs font-black uppercase text-purple-400 tracking-wider flex items-center gap-2 font-sans">
                            Rocket Active Channel
                          </span>
                          <span className="text-[9px] bg-purple-500 text-white font-mono font-black px-2 py-0.5 rounded-full uppercase">Instant Transfer</span>
                        </div>
                        <div className="space-y-1 bg-white/5 p-4 rounded-xl border border-white/5">
                          <span className="text-[10px] text-purple-305 font-bold uppercase block tracking-wider font-mono">রকেট মোবাইল নম্বর (Rocket Number)</span>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-1">
                            <div className="text-3xl font-mono font-black text-white select-all">{settings.rocketNumber || '017180702738'}</div>
                            <button
                              type="button"
                              onClick={() => handleCopyText(settings.rocketNumber || '017180702738')}
                              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 select-none text-white font-mono font-bold text-[10px] px-3.5 py-1.5 rounded-lg border border-white/5 transition-all self-start sm:self-center cursor-pointer font-sans"
                            >
                              {copiedText === (settings.rocketNumber || '017180702738') ? (
                                <>
                                  <CheckCircle size={12} className="text-emerald-450 animate-fade-in" />
                                  কপি হয়েছে!
                                </>
                              ) : (
                                <>
                                  <Copy size={12} />
                                  কপি করুন
                                </>
                              )}
                            </button>
                          </div>
                          <span className="inline-block bg-purple-600 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full mt-3 uppercase tracking-widest font-mono">
                            personal (ব্যক্তিগত অ্যাকাউন্ট)
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed pt-2 font-sans">
                          প্রদত্ত রকেট পার্সোনাল নাম্বারে সেবামূল্য সেন্ড মানি (Send Money) সম্পন্ন করুন। সেন্ডিং সম্পন্ন হলে প্রাপ্ত ট্রানজেকশন ID অথবা পেমেন্ট ট্রানজেকশন স্ক্রিনশট বা লাস্ট ডিজিট দিয়ে পেমেন্ট অপশন থেকে রিপোর্ট জমা দিন।
                        </p>
                      </div>
                    )}

                    {selectedAccountTab === 'Mcash' && (
                      <div className="space-y-4 animate-fade-in text-left">
                        <div className="flex justify-between items-center border-b border-white/10 pb-3">
                          <span className="text-xs font-black uppercase text-emerald-400 tracking-wider flex items-center gap-2 font-sans">
                            {mcashLogo} Mcash Active Channel
                          </span>
                          <span className="text-[9px] bg-emerald-500 text-white font-mono font-black px-2 py-0.5 rounded-full uppercase">Instant Transfer</span>
                        </div>
                        <div className="space-y-1 bg-white/5 p-4 rounded-xl border border-white/5 font-sans">
                          <span className="text-[10px] text-emerald-300 font-bold uppercase block tracking-wider font-mono font-mono">एमकैश নম্বর (Mcash Number)</span>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-1 font-sans">
                            <div className="text-3xl font-mono font-black text-white select-all">{settings.mcashNumber || '01718070273'}</div>
                            <button
                              type="button"
                              onClick={() => handleCopyText(settings.mcashNumber || '01718070273')}
                              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 select-none text-white font-mono font-bold text-[10px] px-3.5 py-1.5 rounded-lg border border-white/5 transition-all self-start sm:self-center cursor-pointer font-sans"
                            >
                              {copiedText === (settings.mcashNumber || '01718070273') ? (
                                <>
                                  <CheckCircle size={12} className="text-emerald-455" animate-fade-in />
                                  কপি হয়েছে!
                                </>
                              ) : (
                                <>
                                  <Copy size={12} />
                                  কপি করুন
                                </>
                              )}
                            </button>
                          </div>
                          <span className="inline-block bg-emerald-600 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full mt-3 uppercase tracking-widest font-mono">
                            personal (ব্যক্তিগত অ্যাকাউন্ট)
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed pt-2 font-sans">
                          প্রদত্ত এমক্যাশ নাম্বারে সেবামূল্য সফলভাবে ট্রান্সফার সম্পন্ন করুন এবং প্রাপ্ত ট্রানজেকশন তথ্য ব্যবহার করে পেমেন্ট রিপোর্ট সাবমিট করুন।
                        </p>
                      </div>
                    )}

                    {selectedAccountTab === 'Bank' && (
                      <div className="space-y-4 animate-fade-in text-left">
                        <div className="flex justify-between items-center border-b border-white/10 pb-3 font-sans">
                          <span className="text-xs font-black uppercase text-slate-350 tracking-wider flex items-center gap-2">
                            Bank Account Details
                          </span>
                          <span className="text-[9px] bg-indigo-500 text-white font-mono font-black px-2 py-0.5 rounded-full uppercase font-sans">Transfer</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white/5 p-4 rounded-xl border border-white/5 text-xs text-left font-sans">
                          <div>
                            <strong className="text-indigo-305 block uppercase text-[9px] tracking-wider font-mono text-indigo-300">Bank Name</strong>
                            <span className="font-extrabold text-sm">{settings.bankName || "Dutch Bangla Bank"}</span>
                          </div>
                          <div>
                            <strong className="text-indigo-350 block uppercase text-[9px] tracking-wider font-mono text-indigo-350">Account Name</strong>
                            <span className="font-extrabold text-sm">{settings.accountName || "Master Tech Limited"}</span>
                          </div>
                          <div className="sm:col-span-2 flex items-center justify-between bg-white/5 p-2.5 rounded-lg border border-white/5 mt-1 font-sans">
                            <div>
                              <strong className="text-indigo-305 block uppercase text-[9px] tracking-wider font-mono text-indigo-300">Account Number</strong>
                              <span className="font-mono font-black select-all tracking-wider text-base text-white">{settings.accountNo || "15012019487120398"}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopyText(settings.accountNo || "15012019487120398")}
                              className="flex items-center gap-1 bg-white/10 hover:bg-white/20 select-none text-white font-mono font-bold text-[10px] px-2.5 py-1.5 rounded-md border border-white/5 transition-all self-center cursor-pointer"
                            >
                              {copiedText === (settings.accountNo || "15012019487120398") ? (
                                <>
                                  <CheckCircle size={11} className="text-emerald-450" />
                                  কপিড!
                                </>
                              ) : (
                                <>
                                  <Copy size={11} />
                                  কপি
                                </>
                              )}
                            </button>
                          </div>
                          <div className="sm:col-span-2 text-indigo-350 leading-relaxed font-sans mt-1">
                            <strong>Branch:</strong> {settings.branchName || "Dhaka Main Branch"}
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedAccountTab === 'Binance' && (
                      <div className="space-y-4 animate-fade-in text-left">
                        <div className="flex justify-between items-center border-b border-white/10 pb-3 font-mono">
                          <span className="text-xs font-black uppercase text-yellow-500 tracking-wider flex items-center gap-2">
                            ⚡ Binance Active channel (Instant USDT Gateway)
                          </span>
                          <span className="text-[9px] bg-yellow-500 text-black font-mono font-black px-2 py-0.5 rounded-full uppercase font-sans">Instant Transfer</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white/5 p-4 rounded-xl border border-white/5 text-xs text-left">
                          <div className="flex flex-col justify-between font-sans">
                            <div>
                              <span className="text-[9px] text-yellow-405 font-bold uppercase block tracking-wider font-mono text-yellow-500 font-sans font-bold">বাইনান্স পে আইডি (Binance Pay ID)</span>
                              <div className="text-xl font-mono font-black text-white select-all mt-1">{settings.binancePayId || '542901726'}</div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopyText(settings.binancePayId || '542901726')}
                              className="mt-2 flex items-center gap-1 bg-white/10 hover:bg-white/20 select-none text-white font-mono font-bold text-[9px] px-2.5 py-1 rounded transition-all self-start cursor-pointer"
                            >
                              {copiedText === (settings.binancePayId || '542901726') ? (
                                <><CheckCircle size={10} className="text-emerald-400" />  কপিড</>
                              ) : (
                                <><Copy size={10} />  কপি</>
                              )}
                            </button>
                          </div>
                          <div className="flex flex-col justify-between font-sans">
                            <div>
                              <span className="text-[9px] text-yellow-455 font-bold uppercase block tracking-wider font-mono text-yellow-500 font-sans font-bold">ইউএসডিটি এড্রেস (USDT TRC20)</span>
                              <div className="text-[9px] font-mono font-bold text-white select-all mt-1 break-all bg-white/5 p-1 px-2 rounded">{settings.binanceUsdtAddress || 'TYm7A8WqyY4fFsh9SgH8eD2c1T9Z9sK8nQ'}</div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopyText(settings.binanceUsdtAddress || 'TYm7A8WqyY4fFsh9SgH8eD2c1T9Z9sK8nQ')}
                              className="mt-2 flex items-center gap-1 bg-white/10 hover:bg-white/20 select-none text-white font-mono font-bold text-[9px] px-2.5 py-1 rounded transition-all self-start cursor-pointer font-sans"
                            >
                              {copiedText === (settings.binanceUsdtAddress || 'TYm7A8WqyY4fFsh9SgH8eD2c1T9Z9sK8nQ') ? (
                                <><CheckCircle size={10} className="text-emerald-400" />  কপিড</>
                              ) : (
                                <><Copy size={10} />  কপি</>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedAccountTab === 'PayPal' && (
                      <div className="space-y-4 animate-fade-in text-left font-sans">
                        <div className="flex justify-between items-center border-b border-white/10 pb-3 font-sans">
                          <span className="text-xs font-black uppercase text-sky-450 tracking-wider flex items-center gap-2">
                            PayPal Active Channel
                          </span>
                          <span className="text-[9px] bg-sky-500 text-white font-mono font-black px-2 py-0.5 rounded-full uppercase">Instant Transfer</span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/5 p-4 rounded-xl border border-white/5">
                          <div>
                            <span className="text-[9px] text-sky-450 font-bold uppercase tracking-wider font-mono">পেপ্যাল ইমেইল (PayPal Email)</span>
                            <div className="text-lg font-mono font-black text-white select-all break-all">{settings.paypalEmail || 'masterbuild14@gmail.com'}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopyText(settings.paypalEmail || 'masterbuild14@gmail.com')}
                            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 select-none text-white font-mono font-bold text-[10px] px-3.5 py-1.5 rounded-lg border border-white/5 transition-all self-start sm:self-center shrink-0 cursor-pointer"
                          >
                            {copiedText === (settings.paypalEmail || 'masterbuild14@gmail.com') ? (
                              <>
                                <CheckCircle size={11} className="text-emerald-400" />
                                কপি হয়েছে
                              </>
                            ) : (
                              <>
                                <Copy size={11} />
                                কপি করুন
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })()}

              {/* Step 3: Top-Up Ticket details with live provider help card */}
              {activeSubTab === 'payment' && (
                <>
                  {topUpMethod && (() => {
                return (
                  <div className="bg-slate-900 border border-slate-800 rounded-[1.8rem] p-5 sm:p-6 text-white relative mt-5">
                    <div className="absolute top-4 right-4 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </div>

                    <div className="space-y-4">
                      <div className="border-b border-white/10 pb-3 flex justify-between items-center sm:flex-row flex-col gap-2 text-left">
                        <span className="text-[10px] uppercase font-black tracking-widest text-slate-450 font-sans">
                          পেমেন্ট করুন ও অ্যাকাউন্ট কপি করে নিন (Selected Payment Gateway Details)
                        </span>
                        <span className="text-[9px] font-mono font-bold bg-white/5 px-2.5 py-1 rounded-md text-amber-400 tracking-wide self-end">
                          পেমেন্ট চ্যানেল: সচল
                        </span>
                      </div>

                      <div className="p-1 text-left">
                        {topUpMethod === 'bKash' && (
                          <div className="space-y-4 animate-fade-in text-left">
                            <div className="flex justify-between items-center border-b border-white/10 pb-3 border-none">
                              <span className="text-xs font-black uppercase text-rose-455 tracking-wider flex items-center gap-2 font-sans">
                                {bKashLogo} bKash Active Channel
                              </span>
                              <span className="text-[9px] bg-rose-500 text-white font-mono font-black px-2 py-0.5 rounded-full uppercase">Instant Transfer</span>
                            </div>
                            <div className="space-y-1 bg-white/5 p-4 rounded-xl border border-white/5">
                              <span className="text-[10px] text-rose-405 font-bold uppercase block tracking-wider font-mono">বিকাশ মোবাইল নম্বর (bKash Number)</span>
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-1 font-sans">
                                <div className="text-3xl font-mono font-black text-white select-all">{settings.bkashNumber || '01718070273'}</div>
                                <button
                                  type="button"
                                  onClick={() => handleCopyText(settings.bkashNumber || '01718070273')}
                                  className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 select-none text-white font-mono font-bold text-[10px] px-3.5 py-1.5 rounded-lg border border-white/5 transition-all self-start sm:self-center cursor-pointer font-sans"
                                >
                                  {copiedText === (settings.bkashNumber || '01718070273') ? (
                                    <>
                                      <CheckCircle size={12} className="text-emerald-450 animate-fade-in" />
                                      কপি হয়েছে!
                                    </>
                                  ) : (
                                    <>
                                      <Copy size={12} />
                                      কপি করুন
                                    </>
                                  )}
                                </button>
                              </div>
                              <span className="inline-block bg-rose-500 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full mt-3 uppercase tracking-widest font-mono">
                                personal (ব্যক্তিগত অ্যাকাউন্ট)
                              </span>
                            </div>
                          </div>
                        )}

                        {topUpMethod === 'Nagad' && (
                          <div className="space-y-4 animate-fade-in text-left">
                            <div className="flex justify-between items-center border-b border-white/10 pb-3 border-none">
                              <span className="text-xs font-black uppercase text-amber-500 tracking-wider flex items-center gap-2 font-sans">
                                {nagadLogo} Nagad Active Channel
                              </span>
                              <span className="text-[9px] bg-amber-500 text-white font-mono font-black px-2 py-0.5 rounded-full uppercase">Instant Transfer</span>
                            </div>
                            <div className="space-y-1 bg-white/5 p-4 rounded-xl border border-white/5">
                              <span className="text-[10px] text-orange-405 font-bold uppercase block tracking-wider font-mono font-sans font-bold">নগদ মোবাইল নম্বর (Nagad Number)</span>
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-1 font-sans">
                                <div className="text-3xl font-mono font-black text-white select-all">{settings.nagadNumber || '01718070273'}</div>
                                <button
                                  type="button"
                                  onClick={() => handleCopyText(settings.nagadNumber || '01718070273')}
                                  className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 select-none text-white font-mono font-bold text-[10px] px-3.5 py-1.5 rounded-lg border border-white/5 transition-all self-start sm:self-center cursor-pointer font-sans"
                                >
                                  {copiedText === (settings.nagadNumber || '01718070273') ? (
                                    <>
                                      <CheckCircle size={12} className="text-emerald-450" />
                                      কপি হয়েছে!
                                    </>
                                  ) : (
                                    <>
                                      <Copy size={12} />
                                      কপি করুন
                                    </>
                                  )}
                                </button>
                              </div>
                              <span className="inline-block bg-orange-500 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full mt-3 uppercase tracking-widest font-mono">
                                personal (ব্যক্তিগত অ্যাকাউন্ট)
                              </span>
                            </div>
                          </div>
                        )}

                        {topUpMethod === 'Upay' && (
                          <div className="space-y-4 animate-fade-in text-left">
                            <div className="flex justify-between items-center border-b border-white/10 pb-3 border-none">
                              <span className="text-xs font-black uppercase text-indigo-405 tracking-wider flex items-center gap-2 font-sans">
                                {upayLogo} Upay Active Channel
                              </span>
                              <span className="text-[9px] bg-indigo-650 text-white font-mono font-black px-2 py-0.5 rounded-full uppercase font-sans font-bold">Instant Transfer</span>
                            </div>
                            <div className="space-y-1 bg-white/5 p-4 rounded-xl border border-white/5">
                              <span className="text-[10px] text-indigo-305 font-bold uppercase block tracking-wider font-mono">ইউপে মোবাইল নম্বর (Upay Number)</span>
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-1 font-sans">
                                <div className="text-3xl font-mono font-black text-white select-all">{settings.upayNumber || '01718070273'}</div>
                                <button
                                  type="button"
                                  onClick={() => handleCopyText(settings.upayNumber || '01718070273')}
                                  className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 select-none text-white font-mono font-bold text-[10px] px-3.5 py-1.5 rounded-lg border border-white/5 transition-all self-start sm:self-center cursor-pointer"
                                >
                                  {copiedText === (settings.upayNumber || '01718070273') ? (
                                    <>
                                      <CheckCircle size={12} className="text-emerald-450" />
                                      কপি হয়েছে!
                                    </>
                                  ) : (
                                    <>
                                      <Copy size={12} />
                                      কপি করুন
                                    </>
                                  )}
                                </button>
                              </div>
                              <span className="inline-block bg-indigo-600 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full mt-3 uppercase tracking-widest font-mono font-mono font-bold">
                                personal (ব্যক্তিগত অ্যাকাউন্ট)
                              </span>
                            </div>
                          </div>
                        )}

                        {topUpMethod === 'Rocket' && (
                          <div className="space-y-4 animate-fade-in text-left">
                            <div className="flex justify-between items-center border-b border-white/10 pb-3 border-none">
                              <span className="text-xs font-black uppercase text-purple-400 tracking-wider flex items-center gap-2 font-sans">
                                Rocket Active Channel
                              </span>
                              <span className="text-[9px] bg-purple-500 text-white font-mono font-black px-2 py-0.5 rounded-full uppercase">Instant Transfer</span>
                            </div>
                            <div className="space-y-1 bg-white/5 p-4 rounded-xl border border-white/5">
                              <span className="text-[10px] text-purple-350 font-bold uppercase block tracking-wider font-mono">রকেট মোবাইল নম্বর (Rocket Number)</span>
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-1 font-sans">
                                <div className="text-3xl font-mono font-black text-white select-all">{settings.rocketNumber || '017180702738'}</div>
                                <button
                                  type="button"
                                  onClick={() => handleCopyText(settings.rocketNumber || '017180702738')}
                                  className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 select-none text-white font-mono font-bold text-[10px] px-3.5 py-1.5 rounded-lg border border-white/5 transition-all self-start sm:self-center cursor-pointer font-sans"
                                >
                                  {copiedText === (settings.rocketNumber || '017180702738') ? (
                                    <>
                                      <CheckCircle size={12} className="text-emerald-455" />
                                      কপি হয়েছে!
                                    </>
                                  ) : (
                                    <>
                                      <Copy size={12} />
                                      কপি করুন
                                    </>
                                  )}
                                </button>
                              </div>
                              <span className="inline-block bg-purple-600 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full mt-3 uppercase tracking-widest font-mono">
                                personal (ব্যক্তিগত অ্যাকাউন্ট)
                              </span>
                            </div>
                          </div>
                        )}

                        {topUpMethod === 'Mcash' && (
                          <div className="space-y-4 animate-fade-in text-left">
                            <div className="flex justify-between items-center border-b border-white/10 pb-3 border-none text-xs">
                              <span className="text-xs font-black uppercase text-emerald-400 tracking-wider flex items-center gap-2 font-sans">
                                {mcashLogo} Mcash Active Channel
                              </span>
                              <span className="text-[9px] bg-emerald-500 text-white font-mono font-black px-2 py-0.5 rounded-full uppercase">Instant Transfer</span>
                            </div>
                            <div className="space-y-1 bg-white/5 p-4 rounded-xl border border-white/5">
                              <span className="text-[10px] text-emerald-305 font-bold uppercase block tracking-wider font-mono">एमক্যাশ মোবাইল নম্বর (Mcash Number)</span>
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-1 font-sans font-bold">
                                <div className="text-3xl font-mono font-black text-white select-all">{settings.mcashNumber || '01718070273'}</div>
                                <button
                                  type="button"
                                  onClick={() => handleCopyText(settings.mcashNumber || '01718070273')}
                                  className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 select-none text-white font-mono font-bold text-[10px] px-3.5 py-1.5 rounded-lg border border-white/5 transition-all self-start sm:self-center cursor-pointer font-sans"
                                >
                                  {copiedText === (settings.mcashNumber || '01718070273') ? (
                                    <>
                                      <CheckCircle size={12} className="text-emerald-455" />
                                      কপি হয়েছে!
                                    </>
                                  ) : (
                                    <>
                                      <Copy size={12} />
                                      কপি করুন
                                    </>
                                  )}
                                </button>
                              </div>
                              <span className="inline-block bg-emerald-600 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full mt-3 uppercase tracking-widest font-mono">
                                personal (ব্যক্তিগত অ্যাকাউন্ট)
                              </span>
                            </div>
                          </div>
                        )}

                        {topUpMethod === 'Bank' && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white/5 p-4 rounded-lg border border-white/5 text-xs text-left">
                            <div>
                              <strong className="text-indigo-305 block uppercase text-[9px] tracking-wider font-mono text-indigo-300 font-sans">Bank Name</strong>
                              <span className="font-extrabold text-sm text-slate-100">{settings.bankName || "Dutch Bangla Bank"}</span>
                            </div>
                            <div>
                              <strong className="text-indigo-350 block uppercase text-[9px] tracking-wider font-mono text-indigo-350 font-sans">Account Name</strong>
                              <span className="font-extrabold text-sm text-slate-100">{settings.accountName || "Master Tech Limited"}</span>
                            </div>
                            <div className="sm:col-span-2 flex items-center justify-between bg-white/5 p-2.5 rounded-lg border border-white/5 mt-1 font-sans">
                              <div>
                                <strong className="text-indigo-305 block uppercase text-[9px] tracking-wider font-mono text-indigo-300">Account Number</strong>
                                <span className="font-mono font-black select-all tracking-wider text-base text-white">{settings.accountNo || "15012019487120398"}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleCopyText(settings.accountNo || "15012019487120398")}
                                className="flex items-center gap-1 bg-white/10 hover:bg-white/20 select-none text-white font-mono font-bold text-[10px] px-2.5 py-1.5 rounded-md border border-white/5 transition-all self-center cursor-pointer"
                              >
                                {copiedText === (settings.accountNo || "15012019487120398") ? (
                                  <>
                                    <CheckCircle size={11} className="text-emerald-455" />
                                    কপিড!
                                  </>
                                ) : (
                                  <>
                                    <Copy size={11} />
                                    কপি
                                  </>
                                )}
                              </button>
                            </div>
                            <div className="sm:col-span-2 text-indigo-350 leading-relaxed font-sans mt-1">
                              <strong>Branch:</strong> {settings.branchName || "Dhaka Main Branch"}
                            </div>
                          </div>
                        )}

                        {topUpMethod === 'Binance' && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white/5 p-3 rounded-lg border border-white/5 text-xs text-left">
                            <div className="flex flex-col justify-between font-sans">
                              <div>
                                <span className="text-[8.5px] text-yellow-400 font-bold uppercase block tracking-wider font-mono">বাইনান্স পে আইডি (Binance Pay ID)</span>
                                <div className="text-xl font-mono font-black text-white select-all mt-1">{settings.binancePayId || '542901726'}</div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleCopyText(settings.binancePayId || '542901726')}
                                className="mt-2 flex items-center gap-1 bg-white/10 hover:bg-white/20 select-none text-white font-mono font-bold text-[9px] px-2.5 py-1 rounded transition-all self-start cursor-pointer font-sans"
                              >
                                {copiedText === (settings.binancePayId || '542901726') ? (
                                  <><CheckCircle size={10} className="text-emerald-400" />  কপিড</>
                                ) : (
                                  <><Copy size={10} />  কপি</>
                                )}
                              </button>
                            </div>
                            <div className="flex flex-col justify-between font-sans">
                              <div>
                                <span className="text-[8.5px] text-yellow-405 font-bold uppercase block tracking-wider font-mono">ইউএসডিটি এড্রেস (USDT TRC20)</span>
                                <div className="text-[10px] font-mono font-bold text-white select-all mt-1 break-all bg-white/5 p-1 px-2 rounded">{settings.binanceUsdtAddress || 'TYm7A8WqyY4fFsh9SgH8eD2c1T9Z9sK8nQ'}</div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleCopyText(settings.binanceUsdtAddress || 'TYm7A8WqyY4fFsh9SgH8eD2c1T9Z9sK8nQ')}
                                className="mt-2 flex items-center gap-1 bg-white/10 hover:bg-white/20 select-none text-white font-mono font-bold text-[9px] px-2.5 py-1 rounded transition-all self-start cursor-pointer font-sans"
                              >
                                {copiedText === (settings.binanceUsdtAddress || 'TYm7A8WqyY4fFsh9SgH8eD2c1T9Z9sK8nQ') ? (
                                  <><CheckCircle size={10} className="text-emerald-400" />  কপিড</>
                                ) : (
                                  <><Copy size={10} />  কপি</>
                                )}
                              </button>
                            </div>
                          </div>
                        )}

                        {topUpMethod === 'PayPal' && (
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/5 p-3 rounded-lg border border-white/5 font-sans">
                            <div>
                              <span className="text-[8.5px] text-sky-400 font-bold uppercase tracking-wider font-mono">পেপ্যাল ইমেইল (PayPal Email)</span>
                              <div className="text-lg font-mono font-black text-white select-all break-all">{settings.paypalEmail || 'masterbuild14@gmail.com'}</div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopyText(settings.paypalEmail || 'masterbuild14@gmail.com')}
                              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 select-none text-white font-mono font-bold text-[10px] px-3.5 py-1.5 rounded-lg border border-white/5 transition-all self-start sm:self-center shrink-0 cursor-pointer"
                            >
                              {copiedText === (settings.paypalEmail || 'masterbuild14@gmail.com') ? (
                                <>
                                  <CheckCircle size={11} className="text-emerald-400" />
                                  কপি হয়েছে
                                </>
                              ) : (
                                <>
                                  <Copy size={11} />
                                  কপি করুন
                                </>
                              )}
                            </button>
                          </div>
                        )}

                        <p className="text-[10px] text-slate-400 font-medium leading-relaxed font-sans">
                          উপরে প্রদর্শিত কোম্পানির সঠিক নাম্বারে বা তথ্য অনুযায়ী পেমেন্ট সেন্ড করুন। পেমেন্ট সম্পূর্ণ করা হলে নিচের ধাপে প্রাপ্ত ট্রানজেকশন ID অথবা আপনার প্রেরক নম্বরের শেষ সংখ্যা এবং সঠিক পরিমাণ লিখে ফর্মটি জমা দিন।
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {!topUpMethod && (
                <div className="mt-2 py-4 px-3 border border-dashed border-slate-200 bg-white rounded-xl text-center flex flex-col items-center justify-center font-sans">
                  <AlertCircle size={20} className="text-rose-400 mb-1.5 animate-pulse" />
                  <p className="text-xs font-bold text-slate-500 font-sans">কোন পেমেন্ট মাধ্যম সিলেক্ট করা হয়নি</p>
                  <p className="text-[9.5px] text-slate-400 mt-0.5 font-sans">রিপোর্ট সাবমিট করার জন্য অনুগ্রহ করে উপরে যেকোনো একটি গেটওয়ে অপশনে ক্লিক করুন।</p>
                </div>
              )}

              {resubmittingInvoiceId && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in mb-6">
                  <div className="flex items-start gap-2.5 text-left text-xs text-amber-805 leading-relaxed font-sans font-bold">
                    <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={16} />
                    <span>আপনি উইথড্র/রিজেক্টেড পেমেন্ট <strong className="font-mono text-indigo-600 bg-white px-2 py-0.5 border border-indigo-200/50 rounded-md select-all">{resubmittingInvoiceId}</strong> সংশোধন করছেন। ফর্ম পূরণ করে পুনরায় পাঠান।</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setResubmittingInvoiceId(null);
                      setTopUpMethod('');
                      setTopUpAmount('');
                      setTopUpTxn('');
                      setTopUpPurpose('');
                      generateNewInvoiceMeta();
                    }}
                    className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 hover:border-slate-350 text-[10px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-xl transition-all cursor-pointer font-sans active:scale-95 shrink-0"
                  >
                    সংশোধন বাতিল (Cancel)
                  </button>
                </div>
              )}

              {topUpSuccess && (
                <div className="bg-emerald-50 text-emerald-700 text-xs font-bold p-4 rounded-xl border border-emerald-200/60 mb-6 animate-fade-in flex items-start gap-2 leading-relaxed text-left">
                  <CheckCircle size={18} className="shrink-0 text-emerald-500 mt-0.5" />
                  <span>{topUpSuccess}</span>
                </div>
              )}

              {topUpError && (
                <div className="bg-rose-50 text-rose-600 text-xs font-bold p-4 rounded-xl border border-rose-200/60 mb-6 animate-fade-in flex items-start gap-2 text-left">
                  <ShieldAlert size={18} className="shrink-0 text-rose-500 mt-0.5" />
                  <span>{topUpError}</span>
                </div>
              )}

              <form onSubmit={handleTopUpSubmit} className="space-y-5">
                {/* Auto Billing Metadata Section */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1 font-sans">
                      <FileText size={12} className="text-indigo-600" />
                      ইনভয়েস নাম্বার (Invoice Number) *
                    </label>
                    <div className="relative flex items-center">
                      <input 
                        type="text" 
                        value={clientInvoiceNumber} 
                        readOnly 
                        className="w-full bg-slate-100 border border-slate-250 rounded-xl py-2.5 pl-3.5 pr-10 text-xs font-mono font-black text-slate-700 outline-none select-all"
                        placeholder="Generating..."
                      />
                      {!resubmittingInvoiceId && (
                        <button 
                          type="button" 
                          onClick={generateNewInvoiceMeta}
                          title="নতুন ইনভয়েস নাম্বার জেনারেট করুন"
                          className="absolute right-2 p-1.5 bg-white text-indigo-600 hover:text-indigo-800 rounded-lg border border-slate-200/80 hover:bg-slate-50 transition-all font-sans active:scale-90"
                        >
                          <RefreshCw size={12} className="animate-spin-once" />
                        </button>
                      )}
                    </div>
                  </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1 font-sans">
                    <Clock size={12} className="text-indigo-600" />
                    ইনভয়েস তারিখ (Invoice Date) *
                  </label>
                  <input 
                    type="date" 
                    value={clientInvoiceDate} 
                    onChange={(e) => setClientInvoiceDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-sans font-bold text-slate-700 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1 font-sans">
                    <Clock size={12} className="text-indigo-600" />
                    ইনভয়েস তৈরির সময় (Invoice Time) *
                  </label>
                  <input 
                    type="text" 
                    value={clientInvoiceTime} 
                    readOnly 
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-mono font-black text-slate-600 outline-none select-all"
                    placeholder="HH:MM:SS AM/PM"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-405 uppercase tracking-widest mb-1.5 flex items-center gap-1 font-sans">
                    <CreditCard size={12} className="text-indigo-600" />
                    পেমেন্ট মাধ্যম (Payment Method) *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPaymentOptions(!showPaymentOptions)}
                    className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-xl py-2.5 px-3.5 text-xs font-sans font-black text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all text-left flex items-center justify-between cursor-pointer shadow-3xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full shrink-0 ${topUpMethod ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                      <span className="uppercase text-slate-750 font-mono tracking-wide">
                        {topUpMethod ? (allProviders.find(p => p.key === topUpMethod)?.label || topUpMethod) : 'এখানে ক্লিক করে পেমেন্ট মাধ্যম সিলেক্ট করুন (Click to Select)'}
                      </span>
                    </div>
                    {showPaymentOptions ? (
                      <ChevronUp size={14} className="text-slate-500 shrink-0" />
                    ) : (
                      <ChevronDown size={14} className="text-slate-500 shrink-0" />
                    )}
                  </button>
                </div>
              </div>

              {/* Dynamic Bottom Sheet / Overlay Modal for Selector Options */}
              {showPaymentOptions && (
                <div 
                  className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
                  onClick={() => setShowPaymentOptions(false)}
                >
                  <div 
                    className="bg-white w-full max-w-md rounded-t-[2rem] sm:rounded-3xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden max-h-[85vh] sm:max-h-[90vh] animate-slide-up"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Pull handler for mobile */}
                    <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-3.5 mb-2.5 sm:hidden" />

                    {/* Modal Header */}
                    <div className="px-5.5 py-4 border-b border-slate-105 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CreditCard size={16} className="text-indigo-600" />
                        <h3 className="font-extrabold text-xs text-slate-800 uppercase tracking-widest font-sans">
                          {settings.clientPaymentMethodLabel || 'পেমেন্ট মাধ্যম নির্বাচন করুন'}
                        </h3>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setShowPaymentOptions(false)}
                        className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    {/* Providers Scroll Area */}
                    <div className="overflow-y-auto divide-y divide-slate-100 max-h-[50vh] sm:max-h-[60vh] select-none">
                      {allProviders.filter(p => p.enabled).map(provider => {
                        const isSelected = topUpMethod === provider.key;
                        return (
                          <button
                            key={provider.key}
                            type="button"
                            onClick={() => {
                              setTopUpMethod(provider.key);
                              setShowPaymentOptions(false);
                            }}
                            className={`w-full flex items-center justify-between px-5.5 py-4 text-left transition-all hover:bg-slate-50 duration-200 cursor-pointer ${
                              isSelected ? 'bg-indigo-50/20' : ''
                            }`}
                          >
                            <div className="flex items-center gap-3.5 font-sans">
                              <div className="p-1 rounded-xl bg-slate-50 border border-slate-100 shadow-3xs shrink-0 flex items-center justify-center w-9 h-9">
                                {provider.logo}
                              </div>
                              <div>
                                <span className="font-sans font-black text-slate-800 text-[11px] block leading-snug tracking-tight">
                                  {provider.label}
                                </span>
                                <span className="font-sans text-[8.5px] text-slate-400 font-extrabold block mt-0.5 uppercase tracking-wide">
                                  {provider.notes}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center font-sans">
                              {isSelected ? (
                                <div className="w-5 h-5 rounded-full border-2 border-indigo-600 flex items-center justify-center transition-all scale-105 duration-300">
                                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                                </div>
                              ) : (
                                <div className="w-5 h-5 rounded-full border-2 border-slate-250 hover:border-slate-400 transition-colors" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    <div className="p-4 bg-slate-50 border-t border-slate-105 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setShowPaymentOptions(false)}
                        className="w-full sm:w-auto px-5 py-2 hover:bg-slate-200 bg-slate-150 text-slate-700 font-extrabold rounded-xl text-[10px] uppercase tracking-wider transition-all cursor-pointer text-center font-sans border border-slate-200"
                      >
                        বাতিল করুন (Cancel)
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {topUpPurpose === 'Android App Purchase' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl animate-fade-in text-left">
                  <div>
                    <label className="block text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1.5 font-sans">অ্যাপের নাম (App Name) *</label>
                    <input 
                      type="text" 
                      value={ticketAppName}
                      onChange={(e) => setTicketAppName(e.target.value)}
                      className="w-full bg-white border border-indigo-200 rounded-xl py-3 px-3.5 text-xs font-bold text-slate-800 placeholder:text-slate-350 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
                      placeholder="e.g. Live TV Pro"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1.5 font-sans">প্যাকেজ আইডি (Package Name) *</label>
                    <input 
                      type="text" 
                      value={ticketAppPackageName}
                      onChange={(e) => setTicketAppPackageName(e.target.value)}
                      className="w-full bg-white border border-indigo-200 rounded-xl py-3 px-3.5 text-xs font-bold text-slate-800 placeholder:text-slate-355 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none font-mono"
                      placeholder="e.g. dev.masterbuild.tv"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1.5 font-sans">প্রোটোকল টাইপ (Protocol Type) *</label>
                    <select 
                      value={ticketAppProtocol} 
                      onChange={(e) => setTicketAppProtocol(e.target.value)}
                      className="w-full bg-white border border-indigo-200 rounded-xl py-3 px-3.5 text-xs font-bold text-slate-700 font-sans focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
                      required
                    >
                      <option value="">-- প্রোটোকল সিলেক্ট * --</option>
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i+1} value={`Protocol ${i+1}`}>Protocol {i+1}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1.5 font-sans">অ্যাপের কোয়ালিটি (App Quality) *</label>
                    <select 
                      value={ticketAppQuality} 
                      onChange={(e) => setTicketAppQuality(e.target.value)}
                      className="w-full bg-white border border-indigo-200 rounded-xl py-3 px-3.5 text-xs font-bold text-slate-700 font-sans focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
                      required
                    >
                      <option value="">-- কোয়ালিটি সিলেক্ট * --</option>
                      <option value="SD Quality">SD Quality (স্ট্যান্ডার্ড)</option>
                      <option value="FHD Quality">FHD Quality (প্রিমিয়াম)</option>
                      <option value="4K Quality">4K UHD Quality (আল্ট্রা প্রিমিয়াম)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1.5 font-sans">অ্যাপের ধরণ (App Type) *</label>
                    <select 
                      value={ticketAppType} 
                      onChange={(e) => setTicketAppType(e.target.value)}
                      className="w-full bg-white border border-indigo-200 rounded-xl py-3 px-3.5 text-xs font-bold text-slate-700 font-sans focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
                      required
                    >
                      <option value="">-- অ্যাপ টাইপ সিলেক্ট * --</option>
                      {['Single App (একক অ্যাপ)', 'Multi App (মাল্টিপল সংযোগ)', 'Reseller App (রিসেলিং প্যানেল সমর্থিত)'].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1.5 font-sans">কাজের ধরণ (Work Type) *</label>
                    <select 
                      value={ticketAppWorkType} 
                      onChange={(e) => setTicketAppWorkType(e.target.value)}
                      className="w-full bg-white border border-indigo-200 rounded-xl py-3 px-3.5 text-xs font-bold text-slate-705 font-sans focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
                      required
                    >
                      <option value="">-- কাজের ধরণ সিলেক্ট * --</option>
                      {['New app compilation', 'App update config', 'App logo & name change'].map(w => (
                        <option key={w} value={w}>{w}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {['Binance $ Purchase', 'Redotpay $ Purchase', 'Facebook Boost', 'Banner Making', 'Logo Making', 'Others / Etc'].includes(topUpPurpose) && (
                <div className="grid grid-cols-1 gap-4 p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl animate-fade-in text-left">
                  <div>
                    <label className="block text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1.5 font-sans">
                      {topUpPurpose === 'Binance $ Purchase' && 'বাইনেন্স আইডি বা অতিরিক্ত তথ্য (Binance Email / Pay ID) *'}
                      {topUpPurpose === 'Redotpay $ Purchase' && 'রেডটপে একাউন্ট বা অতিরিক্ত তথ্য (Redotpay Account / Pay ID) *'}
                      {topUpPurpose === 'Facebook Boost' && 'ফেসবুক পেজ লিংক বা বুস্ট বিবরণ (Facebook Page Link / Details) *'}
                      {topUpPurpose === 'Banner Making' && 'ব্যানার টেক্সট ও বিবরণ (Banner Text & Dimensions / Details) *'}
                      {topUpPurpose === 'Logo Making' && 'লোগো নাম বা ডিজাইন বিবরণ (Logo Name & Concept / Details) *'}
                      {topUpPurpose === 'Others / Etc' && 'সার্ভিস বিবরণ ও অতিরিক্ত তথ্য (Service Details / Notes) *'}
                    </label>
                    <textarea 
                      value={ticketServiceDetails}
                      onChange={(e) => setTicketServiceDetails(e.target.value)}
                      rows={3}
                      className="w-full bg-white border border-indigo-200 rounded-xl py-3 px-3.5 text-xs font-sans font-bold text-slate-800 placeholder:text-slate-350 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
                      placeholder={
                        topUpPurpose === 'Binance $ Purchase' ? "e.g. Binance Pay ID: 12345678, Amount: 15 USD" :
                        topUpPurpose === 'Redotpay $ Purchase' ? "e.g. Redotpay Account: receiver@example.com, Amount: 20 USD" :
                        topUpPurpose === 'Facebook Boost' ? "e.g. Page URL: fb.com/mypage, Budget/Days: $10/5days" :
                        topUpPurpose === 'Banner Making' ? "e.g. Banner Text: 'Eid Mubarak Sale', Colors: Gold/Red, Dimensions: 1280x720" :
                        topUpPurpose === 'Logo Making' ? "e.g. Company Name: 'Skyline Tech', Logo Concept: Sleek & Modern" :
                        "e.g. Details of your custom requested service"
                      }
                      required
                    />
                  </div>
                </div>
              )}

<div className="pt-2">
                {!isFormValid && (
                  <p className="text-[9.5px] font-black text-amber-600 uppercase tracking-wider mb-2.5 bg-amber-50/50 border border-amber-100 p-2 rounded-lg text-center animate-pulse">
                    ⚠️ {settings.clientPaymentErrorMessage || 'ফর্মের সব অপশন ও তথ্য সঠিকভাবে নির্বাচন/পূরণ করুন।'}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isTopUpLoading || !isFormValid}
                  className="w-full py-4 bg-indigo-650 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isTopUpLoading ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      অনুরোধ প্রসেস করা হচ্ছে...
                    </>
                  ) : (
                    resubmittingInvoiceId
                      ? 'সংশোধন করে পুনরায় পাঠান (Resubmit Corrected Payment)'
                      : (settings.clientPaymentSubmitButtonLabel || 'পেমেন্ট রিকোয়েস্ট সাবমিট করুন (Submit Payment Ticket)')
                  )}
                </button>
              </div>
            </form>
          </>
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

        {/* Global Client Dashboard Footer */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col items-center justify-between text-[10px] font-mono font-black uppercase text-slate-400 tracking-widest sm:flex-row gap-3">
          <span>Master Intelligence System v1.5.0 © 2026</span>
          <span className="text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">ALL SERVICES ONLINE</span>
        </div>
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
