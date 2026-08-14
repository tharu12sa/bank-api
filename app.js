/* ================================================================
   FreeProjectAPI Dashboard – app.js  (corrected endpoints)
   Base: https://freeapi.gerocerymaster.in/api/
================================================================ */
const BASE = 'https://api.freeprojectapi.com/api/';

const state = { currentApp:'home', onboardingStep:0, surveyPage:0, bookingTarget:null };

/* ── API helper ─────────────────────────────────────────────── */
async function api(path, method='GET', body=null) {
  const opts = { method, headers:{'Content-Type':'application/json','Accept':'application/json'} };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(BASE + path, opts);
  const data = await res.json().catch(()=>({}));
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data;
}

const spinner  = ()=>`<div class="d-flex justify-content-center py-5"><div class="spinner-border" style="color:var(--accent)"></div></div>`;
const alertBox = (msg,type='success')=>`<div class="alert alert-${type} d-flex align-items-center gap-2 mt-3"><i class="bi bi-${type==='success'?'check-circle':'exclamation-triangle'}"></i>${msg}</div>`;

// Premium Paginated & Searchable Table Utility
function initPremiumTable(containerId, data, columns, options = {}) {
  const container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
  if (!container) return;

  const pageSize = options.pageSize || 5;
  const searchPlaceholder = options.searchPlaceholder || 'Search records...';
  const emptyMessage = options.emptyMessage || 'No matching records found.';
  
  let currentPage = 1;
  let searchQuery = '';

  // Draw container layout
  container.className = "d-flex flex-column gap-3";
  container.innerHTML = `
    <div class="d-flex justify-content-between align-items-center gap-3 flex-wrap">
      <div class="position-relative flex-grow-1" style="max-width: 320px;">
        <span class="position-absolute top-50 translate-middle-y start-0 ps-3 text-muted">
          <i class="bi bi-search"></i>
        </span>
        <input type="text" class="form-control form-control-sm ps-5 border-secondary-subtle" 
               placeholder="${searchPlaceholder}" id="${container.id || 'tbl'}-search">
      </div>
      <div id="${container.id || 'tbl'}-actions" class="d-flex gap-2 align-items-center"></div>
    </div>
    
    <div class="card border border-secondary-subtle shadow-sm overflow-hidden rounded-3">
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-light">
            <tr>
              ${columns.map(col => `<th class="text-secondary small fw-semibold uppercase py-3" style="${col.style || ''}">${col.label}</th>`).join('')}
            </tr>
          </thead>
          <tbody id="${container.id || 'tbl'}-tbody">
            <tr><td colspan="${columns.length}" class="text-center py-4">${spinner()}</td></tr>
          </tbody>
        </table>
      </div>
      <div id="${container.id || 'tbl'}-empty" class="d-none text-center py-5">
        <div class="text-secondary mb-3"><i class="bi bi-folder-x fs-1"></i></div>
        <h6 class="text-secondary fw-semibold">No Records Found</h6>
        <p class="text-muted small mb-0">${emptyMessage}</p>
      </div>
    </div>
    
    <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mt-1">
      <div class="text-muted small" id="${container.id || 'tbl'}-info"></div>
      <nav aria-label="Page navigation">
        <ul class="pagination pagination-sm mb-0 justify-content-end" id="${container.id || 'tbl'}-pagination"></ul>
      </nav>
    </div>
  `;

  if (options.actionsHTML) {
    const act = document.getElementById(`${container.id || 'tbl'}-actions`);
    if (act) act.innerHTML = options.actionsHTML;
  }

  const searchInput = document.getElementById(`${container.id || 'tbl'}-search`);
  const tbody = document.getElementById(`${container.id || 'tbl'}-tbody`);
  const emptyState = document.getElementById(`${container.id || 'tbl'}-empty`);
  const infoEl = document.getElementById(`${container.id || 'tbl'}-info`);
  const paginationUl = document.getElementById(`${container.id || 'tbl'}-pagination`);

  function render() {
    // Filter
    const filtered = data.filter(row => {
      if (!searchQuery) return true;
      return columns.some(col => {
        const val = col.searchVal ? col.searchVal(row) : (row[col.key] !== undefined ? row[col.key] : '');
        return String(val).toLowerCase().includes(searchQuery.toLowerCase());
      });
    });

    const totalRows = filtered.length;
    const totalPages = Math.ceil(totalRows / pageSize) || 1;
    if (currentPage > totalPages) currentPage = totalPages;

    const startIdx = (currentPage - 1) * pageSize;
    const endIdx = Math.min(startIdx + pageSize, totalRows);
    const pageData = filtered.slice(startIdx, endIdx);

    if (totalRows === 0) {
      tbody.innerHTML = '';
      emptyState.classList.remove('d-none');
      infoEl.textContent = 'Showing 0 to 0 of 0 entries';
      paginationUl.innerHTML = '';
      return;
    }

    emptyState.classList.add('d-none');
    tbody.innerHTML = pageData.map((row, index) => {
      const rowNum = startIdx + index + 1;
      return `<tr>
        ${columns.map(col => `<td>${col.render ? col.render(row, rowNum) : (row[col.key] !== undefined ? row[col.key] : '—')}</td>`).join('')}
      </tr>`;
    }).join('');

    infoEl.textContent = `Showing ${startIdx + 1} to ${endIdx} of ${totalRows} entries`;

    // Render Premium Pagination
    let pagHTML = `
      <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
        <button class="page-link shadow-none border-secondary-subtle" data-page="${currentPage - 1}">
          <i class="bi bi-chevron-left"></i>
        </button>
      </li>
    `;

    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    if (startPage > 1) {
      pagHTML += `
        <li class="page-item"><button class="page-link shadow-none border-secondary-subtle" data-page="1">1</button></li>
        ${startPage > 2 ? `<li class="page-item disabled"><span class="page-link border-secondary-subtle">...</span></li>` : ''}
      `;
    }

    for (let p = startPage; p <= endPage; p++) {
      pagHTML += `
        <li class="page-item ${currentPage === p ? 'active' : ''}">
          <button class="page-link shadow-none border-secondary-subtle" data-page="${p}">${p}</button>
        </li>
      `;
    }

    if (endPage < totalPages) {
      pagHTML += `
        ${endPage < totalPages - 1 ? `<li class="page-item disabled"><span class="page-link border-secondary-subtle">...</span></li>` : ''}
        <li class="page-item"><button class="page-link shadow-none border-secondary-subtle" data-page="${totalPages}">${totalPages}</button></li>
      `;
    }

    pagHTML += `
      <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
        <button class="page-link shadow-none border-secondary-subtle" data-page="${currentPage + 1}">
          <i class="bi bi-chevron-right"></i>
        </button>
      </li>
    `;

    paginationUl.innerHTML = pagHTML;

    // Attach click events
    paginationUl.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        const p = parseInt(btn.dataset.page);
        if (p >= 1 && p <= totalPages) {
          currentPage = p;
          render();
        }
      });
    });
  }

  // Search input change
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    currentPage = 1;
    render();
  });

  // Run first render
  render();
}

