import React, { useState, useEffect } from 'react';
import { LayoutGrid, Plus, Globe, Shield, ExternalLink, Trash2, Edit3, ShieldAlert } from 'lucide-react';
import { PanelData, CompanySettings } from '../types';
import { Modal } from '../components/Modal';
import { CreatePanelForm } from '../components/CreateForms';
import { subscribeToCollection, createDocument, updateDocument, deleteDocument, subscribeToSettings } from '../lib/storage';
import { useToast } from '../components/Toast';

export function Panels() {
  const [panels, setPanels] = useState<PanelData[]>([]);
  const [settings, setSettings] = useState<Partial<CompanySettings>>({});
  const { addToast } = useToast();

  useEffect(() => {
    const unsubscribe = subscribeToCollection<PanelData>('panels', (updatedPanels) => {
      setPanels(updatedPanels);
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
  const [editingPanel, setEditingPanel] = useState<PanelData | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [panelToDelete, setPanelToDelete] = useState<PanelData | null>(null);

  const handleCreateSuccess = async (data: PanelData) => {
    const panelData: Omit<PanelData, 'id'> = { ...data };
    delete (panelData as any).id;

    if (isEditing && editingPanel) {
      await updateDocument<PanelData>('panels', editingPanel.id, panelData as Partial<PanelData>);
      addToast({ type: 'success', title: 'Panel Updated', message: `Successfully updated panel: ${panelData.name}` });
    } else {
      await createDocument<PanelData>('panels', panelData);
      addToast({ type: 'success', title: 'Panel Registered', message: `Registered a new panel: ${panelData.name}` });
    }
    setShowCreate(false);
    setIsEditing(false);
    setEditingPanel(null);
  };

  const handleEdit = (panel: PanelData) => {
    setEditingPanel(panel);
    setIsEditing(true);
    setShowCreate(true);
  };

  const handleDelete = async () => {
    if (panelToDelete) {
      await deleteDocument('panels', panelToDelete.id);
      addToast({ type: 'success', title: 'Panel Deleted', message: `Successfully removed panel: ${panelToDelete.name}` });
      setShowDeleteConfirm(false);
      setPanelToDelete(null);
    }
  };

  const confirmDelete = (panel: PanelData) => {
    setPanelToDelete(panel);
    setShowDeleteConfirm(true);
  };

  const panelTitle = settings.panelLabel || 'Panels';

  const getTierStyle = (tier: string) => {
    switch(tier) {
      case 'enterprise': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      case 'pro': return 'bg-blue-50 text-blue-700 border-blue-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const getPanelTypeStyle = (type: string) => {
    switch(type) {
      case 'New': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Rent': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'Try': return 'bg-slate-50 text-slate-700 border-slate-100';
      default: return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{panelTitle} Management</h1>
          <p className="text-slate-500 text-sm">Reseller instances and {panelTitle.toLowerCase()} subscriptions</p>
        </div>
        <button 
          onClick={() => {
            setIsEditing(false);
            setEditingPanel(null);
            setShowCreate(true);
          }}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-sm"
        >
          <Plus size={18} />
          Create New {panelTitle.replace(/s$/, '')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {panels.map((panel) => (
          <div key={panel.id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-indigo-600 border border-slate-100 group-hover:bg-indigo-50 transition-colors">
                  <LayoutGrid size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{panel.name}</h3>
                  <div className="flex items-center gap-2 text-slate-400 text-[10px] font-mono mt-0.5 break-all">
                    <Globe size={10} />
                    {panel.url || 'panel.masterbuild.dev'}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getPanelTypeStyle(panel.panelType || 'New')}`}>
                  {panel.panelType || 'New'}
                </span>
                <div className="flex gap-1">
                  <button 
                    onClick={() => handleEdit(panel)}
                    className="text-slate-500 hover:text-indigo-600 transition-colors p-1"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button 
                    onClick={() => confirmDelete(panel)}
                    className="text-slate-500 hover:text-rose-600 transition-colors p-1"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-4">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Meyad</p>
                <p className="text-xs font-bold text-slate-700">{panel.duration || 'Session'}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Price</p>
                <p className="text-xs font-bold text-slate-700">৳{panel.price?.toLocaleString() || '0'}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Region</p>
                <p className="text-xs font-bold text-slate-700 truncate">{panel.region}</p>
              </div>
            </div>

            {panel.phone && (
              <div className="mt-4 flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg border border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contact</span>
                  <span className="text-[10px] font-bold text-slate-600">{panel.countryCode || ''} {panel.phone}</span>
                </div>
              </div>
            )}

            {panel.paymentMethod && (
              <div className="mt-4 flex items-center justify-between px-3 py-2 bg-indigo-50/50 rounded-lg border border-indigo-100/50">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Paid via {panel.paymentMethod}</span>
                </div>
                {panel.transactionId && <span className="text-[10px] font-mono font-bold text-indigo-600">{panel.transactionId}</span>}
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-2">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getTierStyle(panel.tier)}`}>
                {panel.tier}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                panel.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
              }`}>
                {panel.status}
              </span>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <Shield size={12} className="text-indigo-400" />
                Secure Panel
              </div>
              <button 
                onClick={() => window.open(panel.url, '_blank')}
                className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:underline"
              >
                OPEN PANEL
                <ExternalLink size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal 
        isOpen={showCreate} 
        onClose={() => { setShowCreate(false); setEditingPanel(null); setIsEditing(false); }} 
        title={isEditing ? "Modify Management Panel" : "Create New Management Panel"}
      >
        <CreatePanelForm 
          onSuccess={handleCreateSuccess} 
          onCancel={() => { setShowCreate(false); setEditingPanel(null); setIsEditing(false); }} 
          initialData={editingPanel}
        />
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => { setShowDeleteConfirm(false); setPanelToDelete(null); }}
        title="Termination Request"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-4 text-rose-600 bg-rose-50 p-4 rounded-xl border border-rose-100">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-rose-100 shadow-sm">
              <ShieldAlert size={20} />
            </div>
            <div>
              <p className="text-sm font-bold">Panel Decommissioning</p>
              <p className="text-xs opacity-80 leading-relaxed">Are you sure you want to terminate <span className="font-black underline">{panelToDelete?.name}</span>? This will revoke all reseller access immediately.</p>
            </div>
          </div>
          
          <div className="flex gap-3 pt-2">
            <button 
              onClick={() => { setShowDeleteConfirm(false); setPanelToDelete(null); }} 
              className="flex-1 px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-lg transition-colors border border-slate-100 uppercase tracking-widest"
            >
              Cancel
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
    </div>
  );
}
