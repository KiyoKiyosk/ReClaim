import { guard } from './auth-guard.js';
import { db } from './firebase-config.js';
import { friendlyError } from './messages.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

await guard();

const set = (el, text) => { document.getElementById(el).textContent = text; };
const claimBox = document.getElementById('claim-box');
const id = new URLSearchParams(window.location.search).get('id');

try {
  const snap = id ? await getDoc(doc(db, 'items', id)) : null;

  if (!snap || !snap.exists()) {
    set('d-title', 'Item not found');
    claimBox.hidden = true;
  } else {
    const i = snap.data();
    set('d-title', i.title);
    set('d-category', i.category);
    set('d-status', i.status);
    set('d-desc', i.description);
    set('d-found', 'Found at: ' + i.locationFound);
    set('d-date', 'Received: ' + i.dateReceived);
    set('d-storage', 'Kept at: ' + i.storageLocation);

    if (i.status === 'Claimed') {
      set('status-note', 'This item has already been returned to its owner.');
      claimBox.hidden = true;
    } else if (i.status === 'Pending') {
      set('status-note', 'A claim on this item is being verified by the office. If you believe it is yours, please still visit the office.');
    }

    const img = document.getElementById('d-photo');
    if (i.photoUrl) {
      img.src = i.photoUrl;
      img.hidden = false;
    }
  }
} catch (err) {
  set('d-title', friendlyError(err));
  claimBox.hidden = true;
}