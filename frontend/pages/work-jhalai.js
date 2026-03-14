(async function () {
  const container = document.getElementById('pageContent');
  if (!container) return;

  const SLIP_TYPE = 'Jhalai';
  const SLIP_TYPE_LOWER = 'jhalai';
  const NEXT_STATUS = 'Jhalai Inprogress';

  let pendingItems = [];
  let currentOrderType = 'finished_good';
  let selectedItemIds = new Set();
  let currentSlipsView = 'slip'; // 'slip' or 'product'

  async function init() {
    renderLanding();
  }

  function renderLanding() {
    container.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">${SLIP_TYPE} Distribution</h1>
          <p class="page-subtitle">Manage work assignments and tracking</p>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));gap:1.5rem;margin-top:2rem;">
        <div class="card p-6 flex flex-col items-center justify-center gap-4 cursor-pointer hover-scale" id="cardAssign">
          <div class="icon-circle bg-primary text-2xl">${UI.icon('plus')}</div>
          <h2 class="text-xl font-bold">Assign Work</h2>
          <p class="text-muted text-center">Batch pending orders into new work slips.</p>
        </div>
        <div class="card p-6 flex flex-col items-center justify-center gap-4 cursor-pointer hover-scale" id="cardCurrent">
          <div class="icon-circle bg-warning text-2xl">${UI.icon('clock')}</div>
          <h2 class="text-xl font-bold">Current Work</h2>
          <p class="text-muted text-center">Track and complete active work slips.</p>
        </div>
        <div class="card p-6 flex flex-col items-center justify-center gap-4 cursor-pointer hover-scale" id="cardHistory">
          <div class="icon-circle bg-success text-2xl">${UI.icon('calendar')}</div>
          <h2 class="text-xl font-bold">History</h2>
          <p class="text-muted text-center">View completed work slip archives.</p>
        </div>
      </div>
    `;

    document.getElementById('cardAssign').onclick = renderAssignment;
    document.getElementById('cardCurrent').onclick = () => renderSlipsView('In Progress');
    document.getElementById('cardHistory').onclick = () => renderSlipsView('Completed');
  }

  async function renderAssignment() {
    container.innerHTML = `
      <div class="page-header">
        <div>
          <button class="btn btn-sm btn-secondary mb-2" id="btnBack">← Back</button>
          <h1 class="page-title">Assign ${SLIP_TYPE} Work</h1>
        </div>
        <button class="btn btn-primary" id="btnGenerateSlip" disabled>
          ${UI.icon('printer')} Generate Slip (0)
        </button>
      </div>
      <div class="card p-6">
        <div class="view-toggles mb-4">
           <button class="btn btn-sm" id="tabFg">Finished Goods</button>
           <button class="btn btn-sm" id="tabCasting">Casting</button>
        </div>
        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th style="width:40px;"><input type="checkbox" id="selectAll"></th>
                <th>Order Date</th><th>Client</th><th>Product Code</th><th>Priority</th><th>Qty</th><th>Slip Qty</th>
              </tr>
            </thead>
            <tbody id="pendingBody"></tbody>
          </table>
        </div>
      </div>
    `;

    document.getElementById('btnBack').onclick = renderLanding;
    document.getElementById('tabFg').onclick = () => switchAssignTab('finished_good');
    document.getElementById('tabCasting').onclick = () => switchAssignTab('casting');
    document.getElementById('btnGenerateSlip').onclick = generateSlip;
    document.getElementById('selectAll').onchange = (e) => toggleSelectAll(e.target.checked);

    await loadPending();
    switchAssignTab('finished_good');
  }

  function switchAssignTab(type) {
    currentOrderType = type;
    selectedItemIds.clear();
    const tabFg = document.getElementById('tabFg');
    const tabCasting = document.getElementById('tabCasting');
    
    tabFg.className = `btn btn-sm ${type === 'finished_good' ? 'btn-primary' : 'btn-ghost'}`;
    tabCasting.className = `btn btn-sm ${type === 'casting' ? 'btn-primary' : 'btn-ghost'}`;
    
    autoSelectTop20();
    renderPendingTable();
  }

  async function loadPending() {
    const res = await api.getPendingSlips(SLIP_TYPE_LOWER);
    pendingItems = res.pendingItems || [];
  }

  function autoSelectTop20() {
    const items = pendingItems.filter(i => i.order_type === currentOrderType);
    const limit = Math.min(items.length, 20);
    for (let i = 0; i < limit; i++) selectedItemIds.add(items[i].id);
    updateGenBtn();
  }

  function renderPendingTable() {
    const items = pendingItems.filter(i => i.order_type === currentOrderType);
    const body = document.getElementById('pendingBody');
    if (!body) return;
    if (!items.length) {
      body.innerHTML = `<tr><td colspan="7" class="text-center p-8 text-muted">No pending items.</td></tr>`;
      return;
    }
    body.innerHTML = items.map(item => {
      const isChecked = selectedItemIds.has(item.id);
      return `
        <tr onclick="toggleItem('${item.id}')" style="cursor:pointer" class="${isChecked ? 'bg-primary-light' : ''}">
          <td data-label="Select"><input type="checkbox" ${isChecked ? 'checked' : ''} onclick="event.stopPropagation()"></td>
          <td data-label="Date">${new Date(item.order_date).toLocaleDateString()}</td>
          <td data-label="Client">${item.client_nickname}</td>
          <td data-label="Code">${item.product_code}</td>
          <td data-label="Priority"><span class="badge ${item.priority === 'Urgent' ? 'badge-danger' : 'badge-outline'}">${item.priority}</span></td>
          <td data-label="Ordered">${item.original_qty}</td>
          <td data-label="Slip Qty" class="font-bold text-primary">${item.assigned_qty}</td>
        </tr>
      `;
    }).join('');
  }

  window.toggleItem = (id) => {
    if (selectedItemIds.has(id)) selectedItemIds.delete(id);
    else if (selectedItemIds.size < 20) selectedItemIds.add(id);
    else UI.toast('Max 20 per slip', 'error');
    updateGenBtn();
    renderPendingTable();
  };

  function toggleSelectAll(checked) {
    selectedItemIds.clear();
    if (checked) {
      const items = pendingItems.filter(i => i.order_type === currentOrderType);
      items.slice(0,20).forEach(i => selectedItemIds.add(i.id));
    }
    updateGenBtn();
    renderPendingTable();
  }

  function updateGenBtn() {
    const btn = document.getElementById('btnGenerateSlip');
    if (btn) {
      btn.disabled = selectedItemIds.size === 0;
      btn.innerHTML = `${UI.icon('printer')} Generate Slip (${selectedItemIds.size})`;
    }
  }

  async function generateSlip() {
    const selections = pendingItems.filter(i => selectedItemIds.has(i.id));
    const payload = {
      slip_type: SLIP_TYPE,
      order_type: currentOrderType,
      items: selections.map(s => ({
        order_item_id: s.id,
        client_nickname: s.client_nickname,
        priority: s.priority,
        assigned_qty: s.assigned_qty,
        next_status: NEXT_STATUS
      }))
    };

    try {
      const res = await api.generateSlip(payload);
      await runPDFExport(res.slip, selections);
      UI.toast('Slip generated!', 'success');
      renderLanding();
    } catch (err) {
      UI.toast(err.message, 'error');
    }
  }

  async function renderSlipsView(statusFilter) {
    container.innerHTML = `
      <div class="page-header">
        <div>
          <button class="btn btn-sm btn-secondary mb-2" id="btnBack">← Back</button>
          <h1 class="page-title">${statusFilter === 'In Progress' ? 'Current Work' : 'Work History'}</h1>
        </div>
        <div class="view-toggles">
           <button class="btn btn-sm ${currentSlipsView === 'slip' ? 'btn-primary' : 'btn-ghost'}" id="toggleBySlip">By Slip</button>
           <button class="btn btn-sm ${currentSlipsView === 'product' ? 'btn-primary' : 'btn-ghost'}" id="toggleByProduct">By Product</button>
        </div>
      </div>
      <div class="card p-6">
        <div class="table-container">
          <table class="table">
            <thead id="slipsHead"></thead>
            <tbody id="slipsBody"></tbody>
          </table>
        </div>
      </div>
    `;

    document.getElementById('btnBack').onclick = renderLanding;
    document.getElementById('toggleBySlip').onclick = () => { currentSlipsView = 'slip'; renderSlipsView(statusFilter); };
    document.getElementById('toggleByProduct').onclick = () => { currentSlipsView = 'product'; renderSlipsView(statusFilter); };
    
    await loadSlips(statusFilter);
  }

  async function loadSlips(status) {
    const res = await api.getSlips();
    const slips = (res.slips || []).filter(s => s.slip_type === SLIP_TYPE && s.status === status);
    const head = document.getElementById('slipsHead');
    const body = document.getElementById('slipsBody');

    if (currentSlipsView === 'slip') {
      head.innerHTML = `<tr><th>Slip Details</th><th>Items</th><th>Actions</th></tr>`;
      if (!slips.length) {
        body.innerHTML = `<tr><td colspan="3" class="text-center p-8 text-muted">No ${status.toLowerCase()} slips found.</td></tr>`;
        return;
      }
      body.innerHTML = slips.map(s => `
        <tr class="slip-header-row bg-glass-dark">
          <td colspan="2">
            <div class="flex flex-col">
              <strong>${s.slip_number}</strong>
              <span class="text-xs text-muted">Issued: ${new Date(s.issued_at).toLocaleString()} | ${s.order_type.toUpperCase()}</span>
            </div>
          </td>
          <td class="text-right">
            <div class="flex gap-2 justify-end">
              <button class="btn btn-sm btn-ghost" onclick="window.rePrintSlip('${s.id}')" title="Print PDF">${UI.icon('printer')}</button>
              ${s.status === 'In Progress' ? `<button class="btn btn-sm btn-success" onclick="window.completeSlip('${s.id}')" title="Complete Slip">${UI.icon('check')} Mark Complete</button>` : ''}
            </div>
          </td>
        </tr>
        <tr class="slip-items-row">
          <td colspan="3" class="p-0">
            <div class="p-2 bg-primary-darker">
              <table class="table table-sm m-0" style="background:transparent; font-size: 0.85rem;">
                <thead>
                  <tr>
                    <th style="background:transparent;">Product Code</th>
                    <th style="background:transparent;">Client</th>
                    <th style="background:transparent;">Priority</th>
                    <th style="background:transparent;">Slip Qty</th>
                  </tr>
                </thead>
                <tbody>
                  ${(s.work_slip_items || []).map(item => `
                    <tr>
                      <td>${item.product_code || '---'}</td>
                      <td>${item.client_nickname}</td>
                      <td><span class="badge ${item.priority === 'Urgent' ? 'badge-danger' : 'badge-outline'}">${item.priority}</span></td>
                      <td class="font-bold text-primary">${item.assigned_qty}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </td>
        </tr>
        <tr><td colspan="3" style="height:10px; border:none;"></td></tr>
      `).join('');
    } else {
      // Product Centric View
      head.innerHTML = `<tr><th>Product Code</th><th>Client</th><th>Slip No</th><th>Priority</th><th>Qty</th></tr>`;
      const allItems = slips.flatMap(s => (s.work_slip_items || []).map(item => ({ ...item, slip_number: s.slip_number })));
      
      if (!allItems.length) {
        body.innerHTML = `<tr><td colspan="5" class="text-center p-8 text-muted">No in-progress products.</td></tr>`;
        return;
      }
      
      body.innerHTML = allItems.map(item => `
        <tr>
          <td data-label="Code">${item.product_code || '---'}</td>
          <td data-label="Client">${item.client_nickname}</td>
          <td data-label="Slip No" class="text-xs text-muted">${item.slip_number}</td>
          <td data-label="Priority"><span class="badge ${item.priority === 'Urgent' ? 'badge-danger' : 'badge-outline'}">${item.priority}</span></td>
          <td data-label="Qty" class="font-bold text-primary">${item.assigned_qty}</td>
        </tr>
      `).join('');
    }
  }

  window.completeSlip = async (id) => {
    if (!confirm('Mark this entire slip as COMPLETED? This will move all items to the next production stage.')) return;
    try {
      await api.completeSlip(id);
      UI.toast('Slip completed!', 'success');
      renderSlipsView('In Progress');
    } catch (err) {
      UI.toast(err.message, 'error');
    }
  };

  window.rePrintSlip = async (id) => {
      const res = await api.getSlips();
      const slip = res.slips.find(s => s.id === id);
      if (slip) runPDFExport(slip, slip.work_slip_items);
  };

  function runPDFExport(slip, items) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: [100, 150] });
    const slipDate = new Date(slip.issued_at || new Date()).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('JAI GEMS - WORK SLIP', 50, 10, { align: 'center' });

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Slip No: ${slip.slip_number}`, 5, 18);
    doc.text(`Type: ${SLIP_TYPE.toUpperCase()}`, 70, 18);
    doc.text(`Generated: ${slipDate}`, 5, 23);

    let currentY = 30;
    const groupedData = {};
    items.forEach(item => {
      const client = item.client_nickname || 'General';
      if (!groupedData[client]) groupedData[client] = [];
      groupedData[client].push(item);
    });

    Object.keys(groupedData).forEach(client => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(`CLIENT: ${client} | ISSUED: ${slipDate}`, 5, currentY);
      currentY += 5;

      const rows = groupedData[client].map(item => {
        const isUrgent = item.priority === 'Urgent';
        return [
          { content: item.priority || 'Normal', styles: { textColor: isUrgent ? [220, 0, 0] : [0,0,0], fontStyle: isUrgent ? 'bold' : 'normal' } },
          item.product_code,
          { content: (item.assigned_qty || item.qty).toString(), styles: { fontStyle: 'bold' } }
        ];
      });

      doc.autoTable({
        startY: currentY,
        head: [['Priority', 'Code', 'Qty']],
        body: rows,
        theme: 'grid',
        margin: { left: 5, right: 5 },
        styles: { fontSize: 8, cellPadding: 2, halign: 'center' },
        headStyles: { fillColor: [40, 40, 40], textColor: 255 },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 'auto', halign: 'left' },
          2: { cellWidth: 15 }
        },
        didDrawPage: (data) => { currentY = data.cursor.y + 10; }
      });
    });

    const pageCount = doc.internal.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text('Worker Signature: ____________________', 5, 140);
        doc.text('Manager: ____________________', 55, 140);
        doc.text(`Page ${i} of ${pageCount}`, 50, 146, { align: 'center' });
    }

    doc.save(`${slip.slip_number}.pdf`);
  }

  init();
})();
