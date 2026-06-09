import './style.css';
import {
  registerBuilding,
  addFlat,
  updateFlat,
  deleteFlat,
  recordFlatPayment,
  clearAllDues,
  sendEmailReminder,
  sendBulkReminders,
  getGlobalLeaderboard,
  resetDB,
  findBuildingByAdminCredentials,
  deleteBuilding,
  isSupabaseConfigured,
  getBuildingWithNestedData,
  getBuildingByCodeAndFlat,
  updateBuilding,
  initDB,
  supabase,
  getFlatByUsernameAndPassword,
  checkFlatAvailability,
  broadcastCongrats,
  getAllBuildings,
  updateBuildingSaaS
} from './db.js';


// Global Session Variables
let session = {
  role: null,          // 'admin' | 'member' | null
  buildingCode: null,  // e.g. 'AST-1001'
  flatNo: null         // e.g. 'A-101'
};

// Start application
document.addEventListener('DOMContentLoaded', async () => {
  setupTheme();

  // If Supabase credentials are not configured in the .env file, show the setup panel
  if (!isSupabaseConfigured) {
    document.getElementById('view-landing').classList.add('hidden');
    document.getElementById('view-supabase-setup').classList.remove('hidden');
    
    // Remove preloader instantly on setup screen
    const preloader = document.getElementById('app-preloader');
    if (preloader) preloader.remove();
    return;
  }

  // Set up UI routing and handlers immediately to make the page interactive instantly
  setupPortalRouting();
  setupSettingsHandlers();
  setupCopyBadgeHandler();

  // Set up congratulations modal close handlers
  const modalCongrats = document.getElementById('modal-leaderboard-congrats');
  const btnCongratsClose = document.getElementById('modal-congrats-close');
  const btnCongratsOk = document.getElementById('btn-congrats-ok');
  const closeCongratsModal = () => {
    if (modalCongrats) modalCongrats.classList.remove('active');
  };
  if (btnCongratsClose) btnCongratsClose.onclick = closeCongratsModal;
  if (btnCongratsOk) btnCongratsOk.onclick = closeCongratsModal;

  const preloaderStartTime = Date.now();

  // Initialize and seed DB tables automatically if they are empty
  try {
    await initDB();
  } catch (err) {
    console.error('Database initialization failed:', err);
  }

  // Let the gold building drawing animations complete fully (minimum 2.5s display time)
  const elapsedTime = Date.now() - preloaderStartTime;
  const remainingTime = Math.max(0, 2500 - elapsedTime);

  setTimeout(() => {
    // Fade out preloader overlay
    const preloader = document.getElementById('app-preloader');
    if (preloader) {
      preloader.classList.add('fade-out');
      setTimeout(() => {
        preloader.remove();
      }, 600); // matches the 0.6s transition duration in CSS
    }
  }, remainingTime);
});

// ==================== DESIGN THEME CONTROL ====================
function setupTheme() {
  document.documentElement.setAttribute('data-theme', 'light');
}

function setupCopyBadgeHandler() {
  const codeBadge = document.getElementById('admin-building-code-badge');
  if (codeBadge) {
    codeBadge.onclick = async () => {
      const codeText = codeBadge.innerText || codeBadge.textContent;
      if (codeText && codeText !== 'AST-XXXX') {
        try {
          await navigator.clipboard.writeText(codeText);
          showToast(`Building Code ${codeText} copied to clipboard!`, 'success');
        } catch (err) {
          console.error('Copy failed:', err);
          showToast('Failed to copy code to clipboard.', 'error');
        }
      }
    };
  }
}

