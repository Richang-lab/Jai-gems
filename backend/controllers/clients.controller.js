const { supabaseAdmin } = require('../config/supabase');

/**
 * List all clients (Requires auth).
 * GET /api/clients
 */
async function listClients(req, res) {
    try {
        const { data, error } = await supabaseAdmin
            .from('clients')
            .select('*')
            .order('business_name', { ascending: true });

        if (error) throw error;

        res.json({ clients: data });
    } catch (err) {
        console.error('List clients error:', err);
        res.status(500).json({ error: 'Failed to fetch clients' });
    }
}

/**
 * Create a new client (Admin only).
 * POST /api/clients
 */
async function createClient(req, res) {
    try {
        const { business_name, phone_number, email, gst_number, address, state, city, pincode, nickname } = req.body;

        if (!business_name || !phone_number) {
            return res.status(400).json({ error: 'Business name and phone number are required' });
        }

        const { data, error } = await supabaseAdmin
            .from('clients')
            .insert({
                business_name,
                phone_number,
                email: email || null,
                gst_number: gst_number || null,
                address: address || null,
                state: state || null,
                city: city || null,
                pincode: pincode || null,
                nickname: nickname || null,
                created_by: req.user.id
            })
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({ message: 'Client created successfully', client: data });
    } catch (err) {
        console.error('Create client error:', err);
        res.status(500).json({ error: 'Failed to create client' });
    }
}

/**
 * Update a client (Admin only).
 * PUT /api/clients/:id
 */
async function updateClient(req, res) {
    try {
        const { id } = req.params;
        const { business_name, phone_number, email, gst_number, address, state, city, pincode, nickname } = req.body;

        const updates = { updated_at: new Date().toISOString() };
        if (business_name !== undefined) updates.business_name = business_name;
        if (phone_number !== undefined) updates.phone_number = phone_number;
        if (email !== undefined) updates.email = email || null;
        if (gst_number !== undefined) updates.gst_number = gst_number || null;
        if (address !== undefined) updates.address = address || null;
        if (state !== undefined) updates.state = state || null;
        if (city !== undefined) updates.city = city || null;
        if (pincode !== undefined) updates.pincode = pincode || null;
        if (nickname !== undefined) updates.nickname = nickname || null;

        if (Object.keys(updates).length === 1) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        const { data, error } = await supabaseAdmin
            .from('clients')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        if (!data) {
            return res.status(404).json({ error: 'Client not found' });
        }

        res.json({ message: 'Client updated successfully', client: data });
    } catch (err) {
        console.error('Update client error:', err);
        res.status(500).json({ error: 'Failed to update client' });
    }
}

/**
 * Delete a client (Admin only).
 * DELETE /api/clients/:id
 */
async function deleteClient(req, res) {
    try {
        const { id } = req.params;

        const { error, count } = await supabaseAdmin
            .from('clients')
            .delete({ count: 'exact' })
            .eq('id', id);

        if (error) throw error;
        if (count === 0) {
            return res.status(404).json({ error: 'Client not found' });
        }

        res.json({ message: 'Client deleted successfully' });
    } catch (err) {
        console.error('Delete client error:', err);
        res.status(500).json({ error: 'Failed to delete client. They might be attached to an existing order.' });
    }
}

module.exports = { listClients, createClient, updateClient, deleteClient };
