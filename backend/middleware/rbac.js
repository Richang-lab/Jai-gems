const { canAccessModule, canPerformAction } = require('../utils/permissions');

/**
 * Middleware factory: requires a specific role.
 * Usage: requireRole('admin')
 */
function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        next();
    };
}

/**
 * Middleware factory: requires access to a specific module.
 * Usage: requireModule('inventory')
 */
function requireModule(module) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        if (!canAccessModule(req.user.role, module)) {
            return res.status(403).json({ error: 'You do not have access to this module' });
        }
        next();
    };
}

/**
 * Middleware factory: requires permission to perform a specific action.
 * Usage: requireAction('wax_work_status')
 */
function requireAction(action) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        if (!canPerformAction(req.user.role, action)) {
            return res.status(403).json({ error: 'You do not have permission to perform this action' });
        }
        next();
    };
}

module.exports = { requireRole, requireModule, requireAction };
