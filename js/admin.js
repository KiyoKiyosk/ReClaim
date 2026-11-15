import { guard, logout } from './auth-guard.js';
import { db } from './firebase-config.js';
import { friendlyError } from './messages.js';
import {
  collection, addDoc, doc, setDoc, updateDoc, deleteDoc,
  query, orderBy, onSnapshot, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const { profile } = await guard({ adminOnly: true });
document.getElementById('logout').onclick = logout;

const form = document.getElementById('item-form');
const msg = document.getElementById('msg');
const formTitle = document.getElementById('form-title');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-edit');
const listBox = document.getElementById('item-list');
const adminSearch = document.getElementById('admin-search');
const adminStatus = document.getElementById('admin-status');
const adminCategory = document.getElementById('admin-category');
const countEl = document.getElementById('count');
const val = (id) => document.getElementById(id).value.trim();
const setVal = (id, value) => { document.getElementById(id).value = value || ''; };

let editingId = null;
let items = [];
let logs = {};

// Shrinks a photo so it is small enough to store inside Firestore
function shrinkPhoto(file, maxSize = 480, quality = 0.7) {
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
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => reject(Object.assign(new Error('unreadable'), { code: 'photo-unreadable' }));
    img.src = url;
  });
}

// ---------- Form: post or edit ----------
function resetForm() {
  editingId = null;
  form.reset();
  formTitle.textContent = 'Post a found item';
  submitBtn.textContent = 'Post item';
  cancelBtn.hidden = true;
}

function startEdit(item) {
  const log = logs[item.id] || {};
  editingId = item.id;
  setVal('title', item.title);
  setVal('category', item.category);
  setVal('description', item.description);
  setVal('locationFound', item.locationFound);
  setVal('dateReceived', item.dateReceived);
  setVal('storageLocation', item.storageLocation);
  setVal('finderName', log.finderName);
  setVal('receivedBy', log.receivedBy);
  document.getElementById('photo').value = '';
  formTitle.textContent = 'Edit item';
  submitBtn.textContent = 'Save changes';
  cancelBtn.hidden = false;
  msg.textContent = '';
  form.scrollIntoView({ behavior: 'smooth' });
}

cancelBtn.onclick = () => {
  resetForm();
  msg.textContent = '';
};

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  msg.textContent = 'Saving...';
  submitBtn.disabled = true;
  try {
    const file = document.getElementById('photo').files[0];
    const photoUrl = file ? await shrinkPhoto(file, 480, 0.7) : '';
    const thumbUrl = file ? await shrinkPhoto(file, 200, 0.6) : '';

    const fields = {
      title: val('title'),
      category: document.getElementById('category').value,
      description: val('description'),
      locationFound: val('locationFound'),
      dateReceived: val('dateReceived'),
      storageLocation: val('storageLocation')
    };
    const office = {
      finderName: val('finderName'),
      receivedBy: val('receivedBy')
    };

    if (editingId) {
      const changes = { ...fields };
      if (photoUrl) {
        changes.photoUrl = photoUrl;
        changes.thumbUrl = thumbUrl;
      }
      await updateDoc(doc(db, 'items', editingId), changes);
      await setDoc(doc(db, 'itemLogs', editingId), office, { merge: true });
      resetForm();
      msg.textContent = 'Changes saved.';
    } else {
      const itemRef = await addDoc(collection(db, 'items'), {
        ...fields,
        photoUrl,
        thumbUrl,
        status: 'Unclaimed',
        postedBy: profile.fullName,
        createdAt: serverTimestamp()
      });
      await setDoc(doc(db, 'itemLogs', itemRef.id), {
        ...office,
        claimantName: '',
        verifiedBy: '',
        releasedAt: null
      });
      form.reset();
      msg.textContent = 'Item posted.';
    }
  } catch (err) {
    msg.textContent = friendlyError(err);
  } finally {
    submitBtn.disabled = false;
  }
});

