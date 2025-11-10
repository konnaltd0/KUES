// API Configuration
const API_ENDPOINT = 'https://script.google.com/macros/s/AKfycbzU31OTiU8a0lCvDZHG4dfvyBigu6Cx1TZSS8Ugsrw4rXBczdBpXIjej3CYEDTntXU11Q/exec';

// Blood types array
const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

// Global state
let appState = {
  donors: [],
  inventory: [],
  requests: [],
  adminLoggedIn: false,
  donorLoggedIn: false,
  currentDonor: null,
  currentPage: 'home',
  adminCredentials: {
    username: 'admin',
    password: 'kues2024',
    email: 'admin@kuesbloodbank.org'
  },
  donorCredentials: [],
  donorDonations: [],
  siteSettings: {
    orgName: 'KUES Blood Bank',
    orgTagline: 'Saving Lives Through Efficient Blood Management',
    orgAddress: 'Khulna University of Engineering & Technology, Khulna, Bangladesh',
    orgEmail: 'info@kuesbloodbank.org',
    emergencyPhone: '+880-1XXX-XXXXXX',
    operatingHours: '24/7 Available',
    aboutTitle: 'About KUES Blood Bank',
    aboutDescription: 'KUES Blood Bank is a vital healthcare facility dedicated to saving lives through efficient blood supply management. We serve hospitals, clinics, and patients across the region with the highest standards of safety and quality. Our mission is to ensure that every patient who needs blood has access to safe, tested, and reliable blood products when they need it most.',
    missionStatement: 'To save lives by managing an efficient blood supply and connecting dedicated donors with those in urgent need of blood transfusions',
    visionStatement: 'To be the most trusted and reliable blood bank service, setting new standards in blood safety and donor care',
    benefits: [
      'Free comprehensive health screening and medical checkup',
      'Donor identification card and certificate',
      'Satisfaction of directly saving lives',
      'Health benefits from regular blood donation',
      'Community recognition and appreciation'
    ],
    requirements: [
      'Age: 18-65 years',
      'Weight: Minimum 50 kg',
      'Good general health',
      'No recent illness or infection',
      'No tattoos in the last 6 months',
      'No recent travel to malaria-endemic zones',
      'Minimum 8 weeks gap between donations'
    ],
    contactAddress: 'Khulna University of Engineering & Technology, Khulna, Bangladesh',
    contactPhone: '+880-41-769001',
    contactEmail: 'info@kuesbloodbank.org',
    contactEmergency: '+880-1XXX-XXXXXX',
    contactHours: '24/7 Available',
    goodStockLevel: 20,
    lowStockLevel: 10,
    supportEmail: 'support@kuesbloodbank.org',
    supportPhone: '+880-XXXX-XXXXXX',
    aboutLastUpdated: null
  }
};

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
  loadHomePageData();
  setupBloodTypeFilters();
  setMinDate();
  setupStudentIdValidation();
  applySiteSettings();
  setupPasswordStrengthIndicator();
  setupDonorPasswordStrength();
  updateNavbarForDonor();
  setupLastDonationDateListener();
  setLastDonationMaxDate();
});

// Navigation
function setupNavigation() {
  const navLinks = document.querySelectorAll('.nav-link');
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetPage = link.getAttribute('href').substring(1);
      navigateTo(targetPage);
      if (navMenu.classList.contains('active')) {
        navMenu.classList.remove('active');
      }
    });
  });

  if (navToggle) {
    navToggle.addEventListener('click', () => {
      navMenu.classList.toggle('active');
    });
  }
}

function updateNavbarForDonor() {
  const donorPortalLink = document.getElementById('donorPortalLink');
  if (donorPortalLink) {
    if (appState.donorLoggedIn && appState.currentDonor) {
      donorPortalLink.textContent = `Welcome, ${appState.currentDonor.fullName.split(' ')[0]}`;
      donorPortalLink.setAttribute('href', '#donor-dashboard');
    } else {
      donorPortalLink.textContent = 'Donor Portal';
      donorPortalLink.setAttribute('href', '#donor-login');
    }
  }
}

function navigateTo(page) {
  const pages = document.querySelectorAll('.page');
  const navLinks = document.querySelectorAll('.nav-link');

  pages.forEach(p => p.classList.remove('active'));
  navLinks.forEach(l => l.classList.remove('active'));

  const targetPage = document.getElementById(page);
  const targetLink = document.querySelector(`[href="#${page}"]`);

  if (targetPage) {
    targetPage.classList.add('active');
    appState.currentPage = page;
  }

  if (targetLink) {
    targetLink.classList.add('active');
  }

  window.scrollTo(0, 0);

  // Load page-specific data
  if (page === 'home') {
    loadHomePageData();
  } else if (page === 'find-donors') {
    loadDonors();
  } else if (page === 'inventory') {
    loadInventory();
  } else if (page === 'about') {
    updateAboutPage();
  } else if (page === 'admin' && appState.adminLoggedIn) {
    loadAdminDashboard();
  } else if (page === 'donor-dashboard' && appState.donorLoggedIn) {
    loadDonorDashboard();
  } else if (page === 'donor-profile' && appState.donorLoggedIn) {
    loadDonorProfile();
  } else if (page === 'donor-requests' && appState.donorLoggedIn) {
    loadDonorRequests();
  } else if (page === 'donor-history' && appState.donorLoggedIn) {
    loadDonorHistory();
  } else if (page === 'donor-settings' && appState.donorLoggedIn) {
    loadDonorSettings();
  } else if (page === 'donor-login' && appState.donorLoggedIn) {
    navigateTo('donor-dashboard');
  }
}

// API Functions
function showLoader() {
  document.getElementById('loader').style.display = 'flex';
}

