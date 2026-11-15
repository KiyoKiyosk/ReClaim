import { guard, logout } from './auth-guard.js';
import { db } from './firebase-config.js';
import {
  collection, addDoc, doc, setDoc, updateDoc, deleteDoc,
  query, orderBy, onSnapshot, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const { profile } = await guard({ adminOnly: true });
document.getElementById('logout').onclick = logout;

const form = document.getElementById('item-form');
const msg = document.getElementById('msg');
const val = (id) => document.getElementById(id).value.trim();

// Shrinks a photo so it is small enough to store inside Firestore
function shrinkPhoto(file, maxSize = 480) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.onerror = () => reject(new Error('Could not read the image.'));
    img.src = url;
  });
}

// ---------- Post an item ----------
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  msg.textContent = 'Saving...';
  try {
    const file = document.getElementById('photo').files[0];
    const photoUrl = file ? await shrinkPhoto(file) : '';

    const itemRef = await addDoc(collection(db, 'items'), {
      title: val('title'),
      category: document.getElementById('category').value,
      description: val('description'),
      photoUrl,
      locationFound: val('locationFound'),
      dateReceived: val('dateReceived'),
      storageLocation: val('storageLocation'),
      status: 'Unclaimed',
      postedBy: profile.fullName,
      createdAt: serverTimestamp()
    });

    // private record, same id as the item, admin-only by the rules
    await setDoc(doc(db, 'itemLogs', itemRef.id), {
      finderName: val('finderName'),
      receivedBy: val('receivedBy'),
      claimantName: '',
      verifiedBy: '',
      releasedAt: null
    });

    form.reset();
    msg.textContent = 'Item posted.';
  } catch (err) {
    msg.textContent = 'Error: ' + err.message;
  }
});

// ---------- List of items with status controls ----------
onSnapshot(query(collection(db, 'items'), orderBy('createdAt', 'desc')), (snap) => {
  const list = document.getElementById('item-list');
  list.replaceChildren();
  if (snap.empty) list.textContent = 'No items yet.';

  snap.docs.forEach((d) => {
    const i = d.data();
    const row = document.createElement('div');
    row.className = 'row';

    const name = document.createElement('strong');
    name.textContent = i.title + ' (' + i.status + ') ';

    const select = document.createElement('select');
    ['Unclaimed', 'Pending', 'Claimed'].forEach((s) => {
      const o = document.createElement('option');
      o.value = s;
      o.textContent = s;
      o.selected = s === i.status;
      select.appendChild(o);
    });
    select.onchange = async () => {
      const ok = await changeStatus(d.id, select.value);
      if (!ok) select.value = i.status;
    };

    const del = document.createElement('button');
    del.textContent = 'Delete';
    del.onclick = async () => {
      if (!confirm('Delete this item?')) return;
      await deleteDoc(doc(db, 'items', d.id));
      await deleteDoc(doc(db, 'itemLogs', d.id));
    };

    row.append(name, select, del);
    list.appendChild(row);
  });
});

async function changeStatus(id, status) {
  if (status === 'Claimed') {
    const claimantName = prompt('Full name of the person claiming the item:');
    if (!claimantName) return false;
    await setDoc(doc(db, 'itemLogs', id), {
      claimantName,
      verifiedBy: profile.fullName,
      releasedAt: serverTimestamp()
    }, { merge: true });
  }
  await updateDoc(doc(db, 'items', id), { status });
  return true;
}