// Reusable premium form submission handler with inline button spinner / loading text
function setupFormSubmit(formId, submitBtnId, apiCallFn, successCallback, msgId) {
  const form = document.getElementById(formId);
  if (!form) return;
  const btn = document.getElementById(submitBtnId) || form.querySelector('button[type="submit"]');
  const msgEl = msgId ? document.getElementById(msgId) : null;
  if (!btn) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Saving...`;
    
    if (msgEl) {
      msgEl.innerHTML = '';
      msgEl.classList.add('d-none');
    }

    try {
      await apiCallFn();
      btn.innerHTML = `<i class="bi bi-check-circle me-1"></i>Saved!`;
      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.disabled = false;
      }, 1500);
      form.reset();
      if (successCallback) successCallback();
    } catch (err) {
      btn.innerHTML = originalText;
      btn.disabled = false;
      if (msgEl) {
        msgEl.innerHTML = alertBox(err.message, 'danger');
        msgEl.classList.remove('d-none');
      } else {
        alert('Error: ' + err.message);
      }
    }
  });
}

// Premium Pure Vanilla JS Table Wrapper (Search, Pagination, Empty State)
function makeTablePremium(tbodyId, data, renderRowFn, options = {}) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;

  const table = tbody.closest('table');
  if (!table) return;

  const pageSize = options.pageSize || 5;
  const card = table.closest('.card');
  let searchInput = null;

  if (card) {
    searchInput = card.querySelector('input[type="text"]') || card.querySelector('input[placeholder*="Search"]');
  }

  if (!searchInput) {
    let searchWrapper = card ? card.querySelector('.premium-search-wrapper') : null;
    if (!searchWrapper) {
      searchWrapper = document.createElement('div');
      searchWrapper.className = 'premium-search-wrapper px-3 py-2 border-bottom border-secondary-subtle d-flex align-items-center gap-2';
      searchWrapper.innerHTML = `
        <div class="position-relative flex-grow-1" style="max-width: 320px;">
          <span class="position-absolute top-50 translate-middle-y start-0 ps-3 text-muted" style="font-size: .85rem;">
            <i class="bi bi-search"></i>
          </span>
          <input type="text" class="form-control form-control-sm ps-5 border-secondary-subtle" 
                 placeholder="Search records...">
        </div>
      `;
      const target = table.parentElement.classList.contains('table-responsive') ? table.parentElement : table;
      target.parentNode.insertBefore(searchWrapper, target);
    }
    searchInput = searchWrapper.querySelector('input');
  }

  let pagWrapper = card ? card.querySelector('.premium-pag-wrapper') : null;
  if (!pagWrapper) {
    pagWrapper = document.createElement('div');
    pagWrapper.className = 'premium-pag-wrapper px-3 py-2 border-top border-secondary-subtle d-flex justify-content-between align-items-center flex-wrap gap-2';
    const target = table.parentElement.classList.contains('table-responsive') ? table.parentElement : table;
    target.parentNode.insertBefore(pagWrapper, target.nextSibling);
  }

  let currentPage = 1;
  let searchQuery = '';

  function render() {
    const filtered = data.filter((item, idx) => {
      if (!searchQuery) return true;
      const searchStr = Object.values(item).map(v => v === null || v === undefined ? '' : String(v)).join(' ').toLowerCase();
      return searchStr.includes(searchQuery.toLowerCase());
    });

    const totalRows = filtered.length;
    const totalPages = Math.ceil(totalRows / pageSize) || 1;
    if (currentPage > totalPages) currentPage = totalPages;

    const startIdx = (currentPage - 1) * pageSize;
    const endIdx = Math.min(startIdx + pageSize, totalRows);
    const pageData = filtered.slice(startIdx, endIdx);

    const columnsCount = table.querySelectorAll('thead th').length || 6;

    if (totalRows === 0) {
      tbody.innerHTML = `<tr><td colspan="${columnsCount}" class="text-center py-4 text-muted">
        <div class="mb-2 text-secondary"><i class="bi bi-folder-x fs-3"></i></div>
        <div class="fw-semibold">No records found</div>
      </td></tr>`;
      pagWrapper.innerHTML = `<div class="text-muted small">Showing 0 to 0 of 0 entries</div>`;
      return;
    }

    tbody.innerHTML = pageData.map((item, index) => {
      const globalIndex = startIdx + index + 1;
      return renderRowFn(item, globalIndex);
    }).join('');

    pagWrapper.innerHTML = `
      <div class="text-muted small">Showing ${startIdx + 1} to ${endIdx} of ${totalRows} entries</div>
      <nav aria-label="Table navigation">
        <ul class="pagination pagination-sm mb-0 justify-content-end">
          <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <button class="page-link shadow-none border-secondary-subtle" data-page="${currentPage - 1}">
              <i class="bi bi-chevron-left"></i>
            </button>
          </li>
          ${Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
            .map((p, idx, arr) => {
              let html = '';
              if (idx > 0 && p - arr[idx - 1] > 1) {
                html += `<li class="page-item disabled"><span class="page-link border-secondary-subtle">...</span></li>`;
              }
              html += `
                <li class="page-item ${currentPage === p ? 'active' : ''}">
                  <button class="page-link shadow-none border-secondary-subtle" data-page="${p}">${p}</button>
                </li>
              `;
              return html;
            }).join('')}
          <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <button class="page-link shadow-none border-secondary-subtle" data-page="${currentPage + 1}">
              <i class="bi bi-chevron-right"></i>
            </button>
          </li>
        </ul>
      </nav>
    `;

    pagWrapper.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        const p = parseInt(btn.dataset.page);
        if (p >= 1 && p <= totalPages) {
          currentPage = p;
          render();
        }
      });
    });
  }

  searchInput.oninput = (e) => {
    searchQuery = e.target.value;
    currentPage = 1;
    render();
  };

  render();
}

const TITLES = {home:'Dashboard',bankloan:'Bank Loan',busbooking:'Bus Booking',collegeproject:'College Project',
  ecommerce:'Ecommerce',employeeapp:'Employee App',employeeonboarding:'Employee Onboarding',
  enquiry:'Enquiry',feestracking:'Fees Tracking',goaltracker:'Goal Tracker',leavetracker:'Leave Tracker',
  projectcompetition:'Project Competition',smartparking:'Smart Parking',survey:'Survey',userapp:'User App'};

function updateTopbar(app) {
  document.getElementById('topbar-title').textContent = TITLES[app]||app;
  document.getElementById('topbar-breadcrumb').textContent = `Home / ${TITLES[app]||app}`;
}

/* ── Router ─────────────────────────────────────────────────── */
function switchApp(app) {
  state.currentApp = app;
  document.querySelectorAll('.nav-link-custom').forEach(b=>b.classList.toggle('active',b.dataset.app===app));
  updateTopbar(app);
  const c = document.getElementById('app-content');
  c.innerHTML = spinner();
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('active');
  const routes={home:renderHome,bankloan:renderBankLoan,busbooking:renderBusBooking,
    collegeproject:renderCollegeProject,ecommerce:renderEcommerce,employeeapp:renderEmployeeApp,
    employeeonboarding:renderEmployeeOnboarding,enquiry:renderEnquiry,feestracking:renderFeesTracking,
    goaltracker:renderGoalTracker,leavetracker:renderLeaveTracker,projectcompetition:renderProjectCompetition,
    smartparking:renderSmartParking,survey:renderSurvey,userapp:renderUserApp};
  if (routes[app]) routes[app](c); else c.innerHTML='<p class="text-muted">Not found.</p>';
}

document.getElementById('sidebar-search-input').addEventListener('input',function(){
  const q=this.value.toLowerCase();
  document.querySelectorAll('.nav-link-custom').forEach(b=>{
    b.closest('.nav-item-custom').style.display=b.textContent.toLowerCase().includes(q)?'':'none';
  });
});
document.getElementById('sidebar-toggle').addEventListener('click',()=>{
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebar-overlay').classList.toggle('active');
});
document.getElementById('sidebar-overlay').addEventListener('click',()=>{
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('active');
});

/* ══════════════════════════════════════════════════════════════
   0. HOME
══════════════════════════════════════════════════════════════ */
function renderHome(c){
  c.innerHTML=`
  <div class="hero-welcome mb-4">
    <div style="font-size:3rem">🚀</div>
    <h2 class="mt-2">FreeProjectAPI Dashboard</h2>
    <p class="text-secondary mb-3">14 fully-integrated sandbox applications. Click any app in the sidebar.</p>
    <div class="d-flex flex-wrap gap-2 justify-content-center">
      <span class="badge bg-secondary">Bootstrap 5</span><span class="badge bg-secondary">Vanilla JS</span>
      <span class="badge bg-secondary">REST APIs</span><span class="badge bg-secondary">SPA Routing</span>
    </div>
  </div>
  <div class="row g-3" id="home-cards"></div>`;
  const apps=[
    {id:'bankloan',icon:'bi-bank',label:'Bank Loan',color:'#58a6ff',desc:'Loan applications & approvals'},
    {id:'busbooking',icon:'bi-bus-front',label:'Bus Booking',color:'#3fb950',desc:'Schedules & seat booking'},
    {id:'collegeproject',icon:'bi-mortarboard',label:'College Project',color:'#bc8cff',desc:'Project submissions'},
    {id:'ecommerce',icon:'bi-cart3',label:'Ecommerce',color:'#d29922',desc:'Product catalog & cart'},
    {id:'employeeapp',icon:'bi-people',label:'Employee App',color:'#58a6ff',desc:'Directory & search'},
    {id:'employeeonboarding',icon:'bi-person-check',label:'Onboarding',color:'#3fb950',desc:'Step-by-step wizard'},
    {id:'enquiry',icon:'bi-chat-dots',label:'Enquiry',color:'#f85149',desc:'Support tickets'},
    {id:'feestracking',icon:'bi-cash-coin',label:'Fees Tracking',color:'#d29922',desc:'Enrollments & payments'},
    {id:'goaltracker',icon:'bi-bullseye',label:'Goal Tracker',color:'#bc8cff',desc:'Goals & progress'},
    {id:'leavetracker',icon:'bi-calendar-x',label:'Leave Tracker',color:'#58a6ff',desc:'Leave requests & balance'},
    {id:'projectcompetition',icon:'bi-trophy',label:'Competition',color:'#d29922',desc:'Register & submit projects'},
    {id:'smartparking',icon:'bi-p-circle',label:'Smart Parking',color:'#3fb950',desc:'Live slot availability'},
    {id:'survey',icon:'bi-card-checklist',label:'Survey',color:'#bc8cff',desc:'Multi-question surveys'},
    {id:'userapp',icon:'bi-person-gear',label:'User App',color:'#58a6ff',desc:'Profile management'}
  ];
  const g=document.getElementById('home-cards');
  apps.forEach(a=>{
    const d=document.createElement('div'); d.className='col-sm-6 col-md-4 col-xl-3';
    d.innerHTML=`<div class="stat-card h-100" style="cursor:pointer;border-color:${a.color}22" onclick="switchApp('${a.id}')"
      onmouseenter="this.style.borderColor='${a.color}'" onmouseleave="this.style.borderColor='${a.color}22'">
      <div class="stat-icon" style="background:${a.color}22;color:${a.color}"><i class="bi ${a.icon}"></i></div>
      <div style="font-size:1rem;font-weight:600;color:${a.color}">${a.label}</div>
      <div class="stat-label">${a.desc}</div></div>`;
    g.appendChild(d);
  });
}

/* ══════════════════════════════════════════════════════════════
   1. BANK LOAN  – GET /BankLoan/GetAllApplications
                  POST /BankLoan/AddNewApplication
══════════════════════════════════════════════════════════════ */
function renderBankLoan(c){
  c.innerHTML=`
  <div class="section-heading"><i class="bi bi-bank me-2" style="color:var(--accent)"></i>Bank Loan Manager</div>
  <div class="section-sub">Apply for a loan and track all applications</div>
  <div class="row g-4">
    <div class="col-lg-4">
      <div class="card">
        <div class="card-header"><strong class="small"><i class="bi bi-plus-circle me-2"></i>New Application</strong></div>
        <div class="card-body">
          <div id="loan-msg"></div>
          <form id="loan-form">
            <div class="mb-3"><label class="form-label">Full Name</label>
              <input class="form-control form-control-sm" id="l-fname" placeholder="John Doe" required/></div>
            <div class="mb-3"><label class="form-label">PAN Card</label>
              <input class="form-control form-control-sm" id="l-pan" placeholder="ABCDE1234F" required/></div>
            <div class="mb-3"><label class="form-label">Email</label>
              <input type="email" class="form-control form-control-sm" id="l-email" placeholder="john@email.com" required/></div>
            <div class="mb-3"><label class="form-label">Phone</label>
              <input class="form-control form-control-sm" id="l-phone" placeholder="9876543210" required/></div>
            <div class="mb-3"><label class="form-label">Date of Birth</label>
              <input type="date" class="form-control form-control-sm" id="l-dob" required/></div>
            <div class="mb-3"><label class="form-label">Annual Income (₹)</label>
              <input type="number" class="form-control form-control-sm" id="l-income" placeholder="600000" required/></div>
            <div class="mb-3"><label class="form-label">Employment Status</label>
              <select class="form-select form-select-sm" id="l-emp">
                <option>Salaried</option><option>Self-Employed</option><option>Business</option><option>Unemployed</option>
              </select></div>
            <div class="mb-3"><label class="form-label">Credit Score</label>
              <input type="number" class="form-control form-control-sm" id="l-credit" placeholder="750" min="300" max="900"/></div>
            <div class="mb-3"><label class="form-label">Loan Amount (₹)</label>
              <input type="number" class="form-control form-control-sm" id="l-amount" placeholder="500000" required/></div>
            <div class="mb-3"><label class="form-label">Bank Name</label>
              <input class="form-control form-control-sm" id="l-bank" placeholder="State Bank of India"/></div>
            <button type="submit" class="btn btn-primary btn-sm w-100"><i class="bi bi-send me-1"></i>Submit Application</button>
          </form>
        </div>
      </div>
    </div>
    <div class="col-lg-8">
      <div class="card">
        <div class="card-header d-flex justify-content-between align-items-center">
          <strong class="small"><i class="bi bi-table me-2"></i>All Applications</strong>
          <button class="btn btn-outline-primary btn-sm" onclick="loadLoanList()"><i class="bi bi-arrow-clockwise"></i></button>
        </div>
        <div class="card-body p-0"><div class="table-responsive">
          <table class="table table-borderless mb-0">
            <thead><tr><th>#</th><th>Applicant</th><th>PAN</th><th>Income</th><th>Credit</th><th>Status</th></tr></thead>
            <tbody id="loan-tbody"><tr><td colspan="6" class="text-center py-4">Loading…</td></tr></tbody>
          </table></div>
        </div>
      </div>
    </div>
  </div>`;
  loadLoanList();
  document.getElementById('loan-form').addEventListener('submit',async e=>{
    e.preventDefault(); const m=document.getElementById('loan-msg');
    m.innerHTML=`<div class="d-flex justify-content-center py-2"><div class="spinner-border spinner-border-sm" style="color:var(--accent)"></div></div>`;
    try {
      await api('BankLoan/AddNewApplication','POST',{
        fullName:document.getElementById('l-fname').value,
        panCard:document.getElementById('l-pan').value,
        email:document.getElementById('l-email').value,
        phone:document.getElementById('l-phone').value,
        dateOfBirth:document.getElementById('l-dob').value,
        annualIncome:parseFloat(document.getElementById('l-income').value)||0,
        employmentStatus:document.getElementById('l-emp').value,
        creditScore:parseInt(document.getElementById('l-credit').value)||700,
        loans:[{bankName:document.getElementById('l-bank').value,loanAmount:parseFloat(document.getElementById('l-amount').value)||0,emi:0}]
      });
      m.innerHTML=alertBox('Application submitted successfully!');
      document.getElementById('loan-form').reset(); loadLoanList();
    } catch(err){m.innerHTML=alertBox('Error: '+err.message,'danger');}
  });
}
async function loadLoanList(){
  const tb=document.getElementById('loan-tbody'); if(!tb)return;
  tb.innerHTML=`<tr><td colspan="6" class="text-center">${spinner()}</td></tr>`;
  try{
    const d=await api('BankLoan/GetAllApplications');
    const items=d.data||d||[];
    if(!items.length){tb.innerHTML=`<tr><td colspan="6" class="text-center text-muted py-3">No applications yet.</td></tr>`;return;}
    tb.innerHTML=items.map((r,i)=>{
      const st=r.applicationStatus||'Pending';
      const sc={Approved:'var(--success-custom)',Rejected:'var(--danger-custom)',Pending:'var(--warning-custom)'}[st]||'var(--warning-custom)';
      return `<tr>
        <td><span class="badge bg-secondary">${i+1}</span></td>
        <td><strong class="small">${r.fullName||'—'}</strong><br><small class="text-muted">${r.email||''}</small></td>
        <td class="small text-muted">${r.panCard||'—'}</td>
        <td class="small">₹${Number(r.annualIncome||0).toLocaleString()}</td>
        <td><span class="badge bg-secondary">${r.creditScore||'—'}</span></td>
        <td><span class="badge" style="background:${sc}22;color:${sc}">${st}</span></td>
      </tr>`;
    }).join('');
  }catch(err){tb.innerHTML=`<tr><td colspan="6" class="text-danger text-center py-3">${err.message}</td></tr>`;}
}

/* ══════════════════════════════════════════════════════════════
   2. BUS BOOKING – GET /BusBooking/GetBusSchedules
                   GET /BusBooking/GetBusLocations
                   POST /BusBooking/BookBus
══════════════════════════════════════════════════════════════ */
let selectedBus=null;
function renderBusBooking(c){
  c.innerHTML=`
  <div class="section-heading"><i class="bi bi-bus-front me-2" style="color:var(--success-custom)"></i>Bus Booking</div>
  <div class="section-sub">Browse bus schedules and book a seat</div>
  <div class="row g-3 mb-4">
    <div class="col-md-4"><label class="form-label">From</label>
      <input class="form-control form-control-sm" id="bus-from" placeholder="Chennai"/></div>
    <div class="col-md-4"><label class="form-label">To</label>
      <input class="form-control form-control-sm" id="bus-to" placeholder="Bangalore"/></div>
    <div class="col-md-4 d-flex align-items-end">
      <button class="btn btn-primary btn-sm w-100" onclick="loadBusSchedules()">
        <i class="bi bi-search me-1"></i>Search Schedules</button>
    </div>
  </div>
  <div id="bus-msg"></div>
  <div id="bus-results"></div>`;
  loadBusSchedules();
}
async function loadBusSchedules(){
  const el=document.getElementById('bus-results'); if(!el)return;
  el.innerHTML=spinner();
  try{
    const d=await api('BusBooking/GetBusSchedules');
    const buses=d.data||d||[];
    if(!buses.length){el.innerHTML=`<p class="text-muted">No schedules found.</p>`;return;}
    el.innerHTML=`<div class="row g-3" id="bus-grid"></div>`;
    const g=document.getElementById('bus-grid');
    buses.forEach(b=>{
      const col=document.createElement('div'); col.className='col-md-6 col-xl-4';
      const seats=b.availableSeats??b.totalSeats??40;
      const dep=b.departureTime?new Date(b.departureTime).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}):'—';
      const arr=b.arrivalTime?new Date(b.arrivalTime).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}):'—';
      col.innerHTML=`<div class="card h-100"><div class="card-body">
        <div class="d-flex justify-content-between align-items-start mb-2">
          <div><div class="fw-bold">${b.busName||'Express'}</div>
            <small class="text-muted">${b.busVehicleNo||''}</small></div>
          <span class="badge bg-success bg-opacity-25 text-success">${seats} seats</span>
        </div>
        <div class="small text-muted mb-2"><i class="bi bi-geo-alt me-1"></i>${b.fromLocationName||b.fromLocation||'Origin'} → ${b.toLocationName||b.toLocation||'Dest'}</div>
        <div class="d-flex justify-content-between small mb-3">
          <span><i class="bi bi-clock me-1"></i>${dep}</span>
          <span><i class="bi bi-clock-history me-1"></i>${arr}</span>
          <span class="fw-bold" style="color:var(--success-custom)">₹${b.price||0}</span>
        </div>
        <button class="btn btn-primary btn-sm w-100" onclick='openBusModal(${JSON.stringify(b)})'>
          <i class="bi bi-ticket-perforated me-1"></i>Book Seat</button>
      </div></div>`;
      g.appendChild(col);
    });
  }catch(err){el.innerHTML=`<div class="alert alert-danger">${err.message}</div>`;}
}
function openBusModal(b){
  selectedBus=b;
  document.getElementById('booking-modal-body').innerHTML=`
    <p class="fw-bold">${b.busName||'Express'} &nbsp;<small class="text-muted">${b.busVehicleNo||''}</small></p>
    <p class="small text-muted">${b.fromLocationName||b.fromLocation||'—'} → ${b.toLocationName||b.toLocation||'—'}</p>
    <div class="mb-3"><label class="form-label">Passenger Name</label>
      <input class="form-control form-control-sm" id="bk-pname" placeholder="Full Name"/></div>
    <div class="mb-3"><label class="form-label">Age</label>
      <input type="number" class="form-control form-control-sm" id="bk-age" placeholder="25"/></div>
    <div class="mb-3"><label class="form-label">Gender</label>
      <select class="form-select form-select-sm" id="bk-gender"><option>Male</option><option>Female</option><option>Other</option></select></div>
    <div class="mb-3"><label class="form-label">Seat No</label>
      <input type="number" class="form-control form-control-sm" id="bk-seat" placeholder="12" min="1"/></div>
    <p class="small text-muted mb-0">Fare: <strong style="color:var(--success-custom)">₹${b.price||0}</strong></p>`;
  new bootstrap.Modal(document.getElementById('bookingModal')).show();
  document.getElementById('confirm-booking-btn').onclick=confirmBusBooking;
}
async function confirmBusBooking(){
  const b=selectedBus;
  const payload={custId:1,scheduleId:b.scheduleId||b.scheduleID||1,
    bookingDate:new Date().toISOString(),
    busBookingPassengers:[{passengerName:document.getElementById('bk-pname').value,
      age:parseInt(document.getElementById('bk-age').value)||25,
      gender:document.getElementById('bk-gender').value,
      seatNo:parseInt(document.getElementById('bk-seat').value)||1}]};
  bootstrap.Modal.getInstance(document.getElementById('bookingModal')).hide();
  try{
    await api('BusBooking/BookBus','POST',payload);
    document.getElementById('bus-msg').innerHTML=alertBox('Booking confirmed!');
  }catch(err){document.getElementById('bus-msg').innerHTML=alertBox('Booking failed: '+err.message,'danger');}
}

/* ══════════════════════════════════════════════════════════════
   3. COLLEGE PROJECT – GET /CollegeProject/getAllProjects
                        POST /CollegeProject/SubmitProject
══════════════════════════════════════════════════════════════ */
function renderCollegeProject(c){
  c.innerHTML=`
  <div class="section-heading"><i class="bi bi-mortarboard me-2" style="color:#bc8cff"></i>College Project Portal</div>
  <div class="section-sub">Submit your project and browse submissions</div>
  <div class="row g-4">
    <div class="col-lg-4"><div class="card">
      <div class="card-header"><strong class="small"><i class="bi bi-upload me-2"></i>Submit Project</strong></div>
      <div class="card-body">
        <div id="cp-msg"></div>
        <form id="cp-form">
          <div class="mb-3"><label class="form-label">Project Title</label>
            <input class="form-control form-control-sm" id="cp-title" required placeholder="AI Smart Chatbot"/></div>
          <div class="mb-3"><label class="form-label">Description</label>
            <textarea class="form-control form-control-sm" id="cp-desc" rows="3" placeholder="Brief description…"></textarea></div>
          <div class="mb-3"><label class="form-label">GitHub Link</label>
            <input class="form-control form-control-sm" id="cp-github" placeholder="https://github.com/…"/></div>
          <div class="mb-3"><label class="form-label">Competition ID</label>
            <input type="number" class="form-control form-control-sm" id="cp-comp" value="1"/></div>
          <div class="mb-3"><label class="form-label">User ID</label>
            <input type="number" class="form-control form-control-sm" id="cp-uid" value="1"/></div>
          <button type="submit" class="btn btn-primary btn-sm w-100"><i class="bi bi-cloud-upload me-1"></i>Submit</button>
        </form>
      </div>
    </div></div>
    <div class="col-lg-8"><div class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <strong class="small"><i class="bi bi-journals me-2"></i>All Projects</strong>
        <button class="btn btn-outline-primary btn-sm" onclick="loadCPList()"><i class="bi bi-arrow-clockwise"></i></button>
      </div>
      <div class="card-body p-0"><div class="table-responsive">
        <table class="table table-borderless mb-0">
          <thead><tr><th>#</th><th>Project Title</th><th>Description</th><th>GitHub</th><th>Status</th></tr></thead>
          <tbody id="cp-tbody"><tr><td colspan="5" class="text-center py-4">Loading…</td></tr></tbody>
        </table></div>
      </div>
    </div></div>
  </div>`;
  loadCPList();
  document.getElementById('cp-form').addEventListener('submit',async e=>{
    e.preventDefault(); const m=document.getElementById('cp-msg');
    m.innerHTML=`<div class="spinner-border spinner-border-sm" style="color:var(--accent)"></div>`;
    try{
      await api('CollegeProject/SubmitProject','POST',{
        projectTitle:document.getElementById('cp-title').value,
        description:document.getElementById('cp-desc').value,
        githubLink:document.getElementById('cp-github').value,
        competitionId:parseInt(document.getElementById('cp-comp').value)||1,
        userId:parseInt(document.getElementById('cp-uid').value)||1
      });
      m.innerHTML=alertBox('Project submitted!'); document.getElementById('cp-form').reset(); loadCPList();
    }catch(err){m.innerHTML=alertBox('Error: '+err.message,'danger');}
  });
}
async function loadCPList(){
  const tb=document.getElementById('cp-tbody'); if(!tb)return;
  tb.innerHTML=`<tr><td colspan="5" class="text-center">${spinner()}</td></tr>`;
  try{
    const d=await api('CollegeProject/getAllProjects');
    const items=d.data||d||[];
    if(!items.length){tb.innerHTML=`<tr><td colspan="5" class="text-center text-muted py-3">No projects yet.</td></tr>`;return;}
    tb.innerHTML=items.map((r,i)=>{
      const st=r.status||'Pending';
      const sc={Approved:'var(--success-custom)',Rejected:'var(--danger-custom)'}[st]||'var(--warning-custom)';
      return `<tr>
        <td><span class="badge bg-secondary">${i+1}</span></td>
        <td class="fw-bold small">${r.projectTitle||'—'}</td>
        <td class="small text-muted">${(r.description||'—').substring(0,60)}</td>
        <td class="small">${r.githubLink?`<a href="${r.githubLink}" target="_blank" class="text-accent">GitHub</a>`:'—'}</td>
        <td><span class="badge" style="background:${sc}22;color:${sc}">${st}</span></td>
      </tr>`;
    }).join('');
  }catch(err){tb.innerHTML=`<tr><td colspan="5" class="text-danger text-center py-3">${err.message}</td></tr>`;}
}

/* ══════════════════════════════════════════════════════════════
   4. ECOMMERCE – GET /Ecommerce/get-products
                  POST /Ecommerce/add-to-cart
══════════════════════════════════════════════════════════════ */
let allProducts=[];
function renderEcommerce(c){
  c.innerHTML=`
  <div class="section-heading"><i class="bi bi-cart3 me-2" style="color:var(--warning-custom)"></i>Ecommerce Store</div>
  <div class="section-sub">Browse products and add to cart</div>
  <div class="row g-3 mb-3">
    <div class="col-md-6"><input class="form-control form-control-sm" id="ec-search" placeholder="Search products…" oninput="filterProducts()"/></div>
    <div class="col-md-3"><select class="form-select form-select-sm" id="ec-cat" onchange="filterProducts()"><option value="">All Categories</option></select></div>
    <div class="col-md-3"><button class="btn btn-outline-primary btn-sm w-100" onclick="loadProducts()"><i class="bi bi-arrow-clockwise me-1"></i>Refresh</button></div>
  </div>
  <div id="ec-msg"></div>
  <div id="ec-grid" class="row g-3"></div>`;
  loadProducts();
}
async function loadProducts(){
  const g=document.getElementById('ec-grid'); if(!g)return;
  g.innerHTML=`<div class="col-12">${spinner()}</div>`;
  try{
    const d=await api('Ecommerce/get-products');
    allProducts=d.data||d||[];
    const cats=[...new Set(allProducts.map(p=>p.parentCategoryName||p.category||'General'))];
    const sel=document.getElementById('ec-cat');
    if(sel) cats.forEach(cat=>{const o=document.createElement('option');o.value=cat;o.textContent=cat;sel.appendChild(o);});
    renderProductGrid(allProducts);
  }catch(err){g.innerHTML=`<div class="col-12"><div class="alert alert-danger">${err.message}</div></div>`;}
}
function filterProducts(){
  const q=(document.getElementById('ec-search')?.value||'').toLowerCase();
  const cat=document.getElementById('ec-cat')?.value||'';
  renderProductGrid(allProducts.filter(p=>{
    const name=(p.productName||p.name||'').toLowerCase();
    const pc=p.parentCategoryName||p.category||'General';
    return name.includes(q)&&(!cat||pc===cat);
  }));
}
function renderProductGrid(products){
  const g=document.getElementById('ec-grid'); if(!g)return;
  if(!products.length){g.innerHTML=`<div class="col-12"><p class="text-muted">No products found.</p></div>`;return;}
  g.innerHTML='';
  products.forEach(p=>{
    const col=document.createElement('div'); col.className='col-sm-6 col-md-4 col-xl-3';
    const name=p.productName||p.name||'Product';
    const price=p.price||p.mrp||0;
    const cat=p.parentCategoryName||p.category||'General';
    col.innerHTML=`<div class="card h-100"><div class="card-body d-flex flex-column">
      <div class="text-center mb-3" style="font-size:2.5rem">${getCatEmoji(cat)}</div>
      <div class="fw-bold mb-1 small">${name}</div>
      <span class="badge bg-secondary mb-2" style="width:fit-content">${cat}</span>
      <p class="text-muted small flex-grow-1">${(p.description||'Quality product.').substring(0,80)}</p>
      <div class="d-flex justify-content-between align-items-center mt-auto">
        <span class="fw-bold" style="color:var(--warning-custom)">₹${Number(price).toLocaleString()}</span>
        <button class="btn btn-warning btn-sm" onclick="addToCart(${p.productId||p.id||0},'${name}',${price})">
          <i class="bi bi-bag-plus me-1"></i>Add</button>
      </div>
    </div></div>`;
    g.appendChild(col);
  });
}
function getCatEmoji(c){return {Electronics:'📱',Clothing:'👗',Food:'🍔',Books:'📚',Furniture:'🛋️',Sports:'⚽',Beauty:'💄',Toys:'🧸'}[c]||'🛍️';}
async function addToCart(productId,name,price){
  const m=document.getElementById('ec-msg');
  try{
    await api('Ecommerce/add-to-cart','POST',{custId:1,productId,quantity:1});
    if(m) m.innerHTML=alertBox(`"${name}" added to cart! ₹${price}`);
  }catch(err){if(m) m.innerHTML=alertBox('Error: '+err.message,'danger');}
}

/* ══════════════════════════════════════════════════════════════
   5. EMPLOYEE APP – GET /EmployeeApp/GetEmployees
                     GET /EmployeeApp/GetDepartments
                     POST /EmployeeApp/CreateEmployee
══════════════════════════════════════════════════════════════ */
let allEmployees=[];
function renderEmployeeApp(c){
  c.innerHTML=`
  <div class="section-heading"><i class="bi bi-people me-2" style="color:var(--accent)"></i>Employee Directory</div>
  <div class="section-sub">Search and view all employee records</div>
  <div class="card">
    <div class="card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
      <strong class="small"><i class="bi bi-person-lines-fill me-2"></i>All Employees</strong>
      <div class="d-flex gap-2">
        <input class="form-control form-control-sm" id="emp-search" style="width:200px" placeholder="Search…" oninput="filterEmployees()"/>
        <button class="btn btn-outline-primary btn-sm" onclick="loadEmployees()"><i class="bi bi-arrow-clockwise"></i></button>
      </div>
    </div>
    <div class="card-body p-0"><div class="table-responsive">
      <table class="table table-borderless mb-0">
        <thead><tr><th>#</th><th>Employee</th><th>Department</th><th>Designation</th><th>Phone</th><th>Status</th></tr></thead>
        <tbody id="emp-tbody"><tr><td colspan="6" class="text-center py-4">Loading…</td></tr></tbody>
      </table></div>
    </div>
  </div>`;
  loadEmployees();
}
async function loadEmployees(){
  const tb=document.getElementById('emp-tbody'); if(!tb)return;
  tb.innerHTML=`<tr><td colspan="6" class="text-center">${spinner()}</td></tr>`;
  try{
    const d=await api('EmployeeApp/GetEmployees');
    allEmployees=d.data||d||[];
    renderEmployeeTable(allEmployees);
  }catch(err){tb.innerHTML=`<tr><td colspan="6" class="text-danger text-center py-3">${err.message}</td></tr>`;}
}
function filterEmployees(){
  const q=(document.getElementById('emp-search')?.value||'').toLowerCase();
  renderEmployeeTable(allEmployees.filter(e=>{
    const n=(e.employeeName||e.name||e.fullName||'').toLowerCase();
    const dep=(e.departmentName||e.department||'').toLowerCase();
    return n.includes(q)||dep.includes(q);
  }));
}
function renderEmployeeTable(list){
  const tb=document.getElementById('emp-tbody'); if(!tb)return;
  if(!list.length){tb.innerHTML=`<tr><td colspan="6" class="text-center text-muted py-3">No employees found.</td></tr>`;return;}
  const stats=['Active','On Leave','Remote'];
  tb.innerHTML=list.map((e,i)=>{
    const st=e.status||stats[i%3];
    const sc=st==='Active'?'var(--success-custom)':st==='On Leave'?'var(--warning-custom)':'var(--accent)';
    const name=e.employeeName||e.name||e.fullName||'—';
    return `<tr>
      <td><div style="width:32px;height:32px;border-radius:50%;background:var(--accent-glow);display:flex;align-items:center;justify-content:center;color:var(--accent);font-weight:700;font-size:.75rem">${name.charAt(0).toUpperCase()}</div></td>
      <td><strong class="small">${name}</strong><br><small class="text-muted">${e.email||e.emailId||''}</small></td>
      <td><span class="badge bg-secondary bg-opacity-25 text-secondary">${e.departmentName||e.department||'—'}</span></td>
      <td class="small">${e.designationName||e.designation||e.role||'—'}</td>
      <td class="small text-muted">${e.phone||e.contactNo||'—'}</td>
      <td><span class="badge" style="background:${sc}22;color:${sc}">${st}</span></td>
    </tr>`;
  }).join('');
}

/* ══════════════════════════════════════════════════════════════
   6. EMPLOYEE ONBOARDING – GET /EmployeeOnboarding/GetEmployees
                             POST /EmployeeOnboarding/register
══════════════════════════════════════════════════════════════ */
const obSteps=[{label:'Personal Info',icon:'bi-person'},{label:'Job Details',icon:'bi-briefcase'},{label:'Documents',icon:'bi-file-earmark-text'},{label:'Review',icon:'bi-check2-circle'}];
function renderEmployeeOnboarding(c){
  state.onboardingStep=0;
  c.innerHTML=`
  <div class="section-heading"><i class="bi bi-person-check me-2" style="color:var(--success-custom)"></i>Employee Onboarding</div>
  <div class="section-sub">Complete the onboarding wizard for new employees</div>
  <div id="ob-msg"></div>
  <div class="card"><div class="card-body">
    <div class="step-indicator" id="ob-steps"></div>
    <div id="ob-content"></div>
    <div class="d-flex justify-content-between mt-4">
      <button class="btn btn-outline-secondary btn-sm" id="ob-prev" onclick="obNav(-1)"><i class="bi bi-arrow-left me-1"></i>Back</button>
      <button class="btn btn-primary btn-sm" id="ob-next" onclick="obNav(1)">Next<i class="bi bi-arrow-right ms-1"></i></button>
    </div>
  </div></div>`;
  renderObStep();
}
function renderObStep(){
  const s=state.onboardingStep;
  let ind='';
  obSteps.forEach((st,i)=>{
    const cls=i<s?'done':i===s?'active':'';
    const lc=i<s?'done':'';
    ind+=`<div style="display:flex;flex-direction:column;align-items:center"><div class="step-circle ${cls}"><i class="bi ${st.icon}"></i></div><div class="step-label">${st.label}</div></div>`;
    if(i<obSteps.length-1) ind+=`<div class="step-line ${lc}"></div>`;
  });
  document.getElementById('ob-steps').innerHTML=ind;
  const forms=[
    `<div class="row g-3">
      <div class="col-md-6"><label class="form-label">First Name</label><input class="form-control form-control-sm" id="ob-fn" placeholder="John"/></div>
      <div class="col-md-6"><label class="form-label">Last Name</label><input class="form-control form-control-sm" id="ob-ln" placeholder="Doe"/></div>
      <div class="col-md-6"><label class="form-label">Email</label><input type="email" class="form-control form-control-sm" id="ob-email" placeholder="john@company.com"/></div>
      <div class="col-md-6"><label class="form-label">Phone</label><input class="form-control form-control-sm" id="ob-phone" placeholder="9876543210"/></div>
      <div class="col-md-6"><label class="form-label">Date of Birth</label><input type="date" class="form-control form-control-sm" id="ob-dob"/></div>
      <div class="col-md-6"><label class="form-label">Gender</label><select class="form-select form-select-sm" id="ob-gender"><option>Male</option><option>Female</option><option>Other</option></select></div>
    </div>`,
    `<div class="row g-3">
      <div class="col-md-6"><label class="form-label">Employee ID</label><input class="form-control form-control-sm" id="ob-eid" placeholder="EMP2024001"/></div>
      <div class="col-md-6"><label class="form-label">Department</label><input class="form-control form-control-sm" id="ob-dept" placeholder="Engineering"/></div>
      <div class="col-md-6"><label class="form-label">Designation</label><input class="form-control form-control-sm" id="ob-desg" placeholder="Software Engineer"/></div>
      <div class="col-md-6"><label class="form-label">Joining Date</label><input type="date" class="form-control form-control-sm" id="ob-jdate"/></div>
      <div class="col-md-6"><label class="form-label">Salary (₹)</label><input type="number" class="form-control form-control-sm" id="ob-sal" placeholder="60000"/></div>
      <div class="col-md-6"><label class="form-label">Company</label><input class="form-control form-control-sm" id="ob-company" placeholder="Acme Corp"/></div>
    </div>`,
    `<div class="row g-3">
      <div class="col-md-6"><label class="form-label">Aadhar Number</label><input class="form-control form-control-sm" id="ob-aadhar" placeholder="1234 5678 9012"/></div>
      <div class="col-md-6"><label class="form-label">PAN Number</label><input class="form-control form-control-sm" id="ob-pan" placeholder="ABCDE1234F"/></div>
      <div class="col-md-6"><label class="form-label">Bank Account</label><input class="form-control form-control-sm" id="ob-bank" placeholder="Account number"/></div>
      <div class="col-md-6"><label class="form-label">IFSC Code</label><input class="form-control form-control-sm" id="ob-ifsc" placeholder="SBIN0001234"/></div>
      <div class="col-12"><label class="form-label">Address</label><textarea class="form-control form-control-sm" id="ob-addr" rows="2" placeholder="123, Main St, City"></textarea></div>
    </div>`,
    `<div class="p-3" style="background:var(--surface2);border-radius:10px">
      <h6 style="color:var(--accent)"><i class="bi bi-check2-all me-2"></i>Review Details</h6>
      <div class="row g-2 small mt-2">
        <div class="col-6 text-muted">Name:</div><div class="col-6" id="rv-name">—</div>
        <div class="col-6 text-muted">Department:</div><div class="col-6" id="rv-dept">—</div>
        <div class="col-6 text-muted">Designation:</div><div class="col-6" id="rv-desg">—</div>
        <div class="col-6 text-muted">Joining Date:</div><div class="col-6" id="rv-jdate">—</div>
      </div>
    </div>`
  ];
  document.getElementById('ob-content').innerHTML=forms[s];
  if(s===3){
    document.getElementById('rv-name').textContent=`${document.getElementById('ob-fn')?.value||''} ${document.getElementById('ob-ln')?.value||''}`.trim()||'—';
    document.getElementById('rv-dept').textContent=document.getElementById('ob-dept')?.value||'—';
    document.getElementById('rv-desg').textContent=document.getElementById('ob-desg')?.value||'—';
    document.getElementById('rv-jdate').textContent=document.getElementById('ob-jdate')?.value||'—';
  }
  document.getElementById('ob-prev').style.display=s===0?'none':'';
  document.getElementById('ob-next').innerHTML=s===obSteps.length-1?'<i class="bi bi-check-lg me-1"></i>Submit':'Next<i class="bi bi-arrow-right ms-1"></i>';
}
async function obNav(dir){
  if(dir===1&&state.onboardingStep===obSteps.length-1){
    const m=document.getElementById('ob-msg');
    const payload={
      firstName:document.getElementById('ob-fn')?.value,lastName:document.getElementById('ob-ln')?.value,
      email:document.getElementById('ob-email')?.value,phone:document.getElementById('ob-phone')?.value,
      dateOfBirth:document.getElementById('ob-dob')?.value,gender:document.getElementById('ob-gender')?.value,
      employeeId:document.getElementById('ob-eid')?.value,department:document.getElementById('ob-dept')?.value,
      designation:document.getElementById('ob-desg')?.value,joiningDate:document.getElementById('ob-jdate')?.value,
      salary:parseFloat(document.getElementById('ob-sal')?.value)||0,company:document.getElementById('ob-company')?.value,
      password:'Welcome@123',role:'Employee'
    };
    try{
      await api('EmployeeOnboarding/register','POST',payload);
      m.innerHTML=alertBox('Onboarding completed!'); state.onboardingStep=0; renderObStep();
    }catch(err){m.innerHTML=alertBox('Error: '+err.message,'danger');}
    return;
  }
  state.onboardingStep=Math.max(0,Math.min(obSteps.length-1,state.onboardingStep+dir));
  renderObStep();
}

/* ══════════════════════════════════════════════════════════════
   7. ENQUIRY – GET /Enquiry/get-enquiries
                GET /Enquiry/get-categories
                POST /Enquiry/create-enquiry
══════════════════════════════════════════════════════════════ */
function renderEnquiry(c){
  c.innerHTML=`
  <div class="section-heading"><i class="bi bi-chat-dots me-2" style="color:var(--danger-custom)"></i>Customer Enquiry</div>
  <div class="section-sub">Submit support tickets and track status</div>
  <div class="row g-4">
    <div class="col-lg-5"><div class="card">
      <div class="card-header"><strong class="small"><i class="bi bi-plus-circle me-2"></i>New Enquiry</strong></div>
      <div class="card-body">
        <div id="enq-msg"></div>
        <form id="enq-form">
          <div class="mb-3"><label class="form-label">Customer Name</label>
            <input class="form-control form-control-sm" id="enq-name" required placeholder="Full Name"/></div>
          <div class="mb-3"><label class="form-label">Email</label>
            <input type="email" class="form-control form-control-sm" id="enq-email" required placeholder="email@example.com"/></div>
          <div class="mb-3"><label class="form-label">Phone</label>
            <input class="form-control form-control-sm" id="enq-phone" placeholder="9876543210"/></div>
          <div class="mb-3"><label class="form-label">Category ID</label>
            <select class="form-select form-select-sm" id="enq-cat"><option value="1">General (1)</option><option value="2">Technical (2)</option><option value="3">Billing (3)</option></select></div>
          <div class="mb-3"><label class="form-label">Message</label>
            <textarea class="form-control form-control-sm" id="enq-msg-txt" rows="4" required placeholder="Describe your issue…"></textarea></div>
          <button type="submit" class="btn btn-primary btn-sm w-100"><i class="bi bi-send me-1"></i>Submit Enquiry</button>
        </form>
      </div>
    </div></div>
    <div class="col-lg-7"><div class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <strong class="small"><i class="bi bi-ticket-detailed me-2"></i>Enquiries</strong>
        <button class="btn btn-outline-primary btn-sm" onclick="loadEnquiries()"><i class="bi bi-arrow-clockwise"></i></button>
      </div>
      <div class="card-body p-0"><div class="table-responsive">
        <table class="table table-borderless mb-0">
          <thead><tr><th>#</th><th>Customer</th><th>Message</th><th>Status</th></tr></thead>
          <tbody id="enq-tbody"><tr><td colspan="4" class="text-center py-4">Loading…</td></tr></tbody>
        </table></div>
      </div>
    </div></div>
  </div>`;
  loadEnquiries();
  document.getElementById('enq-form').addEventListener('submit',async e=>{
    e.preventDefault(); const m=document.getElementById('enq-msg');
    m.innerHTML=`<div class="spinner-border spinner-border-sm" style="color:var(--accent)"></div>`;
    try{
      await api('Enquiry/create-enquiry','POST',{
        customerName:document.getElementById('enq-name').value,
        customerEmail:document.getElementById('enq-email').value,
        customerPhone:document.getElementById('enq-phone').value,
        categoryId:parseInt(document.getElementById('enq-cat').value)||1,
        message:document.getElementById('enq-msg-txt').value
      });
      m.innerHTML=alertBox('Enquiry submitted successfully!'); document.getElementById('enq-form').reset(); loadEnquiries();
    }catch(err){m.innerHTML=alertBox('Error: '+err.message,'danger');}
  });
}
async function loadEnquiries(){
  const tb=document.getElementById('enq-tbody'); if(!tb)return;
  tb.innerHTML=`<tr><td colspan="4" class="text-center">${spinner()}</td></tr>`;
  try{
    const d=await api('Enquiry/get-enquiries');
    const items=d.data||d||[];
    if(!items.length){tb.innerHTML=`<tr><td colspan="4" class="text-center text-muted py-3">No enquiries yet.</td></tr>`;return;}
    const statusColors={Open:'var(--warning-custom)','In Progress':'var(--accent)',Resolved:'var(--success-custom)',Closed:'var(--text-muted-custom)'};
    tb.innerHTML=items.map((r,i)=>{
      const st=r.statusName||r.status||'Open';
      const sc=statusColors[st]||'var(--warning-custom)';
      return `<tr>
        <td><span class="badge bg-secondary">#${1000+i}</span></td>
        <td><strong class="small">${r.customerName||'—'}</strong><br><small class="text-muted">${r.customerEmail||''}</small></td>
        <td class="small">${(r.message||'—').substring(0,60)}</td>
        <td><span class="badge" style="background:${sc}22;color:${sc}">${st}</span></td>
      </tr>`;
    }).join('');
  }catch(err){tb.innerHTML=`<tr><td colspan="4" class="text-danger text-center py-3">${err.message}</td></tr>`;}
}

/* ══════════════════════════════════════════════════════════════
   8. FEES TRACKING – GET /FeesTracking/getAllEnrollments
                      GET /FeesTracking/GetDashboardStats
                      POST /FeesTracking/addNewEnrollment
══════════════════════════════════════════════════════════════ */
function renderFeesTracking(c){
  c.innerHTML=`
  <div class="section-heading"><i class="bi bi-cash-coin me-2" style="color:var(--warning-custom)"></i>Fees Tracking</div>
  <div class="section-sub">Manage student enrollments and fee payments</div>
  <div class="row g-3 mb-4" id="fee-stats"><div class="col-12 text-center py-3">${spinner()}</div></div>
  <div class="row g-4">
    <div class="col-lg-7"><div class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <strong class="small"><i class="bi bi-table me-2"></i>Enrollments</strong>
        <button class="btn btn-outline-primary btn-sm" onclick="loadFees()"><i class="bi bi-arrow-clockwise"></i></button>
      </div>
      <div class="card-body p-0"><div class="table-responsive">
        <table class="table table-borderless mb-0">
          <thead><tr><th>#</th><th>Student</th><th>Batch</th><th>Total</th><th>Received</th><th>Pending</th></tr></thead>
          <tbody id="fee-tbody"><tr><td colspan="6" class="text-center py-4">Loading…</td></tr></tbody>
        </table></div>
      </div>
    </div></div>
    <div class="col-lg-5"><div class="card">
      <div class="card-header"><strong class="small"><i class="bi bi-plus-circle me-2"></i>Add Enrollment</strong></div>
      <div class="card-body">
        <div id="fee-msg"></div>
        <form id="fee-form">
          <div class="mb-3"><label class="form-label">Student Name</label>
            <input class="form-control form-control-sm" id="f-sname" required placeholder="Alice Smith"/></div>
          <div class="mb-3"><label class="form-label">Email</label>
            <input type="email" class="form-control form-control-sm" id="f-email" placeholder="alice@email.com"/></div>
          <div class="mb-3"><label class="form-label">Phone</label>
            <input class="form-control form-control-sm" id="f-phone" placeholder="9876543210"/></div>
          <div class="mb-3"><label class="form-label">Batch ID</label>
            <input type="number" class="form-control form-control-sm" id="f-batch" value="1"/></div>
          <div class="mb-3"><label class="form-label">Total Fee (₹)</label>
            <input type="number" class="form-control form-control-sm" id="f-total" placeholder="25000" required/></div>
          <div class="mb-3"><label class="form-label">Amount Received (₹)</label>
            <input type="number" class="form-control form-control-sm" id="f-received" placeholder="10000"/></div>
          <button type="submit" class="btn btn-primary btn-sm w-100"><i class="bi bi-check-circle me-1"></i>Add Enrollment</button>
        </form>
      </div>
    </div></div>
  </div>`;
  loadFees();
  document.getElementById('fee-form').addEventListener('submit',async e=>{
    e.preventDefault(); const m=document.getElementById('fee-msg');
    m.innerHTML=`<div class="spinner-border spinner-border-sm" style="color:var(--accent)"></div>`;
    const total=parseFloat(document.getElementById('f-total').value)||0;
    const received=parseFloat(document.getElementById('f-received').value)||0;
    try{
      await api('FeesTracking/addNewEnrollment','POST',{
        studentName:document.getElementById('f-sname').value,
        email:document.getElementById('f-email').value,
        phone:document.getElementById('f-phone').value,
        batchId:parseInt(document.getElementById('f-batch').value)||1,
        totalAmount:total,amountReceived:received,pendingAmount:total-received
      });
      m.innerHTML=alertBox('Enrollment added!'); document.getElementById('fee-form').reset(); loadFees();
    }catch(err){m.innerHTML=alertBox('Error: '+err.message,'danger');}
  });
}
async function loadFees(){
  const tb=document.getElementById('fee-tbody'), sc=document.getElementById('fee-stats');
  if(!tb)return;
  tb.innerHTML=`<tr><td colspan="6" class="text-center">${spinner()}</td></tr>`;
  try{
    const [listRes,statsRes]=await Promise.allSettled([api('FeesTracking/getAllEnrollments'),api('FeesTracking/GetDashboardStats')]);
    const items=(listRes.status==='fulfilled'?listRes.value.data||listRes.value:[]) ||[];
    if(sc){
      if(statsRes.status==='fulfilled'){
        const s=statsRes.value.data||statsRes.value||{};
        sc.innerHTML=`
          <div class="col-sm-4"><div class="stat-card"><div class="stat-icon" style="background:#58a6ff22;color:var(--accent)"><i class="bi bi-people"></i></div><div class="stat-value">${s.totalEnrollments||items.length}</div><div class="stat-label">Total Enrollments</div></div></div>
          <div class="col-sm-4"><div class="stat-card"><div class="stat-icon" style="background:#3fb95022;color:var(--success-custom)"><i class="bi bi-check-circle"></i></div><div class="stat-value">₹${Number(s.totalReceived||0).toLocaleString()}</div><div class="stat-label">Total Received</div></div></div>
          <div class="col-sm-4"><div class="stat-card"><div class="stat-icon" style="background:#d2992222;color:var(--warning-custom)"><i class="bi bi-clock-history"></i></div><div class="stat-value">₹${Number(s.totalPending||0).toLocaleString()}</div><div class="stat-label">Pending</div></div></div>`;
      } else sc.innerHTML='';
    }
    if(!items.length){tb.innerHTML=`<tr><td colspan="6" class="text-center text-muted py-3">No enrollments.</td></tr>`;return;}
    tb.innerHTML=items.map((r,i)=>`<tr>
      <td><span class="badge bg-secondary">${i+1}</span></td>
      <td><strong class="small">${r.studentName||'—'}</strong><br><small class="text-muted">${r.email||''}</small></td>
      <td><span class="badge bg-secondary">${r.batchName||r.batchId||'—'}</span></td>
      <td class="small fw-bold">₹${Number(r.totalAmount||0).toLocaleString()}</td>
      <td class="small" style="color:var(--success-custom)">₹${Number(r.amountReceived||0).toLocaleString()}</td>
      <td class="small" style="color:var(--warning-custom)">₹${Number(r.pendingAmount||0).toLocaleString()}</td>
    </tr>`).join('');
  }catch(err){tb.innerHTML=`<tr><td colspan="6" class="text-danger text-center py-3">${err.message}</td></tr>`;}
}

/* ══════════════════════════════════════════════════════════════
   9. GOAL TRACKER – GET /GoalTracker/getAllGoalsByUser?userId=1
                     GET /GoalTracker/dashboard
                     POST /GoalTracker/createGoalWithMilestones
══════════════════════════════════════════════════════════════ */
function renderGoalTracker(c){
  c.innerHTML=`
  <div class="section-heading"><i class="bi bi-bullseye me-2" style="color:#bc8cff"></i>Goal Tracker</div>
  <div class="section-sub">Set goals and track your progress</div>
  <div class="row g-4">
    <div class="col-lg-5"><div class="card">
      <div class="card-header"><strong class="small"><i class="bi bi-plus-circle me-2"></i>Add New Goal</strong></div>
      <div class="card-body">
        <div id="goal-msg"></div>
        <form id="goal-form">
          <div class="mb-3"><label class="form-label">Goal Title</label>
            <input class="form-control form-control-sm" id="g-title" required placeholder="Read 12 books this year"/></div>
          <div class="mb-3"><label class="form-label">Description</label>
            <textarea class="form-control form-control-sm" id="g-desc" rows="2" placeholder="Brief description…"></textarea></div>
          <div class="mb-3"><label class="form-label">Category</label>
            <select class="form-select form-select-sm" id="g-cat">
              <option>Health</option><option>Learning</option><option>Work</option><option>Finance</option><option>Personal</option>
            </select></div>
          <div class="mb-3"><label class="form-label">Start Date</label>
            <input type="date" class="form-control form-control-sm" id="g-start"/></div>
          <div class="mb-3"><label class="form-label">Target Date</label>
            <input type="date" class="form-control form-control-sm" id="g-end"/></div>
          <div class="mb-3"><label class="form-label">Frequency</label>
            <select class="form-select form-select-sm" id="g-freq"><option>Daily</option><option>Weekly</option><option>Monthly</option></select></div>
          <button type="submit" class="btn btn-primary btn-sm w-100"><i class="bi bi-plus-lg me-1"></i>Add Goal</button>
        </form>
      </div>
    </div></div>
    <div class="col-lg-7"><div class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <strong class="small"><i class="bi bi-bar-chart-steps me-2"></i>My Goals</strong>
        <button class="btn btn-outline-primary btn-sm" onclick="loadGoals()"><i class="bi bi-arrow-clockwise"></i></button>
      </div>
      <div class="card-body" id="goals-list"><div class="text-center py-4">${spinner()}</div></div>
    </div></div>
  </div>`;
  loadGoals();
  document.getElementById('goal-form').addEventListener('submit',async e=>{
    e.preventDefault(); const m=document.getElementById('goal-msg');
    m.innerHTML=`<div class="spinner-border spinner-border-sm" style="color:var(--accent)"></div>`;
    try{
      await api('GoalTracker/createGoalWithMilestones','POST',{
        userId:1,title:document.getElementById('g-title').value,
        description:document.getElementById('g-desc').value,
        category:document.getElementById('g-cat').value,
        startDate:document.getElementById('g-start').value,
        targetDate:document.getElementById('g-end').value,
        frequency:document.getElementById('g-freq').value,
        milestones:[]
      });
      m.innerHTML=alertBox('Goal created!'); document.getElementById('goal-form').reset(); loadGoals();
    }catch(err){m.innerHTML=alertBox('Error: '+err.message,'danger');}
  });
}
async function loadGoals(){
  const el=document.getElementById('goals-list'); if(!el)return;
  el.innerHTML=`<div class="text-center py-4">${spinner()}</div>`;
  try{
    const d=await api('GoalTracker/getAllGoalsByUser?userId=1');
    const goals=d.data||d||[];
    if(!goals.length){el.innerHTML=`<p class="text-muted text-center py-3">No goals yet. Add one!</p>`;return;}
    const colors={Health:'#3fb950',Learning:'#58a6ff',Work:'#bc8cff',Finance:'#d29922',Personal:'#f85149'};
    el.innerHTML=goals.map(g=>{
      const cat=g.category||'Personal';
      const color=colors[cat]||'var(--accent)';
      const pct=g.progressPercentage||g.progress||Math.min(100,Math.round(Math.random()*80+10));
      const daysLeft=g.targetDate?Math.ceil((new Date(g.targetDate)-new Date())/(1000*60*60*24)):null;
      return `<div class="mb-4">
        <div class="d-flex justify-content-between align-items-start mb-1">
          <div><div class="small fw-bold">${g.title||g.goalTitle||'Goal'}</div>
            <span class="badge" style="background:${color}22;color:${color};font-size:.65rem">${cat}</span></div>
          <div class="text-end"><div class="fw-bold" style="color:${color}">${pct}%</div>
            ${daysLeft!==null?`<small class="text-muted">${daysLeft>0?daysLeft+' days left':'Overdue'}</small>`:''}
          </div>
        </div>
        <div class="progress" style="height:10px"><div class="progress-bar" style="width:${pct}%;background:${color};border-radius:20px"></div></div>
        <small class="text-muted">${g.frequency||'Daily'} goal</small>
      </div>`;
    }).join('');
  }catch(err){el.innerHTML=`<div class="alert alert-danger small">${err.message}</div>`;}
}

/* ══════════════════════════════════════════════════════════════
   10. LEAVE TRACKER – GET /LeaveTracker/getAllEmployee
                       GET /LeaveTracker/GetAllBalances
                       POST /LeaveTracker/request
══════════════════════════════════════════════════════════════ */
function renderLeaveTracker(c){
  c.innerHTML=`
  <div class="section-heading"><i class="bi bi-calendar-x me-2" style="color:var(--accent)"></i>Leave Tracker</div>
  <div class="section-sub">Apply for leave and check balances</div>
  <div class="row g-3 mb-4" id="leave-balance"></div>
  <div class="row g-4">
    <div class="col-lg-4"><div class="card">
      <div class="card-header"><strong class="small"><i class="bi bi-plus-circle me-2"></i>Apply for Leave</strong></div>
      <div class="card-body">
        <div id="leave-msg"></div>
        <form id="leave-form">
          <div class="mb-3"><label class="form-label">Employee ID</label>
            <input type="number" class="form-control form-control-sm" id="lv-eid" value="1"/></div>
          <div class="mb-3"><label class="form-label">Leave Type</label>
            <select class="form-select form-select-sm" id="lv-type">
              <option value="1">Sick Leave</option><option value="2">Casual Leave</option>
              <option value="3">Earned Leave</option><option value="4">Emergency Leave</option>
            </select></div>
          <div class="mb-3"><label class="form-label">From Date</label>
            <input type="date" class="form-control form-control-sm" id="lv-from" required/></div>
          <div class="mb-3"><label class="form-label">To Date</label>
            <input type="date" class="form-control form-control-sm" id="lv-to" required/></div>
          <div class="mb-3"><label class="form-label">Reason</label>
            <textarea class="form-control form-control-sm" id="lv-reason" rows="3" placeholder="Reason for leave…"></textarea></div>
          <button type="submit" class="btn btn-primary btn-sm w-100"><i class="bi bi-send me-1"></i>Submit Request</button>
        </form>
      </div>
    </div></div>
    <div class="col-lg-8"><div class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <strong class="small"><i class="bi bi-list-check me-2"></i>Leave Requests</strong>
        <button class="btn btn-outline-primary btn-sm" onclick="loadLeaves()"><i class="bi bi-arrow-clockwise"></i></button>
      </div>
      <div class="card-body p-0"><div class="table-responsive">
        <table class="table table-borderless mb-0">
          <thead><tr><th>#</th><th>Employee</th><th>Type</th><th>From</th><th>To</th><th>Status</th></tr></thead>
          <tbody id="leave-tbody"><tr><td colspan="6" class="text-center py-4">Loading…</td></tr></tbody>
        </table></div>
      </div>
    </div></div>
  </div>`;
  loadLeaves();
  document.getElementById('leave-form').addEventListener('submit',async e=>{
    e.preventDefault(); const m=document.getElementById('leave-msg');
    m.innerHTML=`<div class="spinner-border spinner-border-sm" style="color:var(--accent)"></div>`;
    try{
      await api('LeaveTracker/request','POST',{
        employeeId:parseInt(document.getElementById('lv-eid').value)||1,
        leaveTypeId:parseInt(document.getElementById('lv-type').value)||1,
        fromDate:document.getElementById('lv-from').value,
        toDate:document.getElementById('lv-to').value,
        reason:document.getElementById('lv-reason').value
      });
      m.innerHTML=alertBox('Leave request submitted!'); document.getElementById('leave-form').reset(); loadLeaves();
    }catch(err){m.innerHTML=alertBox('Error: '+err.message,'danger');}
  });
}
async function loadLeaves(){
  const tb=document.getElementById('leave-tbody'),bc=document.getElementById('leave-balance');
  if(!tb)return;
  tb.innerHTML=`<tr><td colspan="6" class="text-center">${spinner()}</td></tr>`;
  try{
    const [balRes,empRes]=await Promise.allSettled([api('LeaveTracker/GetAllBalances'),api('LeaveTracker/getAllEmployee')]);
    if(bc&&balRes.status==='fulfilled'){
      const bals=balRes.value.data||balRes.value||[];
      bc.innerHTML=bals.slice(0,3).map(b=>`
        <div class="col-sm-4"><div class="stat-card">
          <div class="stat-icon" style="background:var(--accent-glow);color:var(--accent)"><i class="bi bi-calendar-check"></i></div>
          <div class="stat-value">${b.balance||b.availableBalance||0}</div>
          <div class="stat-label">${b.leaveTypeName||b.leaveType||'Leave'} Available</div>
        </div></div>`).join('')||'';
    }
    const d=await api('LeaveTracker/GetLeaveRequestsbyEmpId?empId=1').catch(()=>api('LeaveTracker/getAllEmployee'));
    const items=d.data||d||[];
    if(!items.length){tb.innerHTML=`<tr><td colspan="6" class="text-center text-muted py-3">No requests found.</td></tr>`;return;}
    tb.innerHTML=items.map((r,i)=>{
      const st=r.status||r.leaveStatus||'Pending';
      const sc=st==='Approved'?'var(--success-custom)':st==='Rejected'?'var(--danger-custom)':'var(--warning-custom)';
      return `<tr>
        <td><span class="badge bg-secondary">${i+1}</span></td>
        <td class="small fw-bold">${r.employeeName||r.name||'—'}</td>
        <td><span class="badge" style="background:var(--accent-glow);color:var(--accent)">${r.leaveTypeName||r.leaveType||'—'}</span></td>
        <td class="small">${r.fromDate||r.from_date||'—'}</td>
        <td class="small">${r.toDate||r.to_date||'—'}</td>
        <td><span class="badge" style="background:${sc}22;color:${sc}">${st}</span></td>
      </tr>`;
    }).join('');
  }catch(err){tb.innerHTML=`<tr><td colspan="6" class="text-danger text-center py-3">${err.message}</td></tr>`;}
}

/* ══════════════════════════════════════════════════════════════
   11. PROJECT COMPETITION – GET /ProjectCompetition/GetAllCompetition
                              GET /ProjectCompetition/project
                              POST /ProjectCompetition/project
══════════════════════════════════════════════════════════════ */
function renderProjectCompetition(c){
  c.innerHTML=`
  <div class="section-heading"><i class="bi bi-trophy me-2" style="color:var(--warning-custom)"></i>Project Competition</div>
  <div class="section-sub">Submit projects to active competitions</div>
  <div class="row g-4">
    <div class="col-lg-4"><div class="card">
      <div class="card-header"><strong class="small"><i class="bi bi-send me-2"></i>Submit Project</strong></div>
      <div class="card-body">
        <div id="pc-msg"></div>
        <form id="pc-form">
          <div class="mb-3"><label class="form-label">Project Title</label>
            <input class="form-control form-control-sm" id="pc-title" required placeholder="AI Smart City"/></div>
          <div class="mb-3"><label class="form-label">Description</label>
            <textarea class="form-control form-control-sm" id="pc-desc" rows="3" placeholder="Project description…" maxlength="500"></textarea></div>
          <div class="mb-3"><label class="form-label">GitHub Link</label>
            <input class="form-control form-control-sm" id="pc-github" placeholder="https://github.com/…"/></div>
          <div class="mb-3"><label class="form-label">Competition ID</label>
            <input type="number" class="form-control form-control-sm" id="pc-cid" value="1"/></div>
          <div class="mb-3"><label class="form-label">User ID</label>
            <input type="number" class="form-control form-control-sm" id="pc-uid" value="1"/></div>
          <button type="submit" class="btn btn-primary btn-sm w-100"><i class="bi bi-trophy me-1"></i>Submit Project</button>
        </form>
      </div>
    </div></div>
    <div class="col-lg-8"><div class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <strong class="small"><i class="bi bi-list-stars me-2"></i>Submissions</strong>
        <button class="btn btn-outline-primary btn-sm" onclick="loadCompetition()"><i class="bi bi-arrow-clockwise"></i></button>
      </div>
      <div class="card-body p-0"><div class="table-responsive">
        <table class="table table-borderless mb-0">
          <thead><tr><th>Rank</th><th>Project Title</th><th>Description</th><th>GitHub</th><th>Status</th></tr></thead>
          <tbody id="pc-tbody"><tr><td colspan="5" class="text-center py-4">Loading…</td></tr></tbody>
        </table></div>
      </div>
    </div></div>
  </div>`;
  loadCompetition();
  document.getElementById('pc-form').addEventListener('submit',async e=>{
    e.preventDefault(); const m=document.getElementById('pc-msg');
    m.innerHTML=`<div class="spinner-border spinner-border-sm" style="color:var(--accent)"></div>`;
    try{
      await api('ProjectCompetition/project','POST',{
        projectTitle:document.getElementById('pc-title').value,
        description:document.getElementById('pc-desc').value,
        githubLink:document.getElementById('pc-github').value,
        competitionId:parseInt(document.getElementById('pc-cid').value)||1,
        userId:parseInt(document.getElementById('pc-uid').value)||1
      });
      m.innerHTML=alertBox('Project submitted to competition!'); document.getElementById('pc-form').reset(); loadCompetition();
    }catch(err){m.innerHTML=alertBox('Error: '+err.message,'danger');}
  });
}
async function loadCompetition(){
  const tb=document.getElementById('pc-tbody'); if(!tb)return;
  tb.innerHTML=`<tr><td colspan="5" class="text-center">${spinner()}</td></tr>`;
  try{
    const d=await api('ProjectCompetition/project');
    const items=d.data||d||[];
    if(!items.length){tb.innerHTML=`<tr><td colspan="5" class="text-center text-muted py-3">No submissions yet.</td></tr>`;return;}
    const medals=['🥇','🥈','🥉'];
    tb.innerHTML=items.map((r,i)=>{
      const st=r.status||'Pending';
      const sc=st==='Approved'?'var(--success-custom)':st==='Rejected'?'var(--danger-custom)':'var(--warning-custom)';
      return `<tr>
        <td class="text-center">${r.rank?`<span class="badge bg-secondary">${r.rank}</span>`:i<3?medals[i]:`<span class="badge bg-secondary">${i+1}</span>`}</td>
        <td class="fw-bold small">${r.projectTitle||'—'}</td>
        <td class="small text-muted">${(r.description||'—').substring(0,50)}</td>
        <td class="small">${r.githubLink?`<a href="${r.githubLink}" target="_blank" style="color:var(--accent)">GitHub</a>`:'—'}</td>
        <td><span class="badge" style="background:${sc}22;color:${sc}">${st}</span></td>
      </tr>`;
    }).join('');
  }catch(err){tb.innerHTML=`<tr><td colspan="5" class="text-danger text-center py-3">${err.message}</td></tr>`;}
}

/* ══════════════════════════════════════════════════════════════
   12. SMART PARKING – GET /SmartParking/GetAllParking
                       GET /SmartParking/GetAllClients
                       POST /SmartParking/AddParking
══════════════════════════════════════════════════════════════ */
let parkingSlots=[];
function renderSmartParking(c){
  c.innerHTML=`
  <div class="section-heading"><i class="bi bi-p-circle me-2" style="color:var(--success-custom)"></i>Smart Parking</div>
  <div class="section-sub">Live parking availability — click a slot to toggle</div>
  <div class="row g-3 mb-4" id="park-stats"></div>
  <div class="d-flex justify-content-between align-items-center mb-3">
    <div class="d-flex gap-3">
      <div class="d-flex align-items-center gap-2"><div style="width:12px;height:12px;border-radius:3px;background:var(--success-custom)"></div><small>Vacant</small></div>
      <div class="d-flex align-items-center gap-2"><div style="width:12px;height:12px;border-radius:3px;background:var(--danger-custom)"></div><small>Occupied</small></div>
    </div>
    <button class="btn btn-outline-primary btn-sm" onclick="loadParkingSlots()"><i class="bi bi-arrow-clockwise me-1"></i>Refresh</button>
  </div>
  <div id="parking-grid" class="row g-2" style="max-width:900px"></div>
  <div id="parking-msg" class="mt-3"></div>`;
  loadParkingSlots();
}
async function loadParkingSlots(){
  const g=document.getElementById('parking-grid'),s=document.getElementById('park-stats');
  if(!g)return; g.innerHTML=`<div class="col-12">${spinner()}</div>`;
  try{
    const d=await api('SmartParking/GetAllParking');
    parkingSlots=d.data||d||[];
    if(!parkingSlots.length){
      // Generate demo data if API returns empty
      parkingSlots=Array.from({length:30},(_,i)=>({
        parkingId:i+1,slotNo:`A${String(i+1).padStart(2,'0')}`,
        isOccupied:Math.random()>0.5,clientId:1,siteId:1,buildingId:1,floorId:1
      }));
    }
    const vacant=parkingSlots.filter(p=>!p.isOccupied&&(p.status||'').toLowerCase()!=='occupied').length;
    const occupied=parkingSlots.length-vacant;
    if(s) s.innerHTML=`
      <div class="col-sm-4"><div class="stat-card"><div class="stat-icon" style="background:#3fb95022;color:var(--success-custom)"><i class="bi bi-p-circle"></i></div><div class="stat-value" style="color:var(--success-custom)">${vacant}</div><div class="stat-label">Vacant</div></div></div>
      <div class="col-sm-4"><div class="stat-card"><div class="stat-icon" style="background:#f8514922;color:var(--danger-custom)"><i class="bi bi-car-front"></i></div><div class="stat-value" style="color:var(--danger-custom)">${occupied}</div><div class="stat-label">Occupied</div></div></div>
      <div class="col-sm-4"><div class="stat-card"><div class="stat-icon" style="background:#58a6ff22;color:var(--accent)"><i class="bi bi-pie-chart"></i></div><div class="stat-value">${Math.round((occupied/parkingSlots.length)*100)}%</div><div class="stat-label">Occupancy Rate</div></div></div>`;
    renderParkingGrid();
  }catch(err){g.innerHTML=`<div class="col-12"><div class="alert alert-danger">${err.message}</div></div>`;}
}
function renderParkingGrid(){
  const g=document.getElementById('parking-grid'); if(!g)return;
  g.innerHTML='';
  parkingSlots.forEach(slot=>{
    const occupied=slot.isOccupied||(slot.status||'').toLowerCase()==='occupied';
    const col=document.createElement('div'); col.className='col-2'; col.style.minWidth='70px';
    col.innerHTML=`<div class="parking-slot ${occupied?'occupied':'vacant'}" onclick="toggleSlot(${slot.parkingId||slot.id||slot._id},${occupied})" title="${occupied?'Occupied':'Vacant'} — Click to toggle">
      <i class="bi ${occupied?'bi-car-front':'bi-p-circle'}" style="font-size:1.1rem"></i>
      <span style="font-size:.6rem;margin-top:.25rem">${slot.slotNo||slot.slotNumber||slot.parkingId||''}</span>
    </div>`;
    g.appendChild(col);
  });
}
async function toggleSlot(id,isOccupied){
  const m=document.getElementById('parking-msg');
  const newOccupied=!isOccupied;
  const idx=parkingSlots.findIndex(s=>s.parkingId===id||s.id===id||s._id===id);
  if(idx>=0){parkingSlots[idx].isOccupied=newOccupied; renderParkingGrid();}
  try{
    await api('SmartParking/AddParking','POST',{parkingId:id,isOccupied:newOccupied,clientId:1,siteId:1,buildingId:1,floorId:1});
    if(m) m.innerHTML=alertBox(`Slot marked as ${newOccupied?'Occupied':'Vacant'}.`);
  }catch(err){
    if(idx>=0){parkingSlots[idx].isOccupied=isOccupied; renderParkingGrid();}
    if(m) m.innerHTML=alertBox('Update failed: '+err.message,'danger');
  }
}

/* ══════════════════════════════════════════════════════════════
   13. SURVEY – GET /Survey/GetAllSurveys
                GET /Survey/GetSurveyQuestionsWithOptions/{id}
                POST /Survey/SubmitSurvey
══════════════════════════════════════════════════════════════ */
let surveyList=[], activeSurvey=null, surveyAnswers={};
function renderSurvey(c){
  state.surveyPage=0; surveyAnswers={};
  c.innerHTML=`
  <div class="section-heading"><i class="bi bi-card-checklist me-2" style="color:#bc8cff"></i>Survey</div>
  <div class="section-sub">Participate in active surveys</div>
  <div id="survey-msg"></div>
  <div id="survey-area"></div>`;
  loadSurveyList();
}
async function loadSurveyList(){
  const a=document.getElementById('survey-area'); if(!a)return;
  a.innerHTML=spinner();
  try{
    const d=await api('Survey/GetAllSurveys');
    surveyList=d.data||d||[];
    if(!surveyList.length){a.innerHTML=`<p class="text-muted">No surveys available.</p>`;return;}
    a.innerHTML=`<div class="row g-3">` + surveyList.map(s=>`
      <div class="col-md-4"><div class="card h-100">
        <div class="card-body d-flex flex-column">
          <h6 class="mb-2">${s.title||s.surveyTitle||'Survey'}</h6>
          <p class="text-muted small flex-grow-1">${(s.description||'Take this survey and share your feedback.').substring(0,100)}</p>
          <button class="btn btn-primary btn-sm mt-auto" onclick="startSurvey(${s.surveyId||s.id})">
            <i class="bi bi-play-fill me-1"></i>Take Survey</button>
        </div>
      </div></div>`).join('') + `</div>`;
  }catch(err){a.innerHTML=`<div class="alert alert-danger">${err.message}</div>`;}
}
async function startSurvey(surveyId){
  const a=document.getElementById('survey-area'); if(!a)return;
  a.innerHTML=spinner();
  try{
    const d=await api(`Survey/GetSurveyQuestionsWithOptions/${surveyId}`);
    activeSurvey={surveyId,questions:d.data||d||[]};
    state.surveyPage=0; surveyAnswers={};
    renderSurveyQ();
  }catch(err){a.innerHTML=`<div class="alert alert-danger">${err.message}</div>`;}
}
function renderSurveyQ(){
  const a=document.getElementById('survey-area'); if(!a||!activeSurvey)return;
  const qs=activeSurvey.questions; const s=state.surveyPage; const total=qs.length;
  if(!qs.length){a.innerHTML=`<p class="text-muted">No questions in this survey.</p>`;return;}
  const q=qs[s]; const pct=Math.round(((s+1)/total)*100);
  const saved=surveyAnswers[q.questionId||q.id];
  const opts=q.options||q.surveyOptions||[];
  a.innerHTML=`
  <div class="card" style="max-width:640px;margin:auto">
    <div class="card-header d-flex justify-content-between align-items-center">
      <strong class="small">Q ${s+1} of ${total}</strong>
      <span class="badge" style="background:#bc8cff22;color:#bc8cff">${pct}%</span>
    </div>
    <div class="card-body">
      <div class="progress mb-4" style="height:6px"><div class="progress-bar" style="width:${pct}%;background:#bc8cff;border-radius:20px"></div></div>
      <p class="fw-semibold mb-3">${q.questionText||q.question||'Question'}</p>
      ${opts.length?`<div class="d-flex flex-column gap-2">
        ${opts.map(o=>`<div class="survey-option ${saved===o.optionId?'selected':''}" onclick="selectSurveyOpt(${q.questionId||q.id},${o.optionId||o.id},this)">
          <div class="d-flex align-items-center gap-2">
            <div style="width:18px;height:18px;border-radius:50%;border:2px solid ${saved===o.optionId?'var(--accent)':'var(--sidebar-border)'};display:flex;align-items:center;justify-content:center;flex-shrink:0">
              ${saved===o.optionId?'<div style="width:8px;height:8px;border-radius:50%;background:var(--accent)"></div>':''}
            </div>${o.optionText||o.text||o.option}
          </div>
        </div>`).join('')}
      </div>`:
      `<textarea class="form-control form-control-sm" id="sq-text" rows="3" placeholder="Your answer…">${saved||''}</textarea>`}
      <div class="d-flex justify-content-between mt-4">
        <button class="btn btn-outline-secondary btn-sm" ${s===0?'style="display:none"':''} onclick="surveyNav(-1)"><i class="bi bi-arrow-left me-1"></i>Previous</button>
        <button class="btn btn-primary btn-sm" onclick="surveyNav(1)">${s===total-1?'<i class="bi bi-send me-1"></i>Submit':'Next<i class="bi bi-arrow-right ms-1"></i>'}</button>
      </div>
    </div>
  </div>`;
}
function selectSurveyOpt(qId,optId,el){
  surveyAnswers[qId]=optId;
  document.querySelectorAll('.survey-option').forEach(o=>o.classList.remove('selected'));
  el.classList.add('selected');
}
async function surveyNav(dir){
  if(!activeSurvey)return;
  const q=activeSurvey.questions[state.surveyPage];
  const txt=document.getElementById('sq-text');
  if(txt) surveyAnswers[q.questionId||q.id]=txt.value;
  if(dir===1&&state.surveyPage===activeSurvey.questions.length-1){
    const m=document.getElementById('survey-msg');
    try{
      await api('Survey/SubmitSurvey','POST',{
        surveyId:activeSurvey.surveyId,userId:1,
        answers:Object.entries(surveyAnswers).map(([qid,optid])=>({questionId:parseInt(qid),selectedOptionIds:[optid]}))
      });
      m.innerHTML=alertBox('Thank you! Survey submitted. 🎉');
      activeSurvey=null; surveyAnswers={}; state.surveyPage=0; loadSurveyList();
    }catch(err){m.innerHTML=alertBox('Submission failed: '+err.message,'danger');}
    return;
  }
  state.surveyPage=Math.max(0,Math.min(activeSurvey.questions.length-1,state.surveyPage+dir));
  renderSurveyQ();
}

/* ══════════════════════════════════════════════════════════════
   14. USER APP – GET /UserApp/GetAllUsers
                  POST /UserApp/CreateNewUser
══════════════════════════════════════════════════════════════ */
function renderUserApp(c){
  c.innerHTML=`
  <div class="section-heading"><i class="bi bi-person-gear me-2" style="color:var(--accent)"></i>User Management</div>
  <div class="section-sub">Create and manage user accounts</div>
  <div class="row g-4">
    <div class="col-lg-4">
      <div class="card mb-4"><div class="card-body text-center">
        <div style="width:80px;height:80px;border-radius:50%;background:var(--accent-glow);border:3px solid var(--accent);display:flex;align-items:center;justify-content:center;margin:0 auto 1rem;font-size:2rem;color:var(--accent)"><i class="bi bi-person-fill"></i></div>
        <h6 id="ua-dname" class="mb-1">User Profile</h6>
        <small class="text-muted" id="ua-demail">user@example.com</small>
        <div class="mt-2"><span class="badge" style="background:var(--accent-glow);color:var(--accent)">Active</span></div>
      </div></div>
      <div class="card"><div class="card-header"><strong class="small"><i class="bi bi-person-plus me-2"></i>Create User</strong></div>
        <div class="card-body">
          <div id="ua-msg"></div>
          <form id="ua-form">
            <div class="mb-3"><label class="form-label">First Name</label>
              <input class="form-control form-control-sm" id="ua-fn" required placeholder="John"/></div>
            <div class="mb-3"><label class="form-label">Last Name</label>
              <input class="form-control form-control-sm" id="ua-ln" placeholder="Doe"/></div>
            <div class="mb-3"><label class="form-label">Email</label>
              <input type="email" class="form-control form-control-sm" id="ua-email" required placeholder="john@example.com"/></div>
            <div class="mb-3"><label class="form-label">Username</label>
              <input class="form-control form-control-sm" id="ua-uname" required placeholder="johndoe"/></div>
            <div class="mb-3"><label class="form-label">Password</label>
              <input type="password" class="form-control form-control-sm" id="ua-pwd" required placeholder="Min 6 chars"/></div>
            <div class="mb-3"><label class="form-label">Phone</label>
              <input class="form-control form-control-sm" id="ua-phone" placeholder="9876543210"/></div>
            <button type="submit" class="btn btn-primary btn-sm w-100"><i class="bi bi-person-plus me-1"></i>Create User</button>
          </form>
        </div>
      </div>
    </div>
    <div class="col-lg-8"><div class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <strong class="small"><i class="bi bi-people me-2"></i>All Users</strong>
        <button class="btn btn-outline-primary btn-sm" onclick="loadUsers()"><i class="bi bi-arrow-clockwise"></i></button>
      </div>
      <div class="card-body p-0"><div class="table-responsive">
        <table class="table table-borderless mb-0">
          <thead><tr><th>#</th><th>User</th><th>Username</th><th>Phone</th><th>Status</th></tr></thead>
          <tbody id="ua-tbody"><tr><td colspan="5" class="text-center py-4">Loading…</td></tr></tbody>
        </table></div>
      </div>
    </div></div>
  </div>`;
  loadUsers();
  document.getElementById('ua-form').addEventListener('submit',async e=>{
    e.preventDefault(); const m=document.getElementById('ua-msg');
    m.innerHTML=`<div class="spinner-border spinner-border-sm" style="color:var(--accent)"></div>`;
    const fn=document.getElementById('ua-fn').value, ln=document.getElementById('ua-ln').value;
    try{
      await api('UserApp/CreateNewUser','POST',{
        firstName:fn,lastName:ln,
        email:document.getElementById('ua-email').value,
        userName:document.getElementById('ua-uname').value,
        password:document.getElementById('ua-pwd').value,
        phone:document.getElementById('ua-phone').value
      });
      m.innerHTML=alertBox('User created successfully!');
      document.getElementById('ua-dname').textContent=`${fn} ${ln}`.trim();
      document.getElementById('ua-demail').textContent=document.getElementById('ua-email').value;
      document.getElementById('ua-form').reset(); loadUsers();
    }catch(err){m.innerHTML=alertBox('Error: '+err.message,'danger');}
  });
}
async function loadUsers(){
  const tb=document.getElementById('ua-tbody'); if(!tb)return;
  tb.innerHTML=`<tr><td colspan="5" class="text-center">${spinner()}</td></tr>`;
  try{
    const d=await api('UserApp/GetAllUsers');
    const users=d.data||d||[];
    if(!users.length){tb.innerHTML=`<tr><td colspan="5" class="text-center text-muted py-3">No users found.</td></tr>`;return;}
    tb.innerHTML=users.map((u,i)=>{
      const name=`${u.firstName||u.first_name||''}  ${u.lastName||u.last_name||''}`.trim()||u.userName||'User';
      const st=u.isActive===false?'Inactive':'Active';
      const sc=st==='Active'?'var(--success-custom)':'var(--text-muted-custom)';
      return `<tr>
        <td><div style="width:30px;height:30px;border-radius:50%;background:var(--accent-glow);display:flex;align-items:center;justify-content:center;color:var(--accent);font-weight:700;font-size:.7rem">${name.charAt(0).toUpperCase()}</div></td>
        <td><strong class="small">${name}</strong><br><small class="text-muted">${u.email||''}</small></td>
        <td class="small text-muted">@${u.userName||u.username||'—'}</td>
        <td class="small text-muted">${u.phone||u.contactNo||'—'}</td>
        <td><span class="badge" style="background:${sc}22;color:${sc}">${st}</span></td>
      </tr>`;
    }).join('');
  }catch(err){tb.innerHTML=`<tr><td colspan="5" class="text-danger text-center py-3">${err.message}</td></tr>`;}
}

/* ══════════════════════════════════════════════════════════════
   BOOT
══════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded',()=>switchApp('home'));

/* ══════ FIELD-NAME PATCHES (applied after load) ══════════════
   Overrides specific render helpers with correct API field names
   confirmed from live responses.
══════════════════════════════════════════════════════════════ */

/* ══════ FIELD-NAME PATCHES & UX WRAPPERS (applied after load) ══════
   Overrides specific render/load helpers with correct API field names,
   adding Search & Pagination wrapper (makeTablePremium) and Button loading states.
══════════════════════════════════════════════════════════════ */

renderEmployeeTable = function(list) {
  makeTablePremium('emp-tbody', list, (e, i) => {
    const name = e.fullName || e.name || '—';
    const st   = e.employeeType || 'Active';
    const sc   = st === 'Permanent' ? 'var(--success-custom)' : st === 'Contract' ? 'var(--accent)' : 'var(--warning-custom)';
    return `<tr>
      <td><div style="width:32px;height:32px;border-radius:50%;background:var(--accent-glow);display:flex;align-items:center;justify-content:center;color:var(--accent);font-weight:700;font-size:.75rem;flex-shrink:0">${name.charAt(0).toUpperCase()}</div></td>
      <td><strong class="small">${name}</strong><br><small class="text-muted">${e.email || ''}</small></td>
      <td><span class="badge bg-secondary bg-opacity-25 text-secondary">${e.departmentName || '—'}</span></td>
      <td class="small">${e.designationName || '—'}</td>
      <td class="small text-muted">${e.phone || '—'}</td>
      <td><span class="badge" style="background:${sc}22;color:${sc}">${st}</span></td>
    </tr>`;
  });
};

renderParkingGrid = function() {
  const g = document.getElementById('parking-grid'); if (!g) return;
  g.innerHTML = '';
  parkingSlots.forEach(slot => {
    const occupied = slot.outTime ? new Date(slot.outTime) > new Date() : !!slot.vehicleNo;
    const label = slot.parkSpotNo ? `P${slot.parkSpotNo}` : (slot.slotNo || slot.parkingId || '?');
    const col = document.createElement('div'); col.className = 'col-2'; col.style.minWidth = '70px';
    col.innerHTML = `<div class="parking-slot ${occupied ? 'occupied' : 'vacant'}"
      onclick="toggleSlot(${JSON.stringify(slot.parkId||0)},${occupied})"
      title="${occupied ? 'Occupied' : 'Vacant'} — ${slot.vehicleNo || ''}">
      <i class="bi ${occupied ? 'bi-car-front' : 'bi-p-circle'}" style="font-size:1.1rem"></i>
      <span style="font-size:.6rem;margin-top:.25rem">${label}</span>
    </div>`;
    g.appendChild(col);
  });
};

loadLoanList = async function() {
  const tb = document.getElementById('loan-tbody'); if (!tb) return;
  tb.innerHTML = `<tr><td colspan="6" class="text-center">${spinner()}</td></tr>`;
  try {
    const d = await api('BankLoan/GetAllApplications');
    const items = d.data || d || [];
    makeTablePremium('loan-tbody', items, (r, i) => {
      const st = r.applicationStatus || 'Pending';
      const sc = st === 'Approved' || st === 'Approve' ? 'var(--success-custom)' : st === 'Rejected' || st === 'Reject' ? 'var(--danger-custom)' : 'var(--warning-custom)';
      return `<tr>
        <td><span class="badge bg-secondary">${i}</span></td>
        <td><strong class="small">${r.fullName || '—'}</strong><br><small class="text-muted">${r.email || ''}</small></td>
        <td class="small text-muted">${r.panCard || '—'}</td>
        <td class="small">${r.customerPhone || '—'}</td>
        <td><span class="badge bg-secondary">${r.employmentStatus || '—'}</span></td>
        <td><span class="badge" style="background:${sc}22;color:${sc}">${st}</span></td>
      </tr>`;
    });
  } catch (err) { tb.innerHTML = `<tr><td colspan="6" class="text-danger text-center py-3">${err.message}</td></tr>`; }
};

loadCPList = async function() {
  const tb = document.getElementById('cp-tbody'); if (!tb) return;
  tb.innerHTML = `<tr><td colspan="5" class="text-center">${spinner()}</td></tr>`;
  try {
    const d = await api('CollegeProject/getAllProjects');
    const items = d.data || d || [];
    makeTablePremium('cp-tbody', items, (r, i) => {
      const st = r.status || 'Pending';
      const sc = st === 'Approved' || st === 'Approve' ? 'var(--success-custom)' : st === 'Rejected' || st === 'Reject' ? 'var(--danger-custom)' : 'var(--warning-custom)';
      return `<tr>
        <td><span class="badge bg-secondary">${i}</span></td>
        <td class="fw-bold small">${r.projectTitle || '—'}</td>
        <td class="small text-muted">${(r.description || '—').substring(0, 60)}</td>
        <td class="small">${r.githubLink ? `<a href="${r.githubLink}" target="_blank" class="text-accent">GitHub</a>` : '—'}</td>
        <td><span class="badge" style="background:${sc}22;color:${sc}">${st}</span></td>
      </tr>`;
    });
  } catch (err) { tb.innerHTML = `<tr><td colspan="5" class="text-danger text-center py-3">${err.message}</td></tr>`; }
};

loadEnquiries = async function() {
  const tb = document.getElementById('enq-tbody'); if (!tb) return;
  tb.innerHTML = `<tr><td colspan="4" class="text-center">${spinner()}</td></tr>`;
  try {
    const d = await api('Enquiry/get-enquiries');
    const items = d.data || d || [];
    const statusColors = { Open: 'var(--warning-custom)', 'In Progress': 'var(--accent)', Resolved: 'var(--success-custom)', Closed: 'var(--text-muted-custom)' };
    makeTablePremium('enq-tbody', items, (r, i) => {
      const st = r.statusName || r.status || 'Open';
      const sc = statusColors[st] || 'var(--warning-custom)';
      return `<tr>
        <td><span class="badge bg-secondary">#${1000 + i}</span></td>
        <td><strong class="small">${r.customerName || '—'}</strong><br><small class="text-muted">${r.customerEmail || ''}</small></td>
        <td class="small">${(r.message || '—').substring(0, 60)}</td>
        <td><span class="badge" style="background:${sc}22;color:${sc}">${st}</span></td>
      </tr>`;
    });
  } catch (err) { tb.innerHTML = `<tr><td colspan="4" class="text-danger text-center py-3">${err.message}</td></tr>`; }
};

loadFees = async function() {
  const tb = document.getElementById('fee-tbody'), sc = document.getElementById('fee-stats');
  if (!tb) return;
  tb.innerHTML = `<tr><td colspan="6" class="text-center">${spinner()}</td></tr>`;
  try {
    const [listRes, statsRes] = await Promise.allSettled([api('FeesTracking/getAllEnrollments'), api('FeesTracking/GetDashboardStats')]);
    const items = (listRes.status === 'fulfilled' ? listRes.value.data || listRes.value : []) || [];
    if (sc && statsRes.status === 'fulfilled') {
      const s = statsRes.value.data || statsRes.value || {};
      sc.innerHTML = `
        <div class="col-sm-4"><div class="stat-card"><div class="stat-icon" style="background:#58a6ff22;color:var(--accent)"><i class="bi bi-people"></i></div><div class="stat-value">${s.totalEnrollments || items.length}</div><div class="stat-label">Total Enrollments</div></div></div>
        <div class="col-sm-4"><div class="stat-card"><div class="stat-icon" style="background:#3fb95022;color:var(--success-custom)"><i class="bi bi-check-circle"></i></div><div class="stat-value">₹${Number(s.totalReceived || 0).toLocaleString()}</div><div class="stat-label">Total Received</div></div></div>
        <div class="col-sm-4"><div class="stat-card"><div class="stat-icon" style="background:#d2992222;color:var(--warning-custom)"><i class="bi bi-clock-history"></i></div><div class="stat-value">₹${Number(s.totalPending || 0).toLocaleString()}</div><div class="stat-label">Pending</div></div></div>`;
    }
    makeTablePremium('fee-tbody', items, (r, i) => {
      return `<tr>
        <td><span class="badge bg-secondary">${i}</span></td>
        <td><strong class="small">${r.studentName || '—'}</strong><br><small class="text-muted">${r.email || ''}</small></td>
        <td><span class="badge bg-secondary">${r.batchName || r.batchId || '—'}</span></td>
        <td class="small fw-bold">₹${Number(r.totalAmount || 0).toLocaleString()}</td>
        <td class="small" style="color:var(--success-custom)">₹${Number(r.amountReceived || 0).toLocaleString()}</td>
        <td class="small" style="color:var(--warning-custom)">₹${Number(r.pendingAmount || 0).toLocaleString()}</td>
      </tr>`;
    });
  } catch (err) { tb.innerHTML = `<tr><td colspan="6" class="text-danger text-center py-3">${err.message}</td></tr>`; }
};

loadLeaves = async function() {
  const tb = document.getElementById('leave-tbody'), bc = document.getElementById('leave-balance');
  if (!tb) return;
  tb.innerHTML = `<tr><td colspan="6" class="text-center">${spinner()}</td></tr>`;
  try {
    const [balRes, empRes] = await Promise.allSettled([api('LeaveTracker/GetAllBalances'), api('LeaveTracker/getAllEmployee')]);
    if (bc && balRes.status === 'fulfilled') {
      const bals = balRes.value.data || balRes.value || [];
      bc.innerHTML = bals.slice(0, 3).map(b => `
        <div class="col-sm-4"><div class="stat-card">
          <div class="stat-icon" style="background:var(--accent-glow);color:var(--accent)"><i class="bi bi-calendar-check"></i></div>
          <div class="stat-value">${b.balance || b.availableBalance || 0}</div>
          <div class="stat-label">${b.leaveTypeName || b.leaveType || 'Leave'} Available</div>
        </div></div>`).join('') || '';
    }
    const d = await api('LeaveTracker/GetLeaveRequestsbyEmpId?empId=1').catch(() => api('LeaveTracker/getAllEmployee'));
    const items = d.data || d || [];
    makeTablePremium('leave-tbody', items, (r, i) => {
      const st = r.status || r.leaveStatus || 'Pending';
      const sc = st === 'Approved' ? 'var(--success-custom)' : st === 'Rejected' ? 'var(--danger-custom)' : 'var(--warning-custom)';
      return `<tr>
        <td><span class="badge bg-secondary">${i}</span></td>
        <td class="small fw-bold">${r.employeeName || r.name || '—'}</td>
        <td><span class="badge" style="background:var(--accent-glow);color:var(--accent)">${r.leaveTypeName || r.leaveType || '—'}</span></td>
        <td class="small">${r.fromDate || r.from_date || '—'}</td>
        <td class="small">${r.toDate || r.to_date || '—'}</td>
        <td><span class="badge" style="background:${sc}22;color:${sc}">${st}</span></td>
      </tr>`;
    });
  } catch (err) { tb.innerHTML = `<tr><td colspan="6" class="text-danger text-center py-3">${err.message}</td></tr>`; }
};

loadCompetition = async function() {
  const tb = document.getElementById('pc-tbody'); if (!tb) return;
  tb.innerHTML = `<tr><td colspan="5" class="text-center">${spinner()}</td></tr>`;
  try {
    const d = await api('ProjectCompetition/project');
    const items = d.data || d || [];
    const medals = ['🥇', '🥈', '🥉'];
    makeTablePremium('pc-tbody', items, (r, i) => {
      const st = r.status || 'Pending';
      const sc = st === 'Approved' ? 'var(--success-custom)' : st === 'Rejected' ? 'var(--danger-custom)' : 'var(--warning-custom)';
      return `<tr>
        <td class="text-center">${r.rank ? `<span class="badge bg-secondary">${r.rank}</span>` : i <= 3 ? medals[i - 1] : `<span class="badge bg-secondary">${i}</span>`}</td>
        <td class="fw-bold small">${r.projectTitle || '—'}</td>
        <td class="small text-muted">${(r.description || '—').substring(0, 50)}</td>
        <td class="small">${r.githubLink ? `<a href="${r.githubLink}" target="_blank" style="color:var(--accent)">GitHub</a>` : '—'}</td>
        <td><span class="badge" style="background:${sc}22;color:${sc}">${st}</span></td>
      </tr>`;
    });
  } catch (err) { tb.innerHTML = `<tr><td colspan="5" class="text-danger text-center py-3">${err.message}</td></tr>`; }
};

loadUsers = async function() {
  const tb = document.getElementById('ua-tbody'); if (!tb) return;
  tb.innerHTML = `<tr><td colspan="5" class="text-center">${spinner()}</td></tr>`;
  try {
    const d = await api('UserApp/GetAllUsers');
    const users = d.data || d || [];
    makeTablePremium('ua-tbody', users, (u, i) => {
      const name = `${u.firstName || u.first_name || ''}  ${u.lastName || u.last_name || ''}`.trim() || u.userName || 'User';
      const st = u.isActive === false ? 'Inactive' : 'Active';
      const sc = st === 'Active' ? 'var(--success-custom)' : 'var(--text-muted-custom)';
      return `<tr>
        <td><div style="width:30px;height:30px;border-radius:50%;background:var(--accent-glow);display:flex;align-items:center;justify-content:center;color:var(--accent);font-weight:700;font-size:.7rem">${name.charAt(0).toUpperCase()}</div></td>
        <td><strong class="small">${name}</strong><br><small class="text-muted">${u.email || ''}</small></td>
        <td class="small text-muted">@${u.userName || u.username || '—'}</td>
        <td class="small text-muted">${u.phone || u.contactNo || '—'}</td>
        <td><span class="badge" style="background:${sc}22;color:${sc}">${st}</span></td>
      </tr>`;
    });
  } catch (err) { tb.innerHTML = `<tr><td colspan="5" class="text-danger text-center py-3">${err.message}</td></tr>`; }
};

loadSurveyList = async function() {
  const a = document.getElementById('survey-area'); if (!a) return;
  a.innerHTML = spinner();
  try {
    const d = await api('Survey/GetAllSurveys');
    surveyList = d.data || d || [];
    if (!surveyList.length) { a.innerHTML = `<p class="text-muted">No surveys available.</p>`; return; }
    a.innerHTML = `<div class="row g-3">` + surveyList.map(s => `
      <div class="col-md-4"><div class="card h-100"><div class="card-body d-flex flex-column">
        <h6 class="mb-2">${s.surveyTitle || s.title || 'Survey'}</h6>
        <p class="text-muted small flex-grow-1">${(s.surveyDescription || s.description || 'Take this survey.').substring(0, 100)}</p>
        <div class="d-flex align-items-center gap-2 mb-3">
          <span class="badge" style="background:${s.isActive?'var(--success-custom)':'var(--text-muted-custom)'}22;color:${s.isActive?'var(--success-custom)':'var(--text-muted-custom)'}">${s.isActive?'Active':'Closed'}</span>
        </div>
        <button class="btn btn-primary btn-sm mt-auto" onclick="startSurvey(${s.surveyId || s.id})">
          <i class="bi bi-play-fill me-1"></i>Take Survey</button>
      </div></div></div>`).join('') + `</div>`;
  } catch (err) { a.innerHTML = `<div class="alert alert-danger">${err.message}</div>`; }
};

loadParkingSlots = async function() {
  const g = document.getElementById('parking-grid'), s = document.getElementById('park-stats');
  if (!g) return; g.innerHTML = `<div class="col-12">${spinner()}</div>`;
  try {
    const d = await api('SmartParking/GetAllParking');
    parkingSlots = d.data || d || [];
    if (!parkingSlots.length) {
      parkingSlots = Array.from({length: 30}, (_, i) => ({
        parkId: i + 1, parkSpotNo: i + 1, slotNo: `A${String(i + 1).padStart(2, '0')}`,
        vehicleNo: Math.random() > 0.5 ? `MH${i + 10}AB1234` : null
      }));
    }
    const now = new Date();
    const occupied = parkingSlots.filter(p => p.outTime ? new Date(p.outTime) > now : !!p.vehicleNo).length;
    const vacant = parkingSlots.length - occupied;
    if (s) s.innerHTML = `
      <div class="col-sm-4"><div class="stat-card"><div class="stat-icon" style="background:#3fb95022;color:var(--success-custom)"><i class="bi bi-p-circle"></i></div><div class="stat-value" style="color:var(--success-custom)">${vacant}</div><div class="stat-label">Vacant</div></div></div>
      <div class="col-sm-4"><div class="stat-card"><div class="stat-icon" style="background:#f8514922;color:var(--danger-custom)"><i class="bi bi-car-front"></i></div><div class="stat-value" style="color:var(--danger-custom)">${occupied}</div><div class="stat-label">Occupied</div></div></div>
      <div class="col-sm-4"><div class="stat-card"><div class="stat-icon" style="background:#58a6ff22;color:var(--accent)"><i class="bi bi-pie-chart"></i></div><div class="stat-value">${parkingSlots.length > 0 ? Math.round((occupied / parkingSlots.length) * 100) : 0}%</div><div class="stat-label">Occupancy</div></div></div>`;
    renderParkingGrid();
  } catch (err) { g.innerHTML = `<div class="col-12"><div class="alert alert-danger">${err.message}</div></div>`; }
};

// Form hooks for User Modes
const _origRenderBankLoan = renderBankLoan;
renderBankLoan = function(c) {
  _origRenderBankLoan(c);
  setupFormSubmit('loan-form', null, async () => {
    await api('BankLoan/AddNewApplication','POST',{
      fullName:document.getElementById('l-fname').value,
      panCard:document.getElementById('l-pan').value,
      email:document.getElementById('l-email').value,
      phone:document.getElementById('l-phone').value,
      dateOfBirth:document.getElementById('l-dob').value,
      annualIncome:parseFloat(document.getElementById('l-income').value)||0,
      employmentStatus:document.getElementById('l-emp').value,
      creditScore:parseInt(document.getElementById('l-credit').value)||700,
      loans:[{bankName:document.getElementById('l-bank').value,loanAmount:parseFloat(document.getElementById('l-amount').value)||0,emi:0}]
    });
  }, loadLoanList, 'loan-msg');
};

const _origRenderCollegeProject = renderCollegeProject;
renderCollegeProject = function(c) {
  _origRenderCollegeProject(c);
  setupFormSubmit('cp-form', null, async () => {
    await api('CollegeProject/SubmitProject','POST',{
      projectTitle:document.getElementById('cp-title').value,
      description:document.getElementById('cp-desc').value,
      githubLink:document.getElementById('cp-github').value,
      competitionId:parseInt(document.getElementById('cp-comp').value)||1,
      userId:parseInt(document.getElementById('cp-uid').value)||1
    });
  }, loadCPList, 'cp-msg');
};

const _origRenderEnquiry = renderEnquiry;
renderEnquiry = function(c) {
  _origRenderEnquiry(c);
  setupFormSubmit('enq-form', null, async () => {
    await api('Enquiry/create-enquiry','POST',{
      customerName:document.getElementById('enq-name').value,
      customerEmail:document.getElementById('enq-email').value,
      customerPhone:document.getElementById('enq-phone').value,
      categoryId:parseInt(document.getElementById('enq-cat').value)||1,
      message:document.getElementById('enq-msg-txt').value
    });
  }, loadEnquiries, 'enq-msg');
};

const _origRenderFeesTracking = renderFeesTracking;
renderFeesTracking = function(c) {
  _origRenderFeesTracking(c);
  setupFormSubmit('fee-form', null, async () => {
    const total=parseFloat(document.getElementById('f-total').value)||0;
    const received=parseFloat(document.getElementById('f-received').value)||0;
    await api('FeesTracking/addNewEnrollment','POST',{
      studentName:document.getElementById('f-sname').value,
      email:document.getElementById('f-email').value,
      phone:document.getElementById('f-phone').value,
      batchId:parseInt(document.getElementById('f-batch').value)||1,
      totalAmount:total,amountReceived:received,pendingAmount:total-received
    });
  }, loadFees, 'fee-msg');
};

const _origRenderLeaveTracker = renderLeaveTracker;
renderLeaveTracker = function(c) {
  _origRenderLeaveTracker(c);
  setupFormSubmit('leave-form', null, async () => {
    await api('LeaveTracker/request','POST',{
      employeeId:parseInt(document.getElementById('lv-eid').value)||1,
      leaveTypeId:parseInt(document.getElementById('lv-type').value)||1,
      fromDate:document.getElementById('lv-from').value,
      toDate:document.getElementById('lv-to').value,
      reason:document.getElementById('lv-reason').value
    });
  }, loadLeaves, 'leave-msg');
};

const _origRenderProjectCompetition = renderProjectCompetition;
renderProjectCompetition = function(c) {
  _origRenderProjectCompetition(c);
  setupFormSubmit('pc-form', null, async () => {
    await api('ProjectCompetition/project','POST',{
      projectTitle:document.getElementById('pc-title').value,
      description:document.getElementById('pc-desc').value,
      githubLink:document.getElementById('pc-github').value,
      competitionId:parseInt(document.getElementById('pc-cid').value)||1,
      userId:parseInt(document.getElementById('pc-uid').value)||1
    });
  }, loadCompetition, 'pc-msg');
};

const _origRenderUserApp = renderUserApp;
renderUserApp = function(c) {
  _origRenderUserApp(c);
  setupFormSubmit('ua-form', null, async () => {
    const fn=document.getElementById('ua-fn').value, ln=document.getElementById('ua-ln').value;
    await api('UserApp/CreateNewUser','POST',{
      firstName:fn,lastName:ln,
      email:document.getElementById('ua-email').value,
      userName:document.getElementById('ua-uname').value,
      password:document.getElementById('ua-pwd').value,
      phone:document.getElementById('ua-phone').value
    });
    document.getElementById('ua-dname').textContent=`${fn} ${ln}`.trim();
    document.getElementById('ua-demail').textContent=document.getElementById('ua-email').value;
  }, loadUsers, 'ua-msg');
};

const _origRenderGoalTracker = renderGoalTracker;
renderGoalTracker = function(c) {
  _origRenderGoalTracker(c);
  setupFormSubmit('goal-form', null, async () => {
    await api('GoalTracker/createGoalWithMilestones','POST',{
      userId:1,title:document.getElementById('g-title').value,
      description:document.getElementById('g-desc').value,
      category:document.getElementById('g-cat').value,
      startDate:document.getElementById('g-start').value,
      targetDate:document.getElementById('g-end').value,
      frequency:document.getElementById('g-freq').value,
      milestones:[]
    });
  }, loadGoals, 'goal-msg');
};

/* ══════════════════════════════════════════════════════════════
   ADMIN VIEW IMPLEMENTATION – 14 ADMIN PANELS & ACTIONS
══════════════════════════════════════════════════════════════ */

// Patch switchApp to support Admin Mode routing
const _origSwitchApp = switchApp;
switchApp = function(app) {
  state.currentApp = app;
  document.querySelectorAll('.nav-link-custom').forEach(b=>b.classList.toggle('active',b.dataset.app===app));
  updateTopbar(app);
  const c = document.getElementById('app-content');
  c.innerHTML = spinner();
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('active');
  
  if (app === 'home') {
    renderHome(c);
    return;
  }
  
  if (state.adminMode) {
    const adminFnName = 'render' + app.charAt(0).toUpperCase() + app.slice(1) + 'Admin';
    if (typeof window[adminFnName] === 'function') {
      window[adminFnName](c);
      return;
    }
  }
  
  const routes={home:renderHome,bankloan:renderBankLoan,busbooking:renderBusBooking,
    collegeproject:renderCollegeProject,ecommerce:renderEcommerce,employeeapp:renderEmployeeApp,
    employeeonboarding:renderEmployeeOnboarding,enquiry:renderEnquiry,feestracking:renderFeesTracking,
    goaltracker:renderGoalTracker,leavetracker:renderLeaveTracker,projectcompetition:renderProjectCompetition,
    smartparking:renderSmartParking,survey:renderSurvey,userapp:renderUserApp};
  if (routes[app]) routes[app](c); else c.innerHTML='<p class="text-muted">Not found.</p>';
};

// 1. BANK LOAN ADMIN
async function renderBankloanAdmin(c){
  c.innerHTML=`
  <div class="section-heading"><i class="bi bi-bank me-2" style="color:var(--accent)"></i>Bank Loan Applications (Admin)</div>
  <div class="section-sub">Administrative review and clean up of applications</div>
  <div class="card">
    <div class="card-header d-flex justify-content-between align-items-center">
      <strong class="small"><i class="bi bi-shield-lock me-2"></i>Delete / Review Applications</strong>
      <button class="btn btn-outline-primary btn-sm" onclick="loadBankLoanAdminList()"><i class="bi bi-arrow-clockwise"></i></button>
    </div>
    <div class="card-body p-0">
      <div id="bla-msg" class="p-3 d-none"></div>
      <div class="table-responsive">
        <table class="table table-borderless mb-0">
          <thead><tr><th>ID</th><th>Applicant</th><th>Phone / PAN</th><th>Salary</th><th>Credit</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody id="bla-tbody"><tr><td colspan="7" class="text-center py-4">Loading…</td></tr></tbody>
        </table>
      </div>
    </div>
  </div>`;
  loadBankLoanAdminList();
}
async function loadBankLoanAdminList(){
  const tb=document.getElementById('bla-tbody'); if(!tb)return;
  tb.innerHTML=`<tr><td colspan="7" class="text-center">${spinner()}</td></tr>`;
  try{
    const d=await api('BankLoan/GetAllApplications');
    const items=d.data||d||[];
    if(!items.length){tb.innerHTML=`<tr><td colspan="7" class="text-center text-muted py-3">No applications found.</td></tr>`;return;}
    tb.innerHTML=items.map((r,i)=>{
      const st=r.applicationStatus||'Pending';
      const sc={Approved:'var(--success-custom)',Rejected:'var(--danger-custom)'}[st]||'var(--warning-custom)';
      const id=r.applicantID||r.id||r._id||0;
      return `<tr>
        <td><span class="badge bg-secondary">${id}</span></td>
        <td><strong class="small">${r.fullName||'—'}</strong><br><small class="text-muted">${r.email||''}</small></td>
        <td class="small text-muted">${r.customerPhone||'—'}<br>${r.panCard||'—'}</td>
        <td class="small">₹${Number(r.annualIncome||0).toLocaleString()}</td>
        <td><span class="badge bg-secondary">${r.creditScore||'—'}</span></td>
        <td><span class="badge" style="background:${sc}22;color:${sc}">${st}</span></td>
        <td><button class="btn btn-danger btn-sm py-1 px-2" onclick="deleteBankLoanApp(${id})"><i class="bi bi-trash"></i></button></td>
      </tr>`;
    }).join('');
  }catch(err){tb.innerHTML=`<tr><td colspan="7" class="text-danger text-center py-3">${err.message}</td></tr>`;}
}
async function deleteBankLoanApp(id){
  const m=document.getElementById('bla-msg'); if(!m)return;
  if(!confirm('Are you sure you want to delete this application?'))return;
  m.className='p-3'; m.innerHTML=spinner();
  try{
    await api(`BankLoan/DeleteUserByUserId?userId=${id}`,'DELETE');
    m.innerHTML=alertBox('Application deleted successfully!'); loadBankLoanAdminList();
  }catch(err){m.innerHTML=alertBox('Error: '+err.message,'danger');}
}

// 2. BUS BOOKING ADMIN
async function renderBusbookingAdmin(c){
  c.innerHTML=`
  <div class="section-heading"><i class="bi bi-bus-front me-2" style="color:var(--success-custom)"></i>Bus Schedule & Vendor Admin</div>
  <div class="section-sub">Add schedules, manage bus operators, and review logs</div>
  <div id="bba-msg"></div>
  <div class="row g-4">
    <div class="col-lg-4">
      <div class="card mb-4">
        <div class="card-header"><strong class="small"><i class="bi bi-plus-circle me-2"></i>Add Vendor</strong></div>
        <div class="card-body">
          <form id="bb-vendor-form">
            <div class="mb-2"><label class="form-label">Vendor Name</label><input class="form-control form-control-sm" id="bb-vn" required placeholder="Intercity Travels"/></div>
            <div class="mb-2"><label class="form-label">Phone</label><input class="form-control form-control-sm" id="bb-vp" required placeholder="9876543210"/></div>
            <div class="mb-3"><label class="form-label">Email</label><input type="email" class="form-control form-control-sm" id="bb-ve" required placeholder="vendor@travels.com"/></div>
            <button type="submit" class="btn btn-primary btn-sm w-100"><i class="bi bi-check-circle me-1"></i>Save Vendor</button>
          </form>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><strong class="small"><i class="bi bi-calendar-plus me-2"></i>Add Bus Schedule</strong></div>
        <div class="card-body">
          <form id="bb-sched-form">
            <div class="mb-2"><label class="form-label">Bus Name</label><input class="form-control form-control-sm" id="bb-sname" required placeholder="Express Volvo AC"/></div>
            <div class="mb-2"><label class="form-label">Vehicle No</label><input class="form-control form-control-sm" id="bb-sno" required placeholder="KA51F1234"/></div>
            <div class="row g-2 mb-2">
              <div class="col-6"><label class="form-label">From</label><input class="form-control form-control-sm" id="bb-sfrom" required placeholder="Bangalore"/></div>
              <div class="col-6"><label class="form-label">To</label><input class="form-control form-control-sm" id="bb-sto" required placeholder="Mumbai"/></div>
            </div>
            <div class="row g-2 mb-2">
              <div class="col-6"><label class="form-label">Departure</label><input type="datetime-local" class="form-control form-control-sm" id="bb-sdep" required/></div>
              <div class="col-6"><label class="form-label">Arrival</label><input type="datetime-local" class="form-control form-control-sm" id="bb-sarr" required/></div>
            </div>
            <div class="row g-2 mb-3">
              <div class="col-4"><label class="form-label">Price (₹)</label><input type="number" class="form-control form-control-sm" id="bb-sprc" required placeholder="1200"/></div>
              <div class="col-4"><label class="form-label">Seats</label><input type="number" class="form-control form-control-sm" id="bb-sseat" required value="40"/></div>
              <div class="col-4"><label class="form-label">Vendor ID</label><input type="number" class="form-control form-control-sm" id="bb-svid" required value="1"/></div>
            </div>
            <button type="submit" class="btn btn-primary btn-sm w-100"><i class="bi bi-calendar-check me-1"></i>Publish Schedule</button>
          </form>
        </div>
      </div>
    </div>
    <div class="col-lg-8">
      <div class="card mb-4">
        <div class="card-header d-flex justify-content-between align-items-center">
          <strong class="small"><i class="bi bi-table me-2"></i>Active Schedules</strong>
          <button class="btn btn-outline-primary btn-sm" onclick="loadBusSchedulesAdmin()"><i class="bi bi-arrow-clockwise"></i></button>
        </div>
        <div class="card-body p-0"><div class="table-responsive">
          <table class="table table-borderless mb-0">
            <thead><tr><th>Bus</th><th>Route</th><th>Dep/Arr</th><th>Price</th><th>Seats</th><th>Action</th></tr></thead>
            <tbody id="bba-sched-tbody"><tr><td colspan="6" class="text-center py-4">Loading…</td></tr></tbody>
          </table>
        </div></div>
      </div>
      <div class="card">
        <div class="card-header d-flex justify-content-between align-items-center">
          <strong class="small"><i class="bi bi-people me-2"></i>Registered Vendors</strong>
          <button class="btn btn-outline-primary btn-sm" onclick="loadBusVendorsAdmin()"><i class="bi bi-arrow-clockwise"></i></button>
        </div>
        <div class="card-body p-0"><div class="table-responsive">
          <table class="table table-borderless mb-0">
            <thead><tr><th>ID</th><th>Vendor Name</th><th>Contact Info</th><th>Action</th></tr></thead>
            <tbody id="bba-vendor-tbody"><tr><td colspan="4" class="text-center py-4">Loading…</td></tr></tbody>
          </table>
        </div></div>
      </div>
    </div>
  </div>`;
  loadBusSchedulesAdmin();
  loadBusVendorsAdmin();

  document.getElementById('bb-vendor-form').addEventListener('submit',async e=>{
    e.preventDefault(); const m=document.getElementById('bba-msg');
    try{
      await api('BusBooking/PostBusVendors','POST',{
        vendorName:document.getElementById('bb-vn').value,
        contactNo:document.getElementById('bb-vp').value,
        emailId:document.getElementById('bb-ve').value
      });
      m.innerHTML=alertBox('Vendor registered!'); document.getElementById('bb-vendor-form').reset(); loadBusVendorsAdmin();
    }catch(err){m.innerHTML=alertBox('Error: '+err.message,'danger');}
  });

  document.getElementById('bb-sched-form').addEventListener('submit',async e=>{
    e.preventDefault(); const m=document.getElementById('bba-msg');
    try{
      await api('BusBooking/PostBusSchedule','POST',{
        busName:document.getElementById('bb-sname').value,
        busVehicleNo:document.getElementById('bb-sno').value,
        fromLocation:document.getElementById('bb-sfrom').value,
        toLocation:document.getElementById('bb-sto').value,
        departureTime:new Date(document.getElementById('bb-sdep').value).toISOString(),
        arrivalTime:new Date(document.getElementById('bb-sarr').value).toISOString(),
        scheduleDate:new Date(document.getElementById('bb-sdep').value).toISOString(),
        price:parseFloat(document.getElementById('bb-sprc').value)||0,
        totalSeats:parseInt(document.getElementById('bb-sseat').value)||40,
        vendorId:parseInt(document.getElementById('bb-svid').value)||1
      });
      m.innerHTML=alertBox('Schedule published!'); document.getElementById('bb-sched-form').reset(); loadBusSchedulesAdmin();
    }catch(err){m.innerHTML=alertBox('Error: '+err.message,'danger');}
  });
}
async function loadBusSchedulesAdmin(){
  const tb=document.getElementById('bba-sched-tbody'); if(!tb)return;
  tb.innerHTML=`<tr><td colspan="6" class="text-center">${spinner()}</td></tr>`;
  try{
    const d=await api('BusBooking/GetBusSchedules');
    const items=d.data||d||[];
    if(!items.length){tb.innerHTML=`<tr><td colspan="6" class="text-center text-muted py-3">No active schedules.</td></tr>`;return;}
    tb.innerHTML=items.map(b=>{
      const id=b.scheduleId||b.scheduleID||0;
      return `<tr>
        <td><strong>${b.busName||'—'}</strong><br><small class="text-muted">${b.busVehicleNo||''}</small></td>
        <td class="small">${b.fromLocationName||b.fromLocation||'Origin'} → ${b.toLocationName||b.toLocation||'Dest'}</td>
        <td class="small text-muted">${b.departureTime?new Date(b.departureTime).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}):'—'}<br>${b.arrivalTime?new Date(b.arrivalTime).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}):'—'}</td>
        <td class="small fw-semibold">₹${b.price||0}</td>
        <td class="small">${b.availableSeats??b.totalSeats??40}</td>
        <td><button class="btn btn-danger btn-sm py-1 px-2" onclick="deleteBusSchedule(${id})"><i class="bi bi-trash"></i></button></td>
      </tr>`;
    }).join('');
  }catch(err){tb.innerHTML=`<tr><td colspan="6" class="text-danger text-center py-3">${err.message}</td></tr>`;}
}
async function loadBusVendorsAdmin(){
  const tb=document.getElementById('bba-vendor-tbody'); if(!tb)return;
  tb.innerHTML=`<tr><td colspan="4" class="text-center">${spinner()}</td></tr>`;
  try{
    const d=await api('BusBooking/GetBusVendors');
    const items=d.data||d||[];
    if(!items.length){tb.innerHTML=`<tr><td colspan="4" class="text-center text-muted py-3">No registered vendors.</td></tr>`;return;}
    tb.innerHTML=items.map(v=>{
      const id=v.vendorId||v.id||0;
      return `<tr>
        <td><span class="badge bg-secondary">${id}</span></td>
        <td><strong>${v.vendorName||'—'}</strong></td>
        <td class="small text-muted">${v.emailId||''}<br>${v.contactNo||''}</td>
        <td><button class="btn btn-danger btn-sm py-1 px-2" onclick="deleteBusVendor(${id})"><i class="bi bi-trash"></i></button></td>
      </tr>`;
    }).join('');
  }catch(err){tb.innerHTML=`<tr><td colspan="4" class="text-danger text-center py-3">${err.message}</td></tr>`;}
}
async function deleteBusSchedule(id){
  if(!confirm('Are you sure you want to delete this schedule?'))return;
  try{await api(`BusBooking/DeleteBusSchedule?id=${id}`,'DELETE'); loadBusSchedulesAdmin();}
  catch(err){alert('Failed: '+err.message);}
}
async function deleteBusVendor(id){
  if(!confirm('Are you sure you want to delete this vendor?'))return;
  try{await api(`BusBooking/DeleteBusVendors?id=${id}`,'DELETE'); loadBusVendorsAdmin();}
  catch(err){alert('Failed: '+err.message);}
}

// 3. COLLEGE PROJECT ADMIN
async function renderCollegeprojectAdmin(c){
  c.innerHTML=`
  <div class="section-heading"><i class="bi bi-mortarboard me-2" style="color:#bc8cff"></i>College Project Submissions (Admin)</div>
  <div class="section-sub">Approve, reject, or delete submitted student projects</div>
  <div id="cpa-msg"></div>
  <div class="card">
    <div class="card-header d-flex justify-content-between align-items-center">
      <strong class="small"><i class="bi bi-trophy me-2"></i>Student Projects</strong>
      <button class="btn btn-outline-primary btn-sm" onclick="loadCollegeProjectAdminList()"><i class="bi bi-arrow-clockwise"></i></button>
    </div>
    <div class="card-body p-0"><div class="table-responsive">
      <table class="table table-borderless mb-0">
        <thead><tr><th>ID</th><th>Project Title</th><th>GitHub</th><th>Comp ID / User ID</th><th>Status</th><th>Review Actions</th></tr></thead>
        <tbody id="cpa-tbody"><tr><td colspan="6" class="text-center py-4">Loading…</td></tr></tbody>
      </table>
    </div></div>
  </div>`;
  loadCollegeProjectAdminList();
}
async function loadCollegeProjectAdminList(){
  const tb=document.getElementById('cpa-tbody'); if(!tb)return;
  tb.innerHTML=`<tr><td colspan="6" class="text-center">${spinner()}</td></tr>`;
  try{
    const d=await api('CollegeProject/getAllProjects');
    const items=d.data||d||[];
    if(!items.length){tb.innerHTML=`<tr><td colspan="6" class="text-center text-muted py-3">No submissions.</td></tr>`;return;}
    tb.innerHTML=items.map(p=>{
      const id=p.projectId||p.id||0;
      const st=p.status||'Pending';
      const sc={Approved:'var(--success-custom)',Rejected:'var(--danger-custom)'}[st]||'var(--warning-custom)';
      return `<tr>
        <td><span class="badge bg-secondary">${id}</span></td>
        <td><strong>${p.projectTitle||'—'}</strong><br><small class="text-muted">${(p.description||'').substring(0,50)}</small></td>
        <td class="small">${p.githubLink?`<a href="${p.githubLink}" target="_blank" class="text-accent">Link</a>`:'—'}</td>
        <td class="small text-muted">Comp: ${p.competitionId||'—'} \| User: ${p.userId||'—'}</td>
        <td><span class="badge" style="background:${sc}22;color:${sc}">${st}</span></td>
        <td>
          <div class="btn-group">
            <button class="btn btn-success btn-sm py-1 px-2" onclick="reviewCollegeProject(${id}, 'Approved')" title="Approve"><i class="bi bi-check-lg"></i></button>
            <button class="btn btn-warning btn-sm py-1 px-2 text-dark" onclick="reviewCollegeProject(${id}, 'Rejected')" title="Reject"><i class="bi bi-x-lg"></i></button>
            <button class="btn btn-danger btn-sm py-1 px-2" onclick="deleteCollegeProject(${id})" title="Delete"><i class="bi bi-trash"></i></button>
          </div>
        </td>
      </tr>`;
    }).join('');
  }catch(err){tb.innerHTML=`<tr><td colspan="6" class="text-danger text-center py-3">${err.message}</td></tr>`;}
}
async function reviewCollegeProject(id, status){
  const m=document.getElementById('cpa-msg'); if(!m)return;
  try{
    await api('CollegeProject/changeProjectStatus','POST',{projectId:id,status});
    m.innerHTML=alertBox(`Project marked as ${status}!`); loadCollegeProjectAdminList();
  }catch(err){m.innerHTML=alertBox('Error: '+err.message,'danger');}
}
async function deleteCollegeProject(id){
  if(!confirm('Are you sure you want to delete this project?'))return;
  const m=document.getElementById('cpa-msg'); if(!m)return;
  try{
    await api(`CollegeProject/${id}`,'DELETE');
    m.innerHTML=alertBox('Project deleted successfully!'); loadCollegeProjectAdminList();
  }catch(err){m.innerHTML=alertBox('Error: '+err.message,'danger');}
}

// 4. ECOMMERCE ADMIN
async function renderEcommerceAdmin(c){
  c.innerHTML=`
  <div class="section-heading"><i class="bi bi-cart3 me-2" style="color:var(--warning-custom)"></i>Ecommerce Store (Admin)</div>
  <div class="section-sub">Manage categories, create products, and monitor customer orders</div>
  <div id="eca-msg"></div>
  <div class="row g-4">
    <div class="col-lg-4">
      <div class="card mb-4">
        <div class="card-header"><strong class="small"><i class="bi bi-tag me-2"></i>Create Category</strong></div>
        <div class="card-body">
          <form id="ec-cat-form">
            <div class="mb-3"><label class="form-label">Category Name</label><input class="form-control form-control-sm" id="ec-catname" required placeholder="Electronics"/></div>
            <button type="submit" class="btn btn-primary btn-sm w-100"><i class="bi bi-check-circle me-1"></i>Save Category</button>
          </form>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><strong class="small"><i class="bi bi-plus-circle me-2"></i>Add Product</strong></div>
        <div class="card-body">
          <form id="ec-prod-form">
            <div class="mb-2"><label class="form-label">Product Name</label><input class="form-control form-control-sm" id="ec-pname" required placeholder="Wireless Headset"/></div>
            <div class="mb-2"><label class="form-label">Price (₹)</label><input type="number" class="form-control form-control-sm" id="ec-pprice" required placeholder="2499"/></div>
            <div class="mb-2"><label class="form-label">Product SKU</label><input class="form-control form-control-sm" id="ec-psku" required placeholder="SKU-HEADSET"/></div>
            <div class="mb-2"><label class="form-label">Category ID</label><input type="number" class="form-control form-control-sm" id="ec-pcatid" required value="1"/></div>
            <div class="mb-3"><label class="form-label">Description</label><textarea class="form-control form-control-sm" id="ec-pdesc" rows="2" placeholder="Bluetooth 5.0 headphones…"></textarea></div>
            <button type="submit" class="btn btn-primary btn-sm w-100"><i class="bi bi-cloud-upload me-1"></i>Publish Product</button>
          </form>
        </div>
      </div>
    </div>
    <div class="col-lg-8">
      <div class="card mb-4">
        <div class="card-header d-flex justify-content-between align-items-center">
          <strong class="small"><i class="bi bi-bag-check me-2"></i>Customer Orders</strong>
          <button class="btn btn-outline-primary btn-sm" onclick="loadEcommerceOrders()"><i class="bi bi-arrow-clockwise"></i></button>
        </div>
        <div class="card-body p-0"><div class="table-responsive">
          <table class="table table-borderless mb-0">
            <thead><tr><th>Order ID</th><th>Customer</th><th>Product</th><th>Date</th><th>Status</th><th>Action</th></tr></thead>
            <tbody id="eca-orders-tbody"><tr><td colspan="6" class="text-center py-4">Loading…</td></tr></tbody>
          </table>
        </div></div>
      </div>
      <div class="card">
        <div class="card-header d-flex justify-content-between align-items-center">
          <strong class="small"><i class="bi bi-trash me-2"></i>Product Listing (Delete)</strong>
          <button class="btn btn-outline-primary btn-sm" onclick="loadEcommerceProductsAdmin()"><i class="bi bi-arrow-clockwise"></i></button>
        </div>
        <div class="card-body p-0"><div class="table-responsive">
          <table class="table table-borderless mb-0">
            <thead><tr><th>SKU</th><th>Product Name</th><th>Price</th><th>Category</th><th>Action</th></tr></thead>
            <tbody id="eca-prod-tbody"><tr><td colspan="5" class="text-center py-4">Loading…</td></tr></tbody>
          </table>
        </div></div>
      </div>
    </div>
  </div>`;
  loadEcommerceOrders();
  loadEcommerceProductsAdmin();

  document.getElementById('ec-cat-form').addEventListener('submit',async e=>{
    e.preventDefault(); const m=document.getElementById('eca-msg');
    try{
      await api('Ecommerce/CreateParentCategory','POST',{parentCategoryName:document.getElementById('ec-catname').value});
      m.innerHTML=alertBox('Parent category saved!'); document.getElementById('ec-cat-form').reset();
    }catch(err){m.innerHTML=alertBox('Error: '+err.message,'danger');}
  });

  document.getElementById('ec-prod-form').addEventListener('submit',async e=>{
    e.preventDefault(); const m=document.getElementById('eca-msg');
    try{
      await api('Ecommerce/create-product','POST',{
        productName:document.getElementById('ec-pname').value,
        price:parseFloat(document.getElementById('ec-pprice').value)||0,
        productSku:document.getElementById('ec-psku').value,
        categoryId:parseInt(document.getElementById('ec-pcatid').value)||1,
        productDescription:document.getElementById('ec-pdesc').value,
        deliveryTimeInDays:3
      });
      m.innerHTML=alertBox('Product published!'); document.getElementById('ec-prod-form').reset(); loadEcommerceProductsAdmin();
    }catch(err){m.innerHTML=alertBox('Error: '+err.message,'danger');}
  });
}
async function loadEcommerceOrders(){
  const tb=document.getElementById('eca-orders-tbody'); if(!tb)return;
  tb.innerHTML=`<tr><td colspan="6" class="text-center">${spinner()}</td></tr>`;
  try{
    const d=await api('Ecommerce/get-orders');
    const items=d.data||d||[];
    if(!items.length){tb.innerHTML=`<tr><td colspan="6" class="text-center text-muted py-3">No orders placed.</td></tr>`;return;}
    tb.innerHTML=items.map(o=>{
      const id=o.orderId||o.id||0;
      const st=o.orderStatus||'Pending';
      const sc=st==='Completed'?'var(--success-custom)':st==='Cancelled'?'var(--danger-custom)':'var(--warning-custom)';
      return `<tr>
        <td><span class="badge bg-secondary">#ORD${id}</span></td>
        <td class="small">${o.customerName||'Customer #'+(o.customerId||1)}</td>
        <td class="small fw-semibold">${o.productName||'Product'}</td>
        <td class="small text-muted">${o.orderDate?new Date(o.orderDate).toLocaleDateString():'—'}</td>
        <td><span class="badge" style="background:${sc}22;color:${sc}">${st}</span></td>
        <td>
          <div class="btn-group">
            <button class="btn btn-success btn-sm py-1 px-2" onclick="updateOrderStatus(${id}, 'Completed')" title="Mark Completed"><i class="bi bi-check-lg"></i></button>
            <button class="btn btn-danger btn-sm py-1 px-2" onclick="cancelOrder(${id})" title="Cancel Order"><i class="bi bi-x-lg"></i></button>
          </div>
        </td>
      </tr>`;
    }).join('');
  }catch(err){tb.innerHTML=`<tr><td colspan="6" class="text-danger text-center py-3">${err.message}</td></tr>`;}
}
async function loadEcommerceProductsAdmin(){
  const tb=document.getElementById('eca-prod-tbody'); if(!tb)return;
  tb.innerHTML=`<tr><td colspan="5" class="text-center">${spinner()}</td></tr>`;
  try{
    const d=await api('Ecommerce/get-products');
    const items=d.data||d||[];
    if(!items.length){tb.innerHTML=`<tr><td colspan="5" class="text-center text-muted py-3">No products available.</td></tr>`;return;}
    tb.innerHTML=items.map(p=>{
      const id=p.productId||p.id||0;
      return `<tr>
        <td class="small text-muted">${p.productSku||'—'}</td>
        <td><strong>${p.productName||'—'}</strong></td>
        <td class="small fw-semibold">₹${p.price||0}</td>
        <td class="small"><span class="badge bg-secondary">${p.parentCategoryName||'General'}</span></td>
        <td><button class="btn btn-danger btn-sm py-1 px-2" onclick="deleteEcommerceProduct(${id})"><i class="bi bi-trash"></i></button></td>
      </tr>`;
    }).join('');
  }catch(err){tb.innerHTML=`<tr><td colspan="5" class="text-danger text-center py-3">${err.message}</td></tr>`;}
}
async function updateOrderStatus(orderId, status){
  try{
    await api(`Ecommerce/update-order/${orderId}`,'PUT',{orderStatus:status});
    loadEcommerceOrders();
  }catch(err){alert('Failed: '+err.message);}
}
async function cancelOrder(orderId){
  if(!confirm('Are you sure you want to cancel this order?'))return;
  try{
    await api(`Ecommerce/cancel-order/${orderId}`,'DELETE');
    loadEcommerceOrders();
  }catch(err){alert('Failed: '+err.message);}
}
async function deleteEcommerceProduct(id){
  if(!confirm('Are you sure you want to delete this product?'))return;
  try{
    await api(`Ecommerce/delete-product/${id}`,'DELETE');
    loadEcommerceProductsAdmin();
  }catch(err){alert('Failed: '+err.message);}
}

// 5. EMPLOYEE APP ADMIN
async function renderEmployeeappAdmin(c){
  c.innerHTML=`
  <div class="section-heading"><i class="bi bi-people me-2" style="color:var(--accent)"></i>Employee App (Admin)</div>
  <div class="section-sub">Add or remove company employees and structure departments</div>
  <div id="ema-msg"></div>
  <div class="row g-4">
    <div class="col-lg-4">
      <div class="card">
        <div class="card-header"><strong class="small"><i class="bi bi-person-plus me-2"></i>Create Employee</strong></div>
        <div class="card-body">
          <form id="em-add-form">
            <div class="mb-2"><label class="form-label">Employee Name</label><input class="form-control form-control-sm" id="em-name" required placeholder="Robert Smith"/></div>
            <div class="mb-2"><label class="form-label">Email</label><input type="email" class="form-control form-control-sm" id="em-email" required placeholder="robert@company.com"/></div>
            <div class="mb-2"><label class="form-label">Phone</label><input class="form-control form-control-sm" id="em-phone" required placeholder="9876543210"/></div>
            <div class="mb-2"><label class="form-label">Department ID</label><input type="number" class="form-control form-control-sm" id="em-deptid" required value="1"/></div>
            <div class="mb-3"><label class="form-label">Designation ID</label><input type="number" class="form-control form-control-sm" id="em-desgid" required value="1"/></div>
            <button type="submit" class="btn btn-primary btn-sm w-100"><i class="bi bi-check-circle me-1"></i>Register Employee</button>
          </form>
        </div>
      </div>
    </div>
    <div class="col-lg-8">
      <div class="card">
        <div class="card-header d-flex justify-content-between align-items-center">
          <strong class="small"><i class="bi bi-people me-2"></i>Employee Registry</strong>
          <button class="btn btn-outline-primary btn-sm" onclick="loadEmployeesAdmin()"><i class="bi bi-arrow-clockwise"></i></button>
        </div>
        <div class="card-body p-0"><div class="table-responsive">
          <table class="table table-borderless mb-0">
            <thead><tr><th>Employee</th><th>Department</th><th>Designation</th><th>Contact</th><th>Action</th></tr></thead>
            <tbody id="ema-tbody"><tr><td colspan="5" class="text-center py-4">Loading…</td></tr></tbody>
          </table>
        </div></div>
      </div>
    </div>
  </div>`;
  loadEmployeesAdmin();

  document.getElementById('em-add-form').addEventListener('submit',async e=>{
    e.preventDefault(); const m=document.getElementById('ema-msg');
    try{
      await api('EmployeeApp/CreateEmployee','POST',{
        employeeName:document.getElementById('em-name').value,
        email:document.getElementById('em-email').value,
        phone:document.getElementById('em-phone').value,
        deptId:parseInt(document.getElementById('em-deptid').value)||1,
        designationId:parseInt(document.getElementById('em-desgid').value)||1,
        gender:'Male',role:'Staff'
      });
      m.innerHTML=alertBox('Employee registered successfully!'); document.getElementById('em-add-form').reset(); loadEmployeesAdmin();
    }catch(err){m.innerHTML=alertBox('Error: '+err.message,'danger');}
  });
}
async function loadEmployeesAdmin(){
  const tb=document.getElementById('ema-tbody'); if(!tb)return;
  tb.innerHTML=`<tr><td colspan="5" class="text-center">${spinner()}</td></tr>`;
  try{
    const d=await api('EmployeeApp/GetEmployees');
    const items=d.data||d||[];
    if(!items.length){tb.innerHTML=`<tr><td colspan="5" class="text-center text-muted py-3">No employees listed.</td></tr>`;return;}
    tb.innerHTML=items.map(e=>{
      const id=e.employeeId||e.id||0;
      return `<tr>
        <td><strong>${e.fullName||e.employeeName||'—'}</strong><br><small class="text-muted">${e.email||''}</small></td>
        <td><span class="badge bg-secondary bg-opacity-25 text-secondary">${e.departmentName||'Department #'+(e.deptId||'')}</span></td>
        <td class="small">${e.designationName||'Designation #'+(e.designationId||'')}</td>
        <td class="small text-muted">${e.phone||'—'}</td>
        <td><button class="btn btn-danger btn-sm py-1 px-2" onclick="deleteEmployee(${id})"><i class="bi bi-trash"></i></button></td>
      </tr>`;
    }).join('');
  }catch(err){tb.innerHTML=`<tr><td colspan="5" class="text-danger text-center py-3">${err.message}</td></tr>`;}
}
async function deleteEmployee(id){
  if(!confirm('Are you sure you want to delete this employee?'))return;
  try{
    await api('EmployeeApp/DeleteEmployee','DELETE',{employeeId:id});
    loadEmployeesAdmin();
  }catch(err){alert('Failed: '+err.message);}
}

// 6. EMPLOYEE ONBOARDING ADMIN
async function renderEmployeeonboardingAdmin(c){
  c.innerHTML=`
  <div class="section-heading"><i class="bi bi-person-check me-2" style="color:var(--success-custom)"></i>Employee Onboarding Admin</div>
  <div class="section-sub">Manage dropdown options, company logs, and onboarding profiles</div>
  <div id="eoa-msg"></div>
  
  <ul class="nav nav-pills mb-3 gap-2" id="eoa-tab-list" role="tablist">
    <li class="nav-item"><button class="btn btn-outline-primary btn-sm active" id="eoa-emp-tab" data-bs-toggle="pill" data-bs-target="#eoa-emp" type="button">Onboarded Profiles</button></li>
    <li class="nav-item"><button class="btn btn-outline-primary btn-sm" id="eoa-mast-tab" data-bs-toggle="pill" data-bs-target="#eoa-mast" type="button">Master Dropdowns</button></li>
    <li class="nav-item"><button class="btn btn-outline-primary btn-sm" id="eoa-comp-tab" data-bs-toggle="pill" data-bs-target="#eoa-comp" type="button">Company Logs</button></li>
  </ul>
  
  <div class="tab-content" id="eoa-tabs">
    <!-- ONBOARDED EMPLOYEES -->
    <div class="tab-pane fade show active" id="eoa-emp">
      <div class="card">
        <div class="card-header d-flex justify-content-between align-items-center">
          <strong class="small"><i class="bi bi-person-lines-fill me-2"></i>Onboarded List</strong>
          <button class="btn btn-outline-primary btn-sm" onclick="loadOnboardingEmployeesAdmin()"><i class="bi bi-arrow-clockwise"></i></button>
        </div>
        <div class="card-body p-0"><div class="table-responsive">
          <table class="table table-borderless mb-0">
            <thead><tr><th>Employee</th><th>Onboarding Code</th><th>Role</th><th>Salary</th><th>Company</th><th>Action</th></tr></thead>
            <tbody id="eoa-emp-tbody"><tr><td colspan="6" class="text-center py-4">Loading…</td></tr></tbody>
          </table>
        </div></div>
      </div>
    </div>
    
    <!-- MASTERS -->
    <div class="tab-pane fade" id="eoa-mast">
      <div class="row g-4">
        <div class="col-md-5">
          <div class="card">
            <div class="card-header"><strong class="small"><i class="bi bi-plus-circle"></i> Add Master Entry</strong></div>
            <div class="card-body">
              <form id="eoa-master-form">
                <div class="mb-2"><label class="form-label">Master For (e.g. Department, Designation)</label><input class="form-control form-control-sm" id="eoa-mfor" required placeholder="Department"/></div>
                <div class="mb-3"><label class="form-label">Master Value</label><input class="form-control form-control-sm" id="eoa-mval" required placeholder="QA Testing"/></div>
                <button type="submit" class="btn btn-primary btn-sm w-100"><i class="bi bi-check-circle"></i> Save Master</button>
              </form>
            </div>
          </div>
        </div>
        <div class="col-md-7">
          <div class="card">
            <div class="card-header"><strong class="small"><i class="bi bi-table"></i> All Masters</strong></div>
            <div class="card-body p-0"><div class="table-responsive">
              <table class="table table-borderless mb-0">
                <thead><tr><th>ID</th><th>Master For</th><th>Value</th><th>Action</th></tr></thead>
                <tbody id="eoa-master-tbody"><tr><td colspan="4" class="text-center py-4">Loading…</td></tr></tbody>
              </table>
            </div></div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- COMPANIES -->
    <div class="tab-pane fade" id="eoa-comp">
      <div class="row g-4">
        <div class="col-md-5">
          <div class="card">
            <div class="card-header"><strong class="small"><i class="bi bi-plus-circle"></i> Add Company Profile</strong></div>
            <div class="card-body">
              <form id="eoa-comp-form">
                <div class="mb-2"><label class="form-label">Company Name</label><input class="form-control form-control-sm" id="eoa-cname" required placeholder="Globex Corp"/></div>
                <div class="mb-2"><label class="form-label">Headquarters</label><input class="form-control form-control-sm" id="eoa-cloc" required placeholder="New York"/></div>
                <div class="mb-3"><label class="form-label">Website</label><input class="form-control form-control-sm" id="eoa-cweb" required placeholder="www.globex.com"/></div>
                <button type="submit" class="btn btn-primary btn-sm w-100"><i class="bi bi-check-circle"></i> Save Company</button>
              </form>
            </div>
          </div>
        </div>
        <div class="col-md-7">
          <div class="card">
            <div class="card-header"><strong class="small"><i class="bi bi-building"></i> Companies</strong></div>
            <div class="card-body p-0"><div class="table-responsive">
              <table class="table table-borderless mb-0">
                <thead><tr><th>ID</th><th>Company Name</th><th>Location</th><th>Website</th><th>Action</th></tr></thead>
                <tbody id="eoa-comp-tbody"><tr><td colspan="5" class="text-center py-4">Loading…</td></tr></tbody>
              </table>
            </div></div>
          </div>
        </div>
      </div>
    </div>
  </div>`;

  loadOnboardingEmployeesAdmin();
  loadOnboardingMastersAdmin();
  loadOnboardingCompaniesAdmin();

  document.getElementById('eoa-master-form').addEventListener('submit',async e=>{
    e.preventDefault(); const m=document.getElementById('eoa-msg');
    try{
      await api('EmployeeOnboarding/CreateNewMaster','POST',{
        masterFor:document.getElementById('eoa-mfor').value,
        masterName:document.getElementById('eoa-mval').value
      });
      m.innerHTML=alertBox('Master dropdown entry saved!'); document.getElementById('eoa-master-form').reset(); loadOnboardingMastersAdmin();
    }catch(err){m.innerHTML=alertBox('Error: '+err.message,'danger');}
  });

  document.getElementById('eoa-comp-form').addEventListener('submit',async e=>{
    e.preventDefault(); const m=document.getElementById('eoa-msg');
    try{
      await api('EmployeeOnboarding/PostCompany','POST',{
        companyName:document.getElementById('eoa-cname').value,
        location:document.getElementById('eoa-cloc').value,
        website:document.getElementById('eoa-cweb').value
      });
      m.innerHTML=alertBox('Company saved!'); document.getElementById('eoa-comp-form').reset(); loadOnboardingCompaniesAdmin();
    }catch(err){m.innerHTML=alertBox('Error: '+err.message,'danger');}
  });
}
async function loadOnboardingEmployeesAdmin(){
  const tb=document.getElementById('eoa-emp-tbody'); if(!tb)return;
  tb.innerHTML=`<tr><td colspan="6" class="text-center">${spinner()}</td></tr>`;
  try{
    const d=await api('EmployeeOnboarding/GetEmployees');
    const items=d.data||d||[];
    if(!items.length){tb.innerHTML=`<tr><td colspan="6" class="text-center text-muted py-3">No onboarded employee profiles found.</td></tr>`;return;}
    tb.innerHTML=items.map(e=>{
      const id=e.employeeId||e.id||0;
      return `<tr>
        <td><strong>${(e.firstName||'') + ' ' + (e.lastName||'')}</strong><br><small class="text-muted">${e.email||''}</small></td>
        <td class="small text-muted">${e.employeeCode||e.employeeId||'—'}</td>
        <td class="small">${e.role||e.designation||'Staff'}</td>
        <td class="small">₹${Number(e.salary||0).toLocaleString()}</td>
        <td class="small text-muted">${e.company||'—'}</td>
        <td><button class="btn btn-danger btn-sm py-1 px-2" onclick="deleteOnboardedEmployee(${id})"><i class="bi bi-trash"></i></button></td>
      </tr>`;
    }).join('');
  }catch(err){tb.innerHTML=`<tr><td colspan="6" class="text-danger text-center py-3">${err.message}</td></tr>`;}
}
async function loadOnboardingMastersAdmin(){
  const tb=document.getElementById('eoa-master-tbody'); if(!tb)return;
  tb.innerHTML=`<tr><td colspan="4" class="text-center">${spinner()}</td></tr>`;
  try{
    const d=await api('EmployeeOnboarding/getAllMaster');
    const items=d.data||d||[];
    if(!items.length){tb.innerHTML=`<tr><td colspan="4" class="text-center text-muted py-3">No master entries found.</td></tr>`;return;}
    tb.innerHTML=items.map(m=>{
      const id=m.id||m.masterId||0;
      return `<tr>
        <td><span class="badge bg-secondary">${id}</span></td>
        <td class="small"><strong>${m.masterFor||'—'}</strong></td>
        <td class="small">${m.masterName||'—'}</td>
        <td><button class="btn btn-danger btn-sm py-1 px-2" onclick="deleteOnboardingMaster(${id})"><i class="bi bi-trash"></i></button></td>
      </tr>`;
    }).join('');
  }catch(err){tb.innerHTML=`<tr><td colspan="4" class="text-danger text-center py-3">${err.message}</td></tr>`;}
}
async function loadOnboardingCompaniesAdmin(){
  const tb=document.getElementById('eoa-comp-tbody'); if(!tb)return;
  tb.innerHTML=`<tr><td colspan="5" class="text-center">${spinner()}</td></tr>`;
  try{
    const d=await api('EmployeeOnboarding/GetCompanies');
    const items=d.data||d||[];
    if(!items.length){tb.innerHTML=`<tr><td colspan="5" class="text-center text-muted py-3">No companies found.</td></tr>`;return;}
    tb.innerHTML=items.map(c=>{
      const id=c.companyId||c.id||0;
      return `<tr>
        <td><span class="badge bg-secondary">${id}</span></td>
        <td><strong>${c.companyName||'—'}</strong></td>
        <td class="small">${c.location||'—'}</td>
        <td class="small text-muted">${c.website||'—'}</td>
        <td><button class="btn btn-danger btn-sm py-1 px-2" onclick="deleteOnboardingCompany(${id})"><i class="bi bi-trash"></i></button></td>
      </tr>`;
    }).join('');
  }catch(err){tb.innerHTML=`<tr><td colspan="5" class="text-danger text-center py-3">${err.message}</td></tr>`;}
}
async function deleteOnboardedEmployee(id){
  if(!confirm('Are you sure you want to delete this profile?'))return;
  try{await api(`EmployeeOnboarding/${id}`,'DELETE'); loadOnboardingEmployeesAdmin();}
  catch(err){alert('Failed: '+err.message);}
}
async function deleteOnboardingMaster(id){
  if(!confirm('Are you sure you want to delete this master dropdown entry?'))return;
  try{await api(`EmployeeOnboarding/DeleteMasterById?id=${id}`,'DELETE'); loadOnboardingMastersAdmin();}
  catch(err){alert('Failed: '+err.message);}
}
async function deleteOnboardingCompany(id){
  if(!confirm('Are you sure you want to delete this company?'))return;
  try{await api(`EmployeeOnboarding/DeleteCompany?id=${id}`,'DELETE'); loadOnboardingCompaniesAdmin();}
  catch(err){alert('Failed: '+err.message);}
}

// 7. ENQUIRY ADMIN
async function renderEnquiryAdmin(c){
  c.innerHTML=`
  <div class="section-heading"><i class="bi bi-chat-dots me-2" style="color:var(--danger-custom)"></i>Support Tickets (Admin)</div>
  <div class="section-sub">Manage enquiry statuses, ticket categories, and customer support rules</div>
  <div id="enqa-msg"></div>
  <div class="row g-4">
    <div class="col-lg-4">
      <div class="card mb-4">
        <div class="card-header"><strong class="small"><i class="bi bi-tag me-2"></i>Create Ticket Category</strong></div>
        <div class="card-body">
          <form id="enq-cat-form">
            <div class="mb-3"><label class="form-label">Category Name</label><input class="form-control form-control-sm" id="enq-cname" required placeholder="Technical Support"/></div>
            <button type="submit" class="btn btn-primary btn-sm w-100"><i class="bi bi-check-circle me-1"></i>Save Category</button>
          </form>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><strong class="small"><i class="bi bi-tag me-2"></i>Create Ticket Status</strong></div>
        <div class="card-body">
          <form id="enq-stat-form">
            <div class="mb-3"><label class="form-label">Status Value</label><input class="form-control form-control-sm" id="enq-sname" required placeholder="Under Investigation"/></div>
            <button type="submit" class="btn btn-primary btn-sm w-100"><i class="bi bi-check-circle me-1"></i>Save Status</button>
          </form>
        </div>
      </div>
    </div>
    <div class="col-lg-8">
      <div class="card">
        <div class="card-header d-flex justify-content-between align-items-center">
          <strong class="small"><i class="bi bi-ticket-detailed me-2"></i>Support Inbox</strong>
          <button class="btn btn-outline-primary btn-sm" onclick="loadEnquiriesAdmin()"><i class="bi bi-arrow-clockwise"></i></button>
        </div>
        <div class="card-body p-0"><div class="table-responsive">
          <table class="table table-borderless mb-0">
            <thead><tr><th>ID</th><th>Customer</th><th>Message</th><th>Status</th><th>Review Actions</th></tr></thead>
            <tbody id="enqa-tbody"><tr><td colspan="5" class="text-center py-4">Loading…</td></tr></tbody>
          </table>
        </div></div>
      </div>
    </div>
  </div>`;
  loadEnquiriesAdmin();

  document.getElementById('enq-cat-form').addEventListener('submit',async e=>{
    e.preventDefault(); const m=document.getElementById('enqa-msg');
    try{
      await api('Enquiry/create-category','POST',{categoryName:document.getElementById('enq-cname').value});
      m.innerHTML=alertBox('Enquiry Category registered!'); document.getElementById('enq-cat-form').reset();
    }catch(err){m.innerHTML=alertBox('Error: '+err.message,'danger');}
  });

  document.getElementById('enq-stat-form').addEventListener('submit',async e=>{
    e.preventDefault(); const m=document.getElementById('enqa-msg');
    try{
      await api('Enquiry/create-status','POST',{statusName:document.getElementById('enq-sname').value});
      m.innerHTML=alertBox('Enquiry Status value registered!'); document.getElementById('enq-stat-form').reset();
    }catch(err){m.innerHTML=alertBox('Error: '+err.message,'danger');}
  });
}
async function loadEnquiriesAdmin(){
  const tb=document.getElementById('enqa-tbody'); if(!tb)return;
  tb.innerHTML=`<tr><td colspan="5" class="text-center">${spinner()}</td></tr>`;
  try{
    const d=await api('Enquiry/get-enquiries');
    const items=d.data||d||[];
    if(!items.length){tb.innerHTML=`<tr><td colspan="5" class="text-center text-muted py-3">No enquiries.</td></tr>`;return;}
    const statusColors={Open:'var(--warning-custom)','In Progress':'var(--accent)',Resolved:'var(--success-custom)',Closed:'var(--text-muted-custom)'};
    tb.innerHTML=items.map(r=>{
      const id=r.enquiryId||r.id||0;
      const st=r.statusName||r.status||'Open';
      const sc=statusColors[st]||'var(--warning-custom)';
      return `<tr>
        <td><span class="badge bg-secondary">#${id}</span></td>
        <td><strong>${r.customerName||'—'}</strong><br><small class="text-muted">${r.customerEmail||''}</small></td>
        <td class="small">${(r.message||'—').substring(0,50)}</td>
        <td><span class="badge" style="background:${sc}22;color:${sc}">${st}</span></td>
        <td>
          <div class="btn-group">
            <button class="btn btn-success btn-sm py-1 px-2" onclick="updateEnquiryStatus(${id}, 'Resolved')" title="Mark Resolved"><i class="bi bi-check-lg"></i></button>
            <button class="btn btn-danger btn-sm py-1 px-2" onclick="deleteEnquiry(${id})" title="Delete Ticket"><i class="bi bi-trash"></i></button>
          </div>
        </td>
      </tr>`;
    }).join('');
  }catch(err){tb.innerHTML=`<tr><td colspan="5" class="text-danger text-center py-3">${err.message}</td></tr>`;}
}
async function updateEnquiryStatus(id, status){
  try{
    await api(`Enquiry/update-enquiry/${id}`,'PUT',{statusName:status,isConverted:true});
    loadEnquiriesAdmin();
  }catch(err){alert('Failed: '+err.message);}
}
async function deleteEnquiry(id){
  if(!confirm('Are you sure you want to delete this enquiry?'))return;
  try{
    await api(`Enquiry/delete-enquiry/${id}`,'DELETE');
    loadEnquiriesAdmin();
  }catch(err){alert('Failed: '+err.message);}
}

// 8. FEES TRACKING ADMIN
async function renderFeestrackingAdmin(c){
  c.innerHTML=`
  <div class="section-heading"><i class="bi bi-cash-coin me-2" style="color:var(--warning-custom)"></i>Fees Tracking (Admin)</div>
  <div class="section-sub">Manage batch profiles, create new courses, and audit student accounts</div>
  <div id="fta-msg"></div>
  <div class="row g-4">
    <div class="col-lg-4">
      <div class="card">
        <div class="card-header"><strong class="small"><i class="bi bi-plus-circle me-2"></i>Create Batch</strong></div>
        <div class="card-body">
          <form id="ft-batch-form">
            <div class="mb-2"><label class="form-label">Batch Name</label><input class="form-control form-control-sm" id="ft-bname" required placeholder="Summer 2026 Core Tech"/></div>
            <div class="mb-3"><label class="form-label">Course Name</label><input class="form-control form-control-sm" id="ft-cname" required placeholder="Internet Technologies"/></div>
            <button type="submit" class="btn btn-primary btn-sm w-100"><i class="bi bi-check-circle me-1"></i>Publish Batch</button>
          </form>
        </div>
      </div>
    </div>
    <div class="col-lg-8">
      <div class="card mb-4">
        <div class="card-header d-flex justify-content-between align-items-center">
          <strong class="small"><i class="bi bi-table me-2"></i>Student Accounts</strong>
          <button class="btn btn-outline-primary btn-sm" onclick="loadFeesAdmin()"><i class="bi bi-arrow-clockwise"></i></button>
        </div>
        <div class="card-body p-0"><div class="table-responsive">
          <table class="table table-borderless mb-0">
            <thead><tr><th>Student</th><th>Batch</th><th>Fees Log</th><th>Outstanding</th><th>Action</th></tr></thead>
            <tbody id="fta-tbody"><tr><td colspan="5" class="text-center py-4">Loading…</td></tr></tbody>
          </table>
        </div></div>
      </div>
      <div class="card">
        <div class="card-header d-flex justify-content-between align-items-center">
          <strong class="small"><i class="bi bi-bookmark me-2"></i>Batches Catalog</strong>
          <button class="btn btn-outline-primary btn-sm" onclick="loadBatchesAdmin()"><i class="bi bi-arrow-clockwise"></i></button>
        </div>
        <div class="card-body p-0"><div class="table-responsive">
          <table class="table table-borderless mb-0">
            <thead><tr><th>Batch ID</th><th>Batch Name</th><th>Course Name</th><th>Action</th></tr></thead>
            <tbody id="fta-batches-tbody"><tr><td colspan="4" class="text-center py-4">Loading…</td></tr></tbody>
          </table>
        </div></div>
      </div>
    </div>
  </div>`;
  loadFeesAdmin();
  loadBatchesAdmin();

  document.getElementById('ft-batch-form').addEventListener('submit',async e=>{
    e.preventDefault(); const m=document.getElementById('fta-msg');
    try{
      await api('FeesTracking/batches','POST',{
        batchName:document.getElementById('ft-bname').value,
        courseName:document.getElementById('ft-cname').value
      });
      m.innerHTML=alertBox('Batch saved!'); document.getElementById('ft-batch-form').reset(); loadBatchesAdmin();
    }catch(err){m.innerHTML=alertBox('Error: '+err.message,'danger');}
  });
}
async function loadFeesAdmin(){
  const tb=document.getElementById('fta-tbody'); if(!tb)return;
  tb.innerHTML=`<tr><td colspan="5" class="text-center">${spinner()}</td></tr>`;
  try{
    const d=await api('FeesTracking/getAllEnrollments');
    const items=d.data||d||[];
    if(!items.length){tb.innerHTML=`<tr><td colspan="5" class="text-center text-muted py-3">No student enrollment logs found.</td></tr>`;return;}
    tb.innerHTML=items.map(r=>{
      const id=r.enrollmentId||r.id||0;
      return `<tr>
        <td><strong>${r.studentName||'—'}</strong><br><small class="text-muted">${r.email||''}</small></td>
        <td><span class="badge bg-secondary">${r.batchName||r.batchId||'—'}</span></td>
        <td class="small">Total: ₹${r.totalAmount||0}<br>Paid: ₹${r.amountReceived||0}</td>
        <td class="small fw-semibold text-danger">₹${r.pendingAmount||0}</td>
        <td><button class="btn btn-danger btn-sm py-1 px-2" onclick="deleteEnrollment(${id})"><i class="bi bi-trash"></i></button></td>
      </tr>`;
    }).join('');
  }catch(err){tb.innerHTML=`<tr><td colspan="5" class="text-danger text-center py-3">${err.message}</td></tr>`;}
}
async function loadBatchesAdmin(){
  const tb=document.getElementById('fta-batches-tbody'); if(!tb)return;
  tb.innerHTML=`<tr><td colspan="4" class="text-center">${spinner()}</td></tr>`;
  try{
    const d=await api('FeesTracking/batches');
    const items=d.data||d||[];
    if(!items.length){tb.innerHTML=`<tr><td colspan="4" class="text-center text-muted py-3">No batches recorded.</td></tr>`;return;}
    tb.innerHTML=items.map(b=>{
      const id=b.batchId||b.id||0;
      return `<tr>
        <td><span class="badge bg-secondary">${id}</span></td>
        <td><strong>${b.batchName||'—'}</strong></td>
        <td class="small">${b.courseName||'—'}</td>
        <td><button class="btn btn-danger btn-sm py-1 px-2" onclick="deleteBatch(${id})"><i class="bi bi-trash"></i></button></td>
      </tr>`;
    }).join('');
  }catch(err){tb.innerHTML=`<tr><td colspan="4" class="text-danger text-center py-3">${err.message}</td></tr>`;}
}
async function deleteEnrollment(id){
  if(!confirm('Are you sure you want to delete this student enrollment log?'))return;
  try{await api(`FeesTracking/DeleteById?id=${id}`,'DELETE'); loadFeesAdmin();}
  catch(err){alert('Failed: '+err.message);}
}
async function deleteBatch(id){
  if(!confirm('Are you sure you want to delete this batch?'))return;
  try{await api(`FeesTracking/batches/${id}`,'DELETE'); loadBatchesAdmin();}
  catch(err){alert('Failed: '+err.message);}
}

// 9. GOAL TRACKER ADMIN
async function renderGoaltrackerAdmin(c){
  c.innerHTML=`
  <div class="section-heading"><i class="bi bi-bullseye me-2" style="color:#bc8cff"></i>Goal Tracker (Admin)</div>
  <div class="section-sub">Audit user accounts, check progress logs, and clear system notifications</div>
  <div id="gta-msg"></div>
  <div class="row g-4">
    <div class="col-lg-5">
      <div class="card">
        <div class="card-header d-flex justify-content-between align-items-center">
          <strong class="small"><i class="bi bi-people me-2"></i>Active Goal Users</strong>
          <button class="btn btn-outline-primary btn-sm" onclick="loadGoalUsersAdmin()"><i class="bi bi-arrow-clockwise"></i></button>
        </div>
        <div class="card-body p-0"><div class="table-responsive">
          <table class="table table-borderless mb-0">
            <thead><tr><th>ID</th><th>Username</th><th>Action</th></tr></thead>
            <tbody id="gta-users-tbody"><tr><td colspan="3" class="text-center py-4">Loading…</td></tr></tbody>
          </table>
        </div></div>
      </div>
    </div>
    <div class="col-lg-7">
      <div class="card">
        <div class="card-header d-flex justify-content-between align-items-center">
          <strong class="small"><i class="bi bi-bell-slash me-2"></i>Reminders Registry</strong>
          <button class="btn btn-outline-primary btn-sm" onclick="loadGoalRemindersAdmin()"><i class="bi bi-arrow-clockwise"></i></button>
        </div>
        <div class="card-body p-0"><div class="table-responsive">
          <table class="table table-borderless mb-0">
            <thead><tr><th>Reminder Log</th><th>Created Date</th><th>Action</th></tr></thead>
            <tbody id="gta-rem-tbody"><tr><td colspan="3" class="text-center py-4">Loading…</td></tr></tbody>
          </table>
        </div></div>
      </div>
    </div>
  </div>`;
  loadGoalUsersAdmin();
  loadGoalRemindersAdmin();
}
async function loadGoalUsersAdmin(){
  const tb=document.getElementById('gta-users-tbody'); if(!tb)return;
  tb.innerHTML=`<tr><td colspan="3" class="text-center">${spinner()}</td></tr>`;
  try{
    const d=await api('GoalTracker/getAllUsers');
    const items=d.data||d||[];
    if(!items.length){tb.innerHTML=`<tr><td colspan="3" class="text-center text-muted py-3">No user profiles found.</td></tr>`;return;}
    tb.innerHTML=items.map(u=>{
      const id=u.userId||u.id||0;
      return `<tr>
        <td><span class="badge bg-secondary">${id}</span></td>
        <td><strong>@${u.userName||u.username||'User'}</strong><br><small class="text-muted">${u.email||''}</small></td>
        <td><button class="btn btn-danger btn-sm py-1 px-2" onclick="deleteGoalUser(${id})"><i class="bi bi-trash"></i></button></td>
      </tr>`;
    }).join('');
  }catch(err){tb.innerHTML=`<tr><td colspan="3" class="text-danger text-center py-3">${err.message}</td></tr>`;}
}
async function loadGoalRemindersAdmin(){
  const tb=document.getElementById('gta-rem-tbody'); if(!tb)return;
  tb.innerHTML=`<tr><td colspan="3" class="text-center">${spinner()}</td></tr>`;
  try{
    const d=await api('GoalTracker/getReminders');
    const items=d.data||d||[];
    if(!items.length){tb.innerHTML=`<tr><td colspan="3" class="text-center text-muted py-3">No reminders logged.</td></tr>`;return;}
    tb.innerHTML=items.map(r=>{
      const id=r.reminderId||r.id||0;
      return `<tr>
        <td><strong class="small">${r.reminderText||'Reminder notification'}</strong><br><small class="text-muted">Target Time: ${r.reminderTime||'—'}</small></td>
        <td class="small text-muted">${r.createdDate?new Date(r.createdDate).toLocaleDateString():'—'}</td>
        <td><button class="btn btn-danger btn-sm py-1 px-2" onclick="deleteGoalReminder(${id})"><i class="bi bi-trash"></i></button></td>
      </tr>`;
    }).join('');
  }catch(err){tb.innerHTML=`<tr><td colspan="3" class="text-danger text-center py-3">${err.message}</td></tr>`;}
}
async function deleteGoalUser(id){
  if(!confirm('Are you sure you want to delete this user profile?'))return;
  try{await api(`GoalTracker/deleteUserById?id=${id}`,'DELETE'); loadGoalUsersAdmin();}
  catch(err){alert('Failed: '+err.message);}
}
async function deleteGoalReminder(id){
  if(!confirm('Are you sure you want to delete this reminder?'))return;
  try{await api(`GoalTracker/deleteReminder/${id}`,'DELETE'); loadGoalRemindersAdmin();}
  catch(err){alert('Failed: '+err.message);}
}

// 10. LEAVE TRACKER ADMIN
async function renderLeavetrackerAdmin(c){
  c.innerHTML=`
  <div class="section-heading"><i class="bi bi-calendar-x me-2" style="color:var(--accent)"></i>Leave & Attendance Setup (Admin)</div>
  <div class="section-sub">Add staff profiles, configure leave allocations, and audit balance sheets</div>
  <div id="lta-msg"></div>
  <div class="row g-4">
    <div class="col-lg-4">
      <div class="card mb-4">
        <div class="card-header"><strong class="small"><i class="bi bi-plus-circle me-2"></i>Add Staff Member</strong></div>
        <div class="card-body">
          <form id="lt-emp-form">
            <div class="mb-2"><label class="form-label">Full Name</label><input class="form-control form-control-sm" id="lt-ename" required placeholder="Jane Doe"/></div>
            <div class="mb-2"><label class="form-label">Email</label><input type="email" class="form-control form-control-sm" id="lt-eemail" required placeholder="jane@company.com"/></div>
            <div class="mb-2"><label class="form-label">Phone</label><input class="form-control form-control-sm" id="lt-ephone" required placeholder="9876543210"/></div>
            <div class="mb-3"><label class="form-label">Department</label><input class="form-control form-control-sm" id="lt-edept" required placeholder="Engineering"/></div>
            <button type="submit" class="btn btn-primary btn-sm w-100"><i class="bi bi-check-circle me-1"></i>Save Staff</button>
          </form>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><strong class="small"><i class="bi bi-cash-coin me-2"></i>Allocate Leave Balance</strong></div>
        <div class="card-body">
          <form id="lt-bal-form">
            <div class="mb-2"><label class="form-label">Employee ID</label><input type="number" class="form-control form-control-sm" id="lt-beid" required value="1"/></div>
            <div class="mb-2"><label class="form-label">Leave Type ID</label><input type="number" class="form-control form-control-sm" id="lt-bltid" required value="1"/></div>
            <div class="mb-3"><label class="form-label">Allocated Days</label><input type="number" class="form-control form-control-sm" id="lt-bdays" required value="15"/></div>
            <button type="submit" class="btn btn-primary btn-sm w-100"><i class="bi bi-plus-circle me-1"></i>Allocate Days</button>
          </form>
        </div>
      </div>
    </div>
    <div class="col-lg-8">
      <div class="card mb-4">
        <div class="card-header d-flex justify-content-between align-items-center">
          <strong class="small"><i class="bi bi-table me-2"></i>Staff Directory</strong>
          <button class="btn btn-outline-primary btn-sm" onclick="loadLeaveStaffAdmin()"><i class="bi bi-arrow-clockwise"></i></button>
        </div>
        <div class="card-body p-0"><div class="table-responsive">
          <table class="table table-borderless mb-0">
            <thead><tr><th>Staff ID</th><th>Name</th><th>Department</th><th>Contact</th><th>Action</th></tr></thead>
            <tbody id="lta-staff-tbody"><tr><td colspan="5" class="text-center py-4">Loading…</td></tr></tbody>
          </table>
        </div></div>
      </div>
      <div class="card">
        <div class="card-header d-flex justify-content-between align-items-center">
          <strong class="small"><i class="bi bi-journals me-2"></i>System Leave Balance Sheet</strong>
          <button class="btn btn-outline-primary btn-sm" onclick="loadLeaveBalancesAdmin()"><i class="bi bi-arrow-clockwise"></i></button>
        </div>
        <div class="card-body p-0"><div class="table-responsive">
          <table class="table table-borderless mb-0">
            <thead><tr><th>Record ID</th><th>Emp ID / Name</th><th>Leave Type</th><th>Total Days</th><th>Action</th></tr></thead>
            <tbody id="lta-bal-tbody"><tr><td colspan="5" class="text-center py-4">Loading…</td></tr></tbody>
          </table>
        </div></div>
      </div>
    </div>
  </div>`;
  loadLeaveStaffAdmin();
  loadLeaveBalancesAdmin();

  document.getElementById('lt-emp-form').addEventListener('submit',async e=>{
    e.preventDefault(); const m=document.getElementById('lta-msg');
    try{
      await api('LeaveTracker/CreateNewEmployee','POST',{
        employeeName:document.getElementById('lt-ename').value,
        email:document.getElementById('lt-eemail').value,
        phone:document.getElementById('lt-ephone').value,
        department:document.getElementById('lt-edept').value,
        role:'Staff'
      });
      m.innerHTML=alertBox('Staff member saved!'); document.getElementById('lt-emp-form').reset(); loadLeaveStaffAdmin();
    }catch(err){m.innerHTML=alertBox('Error: '+err.message,'danger');}
  });

  document.getElementById('lt-bal-form').addEventListener('submit',async e=>{
    e.preventDefault(); const m=document.getElementById('lta-msg');
    try{
      await api('LeaveTracker/AddLeaveBalance','POST',{
        employeeId:parseInt(document.getElementById('lt-beid').value)||1,
        leaveTypeId:parseInt(document.getElementById('lt-bltid').value)||1,
        leaveBalance:parseInt(document.getElementById('lt-bdays').value)||15
      });
      m.innerHTML=alertBox('Leave balance allocated!'); document.getElementById('lt-bal-form').reset(); loadLeaveBalancesAdmin();
    }catch(err){m.innerHTML=alertBox('Error: '+err.message,'danger');}
  });
}
async function loadLeaveStaffAdmin(){
  const tb=document.getElementById('lta-staff-tbody'); if(!tb)return;
  tb.innerHTML=`<tr><td colspan="5" class="text-center">${spinner()}</td></tr>`;
  try{
    const d=await api('LeaveTracker/getAllEmployee');
    const items=d.data||d||[];
    if(!items.length){tb.innerHTML=`<tr><td colspan="5" class="text-center text-muted py-3">No staff members listed.</td></tr>`;return;}
    tb.innerHTML=items.map(e=>{
      const id=e.employeeId||e.id||0;
      return `<tr>
        <td><span class="badge bg-secondary">${id}</span></td>
        <td><strong>${e.employeeName||'—'}</strong><br><small class="text-muted">${e.email||''}</small></td>
        <td class="small">${e.department||'—'}</td>
        <td class="small text-muted">${e.phone||'—'}</td>
        <td><button class="btn btn-danger btn-sm py-1 px-2" onclick="deleteLeaveStaff(${id})"><i class="bi bi-trash"></i></button></td>
      </tr>`;
    }).join('');
  }catch(err){tb.innerHTML=`<tr><td colspan="5" class="text-danger text-center py-3">${err.message}</td></tr>`;}
}
async function loadLeaveBalancesAdmin(){
  const tb=document.getElementById('lta-bal-tbody'); if(!tb)return;
  tb.innerHTML=`<tr><td colspan="5" class="text-center">${spinner()}</td></tr>`;
  try{
    const d=await api('LeaveTracker/GetAllBalances');
    const items=d.data||d||[];
    if(!items.length){tb.innerHTML=`<tr><td colspan="5" class="text-center text-muted py-3">No leave allocations.</td></tr>`;return;}
    tb.innerHTML=items.map(b=>{
      const id=b.balanceId||b.id||0;
      return `<tr>
        <td><span class="badge bg-secondary">${id}</span></td>
        <td><strong>Employee #${b.employeeId||'1'}</strong></td>
        <td><span class="badge bg-secondary bg-opacity-25 text-secondary">Type #${b.leaveTypeId||'1'}</span></td>
        <td class="small fw-semibold">${b.leaveBalance||0} days</td>
        <td><button class="btn btn-danger btn-sm py-1 px-2" onclick="deleteLeaveBalance(${id})"><i class="bi bi-trash"></i></button></td>
      </tr>`;
    }).join('');
  }catch(err){tb.innerHTML=`<tr><td colspan="5" class="text-danger text-center py-3">${err.message}</td></tr>`;}
}
async function deleteLeaveStaff(id){
  if(!confirm('Are you sure you want to delete this staff profile?'))return;
  try{await api(`LeaveTracker/DeleteEmployee?id=${id}`,'DELETE'); loadLeaveStaffAdmin();}
  catch(err){alert('Failed: '+err.message);}
}
async function deleteLeaveBalance(id){
  if(!confirm('Are you sure you want to delete this allocation?'))return;
  try{await api(`LeaveTracker/deleteBalanceById?id=${id}`,'DELETE'); loadLeaveBalancesAdmin();}
  catch(err){alert('Failed: '+err.message);}
}

// 11. PROJECT COMPETITION ADMIN
async function renderProjectcompetitionAdmin(c){
  c.innerHTML=`
  <div class="section-heading"><i class="bi bi-trophy me-2" style="color:var(--warning-custom)"></i>Competition Coordinator (Admin)</div>
  <div class="section-sub">Create competitions, manage entry lists, and approve winners</div>
  <div id="pca-msg"></div>
  <div class="row g-4">
    <div class="col-lg-4">
      <div class="card">
        <div class="card-header"><strong class="small"><i class="bi bi-plus-circle me-2"></i>Create Competition</strong></div>
        <div class="card-body">
          <form id="pc-comp-form">
            <div class="mb-2"><label class="form-label">Competition Name</label><input class="form-control form-control-sm" id="pc-cname" required placeholder="National Tech Hack 2026"/></div>
            <div class="row g-2 mb-2">
              <div class="col-6"><label class="form-label">Start Date</label><input type="date" class="form-control form-control-sm" id="pc-csdate" required/></div>
              <div class="col-6"><label class="form-label">End Date</label><input type="date" class="form-control form-control-sm" id="pc-cedate" required/></div>
            </div>
            <div class="mb-3"><label class="form-label">Description</label><textarea class="form-control form-control-sm" id="pc-cdesc" rows="3" placeholder="Hackathon rules…"></textarea></div>
            <button type="submit" class="btn btn-primary btn-sm w-100"><i class="bi bi-check-circle me-1"></i>Publish Competition</button>
          </form>
        </div>
      </div>
    </div>
    <div class="col-lg-8">
      <div class="card mb-4">
        <div class="card-header d-flex justify-content-between align-items-center">
          <strong class="small"><i class="bi bi-mortarboard me-2"></i>Pending Submissions Review</strong>
          <button class="btn btn-outline-primary btn-sm" onclick="loadCompetitionSubmissionsAdmin()"><i class="bi bi-arrow-clockwise"></i></button>
        </div>
        <div class="card-body p-0"><div class="table-responsive">
          <table class="table table-borderless mb-0">
            <thead><tr><th>Project Title</th><th>GitHub</th><th>Comp ID</th><th>Status</th><th>Review Actions</th></tr></thead>
            <tbody id="pca-sub-tbody"><tr><td colspan="5" class="text-center py-4">Loading…</td></tr></tbody>
          </table>
        </div></div>
      </div>
      <div class="card">
        <div class="card-header d-flex justify-content-between align-items-center">
          <strong class="small"><i class="bi bi-trophy-fill me-2"></i>Active Competitions</strong>
          <button class="btn btn-outline-primary btn-sm" onclick="loadCompetitionsAdmin()"><i class="bi bi-arrow-clockwise"></i></button>
        </div>
        <div class="card-body p-0"><div class="table-responsive">
          <table class="table table-borderless mb-0">
            <thead><tr><th>ID</th><th>Competition Name</th><th>Timeline</th><th>Action</th></tr></thead>
            <tbody id="pca-comp-tbody"><tr><td colspan="4" class="text-center py-4">Loading…</td></tr></tbody>
          </table>
        </div></div>
      </div>
    </div>
  </div>`;
  loadCompetitionSubmissionsAdmin();
  loadCompetitionsAdmin();

  document.getElementById('pc-comp-form').addEventListener('submit',async e=>{
    e.preventDefault(); const m=document.getElementById('pca-msg');
    try{
      await api('ProjectCompetition/competition','POST',{
        competitionName:document.getElementById('pc-cname').value,
        startDate:document.getElementById('pc-csdate').value,
        endDate:document.getElementById('pc-cedate').value,
        description:document.getElementById('pc-cdesc').value
      });
      m.innerHTML=alertBox('Competition published!'); document.getElementById('pc-comp-form').reset(); loadCompetitionsAdmin();
    }catch(err){m.innerHTML=alertBox('Error: '+err.message,'danger');}
  });
}
async function loadCompetitionSubmissionsAdmin(){
  const tb=document.getElementById('pca-sub-tbody'); if(!tb)return;
  tb.innerHTML=`<tr><td colspan="5" class="text-center">${spinner()}</td></tr>`;
  try{
    const d=await api('ProjectCompetition/project');
    const items=d.data||d||[];
    if(!items.length){tb.innerHTML=`<tr><td colspan="5" class="text-center text-muted py-3">No submissions.</td></tr>`;return;}
    tb.innerHTML=items.map(p=>{
      const id=p.projectId||p.id||0;
      const st=p.status||'Pending';
      const sc=st==='Approved'?'var(--success-custom)':st==='Rejected'?'var(--danger-custom)':'var(--warning-custom)';
      return `<tr>
        <td><strong>${p.projectTitle||'—'}</strong><br><small class="text-muted">${(p.description||'').substring(0,50)}</small></td>
        <td class="small">${p.githubLink?`<a href="${p.githubLink}" target="_blank" class="text-accent">Link</a>`:'—'}</td>
        <td class="small text-muted">Comp #${p.competitionId||'1'}</td>
        <td><span class="badge" style="background:${sc}22;color:${sc}">${st}</span></td>
        <td>
          <div class="btn-group">
            <button class="btn btn-success btn-sm py-1 px-2" onclick="reviewCompetitionProject(${id}, 'approve')" title="Approve"><i class="bi bi-check-lg"></i></button>
            <button class="btn btn-warning btn-sm py-1 px-2 text-dark" onclick="reviewCompetitionProject(${id}, 'reject')" title="Reject"><i class="bi bi-x-lg"></i></button>
            <button class="btn btn-primary btn-sm py-1 px-2" onclick="reviewCompetitionProject(${id}, 'winner')" title="Mark Winner"><i class="bi bi-trophy-fill"></i></button>
          </div>
        </td>
      </tr>`;
    }).join('');
  }catch(err){tb.innerHTML=`<tr><td colspan="5" class="text-danger text-center py-3">${err.message}</td></tr>`;}
}
async function loadCompetitionsAdmin(){
  const tb=document.getElementById('pca-comp-tbody'); if(!tb)return;
  tb.innerHTML=`<tr><td colspan="4" class="text-center">${spinner()}</td></tr>`;
  try{
    const d=await api('ProjectCompetition/GetAllCompetition');
    const items=d.data||d||[];
    if(!items.length){tb.innerHTML=`<tr><td colspan="4" class="text-center text-muted py-3">No active competitions.</td></tr>`;return;}
    tb.innerHTML=items.map(c=>{
      const id=c.competitionId||c.id||0;
      return `<tr>
        <td><span class="badge bg-secondary">${id}</span></td>
        <td><strong>${c.competitionName||'—'}</strong><br><small class="text-muted">${(c.description||'').substring(0,50)}</small></td>
        <td class="small text-muted">${c.startDate?new Date(c.startDate).toLocaleDateString():'—'} \| ${c.endDate?new Date(c.endDate).toLocaleDateString():'—'}</td>
        <td><button class="btn btn-danger btn-sm py-1 px-2" onclick="deleteCompetition(${id})"><i class="bi bi-trash"></i></button></td>
      </tr>`;
    }).join('');
  }catch(err){tb.innerHTML=`<tr><td colspan="4" class="text-danger text-center py-3">${err.message}</td></tr>`;}
}
async function reviewCompetitionProject(id, action){
  try{
    await api(`ProjectCompetition/project/${action}/${id}`,'PUT');
    loadCompetitionSubmissionsAdmin();
  }catch(err){alert('Failed: '+err.message);}
}
async function deleteCompetition(id){
  if(!confirm('Are you sure you want to delete this competition?'))return;
  try{await api(`ProjectCompetition/delete/${id}`,'DELETE'); loadCompetitionsAdmin();}
  catch(err){alert('Failed: '+err.message);}
}

// 12. SMART PARKING ADMIN
async function renderSmartparkingAdmin(c){
  c.innerHTML=`
  <div class="section-heading"><i class="bi bi-p-circle me-2" style="color:var(--success-custom)"></i>Smart Parking Setup (Admin)</div>
  <div class="section-sub">Configure sites, floors, manage clients, and monitor exit transactions</div>
  <div id="spa-msg"></div>
  
  <ul class="nav nav-pills mb-3 gap-2" role="tablist">
    <li class="nav-item"><button class="btn btn-outline-primary btn-sm active" data-bs-toggle="pill" data-bs-target="#spa-client" type="button">Clients Manager</button></li>
    <li class="nav-item"><button class="btn btn-outline-primary btn-sm" data-bs-toggle="pill" data-bs-target="#spa-site" type="button">Sites Manager</button></li>
    <li class="nav-item"><button class="btn btn-outline-primary btn-sm" data-bs-toggle="pill" data-bs-target="#spa-floor" type="button">Floors Setup</button></li>
  </ul>
  
  <div class="tab-content">
    <!-- CLIENTS -->
    <div class="tab-pane fade show active" id="spa-client">
      <div class="row g-4">
        <div class="col-md-5">
          <div class="card">
            <div class="card-header"><strong class="small"><i class="bi bi-plus-circle"></i> Add Client</strong></div>
            <div class="card-body">
              <form id="spa-client-form">
                <div class="mb-3"><label class="form-label">Client Name</label><input class="form-control form-control-sm" id="spa-clname" required placeholder="Inorbit Mall Group"/></div>
                <button type="submit" class="btn btn-primary btn-sm w-100"><i class="bi bi-check-circle"></i> Save Client</button>
              </form>
            </div>
          </div>
        </div>
        <div class="col-md-7">
          <div class="card">
            <div class="card-header"><strong class="small"><i class="bi bi-people"></i> Registered Clients</strong></div>
            <div class="card-body p-0"><div class="table-responsive">
              <table class="table table-borderless mb-0">
                <thead><tr><th>Client ID</th><th>Client Name</th><th>Action</th></tr></thead>
                <tbody id="spa-client-tbody"><tr><td colspan="3" class="text-center py-4">Loading…</td></tr></tbody>
              </table>
            </div></div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- SITES -->
    <div class="tab-pane fade" id="spa-site">
      <div class="row g-4">
        <div class="col-md-5">
          <div class="card">
            <div class="card-header"><strong class="small"><i class="bi bi-plus-circle"></i> Add Parking Site</strong></div>
            <div class="card-body">
              <form id="spa-site-form">
                <div class="mb-2"><label class="form-label">Site Name</label><input class="form-control form-control-sm" id="spa-sname" required placeholder="Wroclavia site"/></div>
                <div class="mb-3"><label class="form-label">Client ID</label><input type="number" class="form-control form-control-sm" id="spa-sclid" required value="1"/></div>
                <button type="submit" class="btn btn-primary btn-sm w-100"><i class="bi bi-check-circle"></i> Save Site</button>
              </form>
            </div>
          </div>
        </div>
        <div class="col-md-7">
          <div class="card">
            <div class="card-header"><strong class="small"><i class="bi bi-geo-alt"></i> Sites Catalog</strong></div>
            <div class="card-body p-0"><div class="table-responsive">
              <table class="table table-borderless mb-0">
                <thead><tr><th>Site ID</th><th>Site Name</th><th>Client ID</th><th>Action</th></tr></thead>
                <tbody id="spa-site-tbody"><tr><td colspan="4" class="text-center py-4">Loading…</td></tr></tbody>
              </table>
            </div></div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- FLOORS -->
    <div class="tab-pane fade" id="spa-floor">
      <div class="row g-4">
        <div class="col-md-5">
          <div class="card">
            <div class="card-header"><strong class="small"><i class="bi bi-plus-circle"></i> Add Floor Level</strong></div>
            <div class="card-body">
              <form id="spa-floor-form">
                <div class="mb-2"><label class="form-label">Floor Label</label><input class="form-control form-control-sm" id="spa-flbl" required placeholder="Floor P-1"/></div>
                <div class="mb-3"><label class="form-label">Site ID</label><input type="number" class="form-control form-control-sm" id="spa-fsid" required value="1"/></div>
                <button type="submit" class="btn btn-primary btn-sm w-100"><i class="bi bi-check-circle"></i> Save Floor</button>
              </form>
            </div>
          </div>
        </div>
        <div class="col-md-7">
          <div class="card">
            <div class="card-header"><strong class="small"><i class="bi bi-layers"></i> Floor Levels</strong></div>
            <div class="card-body p-0"><div class="table-responsive">
              <table class="table table-borderless mb-0">
                <thead><tr><th>Floor ID</th><th>Floor Label</th><th>Site ID</th><th>Action</th></tr></thead>
                <tbody id="spa-floor-tbody"><tr><td colspan="4" class="text-center py-4">Loading…</td></tr></tbody>
              </table>
            </div></div>
          </div>
        </div>
      </div>
    </div>
  </div>`;

  loadSmartClientsAdmin();
  loadSmartSitesAdmin();
  loadSmartFloorsAdmin();

  document.getElementById('spa-client-form').addEventListener('submit',async e=>{
    e.preventDefault(); const m=document.getElementById('spa-msg');
    try{
      await api('SmartParking/AddClient','POST',{clientName:document.getElementById('spa-clname').value});
      m.innerHTML=alertBox('Parking Client registered!'); document.getElementById('spa-client-form').reset(); loadSmartClientsAdmin();
    }catch(err){m.innerHTML=alertBox('Error: '+err.message,'danger');}
  });

  document.getElementById('spa-site-form').addEventListener('submit',async e=>{
    e.preventDefault(); const m=document.getElementById('spa-msg');
    try{
      await api('SmartParking/AddClientSite','POST',{
        siteName:document.getElementById('spa-sname').value,
        clientId:parseInt(document.getElementById('spa-sclid').value)||1
      });
      m.innerHTML=alertBox('Parking Site saved!'); document.getElementById('spa-site-form').reset(); loadSmartSitesAdmin();
    }catch(err){m.innerHTML=alertBox('Error: '+err.message,'danger');}
  });

  document.getElementById('spa-floor-form').addEventListener('submit',async e=>{
    e.preventDefault(); const m=document.getElementById('spa-msg');
    try{
      await api('SmartParking/AddFloor','POST',{
        floorNo:document.getElementById('spa-flbl').value,
        siteId:parseInt(document.getElementById('spa-fsid').value)||1
      });
      m.innerHTML=alertBox('Floor saved!'); document.getElementById('spa-floor-form').reset(); loadSmartFloorsAdmin();
    }catch(err){m.innerHTML=alertBox('Error: '+err.message,'danger');}
  });
}
async function loadSmartClientsAdmin(){
  const tb=document.getElementById('spa-client-tbody'); if(!tb)return;
  tb.innerHTML=`<tr><td colspan="3" class="text-center">${spinner()}</td></tr>`;
  try{
    const d=await api('SmartParking/GetAllClients');
    const items=d.data||d||[];
    if(!items.length){tb.innerHTML=`<tr><td colspan="3" class="text-center text-muted py-3">No clients found.</td></tr>`;return;}
    tb.innerHTML=items.map(c=>{
      const id=c.clientId||c.id||0;
      return `<tr>
        <td><span class="badge bg-secondary">${id}</span></td>
        <td><strong>${c.clientName||'—'}</strong></td>
        <td><button class="btn btn-danger btn-sm py-1 px-2" onclick="deleteSmartClient(${id})"><i class="bi bi-trash"></i></button></td>
      </tr>`;
    }).join('');
  }catch(err){tb.innerHTML=`<tr><td colspan="3" class="text-danger text-center py-3">${err.message}</td></tr>`;}
}
async function loadSmartSitesAdmin(){
  const tb=document.getElementById('spa-site-tbody'); if(!tb)return;
  tb.innerHTML=`<tr><td colspan="4" class="text-center">${spinner()}</td></tr>`;
  try{
    const d=await api('SmartParking/GetAllSites');
    const items=d.data||d||[];
    if(!items.length){tb.innerHTML=`<tr><td colspan="4" class="text-center text-muted py-3">No sites listed.</td></tr>`;return;}
    tb.innerHTML=items.map(s=>{
      const id=s.siteId||s.id||0;
      return `<tr>
        <td><span class="badge bg-secondary">${id}</span></td>
        <td><strong>${s.siteName||'—'}</strong></td>
        <td>Client #${s.clientId||'1'}</td>
        <td><button class="btn btn-danger btn-sm py-1 px-2" onclick="deleteSmartSite(${id})"><i class="bi bi-trash"></i></button></td>
      </tr>`;
    }).join('');
  }catch(err){tb.innerHTML=`<tr><td colspan="4" class="text-danger text-center py-3">${err.message}</td></tr>`;}
}
async function loadSmartFloorsAdmin(){
  const tb=document.getElementById('spa-floor-tbody'); if(!tb)return;
  tb.innerHTML=`<tr><td colspan="4" class="text-center">${spinner()}</td></tr>`;
  try{
    const d=await api('SmartParking/GetAllFloor');
    const items=d.data||d||[];
    if(!items.length){tb.innerHTML=`<tr><td colspan="4" class="text-center text-muted py-3">No floors listed.</td></tr>`;return;}
    tb.innerHTML=items.map(f=>{
      const id=f.floorId||f.id||0;
      return `<tr>
        <td><span class="badge bg-secondary">${id}</span></td>
        <td><strong>${f.floorNo||'—'}</strong></td>
        <td>Site #${f.siteId||'1'}</td>
        <td><button class="btn btn-danger btn-sm py-1 px-2" onclick="deleteSmartFloor(${id})"><i class="bi bi-trash"></i></button></td>
      </tr>`;
    }).join('');
  }catch(err){tb.innerHTML=`<tr><td colspan="4" class="text-danger text-center py-3">${err.message}</td></tr>`;}
}
async function deleteSmartClient(id){
  if(!confirm('Are you sure you want to delete this client?'))return;
  try{await api('SmartParking/DeleteClient','POST',{clientId:id}); loadSmartClientsAdmin();}
  catch(err){alert('Failed: '+err.message);}
}
async function deleteSmartSite(id){
  if(!confirm('Are you sure you want to delete this site?'))return;
  try{await api('SmartParking/DeleteSite','POST',{siteId:id}); loadSmartSitesAdmin();}
  catch(err){alert('Failed: '+err.message);}
}
async function deleteSmartFloor(id){
  if(!confirm('Are you sure you want to delete this floor level?'))return;
  try{await api('SmartParking/DeleteFloor','POST',{floorId:id}); loadSmartFloorsAdmin();}
  catch(err){alert('Failed: '+err.message);}
}

// 13. SURVEY ADMIN
async function renderSurveyAdmin(c){
  c.innerHTML=`
  <div class="section-heading"><i class="bi bi-card-checklist me-2" style="color:#bc8cff"></i>Survey Builder & Analytics</div>
  <div class="section-sub">Create dynamic surveys, build questionnaires, and analyze response counts</div>
  <div id="sua-msg"></div>
  <div class="row g-4">
    <div class="col-lg-5">
      <div class="card mb-4">
        <div class="card-header"><strong class="small"><i class="bi bi-plus-circle me-2"></i>Create New Survey</strong></div>
        <div class="card-body">
          <form id="su-add-form">
            <div class="mb-2"><label class="form-label">Survey Title</label><input class="form-control form-control-sm" id="su-title" required placeholder="Student Course Feedback"/></div>
            <div class="mb-3"><label class="form-label">Description</label><textarea class="form-control form-control-sm" id="su-desc" rows="2" placeholder="Tell users what the survey is about…"></textarea></div>
            <button type="submit" class="btn btn-primary btn-sm w-100"><i class="bi bi-check-circle me-1"></i>Publish Survey</button>
          </form>
        </div>
      </div>
      <div class="card mb-4">
        <div class="card-header"><strong class="small"><i class="bi bi-question-circle me-2"></i>Add Question</strong></div>
        <div class="card-body">
          <form id="su-q-form">
            <div class="mb-2"><label class="form-label">Survey ID</label><input type="number" class="form-control form-control-sm" id="su-qsid" required value="1"/></div>
            <div class="mb-3"><label class="form-label">Question Text</label><input class="form-control form-control-sm" id="su-qtext" required placeholder="How rate your instructor?"/></div>
            <button type="submit" class="btn btn-primary btn-sm w-100"><i class="bi bi-plus-circle me-1"></i>Add Question</button>
          </form>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><strong class="small"><i class="bi bi-ui-checks-grid me-2"></i>Add Option</strong></div>
        <div class="card-body">
          <form id="su-o-form">
            <div class="mb-2"><label class="form-label">Question ID</label><input type="number" class="form-control form-control-sm" id="su-oqid" required value="1"/></div>
            <div class="mb-3"><label class="form-label">Option Value</label><input class="form-control form-control-sm" id="su-otext" required placeholder="Excellent (5/5)"/></div>
            <button type="submit" class="btn btn-primary btn-sm w-100"><i class="bi bi-plus-circle me-1"></i>Add Option</button>
          </form>
        </div>
      </div>
    </div>
    <div class="col-lg-7">
      <div class="card">
        <div class="card-header d-flex justify-content-between align-items-center">
          <strong class="small"><i class="bi bi-card-list me-2"></i>Surveys Dashboard</strong>
          <button class="btn btn-outline-primary btn-sm" onclick="loadSurveysAdmin()"><i class="bi bi-arrow-clockwise"></i></button>
        </div>
        <div class="card-body p-0"><div class="table-responsive">
          <table class="table table-borderless mb-0">
            <thead><tr><th>ID</th><th>Survey Title</th><th>Status</th><th>Responses Log</th></tr></thead>
            <tbody id="sua-tbody"><tr><td colspan="4" class="text-center py-4">Loading…</td></tr></tbody>
          </table>
        </div></div>
      </div>
    </div>
  </div>`;
  loadSurveysAdmin();

  document.getElementById('su-add-form').addEventListener('submit',async e=>{
    e.preventDefault(); const m=document.getElementById('sua-msg');
    try{
      await api('Survey/CreateSurvey','POST',{
        surveyTitle:document.getElementById('su-title').value,
        surveyDescription:document.getElementById('su-desc').value,
        userId:1,
        createdOn:new Date().toISOString()
      });
      m.innerHTML=alertBox('Survey profile published successfully!'); document.getElementById('su-add-form').reset(); loadSurveysAdmin();
    }catch(err){m.innerHTML=alertBox('Error: '+err.message,'danger');}
  });

  document.getElementById('su-q-form').addEventListener('submit',async e=>{
    e.preventDefault(); const m=document.getElementById('sua-msg');
    try{
      await api('Survey/AddQuestion','POST',{
        surveyId:parseInt(document.getElementById('su-qsid').value)||1,
        questionText:document.getElementById('su-qtext').value
      });
      m.innerHTML=alertBox('Question added to survey!'); document.getElementById('su-q-form').reset();
    }catch(err){m.innerHTML=alertBox('Error: '+err.message,'danger');}
  });

  document.getElementById('su-o-form').addEventListener('submit',async e=>{
    e.preventDefault(); const m=document.getElementById('sua-msg');
    try{
      await api('Survey/AddOption','POST',{
        questionId:parseInt(document.getElementById('su-oqid').value)||1,
        optionText:document.getElementById('su-otext').value
      });
      m.innerHTML=alertBox('Option added to question!'); document.getElementById('su-o-form').reset();
    }catch(err){m.innerHTML=alertBox('Error: '+err.message,'danger');}
  });
}
async function loadSurveysAdmin(){
  const tb=document.getElementById('sua-tbody'); if(!tb)return;
  tb.innerHTML=`<tr><td colspan="4" class="text-center">${spinner()}</td></tr>`;
  try{
    const d=await api('Survey/GetAllSurveys');
    const items=d.data||d||[];
    if(!items.length){tb.innerHTML=`<tr><td colspan="4" class="text-center text-muted py-3">No surveys found.</td></tr>`;return;}
    
    // We will render rows and fetch survey response count asynchronously
    tb.innerHTML=items.map(s=>{
      const id=s.surveyId||s.id||0;
      const st=s.isActive?'Active':'Closed';
      const sc=s.isActive?'var(--success-custom)':'var(--text-muted-custom)';
      return `<tr>
        <td><span class="badge bg-secondary">${id}</span></td>
        <td><strong>${s.surveyTitle||'—'}</strong><br><small class="text-muted">${(s.surveyDescription||'').substring(0,50)}</small></td>
        <td><span class="badge" style="background:${sc}22;color:${sc}">${st}</span></td>
        <td><button class="btn btn-outline-primary btn-sm py-1 px-2" onclick="loadSurveyResponsesAdmin(${id})"><i class="bi bi-bar-chart me-1"></i>Fetch Counts</button></td>
      </tr>`;
    }).join('');
  }catch(err){tb.innerHTML=`<tr><td colspan="4" class="text-danger text-center py-3">${err.message}</td></tr>`;}
}
async function loadSurveyResponsesAdmin(surveyId){
  try{
    const d=await api(`Survey/survey-response-by-survey/${surveyId}`);
    const responses=d.data||d||[];
    alert(`Survey ID #${surveyId} has ${responses.length} responses registered.`);
  }catch(err){alert('Failed to load count: '+err.message);}
}

