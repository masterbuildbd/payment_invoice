import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { initializeFirestore, getFirestore, Firestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Initialize with the configured database ID and custom settings to prevent stream disconnection issues.
// Enabling long polling makes sure the watch channel works stably behind reverse proxies without dropping sockets abruptly.
let db: Firestore;
try {
  const settings = {
    experimentalForceLongPolling: true,
    experimentalAutoDetectLongPolling: true,
  };

  if (firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)') {
    db = initializeFirestore(app, settings, firebaseConfig.firestoreDatabaseId);
  } else {
    db = initializeFirestore(app, settings);
  }
} catch (e) {
  console.warn("Failed to initialize Firestore with específico settings, falling back.", e instanceof Error ? e.message : String(e));
  db = getFirestore(app);
}

// Export base instances
export { db };
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
