/* =====================================================
   GREENHEART — ADMIN DASHBOARD JS (Updated for INR)
   ===================================================== */

// ===================== SECTION NAVIGATION =====================
function showAdminSection(sectionName, event) {
    if (event) {
        event.preventDefault();
        document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
        event.currentTarget.classList.add('active');
    }

    document.querySelectorAll('.dash-section').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(`admin-${sectionName}`);
    if (target) {
        target.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Init charts when visible
        if (sectionName === 'analytics') initAnalyticsCharts();
        if (sectionName === 'reports') initRevenueChart();
    }
}

// ===================== USER SEARCH/FILTER =====================
function filterUsers(query) {
    const rows = document.querySelectorAll('#usersTableBody tr');
    const q = query.toLowerCase();
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(q) ? '' : 'none';
    });
}

function filterByStatus(status) {
    const rows = document.querySelectorAll('#usersTableBody tr');
    rows.forEach(row => {
        if (status === 'all') { row.style.display = ''; return; }
        const statusEl = row.querySelector('.status-pill');
        const rowStatus = statusEl?.textContent.toLowerCase() || '';
        row.style.display = rowStatus === status ? '' : 'none';
    });
}

function selectAllUsers(checkbox) {
    document.querySelectorAll('#usersTableBody input[type="checkbox"]').forEach(cb => {
        cb.checked = checkbox.checked;
    });
}

// ===================== USER MODAL =====================
function openUserModal(name, email, plan, status) {
    const modal = document.getElementById('userModal');
    if (!modal) return;
    if (name) document.getElementById('editUserName').value = name;
    if (email) document.getElementById('editUserEmail').value = email;
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeUserModal() {
    const modal = document.getElementById('userModal');
    if (modal) { modal.classList.add('hidden'); document.body.style.overflow = ''; }
}

function saveUserEdit() {
    closeUserModal();
    showToast('User updated successfully', 'success');
}

async function deleteUser(btn, id) {
    if(!confirm("Attempting to delete user and all their associated scores/winnings! Are you sure?")) return;
    try {
        const res = await fetch(`/admin/users/${id}/delete`, { method: 'POST' });
        if(res.ok) {
            btn.closest('tr').remove();
            showToast('User deleted successfully', 'success');
        } else {
            showToast('Error deleting user', 'error');
        }
    } catch(e) {
        showToast('Network error', 'error');
    }
}

// ===================== DRAW SIMULATION =====================
async function runSimulation() {
    const panel = document.getElementById('simPanel');
    if (!panel) return;

    panel.innerHTML = '<div style="text-align: center; padding: 1rem; color: #475569;"><i class="fas fa-circle-notch fa-spin"></i> Running simulation...</div>';

    try {
        const res = await fetch('/admin/draws/simulate', { method: 'POST' });
        const data = await res.json();
        
        if (data.success) {
            panel.innerHTML = `
                <div class="sim-results">
                    <p style="color: #64748b; font-size: 0.82rem; text-align: center; margin-bottom: 0.5rem;">Simulated winning numbers:</p>
                    <div class="sim-number-row">
                        ${data.numbers.map(n => `<div class="sim-ball">${n}</div>`).join('')}
                    </div>
                    <div class="sim-stats">
                        <div class="sim-stat">
                            <strong>${data.winners5 || '0'}</strong>
                            <span>5-Match Winner</span>
                        </div>
                        <div class="sim-stat">
                            <strong>${data.winners4}</strong>
                            <span>4-Match Winners</span>
                        </div>
                        <div class="sim-stat">
                            <strong>${data.winners3}</strong>
                            <span>3-Match Winners</span>
                        </div>
                    </div>
                    <p style="font-size: 0.75rem; color: #475569; text-align: center; margin-top: 0.75rem;">
                        Draw successfully saved to database. Check Winners tab.
                    </p>
                </div>
            `;
            showToast('Draw generated and saved to database.', 'success');
            setTimeout(() => window.location.reload(), 2000);
        } else {
            panel.innerHTML = `<p style="color:red; text-align:center;">Error: ${data.error}</p>`;
        }
    } catch (e) {
        panel.innerHTML = `<p style="color:red; text-align:center;">Network error</p>`;
    }
}

function confirmPublish() {
    if (confirm('Are you sure you want to publish the official draw results? This cannot be undone.')) {
        showToast('Draw results published! Winners have been notified via email.', 'success');
    }
}

// ===================== WINNER MANAGEMENT =====================
function filterWinners(status, btn) {
    document.querySelectorAll('.winners-filter-row .filter-tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');

    const cards = document.querySelectorAll('.winner-card-admin');
    cards.forEach(card => {
        const cardStatus = card.dataset.status;
        const show = status === 'all' || cardStatus === status;
        card.style.display = show ? 'flex' : 'none';
    });
}

async function updateWinnerStatus(id, newStatus, card, actionsContainer) {
    try {
        const res = await fetch(`/admin/winners/${id}/status`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ status: newStatus })
        });
        if(res.ok) return true;
        return false;
    } catch(err) {
        return false;
    }
}

