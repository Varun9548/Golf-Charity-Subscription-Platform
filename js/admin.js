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

// ===================== DRAW SIMULATION =====================
function runSimulation() {
    const panel = document.getElementById('simPanel');
    if (!panel) return;

    panel.innerHTML = '<div style="text-align: center; padding: 1rem; color: #475569;">Running simulation...</div>';

    setTimeout(() => {
        // Generate random draw numbers (5 from 1-45)
        const numbers = [];
        while (numbers.length < 5) {
            const n = Math.floor(Math.random() * 45) + 1;
            if (!numbers.includes(n)) numbers.push(n);
        }
        numbers.sort((a, b) => b - a);

        // Simulate winners
        const winners5 = Math.random() < 0.08 ? Math.floor(Math.random() * 2) + 1 : 0;
        const winners4 = Math.floor(Math.random() * 5) + 1;
        const winners3 = Math.floor(Math.random() * 15) + 5;

        panel.innerHTML = `
            <div class="sim-results">
                <p style="color: #64748b; font-size: 0.82rem; text-align: center; margin-bottom: 0.5rem;">Simulated winning numbers:</p>
                <div class="sim-number-row">
                    ${numbers.map(n => `<div class="sim-ball">${n}</div>`).join('')}
                </div>
                <div class="sim-stats">
                    <div class="sim-stat">
                        <strong>${winners5 || 'Rollover'}</strong>
                        <span>5-Match Winner${winners5 !== 1 ? 's' : ''}</span>
                    </div>
                    <div class="sim-stat">
                        <strong>${winners4}</strong>
                        <span>4-Match Winners</span>
                    </div>
                    <div class="sim-stat">
                        <strong>${winners3}</strong>
                        <span>3-Match Winners</span>
                    </div>
                </div>
                <div style="background: rgba(255,255,255,0.03); border: 1px solid #1e293b; border-radius: 8px; padding: 0.875rem; margin-top: 0.875rem; font-size: 0.82rem;">
                    <div style="display: flex; justify-content: space-between; padding: 0.3rem 0; color: #94a3b8;">
                        <span>Estimated 5-match payout</span>
                        <strong style="color: ${winners5 > 0 ? '#10b981' : '#fbbf24'};">${winners5 > 0 ? `₹${(100000 / winners5).toLocaleString('en-IN')}` : 'Rollover to next month'}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 0.3rem 0; color: #94a3b8;">
                        <span>4-match per winner</span>
                        <strong style="color: #e2e8f0;">₹${Math.floor(87500 / winners4).toLocaleString('en-IN')}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 0.3rem 0; color: #94a3b8;">
                        <span>3-match per winner</span>
                        <strong style="color: #e2e8f0;">₹${Math.floor(62500 / winners3).toLocaleString('en-IN')}</strong>
                    </div>
                </div>
                <p style="font-size: 0.75rem; color: #475569; text-align: center; margin-top: 0.75rem;">
                    This is a simulation only. Run again for different outcomes.
                </p>
            </div>
        `;
    }, 1500);
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

function approveWinner(btn) {
    const card = btn.closest('.winner-card-admin');
    const statusEl = card?.querySelector('.result-badge');
    if (statusEl) {
        statusEl.textContent = 'Approved';
        statusEl.className = 'result-badge approved';
        card.dataset.status = 'approved';
    }
    const actions = card?.querySelector('.winner-card-actions');
    if (actions) {
        actions.innerHTML = `<button class="btn-table-action green" onclick="markPaid(this)"><i class="fas fa-rupee-sign"></i> Mark Paid</button>`;
    }
    showToast('Winner approved! Ready for payout.', 'success');
}

function rejectWinner(btn) {
    const card = btn.closest('.winner-card-admin');
    const statusEl = card?.querySelector('.result-badge');
    if (statusEl) {
        statusEl.textContent = 'Rejected';
        statusEl.className = 'result-badge no-win';
        card.dataset.status = 'rejected';
    }
    const actions = card?.querySelector('.winner-card-actions');
    if (actions) {
        actions.innerHTML = '<span style="color: #f87171; font-size: 0.82rem;">Claim Rejected</span>';
    }
    showToast('Claim rejected. User has been notified.', 'error');
}

function markPaid(btn) {
    const card = btn.closest('.winner-card-admin');
    const statusEl = card?.querySelector('.result-badge');
    if (statusEl) {
        statusEl.textContent = 'Paid ✓';
        statusEl.className = 'result-badge won';
        card.dataset.status = 'paid';
    }
    btn.remove();
    showToast('Payment marked as completed!', 'success');
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