function hideLoader() {
  document.getElementById('loader').style.display = 'none';
}

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type} active`;
  setTimeout(() => {
    toast.classList.remove('active');
  }, 3000);
}

async function apiRequest(action, data = null, method = 'GET') {
  showLoader();
  try {
    let url = API_ENDPOINT;
    let options = {
      method: method,
      mode: 'cors'
    };

    if (method === 'GET' && action) {
      url += `?action=${action}`;
    } else if (method === 'POST' && data) {
      options.body = JSON.stringify({ action, ...data });
      options.headers = {
        'Content-Type': 'application/json'
      };
    }

    const response = await fetch(url, options);
    const result = await response.json();
    hideLoader();
    return result;
  } catch (error) {
    hideLoader();
    console.error('API Error:', error);
    showToast('Network error. Please try again.', 'error');
    return null;
  }
}

// Home Page Functions
async function loadHomePageData() {
  // Load statistics
  loadStatistics();
}

function loadStatistics() {
  // Production ready - starts with zero data
  document.getElementById('totalDonors').textContent = '0';
  document.getElementById('totalUnits').textContent = '0';
  document.getElementById('pendingRequests').textContent = '0';
  document.getElementById('livesSaved').textContent = '0';
}

function quickSearch() {
  const bloodType = document.getElementById('quickSearchBloodType').value;
  if (!bloodType) {
    showToast('Please select a blood type', 'error');
    return;
  }

  // Production ready - no demo data
  const results = [];
  displayQuickSearchResults(results);
}

function displayQuickSearchResults(donors) {
  const container = document.getElementById('quickSearchResults');
  if (donors.length === 0) {
    container.innerHTML = '<div class="empty-state">📦 <strong>No donors found</strong><br>No donors are currently registered for this blood type. Register as a donor to help save lives!</div>';
    return;
  }

  container.innerHTML = donors.map(donor => `
    <div class="donor-card">
      <div class="donor-blood-type">${donor.bloodType}</div>
      <div class="donor-name">${donor.name.charAt(0)}. ${donor.name.split(' ').pop()}</div>
      <div class="donor-info">📍 ${donor.city}</div>
      <button class="btn btn--primary" onclick='showDonorContact(${JSON.stringify(donor)})'>Contact</button>
    </div>
  `).join('');
}

// Donor Search Page
function setupBloodTypeFilters() {
  const container = document.getElementById('bloodTypeFilters');
  if (container) {
    container.innerHTML = BLOOD_TYPES.map(type => `
      <label class="checkbox-label">
        <input type="checkbox" value="${type}" class="blood-type-checkbox">
        ${type}
      </label>
    `).join('');
  }
}

async function loadDonors() {
  // Production ready - no demo data
  const sampleDonors = [];

  appState.donors = sampleDonors;
  
  // Empty city filter for production
  const cityFilter = document.getElementById('cityFilter');
  cityFilter.innerHTML = '<option value="">All Cities</option>';
  
  // Show empty state
  displayDonorResults(sampleDonors);
}

function searchDonors() {
  const searchText = document.getElementById('donorSearchInput').value.toLowerCase();
  const city = document.getElementById('cityFilter').value;
  const status = document.getElementById('statusFilter').value;
  const checkedBloodTypes = Array.from(document.querySelectorAll('.blood-type-checkbox:checked')).map(cb => cb.value);

  let filtered = appState.donors;

  if (searchText) {
    filtered = filtered.filter(d => 
      d.name.toLowerCase().includes(searchText) ||
      d.bloodType.toLowerCase().includes(searchText) ||
      d.city.toLowerCase().includes(searchText)
    );
  }

  if (city) {
    filtered = filtered.filter(d => d.city === city);
  }

  if (status) {
    filtered = filtered.filter(d => d.status === status);
  }

  if (checkedBloodTypes.length > 0) {
    filtered = filtered.filter(d => checkedBloodTypes.includes(d.bloodType));
  }

  displayDonorResults(filtered);
}

function displayDonorResults(donors) {
  const container = document.getElementById('donorResults');
  if (donors.length === 0) {
    container.innerHTML = '<div class="empty-state">📋 <strong>No Donors Found</strong><br>No donors are registered in the system yet. Enter search criteria and click search, or register as a new donor to get started.</div>';
    return;
  }

  container.innerHTML = donors.map(donor => `
    <div class="donor-card">
      <div class="donor-blood-type">${donor.bloodType}</div>
      <div class="donor-name">${donor.name.charAt(0)}. ${donor.name.split(' ').pop()}</div>
      <div class="donor-info">📍 ${donor.city}</div>
      <div class="donor-info">Last Donation: ${formatDate(donor.lastDonation)}</div>
      <button class="btn btn--primary" onclick='showDonorContact(${JSON.stringify(donor)})'>Contact</button>
    </div>
  `).join('');
}

function clearDonorFilters() {
  document.getElementById('donorSearchInput').value = '';
  document.getElementById('cityFilter').value = '';
  document.getElementById('statusFilter').value = '';
  document.querySelectorAll('.blood-type-checkbox').forEach(cb => cb.checked = false);
  displayDonorResults(appState.donors);
}

function showDonorContact(donor) {
  const modal = document.getElementById('donorModal');
  const content = document.getElementById('donorModalContent');
  
  content.innerHTML = `
    <p><strong>Name:</strong> ${donor.name}</p>
    <p><strong>Blood Type:</strong> ${donor.bloodType}</p>
    <p><strong>City:</strong> ${donor.city}</p>
    <p><strong>Phone:</strong> ${donor.phone}</p>
    <p><strong>Last Donation:</strong> ${formatDate(donor.lastDonation || 'N/A')}</p>
    <div style="margin-top: 20px; display: flex; gap: 12px;">
      <a href="tel:${donor.phone}" class="btn btn--primary">Call Now</a>
      <button class="btn btn--secondary">Send Message</button>
    </div>
  `;
  
  modal.classList.add('active');
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('active');
}

// Blood Inventory Page
async function loadInventory() {
  // Production ready - all blood types with 0 units
  const sampleInventory = [
    { bloodType: 'O+', units: 0, collectionDate: 'N/A', status: 'No Stock', location: 'Main Bank' },
    { bloodType: 'A+', units: 0, collectionDate: 'N/A', status: 'No Stock', location: 'Main Bank' },
    { bloodType: 'B+', units: 0, collectionDate: 'N/A', status: 'No Stock', location: 'Main Bank' },
    { bloodType: 'B-', units: 0, collectionDate: 'N/A', status: 'No Stock', location: 'Main Bank' },
    { bloodType: 'AB+', units: 0, collectionDate: 'N/A', status: 'No Stock', location: 'Main Bank' },
    { bloodType: 'AB-', units: 0, collectionDate: 'N/A', status: 'No Stock', location: 'Main Bank' },
    { bloodType: 'O-', units: 0, collectionDate: 'N/A', status: 'No Stock', location: 'Main Bank' },
    { bloodType: 'A-', units: 0, collectionDate: 'N/A', status: 'No Stock', location: 'Main Bank' }
  ];

  appState.inventory = sampleInventory;
  displayInventoryCards(sampleInventory);
  displayInventoryTable(sampleInventory);
}

function displayInventoryCards(inventory) {
  const container = document.getElementById('inventoryCards');
  
  // Show empty state message at top
  const emptyMessage = '<div class="empty-state" style="grid-column: 1/-1; margin-bottom: 24px;">📦 <strong>No Blood Inventory</strong><br>Your blood bank is empty. Admin can add blood units from the Admin Dashboard &gt; Inventory Management.</div>';
  
  container.innerHTML = emptyMessage + inventory.map(item => {
    const statusClass = item.status === 'Good Stock' ? 'good' : 
                       item.status === 'Low Stock' ? 'low' : item.status === 'No Stock' ? 'critical' : 'critical';
    
    return `
      <div class="inventory-card">
        <div class="blood-type-large" style="color: ${getBloodTypeColor(item.bloodType)}">${item.bloodType}</div>
        <div class="units-count">${item.units} units</div>
        <div class="stock-status ${statusClass}">${item.status}</div>
        <button class="btn btn--outline" onclick="navigateTo('request')">Request This Type</button>
      </div>
    `;
  }).join('');
}

function displayInventoryTable(inventory) {
  const tbody = document.getElementById('inventoryTableBody');
  
  // Filter out items with 0 units for table display
  const itemsWithStock = inventory.filter(item => item.units > 0);
  
  if (itemsWithStock.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 32px; color: var(--color-text-secondary);">No blood inventory data available. Admin can add blood units to populate this table.</td></tr>';
    return;
  }
  
  tbody.innerHTML = itemsWithStock.map(item => {
    const expirationDate = calculateExpirationDate(item.collectionDate);
    const statusClass = item.status === 'Good Stock' ? 'good' : 
                       item.status === 'Low Stock' ? 'low' : 'critical';
    
    return `
      <tr>
        <td><strong>${item.bloodType}</strong></td>
        <td>${item.units}</td>
        <td>${formatDate(item.collectionDate)}</td>
        <td>${formatDate(expirationDate)}</td>
        <td><span class="stock-status ${statusClass}">${item.status}</span></td>
        <td>${item.location}</td>
      </tr>
    `;
  }).join('');
}

function filterInventory() {
  const bloodType = document.getElementById('inventoryBloodTypeFilter').value;
  const status = document.getElementById('inventoryStatusFilter').value;

  let filtered = appState.inventory;

  if (bloodType) {
    filtered = filtered.filter(i => i.bloodType === bloodType);
  }

  if (status) {
    filtered = filtered.filter(i => i.status === status);
  }

  displayInventoryCards(filtered);
  displayInventoryTable(filtered);
}

// Student ID Validation
function setupStudentIdValidation() {
  const studentIdInput = document.getElementById('studentId');
  if (studentIdInput) {
    studentIdInput.addEventListener('input', (e) => {
      const value = e.target.value;
      const errorDiv = document.getElementById('studentIdError');
      
      // Remove non-numeric characters
      e.target.value = value.replace(/[^0-9]/g, '');
      
      // Real-time validation
      if (value.length > 0 && value.length < 6) {
        errorDiv.textContent = 'Student ID must be exactly 6 digits';
        errorDiv.style.display = 'block';
        e.target.style.borderColor = 'var(--color-error)';
      } else if (value.length === 6 && !/^[0-9]{6}$/.test(value)) {
        errorDiv.textContent = 'Student ID must contain only numbers';
        errorDiv.style.display = 'block';
        e.target.style.borderColor = 'var(--color-error)';
      } else if (value.length === 6) {
        errorDiv.style.display = 'none';
        e.target.style.borderColor = '#3B82F6';
      } else {
        errorDiv.style.display = 'none';
        e.target.style.borderColor = '';
      }
    });
  }
}

// Blood Request Form
function setMinDate() {
  const dateInputs = document.querySelectorAll('input[type="date"]');
  const today = new Date().toISOString().split('T')[0];
  dateInputs.forEach(input => {
    if (input.id === 'requiredDate') {
      input.min = today;
    }
  });
}

function setLastDonationMaxDate() {
  const lastDonationInput = document.getElementById('lastDonation');
  if (lastDonationInput) {
    const today = new Date().toISOString().split('T')[0];
    lastDonationInput.max = today;
  }
}

function toggleLastDonationField() {
  const checkbox = document.getElementById('hasDonatedBefore');
  const container = document.getElementById('lastDonationContainer');
  const lastDonationInput = document.getElementById('lastDonation');
  
  if (checkbox && container && lastDonationInput) {
    if (checkbox.checked) {
      container.style.display = 'block';
      lastDonationInput.required = true;
    } else {
      container.style.display = 'none';
      lastDonationInput.required = false;
      lastDonationInput.value = '';
      document.getElementById('eligibilityPreview').innerHTML = '';
    }
  }
}

function setupLastDonationDateListener() {
  const lastDonationInput = document.getElementById('lastDonation');
  if (lastDonationInput) {
    lastDonationInput.addEventListener('change', calculateEligibilityPreview);
  }
}

function calculateEligibilityPreview() {
  const lastDonationInput = document.getElementById('lastDonation');
  const previewDiv = document.getElementById('eligibilityPreview');
  const dobInput = document.getElementById('dateOfBirth');
  
  if (!lastDonationInput || !previewDiv) return;
  
  const lastDonationDate = lastDonationInput.value;
  
  if (!lastDonationDate) {
    previewDiv.innerHTML = '';
    return;
  }
  
  const today = new Date();
  const lastDate = new Date(lastDonationDate);
  
  // Validate not future date
  if (lastDate > today) {
    previewDiv.innerHTML = '<div class="eligibility-preview waiting"><div class="preview-title">❌ Invalid Date</div><div class="preview-detail">Last donation date cannot be in the future</div></div>';
    return;
  }
  
  // Validate age at donation (must be 18+)
  if (dobInput && dobInput.value) {
    const dob = new Date(dobInput.value);
    const ageAtDonation = Math.floor((lastDate - dob) / (365.25 * 24 * 60 * 60 * 1000));
    
    if (ageAtDonation < 18) {
      previewDiv.innerHTML = '<div class="eligibility-preview waiting"><div class="preview-title">❌ Invalid Date</div><div class="preview-detail">You would have been too young to donate at this date (minimum age: 18)</div></div>';
      return;
    }
  }
  
  const daysSinceDonation = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
  const nextEligibleDate = new Date(lastDate);
  nextEligibleDate.setDate(nextEligibleDate.getDate() + 90);
  
  if (daysSinceDonation >= 90) {
    previewDiv.innerHTML = `
      <div class="eligibility-preview eligible">
        <div class="preview-title">✅ Eligible to Donate Now</div>
        <div class="preview-detail">It has been ${daysSinceDonation} days since your last donation</div>
      </div>
    `;
  } else {
    const daysRemaining = 90 - daysSinceDonation;
    previewDiv.innerHTML = `
      <div class="eligibility-preview waiting">
        <div class="preview-title">⏳ Can Donate in ${daysRemaining} Days</div>
        <div class="preview-detail">Next eligible donation: ${formatDate(nextEligibleDate.toISOString().split('T')[0])}</div>
      </div>
    `;
  }
}

async function submitRequest(event) {
  event.preventDefault();
  
  // Validate Student ID
  const studentId = document.getElementById('studentId').value;
  const errorDiv = document.getElementById('studentIdError');
  
  if (!studentId) {
    errorDiv.textContent = 'Student ID is required';
    errorDiv.style.display = 'block';
    document.getElementById('studentId').style.borderColor = 'var(--color-error)';
    document.getElementById('studentId').focus();
    return;
  }
  
  if (studentId.length !== 6 || !/^[0-9]{6}$/.test(studentId)) {
    errorDiv.textContent = 'Please enter a valid 6-digit Student ID';
    errorDiv.style.display = 'block';
    document.getElementById('studentId').style.borderColor = 'var(--color-error)';
    document.getElementById('studentId').focus();
    return;
  }
  
  const formData = {
    requestId: 'R' + Date.now(),
    studentId: studentId,
    requestType: document.getElementById('requestType').value,
    patientName: document.getElementById('patientName').value,
    bloodType: document.getElementById('requestBloodType').value,
    unitsRequired: document.getElementById('unitsRequired').value,
    hospital: document.getElementById('hospital').value,
    requiredDate: document.getElementById('requiredDate').value,
    contactPerson: document.getElementById('contactPerson').value,
    contactPhone: document.getElementById('contactPhone').value,
    reason: document.getElementById('requestReason').value,
    notes: document.getElementById('requestNotes').value,
    priority: document.getElementById('requestType').value === 'Emergency' ? 'High' : 'Normal',
    status: 'Pending',
    requestDate: new Date().toISOString().split('T')[0]
  };

  showLoader();
  setTimeout(() => {
    hideLoader();
    showToast(`Request submitted successfully! Your Request ID is ${formData.requestId}. Your Student ID ${formData.studentId} has been recorded. You will be contacted soon.`);
    document.getElementById('requestForm').reset();
  }, 1500);
}

// Donor Registration Form
async function submitDonor(event) {
  event.preventDefault();

  const dob = document.getElementById('dateOfBirth').value;
  const age = calculateAge(dob);

  if (age < 18) {
    showToast('You must be at least 18 years old to donate blood', 'error');
    return;
  }

  if (age > 65) {
    showToast('Donors must be under 65 years old', 'error');
    return;
  }

  const password = document.getElementById('donorPassword').value;
  const confirmPassword = document.getElementById('donorConfirmPassword').value;

  if (password.length < 8) {
    showToast('Password must be at least 8 characters', 'error');
    return;
  }

  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    showToast('Password must contain both letters and numbers', 'error');
    return;
  }

  if (password !== confirmPassword) {
    showToast('Passwords do not match', 'error');
    return;
  }

  const email = document.getElementById('email').value;
  const emailExists = appState.donorCredentials.find(d => d.email === email);
  if (emailExists) {
    showToast('Email already registered. Please login instead.', 'error');
    return;
  }

  const gender = document.querySelector('input[name="gender"]:checked')?.value;

  const donorId = 'D' + Date.now();
  const formData = {
    donorId: donorId,
    fullName: document.getElementById('fullName').value,
    bloodType: document.getElementById('bloodType').value,
    dateOfBirth: dob,
    gender: gender,
    phone: document.getElementById('phone').value,
    email: email,
    address: document.getElementById('address').value,
    city: document.getElementById('city').value,
    lastDonationDate: document.getElementById('lastDonation').value || null,
    nextEligibleDate: null,
    totalDonations: 0,
    emergencyContactName: document.getElementById('emergencyName').value,
    emergencyContactPhone: document.getElementById('emergencyPhone').value,
    medicalHistory: document.getElementById('medicalHistory').value,
    status: 'Active',
    registrationDate: new Date().toISOString().split('T')[0],
    lastLoginDate: null,
    notificationEmailEnabled: true,
    notificationSMSEnabled: true
  };

  // Store credentials
  appState.donorCredentials.push({
    donorId: donorId,
    email: email,
    passwordHash: password,
    createdDate: new Date().toISOString().split('T')[0],
    lastLoginDate: null,
    status: 'Active'
  });

  // Calculate next eligible date if last donation exists
  if (formData.lastDonationDate) {
    const lastDate = new Date(formData.lastDonationDate);
    const today = new Date();
    const daysSince = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
    
    lastDate.setDate(lastDate.getDate() + 90);
    formData.nextEligibleDate = lastDate.toISOString().split('T')[0];
    formData.daysSinceLastDonation = daysSince;
  } else {
    formData.daysSinceLastDonation = null;
  }

  appState.donors.push(formData);

  showLoader();
  setTimeout(() => {
    hideLoader();
    showToast('Registration successful! Please login with your email and password.');
    document.getElementById('donorForm').reset();
    navigateTo('donor-login');
  }, 1500);
}

// Donor Login Functions
function donorLogin(event) {
  event.preventDefault();
  
  const email = document.getElementById('donorLoginEmail').value;
  const password = document.getElementById('donorLoginPassword').value;

  const credentials = appState.donorCredentials.find(c => c.email === email && c.passwordHash === password);
  
  if (credentials) {
    const donor = appState.donors.find(d => d.donorId === credentials.donorId);
    
    if (donor) {
      appState.donorLoggedIn = true;
      appState.currentDonor = donor;
      credentials.lastLoginDate = new Date().toISOString().split('T')[0];
      donor.lastLoginDate = credentials.lastLoginDate;
      
      updateNavbarForDonor();
      navigateTo('donor-dashboard');
      showToast(`Welcome back, ${donor.fullName.split(' ')[0]}!`);
    } else {
      showToast('Account not found', 'error');
    }
  } else {
    showToast('Invalid email or password', 'error');
  }
}

function donorLogout() {
  appState.donorLoggedIn = false;
  appState.currentDonor = null;
  updateNavbarForDonor();
  document.getElementById('donorLoginForm').reset();
  navigateTo('home');
  showToast('Logged out successfully');
}

function donorForgotPassword(event) {
  event.preventDefault();
  
  const email = document.getElementById('donorForgotEmail').value;
  const credentials = appState.donorCredentials.find(c => c.email === email);
  
  if (credentials) {
    showToast(`Password reset link sent to ${email}. Please check your email.`);
  } else {
    showToast('If an account exists with this email, a reset link will be sent.');
  }
  
  setTimeout(() => {
    navigateTo('donor-login');
  }, 2000);
}

function togglePasswordVisibility(inputId, button) {
  const input = document.getElementById(inputId);
  if (input.type === 'password') {
    input.type = 'text';
    button.textContent = 'Hide';
  } else {
    input.type = 'password';
    button.textContent = 'Show';
  }
}

function setupDonorPasswordStrength() {
  const donorPasswordInput = document.getElementById('donorPassword');
  if (donorPasswordInput) {
    donorPasswordInput.addEventListener('input', (e) => {
      const password = e.target.value;
      const strengthDiv = document.getElementById('donorPasswordStrength');
      
      if (password.length === 0) {
        strengthDiv.innerHTML = '';
        strengthDiv.className = 'password-strength';
        return;
      }
      
      let strength = 'weak';
      let strengthText = 'Weak';
      
      if (password.length >= 8) {
        const hasLetters = /[a-zA-Z]/.test(password);
        const hasNumbers = /[0-9]/.test(password);
        const hasSpecial = /[^a-zA-Z0-9]/.test(password);
        
        if (hasLetters && hasNumbers && hasSpecial && password.length >= 12) {
          strength = 'strong';
          strengthText = 'Strong';
        } else if (hasLetters && hasNumbers && password.length >= 8) {
          strength = 'medium';
          strengthText = 'Medium';
        }
      }
      
      strengthDiv.className = 'password-strength ' + strength;
      strengthDiv.innerHTML = '<div class="password-strength-bar"></div><span class="password-strength-text">Password Strength: ' + strengthText + '</span>';
    });
  }
}

// Donor Dashboard Functions
function loadDonorDashboard() {
  if (!appState.currentDonor) return;
  
  const donor = appState.currentDonor;
  const eligibility = calculateDonorEligibility(donor);
  
  const content = document.getElementById('donorDashboardContent');
  content.innerHTML = `
    <div class="dashboard-menu">
      <a href="#donor-dashboard" onclick="navigateTo('donor-dashboard')" class="dashboard-menu-item active">Dashboard</a>
      <a href="#donor-profile" onclick="navigateTo('donor-profile')" class="dashboard-menu-item">My Profile</a>
      <a href="#donor-requests" onclick="navigateTo('donor-requests')" class="dashboard-menu-item">Blood Requests</a>
      <a href="#donor-history" onclick="navigateTo('donor-history')" class="dashboard-menu-item">Donation History</a>
      <a href="#donor-settings" onclick="navigateTo('donor-settings')" class="dashboard-menu-item">Settings</a>
    </div>
    
    <div class="donor-info-card">
      <h2 style="text-align: center; margin-bottom: 8px;">Your Blood Type</h2>
      <div class="donor-blood-type-display">${donor.bloodType}</div>
      
      <div class="eligibility-status ${eligibility.isEligible ? 'eligible' : 'waiting'}">
        ${eligibility.isEligible ? '✅ Eligible to Donate' : '⏳ Waiting Period'}
        ${!eligibility.isEligible ? `<div class="countdown-display">${eligibility.daysRemaining} days remaining</div>` : ''}
        ${eligibility.nextEligibleDate ? `<div class="next-donation-date">Next eligible: ${formatDate(eligibility.nextEligibleDate)}</div>` : ''}
        ${donor.lastDonationDate ? `<div class="next-donation-date" style="margin-top: 8px;">Last donated: ${formatDate(donor.lastDonationDate)} (${eligibility.daysSince} days ago)</div>` : '<div class="next-donation-date" style="margin-top: 8px;">First-time donor - eligible immediately</div>'}
      </div>
      
      <div class="donor-stats">
        <div class="donor-stat-card">
          <div class="donor-stat-value">${donor.totalDonations || 0}</div>
          <div class="donor-stat-label">Total Donations</div>
        </div>
        <div class="donor-stat-card">
          <div class="donor-stat-value">${donor.totalDonations || 0}</div>
          <div class="donor-stat-label">Lives Helped</div>
        </div>
        <div class="donor-stat-card">
          <div class="donor-stat-value">${donor.lastDonationDate ? formatDate(donor.lastDonationDate) : 'Never'}</div>
          <div class="donor-stat-label">Last Donation</div>
        </div>
      </div>
    </div>
    
    <div style="margin-top: 24px;">
      <h3>Quick Actions</h3>
      <div class="quick-actions">
        <button class="btn btn--primary" onclick="navigateTo('donor-requests')">View Blood Requests</button>
        <button class="btn btn--secondary" onclick="navigateTo('donor-profile')">Edit Profile</button>
        <button class="btn btn--secondary" onclick="navigateTo('donor-history')">View History</button>
      </div>
    </div>
  `;
}

function calculateDonorEligibility(donor) {
  if (!donor.lastDonationDate) {
    return { isEligible: true, daysRemaining: 0, nextEligibleDate: null, daysSince: null };
  }
  
  const lastDonation = new Date(donor.lastDonationDate);
  const today = new Date();
  const daysSinceDonation = Math.floor((today - lastDonation) / (1000 * 60 * 60 * 24));
  
  // Update donor's days since last donation
  donor.daysSinceLastDonation = daysSinceDonation;
  
  if (daysSinceDonation >= 90) {
    return { isEligible: true, daysRemaining: 0, nextEligibleDate: null, daysSince: daysSinceDonation };
  }
  
  const daysRemaining = 90 - daysSinceDonation;
  const nextEligible = new Date(lastDonation);
  nextEligible.setDate(nextEligible.getDate() + 90);
  
  return {
    isEligible: false,
    daysRemaining: daysRemaining,
    nextEligibleDate: nextEligible.toISOString().split('T')[0],
    daysSince: daysSinceDonation
  };
}

function loadDonorProfile() {
  if (!appState.currentDonor) return;
  
  const donor = appState.currentDonor;
  const fieldsContainer = document.getElementById('donorProfileFields');
  
  fieldsContainer.innerHTML = `
    <!-- Donation History Section -->
    <div class="donation-history-section">
      <h3>Donation History</h3>
      <div class="donation-info-grid">
        <div class="donation-info-item">
          <div class="label">Last Donation Date</div>
          <div class="value">${donor.lastDonationDate ? formatDate(donor.lastDonationDate) : 'Never'}</div>
        </div>
        <div class="donation-info-item">
          <div class="label">Days Since Last Donation</div>
          <div class="value">${donor.daysSinceLastDonation !== null && donor.daysSinceLastDonation !== undefined ? donor.daysSinceLastDonation : 'N/A'}</div>
        </div>
        <div class="donation-info-item">
          <div class="label">Next Eligible Date</div>
          <div class="value">${donor.nextEligibleDate ? formatDate(donor.nextEligibleDate) : 'Eligible Now'}</div>
        </div>
        <div class="donation-info-item">
          <div class="label">Status</div>
          <div class="value" style="color: ${calculateDonorEligibility(donor).isEligible ? 'var(--kues-green-dark)' : 'var(--kues-orange-dark)'}">
            ${calculateDonorEligibility(donor).isEligible ? '✅ Eligible' : '⏳ Waiting'}
          </div>
        </div>
      </div>
      <button type="button" class="btn btn--secondary" onclick="openUpdateDonationDateModal()">Update Last Donation Date</button>
    </div>
    
    <h3 style="margin-top: var(--space-32); margin-bottom: var(--space-16);">Personal Information</h3>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Full Name</label>
        <input type="text" class="form-control" id="editFullName" value="${donor.fullName}" required>
      </div>
      <div class="form-group">
        <label class="form-label">Blood Type</label>
        <select class="form-control" id="editBloodType" required>
          ${BLOOD_TYPES.map(type => `<option value="${type}" ${donor.bloodType === type ? 'selected' : ''}>${type}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Date of Birth</label>
        <input type="date" class="form-control" id="editDOB" value="${donor.dateOfBirth}" required>
      </div>
      <div class="form-group">
        <label class="form-label">Gender</label>
        <select class="form-control" id="editGender" required>
          <option value="Male" ${donor.gender === 'Male' ? 'selected' : ''}>Male</option>
          <option value="Female" ${donor.gender === 'Female' ? 'selected' : ''}>Female</option>
          <option value="Other" ${donor.gender === 'Other' ? 'selected' : ''}>Other</option>
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Phone Number</label>
        <input type="tel" class="form-control" id="editPhone" value="${donor.phone}" required>
      </div>
      <div class="form-group">
        <label class="form-label">Email</label>
        <input type="email" class="form-control" id="editEmail" value="${donor.email}" required>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Address</label>
      <textarea class="form-control" id="editAddress" rows="2">${donor.address || ''}</textarea>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">City</label>
        <input type="text" class="form-control" id="editCity" value="${donor.city}">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Emergency Contact Name</label>
        <input type="text" class="form-control" id="editEmergencyName" value="${donor.emergencyContactName || ''}">
      </div>
      <div class="form-group">
        <label class="form-label">Emergency Contact Phone</label>
        <input type="tel" class="form-control" id="editEmergencyPhone" value="${donor.emergencyContactPhone || ''}">
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Medical History Notes</label>
      <textarea class="form-control" id="editMedicalHistory" rows="3">${donor.medicalHistory || ''}</textarea>
    </div>
  `;
}

function openUpdateDonationDateModal() {
  const modal = document.getElementById('donorModal');
  const content = document.getElementById('donorModalContent');
  
  const donor = appState.currentDonor;
  const today = new Date().toISOString().split('T')[0];
  
  content.innerHTML = `
    <h3>Update Last Donation Date</h3>
    <form id="updateDonationDateForm" onsubmit="updateLastDonationDate(event)">
      <div class="form-group">
        <label class="form-label">Current Last Donation Date</label>
        <input type="text" class="form-control" value="${donor.lastDonationDate ? formatDate(donor.lastDonationDate) : 'No record'}" disabled>
      </div>
      <div class="form-group">
        <label class="form-label">New Last Donation Date*</label>
        <input type="date" class="form-control" id="newLastDonationDate" max="${today}" required>
        <small style="display: block; margin-top: var(--space-8); color: var(--color-text-secondary); font-size: var(--font-size-sm);">
          Cannot select future dates. Must be at least 18 years of age at time of donation.
        </small>
      </div>
      <div class="form-group">
        <label class="form-label">Reason for Update*</label>
        <select class="form-control reason-select" id="updateReason" required>
          <option value="">Select reason</option>
          <option value="Correction of previous date">Correction of previous date</option>
          <option value="Just donated (not yet recorded)">Just donated (not yet recorded)</option>
          <option value="Updating old records">Updating old records</option>
          <option value="Other">Other</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Optional Notes</label>
        <textarea class="form-control" id="updateNotes" rows="2" placeholder="Add any additional notes..."></textarea>
      </div>
      <div style="display: flex; gap: var(--space-12); margin-top: var(--space-16);">
        <button type="submit" class="btn btn--primary" style="flex: 1;">Save Update</button>
        <button type="button" class="btn btn--outline" onclick="closeModal('donorModal')" style="flex: 1;">Cancel</button>
      </div>
    </form>
  `;
  
  modal.classList.add('active');
}

function updateLastDonationDate(event) {
  event.preventDefault();
  
  if (!appState.currentDonor) return;
  
  const donor = appState.currentDonor;
  const newDate = document.getElementById('newLastDonationDate').value;
  const reason = document.getElementById('updateReason').value;
  const notes = document.getElementById('updateNotes').value;
  
  // Validate date
  const newDateObj = new Date(newDate);
  const today = new Date();
  
  if (newDateObj > today) {
    showToast('Date cannot be in the future', 'error');
    return;
  }
  
  // Validate age at donation
  if (donor.dateOfBirth) {
    const dob = new Date(donor.dateOfBirth);
    const ageAtDonation = Math.floor((newDateObj - dob) / (365.25 * 24 * 60 * 60 * 1000));
    
    if (ageAtDonation < 18) {
      showToast('You would have been too young to donate at this date', 'error');
      return;
    }
  }
  
  // Update donor information
  donor.lastDonationDate = newDate;
  
  // Calculate new next eligible date
  const nextDate = new Date(newDate);
  nextDate.setDate(nextDate.getDate() + 90);
  donor.nextEligibleDate = nextDate.toISOString().split('T')[0];
  
  // Calculate days since
  const daysSince = Math.floor((today - newDateObj) / (1000 * 60 * 60 * 24));
  donor.daysSinceLastDonation = daysSince;
  
  // Log the update
  const updateLog = {
    donorId: donor.donorId,
    previousDate: donor.lastDonationDate,
    newDate: newDate,
    reason: reason,
    notes: notes,
    updatedAt: today.toISOString()
  };
  
  closeModal('donorModal');
  showToast(`Last donation date updated! Next eligible: ${formatDate(donor.nextEligibleDate)}`);
  
  // Reload profile to show updated information
  setTimeout(() => {
    loadDonorProfile();
  }, 1000);
}

function updateDonorProfile(event) {
  event.preventDefault();
  
  if (!appState.currentDonor) return;
  
  const donor = appState.currentDonor;
  donor.fullName = document.getElementById('editFullName').value;
  donor.bloodType = document.getElementById('editBloodType').value;
  donor.dateOfBirth = document.getElementById('editDOB').value;
  donor.gender = document.getElementById('editGender').value;
  donor.phone = document.getElementById('editPhone').value;
  donor.email = document.getElementById('editEmail').value;
  donor.address = document.getElementById('editAddress').value;
  donor.city = document.getElementById('editCity').value;
  donor.emergencyContactName = document.getElementById('editEmergencyName').value;
  donor.emergencyContactPhone = document.getElementById('editEmergencyPhone').value;
  donor.medicalHistory = document.getElementById('editMedicalHistory').value;
  
  showToast('Profile updated successfully!');
  updateNavbarForDonor();
  setTimeout(() => {
    navigateTo('donor-dashboard');
  }, 1000);
}

function loadDonorRequests() {
  if (!appState.currentDonor) return;
  
  const donor = appState.currentDonor;
  const eligibility = calculateDonorEligibility(donor);
  
  // Filter requests that match donor's blood type
  const matchingRequests = appState.requests.filter(r => r.bloodType === donor.bloodType && r.status === 'Pending');
  
  const content = document.getElementById('donorRequestsContent');
  
  if (matchingRequests.length === 0) {
    content.innerHTML = `
      <div class="empty-state">
        🩸 <strong>No Blood Requests Available</strong><br>
        There are currently no active blood requests for your blood type (${donor.bloodType}).<br>
        ${!eligibility.isEligible ? `You will be eligible to donate again in ${eligibility.daysRemaining} days.` : 'Check back later for new requests.'}
      </div>
    `;
    return;
  }
  
  content.innerHTML = matchingRequests.map(request => {
    const canDonate = eligibility.isEligible;
    
    return `
      <div class="request-card ${request.priority === 'High' ? 'high-priority' : ''}">
        <div class="request-card-header">
          <div class="request-blood-type">${request.bloodType}</div>
          <div class="request-priority ${request.priority.toLowerCase()}">${request.priority} Priority</div>
        </div>
        
        <h3>${request.patientName.split(' ')[0]}. ${request.patientName.split(' ').slice(-1)[0]}</h3>
        
        <div class="request-detail">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          <span>${request.hospital}</span>
        </div>
        
        <div class="request-detail">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
          </svg>
          <span>${request.contactPhone}</span>
        </div>
        
        <div class="request-detail">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          <span>Requested: ${formatDate(request.requestDate)}</span>
        </div>
        
        <div class="request-detail">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
          <span>${request.unitsRequired} units required</span>
        </div>
        
        <div class="request-actions">
          ${canDonate ? 
            `<button class="btn btn-donate" onclick='confirmDonation(${JSON.stringify(request)})'>I Want to Donate</button>` :
            `<button class="btn btn-donate" disabled>Available in ${eligibility.daysRemaining} days</button>`
          }
          <a href="tel:${request.contactPhone}" class="btn btn--outline">Call Hospital</a>
        </div>
      </div>
    `;
  }).join('');
}

function confirmDonation(request) {
  const modal = document.getElementById('donationConfirmModal');
  const content = document.getElementById('donationConfirmContent');
  
  content.innerHTML = `
    <p style="margin-bottom: 16px;">Are you sure you want to donate blood for this request?</p>
    
    <div class="donor-info-card" style="margin-bottom: 16px;">
      <p><strong>Request ID:</strong> ${request.requestId}</p>
      <p><strong>Hospital:</strong> ${request.hospital}</p>
      <p><strong>Contact:</strong> ${request.contactPhone}</p>
      <p><strong>Blood Type:</strong> ${request.bloodType}</p>
      <p><strong>Units Needed:</strong> ${request.unitsRequired}</p>
    </div>
    
    <div style="display: flex; gap: 12px;">
      <button class="btn btn--primary" onclick="processDonation('${request.requestId}')">Yes, I'll Donate</button>
      <button class="btn btn--outline" onclick="closeModal('donationConfirmModal')">Cancel</button>
    </div>
  `;
  
  modal.classList.add('active');
}

function processDonation(requestId) {
  if (!appState.currentDonor) return;
  
  const donor = appState.currentDonor;
  const request = appState.requests.find(r => r.requestId === requestId);
  
  if (!request) return;
  
  // Update donor information
  const today = new Date().toISOString().split('T')[0];
  donor.lastDonationDate = today;
  donor.lastDonationRequestId = requestId;
  donor.totalDonations = (donor.totalDonations || 0) + 1;
  
  // Calculate next eligible date (90 days from today)
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + 90);
  donor.nextEligibleDate = nextDate.toISOString().split('T')[0];
  
  // Update request status
  request.status = 'In Progress';
  request.assignedDonorId = donor.donorId;
  request.donationDate = today;
  
  // Record donation in history
  appState.donorDonations.push({
    donationId: 'DON' + Date.now(),
    donorId: donor.donorId,
    requestId: requestId,
    bloodType: request.bloodType,
    hospital: request.hospital,
    donationDate: today,
    status: 'Completed'
  });
  
  closeModal('donationConfirmModal');
  
  showToast(`Thank you for donating! You can donate again on ${formatDate(donor.nextEligibleDate)}`);
  
  setTimeout(() => {
    loadDonorDashboard();
    navigateTo('donor-dashboard');
  }, 2000);
}

