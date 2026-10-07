/**
 * Skyline Heights Residential Society Management Dashboard
 * Client-side Controller & Dynamic Data Layer
 */

// Application State
const state = {
  stats: null,
  bills: [],
  residents: [],
  flats: [],
  dbStatus: null,
  activeTab: 'section-overview',
  billStatusFilter: 'ALL',
  billMonthFilter: '2026-10',
  billSearchQuery: '',
  residentTypeFilter: 'ALL',
  residentSearchQuery: ''
};

// Preset SQL Queries for DBMS Console Demo
const PRESET_QUERIES = {
  '1': `-- 1. Relational JOIN: View residents who paid maintenance for October 2026
SELECT 
    f.flat_number,
    w.wing_name,
    CONCAT(r.first_name, ' ', r.last_name) AS resident_name,
    r.resident_type,
    b.amount,
    b.payment_method,
    b.transaction_ref,
    b.payment_date
FROM maintenance_bills b
INNER JOIN flats f ON b.flat_id = f.flat_id
INNER JOIN wings w ON f.wing_id = w.wing_id
INNER JOIN residents r ON b.resident_id = r.resident_id
WHERE b.status = 'PAID'
ORDER BY b.payment_date ASC;`,

  '2': `-- 2. Find Defaulters with Overdue Bills & Direct Contact Numbers
SELECT 
    f.flat_number,
    CONCAT(r.first_name, ' ', r.last_name) AS defaulter_name,
    r.phone,
    r.emergency_contact,
    b.amount AS unpaid_amount,
    b.due_date,
    b.notes
FROM maintenance_bills b
INNER JOIN flats f ON b.flat_id = f.flat_id
INNER JOIN residents r ON b.resident_id = r.resident_id
WHERE b.status = 'OVERDUE';`,

  '3': `-- 3. Aggregation & GROUP BY: Maintenance Collected per Wing
SELECT 
    w.wing_name,
    COUNT(b.bill_id) AS total_bills,
    SUM(CASE WHEN b.status = 'PAID' THEN b.amount ELSE 0 END) AS collected_revenue,
    SUM(CASE WHEN b.status != 'PAID' THEN b.amount ELSE 0 END) AS pending_revenue
FROM maintenance_bills b
INNER JOIN flats f ON b.flat_id = f.flat_id
INNER JOIN wings w ON f.wing_id = w.wing_id
GROUP BY w.wing_id, w.wing_name;`,

  '4': `-- 4. Resident Directory with Flat Area, Floor & Move-In Date
SELECT 
    r.resident_id,
    CONCAT(r.first_name, ' ', r.last_name) AS resident_name,
    f.flat_number,
    f.floor_number,
    f.flat_type,
    f.area_sqft,
    r.resident_type,
    r.move_in_date
FROM residents r
INNER JOIN flats f ON r.flat_id = f.flat_id
ORDER BY f.flat_number;`,

  '5': `-- 5. Payment Method Distribution Analysis
SELECT 
    b.payment_method,
    COUNT(*) AS transactions_count,
    SUM(b.amount) AS total_amount_settled
FROM maintenance_bills b
WHERE b.status = 'PAID'
GROUP BY b.payment_method
ORDER BY transactions_count DESC;`
};

// DOM Content Loaded Initializer
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initSidebarToggle();
  initNavigation();
  initModals();
  initFilters();
  initSqlConsole();
  initExportCsv();
  initCopyButtons();
  
  // Set today's date in pay and resident modals
  const today = new Date().toISOString().split('T')[0];
  const payDateInput = document.getElementById('pay-date');
  if (payDateInput) payDateInput.value = today;
  const resMoveInInput = document.getElementById('res-move-in');
  if (resMoveInInput) resMoveInInput.value = today;

  // Initial Data Fetch
  loadAllData();
});

// Load All Core Data in Parallel
async function loadAllData() {
  await Promise.all([
    fetchDbStatus(),
    fetchStats(),
    fetchBills(),
    fetchResidents(),
    fetchFlats()
  ]);
  populateFlatSelectOptions();
  renderOverdueDefaulters();
  renderRecentPayments();
}

/* ==========================================================
   API FETCH CALLS
   ========================================================== */

// 1. Fetch Database Connection Status
async function fetchDbStatus() {
  try {
    const res = await fetch('/api/status');
    const data = await res.json();
    state.dbStatus = data;

    const dot = document.getElementById('status-dot');
    const label = document.getElementById('status-label');
    const meta = document.getElementById('status-meta');

    if (data.connected) {
      dot.className = 'status-dot connected';
      label.textContent = 'MySQL 8.x Active';
      meta.textContent = `${data.user}@${data.host}/${data.database}`;
    } else {
      dot.className = 'status-dot';
      label.textContent = 'Relational Mock DB';
      meta.textContent = '20 Verified Records (Sync to MySQL)';
    }
  } catch (err) {
    console.error('Failed to fetch DB status', err);
  }
}

