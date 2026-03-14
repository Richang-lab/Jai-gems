/**
 * Jai Gems - Orders Page (Order Generation)
 */
(async function () {
    const container = document.getElementById('pageContent');
    const isAdmin = Auth.getUser()?.role === 'admin';

    // Shared state
    let fgProducts = [];
    let castProducts = [];
    let fgCategories = [];
    let castAttributes = [];
    let clients = [];
    let appSettings = {};
    let orderItems = [];
    let waxProducts = [];

    async function loadReferenceData() {
        const [fgRes, castRes, configRes, attrRes, clientRes, settingsRes, waxRes] = await Promise.all([
            api.getFinishedGoods(),
            api.getCastingInventory(),
            api.getInvConfig(),
            api.getCastingAttributes(),
            api.getClients(),
            api.getAppSettings(),
            api.getWaxInventory(),
        ]);
        fgProducts = fgRes.products || fgRes.inventory || [];
        castProducts = castRes.inventory || [];
        fgCategories = configRes.categories || [];
        castAttributes = attrRes.attributes || [];
        clients = clientRes.clients || clientRes || [];
        appSettings = settingsRes.settings || {};
        waxProducts = waxRes.inventory || [];
    }

    function esc(s) {
        if (!s) return '';
        return String(s).replace(/[&<>"']/g, function (m) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
        });
    }

    var ALL_STATUSES = [
        'Open', 'Wax Inprogress', 'Wax Complete', 'Wax Tree Inprogress',
        'Wax Tree Complete', 'Casting', 'Jhalai', 'Plating', 'Stone',
        'Stone Completed', 'Packed', 'Billed', 'Canceled', 'In Stock'
    ];

    function formatCurrency(n) {
        return '\u20b9' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    // ---- SEARCHABLE COMBOBOX ----
    // Global registry to close all other dropdowns when one opens
    var _openComboClose = null;

    function searchableCombo(id, options, placeholder) {
        placeholder = placeholder || '\u2014 Select \u2014';
        var optsHtml = options.map(function (o) {
            return '<div class="ss-opt" data-value="' + esc(o.value) + '" data-label="' + esc(o.label) + '"'
                + ' style="padding:0.5rem 0.75rem;cursor:pointer;font-size:0.9rem;color:#e2e8f0;"'
                + ' onmouseenter="this.style.background=\'#2d3654\'" onmouseleave="this.style.background=\'\'"'
                + '>' + esc(o.label) + '</div>';
        }).join('');

        var html = '<div style="position:relative;" id="ss-wrap-' + id + '">'
            + '<div style="position:relative;">'
            + '<input type="text" id="ss-input-' + id + '" class="form-input" placeholder="' + esc(placeholder) + '"'
            + ' autocomplete="off" readonly style="padding-right:2rem;cursor:pointer;">'
            + '<span style="position:absolute;right:0.6rem;top:50%;transform:translateY(-50%);pointer-events:none;color:var(--text-muted);font-size:0.8rem;">\u25be</span>'
            + '</div>'
            + '<input type="hidden" id="ss-val-' + id + '">'
            + '<div id="ss-list-' + id + '" style="display:none;position:absolute;top:calc(100% + 2px);left:0;right:0;'
            + 'background:#1a1f2e;border:1px solid #2d3654;border-radius:8px;'
            + 'z-index:9999;max-height:260px;overflow:hidden;box-shadow:0 12px 32px rgba(0,0,0,0.5);">'
            + '<div style="padding:0.5rem;border-bottom:1px solid #2d3654;background:#1e2536;">'
            + '<input type="text" id="ss-search-' + id + '" class="form-input" placeholder="Type to search\u2026"'
            + ' style="height:30px;font-size:0.85rem;padding:0.25rem 0.5rem;background:#141825;color:#e2e8f0;border-color:#2d3654;"'
            + ' autocomplete="off">'
            + '</div>'
            + '<div id="ss-opts-' + id + '" style="overflow-y:auto;max-height:210px;">' + optsHtml + '</div>'
            + '</div></div>';

        function init(onChange) {
            var wrap = document.getElementById('ss-wrap-' + id);
            var input = document.getElementById('ss-input-' + id);
            var hidden = document.getElementById('ss-val-' + id);
            var list = document.getElementById('ss-list-' + id);
            var search = document.getElementById('ss-search-' + id);
            var optsEl = document.getElementById('ss-opts-' + id);
            if (!input || !list) return;

            var isOpen = false;

            function open() {
                if (isOpen) return;
                // Close any other open combo first
                if (_openComboClose && _openComboClose !== close) _openComboClose();
                isOpen = true;
                _openComboClose = close;
                list.style.display = 'block';
                search.value = '';
                filterOpts('');
                setTimeout(function () { search.focus(); }, 30);
            }
            function close() {
                if (!isOpen) return;
                isOpen = false;
                list.style.display = 'none';
                if (_openComboClose === close) _openComboClose = null;
            }
            function filterOpts(q) {
                var lq = q.toLowerCase();
                optsEl.querySelectorAll('.ss-opt').forEach(function (o) {
                    o.style.display = lq && !o.dataset.label.toLowerCase().includes(lq) ? 'none' : '';
                });
            }

            input.addEventListener('mousedown', function (e) {
                e.preventDefault(); e.stopPropagation();
                isOpen ? close() : open();
            });

            search.addEventListener('mousedown', function (e) { e.stopPropagation(); });
            search.addEventListener('input', function () { filterOpts(search.value); });

            optsEl.addEventListener('mousedown', function (e) {
                e.preventDefault(); e.stopPropagation();
                var opt = e.target.closest('.ss-opt');
                if (!opt) return;
                hidden.value = opt.dataset.value;
                input.value = opt.dataset.label;
                close();
                if (onChange) onChange(opt.dataset.value, opt.dataset.label);
            });

            document.addEventListener('mousedown', function (e) {
                if (isOpen && wrap && !wrap.contains(e.target)) close();
            });
        }

        return { html: html, init: init };
    }

    // ---- LANDING ----
    function renderLanding() {
        container.innerHTML = '<div class="page-header">'
            + '<div><h1 class="page-title">Order Generation</h1>'
            + '<p class="page-subtitle">Select order type to create</p></div>'
            + '</div>'
            + '<div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));gap:1.5rem;margin-top:2rem;min-height:60vh;">'

            + '<div id="cardFGO" style="background:linear-gradient(135deg,#1a1f2e,#232a40);border:2px solid transparent;border-radius:var(--radius-lg);'
            + 'padding:3rem 2rem;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1.5rem;cursor:pointer;transition:all 0.25s;"'
            + ' onmouseenter="this.style.borderColor=\'var(--gold-light)\';this.style.transform=\'translateY(-4px)\'"'
            + ' onmouseleave="this.style.borderColor=\'transparent\';this.style.transform=\'\'">'
            + '<div style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,#f59e0b,#d97706);display:flex;align-items:center;justify-content:center;font-size:2rem;box-shadow:0 8px 24px rgba(245,158,11,0.4);">\ud83d\udce6</div>'
            + '<div style="text-align:center;"><h2 style="font-size:1.6rem;font-weight:700;color:var(--text-primary);margin:0 0 0.5rem;">Finished Good Order</h2>'
            + '<p class="text-muted" style="max-width:280px;line-height:1.6;">Create an order for finished jewellery from FG inventory.</p>'
            + '<code style="font-size:0.7rem;color:var(--text-muted);background:var(--bg-primary);padding:2px 8px;border-radius:4px;margin-top:0.5rem;display:inline-block;">FGO-YYMMDD-NNNN</code></div>'
            + '<button class="btn btn-primary" style="width:100%;max-width:200px;">' + UI.icon('plus') + ' Create FG Order</button>'
            + '</div>'

            + '<div id="cardCSO" style="background:linear-gradient(135deg,#1a1f2e,#232a40);border:2px solid transparent;border-radius:var(--radius-lg);'
            + 'padding:3rem 2rem;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1.5rem;cursor:pointer;transition:all 0.25s;"'
            + ' onmouseenter="this.style.borderColor=\'#3b82f6\';this.style.transform=\'translateY(-4px)\'"'
            + ' onmouseleave="this.style.borderColor=\'transparent\';this.style.transform=\'\'">'
            + '<div style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,#3b82f6,#1d4ed8);display:flex;align-items:center;justify-content:center;font-size:2rem;box-shadow:0 8px 24px rgba(59,130,246,0.4);">\ud83d\udd29</div>'
            + '<div style="text-align:center;"><h2 style="font-size:1.6rem;font-weight:700;color:var(--text-primary);margin:0 0 0.5rem;">Casting Order</h2>'
            + '<p class="text-muted" style="max-width:280px;line-height:1.6;">Create a manufacturing order for casting products.</p>'
            + '<code style="font-size:0.7rem;color:var(--text-muted);background:var(--bg-primary);padding:2px 8px;border-radius:4px;margin-top:0.5rem;display:inline-block;">CSO-YYMMDD-NNNN</code></div>'
            + '<button class="btn" style="width:100%;max-width:200px;background:linear-gradient(135deg,#3b82f6,#1d4ed8);color:#fff;">' + UI.icon('plus') + ' Create Casting Order</button>'
            + '</div></div>';

        document.getElementById('cardFGO').addEventListener('click', function () { renderCreateForm('finished_good'); });
        document.getElementById('cardCSO').addEventListener('click', function () { renderCreateForm('casting'); });
    }

    // ---- CREATE FORM ----
    function renderCreateForm(orderType) {
        var isFG = orderType === 'finished_good';
        var title = isFG ? 'Finished Good Order' : 'Casting Order';
        var refPrefix = isFG ? 'FGO' : 'CSO';
        var castRate = parseFloat(appSettings.casting_rate || 0);
        var now = new Date();
        var yymmdd = String(now.getFullYear()).slice(2) + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0');
        var orderIdPreview = refPrefix + '-' + yymmdd + '-XXXX';

        var clientCombo = searchableCombo('orderClient',
            clients.map(function (c) {
                var label = c.business_name || c.name || 'Unknown';
                if (c.phone_number) label += ' \u2014 ' + c.phone_number;
                return { value: c.id, label: label };
            }), '\u2014 Select Client \u2014');

        var catCombo = null, attrCombo = null;
        if (isFG) {
            catCombo = searchableCombo('filterCat',
                [{ value: '', label: 'All Categories' }].concat(fgCategories.map(function (c) { return { value: c.id, label: c.name }; })),
                'All Categories');
        } else {
            catCombo = searchableCombo('filterCat',
                [{ value: '', label: 'All Categories' }].concat(fgCategories.map(function (c) { return { value: c.id, label: c.name }; })),
                'All Categories');
            attrCombo = searchableCombo('filterAttr',
                [{ value: '', label: 'All Attributes' }].concat(castAttributes.map(function (a) { return { value: a.id, label: a.name }; })),
                'All Attributes');
        }
        var productCombo = searchableCombo('productPicker', [], '\u2014 Select Product \u2014');

        container.innerHTML = '<div class="page-header"><div>'
            + '<button class="btn btn-secondary btn-sm" id="btnBackLanding" style="margin-bottom:0.5rem;">\u2190 Back</button>'
            + '<h1 class="page-title">' + esc(title) + '</h1>'
            + '<div style="display:flex;align-items:center;gap:0.75rem;margin-top:0.25rem;">'
            + '<span class="text-muted text-sm">Order ID:</span>'
            + '<code style="color:var(--gold-light);background:var(--bg-primary);padding:3px 10px;border-radius:6px;font-size:0.85rem;">' + orderIdPreview + '</code>'
            + '</div></div>'
            + '<div style="display:flex;gap:0.5rem;">'
            + '<button class="btn btn-primary" id="btnSubmitOrder">' + UI.icon('check') + ' Create Order</button>'
            + '</div></div>'

            + '<div class="card" style="margin-top:1rem;">'
            + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-md);">'
            + '<div class="form-group"><label class="form-label">Client</label>' + clientCombo.html + '</div>'
            + '<div class="form-group"><label class="form-label">Notes</label>'
            + '<input class="form-input" type="text" id="orderNotes" placeholder="Optional notes\u2026"></div>'
            + '</div></div>'

            + '<div class="card" style="margin-top:1rem;">'
            + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem;flex-wrap:wrap;gap:0.5rem;">'
            + '<h3 style="margin:0;font-size:1.1rem;">Products</h3>'
            + '<div style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap;">'
            + '<div style="width:170px;">' + catCombo.html + '</div>'
            + (isFG ? '' : '<div style="width:170px;">' + attrCombo.html + '</div>')
            + '<div style="min-width:220px;">' + productCombo.html + '</div>'
            + (isFG ? '' : '<select class="form-input" id="qtyTypePicker" style="padding:0.35rem 0.5rem;font-size:0.85rem;"><option value="pairs">Qty in Pairs</option><option value="weight">Qty in Weight (g)</option></select>')
            + '<input type="number" id="quickQty" value="1" min="0.001" step="0.001" class="form-input" style="width:70px;padding:0.35rem;font-size:0.85rem;" placeholder="Qty">'
            + '<label style="display:flex;align-items:center;gap:4px;cursor:pointer;color:var(--text-primary);font-size:0.85rem;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2);padding:0.25rem 0.5rem;border-radius:4px;"><input type="checkbox" id="isUrgentCb" style="accent-color:var(--danger);width:14px;height:14px;"> Urgent</label>'
            + '<button class="btn btn-primary btn-sm" id="btnAddProduct">' + UI.icon('plus') + ' Add</button>'
            + '</div></div>'

            + '<div class="table-container"><table class="table" id="orderItemsTable"><thead><tr>'
            + '<th style="width:50px;">Image</th><th>Product Code</th>'
            + (isFG ? '<th>Qty (Pairs)</th><th>Unit Price (\u20b9)</th>' : '<th>Qty</th><th>Type</th>')
            + '<th>Status</th><th style="width:50px;"></th>'
            + '</tr></thead><tbody id="orderItemsBody">'
            + '<tr><td colspan="6" class="text-center text-muted" style="padding:2rem;">No products added yet.</td></tr>'
            + '</tbody></table></div>'

            + '<div style="display:flex;justify-content:flex-end;margin-top:1rem;padding:1rem;background:var(--bg-primary);border-radius:var(--radius-md);">'
            + '<div style="text-align:right;">'
            + '<div class="text-sm text-muted">Estimated Total</div>'
            + '<div id="orderTotal" style="font-size:1.8rem;font-weight:700;color:var(--gold-light);">' + formatCurrency(0) + '</div>'
            + (!isFG ? '<div class="text-xs text-muted">Casting Rate: \u20b9' + castRate + '/KG</div>' : '')
            + '</div></div></div>';

        // Init combos
        clientCombo.init();

        function buildProductOpts() {
            var catVal = '', attrVal = '';
            var catH = document.getElementById('ss-val-filterCat');
            var attrH = document.getElementById('ss-val-filterAttr');
            if (catH) catVal = catH.value;
            if (attrH) attrVal = attrH.value;

            var prods = isFG ? fgProducts.slice() : castProducts.slice();
            if (isFG && catVal) {
                prods = prods.filter(function (p) { return p.category_id === catVal; });
            } else if (!isFG) {
                if (catVal) prods = prods.filter(function (p) { return p.category_id === catVal; });
                if (attrVal) prods = prods.filter(function (p) { return (p.attribute_ids || []).includes(attrVal); });
            }

            var optsEl = document.getElementById('ss-opts-productPicker');
            if (!optsEl) return;

            var all = [{ value: '', label: '\u2014 Select Product \u2014', price: 0, img: '', stdwt: 0 }];
            prods.forEach(function (p) {
                var code = isFG ? p.product_code : (p.casting_product_code || p.product_code);
                all.push({ value: code, label: code + ' (' + (p.qty != null ? p.qty : 0) + ' in stock)', price: p.price || 0, img: p.image_url || '', stdwt: p.std_weight || 0 });
            });

            optsEl.innerHTML = all.map(function (o) {
                return '<div class="ss-opt" data-value="' + esc(o.value) + '" data-label="' + esc(o.label) + '"'
                    + ' data-price="' + (o.price || 0) + '" data-img="' + esc(o.img || '') + '" data-stdwt="' + (o.stdwt || 0) + '"'
                    + ' style="padding:0.5rem 0.75rem;cursor:pointer;font-size:0.9rem;color:#e2e8f0;"'
                    + ' onmouseenter="this.style.background=\'#2d3654\'" onmouseleave="this.style.background=\'\'"'
                    + '>' + esc(o.label) + '</div>';
            }).join('');
        }

        if (catCombo) catCombo.init(function () { buildProductOpts(); });
        if (attrCombo) attrCombo.init(function () { buildProductOpts(); });
        productCombo.init();
        buildProductOpts();

        document.getElementById('btnBackLanding').addEventListener('click', function () { renderLanding(); });
        document.getElementById('btnAddProduct').addEventListener('click', function () { addProductRow(orderType); });
        document.getElementById('btnSubmitOrder').addEventListener('click', function () { submitOrder(orderType); });

        orderItems = [];
    }

    function addProductRow(orderType) {
        var isFG = orderType === 'finished_good';
        var hidden = document.getElementById('ss-val-productPicker');
        var code = hidden ? hidden.value : '';
        if (!code) { UI.toast('Please select a product first', 'error'); return; }
        if (orderItems.find(function (i) { return i.product_code === code; })) { UI.toast('Product already added', 'error'); return; }

        var optsEl = document.getElementById('ss-opts-productPicker');
        var selOpt = optsEl ? optsEl.querySelector('.ss-opt[data-value="' + code + '"]') : null;
        var unitPrice = isFG ? parseFloat((selOpt && selOpt.dataset.price) || 0) : 0;
        var img = (selOpt && selOpt.dataset.img) || '';
        var stdWt = parseFloat((selOpt && selOpt.dataset.stdwt) || 0);
        var qtyType = isFG ? 'pairs' : ((document.getElementById('qtyTypePicker') || {}).value || 'pairs');
        var inputQty = parseFloat(document.getElementById('quickQty').value) || 1;
        var isUrgent = document.getElementById('isUrgentCb') ? document.getElementById('isUrgentCb').checked : false;

        // Auto Status logic mirroring backend
        var initialStatus = 'Open';
        if (isFG) {
            var fg = fgProducts.find(function (p) { return p.product_code === code; });
            if (fg && fg.qty > 0) initialStatus = 'In Stock';
        } else {
            var wax = waxProducts.find(function (p) { return p.product_code === code; });
            if (wax && wax.qty > 0) initialStatus = 'Wax Inprogress';
            else {
                var cast = castProducts.find(function (p) { return p.product_code === code || p.casting_product_code === code; });
                if (cast && cast.qty > 0) initialStatus = 'Casting';
            }
        }

        orderItems.push({ product_code: code, image_url: img, qty: inputQty, qty_type: qtyType, unit_price: unitPrice, std_weight: stdWt, status: initialStatus, is_urgent: isUrgent });
        
        // Reset checkbox after adding
        if (document.getElementById('isUrgentCb')) document.getElementById('isUrgentCb').checked = false;
        renderItemsTable(orderType);
    }

    function renderItemsTable(orderType) {
        var isFG = orderType === 'finished_good';
        var castRate = parseFloat(appSettings.casting_rate || 0);
        var tbody = document.getElementById('orderItemsBody');

        if (orderItems.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted" style="padding:2rem;">No products added yet.</td></tr>';
            document.getElementById('orderTotal').textContent = formatCurrency(0);
            return;
        }

        tbody.innerHTML = orderItems.map(function (item, idx) {
            var estVal = isFG ? item.qty * item.unit_price : (item.qty_type === 'weight' ? (item.qty / 1000) * castRate : 0);
            var imgHTML = item.image_url
                ? '<img src="' + item.image_url + '" class="oi-image-tag" onclick="UI.showImage(this.src)">'
                : '<div class="oi-image-placeholder">' + UI.icon('image') + '</div>';

            var statusOpts = ALL_STATUSES.map(function (s) {
                return '<option value="' + s + '" ' + (item.status === s ? 'selected' : '') + '>' + s + '</option>';
            }).join('');

            return '<tr class="order-item-row">'
                + '<td data-label="Image" class="oi-img">' + imgHTML + '</td>'
                + '<td data-label="Product Code" class="oi-code">'
                + '   <strong>' + esc(item.product_code) + '</strong>'
                + (item.is_urgent ? ' <span class="badge" style="background:rgba(239,68,68,0.1);color:var(--danger);border:1px solid rgba(239,68,68,0.2);margin-left:4px;">URGENT</span>' : '')
                + '   <span class="badge oi-status-badge oi-mobile-status">' + esc(item.status) + '</span>'
                + '</td>'
                + '<td data-label="Qty" class="oi-qty"><div class="oi-qty-wrapper"><input type="number" min="0.001" step="0.001" value="' + item.qty + '" class="form-input oi-qty-input" onchange="window.updateOrderRow(' + idx + ',\'qty\',this.value,\'' + orderType + '\')">'
                + (!isFG ? '<span class="oi-mobile-type">' + esc(item.qty_type) + '</span>' : '')
                + '</div></td>'
                + (isFG
                    ? '<td data-label="Unit Price" class="oi-price">' + formatCurrency(item.unit_price) + '</td>'
                    : '<td data-label="Type" class="oi-price oi-desktop-type">' + esc(item.qty_type) + '</td>')
                + '<td data-label="Status" class="oi-status oi-desktop-status"><span class="badge oi-status-badge">' + esc(item.status) + '</span></td>'
                + '<td data-label="Actions" class="oi-actions"><button class="btn btn-sm btn-danger oi-del-btn" onclick="window.removeOrderRow(' + idx + ',\'' + orderType + '\')">' + UI.icon('trash') + '</button></td>'
                + '</tr>';
        }).join('');

        var total = 0;
        orderItems.forEach(function (item) {
            if (isFG) total += item.qty * item.unit_price;
            else total += item.qty_type === 'weight' ? (item.qty / 1000) * castRate : 0;
        });
        document.getElementById('orderTotal').textContent = formatCurrency(total);
    }

    window.updateOrderRow = function (idx, field, val, orderType) {
        if (!orderItems[idx]) return;
        if (field === 'qty') orderItems[idx].qty = parseFloat(val) || 0;
        if (field === 'unit_price') orderItems[idx].unit_price = parseFloat(val) || 0;
        if (field === 'status') orderItems[idx].status = val;
        renderItemsTable(orderType);
    };

    window.removeOrderRow = function (idx, orderType) {
        orderItems.splice(idx, 1);
        renderItemsTable(orderType);
    };

    async function submitOrder(orderType) {
        var isFG = orderType === 'finished_good';
        if (orderItems.length === 0) { UI.toast('Add at least one product', 'error'); return; }

        var castRate = parseFloat(appSettings.casting_rate || 0);
        var clientH = document.getElementById('ss-val-orderClient');
        var clientId = clientH ? clientH.value : '';
        if (!clientId) { UI.toast('Please select a client', 'warning'); return; }

        var notes = document.getElementById('orderNotes').value;

        var payload = {
            order_type: orderType,
            client_id: clientId || null,
            notes: notes || null,
            items: orderItems.map(function (item) {
                return {
                    product_code: item.product_code,
                    image_url: item.image_url || null,
                    qty: item.qty,
                    qty_type: item.qty_type,
                    unit_price: isFG ? item.unit_price : (item.qty_type === 'weight' ? (item.qty / 1000) * castRate : 0),
                    status: item.status || 'Open',
                    is_urgent: item.is_urgent ? true : false
                };
            }),
        };

        try {
            var btn = document.getElementById('btnSubmitOrder');
            btn.disabled = true;
            btn.innerHTML = 'Creating...';
            var res = await api.createOrder(payload);
            UI.toast('Order ' + res.order_id + ' created!', 'success');
            orderItems = [];

            // Show Success Screen with Print option
            container.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:60vh;text-align:center;">'
                + '<div style="width:80px;height:80px;background:var(--success-bg);color:var(--success);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:2.5rem;margin-bottom:1.5rem;">' + UI.icon('check') + '</div>'
                + '<h2 style="font-size:2rem;margin-bottom:0.5rem;">Order Created Successfully</h2>'
                + '<p class="text-muted" style="margin-bottom:2rem;font-size:1.1rem;">Order ID: <strong style="color:var(--gold-light);">' + esc(res.order_id) + '</strong></p>'
                + '<div style="display:flex;gap:1rem;">'
                + '<button class="btn btn-primary" onclick="window._ogPrint(\'' + res.order.id + '\')">' + UI.icon('printer') + ' Print Order</button>'
                + '<button class="btn btn-secondary" id="btnSuccessLanding">Create Another</button>'
                + '</div></div>';

            document.getElementById('btnSuccessLanding').addEventListener('click', renderLanding);
        } catch (err) {
            UI.toast(err.message || 'Failed to create order', 'error');
            var btn2 = document.getElementById('btnSubmitOrder');
            if (btn2) { btn2.disabled = false; btn2.innerHTML = UI.icon('check') + ' Create Order'; }
        }
    }

    window._ogPrint = async function (orderId) {
        try {
            var resp = await api.getOrder(orderId);
            var order = resp.order;
            var isFG = order.order_type === 'finished_good';
            var castRate = parseFloat(appSettings.casting_rate || 0);
            var clientName = order.client ? (order.client.business_name || order.client.name || '\u2014') : '\u2014';
            var rows = (order.order_items || []).map(function (item) {
                var estVal = isFG ? item.qty * item.unit_price : (item.qty_type === 'weight' ? (item.qty / 1000) * castRate : 0);
                return '<tr><td class="code">' + esc(item.product_code) + '</td><td>' + esc(item.status) + '</td><td>' + item.qty + ' ' + (item.qty_type || '') + '</td>'
                    + '<td class="right">' + (isFG ? formatCurrency(item.unit_price) : '\u20b9' + castRate + '/KG') + '</td>'
                    + '<td class="right">' + formatCurrency(estVal) + '</td></tr>';
            }).join('');
            var win = window.open('', '_blank');
            win.document.write('<!DOCTYPE html><html><head><title>Order ' + order.order_id + '</title>'
                + '<style>'
                + '@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap");'
                + 'body { font-family: "Inter", sans-serif; padding: 40px; color: #1e293b; background: #fff; max-width: 900px; margin: 0 auto; }'
                + '.header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }'
                + '.brand h1 { font-size: 28px; font-weight: 700; color: #0f172a; margin: 0; }'
                + '.brand p { font-size: 14px; color: #64748b; margin: 4px 0 0 0; }'
                + '.meta { text-align: right; }'
                + '.meta h2 { font-size: 20px; color: #334155; margin: 0 0 4px 0; }'
                + '.meta .info { font-size: 14px; color: #475569; margin: 2px 0; }'
                + '.client-box { background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 30px; border: 1px solid #e2e8f0; }'
                + '.client-box h3 { margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; }'
                + '.client-box p { margin: 0; font-size: 16px; font-weight: 600; color: #0f172a; }'
                + '.client-box .notes { margin-top: 10px; font-size: 14px; font-weight: 400; color: #475569; }'
                + 'table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 14px; }'
                + 'th { background: #f1f5f9; padding: 12px; text-align: left; font-weight: 600; color: #475569; border-bottom: 2px solid #cbd5e1; }'
                + 'th.right, td.right { text-align: right; }'
                + 'td { padding: 12px; border-bottom: 1px solid #e2e8f0; color: #334155; }'
                + 'td.code { font-weight: 600; color: #0f172a; }'
                + '.total-row { display: flex; justify-content: flex-end; align-items: center; padding-top: 20px; border-top: 2px solid #0f172a; }'
                + '.total-label { font-size: 16px; font-weight: 600; color: #475569; margin-right: 20px; }'
                + '.total-value { font-size: 24px; font-weight: 700; color: #0f172a; }'
                + '@media print { body { padding: 0; max-width: none; } }'
                + '</style>'
                + '</head><body>'
                + '<div class="header">'
                + '  <div class="brand"><h1>Jai Gems</h1><p>Art & Crafts</p></div>'
                + '  <div class="meta"><h2>' + esc(order.order_id) + '</h2><p class="info">' + (order.order_type === 'casting' ? 'Casting Order' : 'Finished Good Order') + '</p><p class="info">Date: ' + new Date(order.created_at).toLocaleDateString('en-IN') + '</p></div>'
                + '</div>'
                + '<div class="client-box">'
                + '  <h3>Prepared For</h3>'
                + '  <p>' + esc(clientName) + '</p>'
                + (order.notes ? '<p class="notes"><strong>Notes:</strong> ' + esc(order.notes) + '</p>' : '')
                + '</div>'
                + '<table><thead><tr><th>Product Code</th><th>Item Status</th><th>Qty</th><th class="right">Rate</th><th class="right">Amount</th></tr></thead>'
                + '<tbody>' + rows + '</tbody></table>'
                + '<div class="total-row">'
                + '  <div class="total-label">Estimated Total</div>'
                + '  <div class="total-value">' + formatCurrency(order.estimated_value) + '</div>'
                + '</div>'
                + '<script>window.onload=function(){window.print();window.close();}<\/script>'
                + '</body></html>');
            win.document.close();
        } catch (err) {
            UI.toast(err.message || 'Failed to print', 'error');
        }
    };

    // ---- BOOT ----
    container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:200px;"><div class="spinner"></div></div>';
    try {
        await loadReferenceData();
        renderLanding();
    } catch (err) {
        container.innerHTML = '<div class="text-error" style="padding:2rem;">Failed to load: ' + esc(err.message) + '</div>';
    }
})();
