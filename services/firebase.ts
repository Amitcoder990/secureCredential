import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyD8R5D478mN1AiDZDLFYzMsBAUSE-uFlRA",
  authDomain: "pin-4a36a.firebaseapp.com",
  projectId: "pin-4a36a",
  storageBucket: "pin-4a36a.firebasestorage.app",
  messagingSenderId: "645460613178",
  appId: "1:645460613178:web:4b559275f161dd46337d03",
  measurementId: "G-W7EGECDT29"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);

export default app;