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
  apiKey: "AIzaSyDg6IBD-uqRsINts4NMIDO6QAd9arjt6Yo",
  authDomain: "varun-kids.firebaseapp.com",
  projectId: "varun-kids",
  storageBucket: "varun-kids.firebasestorage.app",
  messagingSenderId: "544835362918",
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
   1. Create a Firebase project at https://console.firebase.google.com
   2. Enable Firestore Database (Start in test mode for development)
   3. Create a "products" collection with documents like:
      {
        name: "Classic Linen Shirt",
        price: 1299,
        mrp: 1999,
        image: "https://...",
        description: "Breathable linen fabric...",
        category: "Men",
        brand: "Varun Studio"
      }
   4. Replace the firebaseConfig above with your actual config
   ============================================================ */
