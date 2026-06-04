import { 
  collection, 
  getDocs, 
  addDoc, 
  setDoc,
  updateDoc, 
  deleteDoc, 
  doc, 
  query as firestoreQuery, 
  orderBy, 
  onSnapshot
} from 'firebase/firestore';
import { db, auth } from './firebase';
import firebaseConfig from '../../firebase-applet-config.json';
import { Invoice, CompanySettings, ActivityLog, SystemNotification } from '../types';

export const logActivity = async (activity: Omit<ActivityLog, 'id' | 'timestamp' | 'user'>) => {
  try {
    const logData = {
      ...activity,
      timestamp: new Date().toISOString(),
      user: auth.currentUser?.email || 'System'
    };
    // Use low-level addDoc to avoid recursion
    await addDoc(collection(db, 'activities'), logData);
  } catch (error) {
    console.error('Error logging activity:', error instanceof Error ? error.message : String(error));
  }
};

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function getSafeValue(val: any, seen: Set<any>): any {
  if (val === null || typeof val !== 'object') {
    return val;
  }
  if (seen.has(val)) {
    return '[Circular]';
  }
  
  if (val instanceof Date) {
    return val.toISOString();
  }

  // Handle generic native / complex non-plain objects
  // A plain object typically has Object.prototype as its prototype, or null prototype (Object.create(null))
  const proto = Object.getPrototypeOf(val);
  const isPlainObj = proto === null || proto === Object.prototype;
  const isArray = Array.isArray(val);

  if (!isPlainObj && !isArray) {
    const className = val.constructor?.name || 'Complex Object';
    return `[Complex/Native ${className}]`;
  }
  
  seen.add(val);
  
  if (isArray) {
    const res = val.map(item => getSafeValue(item, seen));
    seen.delete(val);
    return res;
  }
  
  const res: Record<string, any> = {};
  for (const k of Object.keys(val)) {
    try {
      res[k] = getSafeValue(val[k], seen);
    } catch (e) {
      res[k] = '[Unreadable]';
    }
  }
  seen.delete(val);
  return res;
}

export function safeStringify(obj: any) {
  try {
    const safeObj = getSafeValue(obj, new Set());
    return JSON.stringify(safeObj);
  } catch (err) {
    console.warn('Failed to fully serialize circular/complex object, returning lightweight fallback:', err);
    return '[Unserializable]';
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errInfo: FirestoreErrorInfo = {
    error: errorMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  const serialized = safeStringify(errInfo);

  // Gracefully handle temporary offline, unreachable, or latency errors 
  // on read, list or subscribe operations to prevent fatal React UI crashes.
  const lowercaseError = errorMessage.toLowerCase();
  const isOfflineOrNetworkIssue = 
    lowercaseError.includes('offline') || 
    lowercaseError.includes('unreachable') || 
    lowercaseError.includes('unavailable') ||
    lowercaseError.includes('network') ||
    lowercaseError.includes('failed to get document because the client is offline');

  if (isOfflineOrNetworkIssue) {
    console.warn(`[Firestore Offline/Network Handled Gracefully] Operation: ${operationType}, Path: ${path}. Error: ${errorMessage}`);
    return; // Do not crash the application
  }

  console.error('Firestore Error: ', serialized);
  throw new Error(serialized);
}

export const mockInvoices: Invoice[] = [
  { id: 'INV-001', customerName: 'Apex Corp', customerNumber: '+256 701 234 567', paymentMethod: 'bKash', transactionId: 'TXN-882194', amount: 1540.00, paidAmount: 1540.00, dueAmount: 0, status: 'paid', createdAt: '2024-05-01', items: [], cashierName: 'Master Admin', type: 'Reporters' },
  { id: 'INV-002', customerName: 'Luminary Systems', customerNumber: '+256 782 990 112', paymentMethod: 'Binance', transactionId: '0x882...91a', amount: 890.50, paidAmount: 0, dueAmount: 890.50, status: 'pending', createdAt: '2024-05-03', items: [], cashierName: 'Master Admin', type: 'User Panel' },
  { id: 'INV-003', customerName: 'Zenith Ventures', customerNumber: '+256 750 443 221', paymentMethod: 'PayPal', transactionId: 'PAY-882199', amount: 2100.00, paidAmount: 1000.00, dueAmount: 1100.00, status: 'overdue', createdAt: '2024-04-20', items: [], cashierName: 'Master Admin', type: 'Reporter' },
  { id: 'INV-004', customerName: 'Nova Retail', customerNumber: '+256 702 334 556', paymentMethod: 'Nagad', transactionId: 'TXN-991122', amount: 450.00, paidAmount: 450.00, dueAmount: 0, status: 'paid', createdAt: '2024-05-05', items: [], cashierName: 'Master Admin', type: 'User Panel' },
];

// Fallback for types that might still use synchronous getInvoices
// In a real migration, we move everything to async/realtime
export const getInvoicesSync = (): Invoice[] => {
  const saved = localStorage.getItem('master_invoices');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      return mockInvoices;
    }
  }
  return mockInvoices;
};

