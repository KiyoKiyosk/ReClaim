import { guard, logout } from './auth-guard.js';
import { auth } from './firebase-config.js';
import { friendlyError } from './messages.js';
import { sendEmailVerification } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

const { user, profile } = await guard({ allowUnverified: true });
const msg = document.getElementById('msg');

function show(text, ok = false) {
  msg.textContent = text;
  msg.className = ok ? 'success' : 'error';
}

document.getElementById('email-label').textContent = user.email;

if (user.emailVerified || profile.role === 'admin') {
  window.location.href = 'board.html';
}

document.getElementById('check').onclick = async () => {
  try {
    await auth.currentUser.reload();
    await auth.currentUser.getIdToken(true);
    if (auth.currentUser.emailVerified) {
      window.location.href = 'board.html';
    } else {
      show('Not verified yet. Open the link in the email first, then try again.');
    }
  } catch (err) {
    show(friendlyError(err));
  }
};

document.getElementById('resend').onclick = async () => {
  try {
    await sendEmailVerification(auth.currentUser);
    show('Verification email sent. Check your inbox and spam folder.', true);
  } catch (err) {
    show(friendlyError(err));
  }
};

document.getElementById('logout-btn').onclick = logout;