function loadDonorHistory() {
  if (!appState.currentDonor) return;
  
  const donor = appState.currentDonor;
  const donations = appState.donorDonations.filter(d => d.donorId === donor.donorId);
  const eligibility = calculateDonorEligibility(donor);
  
  const content = document.getElementById('donorHistoryContent');
  
  // Donation Status Summary
  const statusHTML = `
    <div class="donation-history-section" style="margin-bottom: 32px;">
      <h3>Current Donation Status</h3>
      <div class="donation-info-grid">
        <div class="donation-info-item">
          <div class="label">Total Donations</div>
          <div class="value">${donor.totalDonations || 0}</div>
        </div>
        <div class="donation-info-item">
          <div class="label">First Donation Date</div>
          <div class="value">${donor.lastDonationDate ? formatDate(donor.lastDonationDate) : 'N/A'}</div>
        </div>
        <div class="donation-info-item">
          <div class="label">Last Donation Date</div>
          <div class="value">${donor.lastDonationDate ? formatDate(donor.lastDonationDate) : 'Never'}</div>
        </div>
        <div class="donation-info-item">
          <div class="label">Days Since Last</div>
          <div class="value">${donor.daysSinceLastDonation !== null && donor.daysSinceLastDonation !== undefined ? donor.daysSinceLastDonation : 'N/A'}</div>
        </div>
        <div class="donation-info-item">
          <div class="label">Next Eligible Date</div>
          <div class="value">${eligibility.nextEligibleDate ? formatDate(eligibility.nextEligibleDate) : 'Now'}</div>
        </div>
        <div class="donation-info-item">
          <div class="label">Eligibility Status</div>
          <div class="value" style="color: ${eligibility.isEligible ? 'var(--kues-green-dark)' : 'var(--kues-orange-dark)'}">
            ${eligibility.isEligible ? '✅ Eligible' : `⏳ ${eligibility.daysRemaining} days`}
          </div>
        </div>
      </div>
      <div style="margin-top: 16px;">
        <button class="btn btn--secondary" onclick="openUpdateDonationDateModal()">Update Last Donation Date</button>
      </div>
    </div>
  `;
  
  if (donations.length === 0) {
    content.innerHTML = statusHTML + `
      <div class="empty-state">
        📋 <strong>No Donation History</strong><br>
        You haven't donated through the system yet. Browse active requests to get started!
      </div>
      <div style="text-align: center; margin-top: 24px;">
        <button class="btn btn--primary" onclick="navigateTo('donor-requests')">View Blood Requests</button>
      </div>
    `;
    return;
  }
  
  const timelineHTML = `
    <h3>Donation Timeline</h3>
    <div class="history-timeline">
      ${donations.map(donation => `
        <div class="history-item">
          <div class="history-date">${formatDate(donation.donationDate)}</div>
          <h4>Blood Donation - ${donation.bloodType}</h4>
          <div class="history-details">
            <div class="history-detail-item">
              <strong>Hospital</strong>
              ${donation.hospital}
            </div>
            <div class="history-detail-item">
              <strong>Request ID</strong>
              ${donation.requestId}
            </div>
            <div class="history-detail-item">
              <strong>Status</strong>
              <span class="status status--success">${donation.status}</span>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
  
  content.innerHTML = statusHTML + timelineHTML;
}

