import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBTQniqZqVhmWstvSLc3BfgpcL1cwmrCHQ",
  authDomain: "mbti-test-28f5c.firebaseapp.com",
  projectId: "mbti-test-28f5c",
  storageBucket: "mbti-test-28f5c.firebasestorage.app",
  messagingSenderId: "987516872468",
  appId: "1:987516872468:web:ef641ecd7ccf2760500401",
  measurementId: "G-24M9XK3V1X"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const appId = 'job-reels-app';

export default app;