async function approveWinner(btn, id) {
    const card = btn.closest('.winner-card-admin');
    const actions = card?.querySelector('.winner-card-actions');
    btn.innerHTML = 'Updating...';
    
    if (await updateWinnerStatus(id, 'approved', card, actions)) {
        const statusEl = card?.querySelector('.result-badge');
        if (statusEl) {
            statusEl.textContent = 'APPROVED';
            statusEl.className = 'result-badge approved';
            card.dataset.status = 'approved';
        }
        if (actions) {
            actions.innerHTML = `<button class="btn-table-action green" onclick="markPaid(this, ${id})"><i class="fas fa-rupee-sign"></i> Mark Paid</button>`;
        }
        showToast('Winner approved! Ready for payout.', 'success');
    } else {
        showToast('Error approving winner.', 'error');
    }
}

async function rejectWinner(btn, id) {
    if(!confirm("Are you sure you want to reject this claim?")) return;
    
    const card = btn.closest('.winner-card-admin');
    const actions = card?.querySelector('.winner-card-actions');
    btn.innerHTML = 'Updating...';

    if (await updateWinnerStatus(id, 'rejected', card, actions)) {
        const statusEl = card?.querySelector('.result-badge');
        if (statusEl) {
            statusEl.textContent = 'REJECTED';
            statusEl.className = 'result-badge no-win';
            card.dataset.status = 'rejected';
        }
        if (actions) {
            actions.innerHTML = '<span style="color: #f87171; font-size: 0.85rem;"><i class="fas fa-times-circle"></i> Rejected</span>';
        }
        showToast('Claim rejected. User has been notified.', 'error');
    } else {
        showToast('Error rejecting winner.', 'error');
    }
}

async function markPaid(btn, id) {
    const card = btn.closest('.winner-card-admin');
    const actions = card?.querySelector('.winner-card-actions');
    btn.innerHTML = 'Updating...';

    if (await updateWinnerStatus(id, 'paid', card, actions)) {
        const statusEl = card?.querySelector('.result-badge');
        if (statusEl) {
            statusEl.textContent = 'PAID ✓';
            statusEl.className = 'result-badge won';
            card.dataset.status = 'paid';
        }
        if (actions) {
            actions.innerHTML = '<span style="color: #10b981; font-size: 0.85rem;"><i class="fas fa-check-circle"></i> Payment Sent</span>';
        }
        showToast('Payment marked as completed!', 'success');
    } else {
        showToast('Error marking paid.', 'error');
    }
}

// ===================== PROOF MODAL =====================
function viewProof() {
    const modal = document.getElementById('proofModal');
    if (modal) { modal.classList.remove('hidden'); document.body.style.overflow = 'hidden'; }
}

function closeProofModal() {
    const modal = document.getElementById('proofModal');
    if (modal) { modal.classList.add('hidden'); document.body.style.overflow = ''; }
}

function approveFromModal() {
    closeProofModal();
    showToast('Winner approved from modal!', 'success');
}

function rejectFromModal() {
    closeProofModal();
    showToast('Claim rejected from modal.', 'error');
}