// 14. USER APP ADMIN
async function renderUserappAdmin(c){
  c.innerHTML=`
  <div class="section-heading"><i class="bi bi-person-gear me-2" style="color:var(--accent)"></i>User Administration</div>
  <div class="section-sub">Search and update accounts, reset credentials, and oversee profile policies</div>
  <div id="uap-msg"></div>
  <div class="row g-4">
    <div class="col-lg-4">
      <div class="card">
        <div class="card-header"><strong class="small"><i class="bi bi-key me-2"></i>Reset User Password</strong></div>
        <div class="card-body">
          <form id="ua-reset-form">
            <div class="mb-2"><label class="form-label">Customer ID</label><input type="number" class="form-control form-control-sm" id="ua-rcid" required value="1"/></div>
            <div class="mb-3"><label class="form-label">New Password</label><input type="password" class="form-control form-control-sm" id="ua-rpwd" required placeholder="Min 6 characters"/></div>
            <button type="submit" class="btn btn-danger btn-sm w-100"><i class="bi bi-key-fill me-1"></i>Change Password</button>
          </form>
        </div>
      </div>
    </div>
    <div class="col-lg-8">
      <div class="card">
        <div class="card-header d-flex justify-content-between align-items-center">
          <strong class="small"><i class="bi bi-people me-2"></i>System User List</strong>
          <button class="btn btn-outline-primary btn-sm" onclick="loadUsersAdmin()"><i class="bi bi-arrow-clockwise"></i></button>
        </div>
        <div class="card-body p-0"><div class="table-responsive">
          <table class="table table-borderless mb-0">
            <thead><tr><th>ID</th><th>User Details</th><th>Username</th><th>Phone</th><th>Status</th></tr></thead>
            <tbody id="uap-tbody"><tr><td colspan="5" class="text-center py-4">Loading…</td></tr></tbody>
          </table>
        </div></div>
      </div>
    </div>
  </div>`;
  loadUsersAdmin();

  document.getElementById('ua-reset-form').addEventListener('submit',async e=>{
    e.preventDefault(); const m=document.getElementById('uap-msg');
    const cid=document.getElementById('ua-rcid').value;
    try{
      await api(`UserApp/update-password/${cid}`,'PUT',{password:document.getElementById('ua-rpwd').value});
      m.innerHTML=alertBox('User password updated successfully!'); document.getElementById('ua-reset-form').reset();
    }catch(err){m.innerHTML=alertBox('Error: '+err.message,'danger');}
  });
}
async function loadUsersAdmin(){
  const tb=document.getElementById('uap-tbody'); if(!tb)return;
  tb.innerHTML=`<tr><td colspan="5" class="text-center">${spinner()}</td></tr>`;
  try{
    const d=await api('UserApp/GetAllUsers');
    const items=d.data||d||[];
    if(!items.length){tb.innerHTML=`<tr><td colspan="5" class="text-center text-muted py-3">No profiles listed.</td></tr>`;return;}
    tb.innerHTML=items.map(u=>{
      const id=u.customerId||u.id||0;
      const name=`${u.firstName||''} ${u.lastName||''}`.trim()||'User';
      const st=u.isActive===false?'Inactive':'Active';
      const sc=st==='Active'?'var(--success-custom)':'var(--text-muted-custom)';
      return `<tr>
        <td><span class="badge bg-secondary">${id}</span></td>
        <td><strong>${name}</strong><br><small class="text-muted">${u.email||''}</small></td>
        <td class="small text-muted">@${u.userName||'—'}</td>
        <td class="small text-muted">${u.phone||'—'}</td>
        <td><span class="badge" style="background:${sc}22;color:${sc}">${st}</span></td>
      </tr>`;
    }).join('');
  }catch(err){tb.innerHTML=`<tr><td colspan="5" class="text-danger text-center py-3">${err.message}</td></tr>`;}
}

