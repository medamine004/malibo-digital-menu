/**
 * CORE / DATA.JS
 * Configuration Firebase (Auth + Firestore + Storage)
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

/* ================= FIRESTORE ================= */
import {
  getFirestore,
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  query,
  orderBy,
  where,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= STORAGE ================= */
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

/* ================= AUTH ================= */
import {
  getAuth,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/* ================= CONFIG ================= */
// 🔥 إعدادات Firebase (صحيحة)
const firebaseConfig = {
  apiKey: "AIzaSyCKEUq9VrFdS6p2KDpiHhwmMgOs_xGMXuw",
  authDomain: "malibo-menu.firebaseapp.com",
  projectId: "malibo-menu",
  storageBucket: "malibo-menu.firebasestorage.app",
  messagingSenderId: "732173351248",
  appId: "1:732173351248:web:e76686f515c8bfd2f41455",
  
};

/* ================= INIT ================= */
const app = initializeApp(firebaseConfig);

const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

/* ================= EXPORT ================= */
// ✅ مهم جدًا – هذا يحل مشكلة signOut و auth نهائيًا
export {
  db,
  storage,
  auth,
  signOut,

  // Firestore
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  query,
  orderBy,
  where,
  serverTimestamp,

  // Storage
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
};
