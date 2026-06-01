import React, { useState } from 'react';
import { Plus, Globe, Trash2, Edit3, ShieldAlert } from 'lucide-react';
import { AppData, CompanySettings } from '../types';
import { Modal } from '../components/Modal';
import { CreateAppForm } from '../components/CreateForms';
import { subscribeToCollection, createDocument, updateDocument, deleteDocument, subscribeToSettings } from '../lib/storage';

export function Apps() {
  const [apps, setApps] = useState<AppData[]>([]);
  const [settings, setSettings] = useState<Partial<CompanySettings>>({});

  React.useEffect(() => {
    const unsubscribe = subscribeToCollection<AppData>('apps', (updatedApps) => {
      setApps(updatedApps);
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
  const [editingApp, setEditingApp] = useState<AppData | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [appToDelete, setAppToDelete] = useState<AppData | null>(null);

  const handleCreateSuccess = async (newAppData: AppData) => {
    const appData: Omit<AppData, 'id'> = { ...newAppData };
    delete (appData as any).id;

    if (isEditing && editingApp) {
      await updateDocument<AppData>('apps', editingApp.id, appData as Partial<AppData>);
    } else {
      await createDocument<AppData>('apps', appData);
    }
    setShowCreate(false);
    setIsEditing(false);
    setEditingApp(null);
  };

  const handleEdit = (app: AppData) => {
    setEditingApp(app);
    setIsEditing(true);
    setShowCreate(true);
  };

  const handleDelete = async () => {
    if (appToDelete) {
      await deleteDocument('apps', appToDelete.id);
      setShowDeleteConfirm(false);
      setAppToDelete(null);
    }
  };

  const confirmDelete = (app: AppData) => {
    setAppToDelete(app);
    setShowDeleteConfirm(true);
  };

  const appTitle = settings.appLabel || 'Apps';

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{appTitle} Management</h1>
          <p className="text-slate-500 text-sm">Monitor and configure {appTitle.toLowerCase()}</p>
        </div>
        <button 
          onClick={() => {
            setIsEditing(false);
            setEditingApp(null);
            setShowCreate(true);
          }}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-sm"
        >
          <Plus size={18} />
          Create New {appTitle.replace(/s$/, '')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {apps.map((app) => (
          <div key={app.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-slate-50 rounded-lg group-hover:bg-indigo-50 transition-colors">
                <Globe className="text-indigo-600" size={20} />
              </div>
              <div className="flex gap-2">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                  app.appType === 'Paid' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-slate-50 text-slate-500 border-slate-100'
                }`}>
                  {app.appType}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                  app.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'
                }`}>
                  {app.status}
                </span>
              </div>
            </div>
            
            <h3 className="text-base font-bold text-slate-900">{app.name}</h3>
            <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mt-1">
              {app.packageName || 'dev.masterbuild'}
            </p>
            
            <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div className="flex justify-between items-center text-[10px] font-bold">
                <span className="text-slate-400 uppercase">Protocol</span>
                <span className="text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">{app.protocol || 'Default'}</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-bold mt-2">
                <span className="text-slate-400 uppercase">Category</span>
                <span className="text-slate-600">{app.category}</span>
              </div>
              {app.version && (
                <div className="flex justify-between items-center text-[10px] font-bold mt-2">
                  <span className="text-slate-400 uppercase">Version</span>
                  <span className="text-indigo-600 font-mono tracking-tighter">v{app.version}</span>
                </div>
              )}
              {app.region && (
                <div className="flex justify-between items-center text-[10px] font-bold mt-2">
                  <span className="text-slate-400 uppercase">Region</span>
                  <span className="text-slate-600">{app.region}</span>
                </div>
              )}
              {app.appsTrying && (
                <div className="flex justify-between items-center text-[10px] font-bold mt-2">
                  <span className="text-slate-400 uppercase">Apps Trying</span>
                  <span className="text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded font-bold">{app.appsTrying}</span>
                </div>
              )}
              {app.appsQuality && (
                <div className="flex justify-between items-center text-[10px] font-bold mt-2">
                  <span className="text-slate-400 uppercase">Apps Quality</span>
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                    app.appsQuality.toLowerCase().includes('high') 
                      ? 'bg-rose-50 text-rose-600 border border-rose-100' 
                      : app.appsQuality.toLowerCase().includes('medium')
                      ? 'bg-amber-50 text-amber-600 border border-amber-100'
                      : 'bg-slate-50 text-slate-600 border border-slate-100'
                  }`}>{app.appsQuality}</span>
                </div>
              )}
              {app.appWorkType && (
                <div className="flex justify-between items-center text-[10px] font-bold mt-2">
                  <span className="text-slate-400 uppercase">Work Type</span>
                  <span className="text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded font-black tracking-wide text-[8.5px] uppercase">{app.appWorkType}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-[10px] font-bold mt-2 pt-2 border-t border-slate-100">
                <span className="text-slate-400 uppercase text-[9px]">Price (Valuation)</span>
                <span className="text-indigo-700 font-black">৳{(app.price || 0).toLocaleString()}</span>
              </div>
              {app.paidAmount !== undefined && (
                <div className="flex justify-between items-center text-[10px] font-bold mt-1">
                  <span className="text-slate-400 uppercase text-[9px]">Paid Amount</span>
                  <span className="text-emerald-600 font-extrabold text-[11px]">৳{(app.paidAmount || 0).toLocaleString()}</span>
                </div>
              )}
              {app.dueAmount !== undefined && (
                <div className="flex justify-between items-center text-[10px] font-bold mt-1">
                  <span className="text-slate-400 uppercase text-[9px]">Due Amount</span>
                  <span className="text-rose-600 font-extrabold text-[11px]">৳{(app.dueAmount || 0).toLocaleString()}</span>
                </div>
              )}
              {app.phone && (
                <div className="flex justify-between items-center text-[10px] font-bold mt-2 pt-2 border-t border-slate-100">
                  <span className="text-slate-400 uppercase">Contact</span>
                  <span className="text-slate-600">{app.countryCode || ''} {app.phone}</span>
                </div>
              )}
              {app.paymentMethod && (
                <div className="flex justify-between items-center text-[10px] font-bold mt-2 pt-2 border-t border-slate-100">
                  <span className="text-slate-400 uppercase">Paid Via</span>
                  <span className="text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded flex items-center gap-1">
                    {app.paymentMethod}
                    {app.transactionId && <span className="opacity-50 text-[8px]">({app.transactionId})</span>}
                  </span>
                </div>
              )}
            </div>
            
            <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
              <div className="flex gap-2">
                <button 
                  onClick={() => handleEdit(app)}
                  className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                >
                  <Edit3 size={14} />
                </button>
                <button 
                  onClick={() => confirmDelete(app)}
                  className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="flex -space-x-1">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-7 h-7 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[9px] text-slate-500 font-bold">
                    U{i}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
        
        <button 
          onClick={() => {
            setIsEditing(false);
            setEditingApp(null);
            setShowCreate(true);
          }}
          className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all group"
        >
          <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center mb-3 group-hover:bg-white transition-colors shadow-sm">
            <Plus size={20} />
          </div>
          <span className="text-xs font-bold">Deploy Custom App</span>
        </button>
      </div>

      <Modal 
        isOpen={showCreate} 
        onClose={() => { setShowCreate(false); setEditingApp(null); setIsEditing(false); }} 
        title={isEditing ? "Modify Application" : "Deploy New Application"}
      >
        <CreateAppForm 
          onSuccess={handleCreateSuccess} 
          onCancel={() => { setShowCreate(false); setEditingApp(null); setIsEditing(false); }} 
          initialData={editingApp}
        />
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => { setShowDeleteConfirm(false); setAppToDelete(null); }}
        title="Application Removal"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-4 text-rose-600 bg-rose-50 p-4 rounded-xl border border-rose-100">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-rose-100 shadow-sm">
              <ShieldAlert size={20} />
            </div>
            <div>
              <p className="text-sm font-bold">System Permission Required</p>
              <p className="text-xs opacity-80 leading-relaxed">You are about to permanently remove <span className="font-black underline">{appToDelete?.name}</span> from the system. All associated data will be purged.</p>
            </div>
          </div>
          
          <div className="flex gap-3 pt-2">
            <button 
              onClick={() => { setShowDeleteConfirm(false); setAppToDelete(null); }} 
              className="flex-1 px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-lg transition-colors border border-slate-100 uppercase tracking-widest"
            >
              Abort
            </button>
            <button 
              onClick={handleDelete}
              className="flex-1 px-4 py-2.5 text-xs font-bold bg-rose-600 text-white rounded-lg hover:bg-rose-700 shadow-md shadow-rose-200 transition-all uppercase tracking-widest"
            >
              Confirm Purge
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
