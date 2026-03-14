const { supabaseAdmin } = require('../config/supabase');

/**
 * Helper fn: Calculate bounded target quantity.
 * Minimum buffer of 10 items.
 */
function calculateAssignedQty(originalQty) {
  const qtyNum = Number(originalQty);
  if (isNaN(qtyNum)) return 0;
  
  const buffer10Percent = qtyNum * 0.10;
  // If 10% is less than 10, add a flat 10. Otherwise add 10%.
  const finalBuffer = buffer10Percent < 10 ? 10 : buffer10Percent;
  
  return qtyNum + finalBuffer;
}

/**
 * GET /api/slips/pending/:type
 * Fetches order items that are ready to be assigned to the requested slip type.
 * 'wax' -> Open status
 * 'tree' -> Wax Complete status
 * 'jhalai' -> Casting status
 */
exports.getPendingWork = async (req, res) => {
  try {
    const { type } = req.params;
    let targetStatus = '';
    
    if (type === 'wax') targetStatus = 'Open';
    else if (type === 'tree') targetStatus = 'Wax Complete';
    else if (type === 'jhalai') targetStatus = 'Casting';
    else return res.status(400).json({ error: 'Invalid slip type requested.' });

    // Join order_items with orders and clients to get the nickname and FIFO sorting (orders.created_at)
    const { data: items, error } = await supabaseAdmin
      .from('order_items')
      .select(`
        id, 
        product_code, 
        qty, 
        qty_type, 
        status, 
        is_urgent,
        orders!inner (
          order_id, 
          order_type, 
          created_at,
          clients (
            nickname
          )
        )
      `)
      .eq('status', targetStatus)
      .order('is_urgent', { ascending: false }) // Urgent always first
      .order('created_at', { foreignTable: 'orders', ascending: true }); // Then FIFO Oldest first

    if (error) throw error;

    // Flatten logic for clients handling and calculate the padded quantity strictly for preview
    const formattedData = items.map(item => ({
      id: item.id,
      product_code: item.product_code,
      order_id: item.orders?.order_id,
      order_type: item.orders?.order_type,
      client_nickname: item.orders?.clients?.nickname || 'Unknown',
      priority: item.is_urgent ? 'Urgent' : 'Normal',
      original_qty: item.qty,
      assigned_qty: calculateAssignedQty(item.qty), 
      qty_type: item.qty_type,
      order_date: item.orders?.created_at
    }));

    res.json({ pendingItems: formattedData });
  } catch (err) {
    console.error('Error in getPendingWork:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * POST /api/slips/generate
 * Takes a list of order_item IDs, creates a physical Work Slip record, 
 * moves the order items to their next "In Progress" status, and binds them to the slip.
 */
exports.generateSlip = async (req, res) => {
  try {
    const { slip_type, order_type, items } = req.body;
    // items should be array of: { order_item_id, client_nickname, priority, assigned_qty, next_status }
    
    if (!slip_type || !order_type || !items || !items.length) {
      return res.status(400).json({ error: 'Missing required slip parameters or items.' });
    }

    // 1. Generate unique slip number (e.g. WAX-YYYYMMDD-HHMM)
    const prefix = slip_type.substring(0, 3).toUpperCase();
    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, ''); // YYMMDD
    const rand = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const slipNumber = `${prefix}-${dateStr}-${rand}`;

    // 2. Create the Slip header
    const { data: slipData, error: slipErr } = await supabaseAdmin
      .from('work_slips')
      .insert({
        slip_number: slipNumber,
        slip_type,
        order_type,
        created_by: req.user.id // assuming authenticate middleware populates req.user
      })
      .select()
      .single();

    if (slipErr) throw slipErr;

    // 3. Create the slip items
    const slipItemsPayload = items.map(item => ({
      slip_id: slipData.id,
      order_item_id: item.order_item_id,
      client_nickname: item.client_nickname,
      priority: item.priority || 'Normal',
      assigned_qty: item.assigned_qty,
      status: 'In Progress'
    }));

    const { error: itemsErr } = await supabaseAdmin
      .from('work_slip_items')
      .insert(slipItemsPayload);

    if (itemsErr) throw itemsErr;

    // 4. Update the order_items status map string
    for (let item of items) {
      if (item.next_status) {
        await supabaseAdmin
          .from('order_items')
          .update({ status: item.next_status, updated_at: new Date().toISOString() })
          .eq('id', item.order_item_id);
      }
    }

    res.json({ message: 'Slip Generated Successfully', slip: slipData });
  } catch (err) {
    console.error('Error in generateSlip:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/slips
 * Gets all historically generated slips
 */
exports.getSlips = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('work_slips')
      .select(`
        *,
        work_slip_items (
          id, order_item_id, client_nickname, priority, assigned_qty, status
        ),
        users (full_name)
      `)
      .order('issued_at', { ascending: false });
    
    if (error) throw error;
    res.json({ slips: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
