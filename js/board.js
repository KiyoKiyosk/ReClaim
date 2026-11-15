import { guard, logout } from './auth-guard.js';
import { db } from './firebase-config.js';
import { friendlyError } from './messages.js';
import { collection, query, orderBy, limit, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const { profile } = await guard();
if (profile.role === 'admin') document.getElementById('admin-link').hidden = false;
document.getElementById('logout').onclick = logout;

const grid = document.getElementById('grid');
const search = document.getElementById('search');
const category = document.getElementById('category');
const showClaimed = document.getElementById('show-claimed');
let items = [];

onSnapshot(
  query(collection(db, 'items'), orderBy('createdAt', 'desc'), limit(60)),
  (snap) => {
    items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    render();
  },
  (err) => { grid.textContent = friendlyError(err); }
);

search.oninput = render;
category.onchange = render;
showClaimed.onchange = render;

function render() {
  const text = search.value.trim().toLowerCase();
  const cat = category.value;
  const showAll = showClaimed.checked;

  grid.replaceChildren();
  items
    .filter((i) =>
      (showAll || i.status !== 'Claimed') &&
      (cat === 'all' || i.category === cat) &&
      (i.title + ' ' + i.description).toLowerCase().includes(text))
    .forEach((i) => grid.appendChild(card(i)));
  if (!grid.children.length) grid.textContent = 'No items found.';
}

function card(i) {
  const a = document.createElement('a');
  a.className = 'item-card';
  a.href = 'item.html?id=' + i.id;

  const thumb = i.thumbUrl || i.photoUrl;
  if (thumb) {
    const img = document.createElement('img');
    img.src = thumb;
    img.alt = i.title;
    img.loading = 'lazy';
    a.appendChild(img);
  }

  const h = document.createElement('h3');
  h.textContent = i.title;
  const c = document.createElement('p');
  c.textContent = i.category;
  const s = document.createElement('span');
  s.className = 'badge ' + i.status.toLowerCase();
  s.textContent = i.status;
  a.append(h, c, s);
  return a;
}