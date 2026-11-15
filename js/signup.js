import { auth, db } from './firebase-config.js';
import { createUserWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { doc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { friendlyError } from './messages.js';
const TERMS_VERSION = '1.0';
const ALLOWED_DOMAIN = ''; // example: '@yourschool.edu.ph'. Leave empty for now.

const form = document.getElementById('signup-form');
const msg = document.getElementById('msg');

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
    window.location.href = 'board.html';
  } catch (err) {
    msg.textContent = friendlyError(err);
  }
});