import { guard } from './auth-guard.js';
import { db } from './firebase-config.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

await guard();
const id = new URLSearchParams(window.location.search).get('id');
const set = (el, text) => { document.getElementById(el).textContent = text; };

const snap = id ? await getDoc(doc(db, 'items', id)) : null;

if (!snap || !snap.exists()) {
  set('d-title', 'Item not found');
} else {
  const i = snap.data();
  set('d-title', i.title);
  set('d-category', i.category);
  set('d-status', i.status);
  set('d-desc', i.description);
  set('d-found', 'Found at: ' + i.locationFound);
  set('d-date', 'Received: ' + i.dateReceived);
  set('d-storage', 'Kept at: ' + i.storageLocation);
  const img = document.getElementById('d-photo');
  if (i.photoUrl) {
    img.src = i.photoUrl;
    img.hidden = false;
  }
}