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
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
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
