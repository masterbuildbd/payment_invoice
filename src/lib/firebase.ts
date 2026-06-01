import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { initializeFirestore, getFirestore, Firestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Initialize with the configured database ID and custom settings to prevent stream disconnection issues.
// Enabling long polling makes sure the watch channel works stably behind reverse proxies without dropping sockets abruptly.
const databaseId = (firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)') 
  ? firebaseConfig.firestoreDatabaseId 
  : undefined;

let db: Firestore;

try {
  const settings = {
    experimentalForceLongPolling: true,
    experimentalAutoDetectLongPolling: true,
  };

  db = initializeFirestore(app, settings, databaseId);
} catch (e) {
  console.warn("Firestore initialization settings bypassed or already initialized, retrieving existing instance:", e instanceof Error ? e.message : String(e));
  db = getFirestore(app, databaseId);
}

// Export base instances
export { db };
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