// ---------- Admin list: items + private records ----------
onSnapshot(
  query(collection(db, 'items'), orderBy('createdAt', 'desc')),
  (snap) => {
    items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    renderList();
  },
  (err) => { listBox.textContent = friendlyError(err); }
);

onSnapshot(
  collection(db, 'itemLogs'),
  (snap) => {
    logs = {};
    snap.docs.forEach((d) => { logs[d.id] = d.data(); });
    renderList();
  },
  () => {}
);

adminSearch.oninput = renderList;
adminStatus.onchange = renderList;
adminCategory.onchange = renderList;

function formatDate(ts) {
  if (!ts || !ts.toDate) return '';
  return ts.toDate().toLocaleString();
}

function textLine(text, className) {
  const el = document.createElement('div');
  if (className) el.className = className;
  el.textContent = text;
  return el;
}

function matches(i) {
  const log = logs[i.id] || {};
  const text = adminSearch.value.trim().toLowerCase();
  const haystack = [
    i.title, i.description, i.category, i.locationFound, i.storageLocation,
    log.finderName, log.receivedBy, log.claimantName, log.verifiedBy
  ].join(' ').toLowerCase();
  return (adminStatus.value === 'all' || i.status === adminStatus.value) &&
    (adminCategory.value === 'all' || i.category === adminCategory.value) &&
    haystack.includes(text);
}

function renderList() {
  listBox.replaceChildren();
  const shown = items.filter(matches);
  countEl.textContent = items.length
    ? 'Showing ' + shown.length + ' of ' + items.length + ' items'
    : '';

  if (!items.length) {
    listBox.textContent = 'No items yet.';
    return;
  }
  if (!shown.length) {
    listBox.textContent = 'No items match your search.';
    return;
  }

  shown.forEach((i) => {
    const log = logs[i.id] || {};
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
      try {
        const ok = await changeStatus(i.id, select.value);
        if (!ok) select.value = i.status;
      } catch (err) {
        alert(friendlyError(err));
        select.value = i.status;
      }
    };

    const edit = document.createElement('button');
    edit.textContent = 'Edit';
    edit.className = 'edit-btn';
    edit.onclick = () => startEdit(i);

    const del = document.createElement('button');
    del.textContent = 'Delete';
    del.onclick = async () => {
      if (!confirm('Delete this item?')) return;
      try {
        await deleteDoc(doc(db, 'items', i.id));
        await deleteDoc(doc(db, 'itemLogs', i.id));
        if (editingId === i.id) resetForm();
      } catch (err) {
        alert(friendlyError(err));
      }
    };

    const details = document.createElement('div');
    details.className = 'details';
    details.appendChild(textLine(
      'Found by: ' + (log.finderName || '-') + '  |  Received by: ' + (log.receivedBy || '-')
    ));
    if (i.status === 'Claimed') {
      const when = formatDate(log.releasedAt);
      details.appendChild(textLine(
        'Claimed by: ' + (log.claimantName || '-') +
        '  |  Verified by: ' + (log.verifiedBy || '-') +
        (when ? '  |  Released: ' + when : ''),
        'claimed-line'
      ));
    }

    row.append(name, select, edit, del, details);
    listBox.appendChild(row);
  });
}

async function changeStatus(id, status) {
  if (status === 'Claimed') {
    const claimantName = prompt('Full name of the person claiming the item:');
    if (!claimantName) return false;
    await setDoc(doc(db, 'itemLogs', id), {
      claimantName,
      verifiedBy: profile.fullName,
      releasedAt: serverTimestamp()
    }, { merge: true });
  } else {
    // moving away from Claimed: clear the old claim details
    await setDoc(doc(db, 'itemLogs', id), {
      claimantName: '',
      verifiedBy: '',
      releasedAt: null
    }, { merge: true });
  }
  await updateDoc(doc(db, 'items', id), { status });
  return true;
}