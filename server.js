const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./backend/authRoutes');

const app = express();

app.use(express.json());

app.use(cors({
    origin: 'https://cs360-ecommercewebsiteproject.onrender.com',
    credentials: true
}));

app.use(session({
    secret: 'secure_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: true,
        httpOnly: true,
        sameSite: 'lax',
        path: '/'
    }
}));

app.use(express.static(path.join(__dirname, './frontend')));

app.use(authRoutes);

const requireAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.isAdmin) return next();
    return res.status(403).send('Forbidden: Admins only.');
};

['/', '/shop', '/cart', '/login', '/register', '/orders'].forEach(route => {
    app.get(route, (_, res) => {
        res.sendFile(path.join(__dirname, './frontend', route === '/' ? 'index.html' : `${route.slice(1)}.html`));
    });
});

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

app.use((req, res) => {
    res.status(404).send('404 Not Found');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Listening on https://cs360-ecommercewebsiteproject.onrender.com/${PORT}`);
});