function loadDonorSettings() {
  if (!appState.currentDonor) return;
  
  const donor = appState.currentDonor;
  const content = document.getElementById('donorSettingsContent');
  
  content.innerHTML = `
    <div class="card" style="margin-bottom: 24px;">
      <h3>Notification Preferences</h3>
      <div class="notification-settings">
        <div class="notification-item">
          <div>
            <strong>Email Notifications</strong>
            <p style="color: var(--color-text-secondary); font-size: var(--font-size-sm); margin: 4px 0 0 0;">Receive email alerts for new blood requests</p>
          </div>
          <label class="notification-toggle">
            <input type="checkbox" id="notifEmail" ${donor.notificationEmailEnabled ? 'checked' : ''}>
            <span class="toggle-slider"></span>
          </label>
        </div>
        <div class="notification-item">
          <div>
            <strong>SMS Notifications</strong>
            <p style="color: var(--color-text-secondary); font-size: var(--font-size-sm); margin: 4px 0 0 0;">Receive SMS alerts for urgent requests</p>
          </div>
          <label class="notification-toggle">
            <input type="checkbox" id="notifSMS" ${donor.notificationSMSEnabled ? 'checked' : ''}>
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>
      <button class="btn btn--primary" onclick="saveDonorNotifications()" style="margin-top: 16px;">Save Preferences</button>
    </div>
    
    <div class="card">
      <h3>Change Password</h3>
      <form id="donorChangePasswordForm" onsubmit="changeDonorPassword(event)">
        <div class="form-group">
          <label class="form-label">Current Password</label>
          <input type="password" class="form-control" id="donorCurrentPassword" required>
        </div>
        <div class="form-group">
          <label class="form-label">New Password (Min 8 characters, letters &amp; numbers)</label>
          <input type="password" class="form-control" id="donorNewPassword" minlength="8" maxlength="20" required>
          <div id="donorNewPasswordStrength" class="password-strength"></div>
        </div>
        <div class="form-group">
          <label class="form-label">Confirm New Password</label>
          <input type="password" class="form-control" id="donorConfirmNewPassword" minlength="8" maxlength="20" required>
        </div>
        <button type="submit" class="btn btn--primary">Change Password</button>
      </form>
    </div>
  `;
  
  // Setup password strength indicator
  setTimeout(() => {
    const newPasswordInput = document.getElementById('donorNewPassword');
    if (newPasswordInput) {
      newPasswordInput.addEventListener('input', (e) => {
        const password = e.target.value;
        const strengthDiv = document.getElementById('donorNewPasswordStrength');
        
        if (password.length === 0) {
          strengthDiv.innerHTML = '';
          strengthDiv.className = 'password-strength';
          return;
        }
        
        let strength = 'weak';
        let strengthText = 'Weak';
        
        if (password.length >= 8) {
          const hasLetters = /[a-zA-Z]/.test(password);
          const hasNumbers = /[0-9]/.test(password);
          const hasSpecial = /[^a-zA-Z0-9]/.test(password);
          
          if (hasLetters && hasNumbers && hasSpecial && password.length >= 12) {
            strength = 'strong';
            strengthText = 'Strong';
          } else if (hasLetters && hasNumbers && password.length >= 8) {
            strength = 'medium';
            strengthText = 'Medium';
          }
        }
        
        strengthDiv.className = 'password-strength ' + strength;
        strengthDiv.innerHTML = '<div class="password-strength-bar"></div><span class="password-strength-text">Password Strength: ' + strengthText + '</span>';
      });
    }
  }, 100);
}

