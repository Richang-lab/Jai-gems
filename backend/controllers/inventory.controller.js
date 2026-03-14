const { supabaseAdmin } = require('../config/supabase');

async function ensureGlobalUnique(codeStr) {
    if (!codeStr) return;
    const code = codeStr.trim();
    if (!code) return;

    for (const table of ['finished_goods', 'casting_inventory', 'wax_inventory']) {
        const { data } = await supabaseAdmin.from(table).select('id').or(`product_code.ilike.${code},casting_product_code.ilike.${code}`).maybeSingle();
        if (data) throw new Error(`Code "${code}" already exists in ${table.replace('_', ' ')}`);
    }
}

/**
 * Handle Configuration Tables (Categories, Stone Shapes, Stone Materials)
 */
async function getConfig(req, res) {
    try {
        const [categoriesRes, shapesRes, materialsRes] = await Promise.all([
            supabaseAdmin.from('product_categories').select('*').order('name'),
            supabaseAdmin.from('stone_shapes').select('*').order('name'),
            supabaseAdmin.from('stone_materials').select('*').order('name')
        ]);

        if (categoriesRes.error) throw categoriesRes.error;
        if (shapesRes.error) throw shapesRes.error;
        if (materialsRes.error) throw materialsRes.error;

        res.json({
            categories: categoriesRes.data,
            stoneTypes: shapesRes.data,
            materials: materialsRes.data
        });
    } catch (err) {
        console.error('Config Fetch Error:', err);
        res.status(500).json({ error: 'Failed to fetch configurations' });
    }
}

async function addCategory(req, res) {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ error: 'Name is required' });

        const { data, error } = await supabaseAdmin.from('product_categories').insert({ name }).select().single();
        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Failed' });
    }
}

async function deleteCategory(req, res) {
    try {
        const { id } = req.params;
        const { error } = await supabaseAdmin.from('product_categories').delete().eq('id', id);
        if (error) throw error;
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed. Make sure it is not used in products.' });
    }
}

async function addStoneShape(req, res) {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ error: 'Name is required' });

        const { data, error } = await supabaseAdmin.from('stone_shapes').insert({ name }).select().single();
        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Failed' });
    }
}

async function deleteStoneShape(req, res) {
    try {
        const { id } = req.params;
        const { error } = await supabaseAdmin.from('stone_shapes').delete().eq('id', id);
        if (error) throw error;
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed' });
    }
}

async function addMaterial(req, res) {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ error: 'Name is required' });

        const { data, error } = await supabaseAdmin.from('stone_materials').insert({ name }).select().single();
        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Failed' });
    }
}

async function deleteMaterial(req, res) {
    try {
        const { id } = req.params;
        const { error } = await supabaseAdmin.from('stone_materials').delete().eq('id', id);
        if (error) throw error;
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed' });
    }
}

