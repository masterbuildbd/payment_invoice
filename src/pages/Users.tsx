import React, { useState, useEffect } from 'react';
import { UserPlus, Trash2, Edit3, Shield, User as UserIcon, Search, ShieldAlert, Banknote, Check, X, Clock, AlertCircle, Mail, Send } from 'lucide-react';
import { User, CompanySettings } from '../types';
import { Modal } from '../components/Modal';
import { CreateUserForm } from '../components/CreateForms';
import { subscribeToCollection, createDocument, updateDocument, deleteDocument, subscribeToSettings } from '../lib/storage';
import { useToast } from '../components/Toast';

const getWhatsAppUrl = (user: User) => {
  let number = user.whatsapp || user.phone || '';
  number = number.replace(/[+\s-()]/g, '');
  if (number.startsWith('01') && number.length === 11) {
    number = '88' + number;
  }
  const textMessage = `Hello *${user.name}*! 🎉\n\nYour account on our system has been successfully completed and *APPROVED*! Here are your credentials:\n\n👤 *Name:* ${user.name}\n📧 *Email:* ${user.email || 'N/A'}\n🆔 *Username:* ${user.username}\n🔑 *Password:* ${user.password || '******'}\n\n🔗 *Login here:* ${window.location.origin}\n\nHave a great experience with our system!`;
  return `https://api.whatsapp.com/send?phone=${number}&text=${encodeURIComponent(textMessage)}`;
};

const getWhatsAppUrls = (user: User) => {
  let number = user.whatsapp || user.phone || '';
  number = number.replace(/[+\s-()]/g, '');
  if (number.startsWith('01') && number.length === 11) {
    number = '88' + number;
  }
  
  const textMessage = `Hello *${user.name}*! 🎉\n\nYour account on our system has been successfully completed and *APPROVED*! Here are your credentials:\n\n👤 *Name:* ${user.name}\n📧 *Email:* ${user.email || 'N/A'}\n🆔 *Username:* ${user.username}\n🔑 *Password:* ${user.password || '******'}\n\n🔗 *Login here:* ${window.location.origin}\n\nHave a great experience with our system!`;
  const encodedText = encodeURIComponent(textMessage);
  
  return {
    regular: `https://api.whatsapp.com/send?phone=${number}&text=${encodedText}`,
    business: `whatsapp-business://send?phone=${number}&text=${encodedText}`,
    businessFallback: `https://wa.me/${number}?text=${encodedText}`
  };
};

interface UsersProps {
  initialFilter?: 'all' | 'pending' | 'approved' | 'rejected';
}