// ===================== ADD CHARITY MODAL =====================
function openAddCharityModal() {
    showToast('Add Charity form would open here in the full app.', 'success');
}

// ===================== REPORTS =====================
function downloadReport(type) {
    showToast(`Generating ${type} report... Download will start shortly.`, 'success');
}

// ===================== CHARTS =====================
let chartsInitialized = false;
let revenueChartInitialized = false;

function initAnalyticsCharts() {
    if (chartsInitialized) return;
    chartsInitialized = true;

    // Subscriber Growth Chart
    const subCanvas = document.getElementById('subscriberChart');
    if (subCanvas) {
        new Chart(subCanvas.getContext('2d'), {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Subscribers',
                    data: [8200, 9100, 9800, 10600, 11200, 12400],
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16,185,129,0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#10b981',
                    pointBorderColor: '#020617',
                    pointRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#475569' } },
                    y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#475569' } }
                }
            }
        });
    }

    // Charity Distribution Chart
    const charityCanvas = document.getElementById('charityChart');
    if (charityCanvas) {
        new Chart(charityCanvas.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Macmillan', 'NSPCC', 'RSPCA', 'BHF', 'Age UK', 'Others'],
                datasets: [{
                    data: [840, 620, 510, 480, 390, 960],
                    backgroundColor: ['#10b981', '#6366f1', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6'],
                    borderWidth: 2,
                    borderColor: '#0c1222'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right', labels: { color: '#94a3b8', padding: 16, font: { size: 12 } } }
                }
            }
        });
    }

    // Plan Distribution Chart
    const planCanvas = document.getElementById('planChart');
    if (planCanvas) {
        new Chart(planCanvas.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Monthly', 'Yearly'],
                datasets: [{
                    data: [7800, 4600],
                    backgroundColor: ['#10b981', '#f59e0b'],
                    borderWidth: 2,
                    borderColor: '#0c1222'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right', labels: { color: '#94a3b8', padding: 16, font: { size: 12 } } }
                }
            }
        });
    }
}

function initRevenueChart() {
    if (revenueChartInitialized) return;
    revenueChartInitialized = true;

    const canvas = document.getElementById('revenueChart');
    if (!canvas) return;

    new Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'Monthly Revenue (₹)',
                data: [818000, 909000, 978000, 1059000, 1118000, 1238760],
                backgroundColor: 'rgba(16,185,129,0.3)',
                borderColor: '#10b981',
                borderWidth: 2,
                borderRadius: 8
            }, {
                label: 'Charity Donations (₹)',
                data: [81800, 90900, 97800, 105900, 111800, 123880],
                backgroundColor: 'rgba(99,102,241,0.3)',
                borderColor: '#6366f1',
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: '#94a3b8', padding: 16 } }
            },
            scales: {
                x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#475569' } },
                y: {
                    grid: { color: 'rgba(255,255,255,0.04)' },
                    ticks: { 
                        color: '#475569', 
                        // Updated to show Lakhs (L) for Indian currency context
                        callback: v => `₹${(v/100000).toFixed(1)}L` 
                    }
                }
            }
        }
    });
}

// ===================== CLOSE MODALS ON OVERLAY CLICK =====================
document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.classList.add('hidden');
            document.body.style.overflow = '';
        }
    });
});

// Init analytics on load
document.addEventListener('DOMContentLoaded', initAnalyticsCharts);

// ===================== DRAW PUBLISHING =====================
async function publishDraw(id) {
    if(!confirm("Are you sure you want to publish these draw results? Winners will be locked in!")) return;
    try {
        const res = await fetch(`/admin/draws/${id}/publish`, { method: 'POST' });
        if(res.ok) window.location.reload();
    } catch(e) { console.error(e); }
}

