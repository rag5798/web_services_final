const envSelect = document.getElementById('envSelect');
const customUrlWrap = document.getElementById('customUrlWrap');
const customUrl = document.getElementById('customUrl');
const statusDot = document.getElementById('statusDot');
const healthText = document.getElementById('healthText');
const itemsBody = document.getElementById('itemsBody');
const emptyMsg = document.getElementById('emptyMsg');
const logEl = document.getElementById('log');

document.getElementById('autoOriginLabel').textContent = window.location.origin;

function baseUrl() {
  if (envSelect.value === 'auto') return window.location.origin;
  if (envSelect.value === 'custom') return customUrl.value.trim().replace(/\/$/, '');
  return envSelect.value;
}

function log(line) {
  const ts = new Date().toLocaleTimeString();
  logEl.textContent = `[${ts}] ${line}\n` + logEl.textContent;
}

envSelect.addEventListener('change', () => {
  customUrlWrap.style.display = envSelect.value === 'custom' ? 'block' : 'none';
  checkHealth();
  loadItems();
});

async function checkHealth() {
  const url = baseUrl() + '/health';
  statusDot.className = 'status-dot';
  healthText.textContent = 'Checking…';
  try {
    const res = await fetch(url);
    const text = await res.text();
    if (res.ok) {
      statusDot.className = 'status-dot ok';
      healthText.textContent = `OK (${res.status}) — ${url}`;
      log(`GET /health -> ${res.status} ${text}`);
    } else {
      statusDot.className = 'status-dot bad';
      healthText.textContent = `HTTP ${res.status} — ${url}`;
      log(`GET /health -> ${res.status}`);
    }
  } catch (err) {
    statusDot.className = 'status-dot bad';
    healthText.textContent = `Unreachable — ${err.message}`;
    log(`GET /health failed: ${err.message}`);
  }
}

function fmtDate(v) {
  if (!v) return '—';
  const d = new Date(v);
  return isNaN(d) ? String(v) : d.toLocaleString();
}

async function loadItems() {
  const url = baseUrl() + '/api/items';
  try {
    const res = await fetch(url);
    const json = await res.json();
    log(`GET /api/items -> ${res.status} (${(json.data || []).length} items)`);
    renderItems(json.data || []);
  } catch (err) {
    log(`GET /api/items failed: ${err.message}`);
    renderItems([]);
  }
}

function renderItems(items) {
  itemsBody.innerHTML = '';
  emptyMsg.style.display = items.length ? 'none' : 'block';
  for (const item of items) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHtml(item.name)}</td>
      <td>$${Number(item.price).toFixed(2)}</td>
      <td>${fmtDate(item.createdAt)}</td>
      <td class="actions">
        <button class="secondary edit-btn" type="button">Edit</button>
        <button class="danger delete-btn" type="button">Delete</button>
      </td>
    `;
    tr.querySelector('.edit-btn').addEventListener('click', () => startEdit(tr, item));
    tr.querySelector('.delete-btn').addEventListener('click', () => deleteItem(item._id));
    itemsBody.appendChild(tr);
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function startEdit(tr, item) {
  tr.classList.add('editing');
  tr.innerHTML = `
    <td><input type="text" class="editName" value="${escapeHtml(item.name)}" /></td>
    <td><input type="number" step="0.01" class="editPrice" value="${item.price}" /></td>
    <td>${fmtDate(item.createdAt)}</td>
    <td class="actions">
      <button class="save-btn" type="button">Save</button>
      <button class="secondary cancel-btn" type="button">Cancel</button>
    </td>
  `;
  tr.querySelector('.save-btn').addEventListener('click', () => saveEdit(item._id, tr));
  tr.querySelector('.cancel-btn').addEventListener('click', loadItems);
}

async function saveEdit(id, tr) {
  const name = tr.querySelector('.editName').value.trim();
  const price = parseFloat(tr.querySelector('.editPrice').value);
  if (!name || isNaN(price)) return;
  const url = `${baseUrl()}/api/items/${id}`;
  try {
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, price })
    });
    const json = await res.json();
    log(`PUT /api/items/${id} -> ${res.status}`);
    if (!res.ok) alert(json.error || 'Update failed');
  } catch (err) {
    log(`PUT /api/items/${id} failed: ${err.message}`);
  }
  loadItems();
}

async function deleteItem(id) {
  if (!confirm('Delete this item?')) return;
  const url = `${baseUrl()}/api/items/${id}`;
  try {
    const res = await fetch(url, { method: 'DELETE' });
    const json = await res.json();
    log(`DELETE /api/items/${id} -> ${res.status}`);
    if (!res.ok) alert(json.error || 'Delete failed');
  } catch (err) {
    log(`DELETE /api/items/${id} failed: ${err.message}`);
  }
  loadItems();
}

document.getElementById('addForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('newName').value.trim();
  const price = parseFloat(document.getElementById('newPrice').value);
  if (!name || isNaN(price)) return;
  const url = baseUrl() + '/api/items';
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, price })
    });
    const json = await res.json();
    log(`POST /api/items -> ${res.status}`);
    if (!res.ok) alert(json.error || 'Create failed');
    else {
      document.getElementById('newName').value = '';
      document.getElementById('newPrice').value = '';
    }
  } catch (err) {
    log(`POST /api/items failed: ${err.message}`);
  }
  loadItems();
});

document.getElementById('checkHealth').addEventListener('click', checkHealth);
document.getElementById('refreshBtn').addEventListener('click', loadItems);

checkHealth();
loadItems();