// 2. Fetch Stats & Update KPI Metrics
async function fetchStats() {
  try {
    const res = await fetch('/api/stats');
    const stats = await res.json();
    state.stats = stats;

    // Update KPI Card values
    document.getElementById('kpi-total-flats').textContent = stats.totalFlats;
    document.getElementById('kpi-occupancy-rate').textContent = `${stats.occupancyRate}% Occupied`;
    document.getElementById('kpi-total-residents').textContent = stats.totalResidents;
    document.getElementById('kpi-owners-tenants-split').textContent = `${stats.owners} Owners • ${stats.tenants} Tenants`;

    document.getElementById('kpi-total-collected').textContent = `₹${stats.totalCollected.toLocaleString('en-IN')}`;
    document.getElementById('kpi-paid-count').textContent = `${stats.paidCount} Paid`;

    const pendingTotal = stats.totalPending + stats.totalOverdue;
    document.getElementById('kpi-total-pending').textContent = `₹${pendingTotal.toLocaleString('en-IN')}`;
    document.getElementById('kpi-pending-overdue-count').textContent = `${stats.pendingCount} Pending • ${stats.overdueCount} Overdue`;

    // Sidebar badge count
    const pendingBadge = document.getElementById('pending-badge-count');
    if (pendingBadge) pendingBadge.textContent = stats.pendingCount + stats.overdueCount;

    // Progress Bar in Overview
    const totalBilled = stats.totalBilledAmount || 1;
    const paidPct = ((stats.totalCollected / totalBilled) * 100).toFixed(1);
    const pendingPct = ((stats.totalPending / totalBilled) * 100).toFixed(1);
    const overduePct = ((stats.totalOverdue / totalBilled) * 100).toFixed(1);

    document.getElementById('overview-total-billed').textContent = `₹${stats.totalBilledAmount.toLocaleString('en-IN')}`;
    document.getElementById('overview-rate-badge').textContent = `${paidPct}% Collected`;

    document.getElementById('bar-fill-paid').style.width = `${paidPct}%`;
    document.getElementById('bar-fill-pending').style.width = `${pendingPct}%`;
    document.getElementById('bar-fill-overdue').style.width = `${overduePct}%`;

    document.getElementById('legend-paid-val').textContent = `₹${stats.totalCollected.toLocaleString('en-IN')}`;
    document.getElementById('legend-pending-val').textContent = `₹${stats.totalPending.toLocaleString('en-IN')}`;
    document.getElementById('legend-overdue-val').textContent = `₹${stats.totalOverdue.toLocaleString('en-IN')}`;

    // Filter badges in Bills tab
    document.getElementById('badge-all-bills').textContent = stats.totalFlats;
    document.getElementById('badge-paid-bills').textContent = stats.paidCount;
    document.getElementById('badge-pending-bills').textContent = stats.pendingCount;
    document.getElementById('badge-overdue-bills').textContent = stats.overdueCount;
  } catch (err) {
    console.error('Failed to fetch stats', err);
  }
}

// 3. Fetch Maintenance Bills
async function fetchBills() {
  try {
    const params = new URLSearchParams();
    if (state.billStatusFilter !== 'ALL') params.append('status', state.billStatusFilter);
    if (state.billMonthFilter) params.append('month', state.billMonthFilter);
    if (state.billSearchQuery) params.append('search', state.billSearchQuery);

    const res = await fetch(`/api/bills?${params.toString()}`);
    const bills = await res.json();
    state.bills = bills;
    renderBillsTable(bills);
  } catch (err) {
    console.error('Failed to fetch bills', err);
  }
}

// 4. Fetch Residents
async function fetchResidents() {
  try {
    const params = new URLSearchParams();
    if (state.residentTypeFilter !== 'ALL') params.append('type', state.residentTypeFilter);
    if (state.residentSearchQuery) params.append('search', state.residentSearchQuery);

    const res = await fetch(`/api/residents?${params.toString()}`);
    const residents = await res.json();
    state.residents = residents;
    renderResidentsTable(residents);
  } catch (err) {
    console.error('Failed to fetch residents', err);
  }
}

// 5. Fetch Flats
async function fetchFlats() {
  try {
    const res = await fetch('/api/flats');
    const flats = await res.json();
    state.flats = flats;
    renderFlatsLayout(flats);
  } catch (err) {
    console.error('Failed to fetch flats', err);
  }
}

/* ==========================================================
   RENDER FUNCTIONS
   ========================================================== */

