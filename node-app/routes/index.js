const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Main Landing Page
router.get('/', async (req, res) => {
    res.render('index', { activePage: 'home' });
});

// Charities Page
router.get('/charities', async (req, res) => {
    try {
        const [charities] = await pool.query('SELECT * FROM charities ORDER BY supporters_count DESC');
        res.render('charities', { activePage: 'charities', charities });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

// Single Charity Profile
router.get('/charities/:id', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM charities WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).send('Charity not found');
        res.render('charity-profile', { activePage: 'charities', charity: rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
