/**
 * admin-core.js
 * Configuration Firebase & Exports
 */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signOut, onAuthStateChanged, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
    getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc, 
    query, where, orderBy, onSnapshot, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- CONFIGURATION IMPOSEE ---
const firebaseConfig = {
  apiKey: "AIzaSyCKEUq9VrFdS6p2KDpiHhwmMgOs_xGMXuw",
  authDomain: "malibo-menu.firebaseapp.com",
  projectId: "malibo-menu",
  storageBucket: "malibo-menu.firebasestorage.app",
  messagingSenderId: "732173351248",
  appId: "1:732173351248:web:e76686f515c8bfd2f41455",
  
};

// --- INITIALISATION ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- EXPORTS ---
export { 
    app, auth, db, 
    signOut, onAuthStateChanged, signInWithEmailAndPassword,
    collection, addDoc, getDocs, updateDoc, deleteDoc, doc, 
    query, where, orderBy, onSnapshot, serverTimestamp 
};