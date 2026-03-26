const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const supabase = require('../config/db');
const Razorpay = require('razorpay');

// Demo Razorpay Instance (Safe test keys for demo)
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_zH0bXz9s8PzM0j',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'gP7qBwN1GzQJwX6aT5L2K1n',
});

// Login Page
router.get('/login', (req, res) => {
    if (req.session.user) return res.redirect('/dashboard');
    res.render('login', { activePage: 'login', error: null, registered: req.query.registered === 'true' });
});

// Login POST
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const { data: users, error } = await supabase.from('users').select('*').eq('email', email);
        if (error) throw error;
        if (!users || users.length === 0) {
            return res.render('login', { activePage: 'login', error: 'Invalid email or password', registered: false });
        }
        
        const user = users[0];
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.render('login', { activePage: 'login', error: 'Invalid email or password', registered: false });
        }

        req.session.user = {
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            is_admin: user.is_admin
        };

        if (user.is_admin) {
            // Standard portal shouldn't log in admins ideally, but if they fall through here, 
            // redirect them to the dedicated admin portal.
            return res.redirect('/admin/login');
        } else {
            return res.redirect('/dashboard');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});

// Signup Page
router.get('/signup', async (req, res) => {
    if (req.session.user) return res.redirect('/dashboard');
    try {
        const { data: charities, error } = await supabase.from('charities').select('*').order('name', { ascending: true });
        if (error) throw error;
        res.render('signup', { activePage: 'signup', charities: charities || [], error: null });
    } catch (err) {
        res.render('signup', { activePage: 'signup', charities: [], error: null });
    }
});

// Razorpay Create Order Endpoint
router.post('/create-order', async (req, res) => {
    let amountPaid = 99900;
    try {
        const { plan } = req.body;
        amountPaid = plan === 'yearly' ? 899900 : 99900; // Paise
        
        const options = {
            amount: amountPaid,
            currency: "INR",
            receipt: "receipt_signup_" + Date.now()
        };
        
        const order = await razorpay.orders.create(options);
        res.json({ success: true, order_id: order.id, amount: amountPaid });
    } catch(err) {
        console.warn('Razorpay 401: Invalid Test Keys. Using demo simulation.');
        // Return a mocked object so the demo frontend continues
        res.json({ success: true, order_id: 'order_mock_' + Date.now(), amount: amountPaid, mock: true });
    }
});

// Signup POST
router.post('/signup', async (req, res) => {
    const { firstName, lastName, email, password, plan, charity_id, givingPct } = req.body;
    try {
        // Check if exists
        const { data: existing, error: existErr } = await supabase.from('users').select('id').eq('email', email);
        if (existErr) throw existErr;
        
        if (existing && existing.length > 0) {
            const { data: charities } = await supabase.from('charities').select('*').order('name', { ascending: true });
            return res.render('signup', { activePage: 'signup', charities: charities || [], error: 'Email already registered' });
        }

        const hashed = await bcrypt.hash(password, 10);
        
        const { error: insertErr } = await supabase.from('users').insert([{
            first_name: firstName,
            last_name: lastName,
            email: email,
            password: hashed,
            plan: plan || 'monthly',
            charity_id: charity_id ? parseInt(charity_id) : null,
            giving_pct: givingPct ? parseInt(givingPct) : 10
        }]);
        if (insertErr) throw insertErr;

        // Update charity supporters count
        if (charity_id) {
            const parsedCharityId = parseInt(charity_id);
            const { data: ch } = await supabase.from('charities').select('supporters_count').eq('id', parsedCharityId).single();
            if (ch) {
                await supabase.from('charities').update({ supporters_count: (ch.supporters_count || 0) + 1 }).eq('id', parsedCharityId);
            }
        }

        res.redirect('/auth/login?registered=true');
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error during registration', message: error.message, details: error.details, hint: error.hint, code: error.code });
    }
});

// Logout
router.get('/logout', (req, res) => {
    req.session = null;
    res.redirect('/auth/login');
});

module.exports = router;
