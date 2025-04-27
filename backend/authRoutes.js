// authRoutes.js
const express = require('express');
const router = express.Router();
const db = require('./dbConfig');
const bcrypt = require('bcryptjs');
const { isAdmin } = require('./authRoles');
const requireAdmin = require('./middleware/requireAdmin');

// === User Registration ===
router.post('/register', async (req, res) => {
    const { firstName, lastName, email, password } = req.body;
    if (!firstName || !lastName || !email || !password) {
        return res.status(400).send('All fields are required.');
    }
    try {
        const hashed = await bcrypt.hash(password, 10);
        const sql = 'INSERT INTO users (first_name, last_name, email, password) VALUES (?, ?, ?, ?)';
        db.query(sql, [firstName, lastName, email, hashed], err => {
            if (err) {
                console.error(err);
                return res.status(500).send('Error registering user.');
            }
            res.send('Registration successful. Please log in.');
        });
    } catch (e) {
        console.error(e);
        res.status(500).send('Server error.');
    }
});

// === User Login ===
router.post('/login', (req, res) => {
    const { email, password } = req.body;
    const sql = 'SELECT * FROM users WHERE email = ?';
    db.query(sql, [email], async (err, results) => {
        if (err || results.length === 0) {
            return res.status(400).send('Invalid email or password.');
        }
        const user = results[0];
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(400).send('Invalid email or password.');
        }
        req.session.user = {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            isAdmin: user.role === 'admin'
        };

        res.send('Login successful.');
    });
});

// === User Logout ===
router.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error(err);
            return res.status(500).send('Logout failed.');
        }
        res.send('Logout successful.');
    });
});

// === Dashboard Check ===
router.get('/dashboard', (req, res) => {
    if (!req.session.user) return res.status(401).send('Not logged in.');
    res.json(req.session.user);
});

// === Products Listing ===
router.get('/api/products', (req, res) => {
    const sql = 'SELECT * FROM products';
    db.query(sql, (err, results) => {
        if (err) return res.status(500).send('Server error.');
        res.json(results);
    });
});


// === Admin: Add Product ===
router.post('/admin/add-product', requireAdmin, (req, res) => {
    const { name, price, description, quantity, image } = req.body;
    const sql = `
    INSERT INTO products (name, price, description, quantity, image)
    VALUES (?, ?, ?, ?, ?)
  `;
    db.query(sql, [name, price, description, quantity, image], err => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error adding product.');
        }
        res.send('Product added.');
    });
});

// === Admin: Edit Product ===
router.put('/admin/edit-product/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    const { name, price, description, quantity, image } = req.body;
    const sql = `
    UPDATE products
    SET name = ?, price = ?, description = ?, quantity = ?, image = ?
    WHERE id = ?
  `;
    db.query(sql, [name, price, description, quantity, image, id], err => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error editing product.');
        }
        res.send('Product updated.');
    });
});

// === Admin: Delete Product ===
router.delete('/admin/delete-product/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM products WHERE id = ?', [id], err => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error deleting product.');
        }
        res.send('Product deleted.');
    });
});

// === Checkout / Place Order ===
router.post('/api/checkout', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Unauthorized: Please log in.' });
    }
    const { cart } = req.body;
    if (!Array.isArray(cart) || cart.length === 0) {
        return res.status(400).json({ error: 'Cart is empty.' });
    }
    const userId = req.session.user.id;
    const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const insertOrder = 'INSERT INTO orders (user_id, total_price, status) VALUES (?, ?, "Pending")';
    db.query(insertOrder, [userId, total], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Server error' });
        }
        const orderId = result.insertId;
        const items = cart.map(i => [orderId, i.id, i.quantity, i.price]);
        db.query(
            'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ?',
            [items],
            err => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: 'Server error' });
                }
                Promise.all(
                    cart.map(i =>
                        new Promise((resl, rej) => {
                            db.query(
                                'UPDATE products SET quantity = quantity - ? WHERE id = ? AND quantity >= ?',
                                [i.quantity, i.id, i.quantity],
                                (e, r) => (e ? rej(e) : resl(r))
                            );
                        })
                    )
                )
                    .then(() => res.json({ message: 'Order placed successfully.' }))
                    .catch(e => {
                        console.error(e);
                        res.status(500).json({ error: 'Server error' });
                    });
            }
        );
    });
});

