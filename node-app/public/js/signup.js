/* =====================================================
   GREENHEART — SIGNUP JS (Updated for INR)
   ===================================================== */

let currentStep = 1;
let selectedPlan = 'monthly';
let selectedCharity = 'macmillan';
let givingPct = 10;

// ===================== STEP NAVIGATION =====================
function goToStep(step) {
    // Validate current step before proceeding
    if (step > currentStep && !validateStep(currentStep)) return;

    const currentEl = document.getElementById(`step${currentStep}`);
    const nextEl = document.getElementById(`step${step}`);

    if (currentEl) currentEl.classList.remove('active');
    if (nextEl) nextEl.classList.add('active');

    // Update progress indicators
    document.querySelectorAll('.signup-step').forEach((el, idx) => {
        const stepNum = idx + 1;
        el.classList.remove('active', 'done');
        if (stepNum === step) el.classList.add('active');
        if (stepNum < step) el.classList.add('done');
    });

    // Update step lines
    document.querySelectorAll('.step-line').forEach((el, idx) => {
        el.classList.toggle('active', idx < step - 1);
    });

    // Update done circles
    document.querySelectorAll('.signup-step.done .step-circle').forEach(el => {
        if (!el.querySelector('i')) {
            el.innerHTML = '<i class="fas fa-check" style="font-size:0.75rem;"></i>';
        }
    });

    currentStep = step;
    if (typeof updateOrderSummary === "function") updateOrderSummary();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function validateStep(step) {
    if (step === 1) {
        const first = document.getElementById('firstName');
        const last = document.getElementById('lastName');
        const email = document.getElementById('email');
        const pass = document.getElementById('password');
        const agree = document.getElementById('agreeTerms');

        if (!first?.value.trim()) { showFieldError(first, 'Please enter your first name'); return false; }
        if (!last?.value.trim()) { showFieldError(last, 'Please enter your last name'); return false; }
        if (!email?.value.includes('@')) { showFieldError(email, 'Please enter a valid email'); return false; }
        if (!pass?.value || pass.value.length < 8) { showFieldError(pass, 'Password must be at least 8 characters'); return false; }
        if (!agree?.checked) { showToast('Please agree to the Terms of Service', 'error'); return false; }
    }
    return true;
}

function showFieldError(input, message) {
    if (!input) return;
    input.style.borderColor = '#ef4444';
    input.focus();
    showToast(message, 'error');
    input.addEventListener('input', () => { input.style.borderColor = ''; }, { once: true });
}

// ===================== PLAN SELECTION =====================
function selectPlan(plan) {
    selectedPlan = plan;
    document.getElementById('planMonthly')?.classList.toggle('selected', plan === 'monthly');
    document.getElementById('planYearly')?.classList.toggle('selected', plan === 'yearly');
    updateGiving(givingPct);
    updateOrderSummary();
}

// ===================== CHARITY SELECTION =====================
function selectCharity(el) {
    document.querySelectorAll('.charity-option').forEach(opt => opt.classList.remove('selected'));
    el.classList.add('selected');
    selectedCharity = el.dataset.charity;
    updateOrderSummary();
}

// ===================== ORDER SUMMARY (Updated for INR) =====================
function updateOrderSummary() {
    const planEl = document.getElementById('orderPlan');
    const charityEl = document.getElementById('orderCharity');
    const totalEl = document.getElementById('orderTotal');

    // Indian Pricing Logic
    const monthlyPrice = 999;
    const yearlyPrice = 8999;

    const planLabel = selectedPlan === 'monthly' ? `Monthly — ₹${monthlyPrice}/month` : `Yearly — ₹${yearlyPrice}/year`;
    const base = selectedPlan === 'monthly' ? monthlyPrice : yearlyPrice;
    
    // Donation calculation (Percentage of the monthly equivalent base)
    const charityAmount = (selectedPlan === 'monthly' ? monthlyPrice : 750) * givingPct / 100;
    
    const charityMap = {
        macmillan: 'Macmillan', nspcc: 'NSPCC',
        rspca: 'RSPCA', bhf: 'British Heart Foundation', ageuk: 'Age UK'
    };

    if (planEl) planEl.textContent = planLabel;
    if (charityEl) {
        charityEl.textContent = `${charityMap[selectedCharity] || 'Selected'} — ${givingPct}% (₹${charityAmount.toLocaleString('en-IN')})`;
    }
    if (totalEl) totalEl.textContent = `₹${base.toLocaleString('en-IN')}`;
}

// Override updateGiving for signup context (Updated for INR)
window.updateGiving = function(val) {
    givingPct = parseInt(val);
    const pctEl = document.getElementById('givingPct');
    const amountEl = document.getElementById('givingAmount');
    
    const monthlyBase = 999;
    const yearlyEquivalentBase = 750; // Discounted monthly base for yearly plan
    
    const base = selectedPlan === 'monthly' ? monthlyBase : yearlyEquivalentBase;
    const amount = (base * val / 100).toFixed(0);
    
    if (pctEl) pctEl.textContent = val + '%';
    if (amountEl) amountEl.textContent = `= ₹${parseInt(amount).toLocaleString('en-IN')}/month`;
    
    updateOrderSummary();
};

// ===================== COMPLETE SIGNUP =====================
function completeSignup() {
    const name = document.getElementById('cardName')?.value.trim();
    const number = document.getElementById('cardNumber')?.value.trim();
    const expiry = document.getElementById('cardExpiry')?.value.trim();
    const cvv = document.getElementById('cardCvv')?.value.trim();

    if (!name || !number || !expiry || !cvv) {
        showToast('Please fill in all payment details', 'error');
        return;
    }

    // Simulate processing
    const btn = document.querySelector('#step4 .btn-form-primary');
    if (btn) {
        btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Processing...';
        btn.disabled = true;
    }

    setTimeout(() => {
        goToStep(5);
    }, 2000);
}

// ===================== URL PARAMS =====================
const params = new URLSearchParams(window.location.search);
const planParam = params.get('plan');
const charityParam = params.get('charity');

if (planParam) selectPlan(planParam);
if (charityParam) {
    const charityEl = document.querySelector(`[data-charity="${charityParam}"]`);
    if (charityEl) selectCharity(charityEl);
}

// Initial calculation
document.addEventListener('DOMContentLoaded', () => {
    updateOrderSummary();
});