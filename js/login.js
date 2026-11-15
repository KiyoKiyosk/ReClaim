import { auth, db } from './firebase-config.js';
import { friendlyError } from './messages.js';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const form = document.getElementById('login-form');
const msg = document.getElementById('msg');
const emailInput = document.getElementById('email');

function show(text, ok = false) {
  msg.textContent = text;
  msg.className = ok ? 'success' : 'error';
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  show('Logging in...', true);
  try {
    const cred = await signInWithEmailAndPassword(
      auth,
      emailInput.value.trim(),
      document.getElementById('password').value
    );
    const snap = await getDoc(doc(db, 'users', cred.user.uid));
    const role = snap.exists() ? snap.data().role : 'student';
    window.location.href = role === 'admin' ? 'admin.html' : 'board.html';
  } catch (err) {
    show(friendlyError(err));
  }
});

document.getElementById('forgot').addEventListener('click', async (e) => {
  e.preventDefault();
  const email = emailInput.value.trim();
  if (!email) {
    show('Type your email in the box above first, then click Forgot password.');
    return;
  }
  try {
    await sendPasswordResetEmail(auth, email);
    show('If an account exists for that email, a reset link has been sent. Check your inbox and spam folder.', true);
  } catch (err) {
    show(friendlyError(err));
  }
});