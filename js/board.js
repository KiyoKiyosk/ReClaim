import { guard, logout } from './auth-guard.js';
import { db } from './firebase-config.js';
import { collection, query, orderBy, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const { profile } = await guard();
if (profile.role === 'admin') document.getElementById('admin-link').hidden = false;
document.getElementById('logout').onclick = logout;

const grid = document.getElementById('grid');
const search = document.getElementById('search');
const category = document.getElementById('category');
let items = [];

onSnapshot(query(collection(db, 'items'), orderBy('createdAt', 'desc')), (snap) => {
  items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  render();
});
search.oninput = render;
category.onchange = render;

function render() {
  const text = search.value.trim().toLowerCase();
  const cat = category.value;
  grid.replaceChildren();
  items
    .filter((i) => (cat === 'all' || i.category === cat) &&
      (i.title + ' ' + i.description).toLowerCase().includes(text))
    .forEach((i) => grid.appendChild(card(i)));
  if (!grid.children.length) grid.textContent = 'No items found.';
}

function card(i) {
  const a = document.createElement('a');
  a.className = 'item-card';
  a.href = 'item.html?id=' + i.id;
  if (i.photoUrl) {
    const img = document.createElement('img');
    img.src = i.photoUrl;
    img.alt = i.title;
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