const express = require('express');
const router = express.Router();
const pool = require('../config/db');
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
        const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
        const user = users[0];
            
        // Get user's charity info
        let charity = null;
        if (user && user.charity_id) {
            const [charities] = await pool.query('SELECT * FROM charities WHERE id = ?', [user.charity_id]);
            if (charities.length > 0) charity = charities[0];
        }

        // Get user's scores
        const [scores] = await pool.query('SELECT * FROM scores WHERE user_id = ? ORDER BY date DESC LIMIT 5', [userId]);

        // Get draws and winnings
        const [draws] = await pool.query('SELECT * FROM draws ORDER BY draw_date DESC LIMIT 10');
        const [winnings] = await pool.query(`
            SELECT w.*, d.draw_date, d.winning_numbers 
            FROM winners w 
            JOIN draws d ON w.draw_id = d.id 
            WHERE w.user_id = ? 
            ORDER BY w.id DESC
        `, [userId]);

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
        await pool.query(
            'INSERT INTO scores (user_id, score, course_name, date) VALUES (?, ?, ?, ?)',
            [req.session.user.id, score, course_name, played_at || new Date().toISOString().split('T')[0]]
        );
        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error adding score');
    }
});

router.post('/scores/delete/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM scores WHERE id = ? AND user_id = ?', [req.params.id, req.session.user.id]);
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
        // The winner validation relies on proof image path; keeping status pending for review
        await pool.query('UPDATE winners SET proof_image = ? WHERE id = ? AND user_id = ?', [proofUrl, req.params.id, req.session.user.id]);
        res.redirect('/dashboard#winnings');
    } catch (err) {
        console.error(err);
        res.status(500).send('Proof upload failed');
    }
});

router.post('/profile/update', async (req, res) => {
    const { first_name, last_name, email } = req.body;
    try {
        await pool.query('UPDATE users SET first_name=?, last_name=?, email=? WHERE id=?', [first_name, last_name, email, req.session.user.id]);
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