// Render Maintenance Bills Table
function renderBillsTable(bills) {
  const tbody = document.getElementById('bills-tbody');
  tbody.innerHTML = '';

  if (!bills || bills.length === 0) {
    tbody.innerHTML = `<tr><td colspan="11" style="text-align: center; padding: 32px; color: var(--text-dim);">No maintenance records found matching the filter criteria.</td></tr>`;
    return;
  }

  bills.forEach(bill => {
    const tr = document.createElement('tr');

    const statusBadge = getStatusBadge(bill.status);
    const typeBadge = bill.resident_type === 'OWNER'
      ? `<span class="badge badge-owner">Owner</span>`
      : `<span class="badge badge-tenant">Tenant</span>`;

    const actionButton = bill.status === 'PAID'
      ? `<span class="text-success" style="font-size: 0.8rem; font-weight: 600;"><i class="fa-solid fa-check"></i> Cleared</span>`
      : `<button class="btn btn-xs btn-primary btn-record-pay" data-id="${bill.bill_id}" data-flat="${bill.flat_number}" data-name="${bill.resident_name}" data-amount="${bill.amount}">
          <i class="fa-solid fa-money-bill-wave"></i> Mark Paid
        </button>`;

    tr.innerHTML = `
      <td><span style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--text-dim);">#B-${bill.bill_id.toString().padStart(3, '0')}</span></td>
      <td><strong>${bill.flat_number}</strong> <span style="font-size: 0.75rem; color: var(--text-dim);">(${bill.wing_name})</span></td>
      <td><strong>${bill.resident_name}</strong></td>
      <td>${typeBadge}</td>
      <td><span style="font-family: var(--font-mono); font-size: 0.8rem;">${bill.billing_month}</span></td>
      <td><strong>₹${parseFloat(bill.amount).toLocaleString('en-IN')}</strong></td>
      <td><span style="font-size: 0.8rem; color: var(--text-muted);">${formatDate(bill.due_date)}</span></td>
      <td>${statusBadge}</td>
      <td>${bill.payment_method ? `<span class="payment-method-pill"><i class="fa-solid fa-credit-card"></i> ${bill.payment_method}</span>` : '<span style="color: var(--text-dim);">-</span>'}</td>
      <td><span style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-dim);">${bill.transaction_ref || '-'}</span></td>
      <td>${actionButton}</td>
    `;
    tbody.appendChild(tr);
  });

  // Attach click events for Mark Paid buttons
  tbody.querySelectorAll('.btn-record-pay').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const { id, flat, name, amount } = e.currentTarget.dataset;
      openPayBillModal(id, flat, name, amount);
    });
  });
}

// Render Residents Directory Table
function renderResidentsTable(residents) {
  const tbody = document.getElementById('residents-tbody');
  tbody.innerHTML = '';

  if (!residents || residents.length === 0) {
    tbody.innerHTML = `<tr><td colspan="11" style="text-align: center; padding: 32px; color: var(--text-dim);">No residents match your search.</td></tr>`;
    return;
  }

  residents.forEach(res => {
    const tr = document.createElement('tr');
    const typeBadge = res.resident_type === 'OWNER'
      ? `<span class="badge badge-owner"><i class="fa-solid fa-house-chimney"></i> Owner</span>`
      : `<span class="badge badge-tenant"><i class="fa-solid fa-key"></i> Tenant</span>`;

    // Find bill status for this flat
    const bill = state.bills.find(b => b.flat_id === res.flat_id);
    const billStatus = bill ? getStatusBadge(bill.status) : '<span class="badge badge-paid">Up to date</span>';

    const actionBtn = (bill && bill.status !== 'PAID')
      ? `<button class="btn btn-xs btn-primary btn-res-pay" data-id="${bill.bill_id}" data-flat="${res.flat_number}" data-name="${res.full_name}" data-amount="${bill.amount}">
           <i class="fa-solid fa-money-bill-wave"></i> Mark Paid
         </button>`
      : `<span class="text-success" style="font-size: 0.8rem; font-weight: 700;"><i class="fa-solid fa-check"></i> Cleared</span>`;

    tr.innerHTML = `
      <td><span style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--text-dim);">#RES-${res.resident_id.toString().padStart(3, '0')}</span></td>
      <td><strong>${res.full_name}</strong></td>
      <td><strong>${res.flat_number}</strong> <span style="font-size: 0.75rem; color: var(--text-dim);">(${res.wing_name})</span></td>
      <td><span style="font-family: var(--font-mono); font-size: 0.75rem; background: var(--bg-card-subtle); padding: 3px 7px; border-radius: 4px; border: 1px solid var(--border-color);">${res.flat_type} (${res.area_sqft} sqft)</span></td>
      <td>${typeBadge}</td>
      <td><a href="tel:${res.phone}" style="color: var(--text-main); text-decoration: none; font-weight: 600;"><i class="fa-solid fa-phone" style="font-size: 0.75rem; color: var(--color-primary); margin-right: 4px;"></i> ${res.phone}</a></td>
      <td><span style="font-size: 0.8rem; color: var(--text-muted);">${res.email}</span></td>
      <td><span style="font-size: 0.8rem; color: var(--text-muted);">${formatDate(res.move_in_date)}</span></td>
      <td><span style="font-size: 0.8rem; color: var(--text-dim);">${res.emergency_contact || 'N/A'}</span></td>
      <td>${billStatus}</td>
      <td>${actionBtn}</td>
    `;
    tbody.appendChild(tr);
  });

  // Attach click listener for resident pay buttons
  tbody.querySelectorAll('.btn-res-pay').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const { id, flat, name, amount } = e.currentTarget.dataset;
      openPayBillModal(id, flat, name, amount);
    });
  });
}

