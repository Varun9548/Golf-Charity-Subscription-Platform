/* =====================================================
   GREENHEART — MAIN JS (Updated for INR)
   ===================================================== */

// ===================== CURRENCY FORMATTER =====================
const formatCurrency = (amount, decimals = 0) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: decimals
    }).format(amount);
};

// ===================== NAVBAR =====================
const navbar = document.getElementById('navbar');
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

if (navbar) {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 60) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}

if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
        navLinks.classList.toggle('open');
        navToggle.classList.toggle('active');
    });

    // Close nav when a link is clicked
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('open');
            navToggle.classList.remove('active');
        });
    });
}

// ===================== COUNTDOWN TIMER =====================
function updateCountdown() {
    const nextDraw = new Date();
    nextDraw.setDate(28); // 28th of current month
    nextDraw.setHours(20, 0, 0, 0);
    if (nextDraw < new Date()) nextDraw.setMonth(nextDraw.getMonth() + 1);

    const now = new Date();
    const diff = nextDraw - now;

    if (diff <= 0) return;

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    const daysEl = document.getElementById('days');
    const hoursEl = document.getElementById('hours');
    const minsEl = document.getElementById('mins');
    const secsEl = document.getElementById('secs');
    const miniEl = document.getElementById('miniCountdown');

    if (daysEl) daysEl.textContent = String(days).padStart(2, '0');
    if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
    if (minsEl) minsEl.textContent = String(mins).padStart(2, '0');
    if (secsEl) secsEl.textContent = String(secs).padStart(2, '0');
    
    // Fixed & Updated Line
    if (miniEl) miniEl.textContent = `${days}d ${String(hours).padStart(2,'0')}h ${String(mins).padStart(2,'0')}m`;
}

setInterval(updateCountdown, 1000);
updateCountdown();

// ===================== PRICING TOGGLE ===================== 
const billingToggle = document.getElementById('billingToggle');
if (billingToggle) {
    billingToggle.addEventListener('change', function () {
        const monthlyCard = document.getElementById('monthlyCard');
        const yearlyCard = document.getElementById('yearlyCard');
        // Visual logic here
    });
}

// ===================== SMOOTH SCROLL =====================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        const target = document.querySelector(targetId);
        if (target) {
            e.preventDefault();
            const offset = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-height')) || 72;
            const top = target.getBoundingClientRect().top + window.pageYOffset - offset - 20;
            window.scrollTo({ top, behavior: 'smooth' });
        }
    });
});

// ===================== SCROLL ANIMATIONS =====================
const animateOnScroll = () => {
    const elements = document.querySelectorAll('.step-card, .charity-card, .testimonial-card, .pricing-card, .charity-dir-card, .stat-card, .dash-card');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    elements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(24px)';
        el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        observer.observe(el);
    });
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', animateOnScroll);
} else {
    animateOnScroll();
}

// ===================== PASSWORD TOGGLE =====================
function togglePassword(id) {
    const input = document.getElementById(id);
    if (!input) return;
    const icon = input.parentElement.querySelector('i');
    if (input.type === 'password') {
        input.type = 'text';
        if (icon) { icon.classList.remove('fa-eye'); icon.classList.add('fa-eye-slash'); }
    } else {
        input.type = 'password';
        if (icon) { icon.classList.remove('fa-eye-slash'); icon.classList.add('fa-eye'); }
    }
}

// ===================== CARD FORMATTING =====================
function formatCardNumber(input) {
    let val = input.value.replace(/\D/g, '').substring(0, 16);
    input.value = val.replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiry(input) {
    let val = input.value.replace(/\D/g, '').substring(0, 4);
    if (val.length >= 2) val = val.substring(0, 2) + '/' + val.substring(2);
    input.value = val;
}

// ===================== SIDEBAR TOGGLE =====================
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.toggle('open');
}

// ===================== JACKPOT COUNTER ANIMATION =====================
function animateCounter(el, target, duration = 1500) {
    const start = 0;
    const startTime = performance.now();
    const update = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(start + (target - start) * eased);
        
        // Use Indian Currency format in counter
        el.textContent = formatCurrency(current);
        
        if (progress < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
}

const jackpotEl = document.getElementById('jackpotAmount');
if (jackpotEl) {
    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
            // Updated to INR equivalent (e.g., 2,50,000)
            animateCounter(jackpotEl, 250000);
            observer.disconnect();
        }
    });
    observer.observe(jackpotEl);
}

// ===================== GIVING SLIDER (Updated for INR) =====================
function updateGiving(val) {
    const pctEl = document.getElementById('givingPct');
    const amountEl = document.getElementById('givingAmount');
    const selectedPlan = document.querySelector('.plan-option.selected');
    const isYearly = selectedPlan && selectedPlan.id === 'planYearly';
    
    // Base Prices in INR
    const base = isYearly ? 749 : 999;
    const amount = Math.round(base * val / 100);

    if (pctEl) pctEl.textContent = val + '%';
    if (amountEl) amountEl.textContent = `= ₹${amount}/month`;
}

function updateDashGiving(val) {
    const pctEl = document.getElementById('dashGivingPct');
    if (pctEl) pctEl.textContent = val + '%';
}

// ===================== UTILS =====================
function showToast(message, type = 'success') {
    const existing = document.querySelector('.toast-notification');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.innerHTML = `
        <div class="toast-inner toast-${type}">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        </div>
    `;

    const style = document.createElement('style');
    style.textContent = `
        .toast-notification { position: fixed; bottom: 2rem; right: 2rem; z-index: 9999; animation: slideInRight 0.4s ease; }
        .toast-inner { display: flex; align-items: center; gap: 0.75rem; padding: 0.875rem 1.5rem; border-radius: 12px; font-size: 0.9rem; font-weight: 600; box-shadow: 0 8px 32px rgba(0,0,0,0.2); }
        .toast-success { background: #10b981; color: white; }
        .toast-error { background: #ef4444; color: white; }
        @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    `;
    document.head.appendChild(style);
    document.body.appendChild(toast);
    setTimeout(() => { 
        toast.style.opacity = '0'; 
        toast.style.transition = 'opacity 0.3s'; 
        setTimeout(() => toast.remove(), 300); 
    }, 3000);
}