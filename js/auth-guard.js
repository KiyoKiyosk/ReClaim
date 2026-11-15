import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

export function guard({ adminOnly = false, allowUnverified = false } = {}) {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        window.location.href = 'login.html';
        return;
      }
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (!snap.exists()) {
        await signOut(auth);
        window.location.href = 'login.html';
        return;
      }
      const profile = snap.data();
      const isAdmin = profile.role === 'admin';

      if (!allowUnverified && !isAdmin && !user.emailVerified) {
        window.location.href = 'verify.html';
        return;
      }
      if (adminOnly && !isAdmin) {
        window.location.href = 'board.html';
        return;
      }
      resolve({ user, profile });
    });
  });
}

export function logout() {
  signOut(auth).then(() => { window.location.href = 'login.html'; });
}