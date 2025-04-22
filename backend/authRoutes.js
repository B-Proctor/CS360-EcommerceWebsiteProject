const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('./dbConfig');
const { isAdmin } = require('./authRoles');

const router = express.Router();


const SALT_ROUNDS = 10;


// Login route
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    const sql = `SELECT * FROM users WHERE email = ?`;
    db.query(sql, [email], async (err, results) => {
        if (err) {
            console.error('Login error:', err);
            return res.status(500).send('Internal server error.');
        }

        if (results.length > 0) {
            const user = results[0];

            // Compare plaintext password with hashed password
            const match = await bcrypt.compare(password, user.password);

            if (match) {
                req.session.user = {
                    id: user.id,
                    email: user.email,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    isAdmin: isAdmin(user.email)
                };
                res.send({ message: 'Login successful', isAdmin: req.session.user.isAdmin });
            } else {
                res.status(401).send('Invalid credentials');
            }
        } else {
            res.status(401).send('Invalid credentials');
        }
    });
});


// Logout route
router.post('/logout', (req, res) => {
    if (!req.session.user) {
        return res.status(401).send('Not logged in');
    }

    req.session.destroy(err => {
        if (err) {
            console.error('Logout error:', err);
            return res.status(500).send('Failed to log out');
        }
        res.clearCookie('connect.sid'); 
        res.send('Logout successful');
    });
});

//Register Route
router.post('/register', async (req, res) => {
    const { firstName, lastName, email, password } = req.body;

    if (!firstName || !lastName || !email || !password) {
        return res.status(400).send('All fields are required');
    }

    const checkUserSql = `SELECT * FROM users WHERE email = ?`;
    db.query(checkUserSql, [email], async (err, result) => {
        if (err) {
            console.error('Error checking user:', err);
            return res.status(500).send('Internal server error.');
        }

        if (result.length > 0) {
            return res.status(400).send('Email already registered.');
        }

        try {
            const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

            const insertUserSql = `
                INSERT INTO users (first_name, last_name, email, password)
                VALUES (?, ?, ?, ?)
            `;
            db.query(insertUserSql, [firstName, lastName, email, hashedPassword], (err) => {
                if (err) {
                    console.error('Error registering user:', err);
                    return res.status(500).send('Failed to register user.');
                }
                res.send('User registered successfully');
            });
        } catch (err) {
            console.error('Error hashing password:', err);
            res.status(500).send('Failed to register user.');
        }
    });
});



// User Dashboard

router.get('/dashboard', (req, res) => {
    if (!req.session.user) {
        return res.status(401).send('Unauthorized');
    }

    res.json({
        id: req.session.user.id,
        email: req.session.user.email,
        firstName: req.session.user.firstName,
        lastName: req.session.user.lastName,
        isAdmin: isAdmin(req.session.user.email)
    });
});

// Product Management

router.get('/products', (req, res) => {
    const sql = `SELECT * FROM products`;
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching products:', err);
            return res.status(500).send('Failed to load products');
        }
        res.json(results);
    });
});

router.get('/products/:id', (req, res) => {
    const sql = `SELECT * FROM products WHERE id = ?`;
    db.query(sql, [req.params.id], (err, result) => {
        if (err) {
            console.error('Error fetching product:', err);
            return res.status(500).send('Failed to load product');
        }
        if (result.length === 0) {
            return res.status(404).send('Product not found');
        }
        res.json(result[0]);
    });
});

// Admin Panel (routes)

router.get('/admin', (req, res) => {
    if (!req.session.user || !isAdmin(req.session.user.email)) {
        return res.status(403).send('Access denied');
    }
    res.sendFile(path.join(__dirname, '../frontend/admin.html'));
});

router.post('/admin/add-product', (req, res) => {
    if (!req.session.user || !isAdmin(req.session.user.email)) {
        return res.status(403).send('Access denied');
    }

    const { name, price, quantity, image, description } = req.body;
    if (!name || !price || !quantity || !image || !description) {
        return res.status(400).send('All fields are required');
    }

    const sql = `INSERT INTO products (name, price, quantity, image, description) VALUES (?, ?, ?, ?, ?)`;
    db.query(sql, [name, price, quantity, image, description], (err) => {
        if (err) {
            console.error('Error adding product:', err);
            return res.status(500).send('Failed to add product');
        }
        res.send('Product added');
    });
});

router.put('/admin/edit-product/:id', (req, res) => {
    if (!req.session.user || !isAdmin(req.session.user.email)) {
        return res.status(403).send('Access denied');
    }

    const { name, price, quantity, image, description } = req.body;
    if (!name || !price || !quantity || !image || !description) {
        return res.status(400).send('All fields are required');
    }

    const sql = `UPDATE products SET name = ?, price = ?, quantity = ?, image = ?, description = ? WHERE id = ?`;
    db.query(sql, [name, price, quantity, image, description, req.params.id], (err) => {
        if (err) {
            console.error('Error updating product:', err);
            return res.status(500).send('Failed to update product');
        }
        res.send('Product updated');
    });
});

router.delete('/admin/delete-product/:id', (req, res) => {
    if (!req.session.user || !isAdmin(req.session.user.email)) {
        return res.status(403).send('Access denied');
    }

    const sql = `DELETE FROM products WHERE id = ?`;
    db.query(sql, [req.params.id], (err) => {
        if (err) {
            console.error('Error deleting product:', err);
            return res.status(500).send('Failed to delete product');
        }
        res.send('Product deleted');
    });
});

// Checkout Routes

router.post('/checkout', (req, res) => {
    const cart = req.body.cart;

    cart.forEach(item => {
        const sql = `UPDATE products 
                     SET quantity = quantity - ? 
                     WHERE id = ? AND quantity >= ?`;

        db.query(sql, [item.quantity, item.id, item.quantity], (err, result) => {
            if (err) {
                console.error('Error updating stock:', err);
                return res.status(500).send('Failed to update stock');
            }
            if (result.affectedRows === 0) {
                return res.status(400).send(`Not enough stock for ${item.name}`);
            }
        });
    });

    res.send('Checkout successful');
});

module.exports = router;
