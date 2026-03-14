/**
 * Jai Gems - Order Tracking Page (standalone)
 */
(async function () {
  var container = document.getElementById('pageContent');
  var isAdmin = Auth.getUser()?.role === 'admin';
  var appSettings = {};

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

  // ---- LANDING ----
  function renderLanding() {
    container.innerHTML = '<div class="page-header"><div>'
      + '<h1 class="page-title">Order Tracking</h1>'
      + '<p class="page-subtitle">Select order type to track</p>'
      + '</div></div>'

      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;margin-top:2rem;min-height:55vh;">'

      + '<div id="trackFGO" style="background:linear-gradient(135deg,#1a1f2e,#232a40);border:2px solid transparent;border-radius:var(--radius-lg);'
      + 'padding:3rem 2rem;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1.5rem;cursor:pointer;transition:all 0.25s;"'
      + ' onmouseenter="this.style.borderColor=\'var(--gold-light)\';this.style.transform=\'translateY(-4px)\'"'
      + ' onmouseleave="this.style.borderColor=\'transparent\';this.style.transform=\'\'">'
      + '<div style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,#f59e0b,#d97706);display:flex;align-items:center;justify-content:center;font-size:2rem;box-shadow:0 8px 24px rgba(245,158,11,0.4);">\ud83d\udce6</div>'
      + '<div style="text-align:center;"><h2 style="font-size:1.6rem;font-weight:700;color:var(--text-primary);margin:0 0 0.5rem;">Finished Good Orders</h2>'
      + '<p class="text-muted" style="max-width:280px;line-height:1.6;">Track and manage all FGO orders with per-item status updates.</p></div>'
      + '<button class="btn btn-primary" style="width:100%;max-width:200px;">View FGO Orders</button></div>'

      + '<div id="trackCSO" style="background:linear-gradient(135deg,#1a1f2e,#232a40);border:2px solid transparent;border-radius:var(--radius-lg);'
      + 'padding:3rem 2rem;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1.5rem;cursor:pointer;transition:all 0.25s;"'
      + ' onmouseenter="this.style.borderColor=\'#3b82f6\';this.style.transform=\'translateY(-4px)\'"'
      + ' onmouseleave="this.style.borderColor=\'transparent\';this.style.transform=\'\'">'
      + '<div style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,#3b82f6,#1d4ed8);display:flex;align-items:center;justify-content:center;font-size:2rem;box-shadow:0 8px 24px rgba(59,130,246,0.4);">\ud83d\udd29</div>'
      + '<div style="text-align:center;"><h2 style="font-size:1.6rem;font-weight:700;color:var(--text-primary);margin:0 0 0.5rem;">Casting Orders</h2>'
      + '<p class="text-muted" style="max-width:280px;line-height:1.6;">Track and manage all CSO manufacturing orders.</p></div>'
      + '<button class="btn" style="width:100%;max-width:200px;background:linear-gradient(135deg,#3b82f6,#1d4ed8);color:#fff;">View CSO Orders</button></div>'
      + '</div>';

    document.getElementById('trackFGO').addEventListener('click', function () { renderTrackingList('finished_good'); });
    document.getElementById('trackCSO').addEventListener('click', function () { renderTrackingList('casting'); });
  }

  // ---- ORDER LIST ----
  async function renderTrackingList(orderType) {
    var isFG = orderType === 'finished_good';
    var title = isFG ? 'Finished Good Orders' : 'Casting Orders';
    var accentColor = isFG ? 'var(--gold-light)' : '#3b82f6';

    container.innerHTML = '<div class="page-header"><div>'
      + '<button class="btn btn-secondary btn-sm" id="btnBackTracking" style="margin-bottom:0.5rem;">\u2190 Back</button>'
      + '<h1 class="page-title">' + esc(title) + '</h1></div>'
      + '<div style="display:flex;gap:0.5rem;align-items:center;">'
      + '<select class="form-input" id="trackFilterStatus" style="width:150px;">'
      + '<option value="">All Statuses</option>'
      + ALL_STATUSES.map(function (s) { return '<option value="' + s + '">' + s + '</option>'; }).join('')
      + '</select>'
      + '<select class="form-input" id="trackSort" style="width:150px;">'
      + '<option value="date_desc">Newest First</option>'
      + '<option value="date_asc">Oldest First</option>'
      + '<option value="val_desc">Value: High to Low</option>'
      + '<option value="val_asc">Value: Low to High</option>'
      + '</select>'
      + '<input class="form-input" type="text" id="trackSearch" placeholder="Search order ID or client\u2026" style="width:200px;">'
      + '</div>'
      + '</div>'
      + '<div class="card" style="margin-top:1rem;"><div class="table-container">'
      + '<table class="table"><thead><tr>'
      + '<th>Order ID</th><th>Client</th><th>Items</th><th>Est. Value</th><th>Date</th><th style="width:100px;">Actions</th>'
      + '</tr></thead><tbody id="trackBody">'
      + '<tr><td colspan="6" class="text-center"><div class="spinner"></div></td></tr>'
      + '</tbody></table></div></div>'
      + '<div id="orderDetailPanel"></div>';

    document.getElementById('btnBackTracking').addEventListener('click', function () { renderLanding(); });

    try {
      var settingsRes = await api.getAppSettings();
      appSettings = settingsRes.settings || {};

      var resp = await api.getOrders();
      var all = resp.orders || [];
      var filtered = all.filter(function (o) { return o.order_type === orderType; });

      function doFilter() {
        var q = (document.getElementById('trackSearch') || {}).value || '';
        var stat = (document.getElementById('trackFilterStatus') || {}).value || '';
        var sort = (document.getElementById('trackSort') || {}).value || 'date_desc';
        q = q.toLowerCase().trim();
        var result = filtered.slice();

        if (q) {
          result = result.filter(function (o) {
            var cn = o.client ? (o.client.business_name || o.client.name || '') : '';
            return o.order_id.toLowerCase().includes(q) || cn.toLowerCase().includes(q);
          });
        }

        if (stat) {
          result = result.filter(function (o) {
            if (!o.order_items) return false;
            return o.order_items.some(function (i) { return i.status === stat; });
          });
        }

        result.sort(function (a, b) {
          if (sort === 'date_desc') return new Date(b.created_at) - new Date(a.created_at);
          if (sort === 'date_asc') return new Date(a.created_at) - new Date(b.created_at);
          if (sort === 'val_desc') return (b.estimated_value || 0) - (a.estimated_value || 0);
          if (sort === 'val_asc') return (a.estimated_value || 0) - (b.estimated_value || 0);
          return 0;
        });

        renderTable(result, orderType, accentColor);
      }

      window._triggerOTFilter = doFilter;
      window._otCurrentData = filtered;

      document.getElementById('trackSearch').addEventListener('input', doFilter);
      document.getElementById('trackFilterStatus').addEventListener('change', doFilter);
      document.getElementById('trackSort').addEventListener('change', doFilter);
      doFilter();
    } catch (err) {
      document.getElementById('trackBody').innerHTML = '<tr><td colspan="6" class="text-error">Failed to load orders: ' + esc(err.message) + '</td></tr>';
    }
  }

  function renderTable(orders, orderType, accentColor) {
    var tbody = document.getElementById('trackBody');
    if (!orders.length) {
      tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state">No orders found.</div></td></tr>';
      return;
    }
    tbody.innerHTML = orders.map(function (o) {
      var itemCount = (o.order_items || []).length;
      var date = new Date(o.created_at).toLocaleDateString('en-IN');
      var clientName = o.client ? (o.client.business_name || o.client.name || '\u2014') : '\u2014';
      return '<tr style="cursor:pointer;" onclick="window._otToggleDetail(\'' + o.id + '\',\'' + orderType + '\')">'
        + '<td><strong style="color:' + accentColor + ';">' + esc(o.order_id) + '</strong></td>'
        + '<td>' + esc(clientName) + '</td>'
        + '<td>' + itemCount + ' item' + (itemCount !== 1 ? 's' : '') + '</td>'
        + '<td>' + formatCurrency(o.estimated_value) + '</td>'
        + '<td>' + date + '</td>'
        + '<td><div style="display:flex;gap:0.25rem;">'
        + '<button class="btn btn-sm btn-secondary" title="Print" onclick="event.stopPropagation();window._otPrint(\'' + o.id + '\')">' + UI.icon('printer') + '</button>'
        + (isAdmin ? '<button class="btn btn-sm btn-danger" title="Delete" onclick="event.stopPropagation();window._otDelete(\'' + o.id + '\',\'' + orderType + '\')">' + UI.icon('trash') + '</button>' : '')
        + '</div></td></tr>'
        + '<tr id="ot-detail-' + o.id + '" style="display:none;"><td colspan="6" style="padding:0;">'
        + '<div id="ot-inner-' + o.id + '" style="padding:1rem;background:var(--bg-primary);border-radius:var(--radius-md);margin:0.5rem;"></div>'
        + '</td></tr>';
    }).join('');
  }

  window._otToggleDetail = async function (orderId, orderType) {
    var row = document.getElementById('ot-detail-' + orderId);
    if (!row) return;
    var isShown = row.style.display !== 'none';
    document.querySelectorAll('[id^="ot-detail-"]').forEach(function (r) { r.style.display = 'none'; });
    if (isShown) return;

    var inner = document.getElementById('ot-inner-' + orderId);
    inner.innerHTML = '<div class="spinner" style="width:20px;height:20px;border-width:2px;"></div>';
    row.style.display = '';

    try {
      var resp = await api.getOrder(orderId);
      inner.innerHTML = renderDetail(resp.order, orderType);
    } catch (err) {
      inner.innerHTML = '<span class="text-error">Failed to load: ' + esc(err.message) + '</span>';
    }
  };

  function renderDetail(order, orderType) {
    var isFG = orderType === 'finished_good';
    var castRate = parseFloat(appSettings.casting_rate || 0);
    var items = order.order_items || [];
    var clientName = order.client ? (order.client.business_name || order.client.name || '\u2014') : '\u2014';

    var rows = items.map(function (item) {
      var imgHTML = item.image_url
        ? '<img src="' + item.image_url + '" style="width:32px;height:32px;border-radius:4px;object-fit:cover;cursor:pointer;" onclick="UI.showImage(this.src)">'
        : '<div style="width:32px;height:32px;background:var(--bg-hover);border-radius:4px;"></div>';
      var opts = ALL_STATUSES.map(function (s) {
        return '<option value="' + s + '" ' + (item.status === s ? 'selected' : '') + '>' + s + '</option>';
      }).join('');
      return '<tr><td>' + imgHTML + '</td>'
        + '<td><strong>' + esc(item.product_code) + '</strong></td>'
        + '<td>' + item.qty + ' ' + (item.qty_type || 'pairs') + '</td>'
        + '<td><select class="form-input" style="padding:0.2rem 0.4rem;font-size:0.8rem;" onchange="window._otUpdateStatus(\'' + item.id + '\',this.value,\'' + order.id + '\')">' + opts + '</select></td>'
        + '</tr>';
    }).join('');

    return '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.75rem;">'
      + '<div><span class="text-muted text-sm">Client: </span><strong>' + esc(clientName) + '</strong>'
      + (order.notes ? '<span class="text-muted text-sm"> \u00b7 ' + esc(order.notes) + '</span>' : '') + '</div>'
      + '<div style="font-size:1.1rem;font-weight:700;color:var(--gold-light);">' + formatCurrency(order.estimated_value) + '</div></div>'
      + '<table class="table" style="font-size:0.85rem;"><thead><tr>'
      + '<th style="width:40px;">Img</th><th>Code</th><th>Qty</th>'
      + '<th style="width:180px;">Status</th></tr></thead>'
      + '<tbody>' + rows + '</tbody></table>';
  }

  window._otUpdateStatus = async function (itemId, status, orderId) {
    try {
      await api.updateOrderItem(itemId, { status: status });
      UI.toast('Status updated', 'success');

      if (window._otCurrentData) {
        var order = window._otCurrentData.find(function (o) { return o.id === orderId; });
        if (order && order.order_items) {
          var item = order.order_items.find(function (i) { return i.id === itemId; });
          if (item) item.status = status;
        }
        if (window._triggerOTFilter) window._triggerOTFilter(); // re-evaluates filters instantly
      }
    } catch (err) {
      UI.toast(err.message || 'Failed to update', 'error');
    }
  };

  window._otDelete = async function (orderId, orderType) {
    var ok = await UI.confirm('Delete Order', 'Permanently delete this order and all items?');
    if (!ok) return;
    try {
      await api.deleteOrder(orderId);
      UI.toast('Order deleted', 'success');
      renderTrackingList(orderType);
    } catch (err) {
      UI.toast(err.message || 'Failed to delete', 'error');
    }
  };

  window._otPrint = async function (orderId) {
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
  renderLanding();
})();
