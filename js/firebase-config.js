import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyDsSFdY8YlfON1w5LuIuTiT_RHsUdY6n5E",
  authDomain: "reclaim-73b2e.firebaseapp.com",
  projectId: "reclaim-73b2e",
  storageBucket: "reclaim-73b2e.firebasestorage.app",
  messagingSenderId: "1080922945227",
  appId: "1:1080922945227:web:4613deeed2bb6a9b188d4e",
  measurementId: "G-4S7M5D01R4"
};
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);