// --- Firebase Operations ---

export const subscribeToInvoices = (callback: (invoices: Invoice[]) => void) => {
  return subscribeToCollection<Invoice>('invoices', callback, 'createdAt');
};

export const createInvoice = async (invoice: Invoice) => {
  const path = 'invoices';
  try {
    const isPlaceholder = !firebaseConfig.projectId || firebaseConfig.projectId.includes('remixed-');
    if (isPlaceholder) throw new Error('Offline mode');

    const docRef = doc(db, 'invoices', invoice.id);
    const sanitizedInvoice = sanitizeFirestoreData(invoice);
    await setDoc(docRef, sanitizedInvoice);
    
    await logActivity({
      type: 'create',
      category: 'invoices',
      message: `Generated invoice #${invoice.id} for ${invoice.customerName}`
    });

    return invoice;
  } catch (error) {
    try {
      const storageKey = 'local_invoices';
      const localInvoicesStr = localStorage.getItem(storageKey) || '[]';
      const localInvoices = JSON.parse(localInvoicesStr);
      localInvoices.push(invoice);
      localStorage.setItem(storageKey, safeStringify(localInvoices));
      window.dispatchEvent(new Event('local_users_updated'));
    } catch (e) {
      console.error('Offline invoice creation failed:', e);
    }
    return invoice;
  }
};

export const updateInvoice = async (id: string, data: Partial<Invoice>) => {
  const path = `invoices/${id}`;
  const isLocalId = id.startsWith('local');
  const isPlaceholder = !firebaseConfig.projectId || firebaseConfig.projectId.includes('remixed-');

  if (isLocalId || isPlaceholder) {
    try {
      const storageKey = 'local_invoices';
      const localInvoicesStr = localStorage.getItem(storageKey) || '[]';
      const localInvoices = JSON.parse(localInvoicesStr).map((inv: any) => {
        if (inv.id === id) {
          return { ...inv, ...data, id, updatedAt: new Date().toISOString() };
        }
        return inv;
      });
      localStorage.setItem(storageKey, safeStringify(localInvoices));
      window.dispatchEvent(new Event('local_users_updated'));
      return;
    } catch (e) {
      console.error('Offline invoice update failed:', e);
    }
  }

  try {
    const docRef = doc(db, 'invoices', id);
    const sanitizedData = sanitizeFirestoreData(data);
    await updateDoc(docRef, sanitizedData as any);

    await logActivity({
      type: 'update',
      category: 'invoices',
      message: `Updated status of invoice #${id}`
    });
  } catch (error) {
    try {
      const storageKey = 'local_invoices';
      const localInvoicesStr = localStorage.getItem(storageKey) || '[]';
      const localInvoices = JSON.parse(localInvoicesStr).map((inv: any) => {
        if (inv.id === id) {
          return { ...inv, ...data, id, updatedAt: new Date().toISOString() };
        }
        return inv;
      });
      localStorage.setItem(storageKey, safeStringify(localInvoices));
      window.dispatchEvent(new Event('local_users_updated'));
    } catch (e) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }
};

export const deleteInvoice = async (id: string) => {
  const path = `invoices/${id}`;
  const isLocalId = id.startsWith('local');
  const isPlaceholder = !firebaseConfig.projectId || firebaseConfig.projectId.includes('remixed-');

  if (isLocalId || isPlaceholder) {
    try {
      const storageKey = 'local_invoices';
      const localInvoicesStr = localStorage.getItem(storageKey) || '[]';
      const localInvoices = JSON.parse(localInvoicesStr).filter((inv: any) => inv.id !== id);
      localStorage.setItem(storageKey, safeStringify(localInvoices));
      window.dispatchEvent(new Event('local_users_updated'));
      return;
    } catch (e) {
      console.error('Offline invoice delete failed:', e);
    }
  }

  try {
    const docRef = doc(db, 'invoices', id);
    await deleteDoc(docRef);
  } catch (error) {
    try {
      const storageKey = 'local_invoices';
      const localInvoicesStr = localStorage.getItem(storageKey) || '[]';
      const localInvoices = JSON.parse(localInvoicesStr).filter((inv: any) => inv.id !== id);
      localStorage.setItem(storageKey, safeStringify(localInvoices));
      window.dispatchEvent(new Event('local_users_updated'));
    } catch (e) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }
};

