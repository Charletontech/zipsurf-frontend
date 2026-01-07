import { Ui, Api } from './utils.js';

// --- State ---
let LOCATIONS = [];
let currentUser = null;

// --- DOM Elements ---
const els = {
  walletBalance: document.querySelectorAll('.wallet-balance-display'),
  recentTransactions: document.getElementById('recent-transactions-list'),
  fullTransactions: document.getElementById('full-transactions-list'),
  locationSelect: document.getElementById('location-select'),
  connectBtn: document.getElementById('connect-btn'),
  passwordDisplay: document.getElementById('password-display'),
  passwordText: document.getElementById('password-text'),
  connectionStatus: document.getElementById('connection-status'),
  views: document.querySelectorAll('.dashboard-view'),
  navLinks: document.querySelectorAll('.nav-link'),
};

// --- Initialization ---
async function init() {
  const userStr = localStorage.getItem('user');
  if (!userStr) {
      window.location.href = '../login/index.html';
      return;
  }
  currentUser = JSON.parse(userStr);
  
  // Set User Profile UI
  const nameEl = document.querySelector('.truncate');
  if (nameEl) nameEl.textContent = currentUser.name || 'User';
  
  const emailEl = document.querySelector('.text-xs.truncate');
  if (emailEl) emailEl.textContent = currentUser.email || 'user@example.com';

  setupEventListeners();
  
  // Check for Payment Reference (Return from Paystack)
  const urlParams = new URLSearchParams(window.location.search);
  const paymentRef = urlParams.get('reference');
  if (paymentRef) {
      await verifyPayment(paymentRef);
  }

  // Parallel Fetch
  await Promise.all([
      fetchUserData(),
      fetchLocations(),
      fetchTransactions(),
      fetchUserStats()
  ]);

  // Show default view
  switchView('overview');
}

// --- API Fetchers ---

async function fetchUserStats() {
    try {
        const response = await Api.get(`/stats/user/${currentUser.id}`);
        const totalSpent = parseFloat(response.data.totalSpent);
        document.querySelectorAll('.total-spent-display').forEach(el => {
            el.textContent = `₦${totalSpent.toLocaleString()}`;
        });
    } catch (err) {
        console.error('Failed to fetch user stats', err);
    }
}

async function fetchUserData() {
    try {
        const response = await Api.get(`/users/${currentUser.id}`);
        currentUser.balance = parseFloat(response.data.balance);
        updateWalletUI();
    } catch (err) {
        console.error('Failed to fetch user data', err);
    }
}

async function fetchLocations() {
    try {
        const response = await Api.get('/locations');
        LOCATIONS = response.data;
        populateLocations();
    } catch (err) {
        console.error('Failed to fetch locations', err);
    }
}

async function fetchTransactions() {
    try {
        const response = await Api.get(`/transactions/history/${currentUser.id}`);
        const transactions = response.data;
        renderTransactions(transactions);
    } catch (err) {
        console.error('Failed to fetch transactions', err);
    }
}

// --- UI Logic ---

function updateWalletUI() {
  els.walletBalance.forEach(el => {
    el.textContent = `₦${currentUser.balance.toLocaleString()}`;
  });
}

function renderTransactions(transactions) {
  const generateRow = (tx) => {
    const isCredit = tx.type === 'fund' || tx.type === 'admin-fund';
    return `
    <tr class="border-b border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
      <td class="py-4 px-4 text-sm">
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-full ${isCredit ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}">
            <span class="material-icons text-sm">${isCredit ? 'add' : 'remove'}</span>
          </div>
          <div>
            <p class="font-medium text-gray-900 dark:text-white">${tx.description || tx.desc}</p>
            <p class="text-xs text-gray-500 dark:text-slate-500">${new Date(tx.createdAt || tx.date).toLocaleString()}</p>
          </div>
        </div>
      </td>
      <td class="py-4 px-4 text-sm text-right font-medium ${isCredit ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}">
        ${isCredit ? '+' : '-'}₦${parseFloat(tx.amount).toLocaleString()}
      </td>
      <td class="py-4 px-4 text-sm text-right">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          ${tx.status}
        </span>
      </td>
    </tr>
  `;
  };

  if (els.recentTransactions) {
    els.recentTransactions.innerHTML = transactions.slice(0, 3).map(generateRow).join('');
  }
  if (els.fullTransactions) {
    els.fullTransactions.innerHTML = transactions.map(generateRow).join('');
  }
}

