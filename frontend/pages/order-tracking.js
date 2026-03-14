/**
 * Jai Gems — Order Tracking Page (standalone)
 * Renders the tracking type-selector landing directly.
 */
(async function () {
    const container = document.getElementById('pageContent');

    // ─── Shared helpers ───────────────────────────────────────────────────────
    let appSettings = {};

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
        'Open': '#6b7280', 'Wax Inprogress': '#f59e0b', 'Wax Complete': '#10b981',
        'Wax Tree Inprogress': '#f59e0b', 'Wax Tree Complete': '#10b981',
        'Casting': '#3b82f6', 'Jhalai': '#8b5cf6', 'Plating': '#ec4899',
        'Stone': '#06b6d4', 'Packed': '#14b8a6', 'Billed': '#22c55e',
        'Canceled': '#ef4444', 'In Stock': '#f59e0b',
    };

    function formatCurrency(n) {
        return '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    // ─── LANDING: choose FG or Casting tracking ───────────────────────────────
    function renderLanding() {
        container.innerHTML = `
        <div class="page-header">
          <div>
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
                         box-shadow:0 8px 24px rgba(245,158,11,0.4);">📦</div>
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
                         box-shadow:0 8px 24px rgba(59,130,246,0.4);">🔩</div>
            <div style="text-align:center;">
              <h2 style="font-size:1.6rem;font-weight:700;color:var(--text-primary);margin:0 0 0.5rem;">Casting Orders</h2>
              <p class="text-muted" style="max-width:280px;line-height:1.6;">Track and manage all CSO manufacturing orders with pipeline status.</p>
            </div>
            <button class="btn" style="width:100%;max-width:200px;background:linear-gradient(135deg,#3b82f6,#1d4ed8);color:#fff;">View CSO Orders</button>
          </div>
        </div>
        `;

        document.getElementById('trackFGO').addEventListener('click', () => renderTrackingList('finished_good'));
        document.getElementById('trackCSO').addEventListener('click', () => renderTrackingList('casting'));
    }

    // ─── ORDER LIST ───────────────────────────────────────────────────────────
    async function renderTrackingList(orderType) {
        const isFG = orderType === 'finished_good';
        const title = isFG ? 'Finished Good Orders' : 'Casting Orders';
        const accentColor = isFG ? 'var(--gold-light)' : '#3b82f6';
        const isAdmin = Auth.getUser()?.role === 'admin';

        container.innerHTML = `
        <div class="page-header">
          <div>
            <button class="btn btn-secondary btn-sm" id="btnBackTracking" style="margin-bottom:0.5rem;">← Back</button>
            <h1 class="page-title">${esc(title)}</h1>
          </div>
          <input class="form-input" type="text" id="trackSearch" placeholder="Search order ID or client…" style="width:220px;">
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

        document.getElementById('btnBackTracking').addEventListener('click', renderLanding);

        try {
            const settingsRes = await api.getAppSettings();
            appSettings = settingsRes.settings || {};

            const { orders: all } = await api.getOrders();
            let filtered = (all || []).filter(o => o.order_type === orderType);

            function doFilter() {
                const q = (document.getElementById('trackSearch')?.value || '').toLowerCase().trim();
                renderTrackingTable(
                    q ? filtered.filter(o =>
                        o.order_id.toLowerCase().includes(q) ||
                        (o.client?.name || '').toLowerCase().includes(q)
                    ) : filtered,
                    orderType, accentColor, isAdmin
                );
            }

            document.getElementById('trackSearch').addEventListener('input', doFilter);
            renderTrackingTable(filtered, orderType, accentColor, isAdmin);
        } catch (err) {
            document.getElementById('trackBody').innerHTML =
                `<tr><td colspan="6" class="text-error">Failed to load orders: ${esc(err.message)}</td></tr>`;
        }
    }

    function renderTrackingTable(orders, orderType, accentColor, isAdmin) {
        const tbody = document.getElementById('trackBody');
        if (!orders.length) {
            tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state">No orders found.</div></td></tr>`;
            return;
        }
        tbody.innerHTML = orders.map(o => {
            const itemCount = (o.order_items || []).length;
            const date = new Date(o.created_at).toLocaleDateString('en-IN');
            return `
            <tr style="cursor:pointer;" onclick="window._otToggleDetail('${o.id}','${orderType}')">
              <td><strong style="color:${accentColor};">${esc(o.order_id)}</strong></td>
              <td>${esc(o.client?.name || '—')}</td>
              <td>${itemCount} item${itemCount !== 1 ? 's' : ''}</td>
              <td>${formatCurrency(o.estimated_value)}</td>
              <td>${date}</td>
              <td>
                <div style="display:flex;gap:0.25rem;">
                  <button class="btn btn-sm btn-secondary" title="Print"
                    onclick="event.stopPropagation();window._otPrint('${o.id}')">${UI.icon('printer')}</button>
                  ${isAdmin ? `<button class="btn btn-sm btn-danger" title="Delete"
                    onclick="event.stopPropagation();window._otDelete('${o.id}','${orderType}')">${UI.icon('trash')}</button>` : ''}
                </div>
              </td>
            </tr>
            <tr id="ot-detail-${o.id}" style="display:none;">
              <td colspan="6" style="padding:0;">
                <div id="ot-inner-${o.id}" style="padding:1rem;background:var(--bg-primary);border-radius:var(--radius-md);margin:0.5rem;"></div>
              </td>
            </tr>`;
        }).join('');
    }

    window._otToggleDetail = async function (orderId, orderType) {
        const row = document.getElementById(`ot-detail-${orderId}`);
        if (!row) return;
        const isShown = row.style.display !== 'none';
        document.querySelectorAll('[id^="ot-detail-"]').forEach(r => { r.style.display = 'none'; });
        if (isShown) return;

        const inner = document.getElementById(`ot-inner-${orderId}`);
        inner.innerHTML = `<div class="spinner" style="width:20px;height:20px;border-width:2px;"></div>`;
        row.style.display = '';

        try {
            const { order } = await api.getOrder(orderId);
            inner.innerHTML = renderDetail(order, orderType);
        } catch (err) {
            inner.innerHTML = `<span class="text-error">Failed to load: ${esc(err.message)}</span>`;
        }
    };

    function renderDetail(order, orderType) {
        const isFG = orderType === 'finished_good';
        const castRate = parseFloat(appSettings.casting_rate || 0);
        const items = order.order_items || [];

        const rows = items.map(item => {
            const estVal = isFG ? item.qty * item.unit_price : (item.qty_type === 'weight' ? item.qty * castRate : 0);
            const imgHTML = item.image_url
                ? `<img src="${item.image_url}" style="width:32px;height:32px;border-radius:4px;object-fit:cover;">`
                : `<div style="width:32px;height:32px;background:var(--bg-hover);border-radius:4px;"></div>`;
            const opts = ALL_STATUSES.map(s =>
                `<option value="${s}" ${item.status === s ? 'selected' : ''}>${s}</option>`
            ).join('');
            return `
            <tr>
              <td>${imgHTML}</td>
              <td><strong>${esc(item.product_code)}</strong></td>
              <td>${item.qty} ${item.qty_type || 'pairs'}</td>
              <td>${isFG ? formatCurrency(item.unit_price) : `₹${castRate}/g`}</td>
              <td>${formatCurrency(estVal)}</td>
              <td>
                <select class="form-input" style="padding:0.2rem 0.4rem;font-size:0.8rem;"
                  onchange="window._otUpdateStatus('${item.id}',this.value)">${opts}
                </select>
              </td>
            </tr>`;
        }).join('');

        return `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.75rem;">
          <div>
            <span class="text-muted text-sm">Client: </span>
            <strong>${esc(order.client?.name || '—')}</strong>
            ${order.notes ? `<span class="text-muted text-sm"> · ${esc(order.notes)}</span>` : ''}
          </div>
          <div style="font-size:1.1rem;font-weight:700;color:var(--gold-light);">${formatCurrency(order.estimated_value)}</div>
        </div>
        <table class="table" style="font-size:0.85rem;">
          <thead><tr>
            <th style="width:40px;">Img</th><th>Code</th><th>Qty</th>
            <th>${isFG ? 'Unit Price' : 'Rate'}</th><th>Est. Value</th>
            <th style="width:180px;">Status</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>`;
    }

    window._otUpdateStatus = async function (itemId, status) {
        try {
            await api.updateOrderItem(itemId, { status });
            UI.toast('Status updated', 'success');
        } catch (err) {
            UI.toast(err.message || 'Failed to update', 'error');
        }
    };

    window._otDelete = async function (orderId, orderType) {
        const ok = await UI.confirm('Delete Order', 'Permanently delete this order and all items?');
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
            const { order } = await api.getOrder(orderId);
            const isFG = order.order_type === 'finished_good';
            const castRate = parseFloat(appSettings.casting_rate || 0);
            const rows = (order.order_items || []).map(item => {
                const estVal = isFG ? item.qty * item.unit_price : (item.qty_type === 'weight' ? item.qty * castRate : 0);
                return `<tr>
                  <td>${esc(item.product_code)}</td>
                  <td>${item.qty} ${item.qty_type || ''}</td>
                  <td>${isFG ? formatCurrency(item.unit_price) : `₹${castRate}/g`}</td>
                  <td>${formatCurrency(estVal)}</td>
                  <td>${esc(item.status)}</td>
                </tr>`;
            }).join('');
            const win = window.open('', '_blank');
            win.document.write(`<!DOCTYPE html><html><head><title>${order.order_id}</title>
            <style>body{font-family:Arial,sans-serif;padding:2rem;color:#111;}
            table{width:100%;border-collapse:collapse;}th{background:#f5f5f5;padding:8px;text-align:left;border-bottom:2px solid #ddd;}
            td{padding:7px 10px;border-bottom:1px solid #eee;}.total{text-align:right;font-size:1.1rem;font-weight:700;margin-top:1rem;}</style>
            </head><body>
            <h1>${esc(order.order_id)}</h1>
            <h2>Client: ${esc(order.client?.name || '—')} | ${esc(order.order_type)}</h2>
            ${order.notes ? `<p>Notes: ${esc(order.notes)}</p>` : ''}
            <table><thead><tr><th>Code</th><th>Qty</th><th>Rate</th><th>Est. Value</th><th>Status</th></tr></thead>
            <tbody>${rows}</tbody></table>
            <div class="total">Total: ${formatCurrency(order.estimated_value)}</div>
            <script>window.onload=()=>{window.print();window.close();}<\/script>
            </body></html>`);
            win.document.close();
        } catch (err) {
            UI.toast(err.message || 'Failed to print', 'error');
        }
    };

    // ─── Boot ─────────────────────────────────────────────────────────────────
    renderLanding();
})();