// ==================== SPA PORTAL ROUTING ====================
function setupPortalRouting() {
  // Toggle Admin Login Password Visibility
  const adminPwInput = document.getElementById('admin-login-password');
  const toggleAdminPwBtn = document.getElementById('btn-toggle-admin-login-password');
  if (toggleAdminPwBtn && adminPwInput) {
    toggleAdminPwBtn.onclick = () => {
      if (adminPwInput.type === 'password') {
        adminPwInput.type = 'text';
        toggleAdminPwBtn.innerHTML = `<svg id="eye-icon-admin" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" style="pointer-events: none;"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;
      } else {
        adminPwInput.type = 'password';
        toggleAdminPwBtn.innerHTML = `<svg id="eye-icon-admin" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" style="pointer-events: none;"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
      }
    };
  }

  // Toggle Member Login Password Visibility
  const memberPwInput = document.getElementById('member-login-password');
  const toggleMemberPwBtn = document.getElementById('btn-toggle-member-login-password');
  if (toggleMemberPwBtn && memberPwInput) {
    toggleMemberPwBtn.onclick = () => {
      if (memberPwInput.type === 'password') {
        memberPwInput.type = 'text';
        toggleMemberPwBtn.innerHTML = `<svg id="eye-icon-member" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" style="pointer-events: none;"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;
      } else {
        memberPwInput.type = 'password';
        toggleMemberPwBtn.innerHTML = `<svg id="eye-icon-member" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" style="pointer-events: none;"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
      }
    };
  }

  const landingSection = document.getElementById('view-landing');
  const workspaceSection = document.getElementById('app-workspace');
  
  // Selector buttons
  const btnSelectAdmin = document.getElementById('btn-select-admin');
  const btnSelectMember = document.getElementById('btn-select-member');
  
  // Back buttons
  const btnBackAdmin = document.getElementById('btn-back-admin-login');
  const btnBackMember = document.getElementById('btn-back-member-login');
  
  // Logins Card references
  const portalSelector = document.getElementById('portal-selector');
  const loginAdminCard = document.getElementById('login-admin');
  const loginMemberCard = document.getElementById('login-member');

  btnSelectAdmin.onclick = () => {
    portalSelector.classList.add('hidden');
    loginAdminCard.classList.remove('hidden');
  };

  btnSelectMember.onclick = () => {
    portalSelector.classList.add('hidden');
    loginMemberCard.classList.remove('hidden');
  };

  btnBackAdmin.onclick = () => {
    loginAdminCard.classList.add('hidden');
    portalSelector.classList.remove('hidden');
  };

  btnBackMember.onclick = () => {
    loginMemberCard.classList.add('hidden');
    portalSelector.classList.remove('hidden');
  };

  // Toggle registration on landing
  const btnGotoRegister = document.getElementById('btn-goto-admin-register');
  const btnGotoLogin = document.getElementById('btn-goto-admin-login');
  const btnBackRegister = document.getElementById('btn-back-admin-register');
  const registerAdminCard = document.getElementById('register-admin-building');

  btnGotoRegister.onclick = (e) => {
    e.preventDefault();
    loginAdminCard.classList.add('hidden');
    registerAdminCard.classList.remove('hidden');
  };

  btnGotoLogin.onclick = (e) => {
    e.preventDefault();
    registerAdminCard.classList.add('hidden');
    loginAdminCard.classList.remove('hidden');
  };

  btnBackRegister.onclick = () => {
    registerAdminCard.classList.add('hidden');
    portalSelector.classList.remove('hidden');
  };

  // Member Login <-> Register Card toggles
  const btnGotoMemberRegister = document.getElementById('btn-goto-member-register');
  const btnGotoMemberLogin = document.getElementById('btn-goto-member-login');
  const btnBackMemberRegister = document.getElementById('btn-back-member-register');
  const registerMemberFlatCard = document.getElementById('register-member-flat');

  btnGotoMemberRegister.onclick = (e) => {
    e.preventDefault();
    loginMemberCard.classList.add('hidden');
    registerMemberFlatCard.classList.remove('hidden');
  };

  btnGotoMemberLogin.onclick = (e) => {
    e.preventDefault();
    registerMemberFlatCard.classList.add('hidden');
    loginMemberCard.classList.remove('hidden');
  };

  btnBackMemberRegister.onclick = () => {
    registerMemberFlatCard.classList.add('hidden');
    loginMemberCard.classList.remove('hidden');
  };

  // Submit Authorizations
  document.getElementById('form-admin-login').onsubmit = async (e) => {
    e.preventDefault();
    const username = document.getElementById('admin-login-username').value;
    const password = document.getElementById('admin-login-password').value;
    
    try {
      const building = await findBuildingByAdminCredentials(username, password);
      if (building) {
        if (building.role === 'superadmin') {
          session.role = 'superadmin';
          session.buildingCode = 'SUPER_ADMIN';
          session.flatNo = null;
          
          showToast('Platform SaaS Access Granted', 'success');
          document.getElementById('form-admin-login').reset();
          enterWorkspace();
          return;
        }

        // SaaS validation checks
        if (building.isActive === false) {
          showToast('Access Suspended: This building registry is currently inactive.', 'error');
          return;
        }
        if (building.subscriptionExpiresAt) {
          const expiryDate = new Date(building.subscriptionExpiresAt);
          if (new Date() > expiryDate) {
            showToast('Access Denied: The SaaS subscription for this building has expired.', 'error');
            return;
          }
        }

        session.role = 'admin';
        session.buildingCode = building.code;
        session.flatNo = null;
        
        showToast(`Administrative Access Granted: ${building.name}`, 'success');
        document.getElementById('form-admin-login').reset();
        enterWorkspace();
      } else {
        showToast('Invalid administrator credentials. Try mrathod@gmail.com / manoj', 'error');
      }
    } catch (error) {
      console.error('Admin login error:', error);
      showToast(`Authentication failed: ${error.message || error}`, 'error');
    }
  };

  // Submit Landing Registration Form
  document.getElementById('form-register-building-landing').onsubmit = async (e) => {
    e.preventDefault();
    const name = document.getElementById('setup-building-name').value.trim();
    const baseMaintenance = Number(document.getElementById('setup-base-maintenance').value) || 0;
    
    const adminDetails = {
      name: document.getElementById('setup-admin-name').value.trim(),
      username: document.getElementById('setup-admin-username').value.trim(),
      password: document.getElementById('setup-admin-password').value
    };

    const bankDetails = {
      bankName: document.getElementById('setup-bank-name').value,
      accountNo: document.getElementById('setup-account-no').value,
      ifsc: document.getElementById('setup-ifsc').value,
      upiId: document.getElementById('setup-upi-id').value
    };

    try {
      // Check if username already exists in another building's admin account to prevent conflicts
      const { data: existsData, error: existsErr } = await supabase
        .from('buildings')
        .select('code')
        .ilike('admin_username', adminDetails.username)
        .maybeSingle();

      if (existsErr) throw existsErr;

      if (existsData) {
        showToast(`Admin username "${adminDetails.username}" is already taken!`, 'error');
        return;
      }

      const newBuilding = await registerBuilding(name, bankDetails, baseMaintenance, adminDetails);
      if (newBuilding) {
        session.role = 'admin';
        session.buildingCode = newBuilding.code;
        
        showToast(`Registered "${name}" and logged in!`, 'success');
        document.getElementById('form-register-building-landing').reset();
        enterWorkspace();
      } else {
        showToast('Registration failed.', 'error');
      }
    } catch (error) {
      console.error('Registration error details:', error);
      showToast(`Registration failed: ${error.message || error}`, 'error');
    }
  };

  // Submit Member Portal Login
  document.getElementById('form-member-login').onsubmit = async (e) => {
    e.preventDefault();
    const username = document.getElementById('member-login-username').value.trim();
    const password = document.getElementById('member-login-password').value;
    
    try {
      const flat = await getFlatByUsernameAndPassword(username, password);
      if (flat) {
        // SaaS validation checks
        const building = await getBuildingWithNestedData(flat.buildingCode);
        if (building) {
          if (building.isActive === false) {
            showToast('Access Suspended: Your building registry is currently inactive.', 'error');
            return;
          }
          if (building.subscriptionExpiresAt) {
            const expiryDate = new Date(building.subscriptionExpiresAt);
            if (new Date() > expiryDate) {
              showToast("Access Denied: Your building's SaaS subscription has expired.", 'error');
              return;
            }
          }
        }

        session.role = 'member';
        session.buildingCode = flat.buildingCode;
        session.flatNo = flat.flatNo;
        
        showToast(`Welcome ${flat.headName} (Flat ${flat.flatNo})`, 'success');
        document.getElementById('form-member-login').reset();
        enterWorkspace();
      } else {
        showToast('Invalid member username or password.', 'error');
      }
    } catch (error) {
      console.error('Member login error:', error);
      showToast(`Login failed: ${error.message || error}`, 'error');
    }
  };

  // Submit Member Flat Self-Registration
  document.getElementById('form-member-flat-register').onsubmit = async (e) => {
    e.preventDefault();
    const buildingCode = document.getElementById('member-reg-building-code').value.trim().toUpperCase();
    const flatNo = document.getElementById('member-reg-flat-no').value.trim().toUpperCase();
    const headName = document.getElementById('member-reg-head-name').value.trim();
    const phone = document.getElementById('member-reg-phone').value.trim();
    const email = document.getElementById('member-reg-email').value.trim();
    const username = document.getElementById('member-reg-username').value.trim();
    const password = document.getElementById('member-reg-password').value;

    try {
      // 1. Check if the building exists and if the flat number is available
      const avail = await checkFlatAvailability(buildingCode, flatNo);
      
      if (avail.status === 'building_not_found') {
        showToast('Building registration code not found. Please verify the code.', 'error');
        return;
      }
      
      if (avail.status === 'already_registered') {
        showToast(`Flat ${flatNo} is already registered under ${avail.headName}.`, 'error');
        return;
      }

      // Check if username is already taken globally in flats table
      const { data: usernameTaken } = await supabase
        .from('flats')
        .select('flat_no')
        .ilike('username', username)
        .maybeSingle();

      if (usernameTaken) {
        showToast(`Username "${username}" is already taken by another resident!`, 'error');
        return;
      }

      // 2. Insert or update the flat record
      const flatDetails = {
        flatNo: flatNo,
        headName: headName,
        phone: phone,
        email: email,
        monthlyCharge: avail.baseMaintenance,
        outstandingDues: 0,
        oldestDueDate: '',
        username: username,
        password: password
      };

      let success = false;
      if (avail.status === 'claimable') {
        // Flat was created by admin but has no credentials. We update it.
        flatDetails.isClaiming = true;
        success = await updateFlat(buildingCode, flatNo, flatDetails);
      } else {
        // Flat does not exist. We create it.
        const res = await addFlat(buildingCode, flatDetails);
        success = !!res;
      }

      if (success) {
        session.role = 'member';
        session.buildingCode = buildingCode;
        session.flatNo = flatNo;
        
        showToast(`Flat registration successful! Welcome ${headName}`, 'success');
        document.getElementById('form-member-flat-register').reset();
        document.getElementById('register-member-flat').classList.add('hidden');
        enterWorkspace();
      } else {
        showToast('Failed to register flat. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Flat registration error:', error);
      showToast(`Registration failed: ${error.message || error}`, 'error');
    }
  };

  // Logout button
  document.getElementById('btn-logout').onclick = () => {
    session = { role: null, buildingCode: null, flatNo: null };
    
    workspaceSection.classList.add('hidden');
    landingSection.classList.remove('hidden');
    portalSelector.classList.remove('hidden');
    loginAdminCard.classList.add('hidden');
    loginMemberCard.classList.add('hidden');
    registerAdminCard.classList.add('hidden');
    
    showToast('Logged Out Successfully', 'info');
  };

  // Set Top Navbar switches
  document.querySelectorAll('.top-navbar nav a').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const panelId = link.getAttribute('data-panel');
      switchPanel(panelId);
    });
  });
}

