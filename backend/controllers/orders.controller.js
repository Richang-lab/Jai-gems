const { supabaseAdmin } = require('../config/supabase');

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Generate auto-incrementing order ID for the day, e.g. FGO-250309-0001 */
async function generateOrderId(type) {
    const prefix = type === 'finished_good' ? 'FGO' : 'CSO';
    const today = new Date();
    const yy = String(today.getFullYear()).slice(2);
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const datePart = `${yy}${mm}${dd}`;
    const pattern = `${prefix}-${datePart}-%`;

    const { data } = await supabaseAdmin
        .from('orders')
        .select('order_id')
        .ilike('order_id', pattern)
        .order('order_id', { ascending: false })
        .limit(1);

    let seq = 1;
    if (data && data.length > 0) {
        const last = data[0].order_id;
        const lastSeq = parseInt(last.split('-').pop(), 10);
        if (!isNaN(lastSeq)) seq = lastSeq + 1;
    }
    return `${prefix}-${datePart}-${String(seq).padStart(4, '0')}`;
}

/** Recalculate estimated_value and save to orders header */
async function recalcOrderValue(orderId) {
    const { data: items } = await supabaseAdmin
        .from('order_items')
        .select('qty, unit_price')
        .eq('order_id', orderId);

    const total = (items || []).reduce((s, i) => s + (Number(i.qty) * Number(i.unit_price)), 0);
    await supabaseAdmin.from('orders').update({ estimated_value: total, updated_at: new Date() }).eq('id', orderId);
    return total;
}

// ── App Settings (Casting Rate) ───────────────────────────────────────────────

async function getSettings(req, res) {
    try {
        const { data, error } = await supabaseAdmin.from('app_settings').select('*');
        if (error) throw error;
        // Return as simple key-value object
        const settings = {};
        (data || []).forEach(r => { settings[r.key] = r.value; });
        res.json({ settings });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
}

async function updateSetting(req, res) {
    try {
        const { key, value } = req.body;
        if (!key) return res.status(400).json({ error: 'key is required' });
        const { error } = await supabaseAdmin
            .from('app_settings')
            .upsert({ key, value: String(value) }, { onConflict: 'key' });
        if (error) throw error;
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update setting' });
    }
}

// ── Orders CRUD ───────────────────────────────────────────────────────────────

async function getOrders(req, res) {
    try {
        const { data, error } = await supabaseAdmin
            .from('orders')
            .select(`
                *,
                client:client_id (id, business_name, phone_number),
                order_items (id, status)
            `)
            .order('created_at', { ascending: false });
        if (error) throw error;
        res.json({ orders: data });
    } catch (err) {
        console.error('getOrders error:', err);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
}

async function getOrder(req, res) {
    try {
        const { id } = req.params;
        const { data, error } = await supabaseAdmin
            .from('orders')
            .select(`
                *,
                client:client_id (id, business_name, phone_number),
                order_items (*)
            `)
            .eq('id', id)
            .single();
        if (error) throw error;
        res.json({ order: data });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch order' });
    }
}

async function createOrder(req, res) {
    try {
        const { order_type, client_id, notes, items } = req.body;

        if (!order_type) return res.status(400).json({ error: 'order_type is required' });
        if (!items || items.length === 0) return res.status(400).json({ error: 'At least one item is required' });

        const order_id = await generateOrderId(order_type);

        // Fetch casting_rate for casting orders
        let castingRate = 0;
        if (order_type === 'casting') {
            const { data: rateSetting } = await supabaseAdmin
                .from('app_settings')
                .select('value')
                .eq('key', 'casting_rate')
                .single();
            castingRate = rateSetting ? parseFloat(rateSetting.value) : 0;
        }

        // Auto-determine initial status from inventory stock levels
        async function autoStatus(productCode, orderType) {
            if (orderType === 'finished_good') {
                const { data } = await supabaseAdmin
                    .from('finished_goods')
                    .select('qty')
                    .eq('product_code', productCode)
                    .maybeSingle();
                if (data && data.qty > 0) return 'In Stock';
            } else {
                // For casting: check wax then casting
                const { data: wax } = await supabaseAdmin
                    .from('wax_inventory')
                    .select('qty')
                    .eq('product_code', productCode)
                    .maybeSingle();
                if (wax && wax.qty > 0) return 'Wax Inprogress';

                const { data: cast } = await supabaseAdmin
                    .from('casting_inventory')
                    .select('qty')
                    .or(`product_code.eq.${productCode},casting_product_code.eq.${productCode}`)
                    .maybeSingle();
                if (cast && cast.qty > 0) return 'Casting';
            }
            return 'Open';
        }

        // Build items with auto-status and unit price
        const enrichedItems = await Promise.all(items.map(async (item) => {
            let unitPrice = 0;

            if (order_type === 'finished_good') {
                unitPrice = item.unit_price || 0;
            } else {
                // Casting: rate is per KG. Weight is input in grams, so convert to KG
                const weight = item.qty_type === 'weight' ? Number(item.qty) : 0;
                unitPrice = (weight / 1000) * castingRate;
            }

            const status = await autoStatus(item.product_code, order_type);

            return {
                product_code: item.product_code,
                image_url: item.image_url || null,
                qty: item.qty,
                qty_type: item.qty_type || 'pairs',
                unit_price: unitPrice,
                status,
                is_urgent: item.is_urgent ? true : false
            };
        }));

        const estimated_value = enrichedItems.reduce((s, i) => s + (Number(i.qty) * Number(i.unit_price)), 0);

        // Insert order header
        const { data: order, error: orderErr } = await supabaseAdmin
            .from('orders')
            .insert({
                order_id,
                order_type,
                client_id: client_id || null,
                notes: notes || null,
                estimated_value,
                created_by: req.user.id,
            })
            .select()
            .single();
        if (orderErr) throw orderErr;

        // Insert line items
        const itemsToInsert = enrichedItems.map(i => ({ ...i, order_id: order.id }));
        const { error: itemsErr } = await supabaseAdmin.from('order_items').insert(itemsToInsert);
        if (itemsErr) throw itemsErr;

        res.status(201).json({ order, order_id });
    } catch (err) {
        console.error('createOrder error:', err);
        res.status(400).json({ error: err.message || 'Failed to create order' });
    }
}

async function deleteOrder(req, res) {
    try {
        const { id } = req.params;
        const { error } = await supabaseAdmin.from('orders').delete().eq('id', id);
        if (error) throw error;
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete order' });
    }
}

async function updateOrderItem(req, res) {
    try {
        const { itemId } = req.params;
        const { status, qty, unit_price } = req.body;

        const updates = { updated_at: new Date() };
        if (status !== undefined) updates.status = status;
        if (qty !== undefined) updates.qty = qty;
        if (unit_price !== undefined) updates.unit_price = unit_price;

        const { data: item, error } = await supabaseAdmin
            .from('order_items')
            .update(updates)
            .eq('id', itemId)
            .select()
            .single();
        if (error) throw error;

        // Recalculate order total
        await recalcOrderValue(item.order_id);

        res.json({ item });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update order item' });
    }
}

module.exports = {
    getSettings,
    updateSetting,
    getOrders,
    getOrder,
    createOrder,
    deleteOrder,
    updateOrderItem,
};
