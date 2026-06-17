import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, Activity, FileText, Banknote, Check, X, Clock, CreditCard, CheckCircle, ShieldAlert, Sparkles, PhoneCall, Gift, RefreshCw, Users, Settings, Lock, Eye, EyeOff, Megaphone, Bell, Plus, ExternalLink, ChevronRight, BarChart3, Copy, MessageSquare, Search, AlertCircle, Mail, Cpu, Layers, Play, Sliders, ChevronUp, ChevronDown, Pin, PinOff, ArrowLeft, ArrowRight } from 'lucide-react';
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
import { CreateAppForm, CreateDecoderForm, CreatePanelForm, CreateUserForm } from '../components/CreateForms';
import { Invoice, Investment, ActivityLog, User } from '../types';
import { subscribeToInvoices, createDocument, subscribeToSettings, subscribeToCollection, updateInvoice, createInvoice } from '../lib/storage';
import { useLanguage } from '../lib/language';
import { CompanySettings } from '../types';
import { InvoiceTemplate } from '../components/InvoiceTemplate';
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
    localStorage.setItem('cached_dashboard_pinned_widgets', JSON.stringify(updated));
  };

  const moveWidget = (index: number, direction: 'up' | 'down') => {
    const nextIndex = direction === 'up' ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= widgets.length) return;

    const reordered = [...widgets];
    const temp = reordered[index];
    reordered[index] = reordered[nextIndex];
    reordered[nextIndex] = temp;

    setWidgets(reordered);
    localStorage.setItem('cached_dashboard_pinned_widgets', JSON.stringify(reordered));
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
    localStorage.setItem('cached_dashboard_pinned_widgets', JSON.stringify(reordered));
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

  // States for Selected Payment Account Channel Viewer
  const [selectedAccountTab, setSelectedAccountTab] = useState<'bKash' | 'Nagad' | 'Upay' | 'Rocket' | 'Mcash' | 'Bank' | 'Binance' | 'PayPal'>('bKash');

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

  if (!isAdmin) {
    const totalFee = Number(currentUserData?.price) || 0;
    // Show only approved invoice balance on the dashboard
    const paidFees = approvedInvoicesBalance;
    const dueFees = Math.max(0, totalFee - paidFees);

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

    const bKashLogo = (
      <svg className="w-6 h-6 flex-shrink-0 animate-pulse" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#E2136E" />
        <path d="M12 24L20 15L28 24" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="20" cy="26" r="2.5" fill="white" />
      </svg>
    );

    const nagadLogo = (
      <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#F47321" />
        <path d="M11 26V14C11 14 15 19 18 21.5C21 24 23 22 23 20M23 14V26" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="29" cy="17" r="2" fill="#E11D48" />
      </svg>
    );

    const upayLogo = (
      <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#013B63" />
        <path d="M14 14V21C14 24.3137 16.6863 27 20 27C23.3137 27 26 24.3137 26 21V14" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="20" cy="27" r="2" fill="#EAB308" />
      </svg>
    );

    const rocketLogo = (
      <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#8C2C84" />
        <path d="M20 9L14 19H18V29L26 19H22V9Z" fill="white" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    );

    const mcashLogo = (
      <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#00843D" />
        <text x="50%" y="65%" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold" fontFamily="sans-serif">M</text>
      </svg>
    );

    const bankLogo = (
      <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#1E3A8A" />
        <path d="M9 27H31M12 17V23M17 17V23M23 17V23M28 17V23M9 14H31M20 10L9 14M20 10L31 14" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );

    const binanceLogo = (
      <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#181A20" />
        <path d="M20 11L14 17L20 23L26 17L20 11ZM20 29L14 23L20 17L26 23L20 29Z" fill="#F3BA2F" />
        <path d="M30 17L26 21L30 25L34 21L30 17ZM10 17L6 21L10 25L14 21L10 17ZM20 17L17 20L20 23L23 20L20 17Z" fill="#F3BA2F" />
      </svg>
    );

    const paypalLogo = (
      <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#003087" />
        <path d="M16 11H22.5C25 11 26.5 12 26 15C25.5 18 23.5 19.5 20.5 19.5H17.2L15.8 28H12.5L16 11Z" fill="#0079C1" />
        <path d="M19 14H25.5C28 14 29.5 15 29 18C28.5 21 26.5 22.5 23.5 22.5H20.2L18.8 31H15.5L19 14Z" fill="#00457C" opacity="0.85" />
      </svg>
    );

    const allProviders = [
      { key: 'bKash', label: 'bKash (বিকাশ)', category: 'mfs', logo: bKashLogo, activeBg: 'from-pink-50/80 to-rose-100/90 border-rose-300 text-rose-700 shadow-md ring-4 ring-rose-500/10 scale-[1.03]', textAccent: 'text-rose-500', enabled: settings?.bkashEnabled !== false, feePercent: 1.85, notes: 'বিকাশ পার্সোনাল সেন্ড মানি' },
      { key: 'Nagad', label: 'Nagad (নগদ)', category: 'mfs', logo: nagadLogo, activeBg: 'from-orange-50/80 to-amber-100/90 border-orange-300 text-orange-700 shadow-md ring-4 ring-orange-500/10 scale-[1.03]', textAccent: 'text-orange-505', enabled: settings?.nagadEnabled !== false, feePercent: 1.50, notes: 'নগদ পার্সোনাল সেন্ড মানি' },
      { key: 'Upay', label: 'Upay (ইউপে)', category: 'mfs', logo: upayLogo, activeBg: 'from-blue-50/80 to-indigo-100/90 border-indigo-300 text-indigo-850 shadow-md ring-4 ring-indigo-500/10 scale-[1.03]', textAccent: 'text-indigo-500', enabled: settings?.upayEnabled !== false, feePercent: 1.40, notes: 'ইউপে পার্সোনাল সেন্ড মানি' },
      { key: 'Rocket', label: 'Rocket (রকেট)', category: 'mfs', logo: rocketLogo, activeBg: 'from-fuchsia-50/80 to-purple-100/90 border-purple-300 text-purple-700 shadow-md ring-4 ring-purple-500/10 scale-[1.03]', textAccent: 'text-purple-500', enabled: settings?.rocketEnabled !== false, feePercent: 1.80, notes: 'রকেট পার্সোনাল সেন্ড মানি' },
      { key: 'Mcash', label: 'Mcash (এমক্যাশ)', category: 'mfs', logo: mcashLogo, activeBg: 'from-emerald-50/80 to-green-100/90 border-green-300 text-emerald-700 shadow-md ring-4 ring-green-500/10 scale-[1.03]', textAccent: 'text-emerald-500', enabled: settings?.mcashEnabled !== false, feePercent: 1.50, notes: 'এমক্যাশ পার্সোনাল সেন্ড মানি' },
      { key: 'Bank', label: 'Bank Account (ব্যাংক)', category: 'bank', logo: bankLogo, activeBg: 'from-blue-50/80 to-slate-100 border-blue-300 text-blue-700 shadow-md ring-4 ring-blue-500/10 scale-[1.03]', textAccent: 'text-blue-500', enabled: settings?.bankEnabled !== false, feePercent: 0, notes: 'কমার্শিয়াল ব্যাংক ট্রান্সফার' },
      { key: 'Binance', label: 'Binance Pay ID (বাইনান্স)', category: 'global', logo: binanceLogo, activeBg: 'from-yellow-50/40 to-amber-100/60 border-yellow-300 text-slate-850 shadow-md ring-4 ring-yellow-500/10 scale-[1.03]', textAccent: 'text-amber-500', enabled: settings?.binanceEnabled !== false, feePercent: 0, notes: 'বাইনান্স পে আইডি / TRC20' },
      { key: 'PayPal', label: 'PayPal Gateway (পেপ্যাল)', category: 'global', logo: paypalLogo, activeBg: 'from-sky-50/80 to-blue-100/90 border-blue-300 text-blue-800 shadow-md ring-4 ring-blue-500/10 scale-[1.03]', textAccent: 'text-blue-500', enabled: settings?.paypalEnabled !== false, feePercent: 4.50, notes: 'পেপ্যাল গ্লোবাল রিসিভার' }
    ];

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

    const handleCopyText = (text: string) => {
      navigator.clipboard.writeText(text);
      setCopiedText(text);
      setTimeout(() => setCopiedText(null), 2000);
    };

    return (
      <div className="space-y-6 pb-12">
        {/* Personalized Header Welcome Banner */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-radial from-indigo-600 to-indigo-800 p-6 sm:p-8 rounded-[1.8rem] text-white shadow-xl shadow-indigo-100 relative overflow-hidden"
        >
          <div className="relative z-10 space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-indigo-500/50 backdrop-blur-md text-[10px] uppercase font-black tracking-widest px-2.5 py-0.5 rounded-full border border-indigo-400/30 flex items-center gap-1">
                <Sparkles size={11} className="text-amber-300" />
                গ্রাহক পোর্টাল (Customer Hub Direct)
              </span>
              <span className="bg-emerald-500 text-white text-[10px] uppercase font-black tracking-widest px-2 rounded-full leading-none py-1 font-mono">
                {currentUserData?.status || 'approved'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight Bengali-Heading">স্বাগতম, {currentUserData?.name || user?.name}!</h1>
            <p className="text-indigo-100 text-xs sm:text-sm font-medium leading-relaxed max-w-xl">
              বামপাশের মেনুবার থেকে সহজেই ইনভয়েস শো লিক চেক করুন, অ্যাডমিন পেমেন্ট নম্বর অপশনসমূহ দেখুন ও বকেয়া পরিশোধের আপডেট পাঠান।
            </p>
          </div>
          <div className="absolute -right-4 -bottom-4 w-44 h-44 bg-indigo-500/20 rounded-full blur-3xl"></div>
          <div className="absolute -left-4 -top-4 w-32 h-32 bg-indigo-400/20 rounded-full blur-3xl"></div>
        </motion.div>

        {/* Elite Running Marquee Text Announcement Bar */}
        <div className="bg-gradient-to-r from-indigo-50 to-indigo-100/30 dark:from-slate-900 dark:to-slate-900 border border-indigo-100 dark:border-slate-800 p-2 sm:p-3 rounded-2xl flex items-center md:gap-4 gap-2 shadow-xs relative overflow-hidden">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-rose-500 to-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shrink-0 shadow-sm">
            <Megaphone size={12} className="animate-pulse" />
            <span>বিজ্ঞপ্তি (Notice)</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <marquee 
              behavior="scroll" 
              direction="left" 
              scrollamount="4"
              onMouseOver={(e: any) => e.currentTarget.stop()}
              onMouseOut={(e: any) => e.currentTarget.start()}
              className="text-slate-755 dark:text-indigo-200 text-xs font-bold leading-none cursor-pointer select-none py-1 block"
            >
              {settings.runningNotice || 'প্রিয় গ্রাহক, আমাদের যেকোনো নতুন আপডেট বা অফার সম্পর্কিত তথ্য এখন থেকে আপনি সরাসরি এখানে লাইভ দেখতে পাবেন। পেমেন্ট করার পর ৫-১০ মিনিট ধৈর্য ধরুন, আমাদের টিম আপনার পেমেন্টটি ভেরিফাই করার কাজ করছে। ধন্যবাদ!'}
            </marquee>
          </div>
          <div className="hidden md:flex items-center gap-1 text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg text-slate-400 dark:text-slate-500 shrink-0 font-medium tracking-wide">
            <Bell size={10} className="text-amber-500 animate-swing" />
            <span>লাইভ আপডেট (Live)</span>
          </div>
        </div>

        {/* 1. DASHBOARD OVERVIEW SUB-TAB */}
        {activeSubTab === 'dashboard' && (
          <div className="space-y-6 animate-fade-in">
            {/* 🚨 REJECTED INVOICES HANDLER - RE-SUBMISSION PANEL */}
            {myRejectedInvoices.length > 0 && (
              <div className="bg-rose-50/70 border border-rose-200 p-5 rounded-3xl text-left shadow-2xs">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="h-7 w-7 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center border border-rose-200 shrink-0">
                    <ShieldAlert size={15} className="stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-rose-800 uppercase tracking-widest font-sans">
                      প্রত্যাখ্যাত পেমেন্ট রিকোয়েস্ট ({myRejectedInvoices.length}টি বাতিল)
                    </h3>
                    <p className="text-[10px] text-rose-600 font-bold mt-0.5 font-sans leading-none">
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
                      <div key={inv.id} className="bg-white border border-rose-150 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-rose-350 shadow-2xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-black text-slate-800 font-mono bg-slate-50 border border-slate-150 px-2 py-0.5 rounded-md">
                              #{inv.id.substring(0, 10).toUpperCase()}
                            </span>
                            <span className="text-[9px] uppercase font-mono font-black tracking-wider px-2 py-0.5 rounded-md bg-rose-100 text-rose-700">
                              {inv.paymentMethod || inv.method}
                            </span>
                            <span className="text-xs font-black text-rose-650 font-mono bg-rose-50 border border-rose-100/30 px-2 py-0.5 rounded-md">
                              ৳{(inv.amount || 0).toLocaleString()}
                            </span>
                          </div>
                          
                          <p className="text-[11px] font-bold text-slate-655 leading-relaxed font-sans pt-1">
                            <strong className="text-rose-705 font-black">বাতিলের কারণ:</strong> {extractedReason}
                          </p>

                          <div className="text-[10px] text-slate-400 font-semibold font-mono pt-0.5">
                            পূর্বের TxID: <span className="bg-slate-50 border px-1.5 py-0.5 rounded text-rose-700 select-all font-black">{inv.transactionId || 'N/A'}</span> • {inv.createdAt}
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

            {/* 📢 LIVE SYSTEM NOTICE & QUICK PAYMENT GUIDE */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Emergency News / Notice Card */}
              <div className="lg:col-span-7 bg-white p-5 px-6 rounded-3xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.015)] text-left flex flex-col justify-between relative overflow-hidden group hover:border-indigo-200/80 transition-all duration-300">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/30 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-indigo-50/50 transition-all duration-300 pointer-events-none" />
                
                <div className="space-y-4 relative z-10">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                        <Megaphone size={14} className="stroke-[2.5] animate-bounce" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-800 font-sans">
                        লাইভ সিস্টেম নোটিশ (Live Broadcast)
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wide border border-emerald-100">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                      সার্ভার স্ট্যাটাস: সচল (Excellent)
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/40 to-slate-50 border border-indigo-100/60 leading-relaxed text-xs font-bold text-slate-700">
                    <p className="whitespace-pre-line">
                      {settings.runningNotice || 'প্রিয় গ্রাহক, আমাদের যেকোনো নতুন আপডেট বা অফার সম্পর্কিত তথ্য এখন থেকে আপনি সরাসরি এখানে লাইভ দেখতে পাবেন। পেমেন্ট করার পর ৫-১০ মিনিট ধৈর্য ধরুন, আমাদের টিম আপনার পেমেন্টটি ভেরিফাই করার কাজ করছে। ধন্যবাদ!'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 mt-4 pt-3 border-t border-slate-100 relative z-10">
                  <div className="flex items-center gap-4 text-[9.5px] font-black text-slate-450 uppercase tracking-wider font-mono">
                    <div className="flex items-center gap-1">
                      <Clock size={11} className="text-slate-400" />
                      TAT: ২-৮ মিনিট
                    </div>
                    <div className="flex items-center gap-1">
                      <Cpu size={11} className="text-slate-400" />
                      SSL সুরক্ষিত
                    </div>
                  </div>
                  <span className="text-[8.5px] bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg uppercase font-mono font-black text-slate-500 tracking-wider">
                    v1.6 Live Node
                  </span>
                </div>
              </div>

              {/* Step By Step Guidelines Tool Card */}
              <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 to-indigo-950 p-5 px-6 rounded-3xl text-white text-left relative overflow-hidden flex flex-col justify-between shadow-xs border border-slate-800">
                <div className="absolute right-0 bottom-0 w-36 h-36 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                
                <div>
                  <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center border border-indigo-500/30">
                        <Sparkles size={14} className="stroke-[2.5]" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300 font-sans">
                        পেমেন্ট ও রিচার্জ নির্দেশাবলী
                      </span>
                    </div>
                    <span className="text-[9px] bg-indigo-500/30 text-indigo-200 border border-indigo-500/30 px-2 py-0.5 rounded-full uppercase font-mono font-black">Help Guide</span>
                  </div>

                  <div className="space-y-3.5">
                    <div className="flex items-start gap-3">
                      <div className="h-5 w-5 rounded-full bg-indigo-500 text-white flex items-center justify-center font-mono font-black text-[10px] shrink-0 shadow-sm border border-indigo-400/40">
                        ১
                      </div>
                      <p className="text-[11px] font-bold text-slate-200 leading-tight">
                        নিচের তালিকা থেকে আপনার সুবিধাজনক পেমেন্ট মেথড বাছাই করে নম্বর কপি করুন।
                      </p>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="h-5 w-5 rounded-full bg-emerald-500 text-white flex items-center justify-center font-mono font-black text-[10px] shrink-0 shadow-sm border border-emerald-400/40">
                        ২
                      </div>
                      <p className="text-[11px] font-bold text-slate-200 leading-tight">
                        আপনার বিকাশ/নগদ/রকেট/বাইনান্স ওয়ালেট থেকে নির্দিষ্ট অর্থ সেন্ড মানি করুন।
                      </p>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="h-5 w-5 rounded-full bg-amber-500 text-white flex items-center justify-center font-mono font-black text-[10px] shrink-0 shadow-sm border border-amber-400/40">
                        ৩
                      </div>
                      <p className="text-[11px] font-bold text-slate-200 leading-tight">
                        রশিদ ফর্মের উদ্দেশ্য, প্রেরক নম্বর ও সঠিক এমাউন্ট প্রদান করে ব্যালেন্স রিকোয়েস্ট করুন।
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-[9.5px] text-slate-400 font-bold tracking-normal italic mt-4 border-t border-white/5 pt-3">
                  ⚠️ ভুল বা অসত্য তথ্য প্রদান করলে সিস্টেম স্বয়ংক্রিয়ভাবে রিকোয়েস্ট ফিল্টার করতে পারে।
                </div>
              </div>
            </div>

            {/* ⚡ CLIENT CORE FINANCIAL LEDGER STATS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {/* Card 1: Total Subscription Price / Fee */}
              <div className="bg-gradient-to-br from-indigo-50/70 via-white to-indigo-100/20 border border-indigo-150 p-4.5 sm:p-5 rounded-2xl shadow-3xs relative overflow-hidden group hover:shadow-xs hover:border-indigo-350 transition-all duration-300 text-left">
                <div className="flex justify-between items-start gap-2">
                  <div className="space-y-1">
                    <span className="text-[9px] sm:text-[10px] font-black uppercase text-indigo-500/90 tracking-widest block leading-none">মোট সার্ভিস চুক্তি বিল</span>
                    <h3 className="text-base sm:text-lg md:text-xl font-black text-slate-850 font-mono tracking-tight leading-none mt-1">৳{totalFee.toLocaleString()}</h3>
                  </div>
                  <span className="p-1.5 sm:p-2 rounded-xl bg-indigo-50 text-indigo-650 shrink-0 border border-indigo-100/30">
                    <Activity size={16} className="stroke-[2.5]" />
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-1 text-[9px] font-bold text-indigo-550/80">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
                  <span>নির্ধারিত মোট সার্ভিস ফি (Contract)</span>
                </div>
                <div className="absolute right-0 bottom-0 w-12 h-12 bg-indigo-50/50 rounded-tl-full -mr-3 -mb-3 pointer-events-none" />
              </div>

              {/* Card 2: Total Approved / Paid Amount */}
              <div className="bg-gradient-to-br from-emerald-50/70 via-white to-emerald-100/20 border border-emerald-150 p-4.5 sm:p-5 rounded-2xl shadow-3xs relative overflow-hidden group hover:shadow-xs hover:border-emerald-350 transition-all duration-300 text-left">
                <div className="flex justify-between items-start gap-2">
                  <div className="space-y-1">
                    <span className="text-[9px] sm:text-[10px] font-black uppercase text-emerald-600 tracking-widest block leading-none">পরিশোধিত ব্যালেন্স (Paid)</span>
                    <h3 className="text-base sm:text-lg md:text-xl font-black text-emerald-900 font-mono tracking-tight leading-none mt-1">৳{paidFees.toLocaleString()}</h3>
                  </div>
                  <span className="p-1.5 sm:p-2 rounded-xl bg-emerald-50 text-emerald-700 shrink-0 border border-emerald-100/30">
                    <CheckCircle size={16} className="stroke-[2.5]" />
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-1 text-[9px] font-bold text-emerald-655">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span>অনুমোদিত ব্যালেন্স ( {approvedCount}টি পেমেন্ট )</span>
                </div>
                <div className="absolute right-0 bottom-0 w-12 h-12 bg-emerald-50/50 rounded-tl-full -mr-3 -mb-3 pointer-events-none" />
              </div>

              {/* Card 3: Pending/Under Verification Amount */}
              <div className="bg-gradient-to-br from-amber-50/70 via-white to-amber-100/20 border border-amber-150 p-4.5 sm:p-5 rounded-2xl shadow-3xs relative overflow-hidden group hover:shadow-xs hover:border-amber-350 transition-all duration-300 text-left">
                <div className="flex justify-between items-start gap-2">
                  <div className="space-y-1">
                    <span className="text-[9px] sm:text-[10px] font-black uppercase text-amber-600 tracking-widest block leading-none">যাচাইাধীন জমা (Pending)</span>
                    <h3 className="text-base sm:text-lg md:text-xl font-black text-amber-900 font-mono tracking-tight leading-none mt-1">৳{pendingFees.toLocaleString()}</h3>
                  </div>
                  <span className="p-1.5 sm:p-2 rounded-xl bg-amber-50 text-amber-700 shrink-0 border border-amber-100/30">
                    <Clock size={16} className="stroke-[2.5]" />
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-1 text-[9px] font-bold text-amber-655">
                  <span className={`h-1.5 w-1.5 rounded-full ${pendingFees > 0 ? 'bg-amber-500 animate-pulse' : 'bg-slate-300'}`} />
                  <span>{pendingCount}টি পেমেন্ট যাচাইকরণের জন্য অপেক্ষারত</span>
                </div>
                <div className="absolute right-0 bottom-0 w-12 h-12 bg-amber-50/50 rounded-tl-full -mr-3 -mb-3 pointer-events-none" />
              </div>

              {/* Card 4: Due/Remaining Payment */}
              <div className="bg-gradient-to-br from-rose-50/70 via-white to-rose-100/20 border border-rose-150 p-4.5 sm:p-5 rounded-2xl shadow-3xs relative overflow-hidden group hover:shadow-xs hover:border-rose-350 transition-all duration-300 text-left">
                <div className="flex justify-between items-start gap-2">
                  <div className="space-y-1">
                    <span className="text-[9px] sm:text-[10px] font-black uppercase text-rose-600 tracking-widest block leading-none">অবশিষ্ট বকেয়া (Due Debt)</span>
                    <h3 className="text-base sm:text-lg md:text-xl font-black text-rose-955 font-mono tracking-tight leading-none mt-1">৳{dueFees.toLocaleString()}</h3>
                  </div>
                  <span className="p-1.5 sm:p-2 rounded-xl bg-rose-50 text-rose-650 shrink-0 border border-rose-100/30">
                    <TrendingDown size={16} className="stroke-[2.5]" />
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-1 text-[9px] font-bold text-rose-655">
                  <span className={`h-1.5 w-1.5 rounded-full ${dueFees > 0 ? 'bg-rose-550 animate-ping' : 'bg-emerald-500'}`} />
                  <span>{dueFees > 0 ? 'অনুগ্রহ করে বকেয়া পরিশোধ করুন' : 'আপনার আর কোনো বকেয়া বাকি নেই'}</span>
                </div>
                <div className="absolute right-0 bottom-0 w-12 h-12 bg-rose-50/50 rounded-tl-full -mr-3 -mb-3 pointer-events-none" />
              </div>
            </div>

            {/* Status Counters Card (Invoice Live Counter) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.015)]">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2.5 flex items-center gap-2">
                <FileText size={15} className="text-indigo-600" />
                পেমেন্ট রিকোয়েস্ট ট্র্যাকিং (Invoice Live Counter)
              </h3>
              <div className="grid grid-cols-3 gap-3 sm:gap-4 md:gap-5 animate-fade-in">
                {/* Approved */}
                <div className="bg-emerald-50/40 border border-emerald-150 p-3 sm:p-4 rounded-xl text-center shadow-3xs">
                  <div className="text-emerald-600 font-black text-base sm:text-xl font-mono">{approvedCount}</div>
                  <div className="text-[9px] sm:text-xs text-emerald-700 font-black uppercase mt-1">অনুমোদিত (Approved)</div>
                </div>
                {/* Pending */}
                <div className="bg-amber-50/40 border border-amber-150 p-3 sm:p-4 rounded-xl text-center shadow-3xs">
                  <div className="text-amber-600 font-black text-base sm:text-xl font-mono">{pendingCount}</div>
                  <div className="text-[9px] sm:text-xs text-amber-700 font-black uppercase mt-1">মূলতুবি (Pending)</div>
                </div>
                {/* Rejected */}
                <div className="bg-rose-50/20 border border-rose-150 p-3 sm:p-4 rounded-xl text-center shadow-3xs">
                  <div className="text-rose-650 font-black text-base sm:text-xl font-mono">{rejectedCount}</div>
                  <div className="text-[9px] sm:text-xs text-rose-600 font-black uppercase mt-1">প্রত্যাখ্যাত (Rejected)</div>
                </div>
              </div>
              <div className="text-[10px] text-slate-400 mt-3 text-center border-t border-slate-100 pt-2.5 font-medium">
                * এডমিন কর্তৃক রিভিউ সম্পন্ন হলে ব্যালেন্স ও স্ট্যাটাস স্বয়ংক্রিয়ভাবে আপডেট হয়।
              </div>
            </div>

            {/* Quick Helper Widget (Helpline) */}
            <div className="p-6 bg-gradient-to-r from-slate-950 to-indigo-950 text-white rounded-[1.5rem] border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
              <div className="space-y-1">
                <h4 className="text-xs font-black uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-indigo-500 animate-ping" />
                  সহায়তা প্রয়োজন? (Support & Assistance)
                </h4>
                <p className="text-xs text-slate-300 max-w-lg">
                  আপনার পেমেন্ট রিকোয়েস্ট জমা দেওয়ার পর তা দ্রুত অনুমোদনের জন্য বা যেকোনো সার্ভিস সম্পর্কিত অনুসন্ধানে সরাসরি আমাদের অফিশিয়াল হোয়াটসঅ্যাপ বা হেল্পলাইনে যোগাযোগ করতে পারেন।
                </p>
              </div>
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl text-xs font-bold font-mono transition-colors hover:bg-white/10 shrink-0">
                <PhoneCall size={14} className="text-indigo-400 animate-bounce" />
                <span>{settings.phone || '01718070273'}</span>
              </div>
            </div>
          </div>
        )}

        {/* 3. ACCOUNT OPTIONS SUB-TAB: SHOW BKASH, NAGAD, BANK ACCOUNT, BINANCE, PAYPAL DETAILS */}
        {activeSubTab === 'account' && (() => {
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
                  কোম্পানির অফিশিয়াল পেমেন্ট গেটওয়ে এবং অ্যাকাউন্ট অপশন (Active Gateways)
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed px-1.5">
                  নিচে কোম্পানির সচল লেনদেনের চ্যানেলসমূহ দেওয়া হলো। নিচে প্রথম ধাপ থেকে কাঙ্ক্ষিত পেমেন্ট অপশনটি সিলেক্ট করুন এবং দ্বিতীয় ধাপ থেকে অ্যাকাউন্ট বিবরণী কপি করে নিন:
                </p>
              </div>

              {/* Step 1: Selector Filters & Discovery */}
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
                  <div className="flex items-center gap-2 px-1.5">
                    <span className="text-[10px] font-black tracking-widest uppercase text-slate-450 bg-slate-50 border border-slate-200/60 px-3 py-1.5 rounded-xl shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]">
                      ১. পেমেন্ট গেটওয়ে অপশন সিলেক্ট করুন (Select Gateway Option)
                    </span>
                  </div>
                  
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
                      <Sparkles size={16} className="text-amber-400 animate-spin" style={{ animationDuration: '4s' }} />
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
                    <div className="md:col-span-7 space-y-3">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] text-slate-450 font-black uppercase tracking-widest">বিল মূল্য টাইপ করুন (Enter Target Due Bill Amount):</label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-extrabold text-base">৳</span>
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
                            className="px-2 py-1 rounded-md text-[10px] font-mono font-black bg-white/5 hover:bg-indigo-600 border border-white/5 hover:border-indigo-500 hover:text-white transition-all"
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
                          <span className="font-mono font-extrabold text-indigo-200">৳{parsedAmount.toFixed(2)} BDT</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">লেনদেন সার্ভিস চার্জ ({activeFeePercent}%):</span>
                          <span className="font-mono font-extrabold text-amber-300">+ ৳{computedCharge.toFixed(2)} BDT</span>
                        </div>
                      </div>
                      <div className="border-t border-white/10 pt-2.5 flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-350">মোট পেমেন্ট (Send Money Total):</span>
                        <span className="font-mono font-black text-lg text-emerald-405">৳{computedTotal.toFixed(2)} BDT</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2: Information Credentials Channels Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-[1.8rem] p-5 sm:p-6 text-white relative">
                <div className="absolute top-4 right-4 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </div>

                <div className="space-y-4">
                  <div className="border-b border-white/10 pb-3 flex justify-between items-center sm:flex-row flex-col gap-2">
                    <span className="text-[10px] uppercase font-black tracking-widest text-slate-450 flex items-center gap-2">
                      ২. অ্যাকাউন্ট পেমেন্ট কপি করে নিন (Copy Account Credentials Detail)
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
                        <p className="text-[11px] text-slate-400 leading-relaxed pt-2">
                          প্রদত্ত বিকাশ পার্সোনাল নাম্বারে সেবামূল্য সেন্ড মানি (Send Money) সম্পন্ন করুন। সেন্ডিং সম্পন্ন হলে প্রাপ্ত ট্রানজেকশন ID অথবা পেমেন্ট ট্রানজেকশন স্ক্রিনশট বা লাস্ট ডিজিট দিয়ে পেমেন্ট অপশন থেকে রিপোর্ট জমা দিন।
                        </p>
                      </div>
                    )}

                    {selectedAccountTab === 'Nagad' && (
                      <div className="space-y-4 animate-fade-in">
                        <div className="flex justify-between items-center border-b border-white/10 pb-3">
                          <span className="text-xs font-black uppercase text-amber-500 tracking-wider flex items-center gap-2">
                            {nagadLogo} Nagad Active Channel
                          </span>
                          <span className="text-[9px] bg-amber-500 text-white font-mono font-black px-2 py-0.5 rounded-full uppercase">Instant Transfer</span>
                        </div>
                        <div className="space-y-1 bg-white/5 p-4 rounded-xl border border-white/5">
                          <span className="text-[10px] text-orange-405 font-bold uppercase block tracking-wider font-mono">মোবাইল নম্বর (Nagad Number)</span>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-1">
                            <div className="text-3xl font-mono font-black text-white select-all">{settings.nagadNumber || '01718070273'}</div>
                            <button
                              type="button"
                              onClick={() => handleCopyText(settings.nagadNumber || '01718070273')}
                              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 select-none text-white font-mono font-bold text-[10px] px-3.5 py-1.5 rounded-lg border border-white/5 transition-all self-start sm:self-center"
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
                        <p className="text-[11px] text-slate-400 leading-relaxed pt-2">
                          প্রদত্ত নগদ পার্সোনাল নাম্বারে সেন্ড মানি (Send Money) সফলভাবে সম্পন্ন করুন। ট্রানজেকশন আইডি সহ পেমেন্ট রিকোয়েস্ট নিশ্চিত করতে সেটিংস পেমেন্ট অপশন ফর্মটি দ্রুত সচল করুন।
                        </p>
                      </div>
                    )}

                    {selectedAccountTab === 'Upay' && (
                      <div className="space-y-4 animate-fade-in">
                        <div className="flex justify-between items-center border-b border-white/10 pb-3">
                          <span className="text-xs font-black uppercase text-indigo-400 tracking-wider flex items-center gap-2">
                            {upayLogo} Upay Active Channel
                          </span>
                          <span className="text-[9px] bg-indigo-650 text-white font-mono font-black px-2 py-0.5 rounded-full uppercase">Instant Transfer</span>
                        </div>
                        <div className="space-y-1 bg-white/5 p-4 rounded-xl border border-white/5">
                          <span className="text-[10px] text-indigo-300 font-bold uppercase block tracking-wider font-mono">ইউপে নম্বর (Upay Number)</span>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-1">
                            <div className="text-3xl font-mono font-black text-white select-all">{settings.upayNumber || '01718070273'}</div>
                            <button
                              type="button"
                              onClick={() => handleCopyText(settings.upayNumber || '01718070273')}
                              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 select-none text-white font-mono font-bold text-[10px] px-3.5 py-1.5 rounded-lg border border-white/5 transition-all self-start sm:self-center"
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
                          <span className="inline-block bg-indigo-600 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full mt-3 uppercase tracking-widest font-mono">
                            personal (ব্যক্তিগত অ্যাকাউন্ট)
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed pt-2">
                          প্রদত্ত ইউপে পার্সোনাল নাম্বারে সেবামূল্য সেন্ড মানি (Send Money) সম্পন্ন করুন। সেন্ডিং সম্পন্ন হলে প্রাপ্ত ট্রানজেকশন ID অথবা পেমেন্ট ট্রানজেকশন স্ক্রিনশট বা লাস্ট ডিজিট দিয়ে পেমেন্ট অপশন থেকে রিপোর্ট জমা দিন।
                        </p>
                      </div>
                    )}

                    {selectedAccountTab === 'Rocket' && (
                      <div className="space-y-4 animate-fade-in">
                        <div className="flex justify-between items-center border-b border-white/10 pb-3">
                          <span className="text-xs font-black uppercase text-pink-400 tracking-wider flex items-center gap-2">
                            {rocketLogo} Rocket Active Channel
                          </span>
                          <span className="text-[9px] bg-pink-500 text-white font-mono font-black px-2 py-0.5 rounded-full uppercase">Instant Transfer</span>
                        </div>
                        <div className="space-y-1 bg-white/5 p-4 rounded-xl border border-white/5">
                          <span className="text-[10px] text-pink-300 font-bold uppercase block tracking-wider font-mono">রকেট নম্বর (Rocket Number)</span>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-1">
                            <div className="text-3xl font-mono font-black text-white select-all">{settings.rocketNumber || '01718070273-0'}</div>
                            <button
                              type="button"
                              onClick={() => handleCopyText(settings.rocketNumber || '01718070273-0')}
                              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 select-none text-white font-mono font-bold text-[10px] px-3.5 py-1.5 rounded-lg border border-white/5 transition-all self-start sm:self-center"
                            >
                              {copiedText === (settings.rocketNumber || '01718070273-0') ? (
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
                          <span className="inline-block bg-pink-500 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full mt-3 uppercase tracking-widest font-mono">
                            personal (ব্যক্তিগত অ্যাকাউন্ট)
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed pt-2">
                          প্রদত্ত রকেট পার্সোনাল নাম্বারে সেবামূল্য সেন্ড মানি (Send Money) সম্পন্ন করুন। সেন্ডিং সম্পন্ন হলে প্রাপ্ত ট্রানজেকশন ID অথবা পেমেন্ট ট্রানজেকশন স্ক্রিনশট বা লাস্ট ডিজিট দিয়ে পেমেন্ট অপশন থেকে রিপোর্ট জমা দিন।
                        </p>
                      </div>
                    )}

                      {selectedAccountTab === 'Bank' && (
                        <div className="space-y-4 animate-fade-in">
                          <div className="flex justify-between items-center border-b border-white/10 pb-3">
                            <span className="text-xs font-black uppercase text-indigo-400 tracking-wider flex items-center gap-2">
                              {bankLogo} Bank Wire Transfer Group
                            </span>
                            <span className="text-[9px] bg-indigo-500 text-white font-mono font-black px-2 py-0.5 rounded-full uppercase">Manual Verification</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                              <strong className="text-indigo-305 block uppercase text-[10px] tracking-wider font-mono">Bank Name</strong>
                              <span className="font-extrabold text-sm">{settings.bankName || "Dutch Bangla Bank"}</span>
                            </div>
                            <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                              <strong className="text-indigo-350 block uppercase text-[10px] tracking-wider font-mono">Account Name</strong>
                              <span className="font-extrabold text-sm">{settings.accountName || "Master Tech Limited"}</span>
                            </div>
                            <div className="bg-white/5 p-3.5 rounded-xl border border-white/5 sm:col-span-2 flex items-center justify-between">
                              <div>
                                <strong className="text-indigo-305 block uppercase text-[9px] tracking-wider font-mono">Account Number</strong>
                                <span className="font-mono font-black bg-white/10 px-2.5 py-1 rounded select-all tracking-wider text-base text-white">{settings.accountNo || "15012019487120398"}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleCopyText(settings.accountNo || "15012019487120398")}
                                className="flex items-center gap-1 bg-white/10 hover:bg-white/20 select-none text-white font-mono font-bold text-[10px] px-2.5 py-1.5 rounded-lg border border-white/5 transition-all self-center"
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
                            <div className="bg-white/5 p-3 rounded-xl border border-white/5 sm:col-span-2">
                              <strong className="text-indigo-350 block uppercase text-[10px] tracking-wider font-mono">Branch Name</strong>
                              <span className="font-extrabold text-sm">{settings.branchName || "Dhaka Main Branch"}</span>
                            </div>
                          </div>
                        </div>
                      )}

                    {selectedAccountTab === 'Mcash' && (
                      <div className="space-y-4 animate-fade-in">
                        <div className="flex justify-between items-center border-b border-white/10 pb-3">
                          <span className="text-xs font-black uppercase text-emerald-400 tracking-wider flex items-center gap-2">
                            {mcashLogo} Mcash Active Channel
                          </span>
                          <span className="text-[9px] bg-emerald-500 text-white font-mono font-black px-2 py-0.5 rounded-full uppercase">Instant Transfer</span>
                        </div>
                        <div className="space-y-1 bg-white/5 p-4 rounded-xl border border-white/5">
                          <span className="text-[10px] text-emerald-400 font-bold uppercase block tracking-wider font-mono">মোবাইল নম্বর (Mcash Number)</span>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-1">
                            <div className="text-3xl font-mono font-black text-white select-all">{settings.mcashNumber || '01718070273'}</div>
                            <button
                              type="button"
                              onClick={() => handleCopyText(settings.mcashNumber || '01718070273')}
                              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 select-none text-white font-mono font-bold text-[10px] px-3.5 py-1.5 rounded-lg border border-white/5 transition-all self-start sm:self-center"
                            >
                              {copiedText === (settings.mcashNumber || '01718070273') ? (
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
                          <span className="inline-block bg-emerald-505 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full mt-3 uppercase tracking-widest font-mono">
                            personal (ব্যক্তিগত অ্যাকাউন্ট)
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed pt-2">
                          প্রদত্ত এমক্যাশ পার্সোনাল নাম্বারে সেবামূল্য সেন্ড মানি (Send Money) সম্পন্ন করুন। সেন্ডিং সম্পন্ন হলে প্রাপ্ত ট্রানজেকশন ID অথবা পেমেন্ট ট্রানজেকশন স্ক্রিনশট বা লাস্ট ডিজিট দিয়ে পেমেন্ট অপশন থেকে রিপোর্ট জমা দিন।
                        </p>
                      </div>
                    )}

                    {selectedAccountTab === 'Binance' && (
                      <div className="space-y-4 animate-fade-in">
                        <div className="flex justify-between items-center border-b border-white/10 pb-3">
                          <span className="text-xs font-black uppercase text-yellow-400 tracking-wider flex items-center gap-2">
                            {binanceLogo} Binance Active Channel
                          </span>
                          <span className="text-[9px] bg-yellow-500 text-slate-950 font-mono font-black px-2 py-0.5 rounded-full uppercase">Instant Transfer</span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1 bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col justify-between">
                            <div>
                              <span className="text-[10px] text-yellow-400 font-bold uppercase block tracking-wider font-mono">বাইনান্স পে আইডি (Binance Pay ID)</span>
                              <div className="text-2xl font-mono font-black text-white select-all mt-1">{settings.binancePayId || '542901726'}</div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopyText(settings.binancePayId || '542901726')}
                              className="mt-3 flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/20 select-none text-white font-mono font-bold text-[10px] px-3.5 py-1.5 rounded-lg border border-white/5 transition-all self-start"
                            >
                              {copiedText === (settings.binancePayId || '542901726') ? (
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

                          <div className="space-y-1 bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col justify-between">
                            <div>
                              <span className="text-[10px] text-yellow-400 font-bold uppercase block tracking-wider font-mono">ইউএসডিটি এড্রেস (USDT - TRC20 Address)</span>
                              <div className="text-xs font-mono font-bold text-white select-all mt-1 break-all bg-white/5 p-2 rounded-lg">{settings.binanceUsdtAddress || 'TYm7A8WqyY4fFsh9SgH8eD2c1T9Z9sK8nQ'}</div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopyText(settings.binanceUsdtAddress || 'TYm7A8WqyY4fFsh9SgH8eD2c1T9Z9sK8nQ')}
                              className="mt-3 flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/20 select-none text-white font-mono font-bold text-[10px] px-3.5 py-1.5 rounded-lg border border-white/5 transition-all self-start"
                            >
                              {copiedText === (settings.binanceUsdtAddress || 'TYm7A8WqyY4fFsh9SgH8eD2c1T9Z9sK8nQ') ? (
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
                        </div>

                        <p className="text-[11px] text-slate-400 leading-relaxed pt-2">
                          প্রদত্ত বাইনান্স পে আইডি বা USDT (TRC20) নেটওয়ার্ক ব্যবহার করে পেমেন্ট সম্পূর্ণ করুন। পেমেন্ট প্রসেস হয়ে গেলে ট্রানজেকশন হ্যাশ বা পে আইডি ও স্ক্রিনশট সহ রিপোর্ট জমা দিন।
                        </p>
                      </div>
                    )}

                    {selectedAccountTab === 'PayPal' && (
                      <div className="space-y-4 animate-fade-in">
                        <div className="flex justify-between items-center border-b border-white/10 pb-3">
                          <span className="text-xs font-black uppercase text-sky-400 tracking-wider flex items-center gap-2">
                            {paypalLogo} PayPal Active Channel
                          </span>
                          <span className="text-[9px] bg-sky-505 text-white font-mono font-black px-2 py-0.5 rounded-full uppercase">Global Transfer</span>
                        </div>
                        <div className="space-y-1 bg-white/5 p-4 rounded-xl border border-white/5">
                          <span className="text-[10px] text-sky-450 font-bold uppercase block tracking-wider font-mono">পেপ্যাল ইমেইল (PayPal Registered Email)</span>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-1">
                            <div className="text-lg sm:text-2xl font-mono font-black text-white select-all break-all">{settings.paypalEmail || 'masterbuild14@gmail.com'}</div>
                            <button
                              type="button"
                              onClick={() => handleCopyText(settings.paypalEmail || 'masterbuild14@gmail.com')}
                              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 select-none text-white font-mono font-bold text-[10px] px-3.5 py-1.5 rounded-lg border border-white/5 transition-all self-start sm:self-center shrink-0"
                            >
                              {copiedText === (settings.paypalEmail || 'masterbuild14@gmail.com') ? (
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
                          <span className="inline-block bg-sky-600 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full mt-3 uppercase tracking-widest font-mono">
                            business (লিংকড মার্চেন্ট ইমেইল)
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed pt-2">
                          প্রদত্ত পেপ্যাল ইমেল ব্যবহার করে মাষ্টার সার্ভিসেস বিল সেন্ড করুন। ইন্টারন্যাশনাল ট্রানজেকশন সফল হবার পর পেমেন্ট স্ক্রিনশট বা ট্রানজেকশন নাম্বার দিয়ে ব্যালেন্স রিকোয়েস্ট তৈরি করুন।
                        </p>
                      </div>
                    )}
                  </div>
                  </div>
                </div>
              </div>
            );
          })()}


        {activeSubTab === 'payment' && (
<div id="client-billing-form-section" className="bg-white border border-slate-200 rounded-[1.5rem] p-6 shadow-xs relative animate-fade-in scroll-mt-6">
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5 border-b border-slate-100 pb-3">
              <CreditCard size={16} className="text-indigo-600" />
              {settings.clientPaymentFormTitle || 'পেমেন্ট রিপোর্টিং অপশন (Submit Payment Ticket Form)'}
            </h2>

            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              {settings.clientPaymentFormSubtitle || 'টাকা প্রেরণের পর পেমেন্ট রশিদ ভেরিফিকেশন ফর্মে আপনার পরিশোধিত মাধ্যম, অ্যামাউন্ট এবং লাস্ট নম্বর বা ট্রানজেকশন আইডি প্রদান করে ব্যালেন্স রিকোয়েস্ট তৈরি করুন:'}
            </p>

            {resubmittingInvoiceId && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold p-4 rounded-2xl mb-6 animate-fade-in flex flex-col sm:flex-row sm:items-center justify-between gap-3 leading-relaxed">
                <div className="flex items-start gap-2.5 text-left">
                  <ShieldAlert size={18} className="shrink-0 text-rose-500 mt-0.5" />
                  <div>
                    <span className="block font-black text-rose-900 mb-0.5">পেমেন্ট রিকোয়েস্ট সংশোধন মোড (Correction Active)</span>
                    <span>আপনি <strong className="font-mono text-indigo-700 bg-indigo-50/50 border border-indigo-150 px-1.5 py-0.5 rounded select-all font-black">#{resubmittingInvoiceId}</strong> নাম্বার ইনভয়েসটির ভুল সংশোধনের জন্য রিভিউ করছেন। সংশোধন ফর্ম পূরণ করে পাঠান।</span>
                  </div>
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
                            <div className="flex items-center gap-3.5">
                              {/* Logo wrapper */}
                              <div className="p-1 rounded-xl bg-slate-50 border border-slate-100 shadow-3xs shrink-0 flex items-center justify-center w-9 h-9">
                                {provider.logo}
                              </div>

                              <div>
                                <span className="font-black text-slate-800 text-[11px] block leading-snug tracking-tight">
                                  {provider.label}
                                </span>
                                <span className="text-[8.5px] text-slate-400 font-extrabold block mt-0.5 uppercase tracking-wide">
                                  {provider.notes}
                                </span>
                              </div>
                            </div>

                            {/* Beautiful Circular Radio Indicator */}
                            <div className="flex items-center">
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

                    {/* Cancel Footer Button */}
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

              {/* TICKET DETAILS ROW GRID */}
              <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-5 space-y-4 text-left shadow-3xs">
                <div className="flex items-center gap-2 border-b border-slate-200/60 pb-3">
                  <div className="h-6 w-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-sans font-black text-xs border border-indigo-100 shadow-3xs">
                    ২
                  </div>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 font-sans">
                    {((settings.clientPaymentDetailsSectionLabel && settings.clientPaymentDetailsSectionLabel.trim()) ? settings.clientPaymentDetailsSectionLabel : '২. পেমেন্ট ভেরিফিকেশন রশিদ তথ্য (Submit Ticket Details) *')}
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                      {((settings.clientPaymentPurposeLabel && settings.clientPaymentPurposeLabel.trim()) ? settings.clientPaymentPurposeLabel : 'পেমেন্ট উদ্দেশ্য (Purpose / Product) *')}
                    </label>
                    <select 
                      value={topUpPurpose} 
                      onChange={(e) => {
                        const purpose = e.target.value;
                        setTopUpPurpose(purpose);
                        if (!purpose) {
                          setTopUpAmount('');
                          setTicketDueAmount('');
                        } else if (purpose === 'Reseller Panel Purchase') {
                          const price = getPanelPrice(ticketPanelDuration);
                          setTopUpAmount(price ? price.toString() : '');
                          const paid = Number(ticketPaidAmount) || 0;
                          setTicketDueAmount(price ? Math.max(0, price - paid).toString() : '');
                        } else if (purpose === 'Decoder License Purchase') {
                          const price = getDecoderPrice(ticketDecoderDuration);
                          setTopUpAmount(price ? price.toString() : '');
                          const paid = Number(ticketPaidAmount) || 0;
                          setTicketDueAmount(price ? Math.max(0, price - paid).toString() : '');
                        } else {
                          setTopUpAmount('');
                          setTicketDueAmount('');
                        }
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl py-3 px-3.5 text-xs font-bold text-slate-700 font-sans focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
                      required
                    >
                      <option value="">-- উদ্দেশ্য নির্বাচন করুন (Select Purpose) * --</option>
                      <option value="Android App Purchase">Android App Purchase (অ্যান্ড্রয়েড অ্যাপ ক্রয়)</option>
                      <option value="Reseller Panel Purchase">Reseller Panel Pack (রিসেলার প্যানেল প্যাক)</option>
                      <option value="Decoder License Purchase">Decoder License Purchase (ডিকোডার কোড ক্রয়)</option>
                      <option value="Wallet Recharge">Wallet Recharge (ওয়ালেট রিচার্জ বা টপ-আপ)</option>
                      <option value="Binance $ Purchase">Binance $ Purchase (বাইনেন্স ডলার ক্রয়)</option>
                      <option value="Redotpay $ Purchase">Redotpay $ Purchase (রেডটপে ডলার ক্রয়)</option>
                      <option value="Facebook Boost">Facebook Boost (ফেসবুক পেজ বুস্ট সার্ভিস)</option>
                      <option value="Banner Making">Banner Making (প্রফেশনাল ব্যানার তৈরি)</option>
                      <option value="Logo Making">Logo Making (ব্র্যান্ড লোগো ডিজাইন)</option>
                      <option value="Others / Etc">Others / Etc (অন্যান্য সার্ভিস বা চুক্তি)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                      {((settings.clientPaymentTxnLabel && settings.clientPaymentTxnLabel.trim()) ? settings.clientPaymentTxnLabel : 'প্রেরক নাম্বার / লাস্ট ৫ ডিজিট *')}
                    </label>
                    <input 
                      type="text" 
                      value={topUpTxn} 
                      onChange={(e) => setTopUpTxn(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl py-3 px-3.5 text-xs font-mono font-black text-slate-800 placeholder:text-slate-450 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
                      placeholder="e.g. Bkash Last 5 Digit or TxID"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                      {((settings.clientPaymentAmountLabel && settings.clientPaymentAmountLabel.trim()) ? settings.clientPaymentAmountLabel : 'অনুরোধকৃত মোট জমার পরিমাণ *')}
                    </label>
                    <input 
                      type="number" 
                      value={topUpAmount} 
                      onChange={(e) => {
                        const amount = e.target.value;
                        setTopUpAmount(amount);
                        
                        // Calculate paid / due balances for App / Panel / Decoder purchases
                        if (topUpPurpose === 'Reseller Panel Purchase') {
                          const price = getPanelPrice(ticketPanelDuration);
                          setTicketDueAmount(price ? Math.max(0, price - (Number(amount) || 0)).toString() : '');
                          setTicketPaidAmount(amount);
                        } else if (topUpPurpose === 'Decoder License Purchase') {
                          const price = getDecoderPrice(ticketDecoderDuration);
                          setTicketDueAmount(price ? Math.max(0, price - (Number(amount) || 0)).toString() : '');
                          setTicketPaidAmount(amount);
                        }
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl py-3 px-3.5 text-xs font-mono font-black text-slate-800 placeholder:text-slate-450 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
                      placeholder="e.g. 1500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                      {((settings.clientPaymentPaidLabel && settings.clientPaymentPaidLabel.trim()) ? settings.clientPaymentPaidLabel : 'টোটাল পেইড এমাউন্ট (Paid Amount)')}
                    </label>
                    <input 
                      type="number" 
                      value={ticketPaidAmount} 
                      onChange={(e) => {
                        const paid = e.target.value;
                        setTicketPaidAmount(paid);
                        const tot = Number(topUpAmount) || 0;
                        setTicketDueAmount(Math.max(0, tot - (Number(paid) || 0)).toString());
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl py-3 px-3.5 text-xs font-mono font-black text-slate-800 placeholder:text-slate-450 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
                      placeholder="e.g. 1500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                      {((settings.clientPaymentDueLabel && settings.clientPaymentDueLabel.trim()) ? settings.clientPaymentDueLabel : 'টোটাল ডিউ এমাউন্ট (Due Amount)')}
                    </label>
                    <input 
                      type="number" 
                      value={ticketDueAmount} 
                      onChange={(e) => setTicketDueAmount(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl py-3 px-3.5 text-xs font-mono font-black text-slate-800 placeholder:text-slate-450 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
                      placeholder="e.g. 0"
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic Form extensions conditional blocks */}
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
                      className="w-full bg-white border border-indigo-200 rounded-xl py-3 px-3.5 text-xs font-bold text-slate-800 placeholder:text-slate-350 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
                      placeholder="e.g. com.livetv.pro"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1.5 font-sans">প্রোটোকল (Protocol) *</label>
                    <select 
                      value={ticketAppProtocol} 
                      onChange={(e) => setTicketAppProtocol(e.target.value)}
                      className="w-full bg-white border border-indigo-200 rounded-xl py-3 px-3.5 text-xs font-bold text-slate-700 font-sans focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
                      required
                    >
                      <option value="">-- সিলেক্ট প্রোটোকল * --</option>
                      <option value="VJ Panel">VJ Panel</option>
                      <option value="XCIPTV">XCIPTV</option>
                      <option value="IBO Player">IBO Player</option>
                      <option value="Next TV">Next TV</option>
                      <option value="OTT Platinum">OTT Platinum</option>
                      <option value="Smarters Pro">Smarters Pro</option>
                      <option value="Other Protocol">Other Protocol</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1.5 font-sans">কোয়ালিটি প্রোফাইল (Quality) *</label>
                    <select 
                      value={ticketAppQuality} 
                      onChange={(e) => setTicketAppQuality(e.target.value)}
                      className="w-full bg-white border border-indigo-200 rounded-xl py-3 px-3.5 text-xs font-bold text-slate-700 font-sans focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
                      required
                    >
                      <option value="">-- কোয়ালিটি সিলেক্ট * --</option>
                      <option value="SD Quality">SD Quality (বাজেট ফ্রেন্ডলি)</option>
                      <option value="HD Quality">HD Quality (স্ট্যান্ডার্ড)</option>
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
                      <option value="Single App">Single App (একক অ্যাপ)</option>
                      <option value="Multi App">Multi App (মাল্টিপল সংযোগ)</option>
                      <option value="Reseller App">Reseller App (রিসেলিং প্যানেল সমর্থিত)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1.5 font-sans">কাজের ধরণ (Work Type) *</label>
                    <select 
                      value={ticketAppWorkType} 
                      onChange={(e) => setTicketAppWorkType(e.target.value)}
                      className="w-full bg-white border border-indigo-200 rounded-xl py-3 px-3.5 text-xs font-bold text-slate-700 font-sans focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
                      required
                    >
                      <option value="">-- কাজের ধরণ সিলেক্ট * --</option>
                      <option value="New app compilation">New app compilation (নতুন অ্যাপ তৈরি)</option>
                      <option value="App update config">App update config (অ্যাপ আপডেট)</option>
                      <option value="App logo & name change">App logo & name change (রিব্র্যান্ডিং)</option>
                    </select>
                  </div>
                </div>
              )}

              {topUpPurpose === 'Reseller Panel Purchase' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl animate-fade-in text-left">
                  <div>
                    <label className="block text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1.5 font-sans">প্যানেল ক্যাটাগরি (Panel Category) *</label>
                    <select 
                      value={ticketPanelName} 
                      onChange={(e) => {
                        const pName = e.target.value;
                        setTicketPanelName(pName);
                        const price = getPanelPrice(ticketPanelDuration);
                        setTopUpAmount(price.toString());
                        const paid = Number(ticketPaidAmount) || 0;
                        setTicketDueAmount(Math.max(0, price - paid).toString());
                      }}
                      className="w-full bg-white border border-indigo-200 rounded-xl py-3 px-3.5 text-xs font-bold text-slate-700 font-sans focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
                      required
                    >
                      <option value="">-- প্যানেল ক্যাটাগরি সিলেক্ট করুন * --</option>
                      <option value="VJ Panel">VJ Panel</option>
                      <option value="XC Panel">XC Panel</option>
                      <option value="Stream Panel">Stream Panel</option>
                      <option value="Other Reseller">Other Reseller Panel</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1.5 font-sans">প্যানেল ওয়েবলিংক (Panel Web Link) *</label>
                    <input 
                      type="url" 
                      value={ticketPanelUrl}
                      onChange={(e) => setTicketPanelUrl(e.target.value)}
                      className="w-full bg-white border border-indigo-200 rounded-xl py-3 px-3.5 text-xs font-bold text-slate-800 placeholder:text-slate-350 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
                      placeholder="e.g. http://mypanel.com:8080"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1.5 font-sans">মেয়াদ (Duration Limit) *</label>
                    <select 
                      value={ticketPanelDuration} 
                      onChange={(e) => {
                        const dur = e.target.value;
                        setTicketPanelDuration(dur);
                        const price = getPanelPrice(dur);
                        setTopUpAmount(price.toString());
                        const paid = Number(ticketPaidAmount) || 0;
                        setTicketDueAmount(Math.max(0, price - paid).toString());
                      }}
                      className="w-full bg-white border border-indigo-200 rounded-xl py-3 px-3.5 text-xs font-bold text-slate-700 font-sans focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
                      required
                    >
                      <option value="">-- মেয়াদ লিমিট সিলেক্ট * --</option>
                      <option value="1 month">1 month (৳ {getPanelPrice('1 month')})</option>
                      <option value="2 month">2 month (৳ {getPanelPrice('2 month')})</option>
                      <option value="3 month">3 month (৳ {getPanelPrice('3 month')})</option>
                      <option value="4 month">4 month (৳ {getPanelPrice('4 month')})</option>
                      <option value="5 month">5 month (৳ {getPanelPrice('5 month')})</option>
                      <option value="6 month">6 month (৳ {getPanelPrice('6 month')})</option>
                      <option value="12 month">12 month (৳ {getPanelPrice('12 month')})</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1.5 font-sans">অর্ডার টাইপ (Subscription Type) *</label>
                    <select 
                      value={ticketPanelType} 
                      onChange={(e) => setTicketPanelType(e.target.value)}
                      className="w-full bg-white border border-indigo-200 rounded-xl py-3 px-3.5 text-xs font-bold text-slate-700 font-sans focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
                      required
                    >
                      <option value="">-- অর্ডার টাইপ সিলেক্ট * --</option>
                      <option value="New Connection">New Connection (নতুন সংযোগ)</option>
                      <option value="Renew Connection">Renew Connection (রিনিউ সংযোগ)</option>
                      <option value="App compilation addon">App compilation addon (অতিরিক্ত অ্যাডঅন)</option>
                    </select>
                  </div>
                </div>
              )}

              {topUpPurpose === 'Decoder License Purchase' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl animate-fade-in text-left">
                  <div>
                    <label className="block text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1.5 font-sans">ইউজারনেম (Username) *</label>
                    <input 
                      type="text" 
                      value={ticketDecoderUsername}
                      onChange={(e) => setTicketDecoderUsername(e.target.value)}
                      className="w-full bg-white border border-indigo-200 rounded-xl py-3 px-3.5 text-xs font-bold text-slate-800 placeholder:text-slate-350 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
                      placeholder="e.g. janesmith"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1.5 font-sans">ইউজার টাইপ (User Type) *</label>
                    <select 
                      value={ticketDecoderUserType} 
                      onChange={(e) => setTicketDecoderUserType(e.target.value)}
                      className="w-full bg-white border border-indigo-200 rounded-xl py-3 px-3.5 text-xs font-bold text-slate-700 font-sans focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
                      required
                    >
                      <option value="">-- ইউজার টাইপ সিলেক্ট করুন * --</option>
                      <option value="New user">New user (নতুন ইউজার)</option>
                      <option value="Old user">Old user (পুরানো ইউজার)</option>
                      <option value="Renew">Renew (রিনিউ)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1.5 font-sans">মেয়াদ (Duration) *</label>
                    <select 
                      value={ticketDecoderDuration} 
                      onChange={(e) => {
                        const dur = e.target.value;
                        setTicketDecoderDuration(dur);
                        if (!dur) {
                          setTopUpAmount('');
                          setTicketDueAmount('');
                          return;
                        }
                        const price = getDecoderPrice(dur);
                        setTopUpAmount(price.toString());
                        const paid = Number(ticketPaidAmount) || 0;
                        setTicketDueAmount(Math.max(0, price - paid).toString());
                      }}
                      className="w-full bg-white border border-indigo-200 rounded-xl py-3 px-3.5 text-xs font-bold text-slate-700 font-sans focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
                      required
                    >
                      <option value="">-- মেয়াদ সিলেক্ট করুন * --</option>
                      <option value="1 month">1 month (৳ {getDecoderPrice('1 month')})</option>
                      <option value="2 month">2 month (৳ {getDecoderPrice('2 month')})</option>
                      <option value="3 month">3 month (৳ {getDecoderPrice('3 month')})</option>
                      <option value="4 month">4 month (৳ {getDecoderPrice('4 month')})</option>
                      <option value="5 month">5 month (৳ {getDecoderPrice('5 month')})</option>
                      <option value="6 month">6 month (৳ {getDecoderPrice('6 month')})</option>
                      <option value="12 month">12 month (৳ {getDecoderPrice('12 month')})</option>
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
          </div>
        )}

        {/* 5. SETTINGS SUB-TAB: SHOW PROFILE DETAILS AND PASSWORD RESET */}
        {activeSubTab === 'settings' && (
          <div className="bg-white border border-slate-200 rounded-[1.5rem] p-6 shadow-xs relative animate-fade-in">
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5 border-b border-slate-100 pb-3">
              <Lock size={16} className="text-indigo-650" />
              ব্যক্তিগত প্রোফাইল ও নিরাপত্তা পরিবর্তন (Profile & Security Options)
            </h2>
            
            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              এখানে আপনার বর্তমান প্রোফাইল ডাটাবেস দেখতে পারেন এবং নিরাপত্তার স্বার্থে সিকিউর পাসওয়ার্ড পরিবর্তন করতে পারেন।
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Profile Details Card */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-1.5">
                  <Users size={14} className="text-indigo-650" />
                  ব্যক্তিগত একাউন্ট প্রোফাইল (Account Profile Data)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="p-3.5 bg-slate-50 border border-slate-150 rounded-2xl">
                    <span className="text-[10px] text-slate-400 font-bold block">পূর্ণ নাম (Display Name)</span>
                    <span className="text-xs text-slate-800 font-sans font-black mt-0.5 block">
                      {currentUserData?.name || user?.name || 'Customer'}
                    </span>
                  </div>
                  <div className="p-3.5 bg-slate-50 border border-slate-150 rounded-2xl">
                    <span className="text-[10px] text-slate-400 font-bold block">ইউজারনেম (Username)</span>
                    <span className="text-xs text-slate-800 font-sans font-black mt-0.5 block">
                      @{currentUserData?.username || user?.username || 'user'}
                    </span>
                  </div>
                  <div className="p-3.5 bg-slate-50 border border-slate-150 rounded-2xl">
                    <span className="text-[10px] text-slate-400 font-bold block">মোবাইল নম্বর (Phone)</span>
                    <span className="text-xs text-slate-800 font-mono font-black mt-0.5 block">
                      {currentUserData?.phone || 'N/A'}
                    </span>
                  </div>
                  <div className="p-3.5 bg-slate-50 border border-slate-150 rounded-2xl">
                    <span className="text-[10px] text-slate-400 font-bold block">ইমেইল ঠিকানা (Email)</span>
                    <span className="text-xs text-slate-800 font-mono font-black mt-0.5 block truncate">
                      {currentUserData?.email || user?.email || 'N/A'}
                    </span>
                  </div>
                  <div className="p-3.5 bg-slate-50 border border-slate-150 rounded-2xl">
                    <span className="text-[10px] text-slate-400 font-bold block">নিবন্ধন টাইপ (Status)</span>
                    <span className="inline-flex items-center gap-1.5 text-[9.5px] font-black uppercase text-white bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-md mt-1 shrink-0">
                      ● {currentUserData?.status || 'approved'}
                    </span>
                  </div>
                  <div className="p-3.5 bg-slate-50 border border-slate-150 rounded-2xl">
                    <span className="text-[10px] text-slate-400 font-bold block">নিবন্ধনের তারিখ (Registered At)</span>
                    <span className="text-xs text-slate-800 font-mono font-black mt-0.5 block">
                      {joinedDateFormatted}
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl space-y-2">
                  <span className="text-[10px] font-black text-indigo-650 uppercase tracking-wider block">কম্পানি পেমেন্ট ডেজার খতিয়ান</span>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 bg-white rounded-xl border border-indigo-50/60">
                      <span className="text-[9px] text-slate-400 font-bold block">মোট মূল্য</span>
                      <strong className="text-slate-800 font-black">৳{totalFee.toLocaleString()}</strong>
                    </div>
                    <div className="p-2 bg-white rounded-xl border border-indigo-50/60">
                      <span className="text-[9px] text-emerald-500 font-bold block">পরিশোধিত</span>
                      <strong className="text-emerald-600 font-black">৳{paidFees.toLocaleString()}</strong>
                    </div>
                    <div className="p-2 bg-white rounded-xl border border-indigo-50/60">
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
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
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
    <div className="space-y-8 pb-12">
{/* Premium Welcome & Control Tower Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-[2rem] p-6 sm:p-8 shadow-xl border border-slate-800 animate-fade-in">
        {/* Abstract Background Vectors */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute left-1/3 bottom-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-indigo-500/30 text-indigo-200 backdrop-blur-md px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-500/20">
              <Sparkles size={12} className="text-indigo-400 animate-pulse" />
              মাস্টার কন্ট্রোল ড্যাশবোর্ড (Live Admin Control Center)
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-200 bg-clip-text text-transparent">
              {currentUserData?.name || user?.name || 'Administrator'} 👋
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed font-sans max-w-xl">
              সিস্টেমের লেনদেন, বকেয়া রিপোর্টিং, কাস্টমার সার্ভিস ও অর্জিত মুনাফা রিয়েলটাইমে মনিটর করুন। নতুন সার্ভিস ও বিল রিসিট তৈরি করতে নিচের কুইক অ্যাকশন হাব ব্যবহার করুন।
            </p>
          </div>

          {/* System Telemetry & Clock Widget */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 shrink-0">
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">চলতি সময় (Dhaka Local)</span>
              <div className="flex items-center gap-1.5 font-sans">
                <Clock size={13} className="text-emerald-400" />
                <span className="text-xs font-black tracking-wider text-white">
                  {new Date().toLocaleDateString('bn-BD', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>
            </div>
            <div className="h-8 w-[1px] bg-white/10 hidden sm:block"></div>
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">সার্ভার স্ট্যাটাস</span>
              <div className="flex items-center gap-1.5 font-sans">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">99.9% Uptime Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ⚡ DIRECT ACTION: Pending Approval Requests Console (সরাসরি পেমেন্ট অনুমোদন প্যানেল) */}
      {invoices.filter(inv => inv.status === 'pending').length > 0 ? (
        <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-300 rounded-[2rem] p-6 shadow-xs animate-pulse">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-3 border-b border-amber-200/50">
            <div className="space-y-1">
              <span className="text-[10px] bg-amber-600 text-white font-mono font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-flex items-center gap-1">
                <ShieldAlert size={12} className="text-amber-200" /> Action Required (অ্যাকশন প্রয়োজন)
              </span>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5 mt-1">
                পেন্ডিং বিল ও টপ-আপ পেমেন্ট অনুমোদন করুন (Direct Quick Invoice Approvals)
              </h3>
              <p className="text-[11px] text-slate-605 font-sans">নিচের রিকোয়েস্টগুলো কাস্টমার কর্তৃক সাবমিট করা হয়েছে। দ্রুত বিবরণী যাচাই করে এক ক্লিকে অনুমোদন বা রিজেক্ট করুনঃ</p>
            </div>
            <span className="text-xs bg-amber-500 text-white px-3 py-1 rounded-xl text-center font-black uppercase font-mono tracking-wider">
              {invoices.filter(inv => inv.status === 'pending').length} পেন্ডিং রিকোয়েস্ট
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {invoices.filter(inv => inv.status === 'pending').map((inv) => (
              <div key={inv.id} className="bg-white border border-amber-250/75 rounded-2xl p-5 hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-mono bg-amber-50 text-amber-700 font-black px-2 py-0.5 rounded-md uppercase border border-amber-200">
                      #{inv.id?.substring(0, 8).toUpperCase()}
                    </span>
                    <span className="text-[9px] text-slate-400 font-semibold font-mono">{inv.date}</span>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">গ্রাহকের নাম</span>
                      <strong className="text-slate-800 font-black">{inv.customerName}</strong>
                      <span className="text-[10px] text-slate-500 font-mono ml-1">(@{inv.username})</span>
                    </div>

                    <div className="text-xs">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">আবেদন বা ক্রয়ের উদ্দেশ্য</span>
                      <strong className="text-indigo-600 font-extrabold">{inv.type || 'পেমেন্ট টপ-আপ (Wallet Top-Up)'}</strong>
                      {inv.appName && <p className="text-[9px] text-slate-500 font-semibold italic mt-0.5">App: {inv.appName}</p>}
                      {inv.panelName && <p className="text-[9px] text-slate-500 font-semibold italic mt-0.5">Panel: {inv.panelName}</p>}
                      {inv.decoderUsername && <p className="text-[9px] text-slate-500 font-semibold italic mt-0.5">Decoder User: {inv.decoderUsername}</p>}
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex justify-between items-center">
                      <div>
                        <span className="text-[9.5px] text-slate-405 font-black uppercase font-mono block tracking-wider">পেমেন্ট মেথড (TxID)</span>
                        <span className="text-[11px] font-black text-slate-700 font-mono select-all block mt-0.5">{inv.paymentMethod || 'bKash/Nagad/Rocket'}</span>
                        <span className="text-[10px] text-indigo-600 font-mono bg-indigo-55/60 px-1 py-0.2 rounded border border-indigo-150 select-all font-bold tracking-tight inline-block mt-1">{inv.transactionId || 'No TxID'}</span>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <span className="text-[9.5px] text-rose-500 font-bold block uppercase tracking-wider">টাকার পরিমাণ</span>
                        <span className="text-base font-black text-rose-600 font-mono">৳{(inv.amount || 0).toLocaleString()}</span>
                        {inv.dueAmount && inv.dueAmount > 0 ? (
                          <div className="text-[9px] font-black mt-1 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded text-amber-800 flex flex-col text-right">
                            <span className="text-emerald-700 font-bold">পেইডঃ ৳{(inv.paidAmount || 0).toLocaleString()}</span>
                            <span className="text-rose-605 font-bold">বাকিঃ ৳{(inv.dueAmount || 0).toLocaleString()}</span>
                          </div>
                        ) : (
                          <span className="text-[8px] bg-emerald-100 text-emerald-800 font-black px-1.5 py-0.5 rounded uppercase tracking-wider block mt-1">FULL PAID</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2.5 mt-5 border-t border-slate-100 pt-3.5">
                  <button
                    disabled={isProcessingApproval !== null}
                    onClick={() => handleRejectRequest(inv)}
                    className="flex-1 py-2 rounded-xl text-[10px] font-black uppercase text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors disabled:opacity-50 cursor-pointer active:scale-95"
                  >
                    রিজেক্ট (Reject)
                  </button>
                  <button
                    disabled={isProcessingApproval !== null}
                    onClick={() => handleApproveRequest(inv)}
                    className="flex-1 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl text-[10px] font-black uppercase shadow-xs select-none transition-all hover:shadow-md disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1 active:scale-95"
                  >
                    {isProcessingApproval === inv.id ? (
                      <>
                        <RefreshCw size={11} className="animate-spin" />
                        প্রসেস...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={11} />
                        অনুমোদন দিন
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Dynamic Widget Settings Trigger Panel */}
      {false && (
      <div className="flex flex-col sm:flex-row justify-between sm:items-center bg-slate-50 border border-slate-200 rounded-[2rem] p-5.5 gap-4 shadow-xs/50 animate-fade-in">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-indigo-50 text-indigo-650 rounded-2xl border border-indigo-100/50 shadow-sm shrink-0">
            <Sliders size={20} className="stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-850 uppercase tracking-widest">কাস্টমাইজড উইজেট কন্ট্রোল (Custom Layout & Drag-and-Drop)</h3>
            <p className="text-[11px] text-slate-500 font-semibold font-sans mt-0.5">ড্যাশবোর্ড মেট্রিক কার্ডগুলো পিন/আনপিন করতে অথবা ড্র্যাগ করে পজিশন পরিবর্তন করতে এই কন্ট্রোল ব্যবহার করুন।</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsWidgetModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-black uppercase tracking-wider py-2.5 px-4.5 rounded-xl flex items-center gap-2 shadow-md shadow-indigo-600/10 active:scale-95 transition-all outline-none"
        >
          <Sliders size={13} />
          <span>উইজেট সাজান (Configure Panel)</span>
        </button>
      </div>
      )}

      {/* Bento Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {widgets.filter(w => w.isPinned).map((widget) => {
          const helper = getWidgetValueAndInfo(widget.id);
          const isDarkCard = widget.isDark;

          return (
            <motion.div 
              key={widget.id}
              layoutId={`widget-card-${widget.id}`}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', widget.id);
              }}
              onDragOver={(e) => {
                e.preventDefault();
              }}
              onDrop={(e) => {
                e.preventDefault();
                const sourceId = e.dataTransfer.getData('text/plain');
                if (!sourceId || sourceId === widget.id) return;

                const sourceIndex = widgets.findIndex(w => w.id === sourceId);
                const targetIndex = widgets.findIndex(w => w.id === widget.id);
                if (sourceIndex === -1 || targetIndex === -1) return;

                const reordered = [...widgets];
                const [removed] = reordered.splice(sourceIndex, 1);
                reordered.splice(targetIndex, 0, removed);
                
                setWidgets(reordered);
                localStorage.setItem('cached_dashboard_pinned_widgets', JSON.stringify(reordered));
              }}
              className={`cursor-grab active:cursor-grabbing p-6 rounded-[2rem] border shadow-xs relative overflow-hidden group hover:shadow-md hover:border-slate-350 transition-all h-full flex flex-col justify-between min-h-[170px] ${
                isDarkCard 
                  ? 'bg-slate-900 border-slate-800 text-white shadow-xl hover:bg-slate-950' 
                  : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              <div className="relative z-10">
                <div className="flex justify-between items-start">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${isDarkCard ? 'text-indigo-300' : 'text-slate-400'}`}>
                    {widget.id === 'totalRevenue' ? t('total_revenue') : widget.id === 'totalInvestment' ? t('total_investment') : widget.id === 'netProfit' ? t('net_profit') : widget.id === 'dueBalance' ? t('due_balance') : widget.label}
                  </span>
                  <div className={`p-2.5 rounded-xl group-hover:scale-110 transition-all ${
                    isDarkCard 
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/10' 
                      : widget.color
                  }`}>
                    {getWidgetIcon(widget.icon)}
                  </div>
                </div>

                <div className="mt-4">
                  <span className={`text-[10px] font-bold block mb-0.5 font-sans ${isDarkCard ? 'text-rose-400' : 'text-slate-500'}`}>
                    {widget.bangla}
                  </span>
                  <h3 className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${isDarkCard ? 'text-white' : 'text-slate-900'}`}>
                    {helper.value}
                  </h3>
                </div>
              </div>

              <div className={`mt-4 pt-3 border-t flex items-center justify-between relative z-10 ${isDarkCard ? 'border-white/5' : 'border-slate-100'}`}>
                {helper.sparkLine ? (
                  <>
                    <div className={`flex items-center gap-1 text-[9px] font-bold px-2.5 py-0.5 rounded-full ${helper.sparkDown ? 'text-rose-650 bg-rose-50' : 'text-emerald-700 bg-emerald-50'}`}>
                      {!helper.sparkDown && <ArrowUpRight size={10} />}
                      <span>{helper.bottomText}</span>
                    </div>
                    {/* SVG Sparkline Sparkle Graphic */}
                    <svg className={`w-16 h-5 overflow-visible shrink-0 ${helper.sparkColor}`} viewBox="0 0 100 20" fill="none">
                      <path 
                        d={helper.sparkDown ? "M0,2 L20,14 L40,7 L60,18 L80,9 L100,15" : "M0,15 L20,8 L40,17 L60,4 L80,12 L100,2"} 
                        stroke="currentColor" 
                        strokeWidth="2.5" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                      />
                    </svg>
                  </>
                ) : helper.badge ? (
                  <>
                    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${isDarkCard ? 'bg-white/5' : 'bg-slate-100'}`}>
                      {helper.bottomText}
                    </span>
                    <span className={`text-[9px] font-black animate-pulse flex items-center gap-1 ${isDarkCard ? 'text-rose-400' : 'text-slate-600'}`}>
                      {helper.badgeLabel || '● Active Tracking'}
                    </span>
                  </>
                ) : helper.avatars ? (
                  <>
                    <span className="text-[9px] font-bold text-slate-400">{helper.bottomText}</span>
                    <div className="flex -space-x-2.5 overflow-hidden filter saturate-110">
                      <div className="w-5.5 h-5.5 rounded-full border-2 border-white bg-indigo-400 text-[8px] font-black flex items-center justify-center text-white">A</div>
                      <div className="w-5.5 h-5.5 rounded-full border-2 border-white bg-emerald-400 text-[8px] font-black flex items-center justify-center text-white">S</div>
                      <div className="w-5.5 h-5.5 rounded-full border-2 border-white bg-indigo-500 text-[8px] font-black flex items-center justify-center text-white">M</div>
                    </div>
                  </>
                ) : helper.iconAlert ? (
                  <div className="flex items-center gap-1 text-[9px] font-black text-amber-600 bg-amber-50 border border-amber-100/40 px-2.5 py-0.5 rounded-md animate-pulse">
                    <span>⚠️ {helper.bottomText}</span>
                  </div>
                ) : (
                  <>
                    <span className="text-[9.5px] font-bold italic text-slate-400">
                      {helper.bottomText}
                    </span>
                    <div className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${helper.indicator || 'bg-indigo-500'} animate-pulse shadow-md`} />
                    </div>
                  </>
                )}
              </div>
              <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-slate-500/10 rounded-full blur-2xl group-hover:bg-slate-500/20 transition-all"></div>
            </motion.div>
          );
        })}
      </div>

      {/* Daily Revenue Trends & Advanced Graph System Section */}
      {false && (
      <div className="bg-white p-6 sm:p-8 border border-slate-200 rounded-[2rem] shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <BarChart3 size={18} className="animate-pulse" />
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">ইন্টারেক্টিভ রেভিনিউ ও প্রফিট অ্যানালিটিক্স (Interactive Revenue System)</h2>
                <p className="text-xs text-slate-500 font-sans">
                  {dailyRevenueData.monthNameBng} {dailyRevenueData.year} সালের রিয়েলটাইম পরিশোধিত ও অনুমোদিত পেমেন্টের মাল্টি-চার্ট বিশ্লেষণ
                </p>
              </div>
            </div>
          </div>
          
          {/* Interactive Controls Panel */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-4">
            {/* Metric Mode Select */}
            <div className="bg-slate-50 p-1 rounded-2xl border border-slate-150 flex items-center gap-1 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setChartMetricMode('daily')}
                className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  chartMetricMode === 'daily'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                দৈনিক আয়
              </button>
              <button
                type="button"
                onClick={() => setChartMetricMode('cumulative')}
                className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  chartMetricMode === 'cumulative'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                ক্রমবর্ধমান গ্রোথ
              </button>
              <button
                type="button"
                onClick={() => setChartMetricMode('profit')}
                className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  chartMetricMode === 'profit'
                    ? 'bg-white text-emerald-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                ৮৫% নেট প্রফিট
              </button>
            </div>

            {/* Visual Type Select */}
            <div className="bg-slate-50 p-1 rounded-2xl border border-slate-150 flex items-center gap-1 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setChartVisualType('bar')}
                className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  chartVisualType === 'bar'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Bar Chart"
              >
                বার চার্ট
              </button>
              <button
                type="button"
                onClick={() => setChartVisualType('area')}
                className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  chartVisualType === 'area'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Area Chart"
              >
                এরিয়া
              </button>
              <button
                type="button"
                onClick={() => setChartVisualType('line')}
                className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  chartVisualType === 'line'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Line Chart"
              >
                লাইন
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Graphic Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Chart column */}
          <div className="lg:col-span-8 flex flex-col justify-between">
            <div className="h-[320px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                {chartVisualType === 'bar' ? (
                  <BarChart data={dailyRevenueData.data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="day" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700, fontFamily: 'monospace' }} 
                      dy={8} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 10, fontWeight: 650, fontFamily: 'monospace' }} 
                      dx={-4}
                    />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc', radius: 4 }}
                      contentStyle={{ 
                        borderRadius: '16px', 
                        backgroundColor: '#0f172a', 
                        color: '#ffffff',
                        border: 'none', 
                        boxShadow: '0 8px 16px -2px rgb(0 0 0 / 0.15)',
                        padding: '12px 14px'
                      }}
                      labelStyle={{ fontWeight: 'black', marginBottom: '4px', fontSize: '11px', color: '#94a3b8' }}
                      itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                      formatter={(value: any) => [`৳${Number(value).toLocaleString()}`, chartMetricMode === 'daily' ? 'দৈনিক রেভিনিউ' : chartMetricMode === 'cumulative' ? 'ক্রমবর্ধমান সংগ্রহ' : 'আনুমানিক লাভ']}
                      labelFormatter={(label) => `${dailyRevenueData.monthName} ${label} তারিখ`}
                    />
                    <Bar 
                      dataKey={chartMetricMode === 'daily' ? 'revenue' : chartMetricMode === 'cumulative' ? 'cumulative' : 'profit'} 
                      fill={chartMetricMode === 'profit' ? '#10b981' : '#4f46e5'} 
                      radius={[6, 6, 0, 0]} 
                      maxBarSize={32}
                    >
                      {dailyRevenueData.data.map((entry, index) => {
                        const val = chartMetricMode === 'daily' ? entry.revenue : chartMetricMode === 'cumulative' ? entry.cumulative : entry.profit;
                        return (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={val > 0 ? (chartMetricMode === 'profit' ? '#10b981' : '#4f46e5') : '#e2e8f0'} 
                          />
                        );
                      })}
                    </Bar>
                  </BarChart>
                ) : chartVisualType === 'area' ? (
                  <AreaChart data={dailyRevenueData.data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={chartMetricMode === 'profit' ? '#10b981' : '#4f46e5'} stopOpacity={0.35}/>
                        <stop offset="95%" stopColor={chartMetricMode === 'profit' ? '#10b981' : '#4f46e5'} stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="day" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700, fontFamily: 'monospace' }} 
                      dy={8} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 10, fontWeight: 650, fontFamily: 'monospace' }} 
                      dx={-4}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '16px', 
                        backgroundColor: '#0f172a', 
                        color: '#ffffff',
                        border: 'none', 
                        boxShadow: '0 8px 16px -2px rgb(0 0 0 / 0.15)',
                        padding: '12px 14px'
                      }}
                      labelStyle={{ fontWeight: 'black', marginBottom: '4px', fontSize: '11px', color: '#94a3b8' }}
                      itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                      formatter={(value: any) => [`৳${Number(value).toLocaleString()}`, chartMetricMode === 'daily' ? 'দৈনিক রেভিনিউ' : chartMetricMode === 'cumulative' ? 'ক্রমবর্ধমান সংগ্রহ' : 'আনুমানিক লাভ']}
                      labelFormatter={(label) => `${dailyRevenueData.monthName} ${label} তারিখ`}
                    />
                    <Area 
                      type="monotone"
                      dataKey={chartMetricMode === 'daily' ? 'revenue' : chartMetricMode === 'cumulative' ? 'cumulative' : 'profit'} 
                      stroke={chartMetricMode === 'profit' ? '#10b981' : '#4f46e5'} 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorMetric)" 
                    />
                  </AreaChart>
                ) : (
                  <LineChart data={dailyRevenueData.data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="day" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700, fontFamily: 'monospace' }} 
                      dy={8} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 10, fontWeight: 650, fontFamily: 'monospace' }} 
                      dx={-4}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '16px', 
                        backgroundColor: '#0f172a', 
                        color: '#ffffff',
                        border: 'none', 
                        boxShadow: '0 8px 16px -2px rgb(0 0 0 / 0.15)',
                        padding: '12px 14px'
                      }}
                      labelStyle={{ fontWeight: 'black', marginBottom: '4px', fontSize: '11px', color: '#94a3b8' }}
                      itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                      formatter={(value: any) => [`৳${Number(value).toLocaleString()}`, chartMetricMode === 'daily' ? 'দৈনিক রেভিনিউ' : chartMetricMode === 'cumulative' ? 'ক্রমবর্ধমান সংগ্রহ' : 'আনুমানিক লাভ']}
                      labelFormatter={(label) => `${dailyRevenueData.monthName} ${label} তারিখ`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey={chartMetricMode === 'daily' ? 'revenue' : chartMetricMode === 'cumulative' ? 'cumulative' : 'profit'} 
                      stroke={chartMetricMode === 'profit' ? '#10b981' : '#4f46e5'} 
                      strokeWidth={3.5}
                      dot={{ r: 3, strokeWidth: 1 }}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
            
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-bold mt-4 font-sans">
              <span>* রিয়েলটাইম ব্যাংক, গেটওয়ে এবং ক্যাশ ট্রানজেকশন ডেটা সিঙ্ক্রোনাইজড</span>
              <span>সর্বশেষ আপডেট: {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
            </div>
          </div>

          {/* Interactive Intelligence Insights Sidebar Panel */}
          <div className="lg:col-span-4 bg-slate-50 border border-slate-150 p-6 rounded-3xl flex flex-col justify-between space-y-5">
            <div>
              <span className="text-[10px] font-black tracking-widest text-indigo-500 uppercase block mb-1">Advanced Performance Insights</span>
              <h3 className="text-sm font-bold text-slate-800">অ্যানালিটিক্স ওভারভিউ ({dailyRevenueData.monthNameBng})</h3>
              <p className="text-[11px] text-slate-500 mt-1">চলতি মাসের পারফরম্যান্স খতিয়ানের অটোমেটেড ইন্টেলিজেন্স সারসংক্ষেপ</p>
            </div>

            <div className="space-y-4">
              {/* Daily Average card */}
              <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                  <TrendingUp size={16} />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-black tracking-wider uppercase block">সার্বিক দৈনিক গড় আয়</span>
                  <span className="text-sm font-black text-slate-800 font-mono">৳{dailyRevenueData.overallDailyAverage.toLocaleString()} <span className="text-[10px] text-slate-400 font-bold font-sans">/ দিন</span></span>
                </div>
              </div>

              {/* Peak Revenue surge */}
              <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Sparkles size={16} />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-black tracking-wider uppercase block">সর্বোচ্চ পেমেন্ট জোয়ার (Peak Day)</span>
                  <span className="text-sm font-black text-emerald-600 font-mono">
                    ৳{dailyRevenueData.peakDayAmount.toLocaleString()} 
                    {dailyRevenueData.peakDay > 0 && <span className="text-[10px] text-slate-500 font-bold font-sans"> (Day {dailyRevenueData.peakDay})</span>}
                  </span>
                </div>
              </div>

              {/* Successful Active Days */}
              <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3">
                <div className="p-2.5 bg-violet-50 text-violet-600 rounded-xl">
                  <Activity size={16} />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-black tracking-wider uppercase block">পেমেন্ট একটিভ দিন সংখ্যা</span>
                  <span className="text-sm font-black text-slate-800 font-mono">{dailyRevenueData.activeDaysCount} দিন <span className="text-[10px] font-sans text-slate-400 font-bold">({Math.round((dailyRevenueData.activeDaysCount / dailyRevenueData.data.length) * 100)}% active)</span></span>
                </div>
              </div>
            </div>

            {/* Monthly Budget goal milestone slider gauge */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-2">
              <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400">
                <span>মাসিক টার্গেট গোল (৳250k)</span>
                <span className="font-mono text-indigo-600 font-black">{Math.round((dailyRevenueData.total / 250000) * 100)}% অর্জিত</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-indigo-600 h-full rounded-full transition-all duration-1000 shadow-[0_0_12px_rgba(79,70,229,0.4)]"
                  style={{ width: `${Math.min(100, Math.round((dailyRevenueData.total / 250000) * 100))}%` }}
                />
              </div>
              <span className="text-[9px] text-slate-400 font-bold block leading-relaxed italic">
                * লক্ষ্যমাত্রা অর্জনে আরও ৳{Math.max(0, 250000 - dailyRevenueData.total).toLocaleString()} প্রয়োজন।
              </span>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* 📊 ADVANCED LEDGER PERFORMANCE INSIGHTS (অ্যাডভান্সড কোম্পানির খতিয়ান ও পারফরম্যান্স বিশ্লেষণ হাব) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 1. Service Sales Contribution Breakdown (ক্যাটাগরি ভিত্তিক বিক্রয় বিশ্লেষণ) */}
        <div className="col-span-12 lg:col-span-6 bg-white p-6 border border-slate-200 rounded-[2rem] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="space-y-0.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Business Segments</span>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  সার্ভিস ভিত্তিক বিক্রয় শেয়ার (Breakdown)
                </h3>
              </div>
              <span className="text-[9px] font-bold text-indigo-650 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">Real-Time</span>
            </div>

            <div className="space-y-4">
              {salesBreakdown.map((item, index) => (
                <div key={index} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${item.color}`}></span>
                      {item.bangla}
                    </span>
                    <span className="font-mono font-black text-slate-900">
                      ৳{item.value.toLocaleString()} ({item.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${item.color}`} 
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 mt-5 text-[10px] text-slate-400 font-semibold italic flex items-center justify-between">
            <span>* শুধুমাত্র সফল বিল পরিশোধ গণনা করা হয়েছে</span>
            <span>মোট 4 ক্যাটাগরি</span>
          </div>
        </div>

        {/* 2. Audit Ledger & Financial Diagnostic Rating (ফাইন্যান্সিয়াল হেলথ স্কোর) */}
        <div className="col-span-12 md:col-span-6 lg:col-span-6 bg-white p-6 border border-slate-200 rounded-[2rem] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="space-y-0.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Audit Security Indices</span>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  ফাইন্যান্সিয়াল হেলথ রেশিও (Health Rating)
                </h3>
              </div>
              <Activity size={14} className="text-emerald-500 animate-pulse" />
            </div>

            <div className="space-y-5">
              <div className="flex items-center gap-4">
                {/* Visual Circle Gauge Percentage using elegant standard HTML */}
                <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" stroke="#f1f5f9" strokeWidth="8" fill="transparent" />
                    <circle 
                      cx="50" cy="50" r="40" 
                      stroke={healthScore >= 80 ? "#10b981" : healthScore >= 50 ? "#f59e0b" : "#ef4444"} 
                      strokeWidth="8" fill="transparent" 
                      strokeDasharray={`${2 * Math.PI * 40}`}
                      strokeDashoffset={`${2 * Math.PI * 40 * (1 - healthScore / 100)}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute font-mono font-black text-sm text-slate-900">{healthScore}%</span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Audit Score Interpretation</span>
                  <span className={`text-xs font-black uppercase px-2 py-0.5 rounded-md inline-block ${
                    healthScore >= 80 ? 'bg-emerald-50 text-emerald-700 border border-emerald-150' : 
                    healthScore >= 50 ? 'bg-amber-50 text-amber-700 border border-amber-150' : 'bg-rose-50 text-rose-700 border border-rose-150'
                  }`}>
                    {healthScore >= 80 ? 'এক্সিলেন্ট হেলথ (Excellent)' : healthScore >= 50 ? 'মাঝারি ঝুঁকি (Moderate Risk)' : 'উচ্চ ঝুঁকি বকেয়া বকেয়া (Dangerous)'}
                  </span>
                  <p className="text-[10.5px] text-slate-500 font-semibold font-sans leading-relaxed">
                    আদায়কৃত রেভিনিউ বনাম অনাদায়ী বকেয়া বিলের রেশিও অনুপাত বিশ্লেষণ করে রেটিং হিসাব করা হয়েছে।
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-50/70 border border-slate-100 rounded-2xl space-y-1">
                <span className="text-[9.5px] text-slate-400 font-bold block uppercase tracking-widest">Diagnostic Recommendation</span>
                <p className="text-[10px] text-slate-650 leading-relaxed font-sans font-medium">
                  {healthScore >= 80 
                    ? 'চমৎকার! কোম্পানির ক্যাশফ্লো চমৎকার অবস্থায় রয়েছে।' 
                    : healthScore >= 50 
                    ? 'সতর্কীকরণঃ বকেয়া টাকার পরিমাণ বাড়ছে। দ্রুত পেন্ডিং ইনভয়েস কাস্টমারদের মনে করিয়ে দিন।'
                    : 'ঝুঁকিঃ বকেয়ার পরিমাণ আশঙ্কাজনক। বকেয়া আদায় নিশ্চিত করুন।'}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 mt-5 text-[10px] text-slate-400/80 font-mono font-black uppercase tracking-wider flex items-center justify-between">
            <span>Verified System Index</span>
            <span className="text-emerald-500">Live Secured</span>
          </div>
        </div>

        {/* 3. Actionable Admin Notes (লাইভ নোটপ্যাড যা ব্রাউজারে সংরক্ষিত থাকবে) */}
        {false && (
        <div className="col-span-12 md:col-span-6 lg:col-span-4 bg-white p-6 border border-slate-200 rounded-[2rem] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="space-y-0.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Admin Private Memo</span>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  নিরাপদ এডমিন কুইক নোটস / মেমো
                </h3>
              </div>
              <div className="flex items-center gap-1">
                {notesSaveSuccess && (
                  <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md animate-fade-in">সেভ করা হয়েছে!</span>
                )}
                <FileText size={14} className="text-indigo-600" />
              </div>
            </div>

            <div className="space-y-2">
              <textarea
                value={adminNotes}
                onChange={(e) => {
                  setAdminNotes(e.target.value);
                  localStorage.setItem('admin_desktop_sticky_notes', e.target.value);
                  setNotesSaveSuccess(true);
                  setTimeout(() => setNotesSaveSuccess(false), 1500);
                }}
                placeholder="এখানে জরুরী বিল আইডি, কাস্টমার ফোন নম্বর অথবা প্রসেসিং নোটস লিখে রাখতে পারেন যা সম্পূর্ণ স্বয়ংক্রিয়ভাবে ব্রাউজারে সংরক্ষিত থাকবে..."
                className="w-full h-[125px] p-3 text-[11px] font-medium leading-relaxed text-slate-700 bg-amber-50/15 border border-amber-200/55 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-400/20 focus:bg-amber-50/20 resize-none font-sans"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 mt-4 flex items-center justify-between">
            <button 
              onClick={() => {
                if (window.confirm('আপনি কি নোটপ্যাডের সব লেখা মুছে দিতে চান?')) {
                  setAdminNotes('');
                  localStorage.removeItem('admin_desktop_sticky_notes');
                }
              }}
              className="text-[9.5px] font-black text-rose-500 uppercase hover:bg-rose-50 px-2 py-1 rounded-md transition-colors"
            >
              সব মুছুন
            </button>
            <span className="text-[9.5px] font-mono text-slate-400 font-semibold italic">● অটো-সেভ ইনডেক্স একটিভ</span>
          </div>
        </div>
        )}
      </div>

      {/* Main Row: Double Panels */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Column: Financial Graph Area Flow */}
        {false && (
        <div className="col-span-12 lg:col-span-8">
          <div className="bg-white p-6 sm:p-8 border border-slate-200 rounded-[2rem] shadow-sm flex flex-col justify-between h-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <BarChart3 size={16} className="text-indigo-600" />
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">{t('revenue_stream')}</h2>
                </div>
                <p className="text-[11px] text-slate-500 font-sans">কোম্পানির রেভিনিউ প্রবাহ এবং প্রাপ্ত পেমেন্টের গতিশীল গ্রাফ চার্ট প্রবাহ:</p>
              </div>

              {/* Graphical Filters Mock pills for aesthetic decoration */}
              <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl w-fit shrink-0 border border-slate-200/50">
                <button className="text-[9.5px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-white text-slate-800 shadow-sm">সাপ্তাহিক</button>
                <button className="text-[9.5px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg text-slate-500 hover:bg-white/50">মাসিক</button>
                <button className="text-[9.5px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg text-slate-500 hover:bg-white/50">বাৎসরিক</button>
              </div>
            </div>

            <div className="h-[320px] w-full pt-4 pr-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={defaultChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="premiumColorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                  
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700, fontFamily: 'monospace' }} 
                    dy={12} 
                  />
                  
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 10, fontWeight: 650, fontFamily: 'monospace' }} 
                    dx={-4}
                  />
                  
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '16px', 
                      backgroundColor: '#0f172a', 
                      color: '#ffffff',
                      border: 'none', 
                      boxShadow: '0 8px 16px -2px rgb(0 0 0 / 0.15)',
                      padding: '12px 14px'
                    }}
                    labelStyle={{ fontWeight: 'black', marginBottom: '4px', fontSize: '11px', color: '#94a3b8' }}
                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                    formatter={(value: any) => [`৳${Number(value).toLocaleString()}`, 'রেভিনিউ']}
                  />
                  
                  <Area 
                    type="monotone" 
                    dataKey="income" 
                    stroke="#4f46e5" 
                    fillOpacity={1} 
                    fill="url(#premiumColorIncome)" 
                    strokeWidth={3} 
                    activeDot={{ r: 6, strokeWidth: 0, fill: '#4f46e5' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6 pt-5 border-t border-slate-100">
              <div className="flex gap-2 items-start">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 mt-1"></span>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">কম্পিউটেড রেভিনিউ</span>
                  <p className="text-xs font-bold text-slate-800">৳{stats.totalRevenue.toLocaleString()}</p>
                </div>
              </div>

              <div className="flex gap-2 items-start">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1"></span>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">সার্ভার নেট পারফরম্যান্স</span>
                  <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest font-mono">Verified Ledger</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Right Column: Activities and Recent Invoices Split Container */}
        <div className="col-span-12 grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Recent Activity Log Lists */}
          <div className="bg-white border border-slate-200 rounded-[2rem] flex flex-col overflow-hidden h-fit">
            <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Clock size={15} className="text-indigo-600" />
                <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider">{t('recent_activities')}</h2>
              </div>
              <span className="text-[9px] font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">রিসেন্ট লগ</span>
            </div>

            <div className="p-4 space-y-3.5 max-h-[350px] overflow-y-auto divide-y divide-slate-100/60 leading-relaxed font-sans font-medium">
              {activities.length > 0 ? (
                activities.slice(0, 10).map((log, idx) => {
                  const rawUser = log.user || 'admin@master';
                  const cleanUser = rawUser.split('@')[0];
                  const colorGradients = [
                    'bg-gradient-to-br from-indigo-400 to-indigo-600',
                    'bg-gradient-to-br from-violet-400 to-violet-600',
                    'bg-gradient-to-br from-emerald-400 to-emerald-600',
                    'bg-gradient-to-br from-amber-400 to-amber-600',
                    'bg-gradient-to-br from-rose-400 to-rose-600'
                  ];
                  const idxGlow = cleanUser.charCodeAt(0) % colorGradients.length;
                  const activeGrad = colorGradients[idxGlow];

                  return (
                    <div key={log.id} className="flex items-start gap-3.5 pt-3.5 first:pt-0 group border-none">
                      <div className={`w-8 h-8 rounded-xl ${activeGrad} shadow-sm text-white text-[11px] font-black uppercase flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                        {cleanUser.substring(0, 2).toUpperCase()}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-slate-800 group-hover:text-indigo-600 transition-colors tracking-tight line-clamp-2 uppercase">
                          {log.message}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] text-slate-450 font-black tracking-wider uppercase bg-slate-100 px-1.5 py-0.5 rounded">
                            {cleanUser}
                          </span>
                          <span className="text-[8px] text-slate-300">•</span>
                          <span className="text-[9px] text-slate-400 font-semibold font-mono tracking-wider">
                            {new Date(log.timestamp).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center">
                  <p className="text-xs text-slate-400 italic leading-relaxed">{t('no_recent_activities')}</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Invoices list */}
          <div className="bg-white border border-slate-200 rounded-[2rem] flex flex-col overflow-hidden h-fit">
            <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <FileText size={15} className="text-indigo-600" />
                <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider">{t('recent_invoices')}</h2>
              </div>
              <span className="text-[9px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">রিসেন্ট বিল</span>
            </div>

            <div className="p-4 space-y-3 max-h-[350px] overflow-y-auto divide-y divide-slate-100/60 leading-relaxed font-sans">
              {invoices.length > 0 ? (
                invoices.slice(0, 8).map((inv, i) => (
                  <div key={inv.id} className="flex items-start justify-between gap-3 pt-3 first:pt-0 group border-none hover:bg-slate-50/20 rounded-xl p-1.5 transition-colors">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${
                        inv.status === 'paid' ? 'bg-emerald-500 shadow-md shadow-emerald-200' : 
                        inv.status === 'pending' ? 'bg-amber-500 shadow-md shadow-amber-200' : 'bg-rose-500'
                      }`}></div>
                      <div className="min-w-0">
                        <p className="text-xs font-black text-slate-800 truncate uppercase group-hover:text-indigo-600 transition-colors">
                          {inv.customerName}
                        </p>
                        <p className="text-[9px] text-slate-400 font-semibold font-mono tracking-wider mt-0.5">
                          #{inv.id.substring(0, 8)} • ৳{(inv.amount || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <span className={`text-[8.5px] font-black uppercase font-mono px-2 py-0.5 rounded-md self-center ${
                      inv.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                      inv.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
                    }`}>
                      {t(inv.status)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-slate-400 text-xs italic leading-relaxed">
                  {t('no_invoices')}
                </div>
              )}
            </div>

            <div className="p-4.5 border-t border-slate-100 bg-slate-50/40 text-center">
              <span className="text-[10px] text-indigo-600 hover:text-indigo-700 font-black uppercase tracking-widest cursor-pointer inline-flex items-center gap-1">
                {t('view_full_history')} <ChevronRight size={11} />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Quick Action Bento Hub - Activated & Polished (Moved Below) */}
      {false && (
      <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm mt-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
          <div className="space-y-1">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={15} className="text-indigo-600 animate-pulse" />
              সিস্টেম এডমিন কুইক অ্যাকশন হাব (Quick Action Hub)
            </h3>
            <p className="text-[11px] text-slate-500 font-sans">কাস্টমারের জন্য পেমেন্ট বিল বা ইনভয়েস ক্যাটাগরি অনুযায়ী তাৎক্ষণিক রিয়েলটাইমে তৈরি করুন:</p>
          </div>
          <span className="text-[9px] font-mono bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full border border-indigo-100/50 font-black uppercase tracking-wider block w-fit">4 Modules Ready</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { 
              modalKey: 'app', 
              label: settings.appLabel || 'Android App Link', 
              bangla: 'অ্যান্ড্রয়েড অ্যাপ লাইসেন্স', 
              color: 'from-blue-500 hover:from-blue-600', 
              bgGlow: 'bg-blue-50 hover:border-blue-300', 
              textColor: 'text-blue-700',
              desc: 'রিমোট কন্ট্রোল অ্যাপ ডিকোড লিংক ও ইনভয়েস বিল'
            },
            { 
              modalKey: 'decoder', 
              label: settings.decoderLabel || 'Decoder System', 
              bangla: 'ডিকোডার লাইসেন্স', 
              color: 'from-emerald-500 hover:from-emerald-600', 
              bgGlow: 'bg-emerald-50 hover:border-emerald-300', 
              textColor: 'text-emerald-700',
              desc: 'ডিকোডার প্যানেল এক্সেস লাইসেন্স ও চার্জ' 
            },
            { 
              modalKey: 'panel', 
              label: settings.panelLabel || 'Reseller Panel', 
              bangla: 'রিসেলার প্যানেল প্যাক', 
              color: 'from-violet-500 hover:from-violet-600', 
              bgGlow: 'bg-violet-50 hover:border-violet-300', 
              textColor: 'text-violet-700',
              desc: 'রিসেলার রেন্ট বা সোর্স কোড ভাড়া চালান' 
            },
            { 
              modalKey: 'user', 
              label: settings.userLabel || 'Customer Account', 
              bangla: 'নতুন ইউজার অ্যাকাউন্ট', 
              color: 'from-indigo-500 hover:from-indigo-600', 
              bgGlow: 'bg-indigo-50 hover:border-indigo-300', 
              textColor: 'text-indigo-700',
              desc: 'সরাসরি নতুন কাস্টমার প্রোফাইল সেটিংস তৈরি' 
            }
          ].map((action, idx) => (
            <button
              key={idx}
              onClick={() => setActiveModal(action.modalKey as any)}
              className="text-left p-5 rounded-2xl border border-slate-250 bg-white hover:bg-slate-50/55 transition-all cursor-pointer group hover:shadow-md hover:scale-[1.01] flex flex-col justify-between h-full min-h-[140px] relative overflow-hidden"
            >
              <div className="space-y-2 relative z-10">
                <span className={`inline-block text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${action.bgGlow} ${action.textColor} border border-transparent group-hover:border-slate-300/30`}>
                  {action.bangla}
                </span>
                <h4 className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase">
                  {action.label}
                </h4>
                <p className="text-[10px] text-slate-500 leading-relaxed font-sans font-medium line-clamp-2">
                  {action.desc}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 relative z-10 border-t border-slate-100">
                <span className="text-[10px] text-slate-500 group-hover:text-indigo-600 font-black tracking-wider uppercase flex items-center gap-0.5">
                  তৈরি করুন <ChevronRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
                </span>
                <div className={`p-1.5 rounded-lg bg-gradient-to-br ${action.color} text-white shadow-xs group-hover:rotate-6 transition-transform`}>
                  <Plus size={13} />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
      )}

      {/* Modals */}
      <Modal 
        isOpen={activeModal === 'app'} 
        onClose={() => setActiveModal(null)} 
        title={`${t('create_new_invoice')} - ${settings.appLabel || t('apps')}`}
      >
        <CreateAppForm onSuccess={handleCreateSuccess} onCancel={() => setActiveModal(null)} />
      </Modal>

      <Modal 
        isOpen={activeModal === 'decoder'} 
        onClose={() => setActiveModal(null)} 
        title={`${t('create_new_invoice')} - ${settings.decoderLabel || t('decoders')}`}
      >
        <CreateDecoderForm onSuccess={handleCreateSuccess} onCancel={() => setActiveModal(null)} />
      </Modal>

      <Modal 
        isOpen={activeModal === 'panel'} 
        onClose={() => setActiveModal(null)} 
        title={`${t('create_new_invoice')} - ${settings.panelLabel || t('panels')}`}
      >
        <CreatePanelForm onSuccess={handleCreateSuccess} onCancel={() => setActiveModal(null)} />
      </Modal>

      <Modal 
        isOpen={activeModal === 'user'} 
        onClose={() => setActiveModal(null)} 
        title={`${t('create_new_invoice')} - ${settings.userLabel || t('users')}`}
      >
        <CreateUserForm onSuccess={handleCreateSuccess} onCancel={() => setActiveModal(null)} />
      </Modal>
      
      <Modal 
        isOpen={activeModal === 'invoice'} 
        onClose={() => setActiveModal(null)} 
        title={t('preview_invoice')}
      >
        <div className="text-center py-8">
          <p className="text-sm text-slate-500 mb-4">{t('invoice_gen_desc')}</p>
          <button onClick={() => setActiveModal(null)} className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg pointer-events-auto">{t('understood')}</button>
        </div>
      </Modal>

      {/* Dynamic Widget Configuration Controller Modal */}
      <Modal
        isOpen={isWidgetModalOpen}
        onClose={() => setIsWidgetModalOpen(false)}
        title="⚙️ ড্যাশবোর্ড উইজেট সেটিংস (Configure Metrics Layout)"
      >
        <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-1">
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4.5 flex gap-3">
            <span className="text-xl shrink-0">💡</span>
            <div>
              <p className="text-[11px] font-black uppercase text-indigo-700 tracking-wider">উইজেট সর্টিং ও পিন পরামর্শ:</p>
              <p className="text-[11.5px] text-indigo-900 leading-relaxed font-sans font-medium mt-1">
                আপনার ড্যাশবোর্ডে কোন কোন মেট্রিক প্রদর্শন করতে চান তা নির্বাচন করুন। আপনি মোবাইল বা টাচ ডিভাইসে ড্যাশবোর্ড সাজাতে ২ পাশের <b>Chevron Arrow</b> বাটনগুলো ব্যবহার করে উপরে/নিচে করতে পারেন অথবা ডাবল-ক্লিক ড্র্যাগ করে ড্রপ করতে পারেন।
              </p>
            </div>
          </div>

          <div 
            className="space-y-2.5 font-sans"
            onDragOver={handleDragOver}
          >
            {widgets.map((widget, index) => {
              const helper = getWidgetValueAndInfo(widget.id);
              const isFirst = index === 0;
              const isLast = index === widgets.length - 1;

              return (
                <div
                  key={widget.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDrop={() => handleDrop(index)}
                  className={`flex items-center justify-between p-3.5 border rounded-2xl transition-all cursor-move group select-none ${
                    widget.isPinned 
                      ? 'bg-slate-50 border-slate-300 shadow-xs' 
                      : 'bg-white border-slate-150 opacity-65 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="flex flex-col gap-0.5 pointer-events-none text-slate-300 group-hover:text-slate-450 shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-current" />
                      <div className="w-1.5 h-1.5 rounded-full bg-current" />
                      <div className="w-1.5 h-1.5 rounded-full bg-current" />
                    </div>

                    <div className={`p-2 rounded-xl shrink-0 ${widget.isDark ? 'bg-slate-900 text-rose-300' : widget.color}`}>
                      {getWidgetIcon(widget.icon)}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-[12px] font-black text-slate-800 uppercase tracking-tight truncate">
                          {widget.label}
                        </h4>
                        {widget.isPinned && (
                          <span className="bg-indigo-100 text-indigo-700 text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <Pin size={8} /> Pinned
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 font-bold truncate mt-0.5">
                        {widget.bangla} • <span className="font-mono">{helper.value}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    {/* Touch device order switchers */}
                    <div className="flex items-center bg-slate-150/40 rounded-xl border border-slate-200/50 overflow-hidden divide-x divide-slate-200/55">
                      <button
                        type="button"
                        onClick={() => moveWidget(index, 'up')}
                        disabled={isFirst}
                        className={`p-2 transition-colors ${isFirst ? 'text-slate-250 cursor-not-allowed' : 'text-slate-500 hover:bg-slate-200/80'}`}
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveWidget(index, 'down')}
                        disabled={isLast}
                        className={`p-2 transition-colors ${isLast ? 'text-slate-250 cursor-not-allowed' : 'text-slate-500 hover:bg-slate-200/80'}`}
                      >
                        <ChevronDown size={14} />
                      </button>
                    </div>

                    {/* Pin/Unpin trigger button */}
                    <button
                      type="button"
                      onClick={() => toggleWidgetPin(widget.id)}
                      className={`flex items-center gap-1.5 text-[9.5px] font-black uppercase tracking-wider px-3 py-2 rounded-xl transition-all ${
                        widget.isPinned 
                          ? 'bg-indigo-650 hover:bg-indigo-750 text-white shadow-xs' 
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-650'
                      }`}
                    >
                      {widget.isPinned ? <PinOff size={11} /> : <Pin size={11} />}
                      <span>{widget.isPinned ? 'Unpin' : 'Pin'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-150 flex justify-end gap-3.5">
            <button
              onClick={() => {
                const defaults = [
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
                setWidgets(defaults);
                localStorage.setItem('cached_dashboard_pinned_widgets', JSON.stringify(defaults));
              }}
              className="px-4 py-2 border border-slate-200 text-slate-500 hover:text-slate-800 text-[10.5px] font-black uppercase tracking-wider rounded-xl hover:bg-slate-50 transition-colors"
            >
              রিসেট (Reset Layout)
            </button>
            <button
              onClick={() => setIsWidgetModalOpen(false)}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-950 text-white text-[10.5px] font-black uppercase tracking-wider rounded-xl transition-all shadow-xs"
            >
              সম্পূর্ণ (Close)
            </button>
          </div>
        </div>
      </Modal>

      {/* Direct Create Invoice Modal */}
      <Modal
        isOpen={activeModal === 'create_invoice_direct'}
        onClose={() => setActiveModal(null)}
        title="📝 নতুন ইনভয়েস তৈরি করুন (Create General Invoice)"
      >
        <form onSubmit={handleCreateDirectInvoiceSubmit} className="space-y-4 font-sans text-left">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1">Invoice Number</label>
              <input
                type="text"
                required
                value={directInvoiceNum}
                onChange={(e) => setDirectInvoiceNum(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1">Service / Invoice Type</label>
              <select
                value={directInvoiceType}
                onChange={(e) => setDirectInvoiceType(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-bold cursor-pointer"
              >
                <option value="Apps">Android Apps</option>
                <option value="Decoder">Decoder Package</option>
                <option value="Panel">Reseller Panel</option>
                <option value="User">User Account</option>
                <option value="Finance">General Service</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1">Customer Name (গ্রাহকের নাম)</label>
            <input
              type="text"
              required
              placeholder="e.g. Abdur Rahman"
              value={directInvoiceCustomerName}
              onChange={(e) => setDirectInvoiceCustomerName(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-semibold"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1">Country</label>
              <select
                value={directInvoiceCountryCode}
                onChange={(e) => setDirectInvoiceCountryCode(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-black cursor-pointer"
              >
                {localCountryCodes.map((c) => (
                  <option key={c.code} value={c.code}>{c.label} {c.code}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1">Phone Number</label>
              <input
                type="tel"
                required
                placeholder="17XXXXXXXX"
                value={directInvoicePhone}
                onChange={(e) => setDirectInvoicePhone(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-semibold font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1">Payment Method</label>
              <select
                value={directInvoicePaymentMethod}
                onChange={(e) => setDirectInvoicePaymentMethod(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-semibold cursor-pointer"
              >
                <option value="bKash">bKash</option>
                <option value="Nagad">Nagad</option>
                <option value="Rocket">Rocket</option>
                <option value="Upay">Upay</option>
                <option value="CellFin">CellFin</option>
                <option value="Bank">Bank Transfer</option>
                <option value="Binance">Binance (USDT)</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1">Transaction ID</label>
              <input
                type="text"
                placeholder="TXN-XXXXXX"
                value={directInvoiceTxnId}
                onChange={(e) => setDirectInvoiceTxnId(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-semibold font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1">Total Fee (টাকা)</label>
              <input
                type="number"
                required
                min="0"
                placeholder="0"
                value={directInvoiceAmount}
                onChange={(e) => handleDirectInvoiceAmountChange(e.target.value, 'amount')}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-bold font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1">Paid Amount (পরিশোধ)</label>
              <input
                type="number"
                required
                min="0"
                placeholder="0"
                value={directInvoicePaid}
                onChange={(e) => handleDirectInvoiceAmountChange(e.target.value, 'paid')}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-bold font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1">Due Amount (বকেয়া)</label>
              <input
                type="text"
                readOnly
                value={`৳${directInvoiceDue}`}
                className="w-full px-4 py-2.5 bg-slate-100 border border-slate-150 rounded-xl text-slate-650 cursor-not-allowed outline-none text-xs font-black font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1">Note / Description (মন্তব্য)</label>
            <textarea
              placeholder="e.g. Initial customer setup fee"
              value={directInvoiceNote}
              onChange={(e) => setDirectInvoiceNote(e.target.value)}
              rows={2}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-medium resize-none"
            />
          </div>

          <div className="pt-4 border-t border-slate-150 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="px-5 py-2 border border-slate-200 text-slate-500 hover:text-slate-800 text-[11px] font-black uppercase tracking-wider rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isDirectInvoiceSaving}
              className="px-5 py-2.5 bg-indigo-650 hover:bg-indigo-750 text-white text-[11px] font-black uppercase tracking-wider rounded-xl transition-all shadow-xs flex items-center gap-1.5 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
            >
              {isDirectInvoiceSaving ? 'তৈরি হচ্ছে...' : 'ইনভয়েস তৈরি করুন (Generate)'}
            </button>
          </div>
        </form>
      </Modal>

      {/* User Invoice Preview Modal */}
      {selectedUserInvoice && showInvoicePreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-[850px] w-full max-h-[90vh] flex flex-col my-8">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">ইনভয়েস বা বিল রশিদ (Invoice Statement)</h2>
                <p className="text-xs text-slate-500">অনুমোদিত বিল বা পরিশোধিত ওয়ালেট টপ-আপ রশিদ বিবরণী:</p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => handleUserDownloadInvoice(selectedUserInvoice)}
                  className="flex items-center gap-1 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700 active:scale-95 transition-all shadow-md shadow-indigo-100"
                >
                  <FileText size={13} />
                  ডাউনলোড করুন (PDF)
                </button>
                <button 
                  onClick={() => {
                    setShowInvoicePreviewModal(false);
                    setSelectedUserInvoice(null);
                  }}
                  className="p-2 text-slate-400 hover:text-slate-900 bg-slate-100 rounded-xl transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto p-4 md:p-6 bg-slate-50">
              <div id={`user-invoice-preview-${selectedUserInvoice.id}`} className="bg-white shadow-xl rounded-sm mx-auto p-2" style={{ width: '100%', maxWidth: '750px' }}>
                <InvoiceTemplate 
                  id={`invoice-${selectedUserInvoice.id}`}
                  invoice={selectedUserInvoice} 
                  settings={settings as CompanySettings} 
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User PDF Generation loading cover */}
      {isUserGeneratingPdf && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white p-7 rounded-2xl shadow-xl flex flex-col items-center">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-xs font-bold text-slate-900">PDF তৈরি হচ্ছে...</p>
            <p className="text-[10px] text-slate-400 mt-1">অনুগ্রহ করে একটু অপেক্ষা করুন</p>
          </div>
        </div>
      )}

      {/* Dynamic Payment Approval Success Notification Modal */}
      <Modal
        isOpen={approvedNotificationModal.isOpen}
        onClose={() => setApprovedNotificationModal(prev => ({ ...prev, isOpen: false }))}
        title="🎉 পেমেন্ট সফলভাবে অনুমোদিত হয়েছে! (Payment Approved)"
      >
        {approvedNotificationModal.invoice && (() => {
          const inv = approvedNotificationModal.invoice;
          const u = approvedNotificationModal.user;
          
          const defaultWa = 'আসসালামু আলাইকুম {name}!\n\nআপনার BDT {paid} মূল্যের পেমেন্ট আবেদনটি আমাদের সিস্টেমে সফলভাবে অনুমোদিত (Approved) হয়েছে। 🎉\n\n📌 বিবরণ:\n- পেমেন্ট উদ্দেশ্য: {purpose}\n- পেমেন্ট মাধ্যম: {method}\n- ট্রানজেকশন ID: {txn}\n- চলতি বকেয়া: ৳{due}\n\nআমাদের সেবা ব্যবহারের জন্য আপনাকে ধন্যবাদ!\n- {company}';
          const defaultSubject = '🎉 Payment Approved & Receipt Confirmed - {id}';
          const defaultBody = 'আসসালামু আলাইকুম {name}!\n\nআমরা আনন্দের সাথে জানাচ্ছি যে আপনার পেমেন্ট রিকোয়েস্টটি সফলভাবে অনুমোদিত হয়েছে এবং আপনার অ্যাকাউন্ট ব্যালেন্স সচল করা হয়েছে।\n\n📌 বিবরণ:\n- পেমেন্ট উদ্দেশ্য: {purpose}\n- পেমেন্ট মাধ্যম: {method}\n- ট্রানজেকশন ID: {txn}\n- পরিশোধকৃত মোট অ্যামাউন্ট: ৳{paid}\n- চলতি বকেয়া (Due Amount): ৳{due}\n- ইনভয়েস আইডি: INV-{id}\n\nযেকোনো সমস্যায় লাইভ চ্যাট অথবা কাস্টমার কেয়ারে যোগাযোগ করুন।\n\nধন্যবাদ,\n{company} টিম';

          const waTemplate = settings.paymentApproveWaTemplate || defaultWa;
          const subjectTemplate = settings.paymentApproveEmailSubjectTemplate || defaultSubject;
          const bodyTemplate = settings.paymentApproveEmailBodyTemplate || defaultBody;

          const shortId = inv.id ? inv.id.substring(0, 8).toUpperCase() : 'N/A';
          const currentDue = u ? (u.dueAmount ?? 0) : (inv.dueAmount ?? 0);
          const purpose = inv.type || 'Wallet Top-Up';
          const method = inv.paymentMethod || 'Bkash/Nagad';
          const txn = inv.transactionId || 'N/A';
          const companyName = settings.companyName || settings.sidebarTitle || 'Master Service';
          const customerName = inv.customerName || u?.name || 'গ্রাহক';

          const resolveFields = (text: string) => {
            return text
              .replace(/{name}/g, customerName)
              .replace(/{paid}/g, (inv.amount || 0).toLocaleString())
              .replace(/{due}/g, currentDue.toLocaleString())
              .replace(/{purpose}/g, purpose)
              .replace(/{id}/g, shortId)
              .replace(/{method}/g, method)
              .replace(/{txn}/g, txn)
              .replace(/{company}/g, companyName);
          };

          const finalWaMsg = resolveFields(waTemplate);
          const finalSubj = resolveFields(subjectTemplate);
          const finalBody = resolveFields(bodyTemplate);

          const cleanPhone = (phone: string) => {
            let cleaned = phone.replace(/[^\d]/g, '');
            if (cleaned.startsWith('880880')) {
              cleaned = cleaned.slice(3);
            } else if (cleaned.startsWith('8800')) {
              cleaned = '880' + cleaned.slice(4);
            }
            if (cleaned.startsWith('0') && cleaned.length === 11) {
              cleaned = '88' + cleaned;
            } else if (cleaned.length === 10 && /^[13456789]/.test(cleaned)) {
              cleaned = '880' + cleaned;
            }
            return cleaned;
          };

          const recipientNumber = inv.customerNumber || (inv as any).phone || u?.phone || '';
          const phoneForWa = cleanPhone(recipientNumber);
          const emailAddress = inv.customerEmail || (inv as any).email || u?.email || '';

          const waUrl = `https://api.whatsapp.com/send?phone=${phoneForWa}&text=${encodeURIComponent(finalWaMsg)}`;
          const waUrlBus = `https://wa.me/${phoneForWa}?text=${encodeURIComponent(finalWaMsg)}`;
          const mailtoUrl = `mailto:${emailAddress}?subject=${encodeURIComponent(finalSubj)}&body=${encodeURIComponent(finalBody)}`;

          return (
            <div className="space-y-5 text-left py-2">
              <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                  ✓
                </div>
                <div>
                  <h4 className="text-sm font-black text-emerald-800">পেমেন্ট সফলভাবে ভেরিফাই ও এপ্রুভ হয়েছে!</h4>
                  <p className="text-xs text-emerald-600 font-bold">ইনভয়েস: INV-{shortId} | অ্যামাউন্ট: ৳{(inv.amount || 0).toLocaleString()}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="border border-slate-150 rounded-xl overflow-hidden shadow-xs">
                  <div className="bg-slate-50 px-4 py-2 border-b border-slate-150 flex justify-between items-center">
                    <span className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <MessageSquare size={13} className="text-emerald-500" />
                      Option A: WhatsApp Notification
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">📞 {phoneForWa || 'No number'}</span>
                  </div>
                  <div className="p-4 bg-white space-y-3">
                    <div className="bg-slate-50 p-3 rounded-lg text-xs font-medium text-slate-700 whitespace-pre-line border border-slate-100 max-h-36 overflow-y-auto">
                      {finalWaMsg}
                    </div>
                    {phoneForWa ? (
                      <div className="grid grid-cols-2 gap-2">
                        <a 
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setApprovedNotificationModal(prev => ({ ...prev, isOpen: false }))}
                          className="flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 text-center cursor-pointer font-sans"
                        >
                          Send WhatsApp
                        </a>
                        <a 
                          href={waUrlBus}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setApprovedNotificationModal(prev => ({ ...prev, isOpen: false }))}
                          className="flex items-center justify-center gap-1.5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 text-center cursor-pointer font-sans"
                        >
                          WA Business
                        </a>
                      </div>
                    ) : (
                      <p className="text-[10px] text-rose-500 font-bold bg-rose-50 p-2 rounded-lg text-center">⚠️ কোনো মোবাইল নম্বর না থাকায় হোয়াটসঅ্যাপ করা যাচ্ছে না।</p>
                    )}
                  </div>
                </div>

                <div className="border border-slate-150 rounded-xl overflow-hidden shadow-xs">
                  <div className="bg-slate-50 px-4 py-2 border-b border-slate-150 flex justify-between items-center">
                    <span className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Mail size={13} className="text-indigo-500" />
                      Option B: Email Notification
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">✉️ {emailAddress || 'No email'}</span>
                  </div>
                  <div className="p-4 bg-white space-y-3">
                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="font-bold text-slate-400 uppercase text-[9px] tracking-widest block">Subject Preview</span>
                        <div className="bg-slate-50 p-2 rounded border border-slate-100 text-slate-700 font-bold">{finalSubj}</div>
                      </div>
                      <div>
                        <span className="font-bold text-slate-400 uppercase text-[9px] tracking-widest block">Message Preview</span>
                        <div className="bg-slate-50 p-3 rounded border border-slate-100 text-slate-700 whitespace-pre-line max-h-36 overflow-y-auto">{finalBody}</div>
                      </div>
                    </div>
                    {emailAddress ? (
                      <a 
                        href={mailtoUrl}
                        onClick={() => setApprovedNotificationModal(prev => ({ ...prev, isOpen: false }))}
                        className="flex items-center justify-center gap-1.5 w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 text-center cursor-pointer font-sans"
                      >
                        Send Confirmation Email
                      </a>
                    ) : (
                      <p className="text-[10px] text-amber-600 font-bold bg-amber-50 p-2 rounded-lg text-center">💡 এই গ্রাহকের ইমেইল এড্রেস প্রোফাইলে সেট করা নেই।</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => setApprovedNotificationModal(prev => ({ ...prev, isOpen: false }))}
                  className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer font-sans"
                >
                  Close (শেষ করুন)
                </button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Floating Quick Actions Button */}
      {false && isAdmin && (
        <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3 font-sans">
          {/* Backdrop Click Dismiss for Menu */}
          {isQuickActionsOpen && (
            <div 
              className="fixed inset-0 z-10 bg-transparent" 
              onClick={() => setIsQuickActionsOpen(false)}
            />
          )}

          {/* Expanded Menu Actions */}
          {isQuickActionsOpen && (
            <div className="relative z-20 flex flex-col gap-2 bg-slate-900 border border-slate-800 text-white shadow-2xl rounded-2xl p-3 min-w-[210px] animate-fade-in">
              <div className="px-2 py-1 border-b border-white/10 mb-1 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Quick Actions</span>
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping"></span>
              </div>

              {/* Action: Create Invoice */}
              <button
                type="button"
                onClick={() => {
                  setActiveModal('create_invoice_direct');
                  setIsQuickActionsOpen(false);
                }}
                className="flex items-center gap-3 w-full p-2 hover:bg-white/10 rounded-xl transition-all text-left group cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-300 group-hover:scale-105 transition-transform shrink-0">
                  <FileText size={14} />
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-tight text-white group-hover:text-indigo-300 transition-colors">Create Invoice</p>
                  <p className="text-[9.5px] text-slate-400 font-semibold truncate mt-0.5">নতুন ইনভয়েস তৈরি</p>
                </div>
              </button>

              {/* Action: Add User */}
              <button
                type="button"
                onClick={() => {
                  setActiveModal('user');
                  setIsQuickActionsOpen(false);
                }}
                className="flex items-center gap-3 w-full p-2 hover:bg-white/10 rounded-xl transition-all text-left group cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-violet-500/20 text-violet-300 group-hover:scale-105 transition-transform shrink-0">
                  <Users size={14} />
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-tight text-white group-hover:text-violet-300 transition-colors">Add User</p>
                  <p className="text-[9.5px] text-slate-400 font-semibold truncate mt-0.5">নতুন কাস্টমার অ্যাকাউন্ট</p>
                </div>
              </button>

              {/* Action: Register Decoder */}
              <button
                type="button"
                onClick={() => {
                  setActiveModal('decoder');
                  setIsQuickActionsOpen(false);
                }}
                className="flex items-center gap-3 w-full p-2 hover:bg-white/10 rounded-xl transition-all text-left group cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300 group-hover:scale-105 transition-transform shrink-0">
                  <Cpu size={14} />
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-tight text-white group-hover:text-emerald-300 transition-colors">Register Decoder</p>
                  <p className="text-[9.5px] text-slate-400 font-semibold truncate mt-0.5">ডিকোডার লাইসেন্স যুক্ত করুন</p>
                </div>
              </button>
            </div>
          )}

          {/* Primary Trigger Button */}
          <button
            type="button"
            onClick={() => setIsQuickActionsOpen(!isQuickActionsOpen)}
            className="relative z-20 flex items-center gap-2 px-4.5 py-3.5 bg-indigo-650 hover:bg-indigo-750 text-white rounded-full shadow-lg shadow-indigo-600/30 font-bold transition-all hover:scale-105 active:scale-95 group focus:outline-none cursor-pointer"
          >
            {/* Beautiful Custom Rotating Plus Icon */}
            <div className={`transition-transform duration-300 ${isQuickActionsOpen ? 'rotate-45' : ''}`}>
              <Plus size={18} className="stroke-[2.5]" />
            </div>
            
            <span className="text-xs font-black uppercase tracking-wider">Quick Actions</span>
          </button>
        </div>
      )}
    </div>
  );
}
