const { supabaseAdmin } = require('./config/supabase');

async function test() {
    const downPayload = {
        product_code: 'DEBUG-TEST-01',
        casting_product_code: null,
        category_id: null,
        image_url: null,
        attribute_ids: [],
        qty: 0,
        total_weight: 0,
        std_weight: 0,
        created_by: 'dd971a17-3bf7-4b8c-b010-09ccb974dfc2' // Just passing a dummy or null
    };

    const run = await supabaseAdmin.from('casting_inventory').insert(downPayload);
    console.log("INSERT RES:", run.error);
}
test();