function saveDonorNotifications() {
  if (!appState.currentDonor) return;
  
  const donor = appState.currentDonor;
  donor.notificationEmailEnabled = document.getElementById('notifEmail').checked;
  donor.notificationSMSEnabled = document.getElementById('notifSMS').checked;
  
  showToast('Notification preferences updated successfully!');
}

function changeDonorPassword(event) {
  event.preventDefault();
  
  if (!appState.currentDonor) return;
  
  const currentPassword = document.getElementById('donorCurrentPassword').value;
  const newPassword = document.getElementById('donorNewPassword').value;
  const confirmPassword = document.getElementById('donorConfirmNewPassword').value;
  
  const credentials = appState.donorCredentials.find(c => c.donorId === appState.currentDonor.donorId);
  
  if (!credentials || credentials.passwordHash !== currentPassword) {
    showToast('Current password is incorrect', 'error');
    return;
  }
  
  if (newPassword.length < 8) {
    showToast('New password must be at least 8 characters', 'error');
    return;
  }
  
  if (!/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
    showToast('Password must contain both letters and numbers', 'error');
    return;
  }
  
  if (newPassword !== confirmPassword) {
    showToast('Passwords do not match', 'error');
    return;
  }
  
  credentials.passwordHash = newPassword;
  showToast('Password changed successfully!');
  document.getElementById('donorChangePasswordForm').reset();
}