// ===================== CHARITY MODAL =====================
function openCharityModal(charity = null) {
    const modal = document.getElementById('charityModal');
    const form = document.getElementById('charityForm');
    const title = document.getElementById('charityModalTitle');
    
    if(charity) {
        title.innerText = 'Edit Charity';
        form.action = `/admin/charities/${charity.id}/edit`;
        document.getElementById('charityName').value = charity.name;
        document.getElementById('charityCat').value = charity.category;
        document.getElementById('charityDesc').value = charity.description;
    } else {
        title.innerText = 'Add Charity';
        form.action = `/admin/charities/add`;
        form.reset();
    }
    
    modal.classList.remove('hidden');
}
function closeCharityModal() { document.getElementById('charityModal').classList.add('hidden'); }
async function deleteCharity(id) {
    if(!confirm("Delete this charity?")) return;
    try {
        const res = await fetch(`/admin/charities/${id}/delete`, { method: 'POST' });
        if(res.ok) window.location.reload();
    } catch(e) { console.error(e); }
}

// ===================== USER EDIT & SCORES =====================
async function openUserEditModal(id) {
    try {
        const res = await fetch(`/admin/users/${id}/data`);
        if(!res.ok) throw new Error("Failed to fetch user");
        const data = await res.json();
        
        document.getElementById('editUserId').value = data.user.id;
        document.getElementById('editFirstName').value = data.user.first_name;
        document.getElementById('editLastName').value = data.user.last_name;
        document.getElementById('editEmail').value = data.user.email;
        document.getElementById('editPlan').value = data.user.plan || 'monthly';
        
        const scoresList = document.getElementById('userScoresList');
        if(data.scores && data.scores.length > 0) {
            scoresList.innerHTML = data.scores.map(s => {
                const fd = new Date(s.date).toISOString().split('T')[0];
                return `<div style="display:flex; gap:10px; background:#0c1222; padding:10px; border-radius:8px; align-items:center;">
                    <input type="number" id="sc_${s.id}" value="${s.score}" class="form-input" style="width:70px; background:#1e293b; color:white; border:none; padding:5px;">
                    <input type="text" id="cn_${s.id}" value="${s.course_name}" class="form-input" style="flex:1; background:#1e293b; color:white; border:none; padding:5px;">
                    <input type="date" id="dt_${s.id}" value="${fd}" class="form-input" style="width:130px; background:#1e293b; color:white; border:none; padding:5px;">
                    <button type="button" class="btn-table-action green" onclick="saveAdminScore(${s.id})"><i class="fas fa-save"></i></button>
                    <button type="button" class="btn-table-action red" onclick="deleteAdminScore(${s.id})"><i class="fas fa-trash"></i></button>
                </div>`;
            }).join('');
        } else {
            scoresList.innerHTML = '<p style="color:#64748b; font-size:0.85rem;">No scores recorded yet.</p>';
        }

        document.getElementById('userEditModal').classList.remove('hidden');
    } catch(e) {
        showToast("Error loading user data", "error");
    }
}
function closeUserEditModal() { document.getElementById('userEditModal').classList.add('hidden'); }

async function submitUserEdit(e) {
    e.preventDefault();
    const id = document.getElementById('editUserId').value;
    const body = {
        first_name: document.getElementById('editFirstName').value,
        last_name: document.getElementById('editLastName').value,
        email: document.getElementById('editEmail').value,
        plan: document.getElementById('editPlan').value
    };
    try {
        const res = await fetch(`/admin/users/${id}/edit`, {
            method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body)
        });
        if(res.ok) window.location.reload();
    } catch(err) { console.error(err); }
}

async function saveAdminScore(id) {
    const body = {
        score: document.getElementById(`sc_${id}`).value,
        course_name: document.getElementById(`cn_${id}`).value,
        date: document.getElementById(`dt_${id}`).value
    };
    try {
        const res = await fetch(`/admin/scores/${id}/edit`, {
            method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body)
        });
        if(res.ok) showToast("Score updated!", "success");
    } catch(e) { showToast("Failed to update score", "error"); }
}

async function deleteAdminScore(id) {
    if(!confirm("Erase this score directly?")) return;
    try {
        const res = await fetch(`/admin/scores/${id}/delete`, { method: 'POST' });
        if(res.ok) {
            showToast("Score deleted!", "success");
            document.getElementById(`sc_${id}`).parentElement.remove();
        }
    } catch(e) { showToast("Failed to delete score", "error"); }
}