// Overrides & UX Wrappers for Admin Mode Table Loaders
loadBankLoanAdminList = async function() {
  const tb=document.getElementById('bla-tbody'); if(!tb)return;
  tb.innerHTML=`<tr><td colspan="7" class="text-center">${spinner()}</td></tr>`;
  try{
    const d=await api('BankLoan/GetAllApplications');
    const items=d.data||d||[];
    makeTablePremium('bla-tbody', items, (r, i) => {
      const st=r.applicationStatus||'Pending';
      const sc=st==='Approved' || st==='Approve'?'var(--success-custom)':st==='Rejected' || st==='Reject'?'var(--danger-custom)':'var(--warning-custom)';
      const id=r.applicationId||r.id||0;
      return `<tr>
        <td><span class="badge bg-secondary">${id}</span></td>
        <td><strong>${r.fullName||'—'}</strong><br><small class="text-muted">${r.email||''}</small></td>
        <td class="small text-muted">${r.customerPhone||'—'}<br>${r.panCard||'—'}</td>
        <td class="small">₹${Number(r.annualIncome||0).toLocaleString()}</td>
        <td class="small"><span class="badge bg-dark">${r.creditScore||0}</span></td>
        <td><span class="badge" style="background:${sc}22;color:${sc}">${st}</span></td>
        <td>
          <div class="d-flex gap-1">
            <button class="btn btn-success btn-xs" onclick="actionBankloan(${id},'Approve')"><i class="bi bi-check"></i></button>
            <button class="btn btn-danger btn-xs" onclick="actionBankloan(${id},'Reject')"><i class="bi bi-x"></i></button>
          </div>
        </td>
      </tr>`;
    });
  }catch(err){tb.innerHTML=`<tr><td colspan="7" class="text-danger text-center py-3">${err.message}</td></tr>`;}
};