// --- Settings Operations ---

export const subscribeToSettings = (callback: (settings: CompanySettings) => void) => {
  const path = 'settings/global';
  
  // Hydrate immediately from localStorage to avoid loading screens
  const localSettingsStr = localStorage.getItem('local_settings');
  if (localSettingsStr) {
    try {
      callback(JSON.parse(localSettingsStr));
    } catch (e) {}
  }

  // Handle local changes dispatched within the same browser instance
  const handleLocalUpdate = () => {
    const latest = localStorage.getItem('local_settings');
    if (latest) {
      try {
        callback(JSON.parse(latest));
      } catch (e) {}
    }
  };
  window.addEventListener('local_settings_updated', handleLocalUpdate);

  let unsubscribe: (() => void) | undefined;
  try {
    const isPlaceholder = !firebaseConfig.projectId || firebaseConfig.projectId.includes('remixed-');
    if (!isPlaceholder) {
      unsubscribe = onSnapshot(doc(db, 'settings', 'global'), (snapshot) => {
        if (snapshot.exists()) {
          const remoteData = snapshot.data() as CompanySettings;
          localStorage.setItem('local_settings', safeStringify(remoteData));
          callback({ ...remoteData, id: snapshot.id });
        }
      }, (error) => {
        console.warn('Firestore settings fetch denied or offline, using offline settings:', error);
      });
    }
  } catch (error) {
    console.warn('Firestore settings subscription failed:', error);
  }

  return () => {
    if (unsubscribe) unsubscribe();
    window.removeEventListener('local_settings_updated', handleLocalUpdate);
  };
};

export const saveSettings = async (settings: CompanySettings) => {
  const path = 'settings/global';
  
  // Save to local storage instantly for visual feedback and local-first reliability
  localStorage.setItem('local_settings', safeStringify(settings));
  window.dispatchEvent(new Event('local_settings_updated'));

  // Sanitize the object - remove any properties that are undefined to avoid Firebase crashing
  const cleanSettings = { ...settings };
  Object.keys(cleanSettings).forEach(key => {
    if ((cleanSettings as any)[key] === undefined) {
      delete (cleanSettings as any)[key];
    }
  });

  const isPlaceholder = !firebaseConfig.projectId || firebaseConfig.projectId.includes('remixed-');
  if (!isPlaceholder) {
    try {
      // Use setDoc with merge: true which safely creates or updates the settings document
      await setDoc(doc(db, 'settings', 'global'), cleanSettings, { merge: true });
    } catch (error) {
      console.warn('Failed to save settings to Firestore:', error);
      // We don't propagate this error to the UI as long as it successfully saved locally
    }
  }
};

// --- Generic Operations ---

