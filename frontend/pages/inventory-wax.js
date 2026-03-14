/**
 * Jai Gems — Wax Inventory Page
 */

(async function () {
  const container = document.getElementById('pageContent');

  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Wax Inventory</h1>
        <p class="page-subtitle">Manage wax products and tracking. QTY is in Pairs.</p>
      </div>
      <div style="display:flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
        <!-- Filter Controls -->
        <div style="display:flex; gap: 0.5rem; background: var(--bg-glass); padding: 0.3rem; border-radius: var(--radius-md);">
           <select id="wCatFilter" class="form-input" style="width: 140px; padding: 0.2rem 0.5rem; font-size: 0.85rem;">
              <option value="">All Categories</option>
           </select>
           <select id="wStockFilter" class="form-input" style="width: 140px; padding: 0.2rem 0.5rem; font-size: 0.85rem;">
              <option value="">All Stock</option>
              <option value="in">In Stock (>0)</option>
              <option value="out">Out of Stock (=0)</option>
           </select>
           <select id="wAttrFilter" class="form-input" style="width: 140px; padding: 0.2rem 0.5rem; font-size: 0.85rem;">
              <option value="">All Attributes</option>
           </select>
           <select id="wSort" class="form-input" style="width: 140px; padding: 0.2rem 0.5rem; font-size: 0.85rem;">
              <option value="code_asc">Code (A-Z)</option>
              <option value="qty_desc">Qty (High-Low)</option>
              <option value="qty_asc">Qty (Low-High)</option>
              <option value="weight_desc">Weight (High-Low)</option>
              <option value="newest">Recently Updated</option>
           </select>
        </div>

        <div class="search-bar" style="display:flex; gap: 0.5rem; align-items: center;">
          <input type="text" id="wSearch" class="form-input" placeholder="Search..." style="width: 200px;" />
          <button class="btn btn-secondary btn-sm" id="btnSearchWax">Search</button>
        </div>
        <button class="btn btn-primary" id="btnTransactWax">
          ${UI.icon('plus')} Add Wax
        </button>
      </div>
    </div>

    <div class="card">
      <div class="table-container">
        <table class="table" id="waxTable">
          <thead>
            <tr>
              <th style="width: 60px;">Image</th>
              <th>Product Code</th>
              <th>Category</th>
              <th>Inventory</th>
              <th>Details</th>
              <th style="width: 80px;">Actions</th>
            </tr>
          </thead>
          <tbody id="waxTableBody">
            <tr><td colspan="6" class="text-center"><div class="spinner"></div></td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Wax Modal -->
    <div class="modal-overlay" id="waxModal">
      <div class="modal" style="max-width: 500px;">
        <div class="modal-header">
          <h2 class="modal-title" id="waxModalTitle">Wax Stock Entry</h2>
          <button class="modal-close" id="waxModalClose">&times;</button>
        </div>
        <form id="waxForm">
          <input type="hidden" id="wId" />
          <div class="form-group">
            <label class="form-label">Product Image</label>
            <div style="display: flex; gap: 1rem; align-items: center;">
              <div id="waxImagePreview" style="width: 60px; height: 60px; background: var(--bg-hover); border-radius: var(--radius-sm); border: 1px solid var(--border-color); display: flex; align-items: center; justify-content: center; overflow: hidden;">
                ${UI.icon('image')}
              </div>
              <input type="file" id="wImageInput" accept="image/*" style="display: none;" />
              <button type="button" class="btn btn-secondary btn-sm" onclick="document.getElementById('wImageInput').click()">
                ${UI.icon('upload')} Upload Photo
              </button>
              <button type="button" class="btn btn-secondary btn-sm" id="btnRemoveWaxImage" style="display: none;">Remove</button>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-md);">
            <div class="form-group">
              <label class="form-label">Product Code *</label>
              <input class="form-input" type="text" id="wCode" required placeholder="E.g. WX-101" />
            </div>
            <div class="form-group">
              <label class="form-label">Casting Code</label>
              <input class="form-input" type="text" id="wCastCode" placeholder="Optional" />
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-md);">
            <div class="form-group">
              <label class="form-label">Category</label>
              <select id="wCategory" class="form-input">
                <option value="">No Category</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Total Weight (g) *</label>
              <input class="form-input" type="number" step="0.001" id="wTotalWt" required placeholder="Measured weight" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Attributes (Pick from List)</label>
            <div id="wAttributeContainer" style="display: flex; flex-wrap: wrap; gap: 0.5rem; padding: 0.5rem; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-md); min-height: 42px;">
              <span class="text-xs text-muted">No attributes available in settings</span>
            </div>
            <input type="hidden" id="wSelectedAttrs" value="[]" />
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-md);">
            <div class="form-group">
              <label class="form-label">Std Weight (g) *</label>
              <input class="form-input" type="number" step="0.001" id="wStdWt" required placeholder="Weight per piece" />
            </div>
          </div>

          <div class="form-group" style="background: var(--bg-primary); padding: 1rem; border-radius: var(--radius-md); border: 1px dashed var(--border-color); text-align: center;">
            <div class="text-xs text-muted mb-1">Calculated Pairs (QTY)</div>
            <div id="wCalcQtyDisplay" style="font-size: 1.5rem; font-weight: 700; color: var(--gold-light);">0</div>
            <div class="text-xs text-muted mt-1">Found by Total / Std weight</div>
          </div>

          <div class="modal-actions" style="margin-top: 1.5rem; display: flex; justify-content: space-between; align-items: center;">
            <button type="button" class="btn btn-danger" id="btnDeleteWax" style="display: none;">
              ${UI.icon('trash')} Delete Listing
            </button>
            <div style="display: flex; gap: var(--space-sm);">
              <button type="button" class="btn btn-secondary" id="waxModalCancel">Cancel</button>
              <button type="submit" class="btn btn-primary" id="waxFormSubmit">Submit Entry</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  `;

  let inventory = [];
  let categories = [];
  let availableAttributes = [];
  let filteredInventory = [];
  let currentImageUrl = null;
  const isAdmin = Auth.getUser()?.role === 'admin';

  // Elements
  const btnTransact = document.getElementById('btnTransactWax');
  const tableBody = document.getElementById('waxTableBody');
  const modal = document.getElementById('waxModal');
  const form = document.getElementById('waxForm');
  const searchInput = document.getElementById('wSearch');
  const btnSearch = document.getElementById('btnSearchWax');
  const sortSelect = document.getElementById('wSort');
  const catFilterSelect = document.getElementById('wCatFilter');
  const attrFilterSelect = document.getElementById('wAttrFilter');
  const stockFilterSelect = document.getElementById('wStockFilter');
  const catModalSelect = document.getElementById('wCategory');
  const attrContainer = document.getElementById('wAttributeContainer');
  const selectedAttrsInput = document.getElementById('wSelectedAttrs');
  const imagePreview = document.getElementById('waxImagePreview');
  const imageInput = document.getElementById('wImageInput');
  const btnRemoveImage = document.getElementById('btnRemoveWaxImage');

  const modalTitle = document.getElementById('waxModalTitle');

  if (!isAdmin && btnTransact) btnTransact.style.display = 'none';

  // Modal handlers
  if (btnTransact) {
    btnTransact.addEventListener('click', async () => {
      const confirmed = await UI.confirm(
        'Add Wax Manually',
        'Are you sure you want to add a new wax design manually?\n\nNote: Wax records are usually created automatically when you add a Finished Good or Casting. Only proceed if this is a standalone wax design.'
      );
      if (!confirmed) return;

      form.reset();
      document.getElementById('wId').value = '';
      modalTitle.textContent = 'Add Wax Stock';
      imageInput.value = '';
      currentImageUrl = null;
      imagePreview.innerHTML = UI.icon('image');
      btnRemoveImage.style.display = 'none';
      document.getElementById('wCalcQtyDisplay').innerText = '0';
      document.getElementById('btnDeleteWax').style.display = 'none';
      document.getElementById('wCode').disabled = false;
      selectedAttrsInput.value = '[]';
      renderAttributeChips();
      modal.classList.add('active');
    });
  }
  document.getElementById('waxModalClose').addEventListener('click', () => modal.classList.remove('active'));
  document.getElementById('waxModalCancel').addEventListener('click', () => modal.classList.remove('active'));

  // Live QTY Calculation (same as Casting)
  function updateCalcQty() {
    const total = parseFloat(document.getElementById('wTotalWt').value) || 0;
    const std = parseFloat(document.getElementById('wStdWt').value) || 0;
    const display = document.getElementById('wCalcQtyDisplay');
    if (!display) return;
    display.innerText = std > 0 ? Math.round(total / std) : '0';
  }

  document.addEventListener('input', (e) => { if (e.target.id === 'wTotalWt' || e.target.id === 'wStdWt') updateCalcQty(); });
  document.addEventListener('keyup', (e) => { if (e.target.id === 'wTotalWt' || e.target.id === 'wStdWt') updateCalcQty(); });
  document.addEventListener('change', (e) => { if (e.target.id === 'wTotalWt' || e.target.id === 'wStdWt') updateCalcQty(); });

  // Image Upload Handlers
  imageInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      imagePreview.innerHTML = '<div class="spinner" style="width:20px;height:20px;border-width:2px;"></div>';
      const url = await api.uploadFile(file, 'products');
      currentImageUrl = url;
      imagePreview.innerHTML = `<img src="${url}" style="width:100%; height:100%; object-fit:cover;" />`;
      btnRemoveImage.style.display = 'inline-block';
    } catch (err) {
      UI.toast('Image upload failed', 'error');
      imagePreview.innerHTML = UI.icon('image');
    }
  });

  btnRemoveImage.addEventListener('click', () => {
    currentImageUrl = null;
    imageInput.value = '';
    imagePreview.innerHTML = UI.icon('image');
    btnRemoveImage.style.display = 'none';
  });

  // Attribute Handlers
  function renderAttributeChips() {
    const selected = JSON.parse(selectedAttrsInput.value || '[]');
    if (availableAttributes.length === 0) {
      attrContainer.innerHTML = '<span class="text-xs text-muted">No attributes available in settings</span>';
      return;
    }
    attrContainer.innerHTML = availableAttributes.map(attr => {
      const isSelected = selected.includes(attr.id);
      return `
            <div class="chip ${isSelected ? 'chip-primary' : ''}" style="cursor:pointer;" onclick="toggleWaxAttribute('${attr.id}')">
              ${escapeHtml(attr.name)}
            </div>
          `;
    }).join('');
  }

  window.toggleWaxAttribute = function (attrId) {
    let selected = JSON.parse(selectedAttrsInput.value || '[]');
    if (selected.includes(attrId)) {
      selected = selected.filter(id => id !== attrId);
    } else {
      selected.push(attrId);
    }
    selectedAttrsInput.value = JSON.stringify(selected);
    renderAttributeChips();
  };

  async function loadInventory() {
    try {
      const [invRes, configRes, attrRes] = await Promise.all([
        api.getWaxInventory(),
        api.getInvConfig(),
        api.getCastingAttributes() // Using casting attributes for wax too
      ]);

      inventory = invRes.inventory || [];
      categories = configRes.categories || [];
      availableAttributes = attrRes.attributes || [];

      // Populate filter dropdowns
      const catOptions = categories.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');
      catFilterSelect.innerHTML = `<option value="">All Categories</option>${catOptions}`;
      catModalSelect.innerHTML = `<option value="">No Category</option>${catOptions}`;

      // Populate attribute filter dropdown
      attrFilterSelect.innerHTML = '<option value="">All Attributes</option>' +
        availableAttributes.map(a => `<option value="${a.id}">${escapeHtml(a.name)}</option>`).join('');

      filteredInventory = [...inventory];
      applyFiltersAndSort();
    } catch (err) {
      tableBody.innerHTML = `<tr><td colspan="6" class="text-error">Error: ${err.message}</td></tr>`;
    }
  }

  function renderTable() {
    if (filteredInventory.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="6"><div class="empty-state">No wax inventory found.</div></td></tr>`;
      return;
    }

    tableBody.innerHTML = filteredInventory.map(item => {
      const catName = item.category?.name || categories.find(c => c.id === item.category_id)?.name || '';
      const img = item.image_url
        ? `<img src="${item.image_url}" style="width: 40px; height: 40px; object-fit: cover; border-radius: var(--radius-sm);" loading="lazy" />`
        : `<div style="width: 40px; height: 40px; background: var(--bg-hover); border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; color: var(--text-muted);">${UI.icon('image')}</div>`;

      const invStr = `
        <div style="font-weight:bold; color:${item.qty === 0 ? 'var(--error)' : 'inherit'}">${item.qty} prs</div>
        <div class="text-xs text-muted">Reserved: ${item.reserved_qty || 0}</div>
      `;

      const attrCount = (item.attribute_ids || []).length;
      const detailsStr = `
        <div class="text-xs text-secondary">Total: ${parseFloat(item.total_weight).toFixed(3)}g</div>
        <div class="text-xs text-secondary">Std: ${parseFloat(item.std_weight).toFixed(3)}g</div>
        ${attrCount > 0 ? `<div class="text-xs text-muted">${attrCount} attr${attrCount > 1 ? 's' : ''}</div>` : ''}
      `;

      return `
        <tr>
          <td>${img}</td>
          <td>
            <strong>${escapeHtml(item.product_code)}</strong>
            ${item.casting_product_code ? `<br/><span class="text-xs text-muted">Cast: ${escapeHtml(item.casting_product_code)}</span>` : ''}
          </td>
          <td>${escapeHtml(catName)}</td>
          <td>${invStr}</td>
          <td>${detailsStr}</td>
          <td>
            <div style="display: flex; gap: 0.25rem; align-items: center;">
              <button class="btn btn-sm btn-secondary" onclick="editWax('${item.id}')" title="Edit">${UI.icon('edit')}</button>
              ${isAdmin ? `
                <button class="btn btn-sm btn-danger" onclick="deleteWax('${item.id}')" title="Delete Listing">
                  ${UI.icon('trash')}
                </button>
              ` : '<span class="text-muted text-xs">Read Only</span>'}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  window.editWax = function (id) {
    const item = inventory.find(i => i.id === id);
    if (!item) return;

    document.getElementById('wId').value = item.id;
    modalTitle.textContent = 'Edit Wax Listing';

    document.getElementById('wCode').value = item.product_code;
    document.getElementById('wCode').disabled = true;
    document.getElementById('wCastCode').value = item.casting_product_code || '';
    document.getElementById('wCategory').value = item.category_id || '';
    document.getElementById('wTotalWt').value = item.total_weight;
    document.getElementById('wStdWt').value = item.std_weight;
    document.getElementById('wCalcQtyDisplay').innerText = item.qty;

    currentImageUrl = item.image_url;
    if (currentImageUrl) {
      imagePreview.innerHTML = `<img src="${currentImageUrl}" style="width:100%; height:100%; object-fit:cover;" />`;
      btnRemoveImage.style.display = 'inline-block';
    } else {
      imagePreview.innerHTML = UI.icon('image');
      btnRemoveImage.style.display = 'none';
    }

    selectedAttrsInput.value = JSON.stringify(item.attribute_ids || []);
    renderAttributeChips();

    if (isAdmin) document.getElementById('btnDeleteWax').style.display = 'inline-flex';
    modal.classList.add('active');
  };

  window.deleteWax = async function (id) {
    try {
      const p = inventory.find(x => x.id === id);
      if (!p) return;

      const codeToDisplay = p.product_code || 'Wax Product';
      const { links } = await api.checkDeleteLinks('wax', id);

      if (links.fg || links.casting) {
        const targets = await UI.crossDeleteConfirm(codeToDisplay, links);
        if (!targets) return;

        await api.executeCrossDelete(targets);
        UI.toast('Selected inventory records deleted successfully', 'success');
      } else {
        const confirmed = await UI.confirm('Delete Wax Listing', 'Are you sure you want to delete this wax inventory? This action cannot be undone.');
        if (!confirmed) return;

        await api.deleteWax(id);
        UI.toast('Wax deleted successfully', 'success');
      }

      loadInventory();
    } catch (err) {
      UI.toast(err.message, 'error');
    }
  };

  function applyFiltersAndSort() {
    const query = searchInput.value.toLowerCase().trim();
    const sortMode = sortSelect.value;
    const catFilter = catFilterSelect.value;
    const attrFilter = attrFilterSelect.value;
    const stockFilter = stockFilterSelect.value;

    let result = [...inventory];

    if (query) {
      result = result.filter(p =>
        (p.product_code && p.product_code.toLowerCase().includes(query)) ||
        (p.casting_product_code && p.casting_product_code.toLowerCase().includes(query))
      );
    }

    if (catFilter) {
      result = result.filter(p => p.category_id === catFilter);
    }

    if (attrFilter) {
      result = result.filter(p => (p.attribute_ids || []).includes(attrFilter));
    }

    if (stockFilter === 'in') result = result.filter(p => p.qty > 0);
    if (stockFilter === 'out') result = result.filter(p => p.qty === 0);

    result.sort((a, b) => {
      if (sortMode === 'code_asc') return (a.product_code || '').localeCompare(b.product_code || '');
      if (sortMode === 'qty_desc') return b.qty - a.qty;
      if (sortMode === 'qty_asc') return a.qty - b.qty;
      if (sortMode === 'weight_desc') return b.total_weight - a.total_weight;
      if (sortMode === 'newest') return new Date(b.updated_at) - new Date(a.updated_at);
      return 0;
    });

    filteredInventory = result;
    renderTable();
  }

  function doSearch() {
    applyFiltersAndSort();
  }

  btnSearch.addEventListener('click', doSearch);
  searchInput.addEventListener('input', doSearch);
  sortSelect.addEventListener('change', applyFiltersAndSort);
  catFilterSelect.addEventListener('change', applyFiltersAndSort);
  attrFilterSelect.addEventListener('change', applyFiltersAndSort);
  stockFilterSelect.addEventListener('change', applyFiltersAndSort);

  const btnDeleteWax = document.getElementById('btnDeleteWax');
  if (btnDeleteWax) {
    btnDeleteWax.addEventListener('click', () => {
      const id = document.getElementById('wId').value;
      if (id) window.deleteWax(id);
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('waxFormSubmit');
    btn.disabled = true;
    btn.innerHTML = 'Processing...';

    const id = document.getElementById('wId').value;
    const total = parseFloat(document.getElementById('wTotalWt').value) || 0;
    const std = parseFloat(document.getElementById('wStdWt').value) || 0;
    const calcQty = std > 0 ? Math.round(total / std) : 0;

    // For edit: send the delta. For new: send the full calculated qty.
    let qtyChange = id ? 0 : calcQty;
    if (id) {
      const existing = inventory.find(x => x.id === id);
      if (existing) qtyChange = calcQty - existing.qty;
    }

    const payload = {
      id: id || null,
      product_code: document.getElementById('wCode').value,
      casting_product_code: document.getElementById('wCastCode').value || null,
      qty_change: qtyChange,
      std_weight: std,
      manual_total_weight: total,
      category_id: document.getElementById('wCategory').value || null,
      image_url: currentImageUrl,
      attribute_ids: JSON.parse(selectedAttrsInput.value || '[]')
    };

    try {
      await api.transactWax(payload);
      UI.toast('Inventory updated', 'success');
      modal.classList.remove('active');
      loadInventory();
    } catch (err) {
      UI.toast(err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = 'Submit Entry';
    }
  });

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]);
  }

  loadInventory();
})();
