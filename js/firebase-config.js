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