function switchPanel(panelId) {
  // Toggle Nav Class Active
  document.querySelectorAll('.top-navbar nav a').forEach(el => {
    if (el.getAttribute('data-panel') === panelId) {
      el.classList.add('active');
    } else {
      el.classList.remove('active');
    }
  });

  // Toggle Panel Class Active
  document.querySelectorAll('.view-panel').forEach(panel => {
    panel.classList.remove('active');
  });

  const activePanel = document.getElementById(`panel-${panelId}`);
  if (activePanel) {
    activePanel.classList.add('active');
    renderPanelContent(panelId);
  }
}

// ==================== WORKSPACE ROUTER VIEWPORT ====================
function enterWorkspace() {
  const landingSection = document.getElementById('view-landing');
  const workspaceSection = document.getElementById('app-workspace');
  
  landingSection.classList.add('hidden');
  workspaceSection.classList.remove('hidden');

  const adminLinks = document.getElementById('navbar-admin-links');
  const memberLinks = document.getElementById('navbar-member-links');
  const superadminLinks = document.getElementById('navbar-superadmin-links');

  if (session.role === 'superadmin') {
    adminLinks.classList.add('hidden');
    memberLinks.classList.add('hidden');
    if (superadminLinks) superadminLinks.classList.remove('hidden');
    switchPanel('super-admin-dashboard');
  } else if (session.role === 'admin') {
    adminLinks.classList.remove('hidden');
    memberLinks.classList.add('hidden');
    if (superadminLinks) superadminLinks.classList.add('hidden');
    switchPanel('admin-dashboard');
  } else {
    adminLinks.classList.add('hidden');
    memberLinks.classList.remove('hidden');
    if (superadminLinks) superadminLinks.classList.add('hidden');
    switchPanel('member-dashboard');
  }
}

async function renderPanelContent(panelId) {
  if (panelId === 'super-admin-dashboard') {
    renderSuperAdminDashboard();
    return;
  }

  const b = await getBuildingWithNestedData(session.buildingCode);

  switch (panelId) {
    case 'admin-dashboard':
      if (b) renderAdminDashboard(b);
      break;

    case 'admin-directory':
      if (b) renderFlatDirectory(b);
      break;

    case 'admin-leaderboard':
      if (b) await renderLeaderboardWidget(b, 'admin-leaderboard-list');
      break;

    case 'admin-reminders':
      if (b) renderAdminRemindersTab(b);
      break;

    case 'admin-settings':
      if (b) populateAdminSettingsForm(b);
      break;

    case 'member-dashboard':
      if (b) renderMemberDashboard(b);
      break;

    case 'member-leaderboard':
      if (b) await renderLeaderboardWidget(b, 'member-leaderboard-list');
      break;

    case 'member-inbox':
      if (b) renderMemberInbox(b);
      break;
  }
}

// ==================== RENDER: DYNAMIC PROPERTY TIER STATUS ====================
function renderBuildingDynamicStatus(building, targetContainerId) {
  const container = document.getElementById(targetContainerId);
  if (!container) return;

  // Compute metrics
  let totalDues = 0;
  let totalCollected = 0;
  
  Object.keys(building.flats).forEach(flatNo => {
    const flat = building.flats[flatNo];
    totalDues += flat.outstandingDues;
    flat.payments.forEach(p => {
      totalCollected += p.amount;
    });
  });

  const totalBilled = totalCollected + totalDues;
  const rate = totalBilled > 0 ? (totalCollected / totalBilled) * 100 : 100;

  let tier = 'gold';
  let badgeText = 'Thriving Gold Tier';
  let badgeClass = 'gold';
  let message = `Excellent financial status! **${rate.toFixed(1)}%** of billed maintenance has been collected. Property upkeep reserves are fully funded.`;
  
  let svgContent = `
    <svg viewBox="0 0 100 100" width="56" height="56" fill="none" stroke="currentColor" stroke-width="2.5">
      <rect x="35" y="12" width="30" height="76" rx="3" />
      <line x1="43" y1="22" x2="47" y2="22" /><line x1="53" y1="22" x2="57" y2="22" />
      <line x1="43" y1="36" x2="47" y2="36" /><line x1="53" y1="36" x2="57" y2="36" />
      <line x1="43" y1="50" x2="47" y2="50" /><line x1="53" y1="50" x2="57" y2="50" />
      <line x1="43" y1="64" x2="47" y2="64" /><line x1="53" y1="64" x2="57" y2="64" />
      <line x1="43" y1="78" x2="47" y2="78" /><line x1="53" y1="78" x2="57" y2="78" />
      <path d="M15 88 H85" />
      <path d="M22 88 C 22 78, 30 78, 32 88 Z" fill="currentColor" opacity="0.2" />
      <circle cx="50" cy="5" r="1.5" fill="currentColor" />
    </svg>
  `;

  if (rate >= 70 && rate < 90) {
    tier = 'silver';
    badgeText = 'Stable Silver Tier';
    badgeClass = 'silver';
    message = `Stable collection rate at **${rate.toFixed(1)}%**. There are outstanding charges. Send friendly email alerts to maintain property budgets.`;
    
    svgContent = `
      <svg viewBox="0 0 100 100" width="56" height="56" fill="none" stroke="currentColor" stroke-width="2.5">
        <rect x="20" y="32" width="26" height="56" rx="2" />
        <rect x="54" y="46" width="26" height="42" rx="2" />
        <rect x="26" y="42" width="4" height="6" /><rect x="36" y="42" width="4" height="6" />
        <rect x="26" y="58" width="4" height="6" /><rect x="36" y="58" width="4" height="6" />
        <rect x="26" y="74" width="4" height="6" /><rect x="36" y="74" width="4" height="6" />
        <rect x="60" y="56" width="4" height="6" /><rect x="70" y="56" width="4" height="6" />
        <rect x="60" y="72" width="4" height="6" /><rect x="70" y="72" width="4" height="6" />
        <path d="M10 88 H90" />
      </svg>
    `;
  } else if (rate < 70) {
    tier = 'amber';
    badgeText = 'Attention Required';
    badgeClass = 'amber';
    message = `Dues warning! Maintenance collection is critical at **${rate.toFixed(1)}%**. Outstanding arrears exceed safe operational margins. Send bulk notices immediately.`;
    
    svgContent = `
      <svg viewBox="0 0 100 100" width="56" height="56" fill="none" stroke="currentColor" stroke-width="2.5">
        <rect x="28" y="28" width="44" height="60" rx="2" />
        <line x1="36" y1="40" x2="42" y2="40" /><line x1="58" y1="40" x2="64" y2="40" />
        <line x1="36" y1="56" x2="42" y2="56" /><line x1="58" y1="56" x2="64" y2="56" />
        <circle cx="50" cy="74" r="8" fill="var(--danger)" stroke="none" />
        <text x="47.5" y="79" fill="#fff" font-family="sans-serif" font-weight="900" font-size="12">!</text>
        <path d="M72 32 L78 36 L74 42" stroke="var(--danger)" stroke-width="2" />
        <path d="M10 88 H90" />
      </svg>
    `;
  }

  container.innerHTML = `
    <div class="status-visuals-left">
      <div class="status-illustration-wrapper status-${tier}">
        ${svgContent}
      </div>
      <div class="status-visuals-details">
        <span class="status-tier-badge ${badgeClass}">${badgeText}</span>
        <div class="status-message">${message}</div>
      </div>
    </div>
  `;
}