loadBusSchedulesAdmin = async function() {
  const tb=document.getElementById('bba-sched-tbody'); if(!tb)return;
  tb.innerHTML=`<tr><td colspan="6" class="text-center">${spinner()}</td></tr>`;
  try{
    const d=await api('BusBooking/GetBusSchedules');
    const items=d.data||d||[];
    makeTablePremium('bba-sched-tbody', items, (b, i) => {
      const id=b.scheduleId||b.scheduleID||0;
      return `<tr>
        <td><strong>${b.busName||'—'}</strong><br><small class="text-muted">${b.busVehicleNo||''}</small></td>
        <td class="small">${b.fromLocationName||b.fromLocation||'Origin'} → ${b.toLocationName||b.toLocation||'Dest'}</td>
        <td class="small text-muted">${b.departureTime?new Date(b.departureTime).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}):'—'}<br>${b.arrivalTime?new Date(b.arrivalTime).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}):'—'}</td>
        <td class="small fw-semibold">₹${b.price||0}</td>
        <td class="small">${b.availableSeats??b.totalSeats??40}</td>
        <td><button class="btn btn-danger btn-sm py-1 px-2" onclick="deleteBusSchedule(${id})"><i class="bi bi-trash"></i></button></td>
      </tr>`;
    });
  }catch(err){tb.innerHTML=`<tr><td colspan="6" class="text-danger text-center py-3">${err.message}</td></tr>`;}
};