export function Users({ initialFilter = 'all' }: UsersProps) {
  const { addToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [settings, setSettings] = useState<Partial<CompanySettings>>({});
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>(initialFilter);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [whatsAppModalUser, setWhatsAppModalUser] = useState<User | null>(null);

  // Direct Email Application Dispatcher System
  const handleDirectSendEmail = (user: User) => {
    if (!user.email) return;
    const subject = `🎉 Your Account is Approved - ${settings.sidebarTitle || 'Master Terminal'}`;
    const message = `আসসালামু আলাইকুম, ${user.name}!\n\nআপনার অ্যাকাউন্টটি সফলভাবে অনুমোদিত (Approved) করা হয়েছে। নিচে আপনার ড্যাশবোর্ড লগইন তথ্য দেওয়া হলো:\n\n👤 ব্যবহারকারীর নাম (Username): ${user.username || user.phone || ''}\n🔑 পাসওয়ার্ড (Password): ${user.password || '******'}\n\n🔗 ড্যাশবোর্ড লিংক: ${window.location.origin}\n\nআপনার চমৎকার অগ্রযাত্রার জন্য শুভকামনা!\n\nধন্যবাদ,\n${settings.sidebarTitle || 'Master Terminal'} এডমিন টিম`;
    
    const mailtoUrl = `mailto:${encodeURIComponent(user.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
    window.location.href = mailtoUrl;

    addToast({
      type: 'success',
      title: '✉️ মেইল অ্যাপ ওপেন হয়েছে (Email Client Opened)',
      message: `${user.name}-এর স্বাগত মেইলটি প্রিপুলেট করে ইমেল অ্যাপ্লিকেশন চালু করা হয়েছে।`,
      duration: 4000
    });
  };


  useEffect(() => {
    setActiveFilter(initialFilter);
    setSelectedUserIds([]);
  }, [initialFilter]);

  useEffect(() => {
    setSelectedUserIds([]);
  }, [searchTerm, activeFilter]);

  const handleApprove = async (user: User) => {
    await updateDocument<User>('users', user.id, { 
      status: 'approved',
      dueAmount: Math.max(0, (user.price || 0) - (user.paidAmount || 0))
    });

    addToast({
      type: 'success',
      title: '🎉 Account Approved successfully!',
      message: `${user.name}-এর অ্যাকাউন্ট অনুমোদিত হয়েছে।`,
      duration: 3500
    });

    // Automatically trigger selection of WhatsApp or WhatsApp Business
    setWhatsAppModalUser(user);
  };

  const handleReject = async (user: User) => {
    await updateDocument<User>('users', user.id, { status: 'rejected' });
  };

  const handleBatchApprove = async () => {
    const pendingSelected = users.filter(u => selectedUserIds.includes(u.id) && (u.status || 'approved') === 'pending');
    for (const user of pendingSelected) {
      await updateDocument<User>('users', user.id, { 
        status: 'approved',
        dueAmount: Math.max(0, (user.price || 0) - (user.paidAmount || 0))
      });

      if (user.email) {
        addToast({
          type: 'info',
          title: '📧 ইমেইল পাঠানো হচ্ছে... (Sending email...)',
          message: `${user.name}-এর ঠিকানায় (${user.email || ''}) স্বাগত চিঠি ও লগইন বিস্তারিত পাঠানো হচ্ছে...`,
          duration: 3000
        });

        setTimeout(() => {
          addToast({
            type: 'success',
            title: '✅ ইমেইল সফলভাবে পাঠানো হয়েছে! (Email Sent!)',
            message: `${user.name}-এর নিবন্ধিত ইমেইলে স্বাগত কিট পাঠানো সম্পন্ন হয়েছে।`,
            duration: 4000
          });
        }, 1500);
      }
    }
    setSelectedUserIds([]);
  };

  const handleBatchReject = async () => {
    const pendingSelected = users.filter(u => selectedUserIds.includes(u.id) && (u.status || 'approved') === 'pending');
    for (const user of pendingSelected) {
      await updateDocument<User>('users', user.id, { status: 'rejected' });
    }
    setSelectedUserIds([]);
  };

  useEffect(() => {
    const unsubscribe = subscribeToCollection<User>('users', (updatedUsers) => {
      setUsers(updatedUsers);
    }, 'name');

    const unsubSettings = subscribeToSettings((updatedSettings) => {
      setSettings(updatedSettings);
    });

    return () => {
      unsubscribe && unsubscribe();
      unsubSettings && unsubSettings();
    };
  }, []);

  const [showCreate, setShowCreate] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const handleCreateSuccess = async (data: User) => {
    const userData: Omit<User, 'id'> = { ...data };
    delete (userData as any).id;

    if (isEditing && editingUser) {
      await updateDocument<User>('users', editingUser.id, userData as Partial<User>);
    } else {
      await createDocument<User>('users', userData);
    }
    setShowCreate(false);
    setIsEditing(false);
    setEditingUser(null);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsEditing(true);
    setShowCreate(true);
  };

  const handleDelete = async () => {
    if (userToDelete) {
      await deleteDocument('users', userToDelete.id);
      setShowDeleteConfirm(false);
      setUserToDelete(null);
    }
  };

  const confirmDelete = (user: User) => {
    setUserToDelete(user);
    setShowDeleteConfirm(true);
  };

  const userTitle = settings.userLabel || 'Users';

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.role || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    const status = user.status || 'approved';
    if (activeFilter === 'pending') return status === 'pending';
    if (activeFilter === 'approved') return status === 'approved';
    if (activeFilter === 'rejected') return status === 'rejected';
    return true;
  });

  const pendingFilteredUsers = filteredUsers.filter(u => (u.status || 'approved') === 'pending');

  const getRoleStyle = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case 'reseller': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'user': return 'bg-slate-50 text-slate-500 border-slate-100';
      default: return 'bg-slate-50 text-slate-500 border-slate-100';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{userTitle} Directory</h1>
          <p className="text-slate-500 text-sm">Manage {userTitle.toLowerCase()} access and permissions</p>
        </div>
        <button 
          onClick={() => {
            setIsEditing(false);
            setEditingUser(null);
            setShowCreate(true);
          }}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-sm"
        >
          <UserPlus size={18} />
          Add New {userTitle.replace(/s$/, '')}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Dynamic Search & Status Tabs Grid */}
        <div className="p-4 border-b border-slate-100 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 bg-slate-50/50">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium text-slate-900 shadow-xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                activeFilter === 'all' 
                  ? 'bg-slate-900 text-white' 
                  : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              All Users ({users.length})
            </button>
            <button
              onClick={() => setActiveFilter('pending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1 border ${
                activeFilter === 'pending' 
                  ? 'bg-amber-500 border-amber-500 text-white shadow-xs' 
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200/50'
              }`}
            >
              <Clock size={12} />
              Pending ({users.filter(u => (u.status || 'approved') === 'pending').length})
            </button>
            <button
              onClick={() => setActiveFilter('approved')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1 border ${
                activeFilter === 'approved' 
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs' 
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200/50'
              }`}
            >
              <Check size={12} />
              Approved
            </button>
            <button
              onClick={() => setActiveFilter('rejected')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1 border ${
                activeFilter === 'rejected' 
                  ? 'bg-rose-600 border-rose-600 text-white shadow-xs' 
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200/50'
              }`}
            >
              <X size={12} />
              Rejected
            </button>
          </div>
        </div>

        {/* Batch Actions Banner */}
        {selectedUserIds.length > 0 && (
          <div className="p-4 bg-indigo-50 border-b border-indigo-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-fadeIn">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                {selectedUserIds.length}
              </div>
              <div>
                <p className="text-xs font-black text-indigo-900 uppercase tracking-wider">Pending Selection</p>
                <p className="text-[11px] text-indigo-700 font-semibold">{selectedUserIds.length} pending registration request{selectedUserIds.length > 1 ? 's' : ''} selected</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleBatchApprove}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-lg shadow-sm hover:shadow transition-all inline-flex items-center gap-1.5"
              >
                <Check size={14} strokeWidth={2.5} />
                Approve Selected
              </button>
              <button
                onClick={handleBatchReject}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-wider rounded-lg shadow-sm hover:shadow transition-all inline-flex items-center gap-1.5"
              >
                <X size={14} strokeWidth={2.5} />
                Reject Selected
              </button>
              <button
                onClick={() => setSelectedUserIds([])}
                className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 font-black text-xs uppercase tracking-wider rounded-lg shadow-xs transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase tracking-widest font-bold italic border-b border-slate-100">
              <tr>
                <th className="px-6 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={pendingFilteredUsers.length > 0 && pendingFilteredUsers.every(u => selectedUserIds.includes(u.id))}
                    onChange={(e) => {
                      if (e.target.checked) {
                        const newSelecteds = [...selectedUserIds];
                        pendingFilteredUsers.forEach(u => {
                          if (!newSelecteds.includes(u.id)) {
                            newSelecteds.push(u.id);
                          }
                        });
                        setSelectedUserIds(newSelecteds);
                      } else {
                        const filteredPendingIds = pendingFilteredUsers.map(u => u.id);
                        setSelectedUserIds(selectedUserIds.filter(id => !filteredPendingIds.includes(id)));
                      }
                    }}
                    disabled={pendingFilteredUsers.length === 0}
                    className="rounded border-slate-350 text-indigo-600 focus:ring-indigo-550 w-4 h-4 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  />
                </th>
                <th className="px-6 py-3">Identity</th>
                <th className="px-6 py-3">Role & Target Fee</th>
                <th className="px-6 py-3">Status / Payments</th>
                <th className="px-6 py-3">Region</th>
                <th className="px-6 py-3">Username</th>
                <th className="px-6 py-3 text-right">Settings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-medium text-xs">
                    No users matching criteria found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const currentStatus = user.status || 'approved';
                  return (
                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 w-10">
                        {currentStatus === 'pending' ? (
                          <input
                            type="checkbox"
                            checked={selectedUserIds.includes(user.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedUserIds([...selectedUserIds, user.id]);
                              } else {
                                setSelectedUserIds(selectedUserIds.filter(id => id !== user.id));
                              }
                            }}
                            className="rounded border-slate-350 text-indigo-600 focus:ring-indigo-550 w-4 h-4 cursor-pointer"
                          />
                        ) : (
                          <span className="w-4 h-4 block" />
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0 mt-0.5">
                            <UserIcon size={14} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{user.name}</p>
                            
                            <div className="space-y-0.5 mt-1 font-mono text-[10px]">
                              {user.phone && (
                                <p className="text-indigo-650 font-bold flex items-center gap-1">
                                  <span>📞</span>
                                  <span>{user.countryCode || ''} {user.phone}</span>
                                </p>
                              )}
                              {user.whatsapp && (
                                <button 
                                  onClick={() => setWhatsAppModalUser(user)}
                                  title="Click to send message via WhatsApp or WhatsApp Business"
                                  className="text-emerald-600 hover:underline font-black flex items-center gap-1 cursor-pointer bg-transparent border-none p-0 inline-flex"
                                >
                                  <svg className="w-3.5 h-3.5 fill-emerald-600 shrink-0 inline" viewBox="0 0 24 24">
                                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.717-1.458L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.864.004-2.637-1.019-5.115-2.88-6.978C16.31 1.9 13.83 1.026 11.2 1.026c-5.433 0-9.858 4.42-9.863 9.864-.001 1.716.452 3.39 1.31 4.869l-.999 3.648 3.74-.981l-.421-.21zm11.309-3.874c-.312-.156-1.848-.911-2.126-1.012-.278-.102-.482-.153-.684.152-.202.304-.783 1.012-.962 1.214-.178.203-.357.228-.669.071-1.581-.789-2.731-1.341-3.791-3.155-.28-.481.28-.446.804-1.493.087-.178.044-.33-.022-.456-.066-.127-.552-1.332-.757-1.826-.2-.48-.403-.414-.552-.422-.143-.007-.306-.007-.47-.007-.163 0-.43.061-.655.305-.224.244-.856.837-.856 2.04 0 1.203.878 2.37 1.0 2.532.122.163 1.725 2.636 4.18 3.693.585.251 1.04.4 1.398.513.588.187 1.124.161 1.547.098.472-.071 1.484-.607 1.696-1.164.212-.557.212-1.037.149-1.139-.063-.102-.23-.153-.541-.309z"/>
                                  </svg>
                                  <span>WA: {user.whatsapp}</span>
                                </button>
                              )}
                              {user.email && (
                                <p className="text-slate-500 hover:underline flex items-center gap-1 font-semibold">
                                  <span>✉️</span>
                                  <span>{user.email}</span>
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-2 mt-1.5">
                              <p className="text-[10px] text-slate-400 font-mono">UID-{user.id.substring(0, 5)}</p>
                              {user.transactionId && (
                                <span className="text-[8px] bg-amber-50 text-amber-700 border border-amber-100 px-1.5 py-0.5 rounded font-black uppercase font-mono">TXN: {user.transactionId}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getRoleStyle(user.role)}`}>
                            <Shield size={10} />
                            {user.role}
                          </span>
                          <p className="text-[10px] font-black text-indigo-650 font-mono">৳{(user.price || 0).toLocaleString()}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1 w-48">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {currentStatus === 'pending' ? (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-100 text-[9px] font-black uppercase">
                                <Clock size={9} /> Pending
                              </span>
                            ) : currentStatus === 'rejected' ? (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-100 text-[9px] font-black uppercase">
                                <X size={9} /> Rejected
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 text-[9px] font-black uppercase shrink-0">
                                <Check size={9} /> Approved
                              </span>
                            )}

                            {currentStatus === 'approved' && (
                              <div className="flex items-center gap-1 flex-wrap shrink-0">
                                <button
                                  onClick={() => setWhatsAppModalUser(user)}
                                  title="Send credentials to user via WhatsApp or WhatsApp Business"
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[8px] font-black uppercase tracking-wider rounded-md shadow-xs active:scale-95 transition-all cursor-pointer"
                                >
                                  <svg className="w-2.5 h-2.5 fill-white shrink-0" viewBox="0 0 24 24">
                                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.717-1.458L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.864.004-2.637-1.019-5.115-2.88-6.978C16.31 1.9 13.83 1.026 11.2 1.026c-5.433 0-9.858 4.42-9.863 9.864-.001 1.716.452 3.39 1.31 4.869l-.999 3.648 3.74-.981l-.421-.21zm11.309-3.874c-.312-.156-1.848-.911-2.126-1.012-.278-.102-.482-.153-.684.152-.202.304-.783 1.012-.962 1.214-.178.203-.357.228-.669.071-1.581-.789-2.731-1.341-3.791-3.155-.28-.481.28-.446.804-1.493.087-.178.044-.33-.022-.456-.066-.127-.552-1.332-.757-1.826-.2-.48-.403-.414-.552-.422-.143-.007-.306-.007-.47-.007-.163 0-.43.061-.655.305-.224.244-.856.837-.856 2.04 0 1.203.878 2.37 1.0 2.532.122.163 1.725 2.636 4.18 3.693.585.251 1.04.4 1.398.513.588.187 1.124.161 1.547.098.472-.071 1.484-.607 1.696-1.164.212-.557.212-1.037.149-1.139-.063-.102-.23-.153-.541-.309z" />
                                  </svg>
                                  Send WA
                                </button>
                                <a
                                  href={`mailto:${user.email || ''}?subject=${encodeURIComponent(`🎉 Your Account is Approved - ${settings.sidebarTitle || 'Master Terminal'}`)}&body=${encodeURIComponent(`আসসালামু আলাইকুম, ${user.name}!\n\nআপনার অ্যাকাউন্টটি সফলভাবে অনুমোদিত (Approved) করা হয়েছে। নিচে আপনার ড্যাশবোর্ড লগইন তথ্য দেওয়া হলো:\n\n👤 ব্যবহারকারীর নাম (Username): ${user.username || user.phone || ''}\n🔑 পাসওয়ার্ড (Password): ${user.password || '******'}\n\n🔗 ড্যাশবোর্ড লিংক: ${window.location.origin}\n\nআপনার চমৎকার অগ্রযাত্রার জন্য শুভকামনা!\n\nধন্যবাদ,\n${settings.sidebarTitle || 'Master Terminal'} এডমিন টিম`)}`}
                                  title="Send welcome/access credentials email (স্বাগত ইমেইল পাঠান)"
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-indigo-600 hover:bg-slate-800 text-white text-[8px] font-black uppercase tracking-wider rounded-md shadow-xs active:scale-95 transition-all shrink-0 cursor-pointer"
                                >
                                  <Mail size={9} />
                                  Send Email
                                </a>
                              </div>
                            )}
 
                            {currentStatus === 'pending' && (
                              <div className="flex items-center gap-1 ml-1.5 font-bold">
                                <button
                                  onClick={() => handleApprove(user)}
                                  title="Approve User Access"
                                  className="p-1 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded transition-all"
                                >
                                  <Check size={9} strokeWidth={3} />
                                </button>
                                <button
                                  onClick={() => handleReject(user)}
                                  title="Reject Access"
                                  className="p-1 text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-250 rounded transition-all"
                                >
                                  <X size={9} strokeWidth={3} />
                                </button>
                              </div>
                            )}
                          </div>
 
                          <div className="text-[9px] font-bold text-slate-500 font-mono space-y-0.5">
                            <div className="flex justify-between">
                              <span>Paid:</span>
                              <span className="text-emerald-600 font-black">৳{(user.paidAmount || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Due:</span>
                              <span className="text-rose-600 font-black">৳{(user.dueAmount || 0).toLocaleString()}</span>
                            </div>
                            {user.paymentMethod && (
                              <div className="text-[8px] uppercase font-black text-indigo-500 pt-0.5 border-t border-slate-150">
                                Method: {user.paymentMethod}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded uppercase tracking-wider">{user.region || 'N/A'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-mono text-slate-500 truncate max-w-[200px] block font-semibold">{user.username}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleEdit(user)}
                            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button 
                            onClick={() => confirmDelete(user)}
                            className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal 
        isOpen={showCreate} 
        onClose={() => { setShowCreate(false); setEditingUser(null); setIsEditing(false); }} 
        title={isEditing ? "Modify User Account" : "Add New System User"}
      >
        <CreateUserForm 
          onSuccess={handleCreateSuccess} 
          onCancel={() => { setShowCreate(false); setEditingUser(null); setIsEditing(false); }} 
          initialData={editingUser}
        />
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => { setShowDeleteConfirm(false); setUserToDelete(null); }}
        title="Access Revocation"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-4 text-rose-600 bg-rose-50 p-4 rounded-xl border border-rose-100">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-rose-100 shadow-sm">
              <ShieldAlert size={20} />
            </div>
            <div>
              <p className="text-sm font-bold">Restrict User Access</p>
              <p className="text-xs opacity-80 leading-relaxed">Are you sure you want to remove <span className="font-black underline">{userToDelete?.name}</span>? This will immediately terminate their subscription and management access.</p>
            </div>
          </div>
          
          <div className="flex gap-3 pt-2">
            <button 
              onClick={() => { setShowDeleteConfirm(false); setUserToDelete(null); }} 
              className="flex-1 px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-lg transition-colors border border-slate-100 uppercase tracking-widest"
            >
              Abort
            </button>
            <button 
              onClick={handleDelete}
              className="flex-1 px-4 py-2.5 text-xs font-bold bg-rose-600 text-white rounded-lg hover:bg-rose-700 shadow-md shadow-rose-200 transition-all uppercase tracking-widest"
            >
              Terminate
            </button>
          </div>
        </div>
      </Modal>

      {/* WhatsApp App Type Selection Modal */}
      <Modal
        isOpen={!!whatsAppModalUser}
        onClose={() => setWhatsAppModalUser(null)}
        title="কাস্টমার হোয়াটসঅ্যাপ নোটিফিকেশন (Select WhatsApp Type)"
      >
        {whatsAppModalUser && (() => {
          const urls = getWhatsAppUrls(whatsAppModalUser);
          return (
            <div className="space-y-4 py-2">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-150">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Recipient Details</p>
                <p className="text-sm font-black text-slate-850">{whatsAppModalUser.name}</p>
                <p className="text-xs text-slate-500 font-mono mt-0.5">📞 WhatsApp: {whatsAppModalUser.whatsapp || whatsAppModalUser.phone}</p>
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
                  onClick={() => setWhatsAppModalUser(null)}
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
                    setWhatsAppModalUser(null);
                    if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
                      e.preventDefault();
                      const isAndroid = /Android/i.test(navigator.userAgent);
                      const deepLink = isAndroid 
                        ? `intent://send?phone=${whatsAppModalUser.whatsapp || whatsAppModalUser.phone}&text=${encodeURIComponent(`Hello *${whatsAppModalUser.name}*! 🎉\n\nYour account on our system has been successfully completed and *APPROVED*! Here are your credentials:\n\n👤 *Name:* ${whatsAppModalUser.name}\n📧 *Email:* ${whatsAppModalUser.email || 'N/A'}\n🆔 *Username:* ${whatsAppModalUser.username}\n🔑 *Password:* ${whatsAppModalUser.password || '******'}\n\n🔗 *Login here:* ${window.location.origin}\n\nHave a great experience with our system!`)}#Intent;package=com.whatsapp.w4b;scheme=whatsapp;end`
                        : `whatsapp-business://send?phone=${whatsAppModalUser.whatsapp || whatsAppModalUser.phone}&text=${encodeURIComponent(`Hello *${whatsAppModalUser.name}*! 🎉\n\nYour account on our system has been successfully completed and *APPROVED*! Here are your credentials:\n\n👤 *Name:* ${whatsAppModalUser.name}\n📧 *Email:* ${whatsAppModalUser.email || 'N/A'}\n🆔 *Username:* ${whatsAppModalUser.username}\n🔑 *Password:* ${whatsAppModalUser.password || '******'}\n\n🔗 *Login here:* ${window.location.origin}\n\nHave a great experience with our system!`)}`;
                      
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
    </div>
  );
}