function populateLocations() {
  if (!els.locationSelect) return;
  
  els.locationSelect.innerHTML = '<option value="" disabled selected>Select a location...</option>';
  LOCATIONS.forEach(loc => {
    const option = document.createElement('option');
    option.value = loc.id;
    option.textContent = loc.name + (loc.status === 'Maintenance' ? ' (Maintenance)' : '');
    option.disabled = loc.status === 'Maintenance';
    els.locationSelect.appendChild(option);
  });
}

function showPassword(password, locationName) {
  if (els.passwordDisplay) {
    els.passwordDisplay.classList.remove('hidden');
    els.passwordDisplay.classList.add('flex');
    els.passwordText.textContent = password;
  }
  if (els.connectionStatus) {
    els.connectionStatus.innerHTML = `
      <div class="flex items-center gap-2 text-green-500">
        <span class="material-icons text-sm">wifi</span>
        <span class="font-medium">Access Granted: ${locationName}</span>
      </div>
    `;
  }
  if (els.connectBtn) {
    els.connectBtn.textContent = 'View Password';
    els.connectBtn.onclick = () => {
       els.passwordDisplay.scrollIntoView({ behavior: 'smooth' });
    };
  }
}

// --- Action Handlers ---

async function verifyPayment(reference) {
    try {
        // Clear URL
        window.history.replaceState({}, document.title, window.location.pathname);
        
        Ui.toast('info', 'Verifying Payment', 'Please wait...');
        const response = await Api.post('/paystack/verify', { reference });
        
        if (response.status === 'success') {
            await Ui.alert('success', 'Payment Successful', `Wallet funded with ₦${response.data.amount.toLocaleString()}`);
            fetchUserData(); // Refresh balance
            fetchTransactions();
        }
    } catch (err) {
        Ui.toast('error', 'Payment Verification Failed', err.message);
    }
}

async function handleConnect() {
  const locationId = els.locationSelect.value;
  if (!locationId) {
    Ui.toast('error', 'Select Location', 'Please select a location first.');
    return;
  }

  const location = LOCATIONS.find(l => l.id === locationId);
  const cost = 1200;

  try {
    const result = await Ui.alert(
      'question', 
      'Confirm Access', 
      `Request password for <b>${location.name}</b>?<br>This will deduct <b>₦${cost}</b> from your wallet.`,
      true, true
    );

    if (result && result.isConfirmed) {
      if (currentUser.balance < cost) {
        Ui.toast('error', 'Insufficient Funds', 'Please fund your wallet to proceed.');
        return;
      }

      // API Call
      const response = await Api.post('/transactions/purchase', {
          userId: currentUser.id,
          locationId: locationId,
          amount: cost
      });

      const data = response.data;
      
      // Update Local State
      currentUser.balance = parseFloat(data.balance);
      updateWalletUI();
      fetchTransactions(); // Refresh history
      fetchUserStats(); // Update total spent
      
      showPassword(data.password, location.name);
      Ui.toast('success', 'Access Granted', 'You have successfully purchased access for today.');
    }
  } catch (err) {
    Ui.toast('error', 'Transaction Failed', err.message);
  }
}

async function handleFundWallet() {
  const { value: amount } = await Swal.fire({ 
     title: 'Fund Wallet',
     input: 'number',
     inputLabel: 'Enter amount (₦)',
     inputPlaceholder: '5000',
     showCancelButton: true
  });

  if (amount) {
     const val = parseFloat(amount);
     if (val > 0) {
        try {
            const response = await Api.post('/paystack/initialize', { amount: val });
            const { authorization_url } = response.data;
            
            // Redirect to Paystack
            window.location.href = authorization_url;
        } catch (err) {
            Ui.toast('error', 'Initialization Failed', err.message);
        }
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

  if (els.connectBtn) {
    els.connectBtn.addEventListener('click', handleConnect);
  }

  document.querySelectorAll('.fund-wallet-btn').forEach(btn => {
    btn.addEventListener('click', handleFundWallet);
  });

  const copyBtn = document.getElementById('copy-user-password-btn');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const password = document.getElementById('password-text').innerText;
      if (password === '---') return;
      navigator.clipboard.writeText(password).then(() => {
        Ui.toast('success', 'Copied', 'Password copied to clipboard');
      });
    });
  }
}

document.addEventListener('DOMContentLoaded', init);