// === User’s Orders ===
router.get('/api/orders/user/:userId', (req, res) => {
    const { userId } = req.params;
    const sql = `
    SELECT id, total_price, status, created_at
    FROM orders
    WHERE user_id = ?
    ORDER BY created_at DESC
  `;
    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Server error' });
        }
        res.json(results);
    });
});

// === Admin: All Orders ===
router.get('/api/orders', requireAdmin, (req, res) => {
    const sql = `
    SELECT id, user_id, total_price, status, created_at
    FROM orders
    ORDER BY created_at DESC
  `;
    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Server error' });
        }
        res.json(results);
    });
});

// === Admin: Update Order Status ===
router.patch('/api/orders/:orderId', requireAdmin, (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body;
    db.query('UPDATE orders SET status = ? WHERE id = ?', [status, orderId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Server error' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }
        res.json({ message: 'Order status updated.' });
    });
});

// === Reviews: Stats ===
router.get('/api/product-reviews/:productId', (req, res) => {
    const { productId } = req.params;
    const sql = `
    SELECT AVG(rating) AS avg_rating, COUNT(*) AS total_reviews
    FROM reviews
    WHERE product_id = ?
  `;
    db.query(sql, [productId], (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Server error' });
        }
        const { avg_rating, total_reviews } = rows[0];
        res.json({
            avg_rating: avg_rating ? parseFloat(avg_rating).toFixed(1) : 5.0,
            total_reviews
        });
    });
});

// === Reviews: Can Review? ===
router.get('/api/can-review/:productId', (req, res) => {
    if (!req.session.user) return res.status(401).json({ can_review: false });
    const userId = req.session.user.id;
    const { productId } = req.params;
    const sql = `
    SELECT oi.id
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    WHERE o.user_id = ? AND oi.product_id = ? AND o.status = 'Shipped'
    LIMIT 1
  `;
    db.query(sql, [userId, productId], (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ can_review: false });
        }
        res.json({ can_review: rows.length > 0 });
    });
});

// === Submit Review ===
router.post('/api/submit-review', (req, res) => {
    if (!req.session.user) return res.status(401).send('Unauthorized');
    const userId = req.session.user.id;
    const { productId, rating } = req.body;
    const sql = 'INSERT INTO reviews (user_id, product_id, rating) VALUES (?, ?, ?)';
    db.query(sql, [userId, productId, rating], err => {
        if (err) {
            console.error(err);
            return res.status(500).send('Server error');
        }
        res.send('Review submitted');
    });
});
// === Get Products for an Order (for leaving reviews) ===
router.get('/api/orders/details/:orderId', (req, res) => {
    const { orderId } = req.params;
    const sql = `
        SELECT p.id, p.name, oi.price
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
    `;
    db.query(sql, [orderId], (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Server error.' });
        }
        res.json(rows);
    });
});


// === Admin: User Management ===
router.get('/api/users', requireAdmin, (req, res) => {
    db.query('SELECT id, first_name, last_name, email, role FROM users', (err, rows) => {

        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Server error' });
        }
        res.json(rows);
    });
});
// === Admin: Set User Role ===
router.patch('/admin/set-role/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    const { role } = req.body;

    if (!['buyer', 'admin'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role.' });
    }

    // Prevent an admin from demoting themselves
    if (req.session.user.id == id) {
        return res.status(403).json({ error: 'Cannot change your own role.' });
    }

    db.query('UPDATE users SET role = ? WHERE id = ?', [role, id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Server error' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ message: 'Role updated successfully' });
    });
});
router.get('/api/admin-metrics', requireAdmin, async (req, res) => {
    try {
        const queries = {
            total_users: 'SELECT COUNT(*) AS total FROM users',
            total_products: 'SELECT COUNT(*) AS total FROM products',
            total_orders: 'SELECT COUNT(*) AS total FROM orders',
            total_revenue: 'SELECT IFNULL(SUM(total_price), 0) AS revenue FROM orders WHERE status = "Shipped"'
        };

        const results = {};
        for (const [key, sql] of Object.entries(queries)) {
            const [rows] = await db.promise().query(sql);
            results[key] = rows[0].total || rows[0].revenue || 0;
        }

        res.json(results);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to load metrics.' });
    }
});
router.delete('/admin/delete-user/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM users WHERE id = ?', [id], err => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error deleting user.');
        }
        res.send('User deleted.');
    });
});

module.exports = router;
