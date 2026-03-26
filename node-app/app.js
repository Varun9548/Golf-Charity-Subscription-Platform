require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const pool = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Set EJS as templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: process.env.SESSION_SECRET || 'greenheart_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production' } // secure cookies require HTTPS
}));

// Global variable for views (user info)
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

// Import Routes
const indexRoutes = require('./routes/index');
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const adminRoutes = require('./routes/admin');

// Use Routes
app.use('/', indexRoutes);
app.use('/auth', authRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/admin', adminRoutes);

// Supabase doesn't require a constant connection pool like MySQL.
// We can just start the server directly.
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`Server started on http://localhost:${PORT}`);
    });
}

module.exports = app;

module.exports = app;
