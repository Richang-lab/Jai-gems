/**
 * Jai Gems — Orders Page (Generation & Tracking)
 * Views: landing → create → tracking
 */
(async function () {
  const container = document.getElementById('pageContent');
  const isAdmin = Auth.getUser()?.role === 'admin';

  // ─── Shared state ────────────────────────────────────────────────────────
  let fgProducts = [];
  let castProducts = [];
  let fgCategories = [];
  let castAttributes = [];
  let clients = [];
  let appSettings = {};
  let orderItems = []; // current create-form rows

  // Load reference data once
  async function loadReferenceData() {
    const [fgRes, castRes, configRes, attrRes, clientRes, settingsRes] = await Promise.all([
      api.getFinishedGoods(),
      api.getCastingInventory(),
      api.getInvConfig(),
      api.getCastingAttributes(),
      api.getClients(),
      api.getAppSettings(),
    ]);
    fgProducts = (fgRes.products || fgRes.inventory || []);
    castProducts = (castRes.inventory || []);
    fgCategories = (configRes.categories || []);
    castAttributes = (attrRes.attributes || []);
    clients = (clientRes.clients || clientRes || []);
    appSettings = (settingsRes.settings || {});
  }

  // ─── UTILS ───────────────────────────────────────────────────────────────
  function esc(s) {
    if (!s) return '';
    return String(s).replace(/[&<>"']/g, m =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]);
  }

  const ALL_STATUSES = [
    'Open', 'Wax Inprogress', 'Wax Complete', 'Wax Tree Inprogress',
    'Wax Tree Complete', 'Casting', 'Jhalai', 'Plating', 'Stone',
    'Packed', 'Billed', 'Canceled', 'In Stock'
  ];

  const STATUS_COLORS = {
    'Open': '#6b7280',
    'Wax Inprogress': '#f59e0b',
    'Wax Complete': '#10b981',
    'Wax Tree Inprogress': '#f59e0b',
    'Wax Tree Complete': '#10b981',
    'Casting': '#3b82f6',
    'Jhalai': '#8b5cf6',
    'Plating': '#ec4899',
    'Stone': '#06b6d4',
    'Packed': '#14b8a6',
    'Billed': '#22c55e',
    'Canceled': '#ef4444',
    'In Stock': '#f59e0b',
  };

  function statusBadge(s) {
    const c = STATUS_COLORS[s] || '#6b7280';
    return `<span style="background:${c}22; color:${c}; padding:2px 8px; border-radius:20px; font-size:0.75rem; font-weight:600; white-space:nowrap;">${esc(s)}</span>`;
  }

  function formatCurrency(n) {
    return '\u20b9' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // ─── SEARCHABLE COMBOBOX ──────────────────────────────────────────────────
  function searchableCombo(id, options, placeholder) {
    placeholder = placeholder || '\u2014 Search or select \u2014';
    const opts = options.map(o =>
      `<div class="ss-opt" data-value="${esc(o.value)}" data-label="${esc(o.label)}"
              style="padding:0.5rem 0.75rem;cursor:pointer;font-size:0.9rem;color:#e2e8f0;
                     white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"
              onmouseenter="this.style.background='#2d3654'" onmouseleave="this.style.background=''"
            >${esc(o.label)}</div>`
    ).join('');

    const html = `
        <div style="position:relative;" id="ss-wrap-${id}">
          <div style="position:relative;">
            <input type="text" id="ss-input-${id}" class="form-input" placeholder="${esc(placeholder)}"
              autocomplete="off" readonly style="padding-right:2rem;cursor:pointer;">
            <span style="position:absolute;right:0.6rem;top:50%;transform:translateY(-50%);pointer-events:none;color:var(--text-muted);font-size:0.8rem;">\u25be</span>
          </div>
          <input type="hidden" id="ss-val-${id}">
          <div id="ss-list-${id}" style="display:none;position:absolute;top:calc(100% + 2px);left:0;right:0;
            background:#1a1f2e;border:1px solid #2d3654;border-radius:8px;
            z-index:9999;max-height:260px;overflow:hidden;box-shadow:0 12px 32px rgba(0,0,0,0.5);">
            <div style="padding:0.5rem;border-bottom:1px solid #2d3654;background:#1e2536;">
              <input type="text" id="ss-search-${id}" class="form-input" placeholder="Type to search\u2026"
                style="height:30px;font-size:0.85rem;padding:0.25rem 0.5rem;background:#141825;color:#e2e8f0;border-color:#2d3654;"
                autocomplete="off">
            </div>
            <div id="ss-opts-${id}" style="overflow-y:auto;max-height:210px;">${opts}</div>
          </div>
        </div>`;

    function init(onChange) {
      const wrap = document.getElementById('ss-wrap-' + id);
      const input = document.getElementById('ss-input-' + id);
      const hidden = document.getElementById('ss-val-' + id);
      const list = document.getElementById('ss-list-' + id);
      const search = document.getElementById('ss-search-' + id);
      const optsEl = document.getElementById('ss-opts-' + id);
      if (!input || !list) return;

      let isOpen = false;

      function open() {
        if (isOpen) return;
        isOpen = true;
        list.style.display = 'block';
        search.value = '';
        filterOpts('');
        setTimeout(function () { search.focus(); }, 30);
      }
      function close() {
        isOpen = false;
        list.style.display = 'none';
      }
      function filterOpts(q) {
        const lq = q.toLowerCase();
        optsEl.querySelectorAll('.ss-opt').forEach(function (o) {
          o.style.display = lq && !o.dataset.label.toLowerCase().includes(lq) ? 'none' : '';
        });
      }

      // Toggle on click of the input
      input.addEventListener('mousedown', function (e) {
        e.preventDefault();
        e.stopPropagation();
        isOpen ? close() : open();
      });

      // Prevent search box from closing the dropdown
      search.addEventListener('mousedown', function (e) { e.stopPropagation(); });
      search.addEventListener('input', function () { filterOpts(search.value); });

      // Select an option
      optsEl.addEventListener('mousedown', function (e) {
        e.preventDefault();
        e.stopPropagation();
        const opt = e.target.closest('.ss-opt');
        if (!opt) return;
        hidden.value = opt.dataset.value;
        input.value = opt.dataset.label;
        close();
        if (onChange) onChange(opt.dataset.value, opt.dataset.label);
      });

      // Close on outside click
      document.addEventListener('mousedown', function (e) {
        if (isOpen && wrap && !wrap.contains(e.target)) close();
      });
    }

    return { html: html, init: init };
  }

  // ─── VIEW: LANDING (choose order type) ───────────────────────────────────
  function renderLanding(subtitle) {
    subtitle = subtitle || 'New Order';
    container.innerHTML = `
        <div class="page-header">
          <div>
            <h1 class="page-title">Orders</h1>
            <p class="page-subtitle">${esc(subtitle)}</p>
          </div>
          <button class="btn btn-secondary" id="btnOrdersTrack">${UI.icon('list')} Order Tracking</button>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:1.5rem; margin-top:2rem; min-height:60vh;">

          <!-- Finished Good Order -->
          <div id="cardFGO"
            style="background:linear-gradient(135deg,#1a1f2e 0%,#232a40 100%);
                   border:2px solid transparent; border-radius:var(--radius-lg);
                   padding:3rem 2rem; display:flex; flex-direction:column;
                   align-items:center; justify-content:center; gap:1.5rem;
                   cursor:pointer; transition:all 0.25s; position:relative; overflow:hidden;"
            onmouseenter="this.style.borderColor='var(--gold-light)';this.style.transform='translateY(-4px)';this.style.boxShadow='0 20px 40px rgba(212,175,55,0.15)'"
            onmouseleave="this.style.borderColor='transparent';this.style.transform='';this.style.boxShadow=''"
          >
            <div style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,#f59e0b,#d97706);
                         display:flex;align-items:center;justify-content:center;font-size:2rem;
                         box-shadow:0 8px 24px rgba(245,158,11,0.4);">
              \ud83d\udce6
            </div>
            <div style="text-align:center;">
              <h2 style="font-size:1.6rem;font-weight:700;color:var(--text-primary);margin:0 0 0.5rem;">Finished Good Order</h2>
              <p class="text-muted" style="max-width:280px;line-height:1.6;">
                Create an order for ready-to-sell finished jewellery items from FG inventory.
              </p>
              <code style="font-size:0.7rem;color:var(--text-muted);background:var(--bg-primary);padding:2px 8px;border-radius:4px;margin-top:0.5rem;display:inline-block;">
                Reference: FGO-YYMMDD-NNNN
              </code>
            </div>
            <button class="btn btn-primary" style="width:100%;max-width:200px;margin-top:0.5rem;">
              ${UI.icon('plus')} Create FG Order
            </button>
          </div>

          <!-- Casting Order -->
          <div id="cardCSO"
            style="background:linear-gradient(135deg,#1a1f2e 0%,#232a40 100%);
                   border:2px solid transparent; border-radius:var(--radius-lg);
                   padding:3rem 2rem; display:flex; flex-direction:column;
                   align-items:center; justify-content:center; gap:1.5rem;
                   cursor:pointer; transition:all 0.25s; position:relative; overflow:hidden;"
            onmouseenter="this.style.borderColor='#3b82f6';this.style.transform='translateY(-4px)';this.style.boxShadow='0 20px 40px rgba(59,130,246,0.15)'"
            onmouseleave="this.style.borderColor='transparent';this.style.transform='';this.style.boxShadow=''"
          >
            <div style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,#3b82f6,#1d4ed8);
                         display:flex;align-items:center;justify-content:center;font-size:2rem;
                         box-shadow:0 8px 24px rgba(59,130,246,0.4);">
              \ud83d\udd29
            </div>
            <div style="text-align:center;">
              <h2 style="font-size:1.6rem;font-weight:700;color:var(--text-primary);margin:0 0 0.5rem;">Casting Order</h2>
              <p class="text-muted" style="max-width:280px;line-height:1.6;">
                Create a manufacturing order for casting products. Estimated value is calculated using weight \u00d7 casting rate.
              </p>
              <code style="font-size:0.7rem;color:var(--text-muted);background:var(--bg-primary);padding:2px 8px;border-radius:4px;margin-top:0.5rem;display:inline-block;">
                Reference: CSO-YYMMDD-NNNN
              </code>
            </div>
            <button class="btn" style="width:100%;max-width:200px;margin-top:0.5rem;background:linear-gradient(135deg,#3b82f6,#1d4ed8);color:#fff;">
              ${UI.icon('plus')} Create Casting Order
            </button>
          </div>

        </div>
        `;

    document.getElementById('cardFGO').addEventListener('click', function () { renderCreateForm('finished_good'); });
    document.getElementById('cardCSO').addEventListener('click', function () { renderCreateForm('casting'); });
    document.getElementById('btnOrdersTrack').addEventListener('click', function () { UI.navigateTo('order-tracking'); });
  }

  // ─── VIEW: ORDER CREATION FORM ────────────────────────────────────────────
  function renderCreateForm(orderType) {
    const isFG = orderType === 'finished_good';
    const title = isFG ? 'Finished Good Order' : 'Casting Order';
    const refPrefix = isFG ? 'FGO' : 'CSO';
    const castRate = parseFloat(appSettings.casting_rate || 0);

    // Unique order ID preview
    const now = new Date();
    const yymmdd = String(now.getFullYear()).slice(2) + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0');
    const orderIdPreview = refPrefix + '-' + yymmdd + '-XXXX';

    // Build searchable combos
    const clientCombo = searchableCombo('orderClient',
      clients.map(function (c) {
        var label = (c.business_name || c.name || 'Unknown');
        if (c.phone_number) label += ' \u2014 ' + c.phone_number;
        return { value: c.id, label: label };
      }),
      '\u2014 Select Client \u2014'
    );

    var catCombo = null;
    var attrCombo = null;
    if (isFG) {
      catCombo = searchableCombo('filterCat',
        [{ value: '', label: 'All Categories' }].concat(fgCategories.map(function (c) { return { value: c.id, label: c.name }; })),
        'All Categories'
      );
    } else {
      attrCombo = searchableCombo('filterAttr',
        [{ value: '', label: 'All Attributes' }].concat(castAttributes.map(function (a) { return { value: a.id, label: a.name }; })),
        'All Attributes'
      );
    }

    const productCombo = searchableCombo('productPicker', [], '\u2014 Select Product \u2014');

    container.innerHTML = `
        <div class="page-header">
          <div>
            <button class="btn btn-secondary btn-sm" id="btnBackLanding" style="margin-bottom:0.5rem;">\u2190 Back</button>
            <h1 class="page-title">${esc(title)}</h1>
            <div style="display:flex;align-items:center;gap:0.75rem;margin-top:0.25rem;">
              <span class="text-muted text-sm">Order ID will be:</span>
              <code style="color:var(--gold-light);background:var(--bg-primary);padding:3px 10px;border-radius:6px;font-size:0.85rem;">${orderIdPreview}</code>
            </div>
          </div>
          <div style="display:flex;gap:0.5rem;">
            <button class="btn btn-secondary" id="btnPrintOrder">${UI.icon('printer')} Print</button>
            <button class="btn btn-primary" id="btnSubmitOrder">${UI.icon('check')} Create Order</button>
          </div>
        </div>

        <div class="card" style="margin-top:1rem;">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-md);">
            <div class="form-group">
              <label class="form-label">Client</label>
              ${clientCombo.html}
            </div>
            <div class="form-group">
              <label class="form-label">Notes</label>
              <input class="form-input" type="text" id="orderNotes" placeholder="Optional notes\u2026">
            </div>
          </div>
        </div>

        <!-- Product Picker -->
        <div class="card" style="margin-top:1rem;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem;flex-wrap:wrap;gap:0.5rem;">
            <h3 style="margin:0;font-size:1.1rem;">Products</h3>
            <div style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap;">
              ${isFG ? '<div style="width:170px;">' + catCombo.html + '</div>' : '<div style="width:170px;">' + attrCombo.html + '</div>'}
              <div style="min-width:220px;">${productCombo.html}</div>
              ${isFG ? '' : `
                <select class="form-input" id="qtyTypePicker" style="padding:0.35rem 0.5rem;font-size:0.85rem;">
                  <option value="pairs">Qty in Pairs</option>
                  <option value="weight">Qty in Weight (g)</option>
                </select>
              `}
              <button class="btn btn-primary btn-sm" id="btnAddProduct">${UI.icon('plus')} Add</button>
            </div>
          </div>

          <!-- Items table -->
          <div class="table-container">
            <table class="table" id="orderItemsTable">
              <thead>
                <tr>
                  <th style="width:50px;">Image</th>
                  <th>Product Code</th>
                  ${isFG ? '<th>Qty (Pairs)</th><th>Unit Price (\u20b9)</th>' : '<th>Qty</th><th>Type</th>'}
                  <th>Est. Value</th>
                  <th style="width:50px;"></th>
                </tr>
              </thead>
              <tbody id="orderItemsBody">
                <tr><td colspan="6" class="text-center text-muted" style="padding:2rem;">No products added yet.</td></tr>
              </tbody>
            </table>
          </div>

          <div style="display:flex;justify-content:flex-end;margin-top:1rem;padding:1rem;background:var(--bg-primary);border-radius:var(--radius-md);">
            <div style="text-align:right;">
              <div class="text-sm text-muted">Estimated Total</div>
              <div id="orderTotal" style="font-size:1.8rem;font-weight:700;color:var(--gold-light);">${formatCurrency(0)}</div>
              ${!isFG ? '<div class="text-xs text-muted">Casting Rate: \u20b9' + castRate + '/g</div>' : ''}
            </div>
          </div>
        </div>
        `;

    // Init combos
    clientCombo.init();

    // Product combo: populate and re-populate on filter change
    function buildProductOpts() {
      var catVal = '';
      var attrVal = '';
      var catHidden = document.getElementById('ss-val-filterCat');
      var attrHidden = document.getElementById('ss-val-filterAttr');
      if (catHidden) catVal = catHidden.value;
      if (attrHidden) attrVal = attrHidden.value;

      var prods = isFG ? fgProducts.slice() : castProducts.slice();
      if (isFG && catVal) prods = prods.filter(function (p) { return p.category_id === catVal; });
      if (!isFG && attrVal) prods = prods.filter(function (p) { return (p.attribute_ids || []).includes(attrVal); });

      var optsEl = document.getElementById('ss-opts-productPicker');
      if (!optsEl) return;

      var allOpts = [{ value: '', label: '\u2014 Select Product \u2014', price: 0, img: '', stdwt: 0 }];
      prods.forEach(function (p) {
        var code = isFG ? p.product_code : (p.casting_product_code || p.product_code);
        allOpts.push({
          value: code,
          label: code + ' (' + (p.qty != null ? p.qty : 0) + ' in stock)',
          price: p.price || 0,
          img: p.image_url || '',
          stdwt: p.std_weight || 0,
        });
      });

      optsEl.innerHTML = allOpts.map(function (o) {
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
    document.getElementById('btnPrintOrder').addEventListener('click', function () { window.print(); });

    orderItems = [];
  }

  function addProductRow(orderType) {
    const isFG = orderType === 'finished_good';
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

    var row = { product_code: code, image_url: img, qty: 1, qty_type: qtyType, unit_price: unitPrice, std_weight: stdWt };
    orderItems.push(row);
    renderItemsTable(orderType);
  }

  function renderItemsTable(orderType) {
    const isFG = orderType === 'finished_good';
    const castRate = parseFloat(appSettings.casting_rate || 0);
    const tbody = document.getElementById('orderItemsBody');

    if (orderItems.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted" style="padding:2rem;">No products added yet.</td></tr>';
      document.getElementById('orderTotal').textContent = formatCurrency(0);
      return;
    }

    tbody.innerHTML = orderItems.map(function (item, idx) {
      const estVal = isFG
        ? item.qty * item.unit_price
        : (item.qty_type === 'weight' ? item.qty * castRate : 0);

      const imgHTML = item.image_url
        ? '<img src="' + item.image_url + '" style="width:36px;height:36px;border-radius:4px;object-fit:cover;">'
        : '<div style="width:36px;height:36px;background:var(--bg-hover);border-radius:4px;display:flex;align-items:center;justify-content:center;">' + UI.icon('image') + '</div>';

      return '<tr>'
        + '<td>' + imgHTML + '</td>'
        + '<td><strong>' + esc(item.product_code) + '</strong></td>'
        + '<td><input type="number" min="0.001" step="0.001" value="' + item.qty + '" style="width:80px;" class="form-input" onchange="window.updateOrderRow(' + idx + ',\'qty\',this.value,\'' + orderType + '\')"></td>'
        + (isFG
          ? '<td><input type="number" min="0" step="0.01" value="' + item.unit_price + '" style="width:90px;" class="form-input" onchange="window.updateOrderRow(' + idx + ',\'unit_price\',this.value,\'' + orderType + '\')"></td>'
          : '<td>' + esc(item.qty_type) + '</td>')
        + '<td style="font-weight:600;color:var(--gold-light);">' + formatCurrency(estVal) + '</td>'
        + '<td><button class="btn btn-sm btn-danger" onclick="window.removeOrderRow(' + idx + ',\'' + orderType + '\')">' + UI.icon('trash') + '</button></td>'
        + '</tr>';
    }).join('');

    // Update total
    var total = 0;
    orderItems.forEach(function (item) {
      if (isFG) {
        total += item.qty * item.unit_price;
      } else {
        total += item.qty_type === 'weight' ? item.qty * castRate : 0;
      }
    });
    document.getElementById('orderTotal').textContent = formatCurrency(total);
  }

  window.updateOrderRow = function (idx, field, val, orderType) {
    if (!orderItems[idx]) return;
    if (field === 'qty') orderItems[idx].qty = parseFloat(val) || 0;
    if (field === 'unit_price') orderItems[idx].unit_price = parseFloat(val) || 0;
    renderItemsTable(orderType);
  };

  window.removeOrderRow = function (idx, orderType) {
    orderItems.splice(idx, 1);
    renderItemsTable(orderType);
  };

  async function submitOrder(orderType) {
    const isFG = orderType === 'finished_good';
    if (orderItems.length === 0) { UI.toast('Add at least one product', 'error'); return; }

    const castRate = parseFloat(appSettings.casting_rate || 0);
    var clientHidden = document.getElementById('ss-val-orderClient');
    const clientId = clientHidden ? clientHidden.value : '';
    const notes = document.getElementById('orderNotes').value;

    const payload = {
      order_type: orderType,
      client_id: clientId || null,
      notes: notes || null,
      items: orderItems.map(function (item) {
        return {
          product_code: item.product_code,
          image_url: item.image_url || null,
          qty: item.qty,
          qty_type: item.qty_type,
          unit_price: isFG ? item.unit_price : (item.qty_type === 'weight' ? item.qty * castRate : 0),
        };
      }),
    };

    try {
      const btn = document.getElementById('btnSubmitOrder');
      btn.disabled = true;
      btn.innerHTML = 'Creating...';

      const res = await api.createOrder(payload);
      UI.toast('Order ' + res.order_id + ' created!', 'success');
      orderItems = [];
      renderLanding();
    } catch (err) {
      UI.toast(err.message || 'Failed to create order', 'error');
      const btn = document.getElementById('btnSubmitOrder');
      if (btn) { btn.disabled = false; btn.innerHTML = UI.icon('check') + ' Create Order'; }
    }
  }

  // ─── VIEW: TRACKING LANDING (choose which type to view) ──────────────────
  function renderTrackingLanding() {
    container.innerHTML = `
        <div class="page-header">
          <div>
            <button class="btn btn-secondary btn-sm" id="btnBackToOrders" style="margin-bottom:0.5rem;">\u2190 Back</button>
            <h1 class="page-title">Order Tracking</h1>
            <p class="page-subtitle">Select the type of orders to view and track</p>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;margin-top:2rem;min-height:55vh;">

          <div id="trackFGO"
            style="background:linear-gradient(135deg,#1a1f2e 0%,#232a40 100%);
                   border:2px solid transparent; border-radius:var(--radius-lg);
                   padding:3rem 2rem; display:flex; flex-direction:column;
                   align-items:center; justify-content:center; gap:1.5rem;
                   cursor:pointer; transition:all 0.25s;"
            onmouseenter="this.style.borderColor='var(--gold-light)';this.style.transform='translateY(-4px)';this.style.boxShadow='0 20px 40px rgba(212,175,55,0.15)'"
            onmouseleave="this.style.borderColor='transparent';this.style.transform='';this.style.boxShadow=''"
          >
            <div style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,#f59e0b,#d97706);
                         display:flex;align-items:center;justify-content:center;font-size:2rem;
                         box-shadow:0 8px 24px rgba(245,158,11,0.4);">\ud83d\udce6</div>
            <div style="text-align:center;">
              <h2 style="font-size:1.6rem;font-weight:700;color:var(--text-primary);margin:0 0 0.5rem;">Finished Good Orders</h2>
              <p class="text-muted" style="max-width:280px;line-height:1.6;">Track and manage all FGO orders with per-item status updates.</p>
            </div>
            <button class="btn btn-primary" style="width:100%;max-width:200px;">View FGO Orders</button>
          </div>

          <div id="trackCSO"
            style="background:linear-gradient(135deg,#1a1f2e 0%,#232a40 100%);
                   border:2px solid transparent; border-radius:var(--radius-lg);
                   padding:3rem 2rem; display:flex; flex-direction:column;
                   align-items:center; justify-content:center; gap:1.5rem;
                   cursor:pointer; transition:all 0.25s;"
            onmouseenter="this.style.borderColor='#3b82f6';this.style.transform='translateY(-4px)';this.style.boxShadow='0 20px 40px rgba(59,130,246,0.15)'"
            onmouseleave="this.style.borderColor='transparent';this.style.transform='';this.style.boxShadow=''"
          >
            <div style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,#3b82f6,#1d4ed8);
                         display:flex;align-items:center;justify-content:center;font-size:2rem;
                         box-shadow:0 8px 24px rgba(59,130,246,0.4);">\ud83d\udd29</div>
            <div style="text-align:center;">
              <h2 style="font-size:1.6rem;font-weight:700;color:var(--text-primary);margin:0 0 0.5rem;">Casting Orders</h2>
              <p class="text-muted" style="max-width:280px;line-height:1.6;">Track and manage all CSO manufacturing orders with pipeline status.</p>
            </div>
            <button class="btn" style="width:100%;max-width:200px;background:linear-gradient(135deg,#3b82f6,#1d4ed8);color:#fff;">View CSO Orders</button>
          </div>
        </div>
        `;

    document.getElementById('btnBackToOrders').addEventListener('click', function () { renderLanding(); });
    document.getElementById('trackFGO').addEventListener('click', function () { renderTrackingList('finished_good'); });
    document.getElementById('trackCSO').addEventListener('click', function () { renderTrackingList('casting'); });
  }

  // ─── VIEW: TRACKING LIST ──────────────────────────────────────────────────
  async function renderTrackingList(orderType) {
    const isFG = orderType === 'finished_good';
    const title = isFG ? 'Finished Good Orders' : 'Casting Orders';
    const accentColor = isFG ? 'var(--gold-light)' : '#3b82f6';

    container.innerHTML = `
        <div class="page-header">
          <div>
            <button class="btn btn-secondary btn-sm" id="btnBackTracking" style="margin-bottom:0.5rem;">\u2190 Back</button>
            <h1 class="page-title">${esc(title)}</h1>
          </div>
          <input class="form-input" type="text" id="trackSearch" placeholder="Search order ID or client\u2026" style="width:220px;">
        </div>
        <div class="card" style="margin-top:1rem;">
          <div class="table-container">
            <table class="table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Client</th>
                  <th>Items</th>
                  <th>Est. Value</th>
                  <th>Date</th>
                  <th style="width:80px;">Actions</th>
                </tr>
              </thead>
              <tbody id="trackBody">
                <tr><td colspan="6" class="text-center"><div class="spinner"></div></td></tr>
              </tbody>
            </table>
          </div>
        </div>
        <div id="orderDetailPanel"></div>
        `;

    document.getElementById('btnBackTracking').addEventListener('click', function () { renderTrackingLanding(); });

    try {
      const resp = await api.getOrders();
      var all = resp.orders || [];
      var filtered = all.filter(function (o) { return o.order_type === orderType; });

      function doFilter() {
        var q = (document.getElementById('trackSearch') || {}).value || '';
        q = q.toLowerCase().trim();
        var result = filtered;
        if (q) {
          result = filtered.filter(function (o) {
            return o.order_id.toLowerCase().includes(q) ||
              ((o.client ? o.client.business_name || o.client.name : '') || '').toLowerCase().includes(q);
          });
        }
        renderTrackingTable(result, orderType, accentColor);
      }

      document.getElementById('trackSearch').addEventListener('input', doFilter);
      renderTrackingTable(filtered, orderType, accentColor);
    } catch (err) {
      document.getElementById('trackBody').innerHTML =
        '<tr><td colspan="6" class="text-error">Failed to load orders: ' + esc(err.message) + '</td></tr>';
    }
  }

  function renderTrackingTable(orders, orderType, accentColor) {
    const tbody = document.getElementById('trackBody');
    if (!orders.length) {
      tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state">No orders found.</div></td></tr>';
      return;
    }
    tbody.innerHTML = orders.map(function (o) {
      const itemCount = (o.order_items || []).length;
      const date = new Date(o.created_at).toLocaleDateString('en-IN');
      var clientName = o.client ? (o.client.business_name || o.client.name || '\u2014') : '\u2014';
      return '<tr style="cursor:pointer;" onclick="window.toggleOrderDetail(\'' + o.id + '\',\'' + orderType + '\')">'
        + '<td><strong style="color:' + accentColor + ';">' + esc(o.order_id) + '</strong></td>'
        + '<td>' + esc(clientName) + '</td>'
        + '<td>' + itemCount + ' item' + (itemCount !== 1 ? 's' : '') + '</td>'
        + '<td>' + formatCurrency(o.estimated_value) + '</td>'
        + '<td>' + date + '</td>'
        + '<td><div style="display:flex;gap:0.25rem;">'
        + '<button class="btn btn-sm btn-secondary" title="Print" onclick="event.stopPropagation();window.printOrder(\'' + o.id + '\')">' + UI.icon('printer') + '</button>'
        + (isAdmin ? '<button class="btn btn-sm btn-danger" title="Delete" onclick="event.stopPropagation();window.deleteOrderRow(\'' + o.id + '\',\'' + orderType + '\')">' + UI.icon('trash') + '</button>' : '')
        + '</div></td></tr>'
        + '<tr id="detail-' + o.id + '" style="display:none;"><td colspan="6" style="padding:0;">'
        + '<div id="detail-inner-' + o.id + '" style="padding:1rem;background:var(--bg-primary);border-radius:var(--radius-md);margin:0.5rem;"></div>'
        + '</td></tr>';
    }).join('');
  }

  window.toggleOrderDetail = async function (orderId, orderType) {
    const row = document.getElementById('detail-' + orderId);
    if (!row) return;
    const isShown = row.style.display !== 'none';
    // Collapse any others
    document.querySelectorAll('[id^="detail-"]').forEach(function (r) { if (!r.id.includes('inner')) r.style.display = 'none'; });
    if (isShown) return;

    const inner = document.getElementById('detail-inner-' + orderId);
    inner.innerHTML = '<div class="spinner" style="width:20px;height:20px;border-width:2px;"></div>';
    row.style.display = '';

    try {
      const resp = await api.getOrder(orderId);
      inner.innerHTML = renderOrderDetail(resp.order, orderType);
    } catch (err) {
      inner.innerHTML = '<span class="text-error">Failed to load: ' + esc(err.message) + '</span>';
    }
  };

  function renderOrderDetail(order, orderType) {
    const items = order.order_items || [];
    const castRate = parseFloat(appSettings.casting_rate || 0);
    const isFG = orderType === 'finished_good';

    const itemRows = items.map(function (item) {
      const estVal = isFG
        ? item.qty * item.unit_price
        : (item.qty_type === 'weight' ? item.qty * castRate : 0);

      const imgHTML = item.image_url
        ? '<img src="' + item.image_url + '" style="width:32px;height:32px;border-radius:4px;object-fit:cover;">'
        : '<div style="width:32px;height:32px;background:var(--bg-hover);border-radius:4px;display:flex;align-items:center;justify-content:center;color:var(--text-muted);">' + UI.icon('image') + '</div>';

      const statusOpts = ALL_STATUSES.map(function (s) {
        return '<option value="' + s + '" ' + (item.status === s ? 'selected' : '') + '>' + s + '</option>';
      }).join('');

      return '<tr>'
        + '<td>' + imgHTML + '</td>'
        + '<td><strong>' + esc(item.product_code) + '</strong></td>'
        + '<td>' + item.qty + ' ' + (item.qty_type || 'pairs') + '</td>'
        + '<td>' + (isFG ? formatCurrency(item.unit_price) : '\u20b9' + castRate + '/g') + '</td>'
        + '<td>' + formatCurrency(estVal) + '</td>'
        + '<td><select class="form-input" style="padding:0.2rem 0.4rem;font-size:0.8rem;" onchange="window.updateItemStatus(\'' + item.id + '\',\'' + order.id + '\',this.value)">' + statusOpts + '</select></td>'
        + '</tr>';
    }).join('');

    var clientName = order.client ? (order.client.business_name || order.client.name || '\u2014') : '\u2014';

    return '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.75rem;">'
      + '<div><span style="font-size:0.85rem;color:var(--text-muted);">Client: </span><strong>' + esc(clientName) + '</strong>'
      + (order.notes ? '<span class="text-muted text-sm"> \u00b7 ' + esc(order.notes) + '</span>' : '')
      + '</div>'
      + '<div style="font-size:1.1rem;font-weight:700;color:var(--gold-light);">' + formatCurrency(order.estimated_value) + '</div>'
      + '</div>'
      + '<table class="table" style="font-size:0.85rem;"><thead><tr>'
      + '<th style="width:40px;">Image</th><th>Product Code</th><th>Qty</th>'
      + '<th>' + (isFG ? 'Unit Price' : 'Rate') + '</th><th>Est. Value</th>'
      + '<th style="width:180px;">Status</th></tr></thead>'
      + '<tbody>' + itemRows + '</tbody></table>';
  }

  window.updateItemStatus = async function (itemId, orderId, status) {
    try {
      await api.updateOrderItem(itemId, { status: status });
      UI.toast('Status updated', 'success');
    } catch (err) {
      UI.toast(err.message || 'Failed to update status', 'error');
    }
  };

  window.deleteOrderRow = async function (orderId, orderType) {
    const confirmed = await UI.confirm('Delete Order', 'Are you sure you want to permanently delete this order and all its items?');
    if (!confirmed) return;
    try {
      await api.deleteOrder(orderId);
      UI.toast('Order deleted', 'success');
      renderTrackingList(orderType);
    } catch (err) {
      UI.toast(err.message || 'Failed to delete order', 'error');
    }
  };

  window.printOrder = async function (orderId) {
    try {
      const resp = await api.getOrder(orderId);
      var order = resp.order;
      const items = order.order_items || [];
      const castRate = parseFloat(appSettings.casting_rate || 0);
      const isFG = order.order_type === 'finished_good';

      const rows = items.map(function (item) {
        const estVal = isFG ? item.qty * item.unit_price : (item.qty_type === 'weight' ? item.qty * castRate : 0);
        return '<tr>'
          + '<td>' + esc(item.product_code) + '</td>'
          + '<td>' + item.qty + ' ' + (item.qty_type || 'pairs') + '</td>'
          + '<td>' + (isFG ? formatCurrency(item.unit_price) : '\u20b9' + castRate + '/g') + '</td>'
          + '<td>' + formatCurrency(estVal) + '</td>'
          + '<td>' + esc(item.status) + '</td>'
          + '</tr>';
      }).join('');

      var clientName = order.client ? (order.client.business_name || order.client.name || '\u2014') : '\u2014';

      const win = window.open('', '_blank');
      win.document.write('<!DOCTYPE html><html><head><title>' + order.order_id + '</title>'
        + '<style>'
        + 'body { font-family: Arial, sans-serif; padding: 2rem; color: #111; }'
        + 'h1 { font-size: 1.4rem; } h2 { font-size: 1rem; color: #666; }'
        + 'table { width:100%; border-collapse:collapse; margin-top:1rem; }'
        + 'th { background:#f5f5f5; padding:8px 10px; text-align:left; border-bottom:2px solid #ddd; }'
        + 'td { padding:7px 10px; border-bottom:1px solid #eee; }'
        + '.total { text-align:right; font-size:1.1rem; font-weight:700; margin-top:1rem; }'
        + '@media print { button { display:none; } }'
        + '</style></head><body>'
        + '<h1>Order: ' + esc(order.order_id) + '</h1>'
        + '<h2>Client: ' + esc(clientName) + ' | Type: ' + esc(order.order_type) + '</h2>'
        + (order.notes ? '<p>Notes: ' + esc(order.notes) + '</p>' : '')
        + '<table><thead><tr><th>Product Code</th><th>Qty</th><th>Rate</th><th>Est. Value</th><th>Status</th></tr></thead>'
        + '<tbody>' + rows + '</tbody></table>'
        + '<div class="total">Estimated Total: ' + formatCurrency(order.estimated_value) + '</div>'
        + '<script>window.onload=function(){window.print();window.close();}<\/script>'
        + '</body></html>');
      win.document.close();
    } catch (err) {
      UI.toast(err.message || 'Failed to print', 'error');
    }
  };

  // ─── PRINT STYLES (inject once) ──────────────────────────────────────────
  if (!document.getElementById('orderPrintStyle')) {
    const style = document.createElement('style');
    style.id = 'orderPrintStyle';
    style.textContent = '@media print { .sidebar, .topbar, .btn, select, input { display: none !important; } .card { box-shadow: none !important; border: 1px solid #ddd; } }';
    document.head.appendChild(style);
  }

  // ─── BOOT ─────────────────────────────────────────────────────────────────
  container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:200px;"><div class="spinner"></div></div>';
  try {
    await loadReferenceData();
    renderLanding();
  } catch (err) {
    container.innerHTML = '<div class="text-error" style="padding:2rem;">Failed to load page data: ' + esc(err.message) + '</div>';
  }
})();
