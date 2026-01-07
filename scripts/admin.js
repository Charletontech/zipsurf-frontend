import { Ui, Api } from './utils.js';

// --- State ---
let USERS = [];
let LOCATIONS = [];
let OFFICERS = [];
let STATS = {};

// --- DOM Elements ---
const els = {
  views: document.querySelectorAll('.dashboard-view'),
  navLinks: document.querySelectorAll('.nav-link'),
  
  // Tables
  usersTable: document.getElementById('users-table-body'),
  locationsTable: document.getElementById('locations-table-body'),
  officersTable: document.getElementById('officers-table-body'),
  
  // Stats
  statFunded: document.getElementById('stat-funded'),
  statUsers: document.getElementById('stat-users'),
  statLocations: document.getElementById('stat-locations'),
  statOfficers: document.getElementById('stat-officers'),
};

// --- Init ---
async function init() {
  const userStr = localStorage.getItem('user');
  if (!userStr) {
      window.location.href = '../login/index.html';
      return;
  }
  const user = JSON.parse(userStr);
  if (user.role !== 'admin') {
      Ui.toast('error', 'Unauthorized', 'Admin access required.');
      setTimeout(() => window.location.href = '../dashboard/index.html', 1500);
      return;
  }

  setupEventListeners();
  
  // Load Data
  await Promise.all([
      fetchStats(),
      fetchUsers(),
      fetchLocations(),
      fetchOfficers()
  ]);
  
  switchView('overview');
}

// --- Fetchers ---

async function fetchStats() {
    try {
        const response = await Api.get('/stats/admin');
        STATS = response.data;
        updateStatsUI();
    } catch (err) {
        console.error('Failed to fetch stats', err);
    }
}

async function fetchUsers() {
    try {
        const response = await Api.get('/users');
        USERS = response.data;
        renderUsers();
    } catch (err) {
        console.error('Failed to fetch users', err);
    }
}

async function fetchLocations() {
    try {
        const response = await Api.get('/locations');
        LOCATIONS = response.data;
        renderLocations();
    } catch (err) {
        console.error('Failed to fetch locations', err);
    }
}

async function fetchOfficers() {
    try {
        const response = await Api.get('/officers');
        OFFICERS = response.data;
        renderOfficers();
    } catch (err) {
        console.error('Failed to fetch officers', err);
    }
}

// --- Render Logic ---

function updateStatsUI() {
  els.statFunded.textContent = `₦${(STATS.totalFunded || 0).toLocaleString()}`;
  els.statUsers.textContent = STATS.totalUsers || 0;
  els.statLocations.textContent = STATS.totalLocations || 0;
  els.statOfficers.textContent = STATS.activeOfficers || 0;
}

function renderUsers() {
  els.usersTable.innerHTML = USERS.map(user => `
    <tr class="border-b border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors group">
      <td class="py-4 px-4 text-sm font-medium text-gray-900 dark:text-white">${user.name}</td>
      <td class="py-4 px-4 text-sm text-gray-500 dark:text-slate-400">${user.email}</td>
      <td class="py-4 px-4 text-sm font-bold text-gray-900 dark:text-white">₦${parseFloat(user.balance).toLocaleString()}</td>
      <td class="py-4 px-4 text-right">
        <button class="edit-balance-btn text-brand-primary hover:text-brand-secondary text-sm font-medium px-3 py-1 rounded-lg bg-brand-primary/10 hover:bg-brand-primary/20 transition-colors" data-id="${user.id}">
          Edit Balance
        </button>
      </td>
    </tr>
  `).join('');
  
  document.querySelectorAll('.edit-balance-btn').forEach(btn => {
    btn.addEventListener('click', () => handleEditBalance(btn.dataset.id));
  });
}

function renderLocations() {
  els.locationsTable.innerHTML = LOCATIONS.map(loc => `
    <tr class="border-b border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
      <td class="py-4 px-4">
         <p class="text-sm font-medium text-gray-900 dark:text-white">${loc.name}</p>
         <span class="text-xs inline-flex items-center px-2 py-0.5 rounded-full ${loc.status === 'Active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}">
            ${loc.status}
         </span>
      </td>
      <td class="py-4 px-4 text-sm font-mono text-gray-600 dark:text-slate-400">${loc.routerPass}</td>
      <td class="py-4 px-4 text-sm font-mono text-gray-600 dark:text-slate-400">${loc.stationCode}</td>
      <td class="py-4 px-4 text-right">
        <button class="toggle-status-btn text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${loc.status === 'Active' ? 'border-yellow-500 text-yellow-600 hover:bg-yellow-50' : 'border-green-500 text-green-600 hover:bg-green-50'}" data-id="${loc.id}">
          Set to ${loc.status === 'Active' ? 'Maintenance' : 'Active'}
        </button>
      </td>
    </tr>
  `).join('');

  document.querySelectorAll('.toggle-status-btn').forEach(btn => {
    btn.addEventListener('click', () => handleToggleStatus(btn.dataset.id));
  });
}

