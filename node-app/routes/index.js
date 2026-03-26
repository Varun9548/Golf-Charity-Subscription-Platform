const express = require('express');
const router = express.Router();
const supabase = require('../config/db');

// Main Landing Page
router.get('/', async (req, res) => {
    res.render('index', { activePage: 'home' });
});

// Charities Page
router.get('/charities', async (req, res) => {
    try {
        const { data: charities, error } = await supabase.from('charities').select('*').order('supporters_count', { ascending: false });
        if (error) throw error;
        res.render('charities', { activePage: 'charities', charities: charities || [] });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

// Single Charity Profile
router.get('/charities/:id', async (req, res) => {
    try {
        const { data: rows, error } = await supabase.from('charities').select('*').eq('id', req.params.id);
        if (error) throw error;
        if (!rows || rows.length === 0) return res.status(404).send('Charity not found');
        res.render('charity-profile', { activePage: 'charities', charity: rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
