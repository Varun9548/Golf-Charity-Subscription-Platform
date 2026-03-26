const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const supabase = require('../config/db');

// Admin Login Page
router.get('/login', (req, res) => {
    if (req.session.user && req.session.user.is_admin) return res.redirect('/admin');
    res.render('admin-login', { activePage: 'admin-login', error: null });
});

// Admin Login POST
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const { data: users, error } = await supabase.from('users').select('*').eq('email', email).eq('is_admin', true);
        if (error) throw error;
        
        if (!users || users.length === 0) {
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
        const { data: usersRaw, error: uErr } = await supabase.from('users').select('*, charities(name)').order('created_at', { ascending: false });
        if(uErr) throw uErr;
        const users = usersRaw ? usersRaw.map(u => ({ ...u, charity_name: u.charities?.name })) : [];
        
        // Fetch winners
        const { data: winnersRaw, error: wErr } = await supabase.from('winners').select('*, users(first_name, last_name)').order('id', { ascending: false });
        if(wErr) throw wErr;
        const winners = winnersRaw ? winnersRaw.map(w => ({ ...w, first_name: w.users?.first_name, last_name: w.users?.last_name })) : [];
        
        const { data: draws } = await supabase.from('draws').select('*').order('draw_date', { ascending: false });
        
        const totalPrizePool = winners.filter(w => w.status !== 'rejected').reduce((sum, w) => sum + Number(w.amount), 0);
        
        const { data: charities } = await supabase.from('charities').select('*').order('name', { ascending: true });

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
            draws: draws || [],
            charities: charities || [],
            metrics: {
                totalSubscribers: users.filter(u => !u.is_admin).length,
                monthlyRevenue: monthlyRevenue,
                charityContributions: charityTotal,
                totalPrizePool: totalPrizePool,
                totalDraws: draws ? draws.length : 0
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

        const drawDate = new Date().toISOString().split('T')[0];
        
        // Ensure no pending draw exists, or we replace it
        await supabase.from('draws').delete().eq('status', 'pending');
        
        const { data: drawRes, error: dErr } = await supabase.from('draws').insert([{ draw_date: drawDate, winning_numbers: winningStr, status: 'pending' }]).select();
        if (dErr) throw dErr;
        const drawId = drawRes[0].id;

        // Fetch all active users
        const { data: users } = await supabase.from('users').select('id').eq('is_admin', false);
        
        await supabase.from('winners').delete().eq('draw_id', drawId); // clear possible old pending

        let winners5 = 0, winners4 = 0, winners3 = 0;

        if (users) {
            for (const u of users) {
                const { data: scores } = await supabase.from('scores').select('score').eq('user_id', u.id).order('date', { ascending: false }).limit(5);
                
                if (scores && scores.length > 0) {
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

                        await supabase.from('winners').insert([{ user_id: u.id, draw_id: drawId, match_count: matchCount, amount: amount, status: 'pending' }]);
                    }
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
        await supabase.from('draws').update({ status: 'published' }).eq('id', req.params.id);
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
        await supabase.from('winners').update({ status: status }).eq('id', req.params.id);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update winner status' });
    }
});

// ===================== USER MANAGEMENT =====================
router.post('/users/:id/delete', async (req, res) => {
    try {
        await supabase.from('users').delete().eq('id', req.params.id);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

router.get('/users/:id/data', async (req, res) => {
    try {
        const { data: users } = await supabase.from('users').select('id, first_name, last_name, email, plan').eq('id', req.params.id);
        const { data: scores } = await supabase.from('scores').select('*').eq('user_id', req.params.id).order('date', { ascending: false });
        
        if(!users || users.length === 0) return res.status(404).json({ error: 'User not found' });
        res.json({ user: users[0], scores: scores || [] });
    } catch(err) {
        res.status(500).json({ error: 'Internal error' });
    }
});

router.post('/users/:id/edit', async (req, res) => {
    const { first_name, last_name, email, plan } = req.body;
    try {
        await supabase.from('users').update({ first_name, last_name, email, plan }).eq('id', req.params.id);
        res.json({ success: true });
    } catch(err) {
        res.status(500).json({ error: 'Failed to update user' });
    }
});

router.post('/scores/:id/edit', async (req, res) => {
    const { score, course_name, date } = req.body;
    try {
        await supabase.from('scores').update({ score: parseInt(score), course_name, date }).eq('id', req.params.id);
        res.json({ success: true });
    } catch(err) {
        res.status(500).json({ error: 'Failed to update score' });
    }
});

router.post('/scores/:id/delete', async (req, res) => {
    try {
        await supabase.from('scores').delete().eq('id', req.params.id);
        res.json({ success: true });
    } catch(err) {
        res.status(500).json({ error: 'Failed to delete score' });
    }
});

// ===================== CHARITY MANAGEMENT =====================
router.post('/charities/add', async (req, res) => {
    const { name, category, description } = req.body;
    try {
        await supabase.from('charities').insert([{ name, category, description, supporters_count: 0, raised_amount: 0 }]);
        res.redirect('/admin');
    } catch(err) {
        res.status(500).send('Failed adding charity');
    }
});

router.post('/charities/:id/edit', async (req, res) => {
    const { name, category, description } = req.body;
    try {
        await supabase.from('charities').update({ name, category, description }).eq('id', req.params.id);
        res.redirect('/admin');
    } catch(err) {
        res.status(500).send('Failed updating charity');
    }
});

router.post('/charities/:id/delete', async (req, res) => {
    try {
        await supabase.from('charities').delete().eq('id', req.params.id);
        res.json({ success: true });
    } catch(err) {
        res.status(500).json({ error: 'Failed to delete charity' });
    }
});

module.exports = router;
