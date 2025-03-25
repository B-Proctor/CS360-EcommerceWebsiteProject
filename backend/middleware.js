const { isAdmin } = require('./authRoles');

function requireAdmin(req, res, next) {
    if (!req.session.user || !isAdmin(req.session.user.email)) {
        return res.status(403).send('Access denied');
    }
    next();
}

module.exports = { requireAdmin };
