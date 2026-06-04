import React, { useState, useEffect } from 'react';
import { Cpu, Power, Activity, Plus, Trash2, Edit3, ShieldAlert } from 'lucide-react';
import { DecoderData, CompanySettings } from '../types';
import { Modal } from '../components/Modal';
import { CreateDecoderForm } from '../components/CreateForms';
import { subscribeToCollection, createDocument, updateDocument, deleteDocument, subscribeToSettings } from '../lib/storage';
import { useToast } from '../components/Toast';

export function Decoders() {
  const [decoders, setDecoders] = useState<DecoderData[]>([]);
  const [settings, setSettings] = useState<Partial<CompanySettings>>({});
  const { addToast } = useToast();

  useEffect(() => {
    const unsubscribe = subscribeToCollection<DecoderData>('decoders', (updatedDecoders) => {
      setDecoders(updatedDecoders);
    }, 'serialNumber');

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
  const [editingDecoder, setEditingDecoder] = useState<DecoderData | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [decoderToDelete, setDecoderToDelete] = useState<DecoderData | null>(null);

  const handleCreateSuccess = async (data: DecoderData) => {
    const decoderData: Omit<DecoderData, 'id'> = { ...data };
    delete (decoderData as any).id;

    if (isEditing && editingDecoder) {
      await updateDocument<DecoderData>('decoders', editingDecoder.id, decoderData as Partial<DecoderData>);
      addToast({ type: 'success', title: 'Decoder Updated', message: `Successfully updated decoder: ${decoderData.serialNumber}` });
    } else {
      await createDocument<DecoderData>('decoders', decoderData);
      addToast({ type: 'success', title: 'Decoder Registered', message: `Registered a new decoder: ${decoderData.serialNumber}` });
    }
    setShowCreate(false);
    setIsEditing(false);
    setEditingDecoder(null);
  };

  const handleEdit = (decoder: DecoderData) => {
    setEditingDecoder(decoder);
    setIsEditing(true);
    setShowCreate(true);
  };

  const handleDelete = async () => {
    if (decoderToDelete) {
      await deleteDocument('decoders', decoderToDelete.id);
      addToast({ type: 'success', title: 'Decoder Deleted', message: `Successfully removed decoder: ${decoderToDelete.serialNumber}` });
      setShowDeleteConfirm(false);
      setDecoderToDelete(null);
    }
  };

  const confirmDelete = (decoder: DecoderData) => {
    setDecoderToDelete(decoder);
    setShowDeleteConfirm(true);
  };

  const decoderTitle = settings.decoderLabel || 'Decoders';

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{decoderTitle} Management</h1>
          <p className="text-slate-500 text-sm">Hardware provisioning and {decoderTitle.toLowerCase()} management</p>
        </div>
        <button 
          onClick={() => {
            setIsEditing(false);
            setEditingDecoder(null);
            setShowCreate(true);
          }}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-sm"
        >
          <Plus size={18} />
          Register {decoderTitle.replace(/s$/, '')}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {decoders.map((dec) => (
            <div key={dec.id} className="relative group">
              <div className="bg-slate-50/50 rounded-xl p-5 border border-slate-100 group-hover:border-indigo-200 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2.5 bg-white rounded-lg shadow-sm border border-slate-100">
                    <Cpu size={20} className="text-slate-600 group-hover:text-indigo-600" />
                  </div>
                  <div className={`w-2 h-2 rounded-full ${dec.status === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
                </div>
                
                <div className="mb-4">
                  <h3 className="font-bold text-sm text-slate-900 truncate">@{dec.username || 'System'}</h3>
                  <p className="text-[10px] font-mono text-slate-400 mt-0.5 uppercase tracking-wider">{dec.model} • {dec.serialNumber}</p>
                </div>

                <div className="p-3 bg-white rounded-lg border border-slate-100 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Meyad</span>
                    <span className="text-[10px] font-bold text-indigo-600">{dec.duration}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Price</span>
                    <span className="text-[11px] font-bold text-slate-900">৳{dec.price?.toLocaleString()}</span>
                  </div>
                  {dec.region && (
                    <div className="flex justify-between items-center pt-1.5 border-t border-slate-50">
                      <span className="text-[8px] font-bold text-slate-300 uppercase">Region</span>
                      <span className="text-[9px] font-bold text-slate-600">{dec.region}</span>
                    </div>
                  )}
                  {dec.phone && (
                    <div className="flex justify-between items-center pt-1.5 border-t border-slate-50">
                      <span className="text-[8px] font-bold text-slate-300 uppercase">Contact</span>
                      <span className="text-[9px] font-bold text-slate-600">{dec.countryCode || ''} {dec.phone}</span>
                    </div>
                  )}
                  {dec.paymentMethod && (
                    <div className="flex justify-between items-center pt-1.5 border-t border-slate-50">
                      <span className="text-[8px] font-bold text-slate-300 uppercase">Paid Via</span>
                      <div className="text-right">
                        <span className="text-[9px] font-bold text-emerald-600 block">{dec.paymentMethod}</span>
                        {dec.transactionId && <span className="text-[7px] text-slate-400 font-mono block leading-none">{dec.transactionId}</span>}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="mt-4 flex items-center gap-2">
                  <button className="flex-1 bg-white border border-slate-200 text-[10px] font-bold py-2 rounded-lg hover:border-slate-300 transition-colors uppercase tracking-widest text-slate-600">CONFIG</button>
                  <button 
                    onClick={() => handleEdit(dec)}
                    className="p-2 text-slate-500 hover:text-indigo-600 transition-colors"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button 
                    onClick={() => confirmDelete(dec)}
                    className="p-2 text-slate-500 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="bg-slate-50 p-4 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-emerald-500" />
              <span className="text-xs font-bold text-slate-500">3 Units Stable</span>
            </div>
            <div className="flex items-center gap-2">
              <Power size={14} className="text-slate-300" />
              <span className="text-xs font-bold text-slate-400">1 Standby</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-300 font-mono tracking-widest uppercase">v4.2.1-stable</p>
        </div>
      </div>

      <Modal 
        isOpen={showCreate} 
        onClose={() => { setShowCreate(false); setEditingDecoder(null); setIsEditing(false); }} 
        title={isEditing ? "Modify Hardware Decoder" : "Register Hardware Decoder"}
      >
        <CreateDecoderForm 
          onSuccess={handleCreateSuccess} 
          onCancel={() => { setShowCreate(false); setEditingDecoder(null); setIsEditing(false); }} 
          initialData={editingDecoder}
        />
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => { setShowDeleteConfirm(false); setDecoderToDelete(null); }}
        title="Hardware De-registration"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-4 text-rose-600 bg-rose-50 p-4 rounded-xl border border-rose-100">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-rose-100 shadow-sm">
              <ShieldAlert size={20} />
            </div>
            <div>
              <p className="text-sm font-bold">Confirm De-registration</p>
              <p className="text-xs opacity-80 leading-relaxed">Are you sure you want to unregister decoder <span className="font-mono font-black">{decoderToDelete?.serialNumber}</span>? This hardware will no longer be tracked.</p>
            </div>
          </div>
          
          <div className="flex gap-3 pt-2">
            <button 
              onClick={() => { setShowDeleteConfirm(false); setDecoderToDelete(null); }} 
              className="flex-1 px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-lg transition-colors border border-slate-100 uppercase tracking-widest"
            >
              Go Back
            </button>
            <button 
              onClick={handleDelete}
              className="flex-1 px-4 py-2.5 text-xs font-bold bg-rose-600 text-white rounded-lg hover:bg-rose-700 shadow-md shadow-rose-200 transition-all uppercase tracking-widest"
            >
              Unregister
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
