import { initializeApp, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

let app: App;

export function getFirebaseApp(): App {
  if (app) return app;

  app = initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    storageBucket: 'walldecorgen-bucket-1',
  });

  return app;
}

export function getDb(): Firestore {
  getFirebaseApp();
  return getFirestore();
}

export function getBucket() {
  getFirebaseApp();
  return getStorage().bucket();
}
