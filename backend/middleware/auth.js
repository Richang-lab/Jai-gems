const { supabaseAdmin } = require('../config/supabase');

/**
 * Authentication middleware.
 * Verifies the JWT token from the Authorization header and attaches user info to req.user.
 */
async function authenticate(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];

        // Verify the token with Supabase
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
        if (error || !user) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        // Fetch user profile with role
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

        if (profileError || !profile) {
            return res.status(401).json({ error: 'User profile not found' });
        }

        if (!profile.is_active) {
            return res.status(403).json({ error: 'Account is deactivated' });
        }

        // Attach user info to request
        req.user = {
            id: user.id,
            email: user.email,
            full_name: profile.full_name,
            role: profile.role,
            phone: profile.phone,
            is_active: profile.is_active,
        };

        next();
    } catch (err) {
        console.error('Auth middleware error:', err);
        return res.status(500).json({ error: 'Authentication failed' });
    }
}

module.exports = { authenticate };