// ==================== VIEW: ADMIN DASHBOARD ====================
function renderAdminDashboard(building) {
  document.getElementById('admin-dashboard-building-name').textContent = building.name;
  document.getElementById('admin-building-code-badge').textContent = building.code;

  // Set account details
  document.getElementById('admin-bank-name').textContent = building.bankDetails.bankName || '-';
  document.getElementById('admin-bank-acc').textContent = building.bankDetails.accountNo || '-';
  document.getElementById('admin-bank-ifsc').textContent = building.bankDetails.ifsc || '-';
  document.getElementById('admin-bank-upi').textContent = building.bankDetails.upiId || '-';

  // Math aggregates
  let totalDues = 0;
  let totalBilled = 0;
  let totalCollected = 0;
  let totalMonthlyRate = 0;
  let pendingFlatsCount = 0;
  const flatsKeys = Object.keys(building.flats).filter(k => k !== 'SYSTEM_BROADCAST');
  const flatsCount = flatsKeys.length;

  flatsKeys.forEach(flatNo => {
    const flat = building.flats[flatNo];
    totalDues += flat.outstandingDues;
    totalMonthlyRate += flat.monthlyCharge;
    
    if (flat.outstandingDues > 0) {
      pendingFlatsCount++;
    }
    flat.payments.forEach(p => {
      totalCollected += p.amount;
    });
  });

  // Populate structured database format table
  document.getElementById('struct-building-code').textContent = building.code;
  document.getElementById('struct-building-name').textContent = building.name;
  document.getElementById('struct-admin-name').textContent = building.adminDetails ? building.adminDetails.name : '-';
  document.getElementById('struct-admin-username').textContent = building.adminDetails ? building.adminDetails.username : '-';
  document.getElementById('struct-base-maintenance').textContent = `₹${(building.baseMaintenance || 0).toLocaleString()}`;
  document.getElementById('struct-flats-count').textContent = flatsCount;
  document.getElementById('struct-outstanding-dues').textContent = `₹${totalDues.toLocaleString()}`;
  
  const bankString = building.bankDetails.bankName 
    ? `${building.bankDetails.bankName} (Acc: ${building.bankDetails.accountNo}, IFSC: ${building.bankDetails.ifsc})`
    : '-';
  document.getElementById('struct-bank-details').textContent = bankString;

  totalBilled = totalCollected + totalDues;
  const rate = totalBilled > 0 ? ((totalCollected / totalBilled) * 100).toFixed(1) : '100';

  document.getElementById('admin-stat-dues').textContent = `₹${totalDues.toLocaleString()}`;
  document.getElementById('admin-stat-dues-sub').textContent = `${pendingFlatsCount} flats`;
  document.getElementById('admin-stat-collected').textContent = `₹${totalCollected.toLocaleString()}`;
  document.getElementById('admin-stat-collection-rate').textContent = `${rate}%`;
  document.getElementById('admin-stat-monthly').textContent = `₹${(flatsCount > 0 ? Math.round(totalMonthlyRate / flatsCount) : 0).toLocaleString()}`;
  document.getElementById('admin-stat-flats-count').textContent = flatsCount;

  // Render the Dynamic Graphic Illustration
  renderBuildingDynamicStatus(building, 'admin-building-status-visual');

  // Trigger bulk warnings
  const btnBulkAlerts = document.getElementById('admin-btn-trigger-bulk-alerts');
  btnBulkAlerts.onclick = async () => {
    if (pendingFlatsCount === 0) {
      showToast('All flats are paid up. No email reminders needed!', 'info');
      return;
    }
    const count = await sendBulkReminders(session.buildingCode);
    showToast(`Dispatched ${count} monthly email alerts successfully!`, 'success');
    renderPanelContent('admin-dashboard');
  };

  document.getElementById('admin-btn-quick-add-flat').onclick = () => {
    openFlatModal();
  };
}

