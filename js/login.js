import { auth, db } from './firebase-config.js';
import { signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const form = document.getElementById('login-form');
const msg = document.getElementById('msg');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  msg.textContent = '';
  try {
    const cred = await signInWithEmailAndPassword(
      auth,
      document.getElementById('email').value.trim(),
      document.getElementById('password').value
    );
    const snap = await getDoc(doc(db, 'users', cred.user.uid));
    const role = snap.exists() ? snap.data().role : 'student';
    window.location.href = role === 'admin' ? 'admin.html' : 'board.html';
  } catch (err) {
    msg.textContent = 'Login failed. Check your email and password.';
  }
});