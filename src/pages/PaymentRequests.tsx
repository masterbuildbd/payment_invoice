import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Search, 
  Banknote, 
  User as UserIcon, 
  Calendar, 
  Check, 
  X, 
  Phone, 
  FileText, 
  AlertCircle,
  Copy,
  Download,
  MessageSquare,
  Bell,
  Upload,
  CheckSquare,
  Settings2,
  ArrowRightLeft,
  AlertTriangle,
  FileSpreadsheet,
  Sparkles,
  RefreshCw,
  Edit,
  Trash2,
  Mail
} from 'lucide-react';
import { motion } from 'motion/react';
import { Invoice, User, CompanySettings } from '../types';
import { 
  subscribeToInvoices, 
  updateInvoice, 
  subscribeToCollection, 
  updateDocument, 
  subscribeToSettings,
  createInvoice,
  deleteInvoice,
  createDocument
} from '../lib/storage';
import { useToast } from '../components/Toast';
import { Modal } from '../components/Modal';

const formatLocalDate = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// Robust CSV Parser utility supporting quoted values
const parseCSV = (text: string) => {
  const lines: string[][] = [];
  let row: string[] = [];
  let inQuotes = false;
  let currentVal = '';
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentVal += '"';
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(currentVal.trim());
      currentVal = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      row.push(currentVal.trim());
      if (row.length > 1 || row[0] !== '') {
        lines.push(row);
      }
      row = [];
      currentVal = '';
    } else {
      currentVal += char;
    }
  }
  if (currentVal || row.length > 0) {
    row.push(currentVal.trim());
    lines.push(row);
  }
  return lines;
};