// ==================== VIEW: FLAT DIRECTORY ====================
function renderFlatDirectory(building) {
  const directoryBody = document.getElementById('directory-table-body');
  const searchInput = document.getElementById('directory-search');
  const statusFilter = document.getElementById('directory-status-filter');

  const updateTable = () => {
    const query = searchInput.value.toLowerCase().trim();
    const filter = statusFilter.value;

    const fragment = document.createDocumentFragment();
    const flats = Object.keys(building.flats).filter(k => k !== 'SYSTEM_BROADCAST');

    let matchCount = 0;

    flats.forEach(flatNo => {
      const flat = building.flats[flatNo];
      
      const matchesSearch = flatNo.toLowerCase().includes(query) || 
                            flat.headName.toLowerCase().includes(query) ||
                            flat.phone.toLowerCase().includes(query);
      
      const matchesStatus = filter === 'All' || 
                            (filter === 'Paid' && flat.outstandingDues === 0) ||
                            (filter === 'Unpaid' && flat.outstandingDues > 0);

      if (matchesSearch && matchesStatus) {
        matchCount++;
        const tr = document.createElement('tr');
        const statusBadge = flat.outstandingDues > 0 
          ? `<span class="badge badge-danger">Unpaid</span>` 
          : `<span class="badge badge-success">Paid</span>`;

        tr.innerHTML = `
          <td style="font-weight: 700; font-family: var(--font-heading); color: var(--primary);">${flat.flatNo}</td>
          <td style="font-weight: 600;">${flat.headName}</td>
          <td>₹${flat.monthlyCharge.toLocaleString()}</td>
          <td style="${flat.outstandingDues > 0 ? 'color: var(--danger); font-weight:700;' : ''}">
            ₹${flat.outstandingDues.toLocaleString()}
          </td>
          <td>${flat.phone || '-'}</td>
          <td>${statusBadge}</td>
          <td style="text-align: right;">
            <button class="btn btn-secondary btn-edit-flat" style="padding: 6px 12px; font-size:12px; margin-right: 6px;">Edit</button>
            <button class="btn btn-danger btn-delete-flat" style="padding: 6px 12px; font-size:12px;">Delete</button>
          </td>
        `;

        tr.querySelector('.btn-edit-flat').onclick = () => openFlatModal(flat);
        tr.querySelector('.btn-delete-flat').onclick = async () => {
          if (confirm(`Remove Flat "${flat.flatNo}" from the building registry?`)) {
            await deleteFlat(session.buildingCode, flat.flatNo);
            showToast(`Flat "${flat.flatNo}" removed`, 'info');
            renderPanelContent('admin-directory');
          }
        };

        fragment.appendChild(tr);
      }
    });

    directoryBody.innerHTML = '';
    if (matchCount === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="7" style="text-align: center; color: var(--text-secondary); padding: 30px;">No registered flats matching search filters.</td>`;
      directoryBody.appendChild(tr);
    } else {
      directoryBody.appendChild(fragment);
    }
  };

  let searchTimeout;
  searchInput.oninput = () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(updateTable, 180);
  };
  statusFilter.onchange = updateTable;

  document.getElementById('admin-btn-add-flat').onclick = () => openFlatModal();

  updateTable();
}

function openFlatModal(flat = null) {
  const modal = document.getElementById('modal-flat');
  const title = document.getElementById('modal-flat-title');
  const form = document.getElementById('form-flat-details');
  const origNoField = document.getElementById('flat-original-no');

  modal.classList.add('active');

  // Password show/hide toggle logic
  const pwInput = document.getElementById('flat-password');
  const toggleBtn = document.getElementById('btn-toggle-flat-password');
  if (toggleBtn && pwInput) {
    pwInput.type = 'password';
    toggleBtn.innerHTML = `<svg id="eye-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" style="pointer-events: none;"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
    toggleBtn.onclick = () => {
      if (pwInput.type === 'password') {
        pwInput.type = 'text';
        toggleBtn.innerHTML = `<svg id="eye-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" style="pointer-events: none;"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;
      } else {
        pwInput.type = 'password';
        toggleBtn.innerHTML = `<svg id="eye-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" style="pointer-events: none;"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
      }
    };
  }

  if (flat) {
    title.textContent = `Edit Flat ${flat.flatNo}`;
    origNoField.value = flat.flatNo;
    document.getElementById('flat-no').value = flat.flatNo;
    document.getElementById('flat-head-name').value = flat.headName;
    document.getElementById('flat-username').value = flat.username || '';
    document.getElementById('flat-password').value = flat.password || '';
    document.getElementById('flat-monthly-charge').value = flat.monthlyCharge;
    document.getElementById('flat-outstanding-dues').value = flat.outstandingDues;
    document.getElementById('flat-phone').value = flat.phone;
    document.getElementById('flat-email').value = flat.email;
    document.getElementById('flat-overdue-date').value = flat.oldestDueDate || '';
  } else {
    title.textContent = 'Register New Flat Member';
    origNoField.value = '';
    form.reset();
    document.getElementById('flat-username').value = '';
    document.getElementById('flat-password').value = '';
    document.getElementById('flat-overdue-date').value = '';
    
    getBuildingWithNestedData(session.buildingCode).then(b => {
      if (b && b.baseMaintenance !== undefined) {
        document.getElementById('flat-monthly-charge').value = b.baseMaintenance;
      }
    });
  }

  const closeModal = () => modal.classList.remove('active');
  document.getElementById('modal-flat-close').onclick = closeModal;
  document.getElementById('modal-flat-cancel').onclick = closeModal;

  form.onsubmit = async (e) => {
    e.preventDefault();
    try {
      const usernameVal = document.getElementById('flat-username').value.trim();
      const passwordVal = document.getElementById('flat-password').value;
      const data = {
        flatNo: document.getElementById('flat-no').value.trim().toUpperCase(),
        headName: document.getElementById('flat-head-name').value.trim(),
        username: usernameVal || null,
        password: passwordVal || null,
        monthlyCharge: Number(document.getElementById('flat-monthly-charge').value),
        outstandingDues: Number(document.getElementById('flat-outstanding-dues').value),
        phone: document.getElementById('flat-phone').value.trim(),
        email: document.getElementById('flat-email').value.trim(),
        oldestDueDate: document.getElementById('flat-overdue-date').value
      };

      if (data.username) {
        // Check if username is already taken globally in flats table by another flat
        const { data: usernameTaken, error: queryErr } = await supabase
          .from('flats')
          .select('flat_no, building_code')
          .ilike('username', data.username)
          .maybeSingle();

        if (queryErr) throw queryErr;

        if (usernameTaken && (usernameTaken.building_code !== session.buildingCode || usernameTaken.flat_no !== origNoField.value)) {
          showToast(`Username "${data.username}" is already taken by another resident!`, 'error');
          return;
        }
      }

      if (origNoField.value) {
        const success = await updateFlat(session.buildingCode, origNoField.value, data);
        if (success) {
          showToast(`Flat "${data.flatNo}" updated`, 'success');
        } else {
          showToast(`Failed to update flat "${data.flatNo}"`, 'error');
          return;
        }
      } else {
        const res = await addFlat(session.buildingCode, data);
        if (res) {
          showToast(`Flat "${data.flatNo}" registered`, 'success');
        } else {
          showToast(`Flat "${data.flatNo}" already exists!`, 'error');
          return;
        }
      }
      closeModal();
      renderPanelContent(session.role === 'admin' ? 'admin-directory' : '');
    } catch (error) {
      console.error('Flat modal save error:', error);
      showToast(`Failed to save flat details: ${error.message || error}`, 'error');
    }
  };
}

// ==================== VIEW: INTERNAL PORTAL LEADERBOARD ====================
async function renderLeaderboardWidget(building, targetListId) {
  const container = document.getElementById(targetListId);
  if (!container) return;

  const data = await getGlobalLeaderboard(session.buildingCode);

  if (data.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
        <svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom: 12px; color: var(--primary);">
          <circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>
        </svg>
        <p style="font-weight: 700; color: var(--text-primary);">All Invoices Cleared</p>
        <p style="font-size: 13px; margin-top: 4px;">Excellent collection status. No flats are currently overdue.</p>
      </div>
    `;
    return;
  }

  const fragment = document.createDocumentFragment();

  data.forEach((flat, index) => {
    const row = document.createElement('div');
    row.className = `leaderboard-row`;
    if (index === 0) row.classList.add('top-rank-1');
    else if (index === 1) row.classList.add('top-rank-2');
    else if (index === 2) row.classList.add('top-rank-3');

    row.innerHTML = `
      <span class="rank-circle">${index + 1}</span>
      <div>
        <div class="leaderboard-flat-no">${flat.flatNo}</div>
        <div class="leaderboard-building">${flat.buildingName}</div>
      </div>
      <span class="leaderboard-owner">${flat.headName}</span>
      <span class="leaderboard-due-days">${flat.overdueDays} Days</span>
      <span class="leaderboard-amount">₹${flat.outstandingDues.toLocaleString()}</span>
    `;
    fragment.appendChild(row);
  });

  container.innerHTML = '';
  container.appendChild(fragment);

  // Wire up the broadcast button for the admin leaderboard
  if (targetListId === 'admin-leaderboard-list') {
    const btn = document.getElementById('admin-broadcast-leaderboard-btn');
    if (btn) {
      btn.onclick = async () => {
        const topMember = data[0];
        if (!topMember) {
          showToast('Leaderboard is empty. No top member to broadcast.', 'info');
          return;
        }
        btn.disabled = true;
        btn.textContent = 'Broadcasting...';
        const success = await broadcastCongrats(session.buildingCode, topMember);
        btn.disabled = false;
        btn.textContent = 'Broadcast Leaderboard Congratulations';
        if (success) {
          showToast(`Broadcast sent successfully for Flat ${topMember.flatNo}!`, 'success');
        } else {
          showToast('Failed to send broadcast.', 'error');
        }
      };
    }
  }
}

// ==================== VIEW: ADMIN REMINDERS ====================
function renderAdminRemindersTab(building) {
  const logTable = document.getElementById('admin-reminders-log-table');
  const btnSendBulk = document.getElementById('admin-reminders-send-bulk');

  const renderReminderLogs = () => {
    const fragment = document.createDocumentFragment();
    let totalLogs = 0;

    Object.keys(building.flats).filter(k => k !== 'SYSTEM_BROADCAST').forEach(flatNo => {
      const flat = building.flats[flatNo];
      flat.reminders.forEach(rem => {
        totalLogs++;
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td style="font-weight:700; color: var(--primary);">${flat.flatNo}</td>
          <td style="font-weight:600;">${flat.headName}</td>
          <td>${rem.date}</td>
          <td>
            <span style="font-size:12.5px; color: var(--text-secondary);">
              Monthly: ₹${rem.monthlyCharge} | Arrears: ₹${rem.dueCharge} | <b>Total: ₹${rem.totalDue}</b>
            </span>
          </td>
          <td style="text-align: right;">
            <button class="btn btn-secondary btn-view-email" style="padding: 6px 12px; font-size:12px;">View Alert</button>
          </td>
        `;

        tr.querySelector('.btn-view-email').onclick = () => {
          openEmailPreview(flat.email || 'resident@example.com', rem);
        };
        fragment.appendChild(tr);
      });
    });

    logTable.innerHTML = '';
    if (totalLogs === 0) {
      logTable.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 24px; color: var(--text-secondary);">No email alerts sent yet. Click send above to notify defaulters.</td></tr>`;
    } else {
      logTable.appendChild(fragment);
    }
  };

  btnSendBulk.onclick = async () => {
    const count = await sendBulkReminders(session.buildingCode);
    if (count > 0) {
      showToast(`Dispatched ${count} monthly email alerts successfully!`, 'success');
      renderPanelContent('admin-reminders');
    } else {
      showToast('All flats are fully paid. No alerts sent.', 'info');
    }
  };

  renderReminderLogs();
}