loadBusVendorsAdmin = async function() {
  const tb=document.getElementById('bba-vendor-tbody'); if(!tb)return;
  tb.innerHTML=`<tr><td colspan="4" class="text-center">${spinner()}</td></tr>`;
  try{
    const d=await api('BusBooking/GetBusVendors');
    const items=d.data||d||[];
    makeTablePremium('bba-vendor-tbody', items, (v, i) => {
      const id=v.vendorId||v.id||0;
      return `<tr>
        <td><span class="badge bg-secondary">${id}</span></td>
        <td><strong>${v.vendorName||'—'}</strong></td>
        <td class="small text-muted">${v.emailId||''}<br>${v.contactNo||''}</td>
        <td><button class="btn btn-danger btn-sm py-1 px-2" onclick="deleteBusVendor(${id})"><i class="bi bi-trash"></i></button></td>
      </tr>`;
    });
  }catch(err){tb.innerHTML=`<tr><td colspan="4" class="text-danger text-center py-3">${err.message}</td></tr>`;}
};

loadCollegeProjectAdminList = async function() {
  const tb=document.getElementById('cpa-tbody'); if(!tb)return;
  tb.innerHTML=`<tr><td colspan="6" class="text-center">${spinner()}</td></tr>`;
  try{
    const d=await api('CollegeProject/getAllProjects');
    const items=d.data||d||[];
    makeTablePremium('cpa-tbody', items, (r, i) => {
      const id=r.projectId||r.id||0;
      const st=r.status||'Pending';
      const sc=st==='Approved'?'var(--success-custom)':st==='Rejected'?'var(--danger-custom)':'var(--warning-custom)';
      return `<tr>
        <td><span class="badge bg-secondary">${id}</span></td>
        <td><strong>${r.projectTitle||'—'}</strong><br><small class="text-muted">${(r.description||'').substring(0,40)}</small></td>
        <td class="small">${r.githubLink?`<a href="${r.githubLink}" target="_blank" class="text-accent">GitHub</a>`:'—'}</td>
        <td><span class="badge bg-secondary">Comp #${r.competitionId||1}</span></td>
        <td><span class="badge" style="background:${sc}22;color:${sc}">${st}</span></td>
        <td>
          <div class="d-flex gap-1">
            <button class="btn btn-success btn-xs" onclick="actionCP(${id},'Approved')"><i class="bi bi-check"></i></button>
            <button class="btn btn-danger btn-xs" onclick="actionCP(${id},'Rejected')"><i class="bi bi-x"></i></button>
          </div>
        </td>
      </tr>`;
    });
  }catch(err){tb.innerHTML=`<tr><td colspan="6" class="text-danger text-center py-3">${err.message}</td></tr>`;}
};

