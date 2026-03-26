/* =====================================================
   GREENHEART — LOGIN JS
   ===================================================== */

function fillDemo(type) {
    const emailEl = document.getElementById('loginEmail');
    const passEl = document.getElementById('loginPassword');

    if (type === 'user') {
        if (emailEl) emailEl.value = 'user@demo.com';
        if (passEl) passEl.value = 'demo1234';
    } else {
        if (emailEl) emailEl.value = 'admin@demo.com';
        if (passEl) passEl.value = 'admin1234';
    }

    showToast('Demo credentials filled — click Log In to continue', 'success');
}

function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('loginEmail')?.value.trim();
    const pass = document.getElementById('loginPassword')?.value.trim();
    const errorEl = document.getElementById('loginError');

    if (!email || !pass) {
        if (errorEl) errorEl.classList.remove('hidden');
        return;
    }

    const btn = document.querySelector('#loginForm button[type="submit"]');
    if (btn) {
        btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Logging in...';
        btn.disabled = true;
    }

    setTimeout(() => {
        if (email === 'admin@demo.com' && pass === 'admin1234') {
            showToast('Welcome, Admin! Redirecting...', 'success');
            setTimeout(() => { window.location.href = 'admin.html'; }, 1000);
        } else if (email === 'user@demo.com' && pass === 'demo1234') {
            showToast('Welcome back, James! Redirecting...', 'success');
            setTimeout(() => { window.location.href = 'dashboard.html'; }, 1000);
        } else {
            if (btn) {
                btn.innerHTML = 'Log In <i class="fas fa-arrow-right"></i>';
                btn.disabled = false;
            }
            if (errorEl) errorEl.classList.remove('hidden');
        }
    }, 1500);
}