function openEmailPreview(toEmail, reminder) {
  const modal = document.getElementById('modal-email-preview');
  modal.classList.add('active');

  document.getElementById('email-preview-to').textContent = toEmail;
  document.getElementById('email-preview-subject').textContent = reminder.subject;
  document.getElementById('email-preview-body').textContent = reminder.content;

  const close = () => modal.classList.remove('active');
  document.getElementById('modal-email-close').onclick = close;
  document.getElementById('btn-email-preview-ok').onclick = close;
}

// ==================== VIEW: ADMIN BANK CONFIGURATION ====================
function populateAdminSettingsForm(building) {
  document.getElementById('settings-building-name').value = building.name;
  document.getElementById('settings-base-maintenance').value = building.baseMaintenance || '';
  document.getElementById('settings-bank-name').value = building.bankDetails.bankName || '';
  document.getElementById('settings-account-no').value = building.bankDetails.accountNo || '';
  document.getElementById('settings-ifsc').value = building.bankDetails.ifsc || '';
  document.getElementById('settings-upi-id').value = building.bankDetails.upiId || '';

  // Admin details
  document.getElementById('settings-admin-name').value = building.adminDetails ? building.adminDetails.name : '';
  document.getElementById('settings-admin-username').value = building.adminDetails ? building.adminDetails.username : '';
  document.getElementById('settings-admin-password').value = building.adminDetails ? building.adminDetails.password : '';

  const form = document.getElementById('form-settings-update');
  form.onsubmit = async (e) => {
    e.preventDefault();
    try {
      const updatedName = document.getElementById('settings-building-name').value;
      const baseMaintenance = Number(document.getElementById('settings-base-maintenance').value) || 0;
      
      const adminName = document.getElementById('settings-admin-name').value.trim();
      const adminUsername = document.getElementById('settings-admin-username').value.trim();
      const adminPassword = document.getElementById('settings-admin-password').value;

      const bank = {
        bankName: document.getElementById('settings-bank-name').value,
        accountNo: document.getElementById('settings-account-no').value,
        ifsc: document.getElementById('settings-ifsc').value,
        upiId: document.getElementById('settings-upi-id').value
      };

      // Check if administrative username is taken by another building
      const { data: existsData, error: existsErr } = await supabase
        .from('buildings')
        .select('code')
        .ilike('admin_username', adminUsername)
        .maybeSingle();

      if (existsErr) throw existsErr;

      if (existsData && existsData.code !== session.buildingCode) {
        showToast(`Admin username "${adminUsername}" is already taken!`, 'error');
        return;
      }

      const success = await updateBuilding(session.buildingCode, updatedName, baseMaintenance, {
        name: adminName,
        username: adminUsername,
        password: adminPassword
      }, bank);

      if (success) {
        showToast('Configuration Updated Successfully', 'success');
        renderPanelContent('admin-settings');
      } else {
        showToast('Failed to save settings.', 'error');
      }
    } catch (error) {
      console.error('Settings update error:', error);
      showToast(`Update failed: ${error.message || error}`, 'error');
    }
  };
}

function setupSettingsHandlers() {
  document.getElementById('admin-settings-reset').onclick = async () => {
    if (confirm('Are you sure you want to format all building and transaction databases? This resets to the default seeded state.')) {
      await resetDB();
      showToast('Database formatted successfully', 'success');
      location.reload();
    }
  };

  const deleteBtn = document.getElementById('admin-settings-delete');
  if (deleteBtn) {
    deleteBtn.onclick = async () => {
      if (confirm('WARNING: Are you sure you want to permanently delete this property database? This will remove all flat listings, transactions, dues history, and admin access, and cannot be undone!')) {
        if (confirm('Please confirm once more: do you really want to delete this property registry?')) {
          const code = session.buildingCode;
          await deleteBuilding(code);
          showToast('Property registry deleted successfully.', 'info');
          // Log out the admin
          session = { role: null, buildingCode: null, flatNo: null };
          document.getElementById('app-workspace').classList.add('hidden');
          document.getElementById('view-landing').classList.remove('hidden');
          document.getElementById('portal-selector').classList.remove('hidden');
          document.getElementById('login-admin').classList.add('hidden');
          document.getElementById('login-member').classList.add('hidden');
        }
      }
    };
  }
}

// ==================== CONGRATULATIONS LEADERBOARD POPUP ====================
function showCongratsModal(flatNo, headName, amount) {
  const modal = document.getElementById('modal-leaderboard-congrats');
  const body = document.getElementById('congrats-message-body');
  if (modal && body) {
    body.innerHTML = `Congratulations to <strong>${headName}</strong> of Flat <strong>${flatNo}</strong> for being at the top of the leaderboard with outstanding dues of <strong>₹${amount.toLocaleString()}</strong>!`;
    modal.classList.add('active');
  }
}

