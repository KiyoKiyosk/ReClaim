import { auth, db } from './firebase-config.js';
import { friendlyError } from './messages.js';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { doc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const TERMS_VERSION = '1.0';
const ALLOWED_DOMAIN = ''; // keep the value you already set, or leave empty while testing

const form = document.getElementById('signup-form');
const msg = document.getElementById('msg');

// Remember what was typed, in case the page is refreshed or the Terms link is opened
const SAVED_FIELDS = ['fullName', 'studentNumber', 'email'];
SAVED_FIELDS.forEach((id) => {
  const input = document.getElementById(id);
  try {
    const saved = localStorage.getItem('reclaim-signup-' + id);
    if (saved) input.value = saved;
  } catch (e) {}
  input.addEventListener('input', () => {
    try { localStorage.setItem('reclaim-signup-' + id, input.value); } catch (e) {}
  });
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  msg.textContent = '';

  const fullName = document.getElementById('fullName').value.trim();
  const studentNumber = document.getElementById('studentNumber').value.trim();
  const email = document.getElementById('email').value.trim().toLowerCase();
  const password = document.getElementById('password').value;

  if (!document.getElementById('terms').checked) {
    msg.textContent = 'You must agree to the Terms and Conditions to sign up.';
    return;
  }
  if (ALLOWED_DOMAIN && !email.endsWith(ALLOWED_DOMAIN)) {
    msg.textContent = 'Please use your school email address.';
    return;
  }

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, 'users', cred.user.uid), {
      fullName,
      studentNumber,
      email,
      role: 'student',
      acceptedTerms: true,
      termsVersion: TERMS_VERSION,
      termsAcceptedAt: serverTimestamp()
    });
    SAVED_FIELDS.forEach((id) => { try { localStorage.removeItem('reclaim-signup-' + id); } catch (e) {} });
    try { await sendEmailVerification(cred.user); } catch (e) {}
    window.location.href = 'verify.html';
  } catch (err) {
    msg.textContent = friendlyError(err);
  }
});