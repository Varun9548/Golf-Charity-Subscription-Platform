const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../config/db');

// Login Page
router.get('/login', (req, res) => {
    if (req.session.user) return res.redirect('/dashboard');
    res.render('login', { activePage: 'login', error: null });
});

// Login POST
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.render('login', { activePage: 'login', error: 'Invalid email or password' });
        }
        
        const user = users[0];
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.render('login', { activePage: 'login', error: 'Invalid email or password' });
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
        const [charities] = await pool.query('SELECT * FROM charities ORDER BY name ASC');
        res.render('signup', { activePage: 'signup', charities, error: null });
    } catch (err) {
        res.render('signup', { activePage: 'signup', charities: [], error: null });
    }
});

// Signup POST
router.post('/signup', async (req, res) => {
    const { firstName, lastName, email, password, plan, charity_id, givingPct } = req.body;
    try {
        // Check if exists
        const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            const [charities] = await pool.query('SELECT * FROM charities ORDER BY name ASC');
            return res.render('signup', { activePage: 'signup', charities, error: 'Email already registered' });
        }

        const hashed = await bcrypt.hash(password, 10);
        await pool.query(
            'INSERT INTO users (first_name, last_name, email, password, plan, charity_id, giving_pct) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [firstName, lastName, email, hashed, plan || 'monthly', charity_id, givingPct || 10]
        );

        // Update charity supporters count
        if (charity_id) {
            await pool.query('UPDATE charities SET supporters_count = supporters_count + 1 WHERE id = ?', [charity_id]);
        }

        res.redirect('/auth/login?registered=true');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error during registration');
    }
});

// Logout
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/auth/login');
});

module.exports = router;