// Render Recent Payments on Overview Page
function renderRecentPayments() {
  const tbody = document.getElementById('recent-payments-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  const paidBills = state.bills.filter(b => b.status === 'PAID').slice(0, 6);

  if (paidBills.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 24px; color: var(--text-dim);">No payments recorded yet.</td></tr>`;
    return;
  }

  paidBills.forEach(b => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${b.flat_number}</strong> <span style="color: var(--text-dim); font-size: 0.75rem;">(${b.wing_name})</span></td>
      <td>${b.resident_name}</td>
      <td>${b.resident_type === 'OWNER' ? '<span class="badge badge-owner">Owner</span>' : '<span class="badge badge-tenant">Tenant</span>'}</td>
      <td><strong style="color: var(--color-emerald);">₹${parseFloat(b.amount).toLocaleString('en-IN')}</strong></td>
      <td><span style="font-size: 0.8rem; color: var(--text-muted);">${formatDate(b.payment_date || b.due_date)}</span></td>
      <td><span class="payment-method-pill">${b.payment_method || 'UPI'}</span></td>
      <td><span style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-dim);">${b.transaction_ref || 'VERIFIED'}</span></td>
      <td><span class="badge badge-paid"><i class="fa-solid fa-check"></i> Paid</span></td>
    `;
    tbody.appendChild(tr);
  });
}

// Render Overdue Defaulters Widget
function renderOverdueDefaulters() {
  const container = document.getElementById('defaulters-container');
  if (!container) return;
  container.innerHTML = '';

  const overdueBills = state.bills.filter(b => b.status === 'OVERDUE');

  if (overdueBills.length === 0) {
    container.innerHTML = `
      <div style="padding: 24px; text-align: center; color: var(--color-emerald);">
        <i class="fa-solid fa-circle-check" style="font-size: 2rem; margin-bottom: 8px;"></i>
        <p style="font-size: 0.85rem; font-weight: 600;">No overdue bills! All residents have cleared dues or within grace period.</p>
      </div>
    `;
    return;
  }

  overdueBills.forEach(b => {
    const div = document.createElement('div');
    div.className = 'defaulter-item';
    div.innerHTML = `
      <div class="defaulter-info">
        <h4><i class="fa-solid fa-house-circle-exclamation text-rose"></i> Flat ${b.flat_number} (${b.wing_name})</h4>
        <div class="sub">${b.resident_name} • ${b.phone}</div>
      </div>
      <div class="defaulter-right">
        <div class="defaulter-amount">
          <div class="amount">₹${parseFloat(b.amount).toLocaleString('en-IN')}</div>
          <div class="days">Due: ${formatDate(b.due_date)}</div>
        </div>
        <button class="btn btn-xs btn-primary btn-defaulter-pay" data-id="${b.bill_id}" data-flat="${b.flat_number}" data-name="${b.resident_name}" data-amount="${b.amount}">
          <i class="fa-solid fa-money-bill-wave"></i> Mark Paid
        </button>
      </div>
    `;
    container.appendChild(div);
  });

  // Attach click listener for defaulters mark paid buttons
  container.querySelectorAll('.btn-defaulter-pay').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const { id, flat, name, amount } = e.currentTarget.dataset;
      openPayBillModal(id, flat, name, amount);
    });
  });
}

// Render Flats and Towers Layout
function renderFlatsLayout(flats) {
  const container = document.getElementById('wings-container');
  if (!container) return;
  container.innerHTML = '';

  const wings = [
    { id: 1, name: 'Wing A', floors: 5 },
    { id: 2, name: 'Wing B', floors: 5 },
    { id: 3, name: 'Wing C', floors: 5 }
  ];

  wings.forEach(wing => {
    const wingFlats = flats.filter(f => f.wing_id === wing.id);

    const wingBlock = document.createElement('div');
    wingBlock.className = 'wing-block';

    let flatsHtml = '';
    wingFlats.forEach(flat => {
      // Find bill status
      const bill = state.bills.find(b => b.flat_id === flat.flat_id);
      const billStatus = bill ? bill.status : 'PAID';
      
      let statusColorClass = 'text-paid';
      if (billStatus === 'PENDING') statusColorClass = 'text-pending';
      if (billStatus === 'OVERDUE') statusColorClass = 'text-overdue';

      flatsHtml += `
        <div class="flat-card-tile" data-flat="${flat.flat_number}" data-id="${flat.flat_id}">
          <div class="flat-tile-head">
            <span class="flat-number-title">${flat.flat_number}</span>
            <span class="${statusColorClass}"><i class="fa-solid fa-circle" style="font-size: 8px;"></i> ${billStatus}</span>
          </div>
          <div class="flat-tile-type">${flat.flat_type} • ${flat.area_sqft} sqft</div>
          <div class="flat-tile-resident"><i class="fa-regular fa-user" style="font-size: 11px;"></i> ${flat.resident_name || 'Vacant'}</div>
        </div>
      `;
    });

    wingBlock.innerHTML = `
      <div class="wing-header">
        <div>
          <h3>${wing.name}</h3>
          <span style="font-size: 0.75rem; color: var(--text-dim);">${wingFlats.length} Occupied Units • Floor 1 to ${wing.floors}</span>
        </div>
        <span class="badge badge-pulse">100% Occupancy</span>
      </div>
      <div class="flats-mini-grid">
        ${flatsHtml}
      </div>
    `;

    container.appendChild(wingBlock);
  });

  // Attach click listener for flat tiles
  container.querySelectorAll('.flat-card-tile').forEach(tile => {
    tile.addEventListener('click', () => {
      const flatNum = tile.dataset.flat;
      const flatObj = state.flats.find(f => f.flat_number === flatNum);
      if (flatObj) {
        const bill = state.bills.find(b => b.flat_id === flatObj.flat_id);
        if (bill && bill.status !== 'PAID') {
          openPayBillModal(bill.bill_id, bill.flat_number, bill.resident_name, bill.amount);
        } else {
          showToast(`Flat ${flatNum} (${flatObj.resident_name}) has already paid maintenance!`, 'info');
        }
      }
    });
  });
}

// Populate Flat Select in Add Resident Modal
function populateFlatSelectOptions() {
  const select = document.getElementById('res-flat-id');
  if (!select) return;
  select.innerHTML = '<option value="">Select Flat...</option>';

  state.flats.forEach(flat => {
    const opt = document.createElement('option');
    opt.value = flat.flat_id;
    opt.textContent = `${flat.flat_number} (${flat.wing_name} - ${flat.flat_type})`;
    select.appendChild(opt);
  });
}

/* ==========================================================
   NAVIGATION & TAB HANDLING
   ========================================================== */
function initNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  const sections = document.querySelectorAll('.content-section');
  const pageTitle = document.getElementById('page-title');

  const titles = {
    'section-overview': 'Society Dashboard Overview',
    'section-bills': 'Maintenance Billing Management',
    'section-residents': 'Society Residents Directory',
    'section-flats': 'Flats & Residential Towers',
    'section-dbms': 'DBMS Architecture & SQL Console'
  };

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetId = item.dataset.target;
      state.activeTab = targetId;

      navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');

      sections.forEach(s => s.classList.remove('active'));
      const activeSection = document.getElementById(targetId);
      if (activeSection) activeSection.classList.add('active');

      if (pageTitle && titles[targetId]) {
        pageTitle.textContent = titles[targetId];
      }
    });
  });

  // View All Overdue quick button in overview
  const btnViewOverdue = document.getElementById('btn-view-all-overdue');
  if (btnViewOverdue) {
    btnViewOverdue.addEventListener('click', () => {
      const billsTab = document.getElementById('tab-bills');
      if (billsTab) billsTab.click();

      // Trigger overdue filter
      const overdueFilterBtn = document.querySelector('.filter-tab[data-status="OVERDUE"]');
      if (overdueFilterBtn) overdueFilterBtn.click();
    });
  }

  // View All 20 Bills link
  const btnViewBills = document.getElementById('btn-view-bills-tab');
  if (btnViewBills) {
    btnViewBills.addEventListener('click', () => {
      const billsTab = document.getElementById('tab-bills');
      if (billsTab) billsTab.click();
    });
  }
}

/* ==========================================================
   FILTERS & SEARCH
   ========================================================== */
function initFilters() {
  // Maintenance Bills status filter tabs
  const billFilterTabs = document.querySelectorAll('#bill-status-filters .filter-tab');
  billFilterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      billFilterTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      state.billStatusFilter = tab.dataset.status;
      fetchBills();
    });
  });

  // Maintenance Bills search
  const billSearchInput = document.getElementById('bill-search-input');
  if (billSearchInput) {
    let debounceTimer;
    billSearchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        state.billSearchQuery = e.target.value.trim();
        fetchBills();
      }, 250);
    });
  }

  // Resident type filter tabs
  const resFilterTabs = document.querySelectorAll('#resident-type-filters .filter-tab');
  resFilterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      resFilterTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      state.residentTypeFilter = tab.dataset.type;
      fetchResidents();
    });
  });

  // Resident search
  const resSearchInput = document.getElementById('resident-search-input');
  if (resSearchInput) {
    let debounceTimer;
    resSearchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        state.residentSearchQuery = e.target.value.trim();
        fetchResidents();
      }, 250);
    });
  }
}

/* ==========================================================
   MODAL DIALOGS
   ========================================================== */
function initModals() {
  // Close buttons
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const modalId = e.currentTarget.dataset.close;
      closeModal(modalId);
    });
  });

  // Close on backdrop click
  document.querySelectorAll('.modal-backdrop').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('open');
      }
    });
  });

  // Open DB Settings modal
  const btnOpenDb = document.getElementById('btn-open-db-modal');
  if (btnOpenDb) {
    btnOpenDb.addEventListener('click', () => {
      openModal('modal-db-settings');
    });
  }

  // Open Add Resident modal buttons
  const btnAddRes = document.getElementById('btn-add-resident-trigger');
  const btnAddRes2 = document.getElementById('btn-add-resident-open');
  if (btnAddRes) btnAddRes.addEventListener('click', () => openModal('modal-add-resident'));
  if (btnAddRes2) btnAddRes2.addEventListener('click', () => openModal('modal-add-resident'));

  // Form: Pay Bill
  const formPayBill = document.getElementById('form-pay-bill');
  if (formPayBill) {
    formPayBill.addEventListener('submit', async (e) => {
      e.preventDefault();
      const billId = document.getElementById('pay-bill-id').value;
      const payment_method = document.getElementById('pay-method').value;
      const transaction_ref = document.getElementById('pay-txn-ref').value;
      const payment_date = document.getElementById('pay-date').value;
      const notes = document.getElementById('pay-notes').value;

      try {
        const res = await fetch(`/api/bills/${billId}/pay`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ payment_method, transaction_ref, payment_date, notes })
        });
        const data = await res.json();
        if (data.success) {
          showToast('Payment recorded successfully!', 'success');
          closeModal('modal-pay-bill');
          // Reload data
          await Promise.all([fetchStats(), fetchBills(), fetchFlats()]);
          renderOverdueDefaulters();
          renderRecentPayments();
        } else {
          showToast(data.error || 'Failed to record payment', 'error');
        }
      } catch (err) {
        showToast('Network error while recording payment', 'error');
      }
    });
  }

  // Form: Add Resident
  const formAddRes = document.getElementById('form-add-resident');
  if (formAddRes) {
    formAddRes.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        first_name: document.getElementById('res-first-name').value.trim(),
        last_name: document.getElementById('res-last-name').value.trim(),
        flat_id: document.getElementById('res-flat-id').value,
        resident_type: document.getElementById('res-type').value,
        phone: document.getElementById('res-phone').value.trim(),
        email: document.getElementById('res-email').value.trim(),
        move_in_date: document.getElementById('res-move-in').value,
        emergency_contact: document.getElementById('res-emergency').value.trim()
      };

      try {
        const res = await fetch('/api/residents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
          showToast(`Resident ${payload.first_name} ${payload.last_name} registered!`, 'success');
          formAddRes.reset();
          closeModal('modal-add-resident');
          await Promise.all([fetchStats(), fetchResidents(), fetchFlats()]);
        } else {
          showToast(data.error || 'Failed to add resident', 'error');
        }
      } catch (err) {
        showToast('Error registering resident', 'error');
      }
    });
  }

  // Form: DB Connection & Sync Settings
  const formDbSettings = document.getElementById('form-db-settings');
  if (formDbSettings) {
    formDbSettings.addEventListener('submit', async (e) => {
      e.preventDefault();
      const feedback = document.getElementById('db-sync-feedback');
      const submitBtn = document.getElementById('btn-submit-db-sync');

      const host = document.getElementById('db-host').value.trim();
      const port = document.getElementById('db-port').value.trim();
      const user = document.getElementById('db-user').value.trim();
      const password = document.getElementById('db-pass').value;
      const database = document.getElementById('db-name').value.trim();
      const initDatabase = document.getElementById('db-init-toggle').checked;

      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Connecting...';
      feedback.style.display = 'none';

      try {
        const res = await fetch('/api/db/connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ host, port, user, password, database, initDatabase })
        });
        const data = await res.json();

        if (data.success) {
          feedback.className = 'sync-feedback success';
          feedback.innerHTML = `<i class="fa-solid fa-check"></i> ${data.message || 'Connected to MySQL!'}`;
          feedback.style.display = 'block';
          showToast('MySQL database connected & verified!', 'success');
          await fetchDbStatus();
          await fetchStats();
          await fetchBills();
          await fetchResidents();
        } else {
          feedback.className = 'sync-feedback error';
          feedback.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Connection Failed: ${data.error}`;
          feedback.style.display = 'block';
        }
      } catch (err) {
        feedback.className = 'sync-feedback error';
        feedback.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Server Error: ${err.message}`;
        feedback.style.display = 'block';
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fa-solid fa-bolt"></i> Test & Connect MySQL';
      }
    });
  }
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('open');
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('open');
}

function openPayBillModal(billId, flatNumber, residentName, amount) {
  document.getElementById('pay-bill-id').value = billId;
  const summaryBanner = document.getElementById('pay-bill-summary');
  summaryBanner.innerHTML = `
    <div style="font-size: 0.95rem; font-weight: 700; color: #fff; margin-bottom: 4px;">
      Flat ${flatNumber} • ${residentName}
    </div>
    <div style="font-size: 0.85rem; color: var(--text-muted);">
      Maintenance Bill #B-${billId.toString().padStart(3, '0')} • Amount Due: <strong style="color: var(--color-emerald);">₹${parseFloat(amount).toLocaleString('en-IN')}</strong>
    </div>
  `;
  document.getElementById('pay-txn-ref').value = `UPI-${Date.now().toString().slice(-8)}`;
  openModal('modal-pay-bill');
}

/* ==========================================================
   DBMS ARCHITECTURE & INTERACTIVE SQL CONSOLE
   ========================================================== */
function initSqlConsole() {
  const presetSelect = document.getElementById('preset-query-select');
  const sqlInput = document.getElementById('sql-query-input');
  const btnRun = document.getElementById('btn-execute-sql');

  // Set default query
  if (sqlInput) {
    sqlInput.value = PRESET_QUERIES['1'];
  }

  // Handle Preset Queries
  if (presetSelect) {
    presetSelect.addEventListener('change', (e) => {
      const selected = e.target.value;
      if (selected && PRESET_QUERIES[selected]) {
        sqlInput.value = PRESET_QUERIES[selected];
      }
    });
  }

  // Run Query
  if (btnRun) {
    btnRun.addEventListener('click', async () => {
      const sql = sqlInput.value.trim();
      if (!sql) {
        showToast('Please type a SQL query to execute', 'error');
        return;
      }

      btnRun.disabled = true;
      btnRun.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Executing...';

      try {
        const res = await fetch('/api/db/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sql })
        });
        const data = await res.json();
        renderSqlOutput(data);
      } catch (err) {
        showToast('Error executing query', 'error');
      } finally {
        btnRun.disabled = false;
        btnRun.innerHTML = '<i class="fa-solid fa-play"></i> Run Query';
      }
    });
  }
}

function renderSqlOutput(data) {
  const container = document.getElementById('sql-output-container');
  const statusSpan = document.getElementById('sql-result-status');
  const timeSpan = document.getElementById('sql-execution-time');
  const thead = document.getElementById('sql-results-thead');
  const tbody = document.getElementById('sql-results-tbody');

  container.style.display = 'block';
  thead.innerHTML = '';
  tbody.innerHTML = '';

  if (!data.success) {
    statusSpan.innerHTML = `<span style="color: var(--color-rose);"><i class="fa-solid fa-triangle-exclamation"></i> SQL Error: ${data.error}</span>`;
    timeSpan.textContent = `Source: ${data.source}`;
    return;
  }

  statusSpan.innerHTML = `<span style="color: var(--color-emerald);"><i class="fa-solid fa-check"></i> ${data.rowCount} rows returned</span>`;
  timeSpan.textContent = `Engine: ${data.source} • Execution: ${data.executionTimeMs} ms`;

  // Render headers
  if (data.columns && data.columns.length > 0) {
    const headerRow = document.createElement('tr');
    data.columns.forEach(col => {
      const th = document.createElement('th');
      th.textContent = col;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
  }

  // Render rows
  if (data.rows && data.rows.length > 0) {
    data.rows.forEach(row => {
      const tr = document.createElement('tr');
      data.columns.forEach(col => {
        const td = document.createElement('td');
        const val = row[col];
        td.textContent = val !== null && val !== undefined ? val : 'NULL';
        if (col === 'status') {
          td.innerHTML = getStatusBadge(val);
        }
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
  } else {
    tbody.innerHTML = `<tr><td colspan="${data.columns.length || 1}" style="text-align: center; color: var(--text-dim); padding: 18px;">Query returned 0 rows.</td></tr>`;
  }
}

/* ==========================================================
   EXPORT TO CSV
   ========================================================== */
function initExportCsv() {
  const btnExport = document.getElementById('btn-export-csv');
  if (!btnExport) return;

  btnExport.addEventListener('click', () => {
    if (!state.bills || state.bills.length === 0) {
      showToast('No records available to export', 'error');
      return;
    }

    const headers = ['Bill ID', 'Flat Number', 'Wing', 'Resident Name', 'Type', 'Month', 'Amount', 'Due Date', 'Status', 'Payment Method', 'Transaction Ref'];
    const rows = state.bills.map(b => [
      `B-${b.bill_id}`,
      b.flat_number,
      b.wing_name,
      `"${b.resident_name}"`,
      b.resident_type,
      b.billing_month,
      b.amount,
      b.due_date,
      b.status,
      b.payment_method || 'N/A',
      b.transaction_ref || 'N/A'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Society_Maintenance_Audit_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Maintenance Audit exported as CSV!', 'success');
  });
}

/* ==========================================================
   HELPER UTILITIES
   ========================================================== */
function getStatusBadge(status) {
  switch (status) {
    case 'PAID':
      return `<span class="badge badge-paid"><i class="fa-solid fa-circle-check"></i> Paid</span>`;
    case 'PENDING':
      return `<span class="badge badge-pending"><i class="fa-solid fa-clock"></i> Pending</span>`;
    case 'OVERDUE':
      return `<span class="badge badge-overdue"><i class="fa-solid fa-triangle-exclamation"></i> Overdue</span>`;
    default:
      return `<span class="badge">${status}</span>`;
  }
}

function formatDate(dateVal) {
  if (!dateVal) return 'N/A';
  try {
    const d = new Date(dateVal);
    if (!isNaN(d.getTime())) {
      const day = d.getDate();
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${day} ${months[d.getMonth()]} ${d.getFullYear()}`;
    }
  } catch (e) {}
  return String(dateVal);
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  let icon = 'fa-circle-info';
  if (type === 'success') icon = 'fa-circle-check';
  if (type === 'error') icon = 'fa-triangle-exclamation';

  toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

