/* =====================================================
   GREENHEART — DASHBOARD JS (Updated for INR)
   ===================================================== */

// ===================== SECTION NAVIGATION =====================
function showSection(sectionName, event) {
    if (event) {
        event.preventDefault();
        document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
        event.currentTarget.classList.add('active');
    }

    document.querySelectorAll('.dash-section').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(`section-${sectionName}`);
    if (target) {
        target.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// ===================== SCORE MODAL =====================
function openScoreModal() {
    const modal = document.getElementById('scoreModal');
    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
}

function closeScoreModal() {
    const modal = document.getElementById('scoreModal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }
}

function adjustScore(delta) {
    const input = document.getElementById('newScore');
    if (!input) return;
    let val = parseInt(input.value) + delta;
    val = Math.max(1, Math.min(45, val));
    input.value = val;
}

// Global variable to track which score is being edited
let editingScoreItem = null;

function submitScore() {
    const score = document.getElementById('newScore')?.value;
    const date = document.getElementById('scoreDate')?.value;
    const course = document.getElementById('courseName')?.value || 'Unknown Course';

    if (!score || score < 1 || score > 45) {
        showToast('Score must be between 1 and 45', 'error');
        return;
    }

    // Updated to Indian Date Format (en-IN)
    const dateDisplay = date ? new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Today';

    if (editingScoreItem) {
        // Update existing score
        const badge = editingScoreItem.querySelector('.score-num-badge');
        const dateSpan = editingScoreItem.querySelector('.score-date');
        
        if (badge) badge.textContent = score;
        if (dateSpan) dateSpan.textContent = `${dateDisplay} · ${course}`;
        
        // Remove 'latest' class and add it to this item
        document.querySelectorAll('.score-item.latest').forEach(el => el.classList.remove('latest'));
        editingScoreItem.classList.add('latest');
        
        showToast(`Score updated to ${score}!`, 'success');
        editingScoreItem = null;
    } else {
        // Add new score
        const list = document.getElementById('scoresList');
        if (list) {
            const items = list.querySelectorAll('.score-item');
            if (items.length >= 5) {
                // Animate out oldest
                const oldest = items[items.length - 1];
                oldest.style.transition = 'all 0.3s ease';
                oldest.style.opacity = '0';
                oldest.style.transform = 'translateX(-20px)';
                setTimeout(() => oldest.remove(), 300);
            }

            // Add new score
            setTimeout(() => {
                const newItem = document.createElement('div');
                newItem.className = 'score-item latest';
                newItem.style.opacity = '0';
                newItem.style.transform = 'translateX(20px)';
                
                newItem.innerHTML = `
                    <div class="score-num-badge">${score}</div>
                    <div class="score-meta">
                        <span class="score-date">${dateDisplay} · ${course}</span>
                        <span class="score-status active">✓ In this month's draw</span>
                    </div>
                    <div class="score-actions">
                        <button class="btn-score-edit" title="Edit" onclick="editScore(this)"><i class="fas fa-pen"></i></button>
                        <button class="btn-score-del" title="Delete" onclick="deleteScore(this)"><i class="fas fa-trash"></i></button>
                    </div>
                `;

                // Remove 'latest' from other items
                list.querySelectorAll('.score-item.latest').forEach(el => el.classList.remove('latest'));
                list.insertBefore(newItem, list.firstChild);

                setTimeout(() => {
                    newItem.style.transition = 'all 0.4s ease';
                    newItem.style.opacity = '1';
                    newItem.style.transform = 'translateX(0)';
                }, 50);

                // Update draw balls
                updateDrawBalls(score);
            }, 350);
        }
    }

    closeScoreModal();
    showToast(`Score ${score} ${editingScoreItem ? 'updated' : 'added'}! You're entered in this month's ₹ prize draw.`, 'success');

    // Reset modal title and button
    document.querySelector('#scoreModal .modal-header h3').textContent = 'Add New Score';
    document.querySelector('#scoreModal .modal-footer .btn-form-primary').textContent = 'Add Score';
    
    // Reset form
    if (document.getElementById('newScore')) document.getElementById('newScore').value = 35;
    if (document.getElementById('courseName')) document.getElementById('courseName').value = '';
}

function editScore(button) {
    const item = button.closest('.score-item');
    const badge = item.querySelector('.score-num-badge');
    const meta = item.querySelector('.score-meta');
    const dateSpan = meta.querySelector('.score-date');
    const courseSpan = dateSpan.textContent.split(' · ')[1] || '';
    
    if (badge && dateSpan) {
        const currentScore = badge.textContent;
        const currentDateText = dateSpan.textContent.split(' · ')[0];
        
        // Convert date text back to date format (assuming format like "20 Jun")
        const dateParts = currentDateText.split(' ');
        const currentDate = new Date(`2025-${dateParts[1]}-${dateParts[0]}`).toISOString().split('T')[0];
        
        // Store reference to item being edited
        editingScoreItem = item;
        
        // Open modal with current values
        openScoreModal();
        document.getElementById('newScore').value = currentScore;
        document.getElementById('scoreDate').value = currentDate;
        document.getElementById('courseName').value = courseSpan;
        
        // Change modal title and button
        document.querySelector('#scoreModal .modal-header h3').textContent = 'Edit Score';
        document.querySelector('#scoreModal .modal-footer .btn-form-primary').textContent = 'Update Score';
    }
}

function deleteScore(button) {
    const item = button.closest('.score-item');
    if (item && confirm('Are you sure you want to delete this score?')) {
        item.style.transition = 'all 0.3s ease';
        item.style.opacity = '0';
        item.style.transform = 'translateX(-20px)';
        setTimeout(() => {
            item.remove();
            showToast('Score deleted successfully', 'success');
        }, 300);
    }
}

function updateDrawBalls(newScore) {
    const balls = document.querySelectorAll('.draw-num-ball');
    if (balls.length > 0) {
        balls[balls.length - 1].style.transition = 'all 0.4s ease';
        balls[balls.length - 1].style.transform = 'scale(0)';
        setTimeout(() => {
            balls[balls.length - 1].textContent = newScore;
            balls[balls.length - 1].style.transform = 'scale(1)';
        }, 400);
    }
}

// ===================== UPLOAD PROOF MODAL =====================
function openUploadModal() {
    const modal = document.getElementById('uploadModal');
    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
}

function closeUploadModal() {
    const modal = document.getElementById('uploadModal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }
}

function handleFileSelect(input) {
    if (input.files && input.files[0]) {
        const preview = document.getElementById('uploadPreview');
        const nameEl = document.getElementById('uploadFileName');
        const zone = document.getElementById('uploadZone');

        if (nameEl) nameEl.textContent = input.files[0].name;
        if (preview) preview.classList.remove('hidden');
        if (zone) zone.style.display = 'none';
    }
}

function removeFile() {
    const preview = document.getElementById('uploadPreview');
    const zone = document.getElementById('uploadZone');
    const input = document.getElementById('proofFile');

    if (preview) preview.classList.add('hidden');
    if (zone) zone.style.display = 'block';
    if (input) input.value = '';
}

function submitProof() {
    const input = document.getElementById('proofFile');
    if (!input?.files?.length) {
        showToast('Please select a file to upload', 'error');
        return;
    }

    const btn = document.querySelector('#uploadModal .btn-form-primary');
    if (btn) {
        btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Uploading...';
        btn.disabled = true;
    }

    setTimeout(() => {
        closeUploadModal();
        showToast('Proof uploaded! Admin will review within 24 hours.', 'success');
        // Update the winning item status
        const uploadBtn = document.querySelector('.btn-upload-proof');
        if (uploadBtn) {
            const badge = uploadBtn.previousElementSibling;
            if (badge) {
                badge.textContent = 'Under Review';
                badge.className = 'result-badge review';
            }
            uploadBtn.remove();
        }
    }, 2000);
}

// ===================== DRAG & DROP =====================
const uploadZone = document.getElementById('uploadZone');
if (uploadZone) {
    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.style.borderColor = 'var(--primary)';
        uploadZone.style.background = 'rgba(16,185,129,0.05)';
    });
    uploadZone.addEventListener('dragleave', () => {
        uploadZone.style.borderColor = '';
        uploadZone.style.background = '';
    });
    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.style.borderColor = '';
        uploadZone.style.background = '';
        const input = document.getElementById('proofFile');
        if (input && e.dataTransfer.files.length) {
            input.files = e.dataTransfer.files;
            handleFileSelect(input);
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

// ===================== SCORE CHART (Updated Indian Course Names Optional) =====================
function initScoreChart() {
    const canvas = document.getElementById('scoreChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['DLF Golf Club', 'Royal Calcutta', 'Karnataka GC', 'Bombay GC', 'Delhi GC'],
            datasets: [{
                label: 'Stableford Score',
                data: [31, 32, 36, 35, 38],
                borderColor: '#10b981',
                backgroundColor: 'rgba(16,185,129,0.1)',
                borderWidth: 3,
                pointBackgroundColor: '#10b981',
                pointBorderColor: '#020617',
                pointBorderWidth: 2,
                pointRadius: 6,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#131c2e',
                    titleColor: '#e2e8f0',
                    bodyColor: '#94a3b8',
                    borderColor: '#1e293b',
                    borderWidth: 1,
                    padding: 12,
                    callbacks: {
                        label: ctx => ` Score: ${ctx.parsed.y} pts`
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255,255,255,0.04)' },
                    ticks: { color: '#475569', font: { size: 11 } }
                },
                y: {
                    grid: { color: 'rgba(255,255,255,0.04)' },
                    ticks: { color: '#475569', font: { size: 11 } },
                    min: 25,
                    max: 45
                }
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', initScoreChart);