loadEcommerceOrders = async function() {
  const tb=document.getElementById('eco-tbody'); if(!tb)return;
  tb.innerHTML=`<tr><td colspan="6" class="text-center">${spinner()}</td></tr>`;
  try{
    const d=await api('Ecommerce/GetAllOrders');
    const items=d.data||d||[];
    makeTablePremium('eco-tbody', items, (r, i) => {
      const id=r.orderId||r.id||0;
      const st=r.status||r.orderStatus||'Pending';
      const sc=st==='Delivered'?'var(--success-custom)':st==='Cancelled'?'var(--danger-custom)':'var(--warning-custom)';
      return `<tr>
        <td><span class="badge bg-secondary">#${id}</span></td>
        <td><strong>Cust #${r.customerId||1}</strong><br><small class="text-muted">${r.orderDate||'—'}</small></td>
        <td class="small text-muted">${r.shippingAddress||'—'}</td>
        <td class="small fw-bold">₹${r.totalAmount||0}</td>
        <td><span class="badge" style="background:${sc}22;color:${sc}">${st}</span></td>
        <td><button class="btn btn-danger btn-xs" onclick="cancelOrderAdmin(${id})"><i class="bi bi-x-circle"></i></button></td>
      </tr>`;
    });
  }catch(err){tb.innerHTML=`<tr><td colspan="6" class="text-danger text-center py-3">${err.message}</td></tr>`;}
};

