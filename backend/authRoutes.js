const express = require('express');
const bcrypt = require('bcrypt');
const session = require('express-session');
const cors = require('cors');
const db = require('./dbConfig');

const router = express.Router();

router.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));

router.use(session({
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

// REGISTER
router.post('/register', (req, res) => {
    const { firstName, lastName, email, password } = req.body;

    console.log("Register request received:", req.body);

    if (!firstName || !lastName || !email || !password) {
        return res.status(400).send("All fields are required.");
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const sql = `INSERT INTO users (first_name, last_name, email, password) VALUES (?, ?, ?, ?)`;

    db.query(sql, [firstName, lastName, email, hashedPassword], (err, result) => {
        if (err) {
            console.error("Registration error:", err);
            return res.status(500).send(`Error registering user: ${err.sqlMessage}`);
        }

        req.session.user = { id: result.insertId, email };
        console.log("User registered and session created for:", email);
        res.send('Registration successful!');
    });
});

// LOGIN
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    console.log("Login request received for:", email);

    const sql = `SELECT * FROM users WHERE email = ?`;
    db.query(sql, [email], (err, results) => {
        if (err) {
            console.error("Login query error:", err);
            return res.status(500).send("Server error.");
        }
        if (results.length === 0) {
            console.log("No user found with email:", email);
            return res.status(401).send('User not found.');
        }

        const user = results[0];
        console.log("User record found:", user);

        if (bcrypt.compareSync(password, user.password)) {
            req.session.user = { id: user.id, email: user.email };

            console.log("Session created for user:", req.session.user);
            res.status(200).send('Login successful!');
        } else {
            console.log("Password mismatch for user:", email);
            res.status(401).send('Invalid credentials.');
        }
    });
});

// LOGOUT
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.send('Logged out successfully.');
});

// DASHBOARD (Check Login Status)
router.get('/dashboard', (req, res) => {
    console.log("Session data:", req.session);

    if (!req.session.user) {
        return res.status(403).send('Access denied. Please log in.');
    }

    res.json({
        id: req.session.user.id,
        email: req.session.user.email
    });
});

module.exports = router;