function renderOfficers() {
  els.officersTable.innerHTML = OFFICERS.map(off => {
    const loc = off.location || {}; // Backend includes location
    return `
    <tr class="border-b border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
      <td class="py-4 px-4 text-sm font-medium text-gray-900 dark:text-white">${off.name}</td>
      <td class="py-4 px-4 text-sm text-gray-500 dark:text-slate-400">${off.phone}</td>
      <td class="py-4 px-4 text-sm text-gray-500 dark:text-slate-400">${loc.name || 'Unknown'}</td>
      <td class="py-4 px-4 text-sm font-mono text-gray-600 dark:text-slate-400">${off.stationCode}</td>
    </tr>
  `}).join('');
}

// --- Action Handlers ---

async function handleEditBalance(userId) {
  const user = USERS.find(u => u.id === userId);
  if (!user) return;

  const { value: amount } = await Swal.fire({
    title: `Edit Balance: ${user.name}`,
    input: 'number',
    inputValue: user.balance,
    inputLabel: 'New Wallet Balance (₦)',
    showCancelButton: true,
    confirmButtonColor: '#0ea5e9',
    cancelButtonColor: '#d33',
  });

  if (amount !== undefined && amount !== null && amount !== '') {
      try {
          await Api.patch(`/users/${userId}/balance`, { amount });
          Ui.toast('success', 'Updated', `${user.name}'s balance updated.`);
          fetchUsers(); // Refresh
          fetchStats();
      } catch (err) {
          Ui.toast('error', 'Update Failed', err.message);
      }
  }
}

async function handleAddLocation() {
  const { value: formValues } = await Swal.fire({
    title: 'Add New Location',
    html:
      '<input id="swal-loc-name" class="swal2-input" placeholder="Location Name">' +
      '<select id="swal-loc-status" class="swal2-input"><option value="Active">Active</option><option value="Maintenance">Maintenance</option></select>',
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: 'Add Location',
    preConfirm: () => {
      return [
        document.getElementById('swal-loc-name').value,
        document.getElementById('swal-loc-status').value
      ]
    }
  });

  if (formValues) {
    const [name, status] = formValues;
    if (!name) {
       Ui.toast('error', 'Error', 'Location name is required');
       return;
    }

    try {
        await Api.post('/locations', { name, status });
        Ui.toast('success', 'Added', `Location "${name}" added successfully.`);
        fetchLocations();
        fetchStats();
    } catch (err) {
        Ui.toast('error', 'Failed', err.message);
    }
  }
}

async function handleToggleStatus(locId) {
  const loc = LOCATIONS.find(l => l.id === locId);
  if (!loc) return;
  const newStatus = loc.status === 'Active' ? 'Maintenance' : 'Active';
  
  const confirmed = await Ui.alert(
    'question',
    'Change Status?',
    `Are you sure you want to set <b>${loc.name}</b> to <b>${newStatus}</b>?`,
    true, true
  );

  if (confirmed && confirmed.isConfirmed) {
      try {
          await Api.patch(`/locations/${locId}/status`, {}); // Status toggled logic on backend
          Ui.toast('success', 'Status Updated', `${loc.name} is now ${newStatus}`);
          fetchLocations();
      } catch (err) {
          Ui.toast('error', 'Failed', err.message);
      }
  }
}

async function handleRegeneratePasswords() {
  const confirmed = await Ui.alert(
      'warning',
      'Regenerate All Passwords?',
      'This will change the router passwords for ALL locations immediately.',
      true, true
  );

  if (confirmed && confirmed.isConfirmed) {
      try {
          await Api.post('/locations/regenerate-passwords', {});
          Ui.toast('success', 'Success', 'All router passwords have been regenerated.');
          fetchLocations();
      } catch (err) {
          Ui.toast('error', 'Failed', err.message);
      }
  }
}

// --- Navigation ---
function switchView(viewId) {
  els.navLinks.forEach(link => {
    if (link.dataset.view === viewId) {
      link.classList.add('bg-brand-primary/10', 'text-brand-primary');
      link.classList.remove('text-gray-600', 'dark:text-slate-400', 'hover:bg-gray-50', 'dark:hover:bg-slate-800');
    } else {
      link.classList.remove('bg-brand-primary/10', 'text-brand-primary');
      link.classList.add('text-gray-600', 'dark:text-slate-400', 'hover:bg-gray-50', 'dark:hover:bg-slate-800');
    }
  });

  els.views.forEach(view => {
    if (view.id === `view-${viewId}`) {
      view.classList.remove('hidden');
      view.classList.add('animate-fade-in-up');
    } else {
      view.classList.add('hidden');
      view.classList.remove('animate-fade-in-up');
    }
  });
}

function setupEventListeners() {
  els.navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const viewId = link.dataset.view;
      if (viewId === 'logout') {
          Api.logout();
          return;
      }
      switchView(viewId);
    });
  });

  document.getElementById('add-location-btn').addEventListener('click', handleAddLocation);
  document.getElementById('regenerate-btn').addEventListener('click', handleRegeneratePasswords);
}

document.addEventListener('DOMContentLoaded', init);