export const getDocumentById = async <T extends { id: string }>(collectionName: string, id: string) => {
  const path = `${collectionName}/${id}`;
  try {
    const { getDoc } = await import('firebase/firestore');
    const docSnap = await getDoc(doc(db, collectionName, id));
    if (docSnap.exists()) {
      return { ...docSnap.data() as T, id: docSnap.id };
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
};

export const getInvoiceById = (id: string) => getDocumentById<Invoice>('invoices', id);

export const subscribeToCollection = <T extends { id: string }>(
  collectionName: string, 
  callback: (items: T[]) => void,
  sortField: string = 'createdAt'
) => {
  const getMergedItems = (firestoreItems: T[]): T[] => {
    // Generate localStorage key for this specific collection
    const storageKey = `local_${collectionName}`;
    let localItems: any[] = [];
    try {
      const localStr = localStorage.getItem(storageKey) || '[]';
      localItems = JSON.parse(localStr).map((item: any) => ({
        ...item,
        id: item.id || `local-${collectionName}-${Math.random().toString(36).substring(2, 7)}`
      }));
    } catch (e) {
      console.warn(`Error loading localStorage items for ${collectionName}:`, e);
    }

    const merged = [...firestoreItems];
    for (const localItem of localItems) {
      const isDuplicate = firestoreItems.some((fi: any) => {
        if (collectionName === 'users') {
          return (fi.phone && localItem.phone && fi.phone.trim() === localItem.phone.trim()) ||
                 (fi.email && localItem.email && fi.email.trim().toLowerCase() === localItem.email.trim().toLowerCase()) ||
                 (fi.username && localItem.username && fi.username.trim() === localItem.username.trim());
        }
        return fi.id === localItem.id || (fi.transactionId && localItem.transactionId && fi.transactionId === localItem.transactionId);
      });
      if (!isDuplicate) {
        merged.push(localItem);
      }
    }

    // Modern robust memory sorting in client-side JS to override Firestore index requirements
    merged.sort((a: any, b: any) => {
      const valA = a[sortField];
      const valB = b[sortField];
      
      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;
      
      if (typeof valA === 'string' && typeof valB === 'string') {
        return valB.localeCompare(valA); // Sort desc
      }
      return valB > valA ? 1 : (valB < valA ? -1 : 0);
    });

    return merged as T[];
  };

  let currentFirestoreItems: T[] = [];

  const publishItems = () => {
    callback(getMergedItems(currentFirestoreItems));
  };

  // Listen to custom window events for local updates
  const handleLocalUpdate = () => {
    publishItems();
  };
  window.addEventListener('local_users_updated', handleLocalUpdate);

  // Instantly publish current items (which includes offline/locally registered users)
  // so the UI gets rendered immediately without waiting on slow Firestore handshake
  publishItems();

  let unsubscribe: (() => void) | undefined;

  try {
    const q = collection(db, collectionName);
    unsubscribe = onSnapshot(q, (snapshot) => {
      currentFirestoreItems = snapshot.docs.map(docSnap => ({
        ...docSnap.data() as T,
        id: docSnap.id
      }));
      publishItems();
    }, (error) => {
      console.warn(`[Firestore sync failed/timeout/permission] Falling back to offline lists for collection ${collectionName}:`, error instanceof Error ? error.message : String(error));
      publishItems();
    });
  } catch (error) {
    console.warn(`[Firestore subscription query failed] Falling back to offline lists for collection ${collectionName}:`, error instanceof Error ? error.message : String(error));
    publishItems();
  }

  return () => {
    if (unsubscribe) unsubscribe();
    window.removeEventListener('local_users_updated', handleLocalUpdate);
  };
};

const sanitizeFirestoreData = (obj: any, seen: Set<any> = new Set()): any => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (seen.has(obj)) {
    return undefined; // Break cycle
  }
  
  if (obj instanceof Date) {
    return obj.toISOString();
  }

  // If it's a native or complex non-plain object, do not recurse into it
  if (obj.constructor && obj.constructor !== Object && obj.constructor !== Array) {
    // Keep standard Firestore field types intact without deep structural recursion
    return obj;
  }

  seen.add(obj);

  if (Array.isArray(obj)) {
    const res = obj
      .map(item => sanitizeFirestoreData(item, seen))
      .filter(item => item !== undefined);
    seen.delete(obj);
    return res;
  }

  const cleaned: any = {};
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (val !== undefined) {
      const sanitized = sanitizeFirestoreData(val, seen);
      if (sanitized !== undefined) {
        cleaned[key] = sanitized;
      }
    }
  }
  
  seen.delete(obj);
  return cleaned;
};

export const createDocument = async <T extends { id: string }>(collectionName: string, data: Omit<T, 'id'>) => {
  const timestamp = new Date().toISOString();
  const docData = {
    ...data,
    createdAt: timestamp,
    updatedAt: timestamp
  };

  let savedToFirestore = false;
  let docId = '';

  const isPlaceholder = !firebaseConfig.projectId || firebaseConfig.projectId.includes('remixed-');

  if (!isPlaceholder) {
    try {
      // Avoid infinite pending promise hangs if client has connectivity lag/rules block
      const sanitizedDocData = sanitizeFirestoreData(docData);
      const writePromise = addDoc(collection(db, collectionName), sanitizedDocData);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Write timeout')), 3000)
      );

      const docRef = (await Promise.race([writePromise, timeoutPromise])) as any;
      docId = docRef.id;
      savedToFirestore = true;
    } catch (dbErr) {
      console.warn(`Firestore write failed for ${collectionName}, falling back to local storage:`, dbErr);
    }
  }

  if (!savedToFirestore) {
    docId = 'local-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    const storageKey = `local_${collectionName}`;
    try {
      const localItemsStr = localStorage.getItem(storageKey) || '[]';
      const localItems = JSON.parse(localItemsStr);
      localItems.push({ ...docData, id: docId });
      localStorage.setItem(storageKey, safeStringify(localItems));
      window.dispatchEvent(new Event('local_users_updated'));
    } catch (e) {
      console.error(`Offline item creation failed for ${collectionName}:`, e);
    }
  }

  if (collectionName !== 'activities') {
    await logActivity({
      type: 'create',
      category: collectionName as any,
      message: `Created new record in ${collectionName}`
    });
  }

  return { ...docData, id: docId } as unknown as T;
};

