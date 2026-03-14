const { supabaseAdmin } = require('../config/supabase');
const { ROLES } = require('../utils/permissions');

/**
 * List all users (Admin only).
 * GET /api/users
 */
async function listUsers(req, res) {
    try {
        const { data, error } = await supabaseAdmin
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({ users: data });
    } catch (err) {
        console.error('List users error:', err);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
}

/**
 * Create a new user (Admin only).
 * POST /api/users
 */
async function createUser(req, res) {
    try {
        const { email, password, full_name, role, phone } = req.body;

        // Validation
        if (!email || !password || !full_name || !role) {
            return res.status(400).json({ error: 'Email, password, full name, and role are required' });
        }

        if (!ROLES[role]) {
            return res.status(400).json({ error: `Invalid role. Must be one of: ${Object.keys(ROLES).join(', ')}` });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        // Create auth user via Supabase Admin
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto-confirm email
        });

        if (authError) {
            if (authError.message.includes('already been registered')) {
                return res.status(409).json({ error: 'A user with this email already exists' });
            }
            throw authError;
        }

        // Create user profile in users table
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('users')
            .insert({
                id: authData.user.id,
                full_name,
                role,
                phone: phone || null,
                is_active: true,
            })
            .select()
            .single();

        if (profileError) {
            // Rollback: delete auth user if profile creation fails
            await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
            throw profileError;
        }

        res.status(201).json({
            message: 'User created successfully',
            user: {
                id: profile.id,
                email,
                full_name: profile.full_name,
                role: profile.role,
                phone: profile.phone,
                is_active: profile.is_active,
            },
        });
    } catch (err) {
        console.error('Create user error:', err);
        res.status(500).json({ error: 'Failed to create user' });
    }
}

/**
 * Update a user (Admin only).
 * PUT /api/users/:id
 */
async function updateUser(req, res) {
    try {
        const { id } = req.params;
        const { full_name, role, phone, is_active } = req.body;

        const updates = {};
        if (full_name !== undefined) updates.full_name = full_name;
        if (role !== undefined) {
            if (!ROLES[role]) {
                return res.status(400).json({ error: `Invalid role. Must be one of: ${Object.keys(ROLES).join(', ')}` });
            }
            updates.role = role;
        }
        if (phone !== undefined) updates.phone = phone;
        if (is_active !== undefined) updates.is_active = is_active;
        updates.updated_at = new Date().toISOString();

        if (Object.keys(updates).length === 1) { // only updated_at
            return res.status(400).json({ error: 'No fields to update' });
        }

        const { data, error } = await supabaseAdmin
            .from('users')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        if (!data) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'User updated successfully', user: data });
    } catch (err) {
        console.error('Update user error:', err);
        res.status(500).json({ error: 'Failed to update user' });
    }
}

/**
 * Delete (deactivate) a user (Admin only).
 * DELETE /api/users/:id
 */
async function deleteUser(req, res) {
    try {
        const { id } = req.params;

        // Prevent admin from deactivating themselves
        if (id === req.user.id) {
            return res.status(400).json({ error: 'You cannot deactivate your own account' });
        }

        const { data, error } = await supabaseAdmin
            .from('users')
            .update({ is_active: false, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        if (!data) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'User deactivated successfully' });
    } catch (err) {
        console.error('Delete user error:', err);
        res.status(500).json({ error: 'Failed to deactivate user' });
    }
}

/**
 * Get available roles.
 * GET /api/users/roles
 */
function getRoles(req, res) {
    const roles = Object.entries(ROLES).map(([key, val]) => ({
        value: key,
        label: val.label,
    }));
    res.json({ roles });
}

module.exports = { listUsers, createUser, updateUser, deleteUser, getRoles };
