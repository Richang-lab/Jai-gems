const { supabase, supabaseAdmin } = require('../config/supabase');
const { getNavItemsForRole } = require('../utils/permissions');

/**
 * Login with email and password.
 * POST /api/auth/login
 */
async function login(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Sign in with Supabase Auth
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Fetch user profile with role
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single();

        if (profileError || !profile) {
            // If user exists in auth but not in users table, it means profile hasn't been set up
            return res.status(403).json({ error: 'User profile not configured. Contact admin.' });
        }

        if (!profile.is_active) {
            return res.status(403).json({ error: 'Account is deactivated. Contact admin.' });
        }

        // Get navigation items for user's role
        const navItems = getNavItemsForRole(profile.role);

        res.json({
            user: {
                id: data.user.id,
                email: data.user.email,
                full_name: profile.full_name,
                role: profile.role,
                phone: profile.phone,
            },
            navItems,
            token: data.session.access_token,
            refreshToken: data.session.refresh_token,
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Login failed' });
    }
}

/**
 * Get current user info.
 * GET /api/auth/me
 */
async function getMe(req, res) {
    try {
        const navItems = getNavItemsForRole(req.user.role);
        res.json({
            user: req.user,
            navItems,
        });
    } catch (err) {
        console.error('GetMe error:', err);
        res.status(500).json({ error: 'Failed to get user info' });
    }
}

/**
 * Refresh user token.
 * POST /api/auth/refresh
 */
async function refreshToken(req, res) {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ error: 'Refresh token required' });
        }

        const { data, error } = await supabase.auth.refreshSession({
            refresh_token: refreshToken,
        });

        if (error) {
            return res.status(401).json({ error: 'Invalid refresh token' });
        }

        res.json({
            token: data.session.access_token,
            refreshToken: data.session.refresh_token,
        });
    } catch (err) {
        console.error('Refresh error:', err);
        res.status(500).json({ error: 'Token refresh failed' });
    }
}

module.exports = { login, getMe, refreshToken };