export const updateDocument = async <T extends { id: string }>(collectionName: string, id: string, data: Partial<T>) => {
  const path = `${collectionName}/${id}`;
  const isLocalId = id.startsWith('local');
  const isPlaceholder = !firebaseConfig.projectId || firebaseConfig.projectId.includes('remixed-');

  if (isLocalId || isPlaceholder) {
    try {
      const storageKey = `local_${collectionName}`;
      const localItemsStr = localStorage.getItem(storageKey) || '[]';
      const localItems = JSON.parse(localItemsStr).map((item: any) => {
        const itemId = item.id || '';
        if (itemId === id) {
          return { ...item, ...data, id: itemId, updatedAt: new Date().toISOString() };
        }
        return item;
      });
      localStorage.setItem(storageKey, safeStringify(localItems));
      window.dispatchEvent(new Event('local_users_updated'));

      await logActivity({
        type: 'update',
        category: collectionName as any,
        message: `Updated offline record #${id} in ${collectionName}`
      });
      return;
    } catch (e) {
      console.error(`LocalStorage update failed for ${collectionName}:`, e);
    }
  }

  try {
    const docRef = doc(db, collectionName, id);
    const docData = {
      ...data,
      updatedAt: new Date().toISOString()
    };
    const sanitizedDocData = sanitizeFirestoreData(docData);
    await updateDoc(docRef, sanitizedDocData as any);

    if (collectionName !== 'activities') {
      await logActivity({
        type: 'update',
        category: collectionName as any,
        message: `Updated record #${id} in ${collectionName}`
      });
    }
  } catch (error) {
    try {
      const storageKey = `local_${collectionName}`;
      const localItemsStr = localStorage.getItem(storageKey) || '[]';
      const localItems = JSON.parse(localItemsStr).map((item: any) => {
        const itemId = item.id || '';
        if (itemId === id) {
          return { ...item, ...data, id: itemId, updatedAt: new Date().toISOString() };
        }
        return item;
      });
      localStorage.setItem(storageKey, safeStringify(localItems));
      window.dispatchEvent(new Event('local_users_updated'));
    } catch (e) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }
};

export const deleteDocument = async (collectionName: string, id: string) => {
  const path = `${collectionName}/${id}`;
  const isLocalId = id.startsWith('local');
  const isPlaceholder = !firebaseConfig.projectId || firebaseConfig.projectId.includes('remixed-');

  if (isLocalId || isPlaceholder) {
    try {
      const storageKey = `local_${collectionName}`;
      const localItemsStr = localStorage.getItem(storageKey) || '[]';
      const localItems = JSON.parse(localItemsStr).filter((item: any) => {
        const itemId = item.id || '';
        return itemId !== id;
      });
      localStorage.setItem(storageKey, safeStringify(localItems));
      window.dispatchEvent(new Event('local_users_updated'));

      await logActivity({
        type: 'delete',
        category: collectionName as any,
        message: `Deleted offline record #${id} in ${collectionName}`
      });
      return;
    } catch (e) {
      console.error(`LocalStorage delete failed for ${collectionName}:`, e);
    }
  }

  try {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);

    if (collectionName !== 'activities') {
      await logActivity({
        type: 'delete',
        category: collectionName as any,
        message: `Deleted record #${id} from ${collectionName}`
      });
    }
  } catch (error) {
    try {
      const storageKey = `local_${collectionName}`;
      const localItemsStr = localStorage.getItem(storageKey) || '[]';
      const localItems = JSON.parse(localItemsStr).filter((item: any) => {
        const itemId = item.id || '';
        return itemId !== id;
      });
      localStorage.setItem(storageKey, safeStringify(localItems));
      window.dispatchEvent(new Event('local_users_updated'));
    } catch (e) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }
};

