import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyDXyoRsC-wjIPD0pE_4Qp9-NjIoI667kFE',
  authDomain: 'portfolio-d7e3e.firebaseapp.com',
  projectId: 'portfolio-d7e3e',
  storageBucket: 'portfolio-d7e3e.firebasestorage.app',
  messagingSenderId: '664864584655',
  appId: '1:664864584655:web:8d5ee8ad4978a40e0b98ba',
  measurementId: 'G-J2YTZ37358',
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const analyticsPromise: Promise<Analytics | null> =
  typeof window === 'undefined'
    ? Promise.resolve(null)
    : isSupported().then((supported) => (supported ? getAnalytics(firebaseApp) : null));

export const firebaseAuth = getAuth(firebaseApp);