// -------------------------------------------------------------
// Finished Goods Inventory
// -------------------------------------------------------------
async function getFinishedGoods(req, res) {
    try {
        const { data, error } = await supabaseAdmin
            .from('finished_goods')
            .select(`
        *,
        category:category_id (name)
      `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json({ products: data });
    } catch (err) {
        console.error('Finished Goods fetch error:', err);
        res.status(500).json({ error: 'Failed to fetch finished goods' });
    }
}

async function createFinishedGood(req, res) {
    try {
        const payload = { ...req.body, created_by: req.user.id };

        // Ensure numbers and clean strings
        payload.qty = parseInt(payload.qty) || 0;
        payload.price = parseFloat(payload.price) || 0;
        payload.weight = parseFloat(payload.weight) || 0;

        if (payload.product_code) payload.product_code = payload.product_code.trim();
        if (payload.casting_product_code) payload.casting_product_code = payload.casting_product_code.trim();

        if (!payload.product_code) return res.status(400).json({ error: 'Product Code is required' });
        if (!payload.casting_product_code) payload.casting_product_code = payload.product_code;

        // Global uniqueness check
        await ensureGlobalUnique(payload.product_code);
        if (payload.casting_product_code !== payload.product_code) {
            await ensureGlobalUnique(payload.casting_product_code);
        }

        const { data, error } = await supabaseAdmin
            .from('finished_goods')
            .insert(payload)
            .select()
            .single();

        if (error) throw error;

        // Auto-create downstream in Casting and Wax (qty 0)
        const castPayload = {
            product_code: payload.product_code,
            casting_product_code: payload.casting_product_code,
            category_id: payload.category_id || null,
            image_url: payload.image_url || null,
            attribute_ids: payload.attribute_ids || [],
            qty: 0,
            total_weight: 0,
            std_weight: 0,
            created_by: payload.created_by
        };

        const waxPayload = {
            product_code: payload.product_code,
            casting_product_code: payload.casting_product_code,
            category_id: payload.category_id || null,
            image_url: payload.image_url || null,
            attribute_ids: payload.attribute_ids || [],
            qty: 0,
            total_weight: 0,
            std_weight: 0,
            created_by: payload.created_by
        };

        const createCast = await supabaseAdmin.from('casting_inventory').insert(castPayload);
        const createWax = await supabaseAdmin.from('wax_inventory').insert(waxPayload);
        if (createCast.error) console.error("Cast Sync Error:", createCast.error);
        if (createWax.error) console.error("Wax Sync Error:", createWax.error);

        res.status(201).json({ message: 'Product created and synced downward', product: data });
    } catch (err) {
        console.error('Create FG error:', err);
        res.status(500).json({ error: err.message || 'Failed to create product' });
    }
}

async function updateFinishedGood(req, res) {
    try {
        const { id } = req.params;
        const updates = { ...req.body, updated_at: new Date().toISOString() };

        // Format numbers and clean strings
        if (updates.qty !== undefined) updates.qty = parseInt(updates.qty) || 0;
        if (updates.price !== undefined) updates.price = parseFloat(updates.price) || 0;
        if (updates.weight !== undefined) updates.weight = parseFloat(updates.weight) || 0;
        if (updates.product_code) updates.product_code = updates.product_code.trim();
        if (updates.casting_product_code) updates.casting_product_code = updates.casting_product_code.trim();

        const { data: oldFg } = await supabaseAdmin.from('finished_goods').select('*').eq('id', id).single();
        if (!oldFg) return res.status(404).json({ error: 'Product not found' });

        // Check unique code if changed
        if (updates.product_code && updates.product_code.toLowerCase() !== (oldFg.product_code || '').toLowerCase()) {
            await ensureGlobalUnique(updates.product_code);
        }

        if (updates.casting_product_code && updates.casting_product_code.toLowerCase() !== (oldFg.casting_product_code || '').toLowerCase()) {
            await ensureGlobalUnique(updates.casting_product_code);
        }

        const { data, error } = await supabaseAdmin
            .from('finished_goods')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // Push metadata updates downstream to Casting and Wax
        // Match by old product_code because downstream might not have the new code yet
        if (oldFg.product_code) {
            const castUpdates = {
                product_code: updates.product_code !== undefined ? updates.product_code : oldFg.product_code,
                casting_product_code: updates.casting_product_code !== undefined ? updates.casting_product_code : oldFg.casting_product_code,
                category_id: updates.category_id !== undefined ? updates.category_id : oldFg.category_id,
                image_url: updates.image_url !== undefined ? updates.image_url : oldFg.image_url,
                attribute_ids: updates.attribute_ids !== undefined ? updates.attribute_ids : oldFg.attribute_ids
            };
            const waxUpdates = {
                product_code: updates.product_code !== undefined ? updates.product_code : oldFg.product_code,
                casting_product_code: updates.casting_product_code !== undefined ? updates.casting_product_code : oldFg.casting_product_code,
                category_id: updates.category_id !== undefined ? updates.category_id : oldFg.category_id,
                image_url: updates.image_url !== undefined ? updates.image_url : oldFg.image_url,
                attribute_ids: updates.attribute_ids !== undefined ? updates.attribute_ids : oldFg.attribute_ids
            };

            const updCast = supabaseAdmin.from('casting_inventory').update(castUpdates).eq('product_code', oldFg.product_code);
            const updWax = supabaseAdmin.from('wax_inventory').update(waxUpdates).eq('product_code', oldFg.product_code);
            await Promise.all([updCast, updWax]);
        }

        res.json({ message: 'Product updated and synced downward', product: data });
    } catch (err) {
        console.error('Update FG error:', err);
        res.status(500).json({ error: 'Failed to update product' });
    }
}

async function deleteFinishedGood(req, res) {
    try {
        const { id } = req.params;
        // We may want to unlink image in storage later
        const { error } = await supabaseAdmin.from('finished_goods').delete().eq('id', id);
        if (error) throw error;
        res.json({ message: 'Deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete' });
    }
}

// -------------------------------------------------------------
// Wax & Casting Inventory Logic
// -------------------------------------------------------------
/**
 * Processes a structural update to raw inventory (checking limits, applying 1% math on weight).
 * Action can be "add" or "subtract".
 * For tracking physical processing, when we subtract, we reduce weight by mathematically 1%.
 * i.e: taking 100 qty out removes exactly (100 * std_weight) * 0.99 from total_weight.
 * If user manually overrides total_weight, we use their input instead.
 */
async function adjustRawInventory(table, req, res) {
    try {
        let { id, product_code, casting_product_code, qty_change, std_weight, manual_total_weight, image_url, category_id, attribute_ids } = req.body;

        if (product_code) product_code = product_code.trim();
        if (casting_product_code) casting_product_code = casting_product_code.trim();

        let change = parseInt(qty_change) || 0;

        // Look up existing item
        let query = supabaseAdmin.from(table).select('*');
        if (id) {
            query = query.eq('id', id);
        } else if (product_code) {
            query = query.eq('product_code', product_code);
        } else if (casting_product_code) {
            query = query.eq('casting_product_code', casting_product_code);
        } else {
            return res.status(400).json({ error: 'Either ID, Product Code, or Casting Code is required.' });
        }

        const { data: existing, error: fetchErr } = await query.maybeSingle();

        let finalQty = 0;
        let finalTotalWeight = 0;
        let finalStdWeight = parseFloat(std_weight);

        if (existing) {
            // It exists -> update
            finalQty = existing.qty + change;
            if (finalQty < 0) return res.status(400).json({ error: 'Quantity cannot drop below zero' });

            // If updating Casting Code, check uniqueness
            if (casting_product_code && casting_product_code.toLowerCase() !== (existing.casting_product_code || '').toLowerCase()) {
                await ensureGlobalUnique(casting_product_code);
            }

            if (manual_total_weight !== undefined && manual_total_weight !== null && manual_total_weight !== "") {
                finalTotalWeight = parseFloat(manual_total_weight);
            } else {
                // Apply 1% reduction logic physically
                let calcWeightChange = Math.abs(change) * finalStdWeight;
                if (change < 0) {
                    // Subtracting: 1% deduction factor on weight removed
                    calcWeightChange = calcWeightChange * 0.99;
                    finalTotalWeight = existing.total_weight - calcWeightChange;
                } else {
                    // Adding simple
                    finalTotalWeight = existing.total_weight + calcWeightChange;
                }
            }

            const { data, error } = await supabaseAdmin
                .from(table)
                .update({
                    qty: finalQty,
                    total_weight: finalTotalWeight,
                    std_weight: finalStdWeight, // update std if given
                    casting_product_code: casting_product_code || existing.casting_product_code,
                    image_url: image_url !== undefined ? image_url : existing.image_url,
                    category_id: category_id === undefined ? existing.category_id : category_id,
                    attribute_ids: attribute_ids === undefined ? existing.attribute_ids : attribute_ids,
                    updated_at: new Date().toISOString()
                })
                .eq('id', existing.id)
                .select()
                .single();

            if (error) throw error;

            // Push metadata updates downstream from Casting -> Wax
            if (table === 'casting_inventory') {
                const waxUpdates = {
                    product_code: product_code || existing.product_code,
                    casting_product_code: casting_product_code || existing.casting_product_code,
                    category_id: category_id !== undefined ? category_id : existing.category_id,
                    image_url: image_url !== undefined ? image_url : existing.image_url,
                    attribute_ids: attribute_ids !== undefined ? attribute_ids : existing.attribute_ids
                };
                await supabaseAdmin.from('wax_inventory').update(waxUpdates).eq('product_code', existing.product_code);
            }

            return res.json({ message: 'Updated inventory', item: data });

        } else {
            // Adding new row entirely
            if (change < 0) return res.status(400).json({ error: 'Cannot start with negative quantity' });

            if (!casting_product_code) casting_product_code = product_code;

            await ensureGlobalUnique(product_code);
            if (casting_product_code !== product_code) {
                await ensureGlobalUnique(casting_product_code);
            }

            finalQty = change;
            if (manual_total_weight !== undefined && manual_total_weight !== null && manual_total_weight !== "") {
                finalTotalWeight = parseFloat(manual_total_weight);
            } else {
                // Full standard weight on pure addition usually
                finalTotalWeight = finalQty * finalStdWeight;
            }

            const { data, error } = await supabaseAdmin
                .from(table)
                .insert({
                    product_code,
                    casting_product_code,
                    qty: finalQty,
                    std_weight: finalStdWeight,
                    total_weight: finalTotalWeight,
                    image_url: image_url || null,
                    category_id: category_id || null,
                    attribute_ids: attribute_ids || [],
                    created_by: req.user.id
                })
                .select()
                .single();

            if (error) throw error;

            // Auto-create downstream in Wax (qty 0) if this is Casting
            if (table === 'casting_inventory') {
                const waxPayload = {
                    product_code,
                    casting_product_code,
                    qty: 0,
                    std_weight: 0,
                    total_weight: 0,
                    image_url: image_url || null,
                    category_id: category_id || null,
                    attribute_ids: attribute_ids || [],
                    created_by: req.user.id
                };
                const wr = await supabaseAdmin.from('wax_inventory').insert(waxPayload);
                if (wr.error) console.error("Cast->Wax Sync Error:", wr.error);
            }

            return res.status(201).json({ message: 'Inventory initialized', item: data });
        }

    } catch (err) {
        console.error(`Inventory adjustment error (${table}):`, err);
        res.status(400).json({ error: err.message || 'Operation failed' });
    }
}

async function getCastingAttributes(req, res) {
    try {
        const { data, error } = await supabaseAdmin.from('casting_attributes').select('*').order('name');
        if (error) throw error;
        res.json({ attributes: data });
    } catch (err) { res.status(500).json({ error: 'Failed to fetch attributes' }); }
}

async function addCastingAttribute(req, res) {
    try {
        const { name } = req.body;
        const { data, error } = await supabaseAdmin.from('casting_attributes').insert({ name }).select().single();
        if (error) throw error;
        res.json({ attribute: data });
    } catch (err) { res.status(500).json({ error: 'Failed to add attribute' }); }
}

async function deleteCastingAttribute(req, res) {
    try {
        const { id } = req.params;
        const { error } = await supabaseAdmin.from('casting_attributes').delete().eq('id', id);
        if (error) throw error;
        res.json({ message: 'Deleted' });
    } catch (err) { res.status(500).json({ error: 'Failed to delete' }); }
}


async function getWaxInventory(req, res) {
    try {
        const { data, error } = await supabaseAdmin
            .from('wax_inventory')
            .select(`
        *,
        category:category_id (name)
      `)
            .order('product_code');
        if (error) throw error;
        res.json({ inventory: data });
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
}

async function postWaxInventory(req, res) {
    return adjustRawInventory('wax_inventory', req, res);
}

async function getCastingInventory(req, res) {
    try {
        const { data, error } = await supabaseAdmin.from('casting_inventory').select('*').order('product_code');
        if (error) throw error;
        res.json({ inventory: data });
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
}

async function postCastingInventory(req, res) {
    return adjustRawInventory('casting_inventory', req, res);
}

async function deleteWaxInventory(req, res) {
    try {
        const { id } = req.params;
        const { error } = await supabaseAdmin.from('wax_inventory').delete().eq('id', id);
        if (error) throw error;
        res.json({ message: 'Deleted successfully' });
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
}

async function deleteCastingInventory(req, res) {
    try {
        const { id } = req.params;
        const { error } = await supabaseAdmin.from('casting_inventory').delete().eq('id', id);
        if (error) throw error;
        res.json({ message: 'Deleted successfully' });
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
}


async function checkDeleteDependencies(req, res) {
    try {
        const { module, id } = req.params;

        let table;
        if (module === 'fg') table = 'finished_goods';
        else if (module === 'casting') table = 'casting_inventory';
        else if (module === 'wax') table = 'wax_inventory';
        else throw new Error("Invalid module");

        const { data: sourceItem, error: fetchErr } = await supabaseAdmin.from(table).select('*').eq('id', id).single();
        if (fetchErr || !sourceItem) throw new Error("Item not found");

        const pCode = sourceItem.product_code;
        const cCode = sourceItem.casting_product_code;

        if (!pCode && !cCode) return res.json({ links: { fg: null, casting: null, wax: null } });

        const links = { fg: null, casting: null, wax: null };

        const searchOr = [];
        if (pCode) searchOr.push(`product_code.eq."${pCode}"`);
        if (cCode) searchOr.push(`casting_product_code.eq."${cCode}"`);
        const queryStr = searchOr.join(',');

        if (module === 'fg') links.fg = { id: sourceItem.id, code: pCode || cCode };
        else {
            const { data } = await supabaseAdmin.from('finished_goods').select('id, product_code').or(queryStr).limit(1);
            if (data && data.length > 0) links.fg = { id: data[0].id, code: data[0].product_code };
        }

        if (module === 'casting') links.casting = { id: sourceItem.id, code: pCode || cCode };
        else {
            const { data } = await supabaseAdmin.from('casting_inventory').select('id, product_code, casting_product_code').or(queryStr).limit(1);
            if (data && data.length > 0) links.casting = { id: data[0].id, code: data[0].casting_product_code || data[0].product_code };
        }

        if (module === 'wax') links.wax = { id: sourceItem.id, code: pCode || cCode };
        else {
            const { data } = await supabaseAdmin.from('wax_inventory').select('id, product_code, casting_product_code').or(queryStr).limit(1);
            if (data && data.length > 0) links.wax = { id: data[0].id, code: data[0].product_code || data[0].casting_product_code };
        }

        res.json({ links });
    } catch (err) {
        console.error("Check delete err:", err);
        res.status(500).json({ error: err.message });
    }
}

async function executeCrossDelete(req, res) {
    try {
        const targets = req.body; // Array of { table: '...', id: '...' }
        if (!targets || !Array.isArray(targets)) throw new Error("Invalid payload");

        const promises = targets.map(t => supabaseAdmin.from(t.table).delete().eq('id', t.id));
        await Promise.all(promises);

        res.json({ success: true, count: targets.length });
    } catch (err) {
        console.error("Cross delete err:", err);
        res.status(500).json({ error: err.message });
    }
}

module.exports = {
    // Config
    getConfig, addCategory, deleteCategory, addStoneShape, deleteStoneShape, addMaterial, deleteMaterial,

    // FG
    getFinishedGoods, createFinishedGood, updateFinishedGood, deleteFinishedGood,

    // Wax / Casting
    getWaxInventory, postWaxInventory, deleteWaxInventory,
    getCastingInventory, postCastingInventory, deleteCastingInventory,
    getCastingAttributes, addCastingAttribute, deleteCastingAttribute,

    // Cross-Module Deletion
    checkDeleteDependencies, executeCrossDelete
};
