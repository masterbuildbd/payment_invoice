import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, Activity, FileText, Banknote, Check, X, Clock, CreditCard, CheckCircle, ShieldAlert, Sparkles, PhoneCall, Gift, RefreshCw, Users, Settings, Lock, Eye, EyeOff, Megaphone, Bell, Plus, ExternalLink, ChevronRight, BarChart3, Copy, MessageSquare, Search } from 'lucide-react';
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
  Cell
} from 'recharts';
import { Modal } from '../components/Modal';
import { CreateAppForm, CreateDecoderForm, CreatePanelForm, CreateUserForm } from '../components/CreateForms';
import { Invoice, Investment, ActivityLog, User } from '../types';
import { subscribeToInvoices, createDocument, subscribeToSettings, subscribeToCollection } from '../lib/storage';
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

type ModalType = 'app' | 'decoder' | 'panel' | 'user' | 'invoice' | null;

export function Dashboard({ onLogoutRequest, activeSubTab = 'dashboard' }: { onLogoutRequest: () => void; activeSubTab?: string }) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [settings, setSettings] = useState<Partial<CompanySettings>>({});

  const [currentUserData, setCurrentUserData] = useState<any>(null);
  const [totalUsersCount, setTotalUsersCount] = useState(0);

  // Customer top-up states
  const [topUpAmount, setTopUpAmount] = useState('');
  const [ticketPaidAmount, setTicketPaidAmount] = useState('');
  const [ticketDueAmount, setTicketDueAmount] = useState('');
  const [topUpMethod, setTopUpMethod] = useState('');
  const [topUpTxn, setTopUpTxn] = useState('');
  const [topUpPurpose, setTopUpPurpose] = useState('');
  const [topUpSuccess, setTopUpSuccess] = useState('');
  const [topUpError, setTopUpError] = useState('');
  const [isTopUpLoading, setIsTopUpLoading] = useState(false);

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
  const [myApps, setMyApps] = useState<any[]>([]);
  const [myDecoders, setMyDecoders] = useState<any[]>([]);
  const [myPanels, setMyPanels] = useState<any[]>([]);

  // Sync customer SMS logs
  const [allSmsLogs, setAllSmsLogs] = useState<any[]>([]);
  useEffect(() => {
    if (user) {
      const unsubSms = subscribeToCollection<any>('sms_logs', (list) => {
        setAllSmsLogs(list);
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

    const currentPassFromDb = currentUserData?.password || user?.password || '';

    if (currentPassFromDb && clientCurrentPassword !== currentPassFromDb) {
      setClientPassError('বর্তমান পাসওয়ার্ডটি সঠিক নয় (Current password is incorrect)');
      return;
    }

    if (clientNewPassword !== clientConfirmPassword) {
      setClientPassError('নতুন পাসওয়ার্ড দুটি মেলেনি (New passwords do not match)');
      return;
    }

    if (clientNewPassword.length < 6) {
      setClientPassError('পাসওয়ার্ডটি কমপক্ষে ৬ অক্ষরের হতে হবে (Password must be at least 6 characters)');
      return;
    }

    setIsClientPassSaving(true);
    try {
      const userId = currentUserData?.id || user?.id;
      if (!userId) {
        throw new Error('User session not found');
      }

      await updateDocument<User>('users', userId, { password: clientNewPassword });

      if (user) {
        const updatedLocalUser = { ...user, password: clientNewPassword };
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

  useEffect(() => {
    const unsubInvoices = subscribeToInvoices(setInvoices);
    const unsubInvestments = subscribeToCollection<Investment>('investments', setInvestments, 'date');
    const unsubActivities = subscribeToCollection<ActivityLog>('activities', (logs) => {
      setActivities(logs.slice(0, 10)); // Top 10 activities
    }, 'timestamp');
    const unsubSettings = subscribeToSettings(setSettings);

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
      const unsubscribe = subscribeToCollection<any>('users', (allUsers) => {
        const found = allUsers.find(u => u.username === user.username);
        if (found) {
          setCurrentUserData(found);
        } else {
          setCurrentUserData(user);
        }
        setTotalUsersCount(allUsers.length);
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
        setMyApps(list.filter(item => item.username === user.username));
      }, 'name');
      const unsubDecoders = subscribeToCollection<any>('decoders', (list) => {
        setMyDecoders(list.filter(item => item.username === user.username));
      }, 'name');
      const unsubPanels = subscribeToCollection<any>('panels', (list) => {
        setMyPanels(list.filter(item => item.username === user.username));
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
      setTopUpError('অনুগ্রহ করে পেমেন্ট করার সকল অপশন এবং প্রয়োজনীয় তথ্য সঠিকভাবে নির্বাচন/পূরণ করুন।');
      return;
    }
    setIsTopUpLoading(true);
    setTopUpError('');
    setTopUpSuccess('');

    try {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const invoiceDate = now.toISOString().split('T')[0];
      const fullDate = `${invoiceDate} ${timeStr}`;

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

      await createDocument('invoices', {
        customerName: currentUserData?.name || user?.name || 'Customer',
        username: currentUserData?.username || user?.username,
        amount: Number(topUpAmount) || 0,
        paidAmount: finalPaidAmount,
        dueAmount: finalDueAmount,
        status: 'pending',
        date: invoiceDate,
        createdAt: fullDate,
        phone: currentUserData?.phone || '',
        customerNumber: currentUserData?.phone ? `+88 ${currentUserData.phone}` : 'N/A',
        method: topUpMethod,
        paymentMethod: topUpMethod, // standard
        transactionId: topUpTxn,
        note: `পেমেন্ট উদ্দেশ্য: ${topUpPurpose}. কাস্টমার ওয়ালেট টপ-আপ রিকোয়েস্ট ভেরিফিকেশন${extraNoteSuffix}`,
        type: topUpPurpose, // standard type
        items: [{ description: `Purchase/Top-Up Purpose: ${topUpPurpose}`, quantity: 1, price: Number(topUpAmount) || 0 }], // standard schema items
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
        id: 'local-inv-' + Math.random().toString(36).substr(2, 9),
        customerName: currentUserData?.name || user?.name || 'Customer',
        username: currentUserData?.username || user?.username,
        amount: Number(topUpAmount) || 0,
        paidAmount: finalPaidAmount,
        dueAmount: finalDueAmount,
        status: 'pending',
        date: invoiceDate,
        createdAt: fullDate,
        phone: currentUserData?.phone || '',
        customerNumber: currentUserData?.phone ? `+88 ${currentUserData.phone}` : 'N/A',
        method: topUpMethod,
        paymentMethod: topUpMethod,
        type: topUpPurpose,
        transactionId: topUpTxn,
        note: `পেমেন্ট উদ্দেশ্য: ${topUpPurpose}. কাস্টমার ওয়ালেট টপ-আপ রিকোয়েস্ট ভেরিফিকেশন${extraNoteSuffix}`,
        items: [{ description: `Purchase/Top-Up Purpose: ${topUpPurpose}`, quantity: 1, price: Number(topUpAmount) || 0 }],
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

      setTopUpSuccess(`পেমেন্ট রিকোয়েস্ট ("${topUpPurpose}") এডমিনের কাছে জমা হয়েছে! এডমিন শীঘ্রই এটি ভেরিফাই করে ব্যালেন্স আপডেট করে দেবেন।`);
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
  useEffect(() => {
    if (user && invoices.length > 0) {
      // Exclude 'rejected' invoices from the customer invoices list view entirely
      setMyInvoices(invoices.filter(inv => inv.username === user.username && inv.status !== 'rejected'));
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
    
    const chartData = Array.from({ length: daysInMonth }, (_, idx) => {
      const dayNum = idx + 1;
      return {
        day: `${dayNum}`,
        revenue: dailyMap[dayNum],
        fullDate: `${yearStr}-${monthStr}-${String(dayNum).padStart(2, '0')}`
      };
    });

    const currentMonthTotal = Object.values(dailyMap).reduce((sum, val) => sum + val, 0);

    return {
      monthName: currentMonthName,
      monthNameBng: currentMonthNameBng,
      year: currentYear,
      data: chartData,
      total: currentMonthTotal
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

  if (!isAdmin) {
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

    const totalFee = Number(currentUserData?.price) || 0;
    // Show only approved invoice balance on the dashboard
    const paidFees = approvedInvoicesBalance;
    const dueFees = Math.max(0, totalFee - paidFees);

    // States for Selected Payment Account Channel Viewer
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [selectedAccountTab, setSelectedAccountTab] = useState<'bKash' | 'Nagad' | 'Bank' | 'Binance' | 'PayPal'>('bKash');

    const activeProviders = React.useMemo(() => {
      return [
        { key: 'bKash', enabled: settings?.bkashEnabled !== false },
        { key: 'Nagad', enabled: settings?.nagadEnabled !== false },
        { key: 'Bank', enabled: settings?.bankEnabled !== false },
        { key: 'Binance', enabled: settings?.binanceEnabled !== false },
        { key: 'PayPal', enabled: settings?.paypalEnabled !== false },
      ].filter(p => p.enabled).map(p => p.key);
    }, [settings]);

    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      if (activeProviders.length > 0 && !activeProviders.includes(selectedAccountTab)) {
        setSelectedAccountTab(activeProviders[0] as any);
      }
    }, [activeProviders, selectedAccountTab]);

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [copiedText, setCopiedText] = useState<string | null>(null);
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
            {/* USER PROFILE & SUMMARY STATS BENTO CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Profile Card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.015)] flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-3.5 border-b border-slate-100 pb-2 flex items-center gap-2">
                    <Users size={15} className="text-indigo-600" />
                    গ্রাহক প্রোফাইল তথ্য (Customer Profile)
                  </h3>
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center gap-3 text-xs border-b border-slate-100 pb-2">
                      <span className="text-slate-400 font-bold shrink-0">গ্রাহকের নাম (Name):</span>
                      <span className="text-slate-850 font-black truncate text-right">{currentUserData?.name || user?.name || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center gap-3 text-xs border-b border-slate-100 pb-2">
                      <span className="text-slate-400 font-bold shrink-0">ইউজারনেম (Username):</span>
                      <span className="text-slate-650 font-black truncate text-right">@{currentUserData?.username || user?.username || 'user'}</span>
                    </div>
                    <div className="flex justify-between items-center gap-3 text-xs border-b border-slate-100 pb-2">
                      <span className="text-slate-400 font-bold shrink-0">মোবাইল নাম্বার (Mobile):</span>
                      <span className="text-slate-850 font-mono font-black shrink-0 text-right">{currentUserData?.phone || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center gap-3 text-xs border-b border-slate-100 pb-2">
                      <span className="text-slate-400 font-bold shrink-0">ইমেইল (Email):</span>
                      <span className="text-slate-850 font-mono font-black truncate text-right text-[10.5px]">{currentUserData?.email || user?.email || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center gap-3 text-xs pb-0.5">
                      <span className="text-slate-400 font-bold shrink-0">জয়েন ডেট (Joined):</span>
                      <span className="text-indigo-650 font-extrabold bg-indigo-50 px-2 py-0.5 rounded flex items-center gap-1 text-[10px] font-sans border border-indigo-100/30 shrink-0 text-right">
                        <Clock size={11} />
                        {joinedDateFormatted}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Counters Card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.015)]">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-3.5 border-b border-slate-100 pb-2 flex items-center gap-2">
                  <FileText size={15} className="text-indigo-600" />
                  পেমেন্ট রিকোয়েস্ট ট্র্যাকিং (Invoice Live Counter)
                </h3>
                <div className="grid grid-cols-3 gap-2 sm:gap-2.5 animate-fade-in">
                  {/* Approved */}
                  <div className="bg-emerald-50/40 border border-emerald-100/70 p-2 sm:p-3 rounded-xl text-center">
                    <div className="text-emerald-600 font-black text-sm sm:text-base font-mono">{approvedCount}</div>
                    <div className="text-[8px] sm:text-[9px] text-emerald-700 font-black uppercase mt-1">অনুমোদিত (Approved)</div>
                  </div>
                  {/* Pending */}
                  <div className="bg-amber-50/40 border border-amber-100/70 p-2 sm:p-3 rounded-xl text-center">
                    <div className="text-amber-600 font-black text-sm sm:text-base font-mono">{pendingCount}</div>
                    <div className="text-[8px] sm:text-[9px] text-amber-700 font-black uppercase mt-1">মূলতুবি (Pending)</div>
                  </div>
                  {/* Rejected */}
                  <div className="bg-rose-50/20 border border-rose-100/70 p-2 sm:p-3 rounded-xl text-center">
                    <div className="text-rose-650 font-black text-sm sm:text-base font-mono">{rejectedCount}</div>
                    <div className="text-[8px] sm:text-[9px] text-rose-600 font-black uppercase mt-1">প্রত্যাখ্যাত (Rejected)</div>
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 mt-3 text-center border-t border-slate-100 pt-2 font-medium">
                  * এডমিন কর্তৃক রিভিউ সম্পন্ন হলে ব্যালেন্স ও স্ট্যাটাস স্বয়ংক্রিয়ভাবে আপডেট হয়।
                </div>
              </div>
            </div>

            {/* LEDGER TRACKING WIDGET */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.02)] relative overflow-hidden group"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">নির্ধারিত মোট চার্জ (Subscription Fee)</p>
                    <h3 className="text-2xl font-black text-slate-800 mt-1 font-mono">৳{totalFee.toLocaleString()}</h3>
                    <span className="text-[10px] text-slate-400 mt-2 font-bold block">ধার্যকৃত বার্ষিক বা মাসিক সেবামূল্য</span>
                  </div>
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Wallet size={18} />
                  </div>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.05 }}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.02)] relative overflow-hidden group"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">মোট পরিশোধিত ব্যালেন্স (Paid Amount)</p>
                    <h3 className="text-2xl font-black text-emerald-600 mt-1 font-mono">৳{paidFees.toLocaleString()}</h3>
                    <span className="text-[10px] text-emerald-600 mt-2 font-bold flex items-center gap-1">
                      <CheckCircle size={10} />
                      অ্যাডমিন কর্তৃক নিশ্চিতকৃত পেমেন্ট
                    </span>
                  </div>
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                    <Banknote size={15} />
                  </div>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className={`bg-white p-6 rounded-2xl border ${dueFees > 0 ? 'border-rose-100 shadow-rose-50/50' : 'border-slate-200'} shadow-[0_4px_20px_rgba(0,0,0,0.02)] relative overflow-hidden group`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">বাকি বা বকেয়া মূল্য (Current Due)</p>
                    <h3 className={`text-2xl font-black ${dueFees > 0 ? 'text-rose-600 animate-pulse' : 'text-slate-500'} mt-1 font-mono`}>৳{dueFees.toLocaleString()}</h3>
                    <span className={`text-[10px] ${dueFees > 0 ? 'text-rose-600' : 'text-slate-400'} font-bold flex items-center gap-1 mt-2`}>
                      {dueFees > 0 ? <ShieldAlert size={10} /> : <CheckCircle size={10} />}
                      {dueFees > 0 ? 'অনুগ্রহ করে বাকি পেমেন্ট সম্পন্ন করুন' : 'আপনার চমৎকার লেনদেনের জন্য ধন্যবাদ'}
                    </span>
                  </div>
                  <div className={`p-3 ${dueFees > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-600'} rounded-xl`}>
                    <TrendingDown size={15} />
                  </div>
                </div>
              </motion.div>
            </div>

            {/* My Subscribed Services / Apps */}
            <div className="bg-white border border-slate-200 rounded-[1.5rem] p-6 shadow-xs">
              <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-3 flex justify-between items-center">
                <span>আমার সক্রিয় এপ্লিকেশন লাইসেন্স (My Subscribed Apps)</span>
                <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-[9px] font-mono">Total {myApps.length}</span>
              </h2>

              {myApps.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {myApps.map(app => (
                    <div key={app.id} className="p-4 border border-slate-100 hover:border-indigo-100 rounded-2xl bg-slate-50/50 transition-all flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">App License</span>
                          <span className="text-[9px] bg-emerald-50 text-emerald-700 px-1.5 rounded-full font-black uppercase">Active</span>
                        </div>
                        <h4 className="text-[13px] font-black text-slate-800 mt-1 uppercase tracking-tight">{app.name}</h4>
                        <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">{app.note || 'No special requirements listed.'}</p>
                      </div>
                      <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-slate-100 text-[10px]">
                        <span className="font-bold text-slate-400">License Cost:</span>
                        <span className="font-black text-indigo-600">৳{(app.price || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 border border-dashed border-slate-200 rounded-2xl bg-slate-50">
                  <p className="text-xs text-slate-400 italic">আপনার কোন এপ্লিকেশন লাইসেন্স তালিকাভুক্ত নেই।</p>
                </div>
              )}
            </div>

            {/* Quick Helper Widget */}
            <div className="p-6 bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-indigo-400">কোন সহায়তার প্রয়োজন?</h4>
                <p className="text-xs text-slate-300 mt-1 max-w-lg">পেমেন্ট রিকোয়েস্ট জমা দেওয়ার পর বা কোনো সার্ভিস চালু করতে সরাসরি আমাদের হেল্পলাইন নাম্বারে হোয়াটসঅ্যাপ বা কল করতে পারেন।</p>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl text-xs font-bold font-mono border border-white/10 shrink-0">
                <PhoneCall size={14} className="text-indigo-400" />
                <span>{settings.phone || '01718070273'}</span>
              </div>
            </div>
          </div>
        )}

        {/* 2. INVOICE SHOW SUB-TAB: ONLY FOR THIS LOGGED-IN SPECIFIC CLIENT INVOICES */}
        {activeSubTab === 'invoices' && (
          <div className="bg-white border border-slate-200 rounded-[1.5rem] p-6 shadow-xs animate-fade-in">
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5 border-b border-slate-100 pb-3">
              <FileText size={16} className="text-indigo-600" />
              আমার ইনভয়েস পোর্টাল (Invoices Show Screen)
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              পদ্ধতিগত স্বচ্ছতার জন্য নিচে শুধুমাত্র আপনার অ্যাকাউন্টের ইনভয়েসসমূহ দেখানো হচ্ছে। এডমিন কর্তৃক আপনার আইডিতে তৈরি কৃত সকল বিল ও রশিদ লাইভ ট্র্যাক করুন।
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myInvoices.length > 0 ? (
                myInvoices.map((inv) => (
                  <div key={inv.id} className="p-5 border border-slate-150 hover:border-indigo-150 hover:shadow-sm rounded-2xl bg-slate-50/30 transition-all flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-mono font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                          #INV-{inv.id?.substring(0, 8).toUpperCase() || inv.id || 'N/A'}
                        </span>
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${
                          inv.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                          inv.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                          'bg-red-50 text-red-700 border-red-100'
                        }`}>
                          {inv.status}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-[14px] font-black text-slate-800">{inv.customerName}</h4>
                        <div className="text-[11px] text-slate-500">লেনদেন মাধ্যম: <strong className="text-slate-800">{inv.method || 'Cash / Direct'}</strong></div>
                        {inv.transactionId && (
                          <div className="text-[11px] text-slate-500">ট্রানজেকশন ID: <strong className="text-indigo-600 font-mono select-all uppercase">{inv.transactionId}</strong></div>
                        )}
                        {inv.note && (
                          <p className="text-[10px] text-slate-400 mt-2 bg-slate-50 p-2 rounded-lg italic">নোট: {inv.note}</p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-medium font-mono">Date: {inv.date || 'N/A'}</span>
                      <span className="font-black text-indigo-600 text-[14px] font-mono">৳{(inv.amount || 0).toLocaleString()}</span>
                    </div>

                    {/* View Invoice button */}
                    <button
                      onClick={() => handleUserPreviewInvoice(inv)}
                      className="mt-3 w-full bg-slate-100 hover:bg-slate-200 border border-slate-200 hover:border-slate-300 text-[10px] py-2 rounded-xl font-bold flex items-center justify-center gap-1 transition-all text-slate-700 active:scale-[0.98]"
                    >
                      <FileText size={12} />
                      রশিদ ও ইনভয়েস দেখুন (View Invoice)
                    </button>
                  </div>
                ))
              ) : (
                <div className="col-span-1 md:col-span-2 text-center py-12 border border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                  <p className="text-xs text-slate-400 italic">কোনো ইনভয়েস বিল ডাটা পাওয়া যায়নি। এডমিন কোনো ইনভয়েস তৈরি করলে তা এখানে অটোমেটিক রিয়েলটাইমে শো করবে।</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. ACCOUNT OPTIONS SUB-TAB: SHOW BKASH, NAGAD, BANK ACCOUNT, BINANCE, PAYPAL DETAILS */}
        {activeSubTab === 'account' && (() => {
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

          return (
            <div className="bg-white border border-slate-200 rounded-[1.5rem] p-6 shadow-xs animate-fade-in">
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5 border-b border-slate-100 pb-3">
                <Wallet size={16} className="text-indigo-600 animate-bounce" />
                কোম্পানির অফিশিয়াল পেমেন্ট গেটওয়ে এবং অ্যাকাউন্ট অপশন (Active Gateways)
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed mb-6">
                নিচে কোম্পানির সচল লেনদেনের চ্যানেলসমূহ দেওয়া হলো। নির্দেশনা অনুযায়ী যেকোনো পেমেন্ট বা সেবামূল্য নিশ্চিত করতে ডানপাশে অ্যাকাউন্ট বিবরণী কপি করে নিন:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Payment Methods Select Buttons */}
                <div className="md:col-span-4 space-y-2.5">
                  <span className="text-[10px] font-black tracking-widest uppercase text-slate-400 px-1 block mb-1">গেটওয়ে অপশন সিলেক্ট করুন </span>
                  {[
                    { key: 'bKash', label: 'bKash (বিকাশ)', logo: bKashLogo, color: 'bg-rose-50/80 text-rose-700 border-rose-200/70', enabled: settings?.bkashEnabled !== false },
                    { key: 'Nagad', label: 'Nagad (নগদ)', logo: nagadLogo, color: 'bg-orange-50/80 text-orange-700 border-orange-200/70', enabled: settings?.nagadEnabled !== false },
                    { key: 'Bank', label: 'Bank Account (ব্যাংক)', logo: bankLogo, color: 'bg-blue-50/80 text-blue-700 border-blue-200/70', enabled: settings?.bankEnabled !== false },
                    { key: 'Binance', label: 'Binance Pay ID (বাইনান্স)', logo: binanceLogo, color: 'bg-yellow-50/40 text-yellow-850 border-yellow-250', enabled: settings?.binanceEnabled !== false },
                    { key: 'PayPal', label: 'PayPal Gateway (পেপ্যাল)', logo: paypalLogo, color: 'bg-indigo-50/80 text-indigo-700 border-indigo-200/70', enabled: settings?.paypalEnabled !== false },
                  ].filter(provider => provider.enabled).map(provider => (
                    <button
                      key={provider.key}
                      onClick={() => setSelectedAccountTab(provider.key as any)}
                      className={`w-full flex items-center gap-3 p-3 rounded-2xl border text-xs font-bold transition-all ${
                        selectedAccountTab === provider.key 
                          ? `${provider.color} ring-2 ring-indigo-500/20 scale-[1.02] shadow-sm`
                          : 'bg-white text-slate-700 border-slate-200/80 hover:bg-slate-50'
                      }`}
                    >
                      {provider.logo}
                      <div className="text-left flex-1">
                        <div className="font-extrabold text-slate-800 text-xs">{provider.label}</div>
                        <div className="text-[9px] text-slate-450 font-bold uppercase font-mono tracking-wider">Active Channel</div>
                      </div>
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                    </button>
                  ))}
                </div>

                {/* Accounts Detail Display Details Pane */}
                <div className="md:col-span-8">
                  <div className="bg-slate-900 text-white rounded-[1.6rem] p-6 border border-slate-800 shadow-xl h-full flex flex-col justify-between relative overflow-hidden min-h-[300px]">
                    
                    {/* Glowing Accent Orbs */}
                    <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl"></div>
                    <div className="absolute left-1/3 bottom-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl"></div>

                    <div className="relative z-10 space-y-4">
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
                            প্রদত্ত বিকাশ পার্সোনাল নাম্বারে সেবামূল সেন্ড মানি (Send Money) সম্পন্ন করুন। সেন্ডিং সম্পন্ন হলে প্রাপ্ত ট্রানজেকশন ID অথবা পেমেন্ট ট্রানজেকশন স্ক্রিনশট বা লাস্ট ডিজিট দিয়ে পেমেন্ট অপশন থেকে রিপোর্ট জমা দিন।
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

                      {selectedAccountTab === 'Bank' && (
                        <div className="space-y-4 animate-fade-in">
                          <div className="flex justify-between items-center border-b border-white/10 pb-3">
                            <span className="text-xs font-black uppercase text-indigo-400 tracking-wider flex items-center gap-2">
                              {bankLogo} Commercial Bank Credentials
                            </span>
                            <span className="text-[9px] bg-emerald-500 text-white font-mono font-black px-2 py-0.5 rounded-full uppercase">Verified Direct</span>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-1 text-xs text-slate-200">
                            <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                              <strong className="text-indigo-300 block uppercase text-[9px] tracking-wider font-mono">Bank Name</strong>
                              <span className="font-extrabold text-sm">{settings.bankName || "BRAC Bank Limited"}</span>
                            </div>
                            <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                              <strong className="text-indigo-300 block uppercase text-[9px] tracking-wider font-mono">Account Holder</strong>
                              <span className="font-extrabold text-sm">{settings.sidebarTitle || "Master Digital Group"}</span>
                            </div>
                            <div className="bg-white/5 p-3.5 rounded-xl border border-white/5 sm:col-span-2 flex items-center justify-between">
                              <div>
                                <strong className="text-indigo-300 block uppercase text-[9px] tracking-wider font-mono">Account Number</strong>
                                <span className="font-mono font-black bg-white/10 px-2 py-1 rounded select-all tracking-wider text-base text-white">{settings.accountNo || "15012019487120398"}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleCopyText(settings.accountNo || "15012019487120398")}
                                className="flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white font-mono font-bold text-[10px] px-2.5 py-1.5 rounded-lg border border-white/5 transition-all"
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
                              <strong className="text-indigo-300 block uppercase text-[9px] tracking-wider font-mono">Branch Name</strong>
                              <span className="font-extrabold text-sm">{settings.branchName || "Dhaka Main Branch"}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedAccountTab === 'Binance' && (
                        <div className="space-y-4 animate-fade-in">
                          <div className="flex justify-between items-center border-b border-white/10 pb-3">
                            <span className="text-xs font-black uppercase text-yellow-500 tracking-wider flex items-center gap-2">
                              {binanceLogo} Binance Crypto Pay ID
                            </span>
                            <span className="text-[9px] bg-yellow-450 text-slate-900 font-mono font-black px-2 py-0.5 rounded-full uppercase">Instant Auto</span>
                          </div>
                          <div className="space-y-3">
                            <div className="bg-white/5 p-3.5 rounded-xl border border-white/5 flex items-center justify-between">
                              <div>
                                <span className="text-[10px] text-yellow-400 font-bold uppercase block tracking-wider font-mono">Binance Pay ID (ইউজার আইডি)</span>
                                <div className="text-2xl font-mono font-black text-white select-all">{settings.binancePayId || '542901726'}</div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleCopyText(settings.binancePayId || '542901726')}
                                className="flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white font-mono font-bold text-[10px] px-2.5 py-1 rounded-lg border border-white/5 transition-all"
                              >
                                {copiedText === (settings.binancePayId || '542901726') ? (
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
                            
                            <div className="bg-white/5 p-3.5 rounded-xl border border-white/5 space-y-1.5 flex flex-col">
                              <div><strong className="text-yellow-400 text-[10px] tracking-wider uppercase font-mono Block">USDT Wallet (TRC20 Address)</strong></div>
                              <div className="flex items-center justify-between gap-4">
                                <code className="text-indigo-200 text-[11px] font-mono font-bold break-all block select-all flex-1">{settings.binanceUsdtAddress || 'TYm7A8WqyY4fFsh9SgH8eD2c1T9Z9sK8nQ'}</code>
                                <button
                                  type="button"
                                  onClick={() => handleCopyText(settings.binanceUsdtAddress || 'TYm7A8WqyY4fFsh9SgH8eD2c1T9Z9sK8nQ')}
                                  className="flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white font-mono font-bold text-[10px] px-2.5 py-1 rounded-lg border border-white/5 transition-all whitespace-nowrap"
                                >
                                  {copiedText === (settings.binanceUsdtAddress || 'TYm7A8WqyY4fFsh9SgH8eD2c1T9Z9sK8nQ') ? (
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
                            </div>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            বাইনান্স পে আইডি এর মাধ্যমে অথবা TRC20 ওয়ালেটে ফান্ড ডেপোজিট করে লেনদেনের প্রাপ্ত ট্রানজেকশন ID পেমেন্ট অপশন ফর্ম থেকে সাবমিট করুন। পেমেন্ট ৫ মিনিটের মধ্যে ভেরিফাই করা হবে।
                          </p>
                        </div>
                      )}

                      {selectedAccountTab === 'PayPal' && (
                        <div className="space-y-4 animate-fade-in">
                          <div className="flex justify-between items-center border-b border-white/10 pb-3">
                            <span className="text-xs font-black uppercase text-indigo-400 tracking-wider flex items-center gap-2">
                              {paypalLogo} Global PayPal Transfer
                            </span>
                            <span className="text-[9px] bg-indigo-600 text-white font-mono font-black px-2 py-0.5 rounded-full uppercase">Active Channel</span>
                          </div>
                          <div className="space-y-1 bg-white/5 p-4 rounded-xl border border-white/5">
                            <span className="text-[10px] text-indigo-300 font-bold uppercase block tracking-wider font-mono">PayPal Receiver Email</span>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-1">
                              <div className="text-xl sm:text-2xl font-mono font-black text-white select-all">{settings.paypalEmail || 'masterbuild14@gmail.com'}</div>
                              <button
                                type="button"
                                onClick={() => handleCopyText(settings.paypalEmail || 'masterbuild14@gmail.com')}
                                className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 select-none text-white font-mono font-bold text-[10px] px-3.5 py-1.5 rounded-lg border border-white/5 transition-all self-start sm:self-center"
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
                            <span className="inline-block bg-indigo-600 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full mt-3 uppercase tracking-wider">
                              Friends & Family (ব্যক্তিগত বা ফ্রেন্ডস পেমেন্ট)
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-relaxed pt-2">
                            PayPal ইমেইল অ্যাড্রেসে ফান্ড ট্রান্সফার সম্পন্ন করুন। সফল ফান্ড প্রেরণের পর ট্রানজেকশন রশিদ পেমেন্ট ফর্ম এ লিখে রিকোয়েস্ট পাঠান।
                          </p>
                        </div>
                      )}
                    </div>
                    {/* Decorative Background Glows */}
                    <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* 4. PAYMENT OPTIONS SUB-TAB: FORM FOR SENDER PAYMENT INSTRUCTIONS INPUT */}
        {activeSubTab === 'payment' && (
          <div className="bg-white border border-slate-200 rounded-[1.5rem] p-6 shadow-xs relative animate-fade-in">
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5 border-b border-slate-100 pb-3">
              <CreditCard size={16} className="text-indigo-600" />
              পেমেন্ট রিপোর্টিং অপশন (Submit Payment Ticket Form)
            </h2>

            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              টাকা প্রেরণের পর পেমেন্ট রশিদ ভেরিফিকেশন ফর্মে আপনার পরিশোধিত মাধ্যম, অ্যামাউন্ট এবং লাস্ট নম্বর বা ট্রানজেকশন আইডি প্রদান করে ব্যালেন্স রিকোয়েস্ট তৈরি করুন:
            </p>

            {topUpSuccess && (
              <div className="bg-emerald-50 text-emerald-700 text-xs font-bold p-4 rounded-xl border border-emerald-200/60 mb-6 animate-fade-in flex items-start gap-2 leading-relaxed">
                <CheckCircle size={18} className="shrink-0 text-emerald-500 mt-0.5" />
                <span>{topUpSuccess}</span>
              </div>
            )}

            {topUpError && (
              <div className="bg-rose-50 text-rose-600 text-xs font-bold p-4 rounded-xl border border-rose-200/60 mb-6 animate-fade-in flex items-start gap-2">
                <ShieldAlert size={18} className="shrink-0 text-rose-500 mt-0.5" />
                <span>{topUpError}</span>
              </div>
            )}

            <form onSubmit={handleTopUpSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">পেমেন্ট উদ্দেশ্য (Purpose / Product) *</label>
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-3.5 text-xs font-bold text-slate-700 font-sans focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
                    required
                  >
                    <option value="">-- উদ্দেশ্য নির্বাচন করুন (Select Purpose) * --</option>
                    <option value="Wallet Top-Up">Wallet Top-Up (ওয়ালেট ব্যালেন্স টপ-আপ)</option>
                    <option value="Android App Purchase">Android App (অ্যান্ড্রয়েড অ্যাপ ক্রয়)</option>
                    <option value="Reseller Panel Purchase">Reseller Panel (রিসেলার প্যানেল ক্রয়)</option>
                    <option value="Decoder License Purchase">Decoder License (ডিকোডার লাইসেন্স ক্রয়)</option>
                    <option value="Binance $ Purchase">Binance $ Purchase (বাইনেন্স ডলার ক্রয়)</option>
                    <option value="Redotpay $ Purchase">Redotpay $ Purchase (রেডটপে ডলার ক্রয়)</option>
                    <option value="Facebook Boost">Facebook Boost (ফেসবুক বুস্ট)</option>
                    <option value="Banner Making">Banner Making (ব্যানার মেকিং)</option>
                    <option value="Logo Making">Logo Making (লোগো মেকিং)</option>
                    <option value="Annual / Server Charge">Annual Charge (অন্যান্য বা বার্ষিক চার্জ)</option>
                    <option value="Others / Etc">Others / Etc (অন্যান্য সার্ভিস বা অন্যান্য)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">পেমেন্ট মাধ্যম (Payment Method) *</label>
                  <select 
                    value={topUpMethod} 
                    onChange={(e) => setTopUpMethod(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-3.5 text-xs font-bold text-slate-700 font-sans focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
                    required
                  >
                    <option value="">-- মাধ্যম নির্বাচন করুন (Select Method) * --</option>
                    <option value="bKash">bKash (বিকাশ)</option>
                    <option value="Nagad">Nagad (নগদ)</option>
                    <option value="Rocket">Rocket (রকেট)</option>
                    <option value="Bank Account">Bank (ব্যাংক ট্রান্সফার)</option>
                    <option value="Binance">Binance (বাইনান্স)</option>
                    <option value="PayPal">PayPal (পেপ্যাল)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">পরিশোধিত আমাউন্ট (Amount / USD) *</label>
                  <div className="relative shadow-xs rounded-xl overflow-hidden border border-slate-200 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/5 transition-all bg-slate-50 focus-within:bg-white">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs font-mono">৳</span>
                    <input 
                      type="number" 
                      value={topUpAmount}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTopUpAmount(val);
                        const amt = Number(val) || 0;
                        const paid = Number(ticketPaidAmount) || 0;
                        setTicketDueAmount(Math.max(0, amt - paid).toString());
                      }}
                      placeholder="0.00"
                      className="w-full pl-8 pr-3 py-3 bg-transparent outline-none text-xs font-black text-slate-900 font-mono"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1.5">পেইড আমাউন্ট (Paid Amount)</label>
                  <div className="relative shadow-xs rounded-xl overflow-hidden border border-slate-200 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/5 transition-all bg-slate-50 focus-within:bg-white">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-400 font-bold text-xs font-mono">৳</span>
                    <input 
                      type="number" 
                      value={ticketPaidAmount}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTicketPaidAmount(val);
                        const amt = Number(topUpAmount) || 0;
                        const paid = Number(val) || 0;
                        setTicketDueAmount(Math.max(0, amt - paid).toString());
                      }}
                      placeholder="0.00"
                      className="w-full pl-8 pr-3 py-3 bg-transparent outline-none text-xs font-black text-emerald-600 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1.5">বকেয়া আমাউন্ট (Due Amount)</label>
                  <div className="relative shadow-xs rounded-xl overflow-hidden border border-slate-200 focus-within:border-rose-500 focus-within:ring-4 focus-within:ring-rose-500/5 transition-all bg-slate-50 focus-within:bg-white">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-rose-400 font-bold text-xs font-mono">৳</span>
                    <input 
                      type="number" 
                      value={ticketDueAmount}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTicketDueAmount(val);
                        const amt = Number(topUpAmount) || 0;
                        const due = Number(val) || 0;
                        setTicketPaidAmount(Math.max(0, amt - due).toString());
                      }}
                      placeholder="0.00"
                      className="w-full pl-8 pr-3 py-3 bg-transparent outline-none text-xs font-black text-rose-600 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">ট্রানজেকশন ID বা লাস্ট নাম্বার (Txn/Last digits) *</label>
                  <input 
                    type="text" 
                    value={topUpTxn}
                    onChange={(e) => setTopUpTxn(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-3.5 text-xs font-mono font-bold text-slate-900 placeholder:text-slate-350 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
                    placeholder="TRX123456789 or Last Number"
                    required
                  />
                </div>
              </div>

              {topUpPurpose === 'Android App Purchase' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl animate-fade-in">
                  <div>
                    <label className="block text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1.5 font-sans">অ্যাপের নাম (Apps Name) *</label>
                    <input 
                      type="text" 
                      value={ticketAppName}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTicketAppName(val);
                        const cleanName = val
                          .toLowerCase()
                          .trim()
                          .replace(/[^a-z0-9]/g, '')
                          .substring(0, 30);
                        setTicketAppPackageName(`dev.masterbuild.${cleanName || 'app'}`);
                      }}
                      className="w-full bg-white border border-indigo-200 rounded-xl py-3 px-3.5 text-xs font-bold text-slate-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
                      placeholder="e.g. Master Build App"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1.5 font-sans">প্যাকেজ নাম (Package Name) *</label>
                    <input 
                      type="text" 
                      value={ticketAppPackageName}
                      onChange={(e) => setTicketAppPackageName(e.target.value)}
                      className="w-full bg-white border border-indigo-200 rounded-xl py-3 px-3.5 text-xs font-mono font-bold text-slate-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
                      placeholder="dev.masterbuild."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1.5 font-sans">অ্যাপ প্রোটোকল (Apps Protocol) *</label>
                    <select 
                      value={ticketAppProtocol} 
                      onChange={(e) => setTicketAppProtocol(e.target.value)}
                      className="w-full bg-white border border-indigo-200 rounded-xl py-3 px-3.5 text-xs font-bold text-slate-700 font-sans focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
                      required
                    >
                      <option value="">-- প্রোটোকল সিলেক্ট করুন (Select Protocol) * --</option>
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i+1} value={`Protocol ${i+1}`}>Protocol {i+1}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1.5 font-sans">সিকিউরিটি মান (Apps Quality) *</label>
                    <select 
                      value={ticketAppQuality} 
                      onChange={(e) => setTicketAppQuality(e.target.value)}
                      className="w-full bg-white border border-indigo-200 rounded-xl py-3 px-3.5 text-xs font-bold text-slate-700 font-sans focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
                      required
                    >
                      <option value="">-- সিকিউরিটি সিলেক্ট করুন (Select Security) * --</option>
                      <option value="Normal security">Normal security</option>
                      <option value="medium security">medium security</option>
                      <option value="high security">high security</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1.5 font-sans">অ্যাপের ধরণ (Apps Type) *</label>
                    <select 
                      value={ticketAppType} 
                      onChange={(e) => setTicketAppType(e.target.value)}
                      className="w-full bg-white border border-indigo-200 rounded-xl py-3 px-3.5 text-xs font-bold text-slate-700 font-sans focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
                      required
                    >
                      <option value="">-- অ্যাপ ধরণ সিলেক্ট করুন (Select Type) * --</option>
                      <option value="Paid apps">Paid apps</option>
                      <option value="Free apps">Free apps</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1.5 font-sans">কাজের ধরন (App Work Type) *</label>
                    <select 
                      value={ticketAppWorkType} 
                      onChange={(e) => setTicketAppWorkType(e.target.value)}
                      className="w-full bg-white border border-indigo-200 rounded-xl py-3 px-3.5 text-xs font-bold text-slate-700 font-sans focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
                      required
                    >
                      <option value="">-- কাজের ধরণ সিলেক্ট করুন (Select Work Type) * --</option>
                      <option value="New app">New app (নতুন অ্যাপ)</option>
                      <option value="Old app">Old app (পুরানো অ্যাপ)</option>
                      <option value="Update app">Update app (আপডেট অ্যাপ)</option>
                    </select>
                  </div>
                </div>
              )}

              {topUpPurpose === 'Reseller Panel Purchase' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl animate-fade-in text-left">
                  <div>
                    <label className="block text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1.5 font-sans">প্যানেল নাম (Panel Name) *</label>
                    <select 
                      value={ticketPanelName} 
                      onChange={(e) => setTicketPanelName(e.target.value)}
                      className="w-full bg-white border border-indigo-200 rounded-xl py-3 px-3.5 text-xs font-bold text-slate-700 font-sans focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
                      required
                    >
                      <option value="">-- প্যানেল নাম সিলেক্ট করুন * --</option>
                      <option value="administer">administer</option>
                      <option value="admin">admin</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1.5 font-sans">প্যানেল URL (Panel URL) *</label>
                    <input 
                      type="text" 
                      value={ticketPanelUrl}
                      onChange={(e) => setTicketPanelUrl(e.target.value)}
                      className="w-full bg-white border border-indigo-200 rounded-xl py-3 px-3.5 text-xs font-mono font-bold text-slate-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
                      placeholder="e.g. administrator.com/admin/"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1.5 font-sans">প্যানেল মেয়াদ (Panel Duration) *</label>
                    <select 
                      value={ticketPanelDuration} 
                      onChange={(e) => {
                        const dur = e.target.value;
                        setTicketPanelDuration(dur);
                        if (!dur) {
                          setTopUpAmount('');
                          setTicketDueAmount('');
                          return;
                        }
                        const price = getPanelPrice(dur);
                        setTopUpAmount(price.toString());
                        const paid = Number(ticketPaidAmount) || 0;
                        setTicketDueAmount(Math.max(0, price - paid).toString());
                      }}
                      className="w-full bg-white border border-indigo-200 rounded-xl py-3 px-3.5 text-xs font-bold text-slate-700 font-sans focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
                      required
                    >
                      <option value="">-- মেয়াদ সিলেক্ট করুন * --</option>
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
                    <label className="block text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1.5 font-sans">প্যানেল টাইপ (Panel Type) *</label>
                    <select 
                      value={ticketPanelType} 
                      onChange={(e) => setTicketPanelType(e.target.value)}
                      className="w-full bg-white border border-indigo-200 rounded-xl py-3 px-3.5 text-xs font-bold text-slate-700 font-sans focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
                      required
                    >
                      <option value="">-- প্যানেল টাইপ সিলেক্ট করুন * --</option>
                      <option value="New panel">New panel (নতুন প্যানেল)</option>
                      <option value="Panel Rent">Panel Rent (প্যানেল রেন্ট বা ভাড়া)</option>
                    </select>
                  </div>
                </div>
              )}

              {topUpPurpose === 'Decoder License Purchase' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl animate-fade-in text-left">
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
                    ⚠️ ফর্মের সব অপশন এবং প্রয়োজনীয় তথ্য সিলেক্ট/পূরণ করুন (Please fill and select all payment fields to enable submission)
                  </p>
                )}
                <button 
                  type="submit" 
                  disabled={!isFormValid || isTopUpLoading}
                  className="w-full bg-indigo-600 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed text-white font-bold py-3.5 px-4 rounded-xl hover:bg-indigo-700 active:scale-[0.99] transition-all flex items-center justify-center gap-2 tracking-widest uppercase text-[10px] shadow-lg shadow-indigo-100"
                >
                  {isTopUpLoading ? <RefreshCw className="animate-spin" size={14} /> : 'পেমেন্ট রশিদ সাবমিট করুন (Send Verification Request)'}
                </button>
              </div>
            </form>

            <div className="mt-6 bg-slate-50 border border-slate-100 p-4 rounded-xl">
              <h4 className="text-[11px] font-black text-slate-700 uppercase tracking-widest mb-1">প্রয়োজনীয় তথ্য সতর্কতা</h4>
              <p className="text-[10px] text-slate-500 leading-relaxed font-sans">
                পেমেন্ট রিপোর্টের আমাউন্ট ও লাস্ট নম্বর বা ট্রানজেকশন ID কোম্পানির গেটওয়ে অ্যাকাউন্টের হিসেবের সাথে রিয়েল টাইমে মিলিয়ে দেখা হবে। ভূল বা ভূয়া পেমেন্ট ইনফোর জন্য অ্যাকাউন্ট বাতিল বা সাময়িকভাবে ব্লক করা হতে পারে।
              </p>
            </div>
          </div>
        )}

        {/* 4.5 CLIENT SMS HISTORY PORTAL (এসএমএস ইনবক্স) */}
        {activeSubTab === 'sms' && (() => {
          // Inner search state (Optional input for client client-side filter)
          // eslint-disable-next-line react-hooks/rules-of-hooks
          const [smsSearch, setSmsSearch] = useState('');
          
          const filteredSms = mySmsLogs.filter(log => {
            const query = smsSearch.toLowerCase().trim();
            if (!query) return true;
            return (
              (log.message && log.message.toLowerCase().includes(query)) ||
              (log.provider && log.provider.toLowerCase().includes(query)) ||
              (log.sender && log.sender.toLowerCase().includes(query))
            );
          });

          return (
            <div className="bg-white border border-slate-200 rounded-[1.5rem] p-6 shadow-xs animate-fade-in leading-relaxed">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4 mb-6">
                <div>
                  <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <MessageSquare size={16} className="text-indigo-600 animate-pulse" />
                    এসএমএস মেসেজ ইনবক্স (My SMS Portal)
                  </h2>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-xl font-sans">
                    সিস্টেম থেকে আপনার রেজিস্টার্ড হোয়াটসঅ্যাপ/মোবাইলে পাঠানো অফিসিয়াল অভিনন্দন মেসেজ, পেমেন্ট অনুমোদন এবং বকেয়া সতর্কবার্তা নোটিফিকেশন সমূহের লাইভ হিস্ট্রি নিচে দেখতে পাবেন।
                  </p>
                </div>
                {/* Search Inbox Input Container */}
                <div className="relative w-full sm:w-64">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Search size={14} />
                  </span>
                  <input
                    type="text"
                    value={smsSearch}
                    onChange={(e) => setSmsSearch(e.target.value)}
                    placeholder="ইনবক্স সার্চ করুন..."
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl pl-9 pr-3.5 py-2.5 text-xs font-bold text-slate-705 placeholder:text-slate-400 outline-none transition-all focus:ring-4 focus:ring-indigo-500/5"
                  />
                </div>
              </div>

              {filteredSms.length > 0 ? (
                <div className="space-y-4">
                  {filteredSms.map((log) => {
                    const formattedDate = (() => {
                      if (!log.createdAt) return 'N/A';
                      try {
                        const dObj = new Date(log.createdAt);
                        if (isNaN(dObj.getTime())) return log.createdAt;
                        return dObj.toLocaleString('bn-BD', {
                          hour: '2-digit',
                          minute: '2-digit',
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour12: true
                        });
                      } catch {
                        return log.createdAt;
                      }
                    })();

                    return (
                      <div key={log.id} className="p-5 border border-slate-150 hover:border-indigo-150 rounded-2xl bg-slate-50/20 hover:bg-slate-50/50 transition-all shadow-xs">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100/70 pb-3 mb-3.5 text-xs text-slate-400">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="bg-indigo-50 text-indigo-700 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border border-indigo-100/60 font-mono">
                              {log.sender || 'Master Admin'}
                            </span>
                            <span className="text-[10px] font-sans text-slate-400/80 font-semibold">{formattedDate}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10.5px] font-bold font-mono text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded-lg select-all">
                              {log.recipientPhone}
                            </span>
                            <span className={`text-[8.5px] font-mono font-black uppercase px-2 py-0.5 rounded-full ${
                              log.status === 'delivered' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100/60' :
                              log.status === 'failed' ? 'bg-rose-50 text-rose-700 border border-rose-105/60' :
                              'bg-amber-50 text-amber-700 border border-amber-100/60'
                            }`}>
                              {log.status || 'delivered'}
                            </span>
                          </div>
                        </div>

                        {/* Message payload */}
                        <div className="text-slate-800 text-[12.5px] leading-relaxed font-semibold whitespace-pre-wrap select-text font-mono">
                          {log.message}
                        </div>

                        {/* Footer Gateway Info */}
                        <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-slate-100/40 text-[9px] font-mono font-bold text-slate-400">
                          <span>SMS Gateway: {log.provider || 'Premium SMS API'}</span>
                          <span className="text-indigo-600 font-extrabold uppercase">Verified Delivered</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16 border border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-650 rounded-full flex items-center justify-center mx-auto mb-3.5 shadow-sm animate-bounce">
                    <MessageSquare size={22} />
                  </div>
                  <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest mb-1">কোনো মেসেজ রেকর্ড নেই (No SMS Logs)</h4>
                  <p className="text-[11px] text-slate-400 max-w-sm mx-auto leading-relaxed">
                    সিস্টেম থেকে আপনার নম্বরে এখনো কোনো মেসেজ পাঠানো হয়নি। এডমিন প্যানেল থেকে এসএমএস প্রেরণ সম্পন্ন হলে তা সাথে সাথে এখানে শো করবে।
                  </p>
                </div>
              )}
            </div>
          );
        })()}

        {/* 5. USER SETTINGS SUB-TAB */}
        {activeSubTab === 'settings' && (
          <div className="bg-white border border-slate-200 rounded-[1.5rem] p-6 shadow-xs animate-fade-in leading-relaxed">
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5 border-b border-slate-100 pb-3">
              <Settings size={16} className="text-indigo-600" />
              গ্রাহক অ্যাকাউন্ট প্রোফাইল ও সেটিংস (User Information & Settings)
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              নিচে আপনার নিবন্ধিত গ্রাহক অ্যাকাউন্ট ডাটাবেস ও সিস্টেমের বিবরণী সমূহ দেওয়া হলো। পেমেন্ট হিসেব বা বিলিং সংক্রান্ত কোনো সংশোধনীর জন্য এডমিনের সাথে যোগাযোগ করুন:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">গ্রাহকের পূর্ণ নাম (Full Name)</span>
                <span className="text-[13px] font-black text-slate-800">{currentUserData?.name || user?.name || 'Customer'}</span>
              </div>
              
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">নিবন্ধিত মোবাইল নম্বর (Mobile Phone)</span>
                <span className="text-[13px] font-bold text-slate-800 font-mono">{currentUserData?.phone || 'N/A'}</span>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">ইমেইল অ্যাড্রেস (Email Address)</span>
                <span className="text-[13px] font-bold text-slate-800 font-mono">{currentUserData?.email || user?.username || 'N/A'}</span>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">ইউজার রোল / এক্সেস লেভেল (Role Profile)</span>
                <span className="inline-block text-[9px] font-mono font-black uppercase bg-violet-50 text-violet-700 px-2 py-0.5 rounded mt-0.5 border border-violet-100/60">
                  {currentUserData?.role || user?.role || 'customer'}
                </span>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">অঞ্চল বা অবস্থান (Region Location)</span>
                <span className="text-[13px] font-bold text-slate-800 font-mono">{currentUserData?.region || 'Dhaka, Bangladesh'}</span>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">নিবন্ধিত লাইসেন্স বার্ষিক চার্জ (Annual Price Plan)</span>
                <span className="text-[13px] font-black text-indigo-650 font-mono">৳{Number(currentUserData?.price || 0).toLocaleString()}</span>
              </div>
            </div>

            {/* Password Change Form */}
            <div className="mt-8 pt-6 border-t border-slate-100">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-1.5 pb-2">
                <Lock size={14} className="text-indigo-600" />
                পাসওয়ার্ড পরিবর্তন করুন (Change Account Password)
              </h3>
              
              <form onSubmit={handleClientPasswordChange} className="space-y-4 max-w-xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">বর্তমান পাসওয়ার্ড (Current Password)</label>
                    <input 
                      type={showClientPass ? "text" : "password"}
                      value={clientCurrentPassword}
                      onChange={(e) => setClientCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all text-xs font-semibold"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">নতুন পাসওয়ার্ড (New Password)</label>
                    <input 
                      type={showClientPass ? "text" : "password"}
                      value={clientNewPassword}
                      onChange={(e) => setClientNewPassword(e.target.value)}
                      placeholder="কমপক্ষে ৬ অক্ষর"
                      required
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all text-xs font-semibold"
                    />
                  </div>
                  
                  <div className="space-y-1 sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">পাসওয়ার্ড নিশ্চিত করুন (Confirm Password)</label>
                    <div className="relative">
                      <input 
                        type={showClientPass ? "text" : "password"}
                        value={clientConfirmPassword}
                        onChange={(e) => setClientConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all text-xs font-semibold pr-10"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowClientPass(!showClientPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                      >
                        {showClientPass ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                </div>

                {clientPassError && (
                  <p className="text-[10px] font-black text-rose-600 uppercase tracking-wider bg-rose-50 border border-rose-100 p-2.5 rounded-lg">
                    ⚠️ {clientPassError}
                  </p>
                )}
                {clientPassSuccess && (
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider bg-emerald-50 border border-emerald-100 p-2.5 rounded-lg">
                    ✓ {clientPassSuccess}
                  </p>
                )}

                <button 
                  type="submit"
                  disabled={isClientPassSaving}
                  className="bg-slate-900 text-white hover:bg-black font-black text-[10px] px-6 py-3 rounded-xl uppercase tracking-widest transition-all hover:shadow-md cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5 active:scale-95"
                >
                  {isClientPassSaving ? 'পরিবর্তন করা হচ্ছে...' : 'পাসওয়ার্ড আপডেট করুন (Update Password)'}
                </button>
              </form>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col items-center justify-between text-[10px] font-mono font-black uppercase text-slate-400 tracking-widest sm:flex-row gap-3">
              <span>Master Intelligence System v1.5.0 © 2026</span>
              <span className="text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">ALL SERVICES ONLINE</span>
            </div>
          </div>
        )}
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

      {/* Admin Quick Action Bento Hub - Hidden per request */}
      {false && (
      <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm">
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

      {/* Bento Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {/* Metric 1: Total Revenue */}
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow h-full flex flex-col justify-between min-h-[170px]"
        >
          <div className="relative z-10">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('total_revenue')}</span>
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl group-hover:scale-110 transition-transform">
                <Banknote size={18} />
              </div>
            </div>
            
            <div className="mt-4">
              <span className="text-[10px] text-indigo-600 font-bold block mb-0.5 font-sans">সংগৃহীত সর্বমোট টাকা</span>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
                ৳{stats.totalRevenue.toLocaleString()}
              </h3>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between relative z-10">
            <div className="flex items-center gap-1 text-emerald-600 font-bold text-[9px] bg-emerald-50 px-2.5 py-0.5 rounded-full">
              <ArrowUpRight size={10} />
              <span>রিয়েলটাইম লিংকার</span>
            </div>
            {/* SVG Sparkline Sparkle Graphic */}
            <svg className="w-16 h-5 text-emerald-500 overflow-visible shrink-0" viewBox="0 0 100 20" fill="none">
              <path d="M0,15 L20,8 L40,17 L60,4 L80,12 L100,2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-indigo-50/20 rounded-full blur-2xl group-hover:bg-indigo-50/45 transition-colors"></div>
        </motion.div>

        {/* Metric 2: Total Investment */}
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow h-full flex flex-col justify-between min-h-[170px]"
        >
          <div className="relative z-10">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('total_investment')}</span>
              <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl group-hover:scale-110 transition-transform">
                <TrendingDown size={18} />
              </div>
            </div>

            <div className="mt-4">
              <span className="text-[10px] text-rose-500 font-bold block mb-0.5 font-sans">সর্বমোট কাজের খরচ</span>
              <h3 className="text-2xl sm:text-3xl font-black text-rose-600 font-mono tracking-tight">
                ৳{stats.totalInvestment.toLocaleString()}
              </h3>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between relative z-10">
            <div className="flex items-center gap-1 text-rose-600 font-bold text-[9px] bg-rose-50 px-2.5 py-0.5 rounded-full">
              <span>Expenses Tracked</span>
            </div>
            <svg className="w-16 h-5 text-rose-500 overflow-visible shrink-0" viewBox="0 0 100 20" fill="none">
              <path d="M0,2 L20,14 L40,7 L60,18 L80,9 L100,15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-rose-50/20 rounded-full blur-2xl group-hover:bg-rose-50/45 transition-colors"></div>
        </motion.div>

        {/* Metric 3: Net Profit */}
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow h-full flex flex-col justify-between min-h-[170px]"
        >
          <div className="relative z-10">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('net_profit')}</span>
              <div className={`p-2.5 rounded-xl group-hover:scale-110 transition-transform ${stats.netProfit >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                <TrendingUp size={18} />
              </div>
            </div>

            <div className="mt-4">
              <span className="text-[10px] text-emerald-600 font-bold block mb-0.5 font-sans">অর্জিত প্রকৃত প্রফিট</span>
              <h3 className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${stats.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                ৳{stats.netProfit.toLocaleString()}
              </h3>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between relative z-10">
            <span className="text-[9.5px] font-bold text-slate-400 italic">Yielding Ledger Yield</span>
            <div className={`w-2 h-2 rounded-full ${stats.netProfit >= 0 ? 'bg-emerald-500 shadow-emerald-200' : 'bg-rose-500 shadow-rose-200'} animate-pulse shadow-md`}></div>
          </div>
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-emerald-50/20 rounded-full blur-2xl group-hover:bg-emerald-50/45 transition-colors"></div>
        </motion.div>

        {/* Metric 4: Due Balance */}
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-900 border border-slate-800 text-white p-6 rounded-[2rem] shadow-lg relative overflow-hidden group h-full flex flex-col justify-between min-h-[170px]"
        >
          <div className="relative z-10">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">{t('due_balance')}</span>
              <div className="p-2.5 bg-rose-500/20 text-rose-300 rounded-xl group-hover:scale-110 transition-transform border border-rose-500/10">
                <Activity size={18} className="animate-pulse" />
              </div>
            </div>

            <div className="mt-4">
              <span className="text-[10px] text-rose-450 font-bold block mb-0.5 font-sans">গ্রাহকদের মোট বাকি বা বকেয়া</span>
              <h3 className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
                ৳{stats.dueBalance.toLocaleString()}
              </h3>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between relative z-10">
            <span className="text-[9px] font-black text-indigo-200/60 uppercase tracking-wider bg-white/5 px-2 py-0.5 rounded-md">
              {stats.pendingInvoicesCount} {t('pending_invoices_status')}
            </span>
            <span className="text-[9px] text-rose-400 font-black animate-pulse flex items-center gap-1">
              ● Pending Review
            </span>
          </div>
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/25 transition-colors"></div>
        </motion.div>

        {/* Metric 5: Total Users */}
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow h-full flex flex-col justify-between min-h-[170px]"
        >
          <div className="relative z-10">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">রেজিস্টার্ড কাস্টমার</span>
              <div className="p-2.5 bg-violet-50 text-violet-600 rounded-xl group-hover:scale-110 transition-transform">
                <Users size={18} />
              </div>
            </div>

            <div className="mt-4">
              <span className="text-[10px] text-violet-600 font-bold block mb-0.5 font-sans">অ্যাক্টিভ গ্রাহক তালিকা সংখ্যা</span>
              <h3 className="text-2xl sm:text-3xl font-black text-indigo-900 font-mono tracking-tight">
                {totalUsersCount} জন
              </h3>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between relative z-10 font-sans">
            <span className="text-[9px] font-bold text-slate-400">Database Users list</span>
            <div className="flex -space-x-2.5 overflow-hidden filter saturate-110">
              <div className="w-5.5 h-5.5 rounded-full border-2 border-white bg-indigo-400 text-[8px] font-black flex items-center justify-center text-white">A</div>
              <div className="w-5.5 h-5.5 rounded-full border-2 border-white bg-emerald-400 text-[8px] font-black flex items-center justify-center text-white">S</div>
              <div className="w-5.5 h-5.5 rounded-full border-2 border-white bg-indigo-500 text-[8px] font-black flex items-center justify-center text-white">M</div>
            </div>
          </div>
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-violet-50/20 rounded-full blur-2xl group-hover:bg-violet-50/45 transition-colors"></div>
        </motion.div>
      </div>

      {/* Daily Revenue Trends Bar Chart Section */}
      <div className="bg-white p-6 sm:p-8 border border-slate-200 rounded-[2rem] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <BarChart3 size={16} className="text-indigo-600" />
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">চলতি মাসের দৈনিক রেভিনিউ ট্রেন্ড (Daily Revenue Trends)</h2>
            </div>
            <p className="text-[11px] text-slate-500 font-sans">
              {dailyRevenueData.monthNameBng} {dailyRevenueData.year} সালের দৈনিক পরিশোধিত ও অনুমোদিত পেমেন্টের রিয়েলটাইম বার চার্ট বিশ্লেষণ:
            </p>
          </div>
          <div className="bg-indigo-50 border border-indigo-150 px-4 py-2 rounded-2xl flex flex-col items-end shrink-0">
            <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest font-sans">চলতি মাসের সর্বমোট আয়</span>
            <span className="text-lg font-black text-indigo-700 font-mono">৳{dailyRevenueData.total.toLocaleString()}</span>
          </div>
        </div>

        <div className="h-[280px] w-full pt-4 pr-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyRevenueData.data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                formatter={(value: any) => [`৳${Number(value).toLocaleString()}`, 'রেভিনিউ']}
                labelFormatter={(label) => `${dailyRevenueData.monthName} ${label}`}
              />
              <Bar 
                dataKey="revenue" 
                fill="#4f46e5" 
                radius={[4, 4, 0, 0]} 
                maxBarSize={40}
              >
                {dailyRevenueData.data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.revenue > 0 ? '#4f46e5' : '#e2e8f0'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-bold">
          <span>* এন্ট্রিগুলোতে শুধুমাত্র 'Paid' এবং 'Approved' রেভিনিউ গণনা করা হয়েছে</span>
          <span className="font-mono">{dailyRevenueData.monthNameBng} ১ - {dailyRevenueData.data.length} তারিখ</span>
        </div>
      </div>

      {/* Main Row: Double Panels */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Column: Financial Graph Area Flow */}
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

        {/* Right Column: Activities and Recent Invoices Split Container */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
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
    </div>
  );
}
