const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./backend/authRoutes');

const app = express();

// Middleware
app.use(express.json());

// CORS: Allow local dev + production
app.use(cors({
    origin: [
      // 'http://localhost:3000',
        'https://cs360-ecommercewebsiteproject.onrender.com'
    ],
    credentials: true
}));

// Session setup
app.use(session({
    secret: process.env.SECRET || 'secure_secret_key', // Fallback secret if no env
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: true,          // Cookie sent only over HTTPS
        httpOnly: true,        // Cannot be accessed by JS
        sameSite: 'none',       // <-- CRITICAL for cross-origin frontend/backend
        path: '/'
    }
}));

// Serve static files
app.use(express.static(path.join(__dirname, './frontend')));

// Routes
app.use(authRoutes);

// Route guards
const requireAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.isAdmin) return next();
    return res.status(403).send('Forbidden: Admins only.');
};

// Public pages
['/', '/shop', '/cart', '/login', '/register', '/orders'].forEach(route => {
    app.get(route, (_, res) => {
        res.sendFile(path.join(__dirname, './frontend', route === '/' ? 'index.html' : `${route.slice(1)}.html`));
    });
});

// Admin pages
app.get('/admin', requireAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, './frontend/admin/a_index.html'));
});

app.get('/admin/orders', requireAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, './frontend/admin/orders.html'));
});

app.get('/admin/products', requireAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, './frontend/admin/products.html'));
});

app.get('/admin/users', requireAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, './frontend/admin/users.html'));
});

// 404 handler
app.use((req, res) => {
    res.status(404).send('404 Not Found');
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Listening on port ${PORT}`);
});