/* ==========================================================
   THEME SWITCHER & CLIPBOARD TOOLS
   ========================================================== */
function initTheme() {
  const toggleBtn = document.getElementById('theme-toggle');
  const themeIcon = document.getElementById('theme-icon');
  const themeText = document.getElementById('theme-text');

  // Check saved theme or default to Light theme
  const savedTheme = localStorage.getItem('society_theme') || 'light';
  applyTheme(savedTheme);

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      applyTheme(newTheme);
      localStorage.setItem('society_theme', newTheme);
      showToast(`Switched to ${newTheme === 'light' ? 'Light' : 'Dark'} Mode`, 'info');
    });
  }

  function applyTheme(theme) {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      if (themeIcon) themeIcon.className = 'fa-solid fa-sun';
      if (themeText) themeText.textContent = 'Light Mode';
    } else {
      document.documentElement.removeAttribute('data-theme');
      if (themeIcon) themeIcon.className = 'fa-solid fa-moon';
      if (themeText) themeText.textContent = 'Dark Mode';
    }
  }
}

function initSidebarToggle() {
  const sidebar = document.getElementById('app-sidebar');
  const toggleBtn = document.getElementById('btn-toggle-sidebar');
  const toggleIcon = document.getElementById('sidebar-toggle-icon');

  if (!sidebar || !toggleBtn) return;

  // Restore saved state
  const isCollapsed = localStorage.getItem('society_sidebar_collapsed') === 'true';
  if (isCollapsed) {
    sidebar.classList.add('collapsed');
    if (toggleIcon) toggleIcon.className = 'fa-solid fa-chevron-right';
    toggleBtn.title = 'Expand Sidebar';
  }

  toggleBtn.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    const collapsedNow = sidebar.classList.contains('collapsed');
    localStorage.setItem('society_sidebar_collapsed', collapsedNow ? 'true' : 'false');
    if (toggleIcon) {
      toggleIcon.className = collapsedNow ? 'fa-solid fa-chevron-right' : 'fa-solid fa-chevron-left';
    }
    toggleBtn.title = collapsedNow ? 'Expand Sidebar' : 'Collapse Sidebar';
  });
}

function initCopyButtons() {
  document.querySelectorAll('.btn-copy-code').forEach(btn => {
    btn.addEventListener('click', () => {
      const text = btn.dataset.copy;
      if (text) {
        navigator.clipboard.writeText(text).then(() => {
          showToast('Copied SQL command to clipboard!', 'success');
        }).catch(() => {
          showToast('Failed to copy', 'error');
        });
      }
    });
  });

  const guideModalBtn = document.getElementById('btn-open-db-modal-guide');
  if (guideModalBtn) {
    guideModalBtn.addEventListener('click', () => {
      openModal('modal-db-settings');
    });
  }
}

