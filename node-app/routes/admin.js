const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../config/db');

// Admin Login Page
router.get('/login', (req, res) => {
    if (req.session.user && req.session.user.is_admin) return res.redirect('/admin');
    res.render('admin-login', { activePage: 'admin-login', error: null });
});

// Admin Login POST
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const [users] = await pool.query('SELECT * FROM users WHERE email = ? AND is_admin = TRUE', [email]);
        if (users.length === 0) {
            return res.render('admin-login', { activePage: 'admin-login', error: 'Invalid admin credentials' });
        }
        
        const admin = users[0];
        const match = await bcrypt.compare(password, admin.password);
        if (!match) {
            return res.render('admin-login', { activePage: 'admin-login', error: 'Invalid admin credentials' });
        }

        req.session.user = {
            id: admin.id,
            first_name: admin.first_name,
            last_name: admin.last_name,
            email: admin.email,
            is_admin: true
        };

        return res.redirect('/admin');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});

// Admin Logout
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/admin/login');
});

// Middleware to ensure admin
router.use((req, res, next) => {
    if (!req.session.user || !req.session.user.is_admin) {
        return res.redirect('/admin/login');
    }
    next();
});

router.get('/', async (req, res) => {
    try {
        // Fetch users
        const [users] = await pool.query(`
            SELECT u.id, u.first_name, u.last_name, u.email, u.plan, u.is_admin, u.created_at, c.name as charity_name 
            FROM users u 
            LEFT JOIN charities c ON u.charity_id = c.id 
            ORDER BY u.created_at DESC
        `);
        
        // Fetch winners using explicit group_concat to prevent duplicate row explosions or just distinct query
        const [winners] = await pool.query('SELECT w.*, u.first_name, u.last_name FROM winners w JOIN users u ON w.user_id = u.id ORDER BY w.id DESC');
        
        const [draws] = await pool.query('SELECT * FROM draws ORDER BY draw_date DESC');
        const [[prizePoolObj]] = await pool.query('SELECT SUM(amount) as total FROM winners WHERE status != "rejected"');
        const [charities] = await pool.query('SELECT * FROM charities ORDER BY name ASC');

        // Calculate Revenue and Charity Metrics accurately based on plan and giving_pct
        let monthlyRevenue = 0;
        let charityTotal = 0;
        users.forEach(u => {
            if (!u.is_admin) {
                const subAmt = u.plan === 'yearly' ? 750 : 999;
                monthlyRevenue += subAmt;
                charityTotal += subAmt * ((u.giving_pct || 10) / 100);
            }
        });

        res.render('admin', { 
            activePage: 'admin', 
            users, 
            winners,
            draws,
            charities,
            metrics: {
                totalSubscribers: users.filter(u => !u.is_admin).length,
                monthlyRevenue: monthlyRevenue,
                charityContributions: charityTotal,
                totalPrizePool: prizePoolObj.total || 0,
                totalDraws: draws.length
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// ===================== DRAW SIMULATION =====================
router.post('/draws/simulate', async (req, res) => {
    try {
        // Generate random draw numbers (5 from 1-45)
        const numbers = [];
        while (numbers.length < 5) {
            const n = Math.floor(Math.random() * 45) + 1;
            if (!numbers.includes(n)) numbers.push(n);
        }
        numbers.sort((a, b) => b - a);
        const winningStr = numbers.join(',');

        // Current real month logic for date
        const drawDate = new Date().toISOString().split('T')[0];

        // Use algorithm choice if passed
        const { algorithm } = req.body || { algorithm: 'random' };
        
        // Ensure no pending draw exists, or we replace it
        await pool.query("DELETE FROM draws WHERE status = 'pending'");
        const [drawRes] = await pool.query(
            "INSERT INTO draws (draw_date, winning_numbers, status) VALUES (?, ?, 'pending')",
            [drawDate, winningStr]
        );
        const drawId = drawRes.insertId;

        // Fetch all user scores for current period (mocking logic by fetching all active users' latest 5 scores)
        const [users] = await pool.query("SELECT id FROM users WHERE is_admin = FALSE");
        
        await pool.query("DELETE FROM winners WHERE draw_id = ?", [drawId]); // clear possible old pending

        let winners5 = 0, winners4 = 0, winners3 = 0;

        for (const u of users) {
             const [scores] = await pool.query('SELECT score FROM scores WHERE user_id = ? ORDER BY date DESC LIMIT 5', [u.id]);
             if (scores.length > 0) {
                 const userNums = scores.map(s => s.score);
                 let matchCount = 0;
                 userNums.forEach(un => {
                     if (numbers.includes(un)) matchCount++;
                 });

                 if (matchCount >= 3) {
                     let amount = 0;
                     if (matchCount === 3) { amount = 5000; winners3++; }
                     if (matchCount === 4) { amount = 25000; winners4++; }
                     if (matchCount === 5) { amount = 100000; winners5++; }

                     await pool.query(
                         "INSERT INTO winners (user_id, draw_id, match_count, amount, status) VALUES (?, ?, ?, ?, 'pending')",
                         [u.id, drawId, matchCount, amount]
                     );
                 }
             }
        }

        res.json({ success: true, numbers, winners5, winners4, winners3, drawId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server Error during simulation' });
    }
});

router.post('/draws/:id/publish', async (req, res) => {
    try {
        await pool.query("UPDATE draws SET status = 'published' WHERE id = ?", [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to publish draw' });
    }
});

// ===================== WINNER MANAGEMENT =====================
router.post('/winners/:id/status', async (req, res) => {
    const { status } = req.body;
    try {
        await pool.query('UPDATE winners SET status = ? WHERE id = ?', [status, req.params.id]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update winner status' });
    }
});

// ===================== USER MANAGEMENT =====================
router.post('/users/:id/delete', async (req, res) => {
    try {
        await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

router.get('/users/:id/data', async (req, res) => {
    try {
        const [users] = await pool.query('SELECT id, first_name, last_name, email, plan FROM users WHERE id = ?', [req.params.id]);
        const [scores] = await pool.query('SELECT * FROM scores WHERE user_id = ? ORDER BY date DESC', [req.params.id]);
        if(users.length === 0) return res.status(404).json({ error: 'User not found' });
        res.json({ user: users[0], scores });
    } catch(err) {
        res.status(500).json({ error: 'Internal error' });
    }
});

router.post('/users/:id/edit', async (req, res) => {
    const { first_name, last_name, email, plan } = req.body;
    try {
        await pool.query('UPDATE users SET first_name=?, last_name=?, email=?, plan=? WHERE id=?', [first_name, last_name, email, plan, req.params.id]);
        res.json({ success: true });
    } catch(err) {
        res.status(500).json({ error: 'Failed to update user' });
    }
});

router.post('/scores/:id/edit', async (req, res) => {
    const { score, course_name, date } = req.body;
    try {
        await pool.query('UPDATE scores SET score=?, course_name=?, date=? WHERE id=?', [score, course_name, date, req.params.id]);
        res.json({ success: true });
    } catch(err) {
        res.status(500).json({ error: 'Failed to update score' });
    }
});

router.post('/scores/:id/delete', async (req, res) => {
    try {
        await pool.query('DELETE FROM scores WHERE id=?', [req.params.id]);
        res.json({ success: true });
    } catch(err) {
        res.status(500).json({ error: 'Failed to delete score' });
    }
});

// ===================== CHARITY MANAGEMENT =====================
router.post('/charities/add', async (req, res) => {
    const { name, category, description } = req.body;
    try {
        await pool.query('INSERT INTO charities (name, category, description, supporters_count, raised_amount) VALUES (?, ?, ?, 0, 0)', [name, category, description]);
        res.redirect('/admin');
    } catch(err) {
        res.status(500).send('Failed adding charity');
    }
});

router.post('/charities/:id/edit', async (req, res) => {
    const { name, category, description } = req.body;
    try {
        await pool.query('UPDATE charities SET name=?, category=?, description=? WHERE id=?', [name, category, description, req.params.id]);
        res.redirect('/admin');
    } catch(err) {
        res.status(500).send('Failed updating charity');
    }
});

router.post('/charities/:id/delete', async (req, res) => {
    try {
        await pool.query('DELETE FROM charities WHERE id=?', [req.params.id]);
        res.json({ success: true });
    } catch(err) {
        res.status(500).json({ error: 'Failed to delete charity' });
    }
});

module.exports = router;