function checkAndShowCongratsBroadcast(building) {
  const broadcastFlat = building.flats['SYSTEM_BROADCAST'];
  if (broadcastFlat && broadcastFlat.reminders && broadcastFlat.reminders.length > 0) {
    const congratsReminder = broadcastFlat.reminders.find(r => r.subject === 'Leaderboard Congratulations');
    if (congratsReminder) {
      let info = null;
      try {
        info = JSON.parse(congratsReminder.content);
      } catch (e) {
        console.error("Failed to parse congrats reminder content:", e);
      }
      
      if (info) {
        const broadcastTime = info.broadcastTime || 0;
        const lastShownTimeKey = `congrats_last_shown_time_${session.buildingCode}_${session.flatNo}`;
        const lastShownBroadcastTimeKey = `congrats_last_shown_broadcast_${session.buildingCode}_${session.flatNo}`;
        
        const lastShownTime = localStorage.getItem(lastShownTimeKey);
        const lastShownBroadcastTime = localStorage.getItem(lastShownBroadcastTimeKey);
        const now = Date.now();
        const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
        
        if (
          lastShownBroadcastTime !== String(broadcastTime) ||
          !lastShownTime ||
          (now - Number(lastShownTime)) > ONE_WEEK_MS
        ) {
          showCongratsModal(info.flatNo, info.headName, info.outstandingDues);
          localStorage.setItem(lastShownTimeKey, now.toString());
          localStorage.setItem(lastShownBroadcastTimeKey, broadcastTime.toString());
        }
      }
    }
  }
}

// ==================== PLATFORM SaaS SUPER ADMIN DASHBOARD ====================
async function renderSuperAdminDashboard() {
  const tableBody = document.getElementById('superadmin-buildings-table-body');
  if (!tableBody) return;

  tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 20px; color: var(--text-secondary);">Loading platform databases...</td></tr>`;

  const buildings = await getAllBuildings();
  tableBody.innerHTML = '';

  if (buildings.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 20px; color: var(--text-secondary);">No registered building registries found.</td></tr>`;
    return;
  }

  buildings.forEach(b => {
    const tr = document.createElement('tr');
    const statusBadge = b.isActive
      ? `<span class="badge badge-success">Active</span>`
      : `<span class="badge badge-danger">Suspended</span>`;

    const expiryText = b.subscriptionExpiresAt
      ? new Date(b.subscriptionExpiresAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })
      : 'No Expiry';

    tr.innerHTML = `
      <td style="font-weight: 700; color: var(--primary);">${b.code}</td>
      <td style="font-weight: 600;">${b.name}</td>
      <td>${b.adminEmail}</td>
      <td>${statusBadge}</td>
      <td>${expiryText}</td>
      <td style="text-align: right;">
        <button class="btn btn-secondary btn-sa-toggle" style="padding: 6px 12px; font-size:12px; margin-right: 6px; width: 90px;">
          ${b.isActive ? 'Suspend' : 'Activate'}
        </button>
        <button class="btn btn-primary btn-sa-extend-month" style="padding: 6px 12px; font-size:12px; margin-right: 6px;">
          +1 Month
        </button>
        <button class="btn btn-primary btn-sa-extend-year" style="padding: 6px 12px; font-size:12px;">
          +1 Year
        </button>
      </td>
    `;

    // Toggle active status
    tr.querySelector('.btn-sa-toggle').onclick = async () => {
      const newActive = !b.isActive;
      const confirmMsg = newActive
        ? `Re-activate building registry "${b.name}"?`
        : `Are you sure you want to suspend building registry "${b.name}"? This blocks all admin and member logins immediately.`;
      
      if (confirm(confirmMsg)) {
        const success = await updateBuildingSaaS(b.code, newActive, b.subscriptionExpiresAt);
        if (success) {
          showToast(`Building "${b.name}" status updated.`, 'success');
          renderSuperAdminDashboard();
        } else {
          showToast('Failed to update building status.', 'error');
        }
      }
    };

    // Helper to calculate extended date
    const extendDate = async (months) => {
      let currentExpiry = b.subscriptionExpiresAt ? new Date(b.subscriptionExpiresAt) : new Date();
      if (currentExpiry < new Date()) {
        currentExpiry = new Date(); // If expired, start from today
      }
      currentExpiry.setMonth(currentExpiry.getMonth() + months);
      
      const success = await updateBuildingSaaS(b.code, b.isActive, currentExpiry.toISOString());
      if (success) {
        showToast(`Extended subscription of "${b.name}" by ${months} month(s).`, 'success');
        renderSuperAdminDashboard();
      } else {
        showToast('Failed to extend subscription.', 'error');
      }
    };

    tr.querySelector('.btn-sa-extend-month').onclick = () => extendDate(1);
    tr.querySelector('.btn-sa-extend-year').onclick = () => extendDate(12);

    tableBody.appendChild(tr);
  });
}

