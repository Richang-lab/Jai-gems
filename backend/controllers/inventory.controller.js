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

const PREFIX_MAP = {
    attributes: {
        'Single Stone': 'SS',
        'Multi-Stone': 'MS',
        'Plain': 'PL',
        'Figure': 'FIG'
    },
    categories: {
        'Earcuff': 'EC',
        'Jhumka': 'JH',
        'Pendent': 'PD'
    }
};

async function generateCastingCode(payload) {
    let prefix = 'Temp';

    // Check attributes first
    if (payload.attribute_names && Array.isArray(payload.attribute_names)) {
        for (const [name, code] of Object.entries(PREFIX_MAP.attributes)) {
            if (payload.attribute_names.some(an => an && an.toLowerCase().trim() === name.toLowerCase())) {
                prefix = code;
                break;
            }
        }
    } else if (payload.attribute_ids && Array.isArray(payload.attribute_ids)) {
        const { data: attrs } = await supabaseAdmin.from('casting_attributes').select('name').in('id', payload.attribute_ids);
        if (attrs) {
            for (const [name, code] of Object.entries(PREFIX_MAP.attributes)) {
                if (attrs.some(a => a.name && a.name.toLowerCase().trim() === name.toLowerCase())) {
                    prefix = code;
                    break;
                }
            }
        }
    }

    // Check category if still Temp
    if (prefix === 'Temp' && payload.category_id) {
        const { data: cat } = await supabaseAdmin.from('product_categories').select('name').eq('id', payload.category_id).single();
        if (cat) {
            for (const [name, code] of Object.entries(PREFIX_MAP.categories)) {
                if (cat.name && cat.name.toLowerCase().trim() === name.toLowerCase()) {
                    prefix = code;
                    break;
                }
            }
        }
    } else if (prefix === 'Temp' && payload.category_name) {
        for (const [name, code] of Object.entries(PREFIX_MAP.categories)) {
            if (payload.category_name.toLowerCase().trim() === name.toLowerCase()) {
                prefix = code;
                break;
            }
        }
    }

    const basePrefix = `CST-${prefix}-`;
    const { data: existing } = await supabaseAdmin
        .from('casting_inventory')
        .select('casting_product_code')
        .ilike('casting_product_code', `${basePrefix}%`)
        .order('casting_product_code', { ascending: false })
        .limit(1);

    let nextNum = 1;
    if (existing && existing.length > 0) {
        const parts = existing[0].casting_product_code.split('-');
        const lastNum = parseInt(parts[parts.length - 1]);
        if (!isNaN(lastNum)) nextNum = lastNum + 1;
    }

    return `${basePrefix}${String(nextNum).padStart(3, '0')}`;
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
        payload.total_item_sold = parseInt(payload.total_item_sold) || 0;

        if (payload.product_code) payload.product_code = payload.product_code.trim();
        if (payload.casting_product_code) payload.casting_product_code = payload.casting_product_code.trim();

        if (!payload.product_code) return res.status(400).json({ error: 'Product Code is required' });
        if (!payload.casting_product_code) {
            payload.casting_product_code = await generateCastingCode(payload);
        }

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
        if (updates.total_item_sold !== undefined) updates.total_item_sold = parseInt(updates.total_item_sold) || 0;
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

// -------------------------------------------------------------
// Bulk Upload Helpers
// -------------------------------------------------------------
async function bulkUploadFinishedGoods(req, res) {
    try {
        const { items } = req.body;
        if (!Array.isArray(items)) return res.status(400).json({ error: 'Items array is required' });

        let added = 0; let updated = 0; let failed = 0; let errors = [];

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            try {
                if (item.product_code) item.product_code = String(item.product_code).trim();
                if (item.casting_product_code) item.casting_product_code = String(item.casting_product_code).trim();

                if (!item.product_code) throw new Error("Product Code is required");

                // Map category name to ID if provided
                if (item.category_name && !item.category_id) {
                    const { data: cat } = await supabaseAdmin.from('product_categories').select('id').ilike('name', item.category_name.trim()).maybeSingle();
                    if (cat) item.category_id = cat.id;
                }

                if (!item.casting_product_code) {
                    item.casting_product_code = await generateCastingCode(item);
                }

                const { data: existing } = await supabaseAdmin.from('finished_goods')
                    .select('id').eq('product_code', item.product_code).maybeSingle();

                if (existing) {
                    const updates = { updated_at: new Date().toISOString() };
                    if (item.qty !== undefined && !isNaN(item.qty)) updates.qty = parseInt(item.qty);
                    if (item.price !== undefined && !isNaN(item.price)) updates.price = parseFloat(item.price);
                    if (item.weight !== undefined && !isNaN(item.weight)) updates.weight = parseFloat(item.weight);
                    if (item.total_item_sold !== undefined && !isNaN(item.total_item_sold)) updates.total_item_sold = parseInt(item.total_item_sold);
                    if (item.category_id) updates.category_id = item.category_id;
                    if (item.casting_product_code) updates.casting_product_code = item.casting_product_code;

                    const { error: updErr } = await supabaseAdmin.from('finished_goods')
                        .update(updates)
                        .eq('id', existing.id);
                    if (updErr) throw updErr;
                    updated++;
                } else {
                    await ensureGlobalUnique(item.product_code);
                    await ensureGlobalUnique(item.casting_product_code);

                    const payload = {
                        ...item,
                        qty: item.qty ? parseInt(item.qty) : 0,
                        price: item.price ? parseFloat(item.price) : 0,
                        weight: item.weight ? parseFloat(item.weight) : 0,
                        total_item_sold: item.total_item_sold ? parseInt(item.total_item_sold) : 0,
                        created_by: req.user.id
                    };
                    // Remove wax-only fields from FG payload
                    delete payload.wax_std_weight;
                    delete payload.wax_total_weight;
                    delete payload.category_name;
                    delete payload.attribute_names;

                    const { error: insErr } = await supabaseAdmin.from('finished_goods').insert(payload);
                    if (insErr) throw insErr;
                    added++;
                }

                // Downward Sync: Casting and Wax
                // Calculate Wax Qty = floor(total_weight / std_weight)
                const waxStdWt = parseFloat(item.wax_std_weight) || 0;
                const waxTotalWt = parseFloat(item.wax_total_weight) || 0;
                const waxQty = (waxStdWt > 0) ? Math.floor(waxTotalWt / waxStdWt) : 0;

                const baseSync = {
                    product_code: item.product_code,
                    casting_product_code: item.casting_product_code,
                    category_id: item.category_id || null,
                    updated_at: new Date().toISOString()
                };

                // Upsert Casting Placeholder
                const { data: exCast } = await supabaseAdmin.from('casting_inventory').select('id').eq('product_code', item.product_code).maybeSingle();
                if (exCast) {
                    await supabaseAdmin.from('casting_inventory').update({ ...baseSync }).eq('id', exCast.id);
                } else {
                    await supabaseAdmin.from('casting_inventory').insert({ ...baseSync, qty: 0, total_weight: 0, std_weight: 0, created_by: req.user.id });
                }

                // Upsert Wax from CSV Data
                const { data: exWax } = await supabaseAdmin.from('wax_inventory').select('id').eq('product_code', item.product_code).maybeSingle();
                const waxPayload = {
                    ...baseSync,
                    qty: waxQty,
                    std_weight: waxStdWt,
                    total_weight: waxTotalWt
                };
                if (exWax) {
                    await supabaseAdmin.from('wax_inventory').update(waxPayload).eq('id', exWax.id);
                } else {
                    await supabaseAdmin.from('wax_inventory').insert({ ...waxPayload, created_by: req.user.id });
                }
            } catch (err) {
                failed++;
                errors.push(`Row ${i + 2} (${item.product_code || 'unknown'}): ${err.message}`);
            }
        }
        res.json({ message: `Processed ${items.length} items. Added: ${added}, Updated: ${updated}, Failed: ${failed}`, added, updated, failed, errors });
    } catch (err) {
        res.status(500).json({ error: err.message || 'Bulk upload failed' });
    }
}

