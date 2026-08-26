import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCjZxR0OS3X8KB1HqmZnV3L6WnmBmeUux0",
  authDomain: "polenca-notes.firebaseapp.com",
  projectId: "polenca-notes",
  storageBucket: "polenca-notes.firebasestorage.app",
  messagingSenderId: "896295654854",
  appId: "1:896295654854:web:bf3f8f1b1b39bd141e8ec7",
  measurementId: "G-YY60HKZD8W"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true
});
