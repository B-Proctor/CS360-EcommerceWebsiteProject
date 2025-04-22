const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const db = require('./backend/dbConfig');
const authRoutes = require('./backend/authRoutes');

const app = express();


app.use(express.json());

app.use(cors({
    origin: 'https://cs360-ecommercewebsiteproject.onrender.com/',
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

app.use(express.static(path.join(__dirname, './frontend')));


app.use(authRoutes);



// Home Page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, './frontend/index.html'));
});

// Login Page
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, './frontend/login.html'));
});

// Register Page
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, './frontend/register.html'));
});

// Shop Page
app.get('/shop', (req, res) => {
    res.sendFile(path.join(__dirname, './frontend/shop.html'));
});

// Cart Page
app.get('/cart', (req, res) => {
    res.sendFile(path.join(__dirname, './frontend/cart.html'));
});


// Profile Page
app.get('/profile', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    res.send(`
        <h1>Welcome, ${req.session.user.firstName} ${req.session.user.lastName}!</h1>
        <p>Email: ${req.session.user.email}</p>
        <p><a href="/">Back to Home</a></p>
    `);
});


// Error Handling

app.use((req, res) => {
    res.status(404).send('<h1>404 - Page Not Found</h1>');
});

// Global Error Handler (catches any other errors)
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).send('Something went wrong');
});


const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on https://cs360-ecommercewebsiteproject.onrender.com/:${PORT}`);
});