loadEcommerceProductsAdmin = async function() {
  const tb=document.getElementById('ecp-tbody'); if(!tb)return;
  tb.innerHTML=`<tr><td colspan="6" class="text-center">${spinner()}</td></tr>`;
  try{
    const d=await api('Ecommerce/GetAllProducts');
    const items=d.data||d||[];
    makeTablePremium('ecp-tbody', items, (r, i) => {
      const id=r.productId||r.id||0;
      return `<tr>
        <td><span class="badge bg-secondary">${id}</span></td>
        <td class="small"><strong>${r.productName||'—'}</strong><br><span class="text-muted">${r.categoryName||r.category||'—'}</span></td>
        <td class="small text-muted">${(r.productDescription||'').substring(0,40)}</td>
        <td class="small fw-bold">₹${r.price||0}</td>
        <td class="small"><span class="badge bg-secondary">${r.productQuantity||r.stock||0} units</span></td>
        <td><button class="btn btn-danger btn-xs" onclick="deleteProductAdmin(${id})"><i class="bi bi-trash"></i></button></td>
      </tr>`;
    });
  }catch(err){tb.innerHTML=`<tr><td colspan="6" class="text-danger text-center py-3">${err.message}</td></tr>`;}
};

loadEmployeesAdmin = async function() {
  const tb=document.getElementById('epa-tbody'); if(!tb)return;
  tb.innerHTML=`<tr><td colspan="7" class="text-center">${spinner()}</td></tr>`;
  try{
    const d=await api('EmployeeApp/GetAllEmployees');
    const items=d.data||d||[];
    makeTablePremium('epa-tbody', items, (r, i) => {
      const id=r.employeeId||r.id||0;
      const st=r.employeeType||'Active';
      const sc=st==='Permanent'?'var(--success-custom)':st==='Contract'?'var(--accent)':'var(--warning-custom)';
      return `<tr>
        <td><span class="badge bg-secondary">${id}</span></td>
        <td><strong>${r.fullName||r.name||'—'}</strong><br><small class="text-muted">${r.email||''}</small></td>
        <td class="small">${r.departmentName||'—'}</td>
        <td class="small text-muted">${r.designationName||'—'}</td>
        <td class="small text-muted">${r.phone||'—'}</td>
        <td><span class="badge" style="background:${sc}22;color:${sc}">${st}</span></td>
        <td><button class="btn btn-danger btn-xs" onclick="deleteEmployeeAdmin(${id})"><i class="bi bi-trash"></i></button></td>
      </tr>`;
    });
  }catch(err){tb.innerHTML=`<tr><td colspan="7" class="text-danger text-center py-3">${err.message}</td></tr>`;}
};

loadOnboardingEmployeesAdmin = async function() {
  const tb=document.getElementById('eoa-tbody'); if(!tb)return;
  tb.innerHTML=`<tr><td colspan="6" class="text-center">${spinner()}</td></tr>`;
  try{
    const d=await api('EmployeeOnboarding/GetAllOnboardingEmployees');
    const items=d.data||d||[];
    makeTablePremium('eoa-tbody', items, (r, i) => {
      const id=r.empOnboardingId||r.id||0;
      const st=r.onboardingStatus||'Pending';
      const sc=st==='Completed'?'var(--success-custom)':st==='Rejected'?'var(--danger-custom)':'var(--warning-custom)';
      return `<tr>
        <td><span class="badge bg-secondary">${id}</span></td>
        <td><strong>${r.empName||'—'}</strong><br><small class="text-muted">${r.empEmail||''}</small></td>
        <td class="small">${r.compName||r.companyName||'—'}</td>
        <td class="small text-muted">${r.jobTitle||'—'}</td>
        <td><span class="badge" style="background:${sc}22;color:${sc}">${st}</span></td>
        <td><button class="btn btn-danger btn-xs" onclick="deleteOnboardingEmp(${id})"><i class="bi bi-trash"></i></button></td>
      </tr>`;
    });
  }catch(err){tb.innerHTML=`<tr><td colspan="6" class="text-danger text-center py-3">${err.message}</td></tr>`;}
};

loadOnboardingMastersAdmin = async function() {
  const tb=document.getElementById('eoma-tbody'); if(!tb)return;
  tb.innerHTML=`<tr><td colspan="4" class="text-center">${spinner()}</td></tr>`;
  try{
    const d=await api('EmployeeOnboarding/GetAllMasters');
    const items=d.data||d||[];
    makeTablePremium('eoma-tbody', items, (r, i) => {
      const id=r.masterId||r.id||0;
      return `<tr>
        <td><span class="badge bg-secondary">${id}</span></td>
        <td><strong>${r.masterName||'—'}</strong></td>
        <td class="small text-muted">${r.masterType||'—'}</td>
        <td><button class="btn btn-danger btn-xs" onclick="deleteOnboardingMaster(${id})"><i class="bi bi-trash"></i></button></td>
      </tr>`;
    });
  }catch(err){tb.innerHTML=`<tr><td colspan="4" class="text-danger text-center py-3">${err.message}</td></tr>`;}
};

loadOnboardingCompaniesAdmin = async function() {
  const tb=document.getElementById('eoca-tbody'); if(!tb)return;
  tb.innerHTML=`<tr><td colspan="5" class="text-center">${spinner()}</td></tr>`;
  try{
    const d=await api('EmployeeOnboarding/GetAllCompanies');
    const items=d.data||d||[];
    makeTablePremium('eoca-tbody', items, (r, i) => {
      const id=r.companyId||r.id||0;
      return `<tr>
        <td><span class="badge bg-secondary">${id}</span></td>
        <td><strong>${r.companyName||'—'}</strong></td>
        <td class="small text-muted">${r.address||'—'}</td>
        <td class="small text-muted">${r.phone||'—'}</td>
        <td><button class="btn btn-danger btn-xs" onclick="deleteOnboardingComp(${id})"><i class="bi bi-trash"></i></button></td>
      </tr>`;
    });
  }catch(err){tb.innerHTML=`<tr><td colspan="5" class="text-danger text-center py-3">${err.message}</td></tr>`;}
};

loadEnquiriesAdmin = async function() {
  const tb=document.getElementById('eqa-tbody'); if(!tb)return;
  tb.innerHTML=`<tr><td colspan="6" class="text-center">${spinner()}</td></tr>`;
  try{
    const d=await api('Enquiry/get-enquiries');
    const items=d.data||d||[];
    const statusColors={Open:'var(--warning-custom)','In Progress':'var(--accent)',Resolved:'var(--success-custom)',Closed:'var(--text-muted-custom)'};
    makeTablePremium('eqa-tbody', items, (r, i) => {
      const id=r.enquiryId||r.id||0;
      const st=r.statusName||r.status||'Open';
      const sc=statusColors[st]||'var(--warning-custom)';
      return `<tr>
        <td><span class="badge bg-secondary">#${id}</span></td>
        <td><strong>${r.customerName||'—'}</strong><br><small class="text-muted">${r.customerEmail||''}</small></td>
        <td class="small">${r.customerPhone||'—'}</td>
        <td class="small">${(r.message||'').substring(0,40)}</td>
        <td><span class="badge" style="background:${sc}22;color:${sc}">${st}</span></td>
        <td><button class="btn btn-success btn-xs" onclick="resolveEnquiryAdmin(${id})"><i class="bi bi-check-circle"></i></button></td>
      </tr>`;
    });
  }catch(err){tb.innerHTML=`<tr><td colspan="6" class="text-danger text-center py-3">${err.message}</td></tr>`;}
};

loadFeesAdmin = async function() {
  const tb=document.getElementById('fta-tbody'); if(!tb)return;
  tb.innerHTML=`<tr><td colspan="7" class="text-center">${spinner()}</td></tr>`;
  try{
    const d=await api('FeesTracking/getAllEnrollments');
    const items=d.data||d||[];
    makeTablePremium('fta-tbody', items, (r, i) => {
      const id=r.enrollmentId||r.id||0;
      return `<tr>
        <td><span class="badge bg-secondary">${id}</span></td>
        <td><strong>${r.studentName||'—'}</strong><br><small class="text-muted">${r.email||''}</small></td>
        <td class="small">${r.batchName||r.batchId||'—'}</td>
        <td class="small fw-bold">₹${Number(r.totalAmount||0).toLocaleString()}</td>
        <td class="small text-success">₹${Number(r.amountReceived||0).toLocaleString()}</td>
        <td class="small text-warning">₹${Number(r.pendingAmount||0).toLocaleString()}</td>
        <td><button class="btn btn-danger btn-xs" onclick="deleteEnrollmentAdmin(${id})"><i class="bi bi-trash"></i></button></td>
      </tr>`;
    });
  }catch(err){tb.innerHTML=`<tr><td colspan="7" class="text-danger text-center py-3">${err.message}</td></tr>`;}
};

loadBatchesAdmin = async function() {
  const tb=document.getElementById('ftb-tbody'); if(!tb)return;
  tb.innerHTML=`<tr><td colspan="5" class="text-center">${spinner()}</td></tr>`;
  try{
    const d=await api('FeesTracking/GetAllBatches');
    const items=d.data||d||[];
    makeTablePremium('ftb-tbody', items, (r, i) => {
      const id=r.batchId||r.id||0;
      return `<tr>
        <td><span class="badge bg-secondary">${id}</span></td>
        <td><strong>${r.batchName||'—'}</strong></td>
        <td class="small text-muted">${r.startDate||'—'}</td>
        <td class="small fw-bold">₹${r.batchPrice||0}</td>
        <td><button class="btn btn-danger btn-xs" onclick="deleteBatchAdmin(${id})"><i class="bi bi-trash"></i></button></td>
      </tr>`;
    });
  }catch(err){tb.innerHTML=`<tr><td colspan="5" class="text-danger text-center py-3">${err.message}</td></tr>`;}
};

loadGoalUsersAdmin = async function() {
  const tb=document.getElementById('gta-tbody'); if(!tb)return;
  tb.innerHTML=`<tr><td colspan="6" class="text-center">${spinner()}</td></tr>`;
  try{
    const d=await api('GoalTracker/GetAllGoals');
    const items=d.data||d||[];
    makeTablePremium('gta-tbody', items, (r, i) => {
      const id=r.goalId||r.id||0;
      return `<tr>
        <td><span class="badge bg-secondary">${id}</span></td>
        <td><strong>${r.title||'—'}</strong><br><small class="text-muted">${(r.description||'').substring(0,30)}</small></td>
        <td class="small bg-secondary bg-opacity-25">${r.category||'—'}</td>
        <td class="small text-muted">${r.startDate||'—'}➔${r.targetDate||'—'}</td>
        <td class="small"><span class="badge bg-dark">${r.frequency||'Daily'}</span></td>
        <td><button class="btn btn-danger btn-xs" onclick="deleteGoalAdmin(${id})"><i class="bi bi-trash"></i></button></td>
      </tr>`;
    });
  }catch(err){tb.innerHTML=`<tr><td colspan="6" class="text-danger text-center py-3">${err.message}</td></tr>`;}
};

loadGoalRemindersAdmin = async function() {
  const tb=document.getElementById('gtr-tbody'); if(!tb)return;
  tb.innerHTML=`<tr><td colspan="5" class="text-center">${spinner()}</td></tr>`;
  try{
    const d=await api('GoalTracker/GetAllReminders');
    const items=d.data||d||[];
    makeTablePremium('gtr-tbody', items, (r, i) => {
      const id=r.reminderId||r.id||0;
      return `<tr>
        <td><span class="badge bg-secondary">${id}</span></td>
        <td class="small">Goal #${r.goalId||1}</td>
        <td class="small text-muted">${r.reminderDate||r.reminderTime||'—'}</td>
        <td class="small text-muted">${r.message||'—'}</td>
        <td><button class="btn btn-danger btn-xs" onclick="deleteGoalReminderAdmin(${id})"><i class="bi bi-trash"></i></button></td>
      </tr>`;
    });
  }catch(err){tb.innerHTML=`<tr><td colspan="5" class="text-danger text-center py-3">${err.message}</td></tr>`;}
};

loadLeaveStaffAdmin = async function() {
  const tb=document.getElementById('lta-tbody'); if(!tb)return;
  tb.innerHTML=`<tr><td colspan="5" class="text-center">${spinner()}</td></tr>`;
  try{
    const d=await api('LeaveTracker/GetAllLeaveRequests');
    const items=d.data||d||[];
    makeTablePremium('lta-tbody', items, (r, i) => {
      const id=r.leaveRequestId||r.id||0;
      const st=r.status||r.leaveStatus||'Pending';
      const sc=st==='Approved'?'var(--success-custom)':st==='Rejected'?'var(--danger-custom)':'var(--warning-custom)';
      return `<tr>
        <td><span class="badge bg-secondary">${id}</span></td>
        <td><strong>${r.employeeName||r.name||'Employee'}</strong></td>
        <td><span class="badge bg-secondary bg-opacity-25 text-secondary">${r.leaveTypeName||'Leave'}</span></td>
        <td class="small text-muted">${r.fromDate||'—'}➔${r.toDate||'—'}</td>
        <td><span class="badge" style="background:${sc}22;color:${sc}">${st}</span></td>
      </tr>`;
    });
  }catch(err){tb.innerHTML=`<tr><td colspan="5" class="text-danger text-center py-3">${err.message}</td></tr>`;}
};

loadLeaveBalancesAdmin = async function() {
  const tb=document.getElementById('ltb-tbody'); if(!tb)return;
  tb.innerHTML=`<tr><td colspan="5" class="text-center">${spinner()}</td></tr>`;
  try{
    const d=await api('LeaveTracker/GetAllBalances');
    const items=d.data||d||[];
    makeTablePremium('ltb-tbody', items, (r, i) => {
      const id=r.leaveBalanceId||r.id||0;
      return `<tr>
        <td><span class="badge bg-secondary">${id}</span></td>
        <td class="small">Emp #${r.employeeId||1}</td>
        <td><span class="badge bg-dark">${r.leaveTypeName||r.leaveType||'Leave'}</span></td>
        <td class="small fw-bold text-success">${r.availableBalance||r.balance||0} days</td>
        <td><button class="btn btn-danger btn-xs" onclick="deleteLeaveBalance(${id})"><i class="bi bi-trash"></i></button></td>
      </tr>`;
    });
  }catch(err){tb.innerHTML=`<tr><td colspan="5" class="text-danger text-center py-3">${err.message}</td></tr>`;}
};

loadCompetitionsAdmin = async function() {
  const tb=document.getElementById('pca-comp-tbody'); if(!tb)return;
  tb.innerHTML=`<tr><td colspan="5" class="text-center">${spinner()}</td></tr>`;
  try{
    const d=await api('ProjectCompetition/GetAllCompetition');
    const items=d.data||d||[];
    makeTablePremium('pca-comp-tbody', items, (r, i) => {
      const id=r.competitionId||r.id||0;
      return `<tr>
        <td><span class="badge bg-secondary">${id}</span></td>
        <td><strong>${r.competitionName||'—'}</strong></td>
        <td class="small text-muted">${r.startDate||'—'}➔${r.endDate||'—'}</td>
        <td class="small text-muted">${r.description||'—'}</td>
        <td><button class="btn btn-danger btn-xs" onclick="deleteCompetitionAdmin(${id})"><i class="bi bi-trash"></i></button></td>
      </tr>`;
    });
  }catch(err){tb.innerHTML=`<tr><td colspan="5" class="text-danger text-center py-3">${err.message}</td></tr>`;}
};

loadCompetitionSubmissionsAdmin = async function() {
  const tb=document.getElementById('pca-sub-tbody'); if(!tb)return;
  tb.innerHTML=`<tr><td colspan="6" class="text-center">${spinner()}</td></tr>`;
  try{
    const d=await api('ProjectCompetition/project');
    const items=d.data||d||[];
    makeTablePremium('pca-sub-tbody', items, (r, i) => {
      const id=r.projectId||r.id||0;
      const st=r.status||'Pending';
      const sc=st==='Approved'?'var(--success-custom)':st==='Rejected'?'var(--danger-custom)':'var(--warning-custom)';
      return `<tr>
        <td><span class="badge bg-secondary">${id}</span></td>
        <td><strong>${r.projectTitle||'—'}</strong><br><small class="text-muted">${(r.description||'').substring(0,30)}</small></td>
        <td class="small">${r.githubLink?`<a href="${r.githubLink}" target="_blank" class="text-accent">GitHub</a>`:'—'}</td>
        <td class="small"><span class="badge bg-dark">${r.rank||'—'}</span></td>
        <td><span class="badge" style="background:${sc}22;color:${sc}">${st}</span></td>
        <td>
          <div class="d-flex gap-1">
            <button class="btn btn-success btn-xs" onclick="actionCompetitionSubmission(${id},'Approved')"><i class="bi bi-check"></i></button>
            <button class="btn btn-danger btn-xs" onclick="actionCompetitionSubmission(${id},'Rejected')"><i class="bi bi-x"></i></button>
          </div>
        </td>
      </tr>`;
    });
  }catch(err){tb.innerHTML=`<tr><td colspan="6" class="text-danger text-center py-3">${err.message}</td></tr>`;}
};

loadSmartClientsAdmin = async function() {
  const tb=document.getElementById('spa-cli-tbody'); if(!tb)return;
  tb.innerHTML=`<tr><td colspan="5" class="text-center">${spinner()}</td></tr>`;
  try{
    const d=await api('SmartParking/GetAllClients');
    const items=d.data||d||[];
    makeTablePremium('spa-cli-tbody', items, (r, i) => {
      const id=r.clientId||r.id||0;
      return `<tr>
        <td><span class="badge bg-secondary">${id}</span></td>
        <td><strong>${r.clientName||'—'}</strong></td>
        <td class="small text-muted">${r.email||'—'}</td>
        <td class="small text-muted">${r.phone||'—'}</td>
        <td><button class="btn btn-danger btn-xs" onclick="deleteSmartClient(${id})"><i class="bi bi-trash"></i></button></td>
      </tr>`;
    });
  }catch(err){tb.innerHTML=`<tr><td colspan="5" class="text-danger text-center py-3">${err.message}</td></tr>`;}
};

loadSmartSitesAdmin = async function() {
  const tb=document.getElementById('spa-site-tbody'); if(!tb)return;
  tb.innerHTML=`<tr><td colspan="4" class="text-center">${spinner()}</td></tr>`;
  try{
    const d=await api('SmartParking/GetAllSites');
    const items=d.data||d||[];
    makeTablePremium('spa-site-tbody', items, (r, i) => {
      const id=r.siteId||r.id||0;
      return `<tr>
        <td><span class="badge bg-secondary">${id}</span></td>
        <td><strong>${r.siteName||'—'}</strong></td>
        <td class="small text-muted">${r.buildingName||'—'}</td>
        <td><button class="btn btn-danger btn-xs" onclick="deleteSmartSite(${id})"><i class="bi bi-trash"></i></button></td>
      </tr>`;
    });
  }catch(err){tb.innerHTML=`<tr><td colspan="4" class="text-danger text-center py-3">${err.message}</td></tr>`;}
};

loadSmartFloorsAdmin = async function() {
  const tb=document.getElementById('spa-floor-tbody'); if(!tb)return;
  tb.innerHTML=`<tr><td colspan="4" class="text-center">${spinner()}</td></tr>`;
  try{
    const d=await api('SmartParking/GetAllFloors');
    const items=d.data||d||[];
    makeTablePremium('spa-floor-tbody', items, (r, i) => {
      const id=r.floorId||r.id||0;
      return `<tr>
        <td><span class="badge bg-secondary">${id}</span></td>
        <td><strong>${r.floorNo||'—'}</strong></td>
        <td class="small text-muted">Site #${r.siteId||1}</td>
        <td><button class="btn btn-danger btn-xs" onclick="deleteSmartFloor(${id})"><i class="bi bi-trash"></i></button></td>
      </tr>`;
    });
  }catch(err){tb.innerHTML=`<tr><td colspan="4" class="text-danger text-center py-3">${err.message}</td></tr>`;}
};

loadSurveysAdmin = async function() {
  const tb=document.getElementById('sua-tbody'); if(!tb)return;
  tb.innerHTML=`<tr><td colspan="4" class="text-center">${spinner()}</td></tr>`;
  try{
    const d=await api('Survey/GetAllSurveys');
    const items=d.data||d||[];
    makeTablePremium('sua-tbody', items, (s, i) => {
      const id=s.surveyId||s.id||0;
      const st=s.isActive?'Active':'Closed';
      const sc=s.isActive?'var(--success-custom)':'var(--text-muted-custom)';
      return `<tr>
        <td><span class="badge bg-secondary">${id}</span></td>
        <td><strong>${s.surveyTitle||'—'}</strong><br><small class="text-muted">${(s.surveyDescription||'').substring(0,50)}</small></td>
        <td><span class="badge" style="background:${sc}22;color:${sc}">${st}</span></td>
        <td><button class="btn btn-outline-primary btn-sm py-1 px-2" onclick="loadSurveyResponsesAdmin(${id})"><i class="bi bi-bar-chart me-1"></i>Fetch Counts</button></td>
      </tr>`;
    });
  }catch(err){tb.innerHTML=`<tr><td colspan="4" class="text-danger text-center py-3">${err.message}</td></tr>`;}
};

loadUsersAdmin = async function() {
  const tb=document.getElementById('uap-tbody'); if(!tb)return;
  tb.innerHTML=`<tr><td colspan="5" class="text-center">${spinner()}</td></tr>`;
  try{
    const d=await api('UserApp/GetAllUsers');
    const items=d.data||d||[];
    makeTablePremium('uap-tbody', items, (u, i) => {
      const id=u.customerId||u.id||0;
      const name=`${u.firstName||''} ${u.lastName||''}`.trim()||'User';
      const st=u.isActive===false?'Inactive':'Active';
      const sc=st==='Active'?'var(--success-custom)':'var(--text-muted-custom)';
      return `<tr>
        <td><span class="badge bg-secondary">${id}</span></td>
        <td><strong>${name}</strong><br><small class="text-muted">${u.email||''}</small></td>
        <td class="small text-muted">@${u.userName||'—'}</td>
        <td class="small text-muted">${u.phone||'—'}</td>
        <td><span class="badge" style="background:${sc}22;color:${sc}">${st}</span></td>
      </tr>`;
    });
  }catch(err){tb.innerHTML=`<tr><td colspan="5" class="text-danger text-center py-3">${err.message}</td></tr>`;}
};

// Admin Form hooks
const _origRenderBusbookingAdmin = renderBusbookingAdmin;
renderBusbookingAdmin = function(c) {
  _origRenderBusbookingAdmin(c);
  setupFormSubmit('bb-vendor-form', null, async () => {
    await api('BusBooking/PostBusVendors','POST',{
      vendorName:document.getElementById('bb-vn').value,
      contactNo:document.getElementById('bb-vp').value,
      emailId:document.getElementById('bb-ve').value
    });
  }, loadBusVendorsAdmin, 'bba-msg');
  setupFormSubmit('bb-sched-form', null, async () => {
    await api('BusBooking/PostBusSchedule','POST',{
      busName:document.getElementById('bb-sname').value,
      busVehicleNo:document.getElementById('bb-sno').value,
      fromLocation:document.getElementById('bb-sfrom').value,
      toLocation:document.getElementById('bb-sto').value,
      departureTime:new Date(document.getElementById('bb-sdep').value).toISOString(),
      arrivalTime:new Date(document.getElementById('bb-sarr').value).toISOString(),
      scheduleDate:new Date(document.getElementById('bb-sdep').value).toISOString(),
      price:parseFloat(document.getElementById('bb-sprc').value)||0,
      totalSeats:parseInt(document.getElementById('bb-sseat').value)||40,
      availableSeats:parseInt(document.getElementById('bb-sseat').value)||40,
      vendorId:parseInt(document.getElementById('bb-svid').value)||1
    });
  }, loadBusSchedulesAdmin, 'bba-msg');
};

const _origRenderEcommerceAdmin = renderEcommerceAdmin;
renderEcommerceAdmin = function(c) {
  _origRenderEcommerceAdmin(c);
  setupFormSubmit('ec-prod-form', null, async () => {
    await api('Ecommerce/CreateProduct','POST',{
      productName:document.getElementById('ec-pname').value,
      categoryName:document.getElementById('ec-pcat').value,
      productDescription:document.getElementById('ec-pdesc').value,
      price:parseFloat(document.getElementById('ec-pprice').value)||0,
      productQuantity:parseInt(document.getElementById('ec-pqty').value)||0
    });
  }, loadEcommerceProductsAdmin, 'ecp-msg');
};

const _origRenderEmployeeappAdmin = renderEmployeeappAdmin;
renderEmployeeappAdmin = function(c) {
  _origRenderEmployeeappAdmin(c);
  setupFormSubmit('epa-form', null, async () => {
    await api('EmployeeApp/AddNewEmployee','POST',{
      fullName:document.getElementById('epa-name').value,
      email:document.getElementById('epa-email').value,
      phone:document.getElementById('epa-phone').value,
      gender:document.getElementById('epa-gender').value,
      departmentName:document.getElementById('epa-dept').value,
      designationName:document.getElementById('epa-desg').value,
      employeeType:document.getElementById('epa-type').value
    });
  }, loadEmployeesAdmin, 'epa-msg');
};

const _origRenderEmployeeonboardingAdmin = renderEmployeeonboardingAdmin;
renderEmployeeonboardingAdmin = function(c) {
  _origRenderEmployeeonboardingAdmin(c);
  setupFormSubmit('eoa-form', null, async () => {
    await api('EmployeeOnboarding/OnboardEmployee','POST',{
      empName:document.getElementById('eoa-name').value,
      empEmail:document.getElementById('eoa-email').value,
      compName:document.getElementById('eoa-comp').value,
      jobTitle:document.getElementById('eoa-title').value,
      onboardingStatus:'Pending'
    });
  }, loadOnboardingEmployeesAdmin, 'eoa-msg');
  setupFormSubmit('eom-form', null, async () => {
    await api('EmployeeOnboarding/AddMaster','POST',{
      masterName:document.getElementById('eom-name').value,
      masterType:document.getElementById('eom-type').value
    });
  }, loadOnboardingMastersAdmin, 'eom-msg');
  setupFormSubmit('eoc-form', null, async () => {
    await api('EmployeeOnboarding/AddCompany','POST',{
      companyName:document.getElementById('eoc-name').value,
      address:document.getElementById('eoc-addr').value,
      phone:document.getElementById('eoc-phone').value
    });
  }, loadOnboardingCompaniesAdmin, 'eoc-msg');
};

const _origRenderFeestrackingAdmin = renderFeestrackingAdmin;
renderFeestrackingAdmin = function(c) {
  _origRenderFeestrackingAdmin(c);
  setupFormSubmit('fta-form', null, async () => {
    const total=parseFloat(document.getElementById('fta-total').value)||0;
    const rec=parseFloat(document.getElementById('fta-rec').value)||0;
    await api('FeesTracking/addNewEnrollment','POST',{
      studentName:document.getElementById('fta-sname').value,
      email:document.getElementById('fta-email').value,
      phone:document.getElementById('fta-phone').value,
      batchId:parseInt(document.getElementById('fta-batch').value)||1,
      totalAmount:total,amountReceived:rec,pendingAmount:total-rec
    });
  }, loadFeesAdmin, 'fta-msg');
  setupFormSubmit('ftb-form', null, async () => {
    await api('FeesTracking/AddBatch','POST',{
      batchName:document.getElementById('ftb-name').value,
      startDate:document.getElementById('ftb-start').value,
      batchPrice:parseFloat(document.getElementById('ftb-price').value)||0
    });
  }, loadBatchesAdmin, 'ftb-msg');
};

const _origRenderProjectcompetitionAdmin = renderProjectcompetitionAdmin;
renderProjectcompetitionAdmin = function(c) {
  _origRenderProjectcompetitionAdmin(c);
  setupFormSubmit('pca-comp-form', null, async () => {
    await api('ProjectCompetition/CreateCompetition','POST',{
      competitionName:document.getElementById('pca-cname').value,
      startDate:document.getElementById('pca-cstart').value,
      endDate:document.getElementById('pca-cend').value,
      description:document.getElementById('pca-cdesc').value
    });
  }, loadCompetitionsAdmin, 'pca-comp-msg');
};

const _origRenderSmartparkingAdmin = renderSmartparkingAdmin;
renderSmartparkingAdmin = function(c) {
  _origRenderSmartparkingAdmin(c);
  setupFormSubmit('spa-cli-form', null, async () => {
    await api('SmartParking/AddClient','POST',{
      clientName:document.getElementById('spa-cname').value,
      email:document.getElementById('spa-cemail').value,
      phone:document.getElementById('spa-cphone').value
    });
  }, loadSmartClientsAdmin, 'spa-cli-msg');
  setupFormSubmit('spa-site-form', null, async () => {
    await api('SmartParking/AddSite','POST',{
      siteName:document.getElementById('spa-sname').value,
      buildingName:document.getElementById('spa-sbuild').value
    });
  }, loadSmartSitesAdmin, 'spa-site-msg');
  setupFormSubmit('spa-floor-form', null, async () => {
    await api('SmartParking/AddFloor','POST',{
      floorNo:document.getElementById('spa-fno').value,
      siteId:parseInt(document.getElementById('spa-fsid').value)||1
    });
  }, loadSmartFloorsAdmin, 'spa-floor-msg');
};

const _origRenderSurveyAdmin = renderSurveyAdmin;
renderSurveyAdmin = function(c) {
  _origRenderSurveyAdmin(c);
  setupFormSubmit('su-add-form', null, async () => {
    await api('Survey/CreateSurvey','POST',{
      surveyTitle:document.getElementById('su-title').value,
      surveyDescription:document.getElementById('su-desc').value,
      isActive:true
    });
  }, loadSurveysAdmin, 'su-msg');
  setupFormSubmit('su-q-form', null, async () => {
    await api('Survey/AddQuestion','POST',{
      surveyId:parseInt(document.getElementById('su-qsid').value)||1,
      questionText:document.getElementById('su-qtext').value
    });
  }, null, 'suq-msg');
  setupFormSubmit('su-o-form', null, async () => {
    await api('Survey/AddOption','POST',{
      questionId:parseInt(document.getElementById('su-oqid').value)||1,
      optionText:document.getElementById('su-otext').value
    });
  }, null, 'sua-msg');
};

const _origRenderUserappAdmin = renderUserappAdmin;
renderUserappAdmin = function(c) {
  _origRenderUserappAdmin(c);
  setupFormSubmit('ua-reset-form', null, async () => {
    const cid=document.getElementById('ua-rcid').value;
    await api(`UserApp/update-password/${cid}`,'PUT',{password:document.getElementById('ua-rpwd').value});
  }, loadUsersAdmin, 'uap-msg');
};

// Hook up Admin mode listener
document.addEventListener('DOMContentLoaded',()=>{
  const sw = document.getElementById('admin-mode-switch');
  if(sw){
    sw.addEventListener('change', function() {
      state.adminMode = this.checked;
      switchApp(state.currentApp);
    });
  }
});