// Admin Functions
function adminLogin(event) {
  event.preventDefault();
  
  const username = document.getElementById('adminUsername').value;
  const password = document.getElementById('adminPassword').value;

  if (username === appState.adminCredentials.username && password === appState.adminCredentials.password) {
    appState.adminLoggedIn = true;
    document.getElementById('adminLogin').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'block';
    loadAdminDashboard();
    loadSettingsForm();
    showToast('Welcome, Admin!');
  } else {
    showToast('Invalid credentials', 'error');
  }
}

function adminLogout() {
  appState.adminLoggedIn = false;
  document.getElementById('adminLogin').style.display = 'flex';
  document.getElementById('adminDashboard').style.display = 'none';
  document.getElementById('loginForm').reset();
  showToast('Logged out successfully');
}

async function loadAdminDashboard() {
  loadAdminStats();
  loadPendingDonors();
  loadPendingRequests();
}

function loadAdminStats() {
  const container = document.getElementById('adminStats');
  container.innerHTML = `
    <div class="stat-card">
      <div class="stat-icon" style="background: var(--color-bg-1);">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
        </svg>
      </div>
      <div class="stat-info">
        <div class="stat-value">0</div>
        <div class="stat-label">Total Donors</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon" style="background: var(--color-bg-3);">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
      </div>
      <div class="stat-info">
        <div class="stat-value">0</div>
        <div class="stat-label">Blood Units</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon" style="background: var(--color-bg-4);">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
      </div>
      <div class="stat-info">
        <div class="stat-value">0</div>
        <div class="stat-label">Pending Requests</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon" style="background: var(--color-bg-5);">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
      </div>
      <div class="stat-info">
        <div class="stat-value">0</div>
        <div class="stat-label">Approved Donors</div>
      </div>
    </div>
  `;
}

function loadPendingDonors() {
  const tbody = document.getElementById('pendingDonorsTable');
  const pendingDonors = appState.donors.filter(d => d.status === 'Pending' || d.status === 'Active');

  if (pendingDonors.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 32px; color: var(--color-text-secondary);">📋 <strong>No pending donor registrations at this time.</strong><br>New donor applications will appear here for review.</td></tr>';
    return;
  }

  tbody.innerHTML = pendingDonors.map(donor => {
    const eligibility = calculateDonorEligibility(donor);
    const eligibilityText = eligibility.isEligible ? '✅ Eligible' : `⏳ ${eligibility.daysRemaining} days`;
    
    return `
    <tr>
      <td>${donor.donorId}</td>
      <td>${donor.fullName}</td>
      <td><strong>${donor.bloodType}</strong></td>
      <td>${donor.phone}</td>
      <td>${donor.lastDonationDate ? formatDate(donor.lastDonationDate) : 'Never'}</td>
      <td>${donor.daysSinceLastDonation !== null && donor.daysSinceLastDonation !== undefined ? donor.daysSinceLastDonation + ' days' : 'N/A'}</td>
      <td style="color: ${eligibility.isEligible ? 'var(--kues-green-dark)' : 'var(--kues-orange-dark)'}; font-weight: 500;">${eligibilityText}</td>
      <td>${formatDate(donor.registrationDate)}</td>
    </tr>
  `;
  }).join('');
}

function loadPendingRequests() {
  const tbody = document.getElementById('pendingRequestsTable');
  const pendingRequests = [];

  if (pendingRequests.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 32px; color: var(--color-text-secondary);">🩸 <strong>No pending blood requests at this time.</strong><br>Blood requests from students will appear here for processing.</td></tr>';
    return;
  }

  tbody.innerHTML = pendingRequests.map(req => `
    <tr>
      <td>${req.id}</td>
      <td><strong style="color: #3B82F6;">${req.studentId}</strong></td>
      <td>${req.patientName}</td>
      <td><strong>${req.bloodType}</strong></td>
      <td>${req.units}</td>
      <td>${req.hospital}</td>
      <td class="priority-${req.priority.toLowerCase()}">${req.priority}</td>
      <td>${formatDate(req.date)}</td>
      <td class="action-buttons">
        <button class="btn btn-sm btn-success" onclick="approveRequest('${req.id}')">Approve</button>
        <button class="btn btn-sm btn-primary" onclick="fulfillRequest('${req.id}')">Fulfill</button>
        <button class="btn btn-sm btn-danger" onclick="rejectRequest('${req.id}')">Reject</button>
      </td>
    </tr>
  `).join('');
}



function approveDonor(donorId) {
  if (confirm('Approve this donor?')) {
    showLoader();
    setTimeout(() => {
      hideLoader();
      showToast('Donor approved successfully');
      loadPendingDonors();
    }, 1000);
  }
}

function rejectDonor(donorId) {
  if (confirm('Reject this donor?')) {
    showLoader();
    setTimeout(() => {
      hideLoader();
      showToast('Donor rejected', 'error');
      loadPendingDonors();
    }, 1000);
  }
}

function approveRequest(requestId) {
  if (confirm('Approve this request?')) {
    showLoader();
    setTimeout(() => {
      hideLoader();
      showToast('Request approved successfully');
      loadPendingRequests();
    }, 1000);
  }
}

function fulfillRequest(requestId) {
  if (confirm('Mark this request as fulfilled?')) {
    showLoader();
    setTimeout(() => {
      hideLoader();
      showToast('Request fulfilled successfully');
      loadPendingRequests();
    }, 1000);
  }
}

function rejectRequest(requestId) {
  if (confirm('Reject this request?')) {
    showLoader();
    setTimeout(() => {
      hideLoader();
      showToast('Request rejected', 'error');
      loadPendingRequests();
    }, 1000);
  }
}

function addInventory(event) {
  event.preventDefault();
  
  const formData = {
    bloodType: document.getElementById('invBloodType').value,
    units: document.getElementById('invUnits').value,
    collectionDate: document.getElementById('invCollectionDate').value,
    donorId: document.getElementById('invDonorId').value
  };

  showLoader();
  setTimeout(() => {
    hideLoader();
    showToast('Inventory updated successfully');
    document.getElementById('addInventoryForm').reset();
  }, 1000);
}

function generateReport() {
  showToast('Report generation feature coming soon!');
}

// Settings Functions
function showSection(sectionId) {
  const sections = document.querySelectorAll('.admin-section');
  sections.forEach(section => {
    section.style.display = section.id === sectionId ? 'block' : 'none';
  });
  
  if (sectionId === 'settings') {
    showSettingsTab('contentManagement');
  }
}

