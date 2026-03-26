const express = require('express');
const router = express.Router();
const supabase = require('../config/db');
const multer = require('multer');
const path = require('path');

// Configure Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, './public/uploads'),
    filename: (req, file, cb) => cb(null, 'proof_' + Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// Middleware to ensure user
router.use((req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/auth/login');
    }
    next();
});

router.get('/', async (req, res) => {
    try {
        const userId = req.session.user.id;
        // Get full user info
        const { data: users, error: uErr } = await supabase.from('users').select('*').eq('id', userId);
        if (uErr) throw uErr;
        const user = users && users.length > 0 ? users[0] : null;
            
        // Get user's charity info
        let charity = null;
        if (user && user.charity_id) {
            const { data: charities } = await supabase.from('charities').select('*').eq('id', user.charity_id);
            if (charities && charities.length > 0) charity = charities[0];
        }

        // Get user's scores
        const { data: scores } = await supabase.from('scores').select('*').eq('user_id', userId).order('date', { ascending: false }).limit(5);

        // Get draws and winnings
        const { data: draws } = await supabase.from('draws').select('*').order('draw_date', { ascending: false }).limit(10);
        
        // Supabase foreign key join
        const { data: winningsRaw, error: wErr } = await supabase.from('winners').select('*, draws(draw_date, winning_numbers)').eq('user_id', userId).order('id', { ascending: false });
        if (wErr) throw wErr;
        
        const winnings = winningsRaw ? winningsRaw.map(w => ({
            ...w,
            draw_date: w.draws?.draw_date,
            winning_numbers: w.draws?.winning_numbers
        })) : [];

        res.render('dashboard', { 
            activePage: 'dashboard', 
            user,
            charity,
            scores,
            draws,
            winnings
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

router.post('/scores/add', async (req, res) => {
    const { score, course_name, played_at } = req.body;
    try {
        const { error: insErr } = await supabase.from('scores').insert([{ 
            user_id: req.session.user.id, 
            score: parseInt(score), 
            course_name, 
            date: played_at || new Date().toISOString().split('T')[0] 
        }]);
        if (insErr) throw insErr;
        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error adding score');
    }
});

router.post('/scores/delete/:id', async (req, res) => {
    try {
        const { error: delErr } = await supabase.from('scores').delete().eq('id', req.params.id).eq('user_id', req.session.user.id);
        if (delErr) throw delErr;
        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error deleting score');
    }
});

router.post('/winnings/:id/proof', upload.single('proof_image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).send('No file uploaded');
        const proofUrl = '/uploads/' + req.file.filename;
        
        const { error: updErr } = await supabase.from('winners').update({ proof_image: proofUrl }).eq('id', req.params.id).eq('user_id', req.session.user.id);
        if (updErr) throw updErr;
        res.redirect('/dashboard#winnings');
    } catch (err) {
        console.error(err);
        res.status(500).send('Proof upload failed');
    }
});

router.post('/profile/update', async (req, res) => {
    const { first_name, last_name, email } = req.body;
    try {
        const { error: updUserErr } = await supabase.from('users').update({ first_name, last_name, email }).eq('id', req.session.user.id);
        if (updUserErr) throw updUserErr;
        
        req.session.user.first_name = first_name;
        req.session.user.last_name = last_name;
        req.session.user.email = email;
        res.redirect('/dashboard#subscription');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error updating profile');
    }
});

module.exports = router;