// ==================== VIEW: MEMBER PORTAL DASHBOARD ====================
function renderMemberDashboard(building) {
  const flat = building.flats[session.flatNo];
  if (!flat) return;

  checkAndShowCongratsBroadcast(building);

  document.getElementById('member-welcome-title').textContent = `Welcome, ${flat.headName}`;
  document.getElementById('member-welcome-subtitle').textContent = `Flat ${flat.flatNo} | ${building.name}`;

  // Render illustration inside resident portal
  renderBuildingDynamicStatus(building, 'member-building-status-visual');

  const outAmount = document.getElementById('member-outstanding-amount');
  const payBtn = document.getElementById('member-btn-pay-now');
  const statusBadge = document.getElementById('member-status-badge');

  outAmount.textContent = `₹${flat.outstandingDues.toLocaleString()}`;
  
  if (flat.outstandingDues > 0) {
    statusBadge.className = 'badge badge-danger';
    statusBadge.textContent = 'Outstanding';
    payBtn.classList.remove('hidden');
  } else {
    statusBadge.className = 'badge badge-success';
    statusBadge.textContent = 'Paid Up';
    payBtn.classList.add('hidden');
  }

  // Display bank details
  document.getElementById('member-bank-name').textContent = building.bankDetails.bankName || '-';
  document.getElementById('member-bank-acc').textContent = building.bankDetails.accountNo || '-';
  document.getElementById('member-bank-ifsc').textContent = building.bankDetails.ifsc || '-';
  document.getElementById('member-bank-upi').textContent = building.bankDetails.upiId || '-';

  const paymentsTable = document.getElementById('member-payments-table');
  paymentsTable.innerHTML = '';
  
  if (flat.payments.length === 0) {
    paymentsTable.innerHTML = `<tr><td colspan="3" style="text-align:center; color: var(--text-secondary); padding: 20px;">No transaction logs found for this flat.</td></tr>`;
  } else {
    flat.payments.forEach(p => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${p.date}</td>
        <td>${p.method}</td>
        <td style="text-align: right; color: var(--success); font-weight:700;">₹${p.amount.toLocaleString()}</td>
      `;
      paymentsTable.appendChild(tr);
    });
  }

  payBtn.onclick = () => {
    openCheckoutGateway(building, flat);
  };
}

// ==================== VIEW: MEMBER REMINDERS INBOX ====================
function renderMemberInbox(building) {
  const flat = building.flats[session.flatNo];
  if (!flat) return;

  const inboxContainer = document.getElementById('member-inbox-list');
  const badge = document.getElementById('member-inbox-badge');

  const unreadCount = flat.reminders.length;
  if (unreadCount > 0) {
    badge.textContent = unreadCount;
    badge.style.display = 'inline-flex';
  } else {
    badge.style.display = 'none';
  }

  inboxContainer.innerHTML = '';
  
  if (flat.reminders.length === 0) {
    inboxContainer.innerHTML = `
      <div style="text-align:center; padding: 40px; color: var(--text-secondary);">
        <svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom: 12px; color: var(--text-secondary);">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>
        <p style="font-weight:600; color:var(--text-primary);">Inbox Empty</p>
        <p style="font-size:12px; margin-top:4px;">No email reminders have been sent to this flat.</p>
      </div>
    `;
    return;
  }

  flat.reminders.forEach(rem => {
    const item = document.createElement('div');
    item.className = 'inbox-item';
    item.innerHTML = `
      <div class="inbox-item-header">
        <span>Reminders Office</span>
        <span>${rem.date}</span>
      </div>
      <div class="inbox-item-subject">${rem.subject}</div>
      <div class="inbox-item-preview">${rem.content}</div>
    `;
    item.onclick = () => {
      openEmailPreview(flat.email || 'resident@example.com', rem);
    };
    inboxContainer.appendChild(item);
  });
}

// ==================== CHECKOUT GATEWAY DIALOG SIMULATION ====================
function openCheckoutGateway(building, flat) {
  const modal = document.getElementById('modal-payment-gateway');
  const formScreen = document.getElementById('pay-gateway-form-screen');
  const loaderScreen = document.getElementById('pay-gateway-loader-screen');
  const successScreen = document.getElementById('pay-gateway-success-screen');

  modal.classList.add('active');
  formScreen.classList.remove('hidden');
  loaderScreen.classList.add('hidden');
  successScreen.classList.add('hidden');

  document.getElementById('checkout-building-name').textContent = building.name;
  document.getElementById('checkout-amount-due').textContent = `₹${flat.outstandingDues.toLocaleString()}`;
  document.getElementById('checkout-upi-id').textContent = building.bankDetails.upiId || 'society@upi';

  // Set up custom amount input
  const payAmountInput = document.getElementById('checkout-pay-amount');
  payAmountInput.value = flat.outstandingDues;
  payAmountInput.max = flat.outstandingDues;

  document.getElementById('pay-card-number').value = '';
  document.getElementById('pay-card-expiry').value = '';
  document.getElementById('pay-card-cvv').value = '';

  const tabs = document.querySelectorAll('.pay-tab-btn');
  const panels = document.querySelectorAll('.payment-method-panel');

  tabs.forEach(tab => {
    tab.onclick = () => {
      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      const target = tab.getAttribute('data-tab');
      document.getElementById(`pay-panel-${target}`).classList.add('active');
    };
  });

  const close = () => modal.classList.remove('active');
  document.getElementById('modal-pay-close').onclick = close;

  const btnProcess = document.getElementById('btn-process-checkout');
  btnProcess.onclick = () => {
    const payAmountVal = Number(payAmountInput.value) || 0;
    if (payAmountVal <= 0 || payAmountVal > flat.outstandingDues) {
      showToast(`Please enter a valid amount between ₹1 and ₹${flat.outstandingDues.toLocaleString()}`, 'error');
      return;
    }

    const activeTab = document.querySelector('.pay-tab-btn.active').getAttribute('data-tab');
    if (activeTab === 'card') {
      const num = document.getElementById('pay-card-number').value;
      const exp = document.getElementById('pay-card-expiry').value;
      const cvv = document.getElementById('pay-card-cvv').value;

      if (!num || !exp || !cvv) {
        showToast('Please fill out card authentication fields', 'error');
        return;
      }
    }

    const rzpKey = import.meta.env.VITE_RAZORPAY_KEY_ID || '';
    const isRealGatewayConfigured = rzpKey && rzpKey !== 'YOUR_RAZORPAY_KEY_ID_HERE';

    if (isRealGatewayConfigured) {
      // Close modal to let Razorpay draw its own clean overlay
      modal.classList.remove('active');

      const options = {
        key: rzpKey,
        amount: Math.round(payAmountVal * 100), // Amount in paise
        currency: 'INR',
        name: building.name,
        description: `Maintenance Dues - Flat ${flat.flatNo}`,
        image: '/favicon.svg',
        handler: async function (response) {
          showToast('Payment processing...', 'info');
          const success = await recordFlatPayment(
            session.buildingCode,
            flat.flatNo,
            payAmountVal,
            `Razorpay (${response.razorpay_payment_id})`
          );

          if (success) {
            showToast(`Settled ₹${payAmountVal.toLocaleString()} successfully!`, 'success');
            renderPanelContent('member-dashboard');
          } else {
            showToast('Failed to sync payment. Contact administrator.', 'error');
          }
        },
        prefill: {
          name: flat.headName,
          email: flat.email || '',
          contact: flat.phone || ''
        },
        notes: {
          building_code: session.buildingCode,
          flat_no: flat.flatNo
        },
        theme: {
          color: '#d4af37' // Luxury gold theme matching Assetra styling
        }
      };

      try {
        const rzp = new window.Razorpay(options);
        rzp.open();
      } catch (err) {
        console.error('Razorpay initialization failed:', err);
        showToast('Failed to initialize Razorpay SDK. Verify Key ID.', 'error');
      }
    } else {
      // Fallback Simulation Mode
      formScreen.classList.add('hidden');
      loaderScreen.classList.remove('hidden');

      setTimeout(async () => {
        const method = activeTab === 'upi' ? 'UPI (Simulated)' : 'Card (Simulated)';
        await recordFlatPayment(session.buildingCode, flat.flatNo, payAmountVal, method);

        loaderScreen.classList.add('hidden');
        successScreen.classList.remove('hidden');
        
        showToast(`Simulated Payment of ₹${payAmountVal.toLocaleString()} Settled!`, 'success');
      }, 2200);
    }
  };

  const btnFinish = document.getElementById('btn-pay-gateway-finish');
  btnFinish.onclick = () => {
    modal.classList.remove('active');
    renderPanelContent('member-dashboard');
  };
}

// ==================== ALERTS: TOAST SYSTEM ====================
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span>${message}</span>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'toastIn 0.25s reverse forwards';
    setTimeout(() => {
      toast.remove();
    }, 250);
  }, 3500);
}

// ==================== SCALABILITY STRESS DEBUG TESTING ====================
export async function runScalabilityStressTest() {
  if (!session.buildingCode) {
    showToast('Stress test requires a registered building session.', 'error');
    return;
  }

  showToast('Injecting 150 stress-test flats into remote database registry...', 'info');

  const names = ['Aarav', 'Vihaan', 'Aditya', 'Siddharth', 'Pranav', 'Ishaan', 'Dev', 'Arjun', 'Kabir', 'Rohan'];
  const surnames = ['Sharma', 'Verma', 'Joshi', 'Patel', 'Mehta', 'Gupta', 'Rao', 'Nair', 'Iyer', 'Sen'];

  const promises = [];
  for (let i = 1; i <= 150; i++) {
    const flatNo = `ST-${i + 100}`;
    const name = `${names[Math.floor(Math.random() * names.length)]} ${surnames[Math.floor(Math.random() * surnames.length)]}`;
    const monthly = 2500 + Math.floor(Math.random() * 6) * 500;
    const dues = Math.random() > 0.5 ? monthly * (Math.floor(Math.random() * 4) + 1) : 0;
    
    promises.push(addFlat(session.buildingCode, {
      flatNo,
      headName: name,
      monthlyCharge: monthly,
      outstandingDues: dues,
      phone: `+91 99000 ${10000 + i}`,
      email: `${name.toLowerCase().replace(' ', '.')}@example.com`
    }));
  }

  await Promise.all(promises);

  showToast('Injected 150 stress-test flats. Table & Leaderboards ready!', 'success');
  location.reload();
}

window.runAssetraStressTest = runScalabilityStressTest;
