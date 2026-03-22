// ============================================
// firebase-config.js
// Firebase initialization for Varun e-commerce
// ============================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ---- REPLACE THESE WITH YOUR FIREBASE PROJECT CREDENTIALS ----
// Go to: https://console.firebase.google.com
// Project Settings → Your apps → SDK setup and configuration
const firebaseConfig = {
  apiKey: "AIzaSyDg6IBD-uqRsINts4NMIDO6QAd9arjt6Yo"
authDomain: "varun-kids.firebaseapp.com"
projectId: "varun-kids"
storageBucket: "varun-kids.firebasestorage.app"
messagingSenderId: "544835362918"
appId: "1:544835362918:web:954a2cb9f5580874928da7"
};
// --------------------------------------------------------------

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Initialize and export Firestore database instance
export const db = getFirestore(app);

/* ============================================================
   FIRESTORE SETUP GUIDE
   ============================================================
   Firestore Security Rules (paste in Firebase Console → Firestore → Rules):

   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Anyone can read products
       match /products/{doc} {
         allow read: if true;
         allow write: if false; // Only admin via Firebase Console
       }
       // Anyone can create an order (checkout), only admin can read/update
       match /orders/{doc} {
         allow create: if true;
         allow read, update: if false; // Manage via Firebase Console
       }
     }
   }
   ============================================================ */