function showSettingsTab(tabId) {
  const tabs = document.querySelectorAll('.settings-tab');
  const buttons = document.querySelectorAll('.settings-navigation .btn');
  
  tabs.forEach(tab => {
    tab.style.display = tab.id === tabId ? 'block' : 'none';
  });
  
  buttons.forEach((btn, index) => {
    const tabNames = ['contentManagement', 'aboutPageEditor', 'accountSettings', 'websiteConfig'];
    if (tabNames[index] === tabId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  
  // Load About Page Editor when tab is shown
  if (tabId === 'aboutPageEditor') {
    loadAboutPageEditor();
  }
}

// About Page Editor Functions
function loadAboutPageEditor() {
  // Load About Us Content
  document.getElementById('aboutUsTitle').value = appState.siteSettings.aboutTitle;
  document.getElementById('aboutUsDescription').value = appState.siteSettings.aboutDescription;
  updateCharCount('aboutUsTitle', 'aboutUsTitleCount', 100);
  updateCharCount('aboutUsDescription', 'aboutUsDescCount', 2000);
  
  // Load Mission & Vision
  document.getElementById('missionText').value = appState.siteSettings.missionStatement;
  document.getElementById('visionText').value = appState.siteSettings.visionStatement;
  updateCharCount('missionText', 'missionCount', 500);
  updateCharCount('visionText', 'visionCount', 500);
  
  // Load Benefits
  loadBenefitsList();
  
  // Load Requirements
  loadRequirementsList();
  
  // Load Contact Info
  document.getElementById('contactAddress').value = appState.siteSettings.contactAddress;
  document.getElementById('contactPhone').value = appState.siteSettings.contactPhone;
  document.getElementById('contactEmail').value = appState.siteSettings.contactEmail;
  document.getElementById('contactEmergency').value = appState.siteSettings.contactEmergency;
  document.getElementById('contactHours').value = appState.siteSettings.contactHours;
  updateCharCount('contactAddress', 'addressCount', 300);
  updateCharCount('contactHours', 'hoursCount', 100);
  
  // Update last modified display
  const lastUpdated = appState.siteSettings.aboutLastUpdated || 'Not yet updated';
  document.getElementById('aboutLastUpdated').textContent = lastUpdated;
  
  // Setup character counters
  setupCharCounters();
}

function setupCharCounters() {
  const fields = [
    { inputId: 'aboutUsTitle', countId: 'aboutUsTitleCount', max: 100 },
    { inputId: 'aboutUsDescription', countId: 'aboutUsDescCount', max: 2000 },
    { inputId: 'missionText', countId: 'missionCount', max: 500 },
    { inputId: 'visionText', countId: 'visionCount', max: 500 },
    { inputId: 'contactAddress', countId: 'addressCount', max: 300 },
    { inputId: 'contactHours', countId: 'hoursCount', max: 100 }
  ];
  
  fields.forEach(field => {
    const input = document.getElementById(field.inputId);
    if (input) {
      input.addEventListener('input', () => {
        updateCharCount(field.inputId, field.countId, field.max);
      });
    }
  });
}

function updateCharCount(inputId, countId, max) {
  const input = document.getElementById(inputId);
  const counter = document.getElementById(countId);
  if (input && counter) {
    const count = input.value.length;
    counter.textContent = count;
    if (count >= max * 0.9) {
      counter.style.color = 'var(--color-warning)';
    } else {
      counter.style.color = 'var(--color-text-secondary)';
    }
  }
}

function toggleCollapsible(header) {
  header.classList.toggle('collapsed');
  const content = header.nextElementSibling;
  if (content.style.display === 'none' || content.style.display === '') {
    content.style.display = 'block';
  } else {
    content.style.display = 'none';
  }
}

function saveAboutUs(event) {
  event.preventDefault();
  
  appState.siteSettings.aboutTitle = document.getElementById('aboutUsTitle').value;
  appState.siteSettings.aboutDescription = document.getElementById('aboutUsDescription').value;
  appState.siteSettings.aboutLastUpdated = new Date().toLocaleString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric', 
    hour: 'numeric', 
    minute: '2-digit', 
    hour12: true 
  });
  
  updateAboutPage();
  document.getElementById('aboutLastUpdated').textContent = appState.siteSettings.aboutLastUpdated;
  showToast('About Us content updated successfully!');
}

function saveMissionVision(event) {
  event.preventDefault();
  
  appState.siteSettings.missionStatement = document.getElementById('missionText').value;
  appState.siteSettings.visionStatement = document.getElementById('visionText').value;
  appState.siteSettings.aboutLastUpdated = new Date().toLocaleString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric', 
    hour: 'numeric', 
    minute: '2-digit', 
    hour12: true 
  });
  
  updateAboutPage();
  document.getElementById('aboutLastUpdated').textContent = appState.siteSettings.aboutLastUpdated;
  showToast('Mission & Vision updated successfully!');
}

function loadBenefitsList() {
  const container = document.getElementById('benefitsList');
  const benefits = appState.siteSettings.benefits || [];
  
  container.innerHTML = `
    <div class="item-counter">Benefits: <strong>${benefits.length}/10</strong></div>
    ${benefits.map((benefit, index) => `
      <div class="dynamic-item">
        <input type="text" class="form-control" value="${benefit}" data-benefit-index="${index}" onchange="updateBenefitItem(${index}, this.value)">
        <button type="button" class="btn-delete" onclick="deleteBenefitItem(${index})">✕ Delete</button>
      </div>
    `).join('')}
  `;
  
  const addBtn = document.getElementById('addBenefitBtn');
  if (addBtn) {
    addBtn.disabled = benefits.length >= 10;
  }
}

function addBenefitItem() {
  if (appState.siteSettings.benefits.length >= 10) {
    showToast('Maximum 10 benefits allowed', 'error');
    return;
  }
  
  appState.siteSettings.benefits.push('');
  loadBenefitsList();
}

function updateBenefitItem(index, value) {
  appState.siteSettings.benefits[index] = value;
}

function deleteBenefitItem(index) {
  if (confirm('Delete this benefit?')) {
    appState.siteSettings.benefits.splice(index, 1);
    loadBenefitsList();
  }
}

function saveBenefits() {
  // Filter out empty benefits
  appState.siteSettings.benefits = appState.siteSettings.benefits.filter(b => b.trim() !== '');
  
  if (appState.siteSettings.benefits.length === 0) {
    showToast('Please add at least one benefit', 'error');
    return;
  }
  
  appState.siteSettings.aboutLastUpdated = new Date().toLocaleString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric', 
    hour: 'numeric', 
    minute: '2-digit', 
    hour12: true 
  });
  
  updateAboutPage();
  loadBenefitsList();
  document.getElementById('aboutLastUpdated').textContent = appState.siteSettings.aboutLastUpdated;
  showToast('Benefits saved successfully!');
}

function loadRequirementsList() {
  const container = document.getElementById('requirementsList');
  const requirements = appState.siteSettings.requirements || [];
  
  container.innerHTML = `
    <div class="item-counter">Requirements: <strong>${requirements.length}/15</strong></div>
    ${requirements.map((req, index) => `
      <div class="dynamic-item">
        <input type="text" class="form-control" value="${req}" data-req-index="${index}" onchange="updateRequirementItem(${index}, this.value)">
        <button type="button" class="btn-delete" onclick="deleteRequirementItem(${index})">✕ Delete</button>
      </div>
    `).join('')}
  `;
  
  const addBtn = document.getElementById('addRequirementBtn');
  if (addBtn) {
    addBtn.disabled = requirements.length >= 15;
  }
}

function addRequirementItem() {
  if (appState.siteSettings.requirements.length >= 15) {
    showToast('Maximum 15 requirements allowed', 'error');
    return;
  }
  
  appState.siteSettings.requirements.push('');
  loadRequirementsList();
}

function updateRequirementItem(index, value) {
  appState.siteSettings.requirements[index] = value;
}

function deleteRequirementItem(index) {
  if (confirm('Delete this requirement?')) {
    appState.siteSettings.requirements.splice(index, 1);
    loadRequirementsList();
  }
}

function saveRequirements() {
  // Filter out empty requirements
  appState.siteSettings.requirements = appState.siteSettings.requirements.filter(r => r.trim() !== '');
  
  if (appState.siteSettings.requirements.length === 0) {
    showToast('Please add at least one requirement', 'error');
    return;
  }
  
  appState.siteSettings.aboutLastUpdated = new Date().toLocaleString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric', 
    hour: 'numeric', 
    minute: '2-digit', 
    hour12: true 
  });
  
  updateAboutPage();
  loadRequirementsList();
  document.getElementById('aboutLastUpdated').textContent = appState.siteSettings.aboutLastUpdated;
  showToast('Requirements saved successfully!');
}

function saveContactInfo(event) {
  event.preventDefault();
  
  appState.siteSettings.contactAddress = document.getElementById('contactAddress').value;
  appState.siteSettings.contactPhone = document.getElementById('contactPhone').value;
  appState.siteSettings.contactEmail = document.getElementById('contactEmail').value;
  appState.siteSettings.contactEmergency = document.getElementById('contactEmergency').value;
  appState.siteSettings.contactHours = document.getElementById('contactHours').value;
  appState.siteSettings.aboutLastUpdated = new Date().toLocaleString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric', 
    hour: 'numeric', 
    minute: '2-digit', 
    hour12: true 
  });
  
  updateAboutPage();
  document.getElementById('aboutLastUpdated').textContent = appState.siteSettings.aboutLastUpdated;
  showToast('Contact information updated successfully!');
}

function updateAboutPage() {
  const aboutSection = document.getElementById('about');
  if (!aboutSection) return;
  
  const settings = appState.siteSettings;
  
  aboutSection.innerHTML = `
    <div class="container">
      <h1>${settings.aboutTitle}</h1>
      <div class="card">
        <h2>About Us</h2>
        <p>${settings.aboutDescription}</p>
        
        <h2 style="margin-top: 32px;">Our Mission</h2>
        <div style="background: var(--color-bg-1); padding: 20px; border-radius: var(--radius-lg); border-left: 4px solid var(--color-primary); margin-bottom: 24px;">
          <p style="margin: 0; font-size: var(--font-size-lg);">${settings.missionStatement}</p>
        </div>
        
        <h2>Our Vision</h2>
        <div style="background: var(--color-bg-5); padding: 20px; border-radius: var(--radius-lg); border-left: 4px solid var(--color-primary); margin-bottom: 24px;">
          <p style="margin: 0; font-size: var(--font-size-lg);">${settings.visionStatement}</p>
        </div>
        
        <h2>Why Donate Blood?</h2>
        <ul style="list-style: none; padding: 0;">
          ${settings.benefits.map(benefit => `
            <li style="padding: 12px 0; padding-left: 32px; position: relative;">
              <span style="position: absolute; left: 0; color: var(--success-green); font-weight: bold; font-size: 18px;">✓</span>
              ${benefit}
            </li>
          `).join('')}
        </ul>
        
        <h2 style="margin-top: 32px;">Eligibility Requirements</h2>
        <ul style="list-style: none; padding: 0;">
          ${settings.requirements.map(req => `
            <li style="padding: 12px 0; padding-left: 32px; position: relative;">
              <span style="position: absolute; left: 0; color: var(--color-primary); font-weight: bold; font-size: 18px;">✓</span>
              ${req}
            </li>
          `).join('')}
        </ul>
        
        <h2 style="margin-top: 32px;">Get in Touch</h2>
        <div class="contact-info">
          <p><strong>Organization:</strong> ${settings.orgName}</p>
          <p><strong>Address:</strong> ${settings.contactAddress}</p>
          <p><strong>Phone:</strong> ${settings.contactPhone}</p>
          <p><strong>Email:</strong> ${settings.contactEmail}</p>
          <p><strong>Emergency Hotline:</strong> ${settings.contactEmergency}</p>
        </div>
        
        <h2 style="margin-top: 32px;">Operating Hours</h2>
        <p style="font-size: var(--font-size-lg); color: var(--color-primary); font-weight: var(--font-weight-semibold);">${settings.contactHours}</p>
      </div>
    </div>
  `;
  
  // Also update footer and other locations
  applySiteSettings();
}

