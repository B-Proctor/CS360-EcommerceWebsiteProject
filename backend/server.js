const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const db = require('./dbConfig');
const authRoutes = require('./authRoutes');
const app = express();

app.use(express.json());

app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));

app.use(session({
    secret: 'secure_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        httpOnly: true,
        sameSite: 'lax',
        path: '/'
    }
}));

// Serve static files
app.use(express.static(path.join(__dirname, '../frontend')));

app.use(authRoutes);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/register.html'));
});

app.get('/cart', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/cart.html'));
});

app.get('/profile', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    res.send(`<h1>Welcome to your profile, ${req.session.user.email}</h1>`);
});

app.get('/shop', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/shop.html'));
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
