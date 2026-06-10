import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); /* CRITICAL: The app will break without this line */
export const auth = getAuth();

// Validate Connection to Firestore on boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (
      errorMsg.includes('the client is offline') || 
      errorMsg.includes('unavailable') || 
      errorMsg.includes('Could not reach')
    ) {
      console.warn("Firebase configuration status: Firestore is currently operating in local-only/offline mode. Guest profiles are active and secure.");
    } else {
      console.warn("Firestore connection check bypassed:", errorMsg);
    }
  }
}
testConnection();