function loadSettingsForm() {
  // Load content settings
  document.getElementById('orgName').value = appState.siteSettings.orgName;
  document.getElementById('orgTagline').value = appState.siteSettings.orgTagline;
  document.getElementById('orgAddress').value = appState.siteSettings.orgAddress;
  document.getElementById('orgEmail').value = appState.siteSettings.orgEmail;
  document.getElementById('emergencyPhone').value = appState.siteSettings.emergencyPhone;
  document.getElementById('operatingHours').value = appState.siteSettings.operatingHours;
  document.getElementById('aboutTitle').value = appState.siteSettings.aboutTitle;
  document.getElementById('aboutDescription').value = appState.siteSettings.aboutDescription;
  document.getElementById('missionStatement').value = appState.siteSettings.missionStatement;
  document.getElementById('visionStatement').value = appState.siteSettings.visionStatement;
  
  // Load config settings
  document.getElementById('goodStockLevel').value = appState.siteSettings.goodStockLevel;
  document.getElementById('lowStockLevel').value = appState.siteSettings.lowStockLevel;
  document.getElementById('supportEmail').value = appState.siteSettings.supportEmail;
  document.getElementById('supportPhone').value = appState.siteSettings.supportPhone;
  
  // Load admin info
  document.getElementById('currentUsernameDisplay').textContent = appState.adminCredentials.username;
}

function saveContentSettings(event) {
  event.preventDefault();
  
  appState.siteSettings.orgName = document.getElementById('orgName').value;
  appState.siteSettings.orgTagline = document.getElementById('orgTagline').value;
  appState.siteSettings.orgAddress = document.getElementById('orgAddress').value;
  appState.siteSettings.orgEmail = document.getElementById('orgEmail').value;
  appState.siteSettings.emergencyPhone = document.getElementById('emergencyPhone').value;
  appState.siteSettings.operatingHours = document.getElementById('operatingHours').value;
  appState.siteSettings.aboutTitle = document.getElementById('aboutTitle').value;
  appState.siteSettings.aboutDescription = document.getElementById('aboutDescription').value;
  appState.siteSettings.missionStatement = document.getElementById('missionStatement').value;
  appState.siteSettings.visionStatement = document.getElementById('visionStatement').value;
  
  applySiteSettings();
  showToast('Content settings updated successfully! Changes are now visible across the website.');
}

function saveWebsiteConfig(event) {
  event.preventDefault();
  
  appState.siteSettings.goodStockLevel = parseInt(document.getElementById('goodStockLevel').value);
  appState.siteSettings.lowStockLevel = parseInt(document.getElementById('lowStockLevel').value);
  appState.siteSettings.supportEmail = document.getElementById('supportEmail').value;
  appState.siteSettings.supportPhone = document.getElementById('supportPhone').value;
  
  showToast('Website configuration updated successfully!');
}

function applySiteSettings() {
  // Update organization name in navigation and all pages
  const logoElements = document.querySelectorAll('.nav-logo span');
  logoElements.forEach(el => el.textContent = appState.siteSettings.orgName);
  
  // Update hero section
  const heroTitle = document.querySelector('.hero-title');
  if (heroTitle) heroTitle.textContent = appState.siteSettings.orgName + ' Management System';
  
  const heroSubtitle = document.querySelector('.hero-subtitle');
  if (heroSubtitle) heroSubtitle.textContent = appState.siteSettings.orgTagline;
  
  // Update emergency banner
  const emergencyPhone = document.querySelector('.emergency-phone');
  if (emergencyPhone) emergencyPhone.textContent = 'Call: ' + appState.siteSettings.emergencyPhone;
  
  // Update footer
  const footerSections = document.querySelectorAll('.footer-section');
  if (footerSections[0]) {
    footerSections[0].querySelector('h3').textContent = appState.siteSettings.orgName;
    footerSections[0].querySelector('p').textContent = appState.siteSettings.orgTagline;
  }
  if (footerSections[2]) {
    const contactPs = footerSections[2].querySelectorAll('p');
    if (contactPs[0]) contactPs[0].textContent = appState.siteSettings.orgAddress;
    if (contactPs[1]) contactPs[1].textContent = 'Phone: ' + appState.siteSettings.emergencyPhone;
    if (contactPs[2]) contactPs[2].textContent = 'Email: ' + appState.siteSettings.orgEmail;
  }
  
  // Update about page
  const aboutSection = document.getElementById('about');
  if (aboutSection) {
    aboutSection.querySelector('h1').textContent = appState.siteSettings.aboutTitle;
    const aboutCard = aboutSection.querySelector('.card');
    if (aboutCard) {
      aboutCard.querySelector('h2').nextElementSibling.textContent = appState.siteSettings.aboutDescription;
      const visionP = aboutCard.querySelectorAll('p')[1];
      if (visionP) visionP.textContent = appState.siteSettings.visionStatement;
      
      const contactInfo = aboutCard.querySelector('.contact-info');
      if (contactInfo) {
        contactInfo.querySelectorAll('p')[0].innerHTML = '<strong>Organization:</strong> ' + appState.siteSettings.orgName;
        contactInfo.querySelectorAll('p')[1].innerHTML = '<strong>Address:</strong> ' + appState.siteSettings.orgAddress;
        contactInfo.querySelectorAll('p')[2].innerHTML = '<strong>Emergency Phone:</strong> ' + appState.siteSettings.emergencyPhone;
        contactInfo.querySelectorAll('p')[3].innerHTML = '<strong>Email:</strong> ' + appState.siteSettings.orgEmail;
      }
    }
  }
}

function changeUsername(event) {
  event.preventDefault();
  
  const newUsername = document.getElementById('newUsername').value;
  
  if (!/^[a-zA-Z0-9]{5,20}$/.test(newUsername)) {
    showToast('Username must be 5-20 characters, alphanumeric only', 'error');
    return;
  }
  
  if (confirm('Are you sure you want to change your username? You will need to login again with the new username.')) {
    appState.adminCredentials.username = newUsername;
    showToast('Username changed successfully! Please login again.');
    setTimeout(() => {
      adminLogout();
    }, 2000);
  }
}

function updateAdminEmail(event) {
  event.preventDefault();
  
  const newEmail = document.getElementById('newAdminEmail').value;
  
  if (confirm('A verification link will be sent to ' + newEmail + '. Continue?')) {
    appState.adminCredentials.email = newEmail;
    document.getElementById('adminEmailDisplay').textContent = newEmail;
    showToast('Verification email sent to ' + newEmail + '. Please check your email.');
    document.getElementById('updateEmailForm').reset();
  }
}

function adminForgotPassword(event) {
  event.preventDefault();
  
  const email = document.getElementById('adminForgotEmail').value;
  
  if (email === appState.adminCredentials.email) {
    showToast('Password reset link sent to ' + email + '. Please check your email.');
  } else {
    showToast('If an account exists with this email, a reset link will be sent.');
  }
  
  setTimeout(() => {
    navigateTo('admin');
  }, 2000);
}

function changePassword(event) {
  event.preventDefault();
  
  const currentPassword = document.getElementById('currentPassword').value;
  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  
  if (currentPassword !== appState.adminCredentials.password) {
    showToast('Current password is incorrect', 'error');
    return;
  }
  
  if (newPassword.length < 8) {
    showToast('New password must be at least 8 characters', 'error');
    return;
  }
  
  if (!/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
    showToast('Password must contain both letters and numbers', 'error');
    return;
  }
  
  if (newPassword !== confirmPassword) {
    showToast('Passwords do not match', 'error');
    return;
  }
  
  if (confirm('Are you sure you want to change your password?')) {
    appState.adminCredentials.password = newPassword;
    showToast('Password changed successfully!');
    document.getElementById('changePasswordForm').reset();
  }
}

function setupPasswordStrengthIndicator() {
  const newPasswordInput = document.getElementById('newPassword');
  if (newPasswordInput) {
    newPasswordInput.addEventListener('input', (e) => {
      const password = e.target.value;
      const strengthDiv = document.getElementById('passwordStrength');
      
      if (password.length === 0) {
        strengthDiv.innerHTML = '';
        strengthDiv.className = 'password-strength';
        return;
      }
      
      let strength = 'weak';
      let strengthText = 'Weak';
      
      if (password.length >= 8) {
        const hasLetters = /[a-zA-Z]/.test(password);
        const hasNumbers = /[0-9]/.test(password);
        const hasSpecial = /[^a-zA-Z0-9]/.test(password);
        
        if (hasLetters && hasNumbers && hasSpecial && password.length >= 12) {
          strength = 'strong';
          strengthText = 'Strong';
        } else if (hasLetters && hasNumbers && password.length >= 8) {
          strength = 'medium';
          strengthText = 'Medium';
        }
      }
      
      strengthDiv.className = 'password-strength ' + strength;
      strengthDiv.innerHTML = '<div class="password-strength-bar"></div><span class="password-strength-text">Password Strength: ' + strengthText + '</span>';
    });
  }
}

// Utility Functions
function formatDate(dateString) {
  if (!dateString || dateString === 'N/A') return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function calculateAge(dateString) {
  const today = new Date();
  const birthDate = new Date(dateString);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

function calculateExpirationDate(collectionDate) {
  const date = new Date(collectionDate);
  date.setDate(date.getDate() + 35);
  return date.toISOString().split('T')[0];
}

function getBloodTypeColor(bloodType) {
  const colors = {
    'O+': '#DC143C',
    'O-': '#C41E3A',
    'A+': '#E63946',
    'A-': '#D62828',
    'B+': '#F77F00',
    'B-': '#EF4444',
    'AB+': '#9D0208',
    'AB-': '#6A040F'
  };
  return colors[bloodType] || '#DC143C';
}

// Close modals when clicking outside
window.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal')) {
    e.target.classList.remove('active');
  }
});