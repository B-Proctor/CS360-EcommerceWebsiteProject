function requireAdmin(req, res, next) {
    if (req.session.user && req.session.user.isAdmin) {
        next();
    } else {
        res.status(403).send('Forbidden Access : Error 403.');
    }
}

module.exports = requireAdmin;