async function bulkUploadCasting(req, res) {
    try {
        const { items } = req.body;
        if (!Array.isArray(items)) return res.status(400).json({ error: 'Items array is required' });

        let added = 0; let updated = 0; let failed = 0; let errors = [];

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            try {
                if (item.casting_product_code) item.casting_product_code = String(item.casting_product_code).trim();
                // some CSVs might use "product_code" as header
                if (!item.casting_product_code && item.product_code) item.casting_product_code = String(item.product_code).trim();
                if (!item.casting_product_code) throw new Error("Casting Product Code is required");

                const { data: existing } = await supabaseAdmin.from('casting_inventory')
                    .select('id, qty, std_weight').eq('casting_product_code', item.casting_product_code).maybeSingle();

                if (existing) {
                    const updates = { updated_at: new Date().toISOString() };

                    let finalQty = existing.qty || 0;
                    if (item.qty !== undefined && !isNaN(item.qty)) {
                        finalQty = existing.qty + parseInt(item.qty);
                        updates.qty = finalQty;
                    }

                    let finalStdWt = existing.std_weight || 0;
                    if (item.std_weight !== undefined && !isNaN(item.std_weight)) {
                        finalStdWt = parseFloat(item.std_weight);
                        updates.std_weight = finalStdWt;
                    }

                    if (updates.qty !== undefined || updates.std_weight !== undefined) {
                        updates.total_weight = finalQty * finalStdWt;
                    }

                    const { error: updErr } = await supabaseAdmin.from('casting_inventory')
                        .update(updates)
                        .eq('id', existing.id);
                    if (updErr) throw updErr;
                    updated++;
                } else {
                    const productCode = item.product_code || item.casting_product_code;
                    const addQty = item.qty ? parseInt(item.qty) : 0;
                    const stdWt = item.std_weight ? parseFloat(item.std_weight) : 0;

                    const payload = {
                        product_code: productCode,
                        casting_product_code: item.casting_product_code,
                        qty: addQty,
                        std_weight: stdWt,
                        total_weight: addQty * stdWt,
                        created_by: req.user.id
                    };
                    const { error: insErr } = await supabaseAdmin.from('casting_inventory').insert(payload);
                    if (insErr) throw insErr;
                    added++;
                }
            } catch (err) {
                failed++;
                errors.push(`Row ${i + 2} (${item.casting_product_code || 'unknown'}): ${err.message}`);
            }
        }
        res.json({ message: `Processed ${items.length} items. Added: ${added}, Updated: ${updated}, Failed: ${failed}`, added, updated, failed, errors });
    } catch (err) {
        res.status(500).json({ error: err.message || 'Bulk upload failed' });
    }
}

// -------------------------------------------------------------
// Administration
// -------------------------------------------------------------
async function deleteAllInventory(req, res) {
    try {
        // Ensure this is truly only executed by admins
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Only administrators can perform this action' });
        }

        // We use a dummy condition .neq('id', '000...000') because supabase JS requires a filter for deletes
        const dummyUuid = '00000000-0000-0000-0000-000000000000';

        // Delete all records in the inventory tables
        const promises = [
            supabaseAdmin.from('finished_goods').delete().neq('id', dummyUuid),
            supabaseAdmin.from('casting_inventory').delete().neq('id', dummyUuid),
            supabaseAdmin.from('wax_inventory').delete().neq('id', dummyUuid)
        ];

        await Promise.all(promises);

        res.json({ message: 'All inventory data has been permanently deleted.' });
    } catch (err) {
        console.error('Delete All Inventory Error:', err);
        res.status(500).json({ error: 'Failed to delete inventory data' });
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
    checkDeleteDependencies, executeCrossDelete,

    // Bulk Uploads
    bulkUploadFinishedGoods, bulkUploadCasting,

    // Administration
    deleteAllInventory
};