export function PaymentRequests() {
  const { addToast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [settings, setSettings] = useState<Partial<CompanySettings>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'pending' | 'paid' | 'rejected' | 'all'>('pending');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // --- CSV Import & Matching States ---
  const [showImportPanel, setShowImportPanel] = useState(false);
  const [csvFileName, setCsvFileName] = useState('');
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvDataRows, setCsvDataRows] = useState<string[][]>([]);
  const [columnMapping, setColumnMapping] = useState({
    txIdIdx: 0,
    amountIdx: 1,
    senderIdx: 2
  });
  const [matchedRequests, setMatchedRequests] = useState<{
    invoice: Invoice;
    statementRow: string[];
    isAmountMatch: boolean;
    statementAmount: number;
    statementSender: string;
    statementTxId: string;
  }[]>([]);
  const [unmatchedRows, setUnmatchedRows] = useState<string[][]>([]);
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);
  const [bulkStatusMsg, setBulkStatusMsg] = useState('');
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [whatsAppModalInvoice, setWhatsAppModalInvoice] = useState<Invoice | null>(null);
  const [approvedNotificationModal, setApprovedNotificationModal] = useState<{
    isOpen: boolean;
    invoice: Invoice | null;
    user?: User | null;
  }>({ isOpen: false, invoice: null, user: null });

  useEffect(() => {
    const unsubInvoices = subscribeToInvoices((data) => {
      setInvoices(data);
    });

    const unsubUsers = subscribeToCollection<User>('users', (data) => {
      setUsers(data);
    }, 'name');

    const unsubSettings = subscribeToSettings((data) => {
      setSettings(data);
    });

    return () => {
      unsubInvoices && unsubInvoices();
      unsubUsers && unsubUsers();
      unsubSettings && unsubSettings();
    };
  }, []);

  const handleDeleteInvoice = async (inv: Invoice) => {
    if (window.confirm(`আপনি কি নিশ্চিতভাবে এই পেমেন্ট রিকোয়েস্টটি (#${inv.id?.substring(0, 8).toUpperCase() || inv.id}) ডিলিট করতে চান?`)) {
      try {
        await deleteInvoice(inv.id);
        alert('পেমেন্ট রিকোয়েস্টটি সফলভাবে ডিলিট করা হয়েছে!');
      } catch (err) {
        console.error(err);
        alert('ডিলিট করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
      }
    }
  };

  const handleUpdateInvoiceDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInvoice) return;
    try {
      const amt = Number(editingInvoice.amount) || 0;
      let calculatedPaid = Number(editingInvoice.paidAmount) || 0;
      let calculatedDue = Number(editingInvoice.dueAmount) || 0;

      if (editingInvoice.status === 'paid') {
        calculatedPaid = amt;
        calculatedDue = 0;
      } else if (editingInvoice.status === 'rejected') {
        calculatedPaid = 0;
        calculatedDue = 0;
      } else if (editingInvoice.status === 'pending') {
        calculatedDue = amt;
        calculatedPaid = 0;
      }

      await updateInvoice(editingInvoice.id, {
        customerName: editingInvoice.customerName || '',
        customerNumber: editingInvoice.customerNumber || editingInvoice.phone || '',
        amount: amt,
        paidAmount: calculatedPaid,
        dueAmount: calculatedDue,
        transactionId: editingInvoice.transactionId || '',
        paymentMethod: editingInvoice.paymentMethod || '',
        status: editingInvoice.status || 'pending',
        type: editingInvoice.type || '',
        note: editingInvoice.note || ''
      });
      alert('পেমেন্ট রিকোয়েস্টের তথ্য সফলভাবে আপডেট করা হয়েছে!');
      setEditingInvoice(null);
    } catch (err) {
      console.error(err);
      alert('আপডেট করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    }
  };

  const cleanTxnId = (id: string) => {
    return String(id || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  };

  useEffect(() => {
    if (csvDataRows.length === 0) {
      setMatchedRequests([]);
      setUnmatchedRows([]);
      return;
    }

    const pendingRequests = invoices.filter(inv => inv.status === 'pending');
    const matches: typeof matchedRequests = [];
    const matchedCsvIndices = new Set<number>();

    pendingRequests.forEach(inv => {
      const sysTxId = cleanTxnId(inv.transactionId);
      if (!sysTxId) return;

      csvDataRows.forEach((row, rowIndex) => {
        const csvTxIdRaw = row[columnMapping.txIdIdx] || '';
        const csvTxId = cleanTxnId(csvTxIdRaw);

        if (csvTxId && sysTxId === csvTxId) {
          const statementAmount = Number(String(row[columnMapping.amountIdx] || '0').replace(/[^0-9.]/g, '')) || 0;
          const isAmountMatch = Math.abs(statementAmount - (inv.amount || 0)) < 0.1;
          const statementSender = row[columnMapping.senderIdx] || 'N/A';

          matches.push({
            invoice: inv,
            statementRow: row,
            isAmountMatch,
            statementAmount,
            statementSender,
            statementTxId: csvTxIdRaw
          });
          matchedCsvIndices.add(rowIndex);
        }
      });
    });

    // Unmatched lines in CSV
    const unmatched: string[][] = [];
    csvDataRows.forEach((row, index) => {
      const txIdRaw = row[columnMapping.txIdIdx] || '';
      if (txIdRaw.trim() && !matchedCsvIndices.has(index)) {
        unmatched.push(row);
      }
    });

    setMatchedRequests(matches);
    setUnmatchedRows(unmatched);
  }, [invoices, csvDataRows, columnMapping]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = parseCSV(text);
      if (lines.length < 2) {
        alert('সিএসভি ফাইলে পর্যাপ্ত তথ্য পাওয়া হয়নি (Not enough lines in CSV!)');
        return;
      }

      const headers = lines[0];
      const dataRows = lines.slice(1);

      setCsvHeaders(headers);
      setCsvDataRows(dataRows);

      const lowercaseHeaders = headers.map(h => h.toLowerCase());
      
      let txId = 0;
      let amt = 1;
      let snd = 2;

      const txKeywords = ['tx', 'trx', 'txn', 'transaction', 'reference', 'ref', 'id', 'লেনদেন', 'আইডি'];
      const amtKeywords = ['amount', 'credit', 'cash', 'money', 'bdt', 'taka', 'deposit', 'টাকা', 'পরিমাণ'];
      const sndKeywords = ['sender', 'phone', 'mobile', 'from', 'source', 'number', 'মোবাইল', 'নম্বর'];

      const detectedTx = lowercaseHeaders.findIndex(h => txKeywords.some(k => h.includes(k)));
      const detectedAmt = lowercaseHeaders.findIndex(h => amtKeywords.some(k => h.includes(k)));
      const detectedSnd = lowercaseHeaders.findIndex(h => sndKeywords.some(k => h.includes(k)));

      if (detectedTx !== -1) txId = detectedTx;
      if (detectedAmt !== -1) amt = detectedAmt;
      if (detectedSnd !== -1) snd = detectedSnd;

      setColumnMapping({
        txIdIdx: txId,
        amountIdx: amt !== -1 ? amt : (txId === 0 ? 1 : 0),
        senderIdx: snd !== -1 ? snd : (txId !== 2 && amt !== 2 ? 2 : 0)
      });
      
      setBulkStatusMsg('');
    };
    reader.readAsText(file);
  };

  const processMatchApproval = async (invoice: Invoice, silent = false) => {
    try {
      await updateInvoice(invoice.id, {
        status: 'paid',
        paidAmount: invoice.amount,
        dueAmount: 0,
        cashierName: settings.signatureName || 'Admin Approved via Matching',
        note: (invoice.note || '') + ' [APPROVED VIA STATEMENT MATCHING]'
      });

      if (invoice.username) {
        const matchingUser = users.find(
          u => u.username?.trim().toLowerCase() === invoice.username?.trim().toLowerCase()
        );

        if (matchingUser) {
          const parsedAmount = Number(invoice.amount) || 0;
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

      if (!silent) {
        alert(`রিকোয়েস্ট #${invoice.id.substring(0, 8).toUpperCase()} সফলভাবে অনুমোদন করা হয়েছে!`);
      }
      return true;
    } catch (err) {
      console.error(err);
      if (!silent) {
        alert('অনুমোদনে ত্রুটি হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
      }
      return false;
    }
  };

  const handleApproveAllMatches = async () => {
    if (matchedRequests.length === 0) return;
    
    const safeMatches = matchedRequests.filter(m => m.isAmountMatch);
    if (safeMatches.length === 0) {
      alert('সরাসরি মিলে যাওয়া (Perfect matches with equal amount) কোনো লেনদেন পাওয়া যায়নি!');
      return;
    }

    if (!window.confirm(`আপনি কি নিশ্চিতভাবে এই ${safeMatches.length}টি একদম হুবহু মিলে যাওয়া লেনদেন এক ক্লিকে অনুমোদন করতে চান?`)) {
      return;
    }

    setIsProcessingBulk(true);
    setBulkStatusMsg(`প্রসেসিং শুরু হচ্ছে: ${safeMatches.length}টি লেনদেন...`);

    let approvedCount = 0;
    for (let i = 0; i < safeMatches.length; i++) {
      const match = safeMatches[i];
      setBulkStatusMsg(`অনুমোদন করা হচ্ছে (${i + 1}/${safeMatches.length}): রিকোয়েস্ট #${match.invoice.id.substring(0, 8).toUpperCase()}`);
      
      const success = await processMatchApproval(match.invoice, true);
      if (success) {
        approvedCount++;
      }
    }

    setIsProcessingBulk(false);
    setBulkStatusMsg('');
    alert(`অসাধারণ! সফলভাবে সর্বমোট ${approvedCount}টি লেনদেন এক ট্রিপে অনুমোদন করা সম্পূর্ণ হয়েছে!`);
  };

  const handleCreateRequestFromStatement = async (row: string[]) => {
    const txId = row[columnMapping.txIdIdx] || 'N/A';
    const amountVal = Number(String(row[columnMapping.amountIdx] || '0').replace(/[^0-9.]/g, '')) || 0;
    const sender = row[columnMapping.senderIdx] || 'N/A';

    const clientUsername = prompt('গ্রাহকের ইউজারনেম টাইপ করুন (যদি থাকে) / Enter User Username:', '') || '';
    const name = prompt('গ্রাহকের নাম / Enter Customer Name:', 'Bank Customer') || 'Bank Customer';

    const newInv: Invoice = {
      id: 'INV-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
      customerName: name,
      customerNumber: sender,
      paymentMethod: 'Imported Statement',
      transactionId: txId,
      amount: amountVal,
      paidAmount: amountVal,
      dueAmount: 0,
      status: 'paid',
      createdAt: new Date().toISOString().substring(0, 10),
      items: [],
      cashierName: settings.signatureName || 'Admin Bulk Statement Import',
      type: 'Wallet Direct Credit [CSV]',
      note: 'Created manually from bank statement import reference column.'
    };

    if (clientUsername.trim()) {
      newInv.username = clientUsername.trim();
    }

    try {
      await createInvoice(newInv);
      
      if (clientUsername.trim()) {
        const matchingUser = users.find(
          u => u.username?.trim().toLowerCase() === clientUsername.trim().toLowerCase()
        );

        if (matchingUser) {
          const currentPaid = Number(matchingUser.paidAmount) || 0;
          const totalPaid = currentPaid + amountVal;
          const userPrice = Number(matchingUser.price) || 0;
          const newDue = Math.max(0, userPrice - totalPaid);

          await updateDocument<User>('users', matchingUser.id, {
            status: 'approved',
            paidAmount: totalPaid,
            dueAmount: newDue
          });
        }
      }

      alert('সফলভাবে বিল ট্রানজেকশন আবেদন সিস্টেমে তৈরি ও অনুমোদন করা হয়েছে!');
    } catch (err) {
      console.error(err);
      alert('আবেদন তৈরিতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleApproveRequest = async (invoice: Invoice) => {
    try {
      // 1. Update invoice status to 'paid' (approved) and clear any due
      await updateInvoice(invoice.id, {
        status: 'paid',
        paidAmount: invoice.amount,
        dueAmount: 0,
        cashierName: settings.signatureName || 'Admin Approved',
        note: (invoice.note || '') + ' [APPROVED BY ADMIN]'
      });

      // 2. See if there is a matching user to auto-approve their account
      if (invoice.username) {
        const matchingUser = users.find(
          u => u.username?.trim().toLowerCase() === invoice.username?.trim().toLowerCase()
        );

        if (matchingUser) {
          // Calculate new financial details for the user
          const parsedAmount = Number(invoice.amount) || 0;
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

      // Find matching user and get their updated budget metrics to pass to notification templates
      const matchingUser = invoice.username ? users.find(
        u => u.username?.trim().toLowerCase() === invoice.username?.trim().toLowerCase()
      ) : null;

      let updatedUser = matchingUser ? { ...matchingUser } : null;
      if (updatedUser) {
        const parsedAmount = Number(invoice.amount) || 0;
        const currentPaid = Number(matchingUser?.paidAmount) || 0;
        const totalPaid = currentPaid + parsedAmount;
        const userPrice = Number(matchingUser?.price) || 0;
        const newDue = Math.max(0, userPrice - totalPaid);
        updatedUser.paidAmount = totalPaid;
        updatedUser.dueAmount = newDue;
      }

      setApprovedNotificationModal({
        isOpen: true,
        invoice,
        user: updatedUser
      });
    } catch (err) {
      console.error(err);
      alert('অনুমোদন করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    }
  };

  const handleRejectRequest = async (invoice: Invoice) => {
    try {
      // Update invoice status to 'rejected'
      await updateInvoice(invoice.id, {
        status: 'rejected',
        dueAmount: 0,
        paidAmount: 0,
        note: (invoice.note || '') + ' [REJECTED BY ADMIN]'
      });

      alert(`রিকোয়েস্ট #${invoice.id.substring(0, 8).toUpperCase()} প্রত্যাখ্যান করা হয়েছে।`);
    } catch (err) {
      console.error(err);
      alert('প্রত্যাখ্যান করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    }
  };

  const getInvoiceWhatsAppUrls = (invoice: Invoice) => {
    const customerName = invoice.customerName || 'গ্রাহক';
    const amount = invoice.amount || 0;
    const method = invoice.paymentMethod || (invoice as any).method || 'Bkash/Nagad/Rocket';
    const transactionId = invoice.transactionId || 'N/A';
    const purpose = invoice.type || 'Wallet Top-Up';
    
    let extrasText = '';
    if (invoice.appName) {
      extrasText = ` (অ্যাপের নাম: ${invoice.appName}, প্যাকেজ: ${invoice.packageName || 'N/A'})`;
    } else if (invoice.panelName) {
      extrasText = ` (প্যানেল: ${invoice.panelName}, মেয়াদ: ${invoice.panelDuration || 'N/A'})`;
    } else if (invoice.decoderUsername) {
      extrasText = ` (ডিকোডার ইউজার: ${invoice.decoderUsername}, মেয়াদ: ${invoice.decoderDuration || 'N/A'})`;
    } else if (invoice.serviceDetails) {
      extrasText = ` (সার্ভিস বিবরণ: ${invoice.serviceDetails})`;
    }

    const cleanPhone = (phone: string) => {
      let cleaned = phone.replace(/[^\d]/g, '');
      if (cleaned.startsWith('0') && cleaned.length === 11) {
        cleaned = '88' + cleaned;
      }
      return cleaned;
    };

    const recipientNumber = invoice.customerNumber || (invoice as any).phone || '';
    const phoneForWa = cleanPhone(recipientNumber);

    const message = `আসসালামু আলাইকুম, ${customerName}!\n\nআপনার BDT ${amount} মূল্যের পেন্ডিং পেমেন্ট রিকোয়েস্টটি আমাদের সিস্টেমে সফলভাবে জমা হয়েছে।\n\n📌 বিবরণ:\n- পেমেন্ট উদ্দেশ্য: ${purpose}${extrasText}\n- পেমেন্ট মাধ্যম: ${method}\n- ট্রানজেকশন ID: ${transactionId}\n\nআপনার রিকোয়েস্টটি বর্তমানে যাচাই করা হচ্ছে (Pending Verification)। অনুগ্রহ করে একটু অপেক্ষা করুন, অতি শীঘ্রই আমাদের টিম আপনার পেমেন্টটি ভেরিফাই করে ব্যালেন্স আপডেট করে দিবে।\n\nধন্যবাদ!`;
    const encodedText = encodeURIComponent(message);

    return {
      phone: phoneForWa,
      message: message,
      regular: `https://api.whatsapp.com/send?phone=${phoneForWa}&text=${encodedText}`,
      businessFallback: `https://wa.me/${phoneForWa}?text=${encodedText}`
    };
  };

  const handleWhatsAppNotify = (invoice: Invoice) => {
    const recipientNumber = invoice.customerNumber || (invoice as any).phone || '';
    if (!recipientNumber) {
      alert('এই গ্রাহকের কোনো ফোন নম্বর বা মোবাইল নম্বর পাওয়া যায়নি!');
      return;
    }
    setWhatsAppModalInvoice(invoice);
  };

  const filtered = invoices.filter(inv => {
    // Only fetch those that look like requests (they have payment details or created via client)
    const isPaymentRequest = inv.transactionId || (inv.note && inv.note.includes('ভেরিফিকেশন'));
    if (!isPaymentRequest) return false;

    // Filter by status
    if (activeFilter !== 'all' && inv.status !== activeFilter) {
      return false;
    }

    // Filter by Date Range
    const recordDateStr = inv.createdAt || inv.date || '';
    const recordDateOnlyStr = recordDateStr.substring(0, 10); // Standard 'YYYY-MM-DD'
    
    if (startDate && recordDateOnlyStr < startDate) {
      return false;
    }
    if (endDate && recordDateOnlyStr > endDate) {
      return false;
    }

    // Filter by search
    if (searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase();
      const matchName = inv.customerName?.toLowerCase().includes(q);
      const matchTxn = inv.transactionId?.toLowerCase().includes(q);
      const matchUser = inv.username?.toLowerCase().includes(q);
      const matchPhone = inv.customerNumber?.toLowerCase().includes(q) || inv.phone?.toLowerCase().includes(q);
      return matchName || matchTxn || matchUser || matchPhone;
    }

    return true;
  });

  const handleExportCSV = () => {
    if (filtered.length === 0) {
      alert('এক্সপোর্ট করার জন্য কোনো ডাটা পাওয়া যায়নি!');
      return;
    }

    const headers = [
      'Invoice ID',
      'Date',
      'Customer Name',
      'Username',
      'Phone / Mobile',
      'Payment Gateway',
      'Transaction ID',
      'Amount (BDT)',
      'Status'
    ];

    const rows = filtered.map(inv => [
      `INV-${inv.id?.substring(0, 8).toUpperCase() || inv.id || 'N/A'}`,
      inv.createdAt || inv.date || 'N/A',
      inv.customerName || 'N/A',
      inv.username ? `@${inv.username}` : 'N/A',
      inv.customerNumber || inv.phone || 'N/A',
      inv.paymentMethod || inv.method || 'N/A',
      inv.transactionId || 'N/A',
      inv.amount || 0,
      inv.status === 'paid' ? 'Approved (Paid)' : inv.status === 'pending' ? 'Pending' : 'Rejected'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => {
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      }).join(','))
    ].join('\n');

    const blob = new Blob([`\ufeff${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `payment_requests_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Banknote className="text-indigo-600" size={26} />
          পেমেন্ট রিকোয়েস্ট যাচাইকরণ (Payment Request Verification)
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          গ্রাহকদের পাঠানো পেমেন্ট ট্রানজেকশন রিকোয়েস্টসমূহ এখান থেকে যাচাই করে অনুমোদন অথবা বাতিল করুন।
        </p>
      </div>

      {/* Tabs, Search, and Date Range Filters */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
          {/* Sub-Filters */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'pending', label: 'মূলতুবি (Pending)', color: 'text-amber-600 bg-amber-50 border-amber-205' },
              { id: 'paid', label: 'অনুমোদিত (Approved)', color: 'text-emerald-700 bg-emerald-50 border-emerald-202' },
              { id: 'rejected', label: 'প্রত্যাখ্যাত (Rejected)', color: 'text-rose-700 bg-rose-50 border-rose-250' },
              { id: 'all', label: 'সব রিকোয়েস্ট (All Requests)', color: 'text-slate-700 bg-slate-50 border-slate-200' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id as any)}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl border transition-all ${
                  activeFilter === tab.id
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-100'
                    : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200 cursor-pointer'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search & Export Field Wrapper */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center flex-1 max-w-xl justify-end">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="ইউজারনেম, নাম, মোবাইল বা ট্রানজেকশন ID দিয়ে খুঁজুন..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 focus:bg-white transition-all"
              />
            </div>

            <button
              onClick={() => setShowImportPanel(!showImportPanel)}
              className={`text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm shrink-0 cursor-pointer ${
                showImportPanel 
                  ? 'bg-indigo-700 ring-2 ring-indigo-300 shadow-indigo-150' 
                  : 'bg-indigo-600 hover:bg-indigo-750 shadow-indigo-100'
              }`}
              title="CSV বা ব্যাংক স্টেটমেন্ট ইম্পোর্ট করুন"
            >
              <Upload size={15} />
              <span>ইম্পোর্ট ও ম্যাচিং (Import CSV)</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm shadow-emerald-100 shrink-0 cursor-pointer"
              title="CSV-তে এক্সপোর্ট করুন"
            >
              <Download size={15} />
              <span>রপ্তানি (Export CSV)</span>
            </button>
          </div>
        </div>

        {/* Date Range Picker Sub-Panel */}
        <div className="pt-4 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-slate-500">
              <Calendar size={15} className="text-indigo-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">লেনদেন তারিখ (Date Range):</span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all cursor-pointer"
                />
              </div>
              <span className="text-slate-400 text-xs font-bold">থেকে</span>
              <div className="relative">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all cursor-pointer"
                />
              </div>
            </div>

            {/* Clear Button */}
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 rounded-xl text-xs font-black uppercase tracking-wider transition-colors inline-flex items-center gap-1 cursor-pointer"
                title="ফিল্টার মুছুন"
              >
                <X size={12} strokeWidth={2.5} />
                মুছুন (Clear)
              </button>
            )}
          </div>

          {/* Quick Date Presets */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">শর্টকাট presets:</span>
            <button
              onClick={() => {
                const todayStr = formatLocalDate(new Date());
                setStartDate(todayStr);
                setEndDate(todayStr);
              }}
              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
            >
              আজকে (Today)
            </button>
            <button
              onClick={() => {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const yesStr = formatLocalDate(yesterday);
                setStartDate(yesStr);
                setEndDate(yesStr);
              }}
              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
            >
              গতকাল (Yesterday)
            </button>
            <button
              onClick={() => {
                const today = new Date();
                const past7 = new Date();
                past7.setDate(past7.getDate() - 7);
                setStartDate(formatLocalDate(past7));
                setEndDate(formatLocalDate(today));
              }}
              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
            >
              ৭ দিন (7 Days)
            </button>
          </div>
        </div>
      </div>

      {/* CSV Import & Statement Matcher Dashboard */}
      {showImportPanel && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6"
        >
          {/* Panel Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 bg-indigo-50 border border-indigo-150 rounded-xl flex items-center justify-center text-indigo-600 flex-shrink-0">
                <FileSpreadsheet size={20} />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  ব্যাংক স্টেটমেন্ট ও CSV ম্যাচিং হাব (Bank Statement & CSV Matcher)
                </h2>
                <p className="text-[11px] text-slate-400 font-medium">
                  বিকাশ, রকেট, নগদ ইত্যাদির এক্সপোর্ট করা CSV বা ব্যাংক স্টেটমেন্ট ফাইল আপলোড করে স্বয়ংক্রিয়ভাবে পেন্ডিং পেমেন্ট ভেরিফাই করুন।
                </p>
              </div>
            </div>
            
            {csvDataRows.length > 0 && (
              <button
                onClick={() => {
                  setCsvFileName('');
                  setCsvHeaders([]);
                  setCsvDataRows([]);
                  setMatchedRequests([]);
                  setUnmatchedRows([]);
                }}
                className="text-xs font-black text-rose-600 bg-rose-50 hover:bg-rose-105 px-3 py-1.5 rounded-lg border border-rose-100 transition-all flex items-center gap-1 cursor-pointer"
              >
                <X size={12} strokeWidth={2.5} />
                রিসেট (Reset File)
              </button>
            )}
          </div>

          {/* CSV Upload or Configuration Interface */}
          {csvDataRows.length === 0 ? (
            <div className="border-2 border-dashed border-slate-250 rounded-xl p-8 bg-white text-center hover:border-indigo-400 hover:bg-indigo-50/20 transition-all relative cursor-pointer">
              <input 
                type="file" 
                accept=".csv,.txt"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Upload className="mx-auto text-slate-400 mb-3 animate-bounce" size={32} />
              <h3 className="text-xs font-black uppercase text-slate-600 tracking-wider">
                সিএসভি বা ব্যাংক স্টেটমেন্ট ফাইল এখানে ড্রপ বা ক্লিক করুন (Upload CSV Statement)
              </h3>
              <p className="text-[10px] text-slate-400 mt-1 max-w-md mx-auto">
                আপনার ব্যাংক, bKash বা Nagad পোর্টাল থেকে ডাউনলোডকৃত .csv রিপোর্ট ফাইলটি নির্বাচন করুন। কলামসমূহ রিড করে সিস্টেম স্বয়ংক্রিয়ভাবে ম্যাচ করবে।
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Mapping & Auto-detection HUD */}
              <div className="bg-white rounded-xl p-4 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5 text-slate-500 text-xs font-black uppercase">
                    <Settings2 size={13} className="text-indigo-500" />
                    কলাম ম্যাপিং (Column Mapping):
                  </div>
                  
                  {/* Columns selectors */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] uppercase font-black text-slate-400">Transaction ID:</span>
                      <select
                        value={columnMapping.txIdIdx}
                        onChange={(e) => setColumnMapping({ ...columnMapping, txIdIdx: Number(e.target.value) })}
                        className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none cursor-pointer"
                      >
                        {csvHeaders.map((h, idx) => (
                          <option key={idx} value={idx}>{h || `Col ${idx + 1}`}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] uppercase font-black text-slate-400">Amount Column:</span>
                      <select
                        value={columnMapping.amountIdx}
                        onChange={(e) => setColumnMapping({ ...columnMapping, amountIdx: Number(e.target.value) })}
                        className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none cursor-pointer"
                      >
                        {csvHeaders.map((h, idx) => (
                          <option key={idx} value={idx}>{h || `Col ${idx + 1}`}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] uppercase font-black text-slate-400">Sender Info:</span>
                      <select
                        value={columnMapping.senderIdx}
                        onChange={(e) => setColumnMapping({ ...columnMapping, senderIdx: Number(e.target.value) })}
                        className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none cursor-pointer"
                      >
                        {csvHeaders.map((h, idx) => (
                          <option key={idx} value={idx}>{h || `Col ${idx + 1}`}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded-md font-mono font-bold">
                    FILE: {csvFileName} ({csvDataRows.length} rows)
                  </span>
                </div>
              </div>

              {/* Real-time Dashboard Match Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-black block tracking-wider">টোটাল পেন্ডিং আবেদন (Pending)</span>
                    <span className="text-xl font-mono font-black text-slate-800">
                      {invoices.filter(i => i.status === 'pending').length}
                    </span>
                  </div>
                  <div className="w-9 h-9 bg-amber-50 rounded-lg border border-amber-100 flex items-center justify-center text-amber-500">
                    <RefreshCw size={16} className="animate-spin" />
                  </div>
                </div>

                <div className="bg-emerald-50/40 p-4 rounded-xl border border-emerald-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-emerald-700 uppercase font-black block tracking-wider">মিলে যাওয়া ট্রানজেকশন (Matches)</span>
                    <span className="text-xl font-mono font-black text-emerald-700">
                      {matchedRequests.filter(m => m.isAmountMatch).length}
                    </span>
                  </div>
                  <div className="w-9 h-9 bg-emerald-100/60 rounded-lg border border-emerald-202 flex items-center justify-center text-emerald-600">
                    <CheckSquare size={16} />
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-black block tracking-wider">অমিলে থাকা ব্যাংক রেকর্ড (Unmatched)</span>
                    <span className="text-xl font-mono font-black text-slate-800">
                      {unmatchedRows.length}
                    </span>
                  </div>
                  <div className="w-9 h-9 bg-slate-100 rounded-lg border border-slate-150 flex items-center justify-center text-slate-500">
                    <ArrowRightLeft size={16} />
                  </div>
                </div>
              </div>

              {/* Global Bulk Process Action Banner */}
              {matchedRequests.filter(m => m.isAmountMatch).length > 0 && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    <div className="text-indigo-600 animate-pulse flex-shrink-0">
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-indigo-950 uppercase">
                        সরাসরি মিলে যাওয়া লেনদেনসমূহ এক ক্লিকে অনুমোদন (Bulk Instant Approve)
                      </h4>
                      <p className="text-[10px] text-indigo-600 font-semibold">
                        সর্বমোট {matchedRequests.filter(m => m.isAmountMatch).length}টি পেন্ডিং রিকোয়েস্টের ট্রানজেকশন আইডি এবং এমাউন্ট একদম হুবহু ব্যাংক স্টেটমেন্টের সাথে মিলে গেছে।
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleApproveAllMatches}
                    disabled={isProcessingBulk}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-wider px-4 py-2 rounded-lg shadow-sm shadow-indigo-100 flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {isProcessingBulk ? <RefreshCw className="animate-spin" size={13} /> : <CheckCircle size={13} />}
                    ম্যাচিং সব অনুমোদন করুন (Approve All {matchedRequests.filter(m => m.isAmountMatch).length} Matches)
                  </button>
                </div>
              )}

              {isProcessingBulk && bulkStatusMsg && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-lg text-xs font-bold font-mono animate-pulse">
                  ⏳ {bulkStatusMsg}
                </div>
              )}

              {/* Match / Cross-Reference Splitted Panel */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Matched Panel */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 flex items-center justify-between">
                    <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1">
                      <CheckCircle size={14} className="text-emerald-500" />
                      মিলে যাওয়া রিকোয়েস্ট (Matched Accounts)
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full font-mono">
                      {matchedRequests.length} MATCHES
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                    {matchedRequests.length > 0 ? (
                      matchedRequests.map((match, mIdx) => (
                        <div key={mIdx} className="p-3.5 hover:bg-slate-50/50 transition-colors flex flex-col gap-2">
                          <div className="flex items-center justify-between text-xs">
                            <div>
                              <span className="font-bold text-slate-800">{match.invoice.customerName}</span>
                              {match.invoice.username && (
                                <span className="text-[10px] font-semibold text-indigo-500 ml-1">(@{match.invoice.username})</span>
                              )}
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide border ${
                              match.isAmountMatch 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}>
                              {match.isAmountMatch ? '৳ Match Perfect' : '৳ Mismatch (মূল্য অমিল)'}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-[10px] font-mono bg-slate-50 p-2 rounded-lg border border-slate-150">
                            <div>
                              <div className="text-slate-400 font-bold uppercase text-[8.5px]">System Pending Request</div>
                              <div className="text-indigo-600 font-bold">ID: {match.invoice.transactionId}</div>
                              <div className="text-slate-800 font-black">AMT: ৳{match.invoice.amount || 0}</div>
                            </div>

                            <div className="border-l border-slate-200 pl-3">
                              <div className="text-slate-400 font-bold uppercase text-[8.5px]">Bank CSV Record</div>
                              <div className="text-slate-650 font-semibold text-[10px]">ID: {match.statementTxId}</div>
                              <div className="text-slate-850 font-black">AMT: ৳{match.statementAmount}</div>
                              <div className="text-slate-400 text-[9px] truncate">Sender: {match.statementSender}</div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[9px] text-slate-450 italic">
                              Gateway: {match.invoice.paymentMethod || 'BKash'}
                            </span>
                            
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => processMatchApproval(match.invoice)}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded cursor-pointer transition-colors active:scale-95"
                              >
                                Approve
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-slate-400 text-xs font-semibold">
                        কোনো লেনদেন মিল পাওয়া যায়নি। আপনার CSV কলাম ম্যাপিং চেক করুন।
                      </div>
                    )}
                  </div>
                </div>

                {/* Unmatched Panel */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 flex items-center justify-between">
                    <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1">
                      <AlertTriangle size={14} className="text-amber-500" />
                      অমিলে থাকা ব্যাংক রেকর্ড (Unmatched Statements)
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full font-mono">
                      {unmatchedRows.length} STATEMENTS
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                    {unmatchedRows.length > 0 ? (
                      unmatchedRows.map((row, idx) => {
                        const txId = row[columnMapping.txIdIdx] || 'N/A';
                        const amountVal = Number(String(row[columnMapping.amountIdx] || '0').replace(/[^0-9.]/g, '')) || 0;
                        const sender = row[columnMapping.senderIdx] || 'N/A';

                        return (
                          <div key={idx} className="p-3 hover:bg-slate-50/50 transition-colors flex items-center justify-between text-xs font-mono">
                            <div>
                              <div className="text-indigo-600 font-black">ID: {txId}</div>
                              <div className="text-slate-400 text-[10px] mt-0.5">Sender Mobile / Detail: {sender}</div>
                            </div>

                            <div className="text-right flex items-center gap-3">
                              <div>
                                <span className="font-bold text-slate-800 block text-xs">৳{amountVal.toLocaleString()}</span>
                              </div>
                              <button
                                onClick={() => handleCreateRequestFromStatement(row)}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[9px] px-2.5 py-1 rounded font-black border border-slate-200 uppercase cursor-pointer"
                                title="ম্যানুয়ালি একটি পেমেন্ট রিকোয়েস্ট তৈরি করে ব্যালেন্স যুক্ত করুন"
                              >
                                Create Request
                              </button>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-8 text-center text-slate-400 text-xs font-semibold">
                        কোনো অমিলে থাকা ব্যাংক রেকর্ড পাওয়া যায়নি (সব ব্যাংক রেকর্ড ম্যাচ হয়েছে)।
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Data Render List */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        {filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 italic text-slate-400 text-[10px] uppercase tracking-widest font-black">
                  <th className="px-6 py-4">REQUEST DETAILS</th>
                  <th className="px-6 py-4">CUSTOMER SENDER</th>
                  <th className="px-6 py-4">PAYMENT GATWAY</th>
                  <th className="px-6 py-4 text-rose-500">REQUEST AMOUNT</th>
                  <th className="px-6 py-4">STATUS</th>
                  <th className="px-6 py-4 text-right">AUTOMATED ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 transition-all font-sans">
                    {/* ID & Date */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-mono text-xs font-black text-indigo-600 flex items-center gap-1.5 uppercase">
                          #INV-{inv.id?.substring(0, 8).toUpperCase() || inv.id || 'N/A'}
                        </span>
                        <span className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                          <Calendar size={11} />
                          {inv.createdAt || inv.date || 'N/A'}
                        </span>
                        {inv.type && (
                          <span className="inline-block shrink-0 mt-1 pb-0.5 max-w-max px-1.5 text-[8px] font-black uppercase text-purple-600 bg-purple-50 rounded border border-purple-100 italic">
                            PURPOSE: {inv.type}
                          </span>
                        )}
                        {inv.appName && (
                          <div className="mt-1.5 p-1.5 bg-slate-50 border border-slate-150/60 rounded flex flex-col gap-0.5 text-[9px] font-bold text-slate-600 max-w-sm">
                            <div>APP: <span className="text-indigo-600 font-black">{inv.appName}</span></div>
                            {inv.packageName && <div className="font-mono text-[8px] text-slate-400 break-all select-all">PKG: {inv.packageName}</div>}
                            <div className="flex flex-wrap gap-1 mt-1 text-[8px]">
                              {inv.protocol && <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 font-extrabold px-1 py-0.5 rounded leading-none">{inv.protocol}</span>}
                              {inv.appsQuality && <span className="bg-rose-50 border border-rose-100 text-rose-600 font-black px-1 py-0.5 rounded leading-none uppercase">{inv.appsQuality}</span>}
                              {inv.appsTrying && <span className="bg-teal-50 border border-teal-100 text-teal-600 font-black px-1 py-0.5 rounded leading-none uppercase">{inv.appsTrying}</span>}
                            </div>
                          </div>
                        )}
                        {inv.panelName && (
                          <div className="mt-1.5 p-1.5 bg-slate-50 border border-slate-150/60 rounded flex flex-col gap-0.5 text-[9px] font-bold text-slate-600 max-w-sm text-left">
                            <div>PANEL: <span className="text-teal-650 font-black uppercase">{inv.panelName}</span></div>
                            {inv.panelUrl && <div className="font-mono text-[8.5px] text-slate-450 truncate">URL: {inv.panelUrl}</div>}
                            <div className="flex flex-wrap gap-1 mt-1 text-[8px] items-center">
                              <span className="bg-slate-100 text-slate-600 px-1 py-0.5 rounded font-extrabold leading-none">{inv.panelDuration}</span>
                              {inv.panelType && <span className="bg-teal-50 border border-teal-100 text-teal-650 font-black px-1 py-0.5 rounded leading-none uppercase">{inv.panelType}</span>}
                            </div>
                          </div>
                        )}
                        {inv.decoderUsername && (
                          <div className="mt-1.5 p-1.5 bg-slate-50 border border-slate-150/60 rounded flex flex-col gap-0.5 text-[9px] font-bold text-slate-600 max-w-sm text-left">
                            <div>DECODER USER: <span className="text-amber-600 font-black uppercase">{inv.decoderUsername}</span></div>
                            <div className="flex flex-wrap gap-1 mt-1 text-[8px] items-center">
                              <span className="bg-slate-100 text-slate-600 px-1 py-0.5 rounded font-extrabold leading-none">{inv.decoderDuration}</span>
                              {inv.decoderUserType && <span className="bg-amber-50 border border-amber-100 text-amber-600 font-black px-1 py-0.5 rounded leading-none uppercase">{inv.decoderUserType}</span>}
                            </div>
                          </div>
                        )}
                        {inv.serviceDetails && (
                          <div className="mt-1.5 p-1.5 bg-slate-50 border border-slate-150/60 rounded flex flex-col gap-0.5 text-[9px] font-bold text-slate-600 max-w-sm text-left">
                            <div className="text-indigo-600 font-black tracking-wider text-[8px] uppercase">SERVICE DETAILS:</div>
                            <div className="whitespace-pre-wrap font-sans text-slate-800 text-[9.5px] mt-1 bg-white p-1 rounded border border-slate-100 font-semibold">{inv.serviceDetails}</div>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Customer Sender details */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col text-xs">
                        <span className="font-bold text-slate-900">{inv.customerName}</span>
                        {inv.username && (
                          <span className="text-[10px] font-bold text-indigo-500 mt-0.5 flex items-center gap-0.5">
                            <UserIcon size={11} />
                            @{inv.username}
                          </span>
                        )}
                        {(inv.customerNumber || inv.phone) && (
                          <span className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-0.5">
                            <Phone size={10} />
                            {inv.customerNumber || inv.phone}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Method & Txn ID */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col text-xs">
                        <span className="font-black text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[10px] w-max uppercase tracking-wider">
                          {inv.paymentMethod || inv.method || 'N/A'}
                        </span>
                        {inv.transactionId && (
                          <div className="flex items-center gap-1.5 mt-1.5 font-mono text-xs text-indigo-600">
                            <span className="font-black bg-indigo-50/70 border border-indigo-100 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wide">
                              ID: {inv.transactionId}
                            </span>
                            <button
                              onClick={() => handleCopy(inv.transactionId)}
                              className="text-slate-400 hover:text-indigo-600 p-1 rounded hover:bg-slate-100 transition-colors"
                              title="কপি করুন"
                            >
                              {copiedId === inv.transactionId ? (
                                <Check size={12} className="text-emerald-500" />
                              ) : (
                                <Copy size={12} />
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="px-6 py-4">
                      <span className="text-sm font-black text-rose-600 font-mono">
                        ৳{(inv.amount || 0).toLocaleString()}
                      </span>
                    </td>

                    {/* Status badge */}
                    <td className="px-6 py-4 text-xs">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                        inv.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        inv.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse' :
                        'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {inv.status === 'paid' ? 'Paid (Approved)' : inv.status === 'pending' ? 'Pending' : 'Rejected'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 flex-wrap sm:flex-nowrap">
                        {inv.status === 'pending' ? (
                          <>
                            {/* Notify Button */}
                            <button
                              onClick={() => handleWhatsAppNotify(inv)}
                              className="bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                              title="গ্রাহককে হোয়াটসঅ্যাপে নোটিফিকেশন পাঠান"
                            >
                              <MessageSquare size={13} />
                              জানান (Notify)
                            </button>

                            {/* Approve Button */}
                            <button
                              onClick={() => handleApproveRequest(inv)}
                              className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-emerald-700 active:scale-95 transition-all shadow-sm shadow-emerald-100 cursor-pointer"
                              title="অনুমোদন করুন (Approve)"
                            >
                              <Check size={13} />
                              অনুমোদন
                            </button>

                            {/* Reject Button */}
                            <button
                              onClick={() => handleRejectRequest(inv)}
                              className="bg-rose-100 hover:bg-rose-600 hover:text-white text-rose-700 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                              title="প্রত্যাখ্যান করুন (Reject)"
                            >
                              <X size={13} />
                              বাতিল
                            </button>
                          </>
                        ) : (
                          <span className="text-[11px] font-bold text-slate-400 italic mr-2">
                            {inv.status === 'paid' ? 'Verified & Credited' : 'Closed / Rejected'}
                          </span>
                        )}

                        {/* Edit Button */}
                        <button
                          onClick={() => setEditingInvoice(inv)}
                          className="bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-200 px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                          title="এডিটর ওপেন করুন"
                        >
                          <Edit size={13} />
                          এডিট
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteInvoice(inv)}
                          className="bg-rose-50 hover:bg-rose-605 text-rose-600 hover:text-white border border-rose-200 px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                          title="ডিলিট করুন"
                        >
                          <Trash2 size={13} />
                          ডিলিট
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 px-4">
            <div className="w-12 h-12 bg-slate-50 border border-slate-100 text-slate-400 rounded-xl flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={24} />
            </div>
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest">রিকোয়েস্ট পাওয়া যায়নি</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              এই ফিল্টারে গ্রাহকদের পাঠানো কোনো লেনদেন যাচাইকরণ রিকোয়েস্ট পাওয়া যায়নি।
            </p>
          </div>
        )}
      </div>

      {/* Edit Payment Request Modal */}
      {editingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[2rem] border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden"
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-150 flex items-center justify-center text-indigo-600">
                  <Edit size={16} />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider">রিকোয়েস্ট এডিট প্যানেল</h3>
                  <p className="text-[10px] text-slate-400 font-semibold font-mono uppercase">ID: {editingInvoice.id}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingInvoice(null)}
                className="w-7 h-7 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full flex items-center justify-center cursor-pointer transition-colors"
              >
                <X size={14} strokeWidth={2.5} />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleUpdateInvoiceDetails} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Customer Name */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">নাম (Customer Name)</label>
                  <input
                    type="text"
                    required
                    value={editingInvoice.customerName || ''}
                    onChange={(e) => setEditingInvoice({ ...editingInvoice, customerName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-250 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none"
                  />
                </div>

                {/* Customer Number */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">মোবাইল (Phone Number)</label>
                  <input
                    type="text"
                    required
                    value={editingInvoice.customerNumber || editingInvoice.phone || ''}
                    onChange={(e) => setEditingInvoice({ ...editingInvoice, customerNumber: e.target.value, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-250 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Amount */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">পরিমাণ (BDT Amount)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={editingInvoice.amount || 0}
                    onChange={(e) => setEditingInvoice({ ...editingInvoice, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-250 rounded-xl text-xs font-bold font-mono focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none"
                  />
                </div>

                {/* Transaction ID */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">লেনদেন আইডি (Transaction ID)</label>
                  <input
                    type="text"
                    required
                    value={editingInvoice.transactionId || ''}
                    onChange={(e) => setEditingInvoice({ ...editingInvoice, transactionId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-250 rounded-xl text-xs font-bold font-mono text-indigo-650 tracking-wide focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Payment Method */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">পেমেন্ট মেথড (Gateway Method)</label>
                  <select
                    value={editingInvoice.paymentMethod || ''}
                    onChange={(e) => setEditingInvoice({ ...editingInvoice, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-250 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none bg-white cursor-pointer"
                  >
                    <option value="bkash">bKash</option>
                    <option value="bKash Personal">bKash Personal</option>
                    <option value="bKash Agent">bKash Agent</option>
                    <option value="nagad">Nagad</option>
                    <option value="rocket">Rocket</option>
                    <option value="upay">Upay</option>
                    <option value="Imported Statement">Imported Statement</option>
                  </select>
                </div>

                {/* Status */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">রিকোয়েস্ট স্ট্যাটাস (Status)</label>
                  <select
                    value={editingInvoice.status || 'pending'}
                    onChange={(e) => setEditingInvoice({ ...editingInvoice, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-250 rounded-xl text-xs font-black uppercase focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none bg-white cursor-pointer"
                  >
                    <option value="pending" className="text-amber-600 font-bold">Pending (মূলতুবি)</option>
                    <option value="paid" className="text-emerald-600 font-bold">Paid (অনুমোদিত)</option>
                    <option value="rejected" className="text-rose-600 font-bold">Rejected (বাতিল)</option>
                  </select>
                </div>
              </div>

              {/* Note */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">নোট বা মন্তব্য (Remarks Note)</label>
                <textarea
                  value={editingInvoice.note || ''}
                  onChange={(e) => setEditingInvoice({ ...editingInvoice, note: e.target.value })}
                  rows={2}
                  placeholder="এডিটের কারণ বা অন্যান্য কাস্টম নোট..."
                  className="w-full px-3 py-2 border border-slate-250 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingInvoice(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black uppercase tracking-wider px-4 py-2.5 rounded-xl cursor-pointer active:scale-95 transition-all"
                >
                  বাতিল করুন
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-sm shadow-indigo-100 cursor-pointer active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <Check size={14} strokeWidth={2.5} />
                  সংরক্ষণ করুন (Save Changes)
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* WhatsApp Choose App Type Modal */}
      <Modal
        isOpen={!!whatsAppModalInvoice}
        onClose={() => setWhatsAppModalInvoice(null)}
        title="গ্রাহক হোয়াটসঅ্যাপ নোটিফিকেশন (Select WhatsApp Type)"
      >
        {whatsAppModalInvoice && (() => {
          const urls = getInvoiceWhatsAppUrls(whatsAppModalInvoice);
          return (
            <div className="space-y-4 py-2">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 text-left">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Recipient Details</p>
                <p className="text-sm font-black text-slate-800">{whatsAppModalInvoice.customerName || 'গ্রাহক'}</p>
                <p className="text-xs text-slate-500 font-mono mt-0.5">📞 Number: {urls.phone}</p>
                <p className="text-xs text-indigo-600 font-bold mt-1">💳 Amount: ৳{(whatsAppModalInvoice.amount || 0).toLocaleString()}</p>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                কোন হোয়াটসঅ্যাপ অ্যাপ দিয়ে মেসেজটি পাঠাতে চান? অনুগ্রহ করে নিচে থেকে একটি নির্বাচন করুন:
              </p>

              <div className="grid grid-cols-1 gap-3">
                {/* 1. Normal/Personal WhatsApp */}
                <a
                  href={urls.regular}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setWhatsAppModalInvoice(null)}
                  className="flex items-center justify-between p-4 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-all hover:scale-[1.01] text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm shadow-emerald-200">
                      <svg className="w-6 h-6 fill-white" viewBox="0 0 24 24">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.717-1.458L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.864.004-2.637-1.019-5.115-2.88-6.978C16.31 1.9 13.83 1.026 11.2 1.026c-5.433 0-9.858 4.42-9.863 9.864-.001 1.716.452 3.39 1.31 4.869l-.999 3.648 3.74-.981l-.421-.21zm11.309-3.874c-.312-.156-1.848-.911-2.126-1.012-.278-.102-.482-.153-.684.152-.202.304-.783 1.012-.962 1.214-.178.203-.357.228-.669.071-1.581-.789-2.731-1.341-3.791-3.155-.28-.481.28-.446.804-1.493.087-.178.044-.33-.022-.456-.066-.127-.552-1.332-.757-1.826-.2-.48-.403-.414-.552-.422-.143-.007-.306-.007-.47-.007-.163 0-.43.061-.655.305-.224.244-.856.837-.856 2.04 0 1.203.878 2.37 1.0 2.532.122.163 1.725 2.636 4.18 3.693.585.251 1.04.4 1.398.513.588.187 1.124.161 1.547.098.472-.071 1.484-.607 1.696-1.164.212-.557.212-1.037.149-1.139-.063-.102-.23-.153-.541-.309z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-black text-emerald-800">হোয়াটসঅ্যাপ (WhatsApp Personal)</p>
                      <p className="text-xs text-emerald-600 font-medium">সাধারণ হোয়াটসঅ্যাপ অ্যাকাউন্ট থেকে পাঠান</p>
                    </div>
                  </div>
                  <Check size={16} className="text-emerald-600 block shrink-0" />
                </a>

                {/* 2. WhatsApp Business */}
                <a
                  href={urls.businessFallback}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    setWhatsAppModalInvoice(null);
                    if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
                      e.preventDefault();
                      const isAndroid = /Android/i.test(navigator.userAgent);
                      const deepLink = isAndroid 
                        ? `intent://send?phone=${urls.phone}&text=${encodeURIComponent(urls.message)}#Intent;package=com.whatsapp.w4b;scheme=whatsapp;end`
                        : `whatsapp-business://send?phone=${urls.phone}&text=${encodeURIComponent(urls.message)}`;
                      
                      const start = Date.now();
                      window.location.href = deepLink;
                      setTimeout(() => {
                        if (Date.now() - start < 1500) {
                          window.open(urls.businessFallback, '_blank');
                        }
                      }, 1000);
                    }
                  }}
                  className="flex items-center justify-between p-4 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl transition-all hover:scale-[1.01] text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm shadow-teal-200">
                      <svg className="w-6 h-6 fill-white" viewBox="0 0 24 24">
                        <path d="M12.004.01C5.39.01.055 5.348.053 11.961c-.001 2.112.551 4.17 1.6 5.979l-1.7 6.208 6.357-1.666c1.745.952 3.71 1.453 5.7 1.455h.005c6.612 0 11.95-5.337 11.954-11.953.002-3.203-1.241-6.216-3.504-8.483C18.214 1.251 15.204.011 12.004.01zm4.721 16.32c-.328.151-1.942.923-2.234 1.025-.292.103-.507.155-.719-.153-.213-.309-.824-1.029-1.011-1.236-.188-.206-.376-.231-.703-.081-1.66.8-2.868 1.36-3.982 3.203-.294.49-.074.453.473 1.516.091.181.046.336-.023.464-.069.129-.58 1.353-.795 1.854-.21.488-.423.421-.58.429-.15-.008-.322-.008-.495-.008-.172 0-.452.062-.688.31-.236.248-.9.85-.9 2.071 0 1.222.923 2.406 1.051 2.571.128.165 1.812 2.676 4.39 3.75.614.255 1.092.407 1.468.521.618.19 1.18.163 1.625.099.496-.072 1.558-.616 1.782-1.182.223-.566.223-1.053.157-1.156-.066-.103-.242-.155-.569-.314z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-black text-teal-800">হোয়াটসঅ্যাপ বিজনেস (WhatsApp Business)</p>
                      <p className="text-xs text-teal-600 font-medium">বিজনেস হোয়াটসঅ্যাপ থেকে মেসেজ পাঠান</p>
                    </div>
                  </div>
                  <Check size={16} className="text-teal-600 block shrink-0" />
                </a>
              </div>
            </div>
          );
        })()}
      </Modal>

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
            if (cleaned.startsWith('0') && cleaned.length === 11) {
              cleaned = '88' + cleaned;
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
    </div>
  );
}
