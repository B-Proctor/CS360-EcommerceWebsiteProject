const express = require('express');
const bcrypt = require('bcrypt');
const session = require('express-session');
const db = require('./dbConfig');

const router = express.Router();

router.use(session({
    secret: 'secure_secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// REGISTER
router.post('/register', (req, res) => {
    const { firstName, lastName, email, password } = req.body;

    const hashedPassword = bcrypt.hashSync(password, 10);
    const sql = `INSERT INTO users (first_name, last_name, email, password) VALUES (?, ?, ?, ?)`;

    db.query(sql, [firstName, lastName, email, hashedPassword], (err) => {
        if (err) return res.status(500).send('Error registering user.');
        res.send('Registration successful!');
    });
});

// LOGIN
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    const sql = `SELECT * FROM users WHERE email = ?`;
    db.query(sql, [email], (err, results) => {
        if (err || results.length === 0) return res.status(401).send('User not found.');

        const user = results[0];
        if (bcrypt.compareSync(password, user.password)) {
            req.session.user = { id: user.id, email: user.email };
            res.send('Login successful!');
        } else {
            res.status(401).send('Invalid credentials.');
        }
    });
});

// LOGOUT
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.send('Logged out successfully.');
});

// PROTECTED ROUTE
router.get('/dashboard', (req, res) => {
    if (!req.session.user) {
        return res.status(403).send('Access denied. Please log in.');
    }
    res.send(`Welcome ${req.session.user.email}!`);
});

module.exports = router;