// Legacy support (to be replaced gradually)
export const getInvoices = getInvoicesSync;
export const saveInvoices = (invoices: Invoice[]) => {
  localStorage.setItem('master_invoices', safeStringify(invoices));
  window.dispatchEvent(new Event('invoices_updated'));
};

// --- System Notifications Operations ---

export const createSystemNotification = async (notification: {
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  recipient: string; // 'all_admins' or username of specific client
}) => {
  try {
    return await createDocument<SystemNotification>('notifications', {
      ...notification,
      read: false,
      createdAt: new Date().toISOString()
    } as any);
  } catch (error) {
    console.error('Error creating system notification:', error);
    return null;
  }
};

export const markNotificationRead = async (id: string) => {
  try {
    return await updateDocument<SystemNotification>('notifications', id, { read: true } as any);
  } catch (error) {
    console.error('Error marking notification read:', error);
  }
};

export const markAllNotificationsRead = async (notifications: SystemNotification[]) => {
  try {
    const promises = notifications
      .filter(n => !n.read)
      .map(n => updateDocument<SystemNotification>('notifications', n.id, { read: true } as any));
    await Promise.all(promises);
  } catch (error) {
    console.error('Error marking all notifications read:', error);
  }
};

export const deleteSystemNotification = async (id: string) => {
  try {
    return await deleteDocument('notifications', id);
  } catch (error) {
    console.error('Error deleting notification:', error);
  }
};

export const clearAllNotifications = async (notifications: SystemNotification[]) => {
  try {
    const promises = notifications.map(n => deleteDocument('notifications', n.id));
    await Promise.all(promises);
  } catch (error) {
    console.error('Error clearing all notifications:', error);
  }
};

// --- Automatic Daily Backup Operations ---
export const runDailyBackup = async (
  settings: CompanySettings, 
  force: boolean = false
): Promise<{ success: boolean; date?: string; error?: string }> => {
  const isPlaceholder = !firebaseConfig.projectId || firebaseConfig.projectId.includes('remixed-');
  const todayDateStr = new Date().toISOString().split('T')[0];
  
  if (!force) {
    if (!settings.autoDailyBackupEnabled) {
      return { success: false, error: 'Automatic daily backups are disabled.' };
    }
    if (settings.lastBackupDate === todayDateStr) {
      return { success: false, error: 'Backup has already run today.' };
    }
  }

  try {
    let invoices: any[] = [];
    let users: any[] = [];

    if (!isPlaceholder) {
      // 1. Fetch Invoices from Firestore safely
      try {
        const invoicesSnap = await getDocs(collection(db, 'invoices'));
        invoices = invoicesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (err) {
        console.warn('Error fetching invoices for backup, checking fallback:', err);
        invoices = getInvoicesSync();
      }

      // 2. Fetch Users from Firestore safely
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        users = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (err) {
        console.warn('Error fetching users for backup, checking fallback:', err);
        const savedUsers = localStorage.getItem('local_users');
        if (savedUsers) {
          try { users = JSON.parse(savedUsers); } catch (e) {}
        }
      }
    } else {
      // Offline fallback
      invoices = getInvoicesSync();
      const savedUsers = localStorage.getItem('local_users');
      if (savedUsers) {
        try { users = JSON.parse(savedUsers); } catch (e) {}
      }
    }

    const backupId = `backup-${todayDateStr}-${Math.floor(1000 + Math.random() * 9000)}`;
    const backupDocument = {
      id: backupId,
      date: todayDateStr,
      timestamp: new Date().toISOString(),
      invoices,
      users,
      createdBy: auth.currentUser?.email || 'System Scheduler'
    };

    if (!isPlaceholder) {
      const sanitizedDoc = sanitizeFirestoreData(backupDocument);
      await setDoc(doc(db, 'backups', backupId), sanitizedDoc);
    } else {
      const localBackupsStr = localStorage.getItem('local_backups') || '[]';
      const localBackups = JSON.parse(localBackupsStr);
      localBackups.push(backupDocument);
      localStorage.setItem('local_backups', JSON.stringify(localBackups));
    }

    // Save settings with updated lastBackupDate
    const newSettings = {
      ...settings,
      lastBackupDate: todayDateStr
    };
    await saveSettings(newSettings);

    await logActivity({
      type: 'create',
      category: 'settings',
      message: `System Backup compiled successfully for ${todayDateStr}. Saved ${invoices.length} invoices and ${users.length} users.`
    });

    return { success: true, date: todayDateStr };
  } catch (error) {
    console.error('Backup failure:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
};

