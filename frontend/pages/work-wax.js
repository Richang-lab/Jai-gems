(async function () {
  const container = document.getElementById('pageContent');
  if (!container) return;

  container.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title text-xl font-semibold m-0">Wax Distribution</h1>
          <p class="page-subtitle text-sm text-muted">Generate work slips for open orders.</p>
        </div>
      </div>

      <div class="content-wrapper p-6">
        <div class="card p-6 mb-6">
          <div class="flex" style="justify-content: space-between; align-items:center; margin-bottom: 24px;">
            <h2 class="text-lg font-semibold m-0">Pending Wax Pool</h2>
            <button class="btn btn-primary" id="btnGenerateSlip" disabled>
              ${UI.icon('printer')} Generate Slip (0)
            </button>
          </div>

          <p class="text-muted text-sm mb-4">
            Items are listed in strictly FIFO (First-In, First-Out) order. Select up to 20 items to construct a single printed slip.
          </p>

          <div class="view-toggles" style="display:inline-flex; background:var(--bg-primary); border-radius:var(--radius-md); padding:2px; margin-bottom: 1rem;">
             <button class="btn btn-sm" id="tabFg" style="background:var(--bg-glass); color:var(--text-primary);">Finished Goods Orders</button>
             <button class="btn btn-sm" id="tabCasting" style="background:transparent; color:var(--text-muted);">Casting Orders</button>
          </div>

          <div class="table-container">
            <table class="table" id="pendingTable">
              <thead>
                <tr>
                  <th style="width: 40px;"><input type="checkbox" id="selectAllCheckbox"></th>
                  <th>Order Date</th>
                  <th>Client</th>
                  <th>Product Base Code</th>
                  <th>Priority</th>
                  <th>QTY Ordered</th>
                  <th>Slip Buffer QTY</th>
                </tr>
              </thead>
              <tbody id="pendingTableBody">
                <tr><td colspan="7" class="text-center"><div class="spinner"></div></td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
  `;


  const user = Auth.getUser();
  if (!user) {
    window.location.href = '/index.html';
    return;
  }

  // Define slip parameters for this page
  const SLIP_TYPE = 'Wax';
  const API_ENDPOINT = '/api/slips/pending/wax'; // Fetches 'Open' items

  // Elements
  const tabFg = document.getElementById('tabFg');
  const tabCasting = document.getElementById('tabCasting');
  const tableBody = document.getElementById('pendingTableBody');
  const btnGenerateSlip = document.getElementById('btnGenerateSlip');
  const selectAllCheckbox = document.getElementById('selectAllCheckbox');

  // State
  let pendingItems = []; 
  let currentOrderType = 'finished_good'; // 'finished_good' or 'casting'
  let selectedItemIds = new Set();

  // Load Initial Data
  loadPendingWork();

  // 1. Tab Event Listeners
  tabFg.addEventListener('click', () => switchTab('finished_good', tabFg, tabCasting));
  tabCasting.addEventListener('click', () => switchTab('casting', tabCasting, tabFg));

  function autoSelectTop20() {
    selectedItemIds.clear();
    const filteredItems = pendingItems.filter(i => i.order_type === currentOrderType);
    const limit = Math.min(filteredItems.length, 20);
    for (let i = 0; i < limit; i++) {
      selectedItemIds.add(filteredItems[i].id);
    }
    selectAllCheckbox.checked = (limit > 0);
    updateGenerateButton();
  }

  function switchTab(orderType, activeTab, inactiveTab) {
    currentOrderType = orderType;
    autoSelectTop20();

    activeTab.style.background = 'var(--bg-glass)';
    activeTab.style.color = 'var(--text-primary)';

    inactiveTab.style.background = 'transparent';
    inactiveTab.style.color = 'var(--text-muted)';

    renderTable();
  }

  // 2. Fetch Data
  async function loadPendingWork() {
    try {
      tableBody.innerHTML = `<tr><td colspan="7" class="text-center"><div class="spinner"></div></td></tr>`;
      const res = await api.getPendingSlips('wax');
      pendingItems = res.pendingItems || [];
      autoSelectTop20();
      renderTable();
    } catch (err) {
      console.error(err);
      tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-error">Failed to load pending assignments: ${err.message}</td></tr>`;
    }
  }

  // 3. Render Table Content
  function renderTable() {
    const filteredItems = pendingItems.filter(i => i.order_type === currentOrderType);

    if (filteredItems.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-8">No pending items found for ${currentOrderType === 'casting' ? 'Casting' : 'Finished Goods'} in this stage.</td></tr>`;
      return;
    }

    tableBody.innerHTML = filteredItems.map(item => {
      const isChecked = selectedItemIds.has(item.id) ? 'checked' : '';
      const priorityBadge = item.priority === 'Urgent' 
        ? `<span class="badge badge-error">Urgent</span>` 
        : `<span class="badge badge-outline">Normal</span>`;
        
      const dateStr = item.order_date ? new Date(item.order_date).toLocaleDateString() : '-';

      return `
        <tr class="${isChecked ? 'bg-primary-light' : ''}" style="cursor:pointer;" onclick="toggleSelection('${item.id}')">
          <td data-label="Select" onclick="event.stopPropagation(); toggleSelection('${item.id}')">
            <input type="checkbox" ${isChecked} style="cursor:pointer;">
          </td>
          <td data-label="Date">${dateStr}</td>
          <td data-label="Client" class="font-medium">${escapeHtml(item.client_nickname)}</td>
          <td data-label="Code">${escapeHtml(item.product_code)}</td>
          <td data-label="Priority">${priorityBadge}</td>
          <td data-label="Ordered" class="text-sm text-disabled">${item.original_qty}</td>
          <td data-label="Slip Qty" class="font-semibold text-primary">${item.assigned_qty}</td>
        </tr>
      `;
    }).join('');
  }

  // 4. Selection Logic (Max 20 Rules)
  window.toggleSelection = function(id) {
    if (selectedItemIds.has(id)) {
      selectedItemIds.delete(id);
    } else {
      if (selectedItemIds.size >= 20) {
        UI.toast('Maximum 20 items per physical slip.', 'error');
        return;
      }
      selectedItemIds.add(id);
    }
    
    // Sync Select All checkbox
    const filteredItems = pendingItems.filter(i => i.order_type === currentOrderType);
    selectAllCheckbox.checked = (selectedItemIds.size === filteredItems.length && filteredItems.length > 0);
    
    updateGenerateButton();
    renderTable();
  };

  selectAllCheckbox.addEventListener('change', (e) => {
    const isChecked = e.target.checked;
    const filteredItems = pendingItems.filter(i => i.order_type === currentOrderType);
    
    selectedItemIds.clear();
    
    if (isChecked) {
      // Add up to 20 items exactly
      const limit = Math.min(filteredItems.length, 20);
      for (let i = 0; i < limit; i++) {
        selectedItemIds.add(filteredItems[i].id);
      }
      if (filteredItems.length > 20) {
        UI.toast('Only the first 20 items were selected.', 'info');
      }
    }
    
    updateGenerateButton();
    renderTable();
  });

  function updateGenerateButton() {
    btnGenerateSlip.disabled = selectedItemIds.size === 0;
    btnGenerateSlip.innerHTML = `${UI.icon('printer')} Generate Slip (${selectedItemIds.size})`;
  }

  // 5. PDF Generation & API Submission
  btnGenerateSlip.addEventListener('click', async () => {
    if (selectedItemIds.size === 0) return;

    // Build Payload for Backend binding
    const slipPayloadItems = [];
    const pdfDataRows = [];

    // Because Set iteration respects insertion order, but we explicitly want FIFO (which pendingItems already is)
    // We map through pendingItems to retain chronological order for PDF.
    const orderedSelections = pendingItems.filter(i => selectedItemIds.has(i.id));

    orderedSelections.forEach(item => {
      slipPayloadItems.push({
        order_item_id: item.id,
        client_nickname: item.client_nickname,
        priority: item.priority,
        assigned_qty: item.assigned_qty,
        next_status: 'Wax Inprogress' // Update actual inventory tracking status
      });
      // Push raw dataset to JSPDF mapping
      pdfDataRows.push(item);
    });

    try {
      btnGenerateSlip.disabled = true;
      btnGenerateSlip.innerHTML = `${UI.icon('loader')} Generating...`;

      // A. Submit to backend to lock DB tracking
      const res = await api.generateSlip({
        slip_type: SLIP_TYPE,
        order_type: currentOrderType,
        items: slipPayloadItems
      });

      // B. Generate physical PDF locally
      generatePDF(res.slip.slip_number, pdfDataRows);

      UI.toast(`Slip ${res.slip.slip_number} generated successfully!`, 'success');

      // C. Reset page state
      selectedItemIds.clear();
      updateGenerateButton();
      await loadPendingWork();

    } catch (err) {
      console.error(err);
      UI.toast(err.message, 'error');
      updateGenerateButton();
    }
  });

  // ==========================================
  // PDF Document Generation Engine (jsPDF)
  // Portrait 10x15cm. Exact specification match.
  // ==========================================
  function generatePDF(slipNumber, rowsData) {
    const { jsPDF } = window.jspdf;
    
    // 10cm x 15cm format in millimeters (100mm x 150mm) Portrait
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [100, 150]
    });

    const slipDate = new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'});

    // Fonts setup
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    // Header
    doc.text("JAI GEMS - WORK SLIP", 50, 10, { align: "center" });
    
    // Sub-headers
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    
    doc.text(`Slip No: ${slipNumber}`, 5, 18);
    doc.text(`Type: ${SLIP_TYPE.toUpperCase()}`, 70, 18);
    
    doc.text(`Generated: ${slipDate}`, 5, 23);

    // Group rowsData by Client
    const groupedData = {};
    rowsData.forEach(item => {
      if (!groupedData[item.client_nickname]) {
        groupedData[item.client_nickname] = [];
      }
      groupedData[item.client_nickname].push(item);
    });

    let currentY = 32;

    // Render a dedicated AutoTable for each Client
    Object.keys(groupedData).forEach(clientNickname => {
      // Print Client Header string right above this client's unique table array
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      
      // Page break check if header string will bleed off page constraints
      if (currentY > 130) {
        doc.addPage();
        currentY = 15;
      }
      
      doc.text(`CLIENT: ${clientNickname}   |   ISSUED: ${slipDate}`, 5, currentY);
      currentY += 5; // Increase padding so the dark table header doesn't clip into the text baseline

      const tableRows = groupedData[clientNickname].map(item => {
        const isUrgent = item.priority === 'Urgent';
        return [
          { content: isUrgent ? 'URGENT' : '', styles: { fontStyle: isUrgent ? 'bold' : 'normal', textColor: isUrgent ? [200,0,0] : [0,0,0] } },
          item.product_code,
          { content: item.assigned_qty.toString(), styles: { fontStyle: 'bold', halign: 'center' } }
        ];
      });

      doc.autoTable({
        startY: currentY,
        margin: { top: 5, left: 5, right: 5, bottom: 20 },
        head: [['Priority', 'Code', 'Qty']],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [40, 40, 40], fontSize: 8, halign: 'center' },
        bodyStyles: { fontSize: 9, cellPadding: 1.5 },
        columnStyles: {
          0: { cellWidth: 20, halign: 'center' }, // Priority
          1: { cellWidth: 'auto' }, // Code grabs remaining available width space beautifully
          2: { cellWidth: 15, halign: 'center' }, // Qty
        },
        didDrawPage: function (data) {
          // Keep bottom region clear for pagination checks
          const pageCount = doc.internal.getNumberOfPages();
          doc.setFontSize(8);
          doc.setFont("helvetica", "normal");
          doc.text(`Page ${data.pageNumber} of ${pageCount}`, 50, 146, { align: "center" });
          doc.text(`Worker Signature: _________________`, 5, 140);
          doc.text(`Manager: _________________`, 55, 140);
        }
      });
      // push cursor to bottom of the table + margins for the next iterated client block
      currentY = doc.lastAutoTable.finalY + 10; 
    });

    // Auto open/download the PDF
    doc.save(`${slipNumber}.pdf`);
  }
  
  // Expose escape string fn globally logic snippet used earlier
  function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return String(unsafe).replace(/[&<"'>]/g, function (match) {
      const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
      return map[match];
    });
  }
})();
