import { Ui, Api } from './utils.js';

// --- State ---
let LOCATIONS = [];

// --- Elements ---
const stationSelect = document.getElementById('station-select');
const registerForm = document.getElementById('registration-form');
const loginForm = document.getElementById('login-form');
const resultCard = document.getElementById('result-card');
const stationNameDisplay = document.getElementById('station-name-display');
const routerPasswordDisplay = document.getElementById('router-password');

// --- Init ---
function init() {
  populateLocations();
  setupEventListeners();
}

async function populateLocations() {
  try {
    const response = await Api.get('/locations');
    LOCATIONS = response.data;
    
    if (stationSelect) {
        stationSelect.innerHTML = '<option value="" disabled selected>Select a location...</option>';
        LOCATIONS.forEach(loc => {
            const option = document.createElement('option');
            option.value = loc.id;
            option.textContent = loc.name;
            stationSelect.appendChild(option);
        });
    }
  } catch (err) {
    Ui.toast('error', 'Network Error', 'Failed to load locations.');
  }
}

function setupEventListeners() {
  // 1. Handle Registration
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const data = {};
    
    // Use IDs for robustness
    data.name = document.getElementById('officer-name').value;
    data.phone = document.getElementById('officer-phone').value;
    data.address = document.getElementById('officer-address').value;
    data.locationId = stationSelect.value;

    if (!data.locationId) {
        Ui.toast('error', 'Error', 'Please select a station.');
        return;
    }

    const submitBtn = registerForm.querySelector('button');
    const originalText = submitBtn.innerText;
    submitBtn.innerText = 'Registering...';
    submitBtn.disabled = true;

    try {
        const response = await Api.post('/officers/register', data);
        const officer = response.data;

        await Ui.alert(
            'success',
            'Registration Successful',
            `Welcome to the team, <b>${officer.name}</b>!<br><br>
             Your Station Code is:<br>
             <h1 style="color: #0ea5e9; font-size: 2em; margin: 10px 0;">${officer.stationCode}</h1>
             <span style="font-size: 0.9em; color: gray;">Please save this code safely. You will need it to login.</span>`,
             true, false
        );
        registerForm.reset();
    } catch (err) {
        Ui.toast('error', 'Registration Failed', err.message);
    } finally {
        submitBtn.innerText = originalText;
        submitBtn.disabled = false;
    }
  });

  // 2. Handle Login (Verification)
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const codeInput = document.getElementById('station-code-input');
    const code = codeInput.value.trim().toUpperCase();
    
    if (!code) return;

    const submitBtn = loginForm.querySelector('button');
    const originalText = submitBtn.innerText;
    submitBtn.innerText = 'Verifying...';
    submitBtn.disabled = true;

    try {
        const response = await Api.post('/officers/verify', { stationCode: code });
        const result = response.data;
        
        Ui.toast('success', 'Verified', `Station Code verified for ${result.locationName}`);
        
        // Update UI
        stationNameDisplay.textContent = result.locationName;
        routerPasswordDisplay.textContent = result.routerPass;
        
        resultCard.classList.remove('hidden');
        resultCard.classList.add('flex', 'flex-col');
        resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    } catch (err) {
        Ui.toast('error', 'Access Denied', err.message);
        resultCard.classList.add('hidden');
    } finally {
        submitBtn.innerText = originalText;
        submitBtn.disabled = false;
    }
  });

  // 3. Handle Copy Password
  const copyBtn = document.getElementById('copy-password-btn');
  if (copyBtn) {
      copyBtn.addEventListener('click', () => {
          const password = document.getElementById('router-password').innerText;
          if (password === '---') return;
          
          navigator.clipboard.writeText(password).then(() => {
              Ui.toast('success', 'Copied', 'Password copied to clipboard!');
          });
      });
  }
}

document.addEventListener('DOMContentLoaded', init);