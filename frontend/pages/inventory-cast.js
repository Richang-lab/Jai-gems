/**
 * Jai Gems — Casting Inventory Page
 */

(async function () {
  const container = document.getElementById('pageContent');

  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Casting Inventory</h1>
        <p class="page-subtitle">Manage unfinished casted products before filing/jhalai</p>
      </div>
      <div style="display:flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
        <!-- Filter/Sort Bar -->
        <div style="display:flex; flex-wrap: wrap; gap: 0.5rem; background: var(--bg-glass); padding: 0.3rem; border-radius: var(--radius-md); width: 100%;">
           <select id="cCatFilter" class="form-input" style="flex: 1; min-width: 120px; padding: 0.2rem 0.5rem; font-size: 0.85rem;">
              <option value="">All Categories</option>
           </select>
           <select id="cStockFilter" class="form-input" style="flex: 1; min-width: 120px; padding: 0.2rem 0.5rem; font-size: 0.85rem;">
              <option value="all">All Stock</option>
              <option value="in">In Stock (&gt;0)</option>
              <option value="out">Out of Stock (=0)</option>
           </select>
           <select id="cAttrFilter" class="form-input" style="flex: 1; min-width: 120px; padding: 0.2rem 0.5rem; font-size: 0.85rem;">
              <option value="">All Attributes</option>
           </select>
           <select id="cSort" class="form-input" style="flex: 1; min-width: 120px; padding: 0.2rem 0.5rem; font-size: 0.85rem;">
              <option value="newest">Newest First</option>
              <option value="code_asc">Code (A-Z)</option>
              <option value="qty_desc">Qty (High-Low)</option>
              <option value="qty_asc">Qty (Low-High)</option>
              <option value="weight_desc">Weight (High-Low)</option>
           </select>
        </div>

        <div class="search-bar" style="display:flex; flex: 1; min-width: 200px; gap: 0.5rem; align-items: center;">
          <input type="text" id="cSearch" class="form-input" placeholder="Search..." style="flex: 1;" />
          <button class="btn btn-secondary btn-sm" id="btnSearchCast">Search</button>
        </div>

        <div class="view-toggles" style="display:flex; background:var(--bg-primary); border-radius:var(--radius-md); padding:2px;">
           <button class="btn btn-sm" id="btnViewTable" style="background:var(--bg-glass); color:var(--text-primary);" title="Table View">${UI.icon('list')}</button>
           <button class="btn btn-sm" id="btnViewCards" style="background:transparent; color:var(--text-muted);" title="Card View">${UI.icon('grid')}</button>
        </div>

        <input type="file" id="cCsvInput" accept=".csv" style="display:none;" />
        <button class="btn btn-secondary" onclick="document.getElementById('cCsvInput').click()">${UI.icon('plus')} Import CSV</button>

        <button class="btn btn-primary" id="btnTransactCast">
          ${UI.icon('plus')} Add Casting
        </button>
      </div>
    </div>

    <div class="card" id="castListingContainer">
      <div class="table-container">
        <table class="table" id="castTable">
          <thead>
            <tr>
              <th>Image</th>
              <th>Casting Code</th>
              <th>Category</th>
              <th>Inventory</th>
              <th>Details</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="castTableBody">
            <tr><td colspan="6" class="text-center"><div class="spinner"></div></td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <div id="castCardGrid" style="display:none; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: var(--space-sm); margin-bottom: 2rem;"></div>

    <!-- Transaction Modal -->
    <div class="modal-overlay" id="castModal">
      <div class="modal" style="max-width: 500px;">
        <div class="modal-header">
          <h2 class="modal-title" id="castModalTitle">Casting Stock Entry</h2>
          <button class="modal-close" id="castModalClose">&times;</button>
        </div>
        <form id="castForm">
          <input type="hidden" id="cId" />
          <div class="form-group">
            <label class="form-label">Product Image</label>
            <div style="display: flex; gap: 1rem; align-items: center;">
              <div id="castImagePreview" style="width: 60px; height: 60px; background: var(--bg-hover); border-radius: var(--radius-sm); border: 1px solid var(--border-color); display: flex; align-items: center; justify-content: center; overflow: hidden;">
                ${UI.icon('image')}
              </div>
              <input type="file" id="cImageInput" accept="image/*" style="display: none;" />
              <button type="button" class="btn btn-secondary btn-sm" onclick="document.getElementById('cImageInput').click()">
                ${UI.icon('upload')} Upload Photo
              </button>
              <button type="button" class="btn btn-secondary btn-sm" id="btnRemoveCastImage" style="display: none;">Remove</button>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-md);">
            <div class="form-group">
              <label class="form-label">Casting Code *</label>
              <input class="form-input" type="text" id="cCastCode" required placeholder="E.g. CS-101" />
            </div>
            <div class="form-group">
              <label class="form-label">Product Code (Optional)</label>
              <input class="form-input" type="text" id="cCode" placeholder="E.g. C-102" />
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-md);">
             <div class="form-group">
                <label class="form-label">Category</label>
                <select id="cCategory" class="form-input">
                  <option value="">No Category</option>
                </select>
             </div>
             <div class="form-group">
                <label class="form-label">Total Weight (g) *</label>
                <input class="form-input" type="number" step="0.001" id="cTotalWt" required placeholder="Measured weight" />
             </div>
          </div>

          <div class="form-group">
            <label class="form-label">Attributes (Pick from List)</label>
            <div id="cAttributeContainer" style="display: flex; flex-wrap: wrap; gap: 0.5rem; padding: 0.5rem; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-md); min-height: 42px;">
              <!-- Attribute chips injected here -->
              <span class="text-xs text-muted">No attributes available in settings</span>
            </div>
            <input type="hidden" id="cSelectedAttrs" value="[]" />
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-md);">
            <div class="form-group">
              <label class="form-label">Std Weight (g) *</label>
              <input class="form-input" type="number" step="0.001" id="cStdWt" required placeholder="Weight per piece" />
            </div>
          </div>
          
          <div class="form-group" style="background: var(--bg-primary); padding: 1rem; border-radius: var(--radius-md); border: 1px dashed var(--border-color); text-align: center;">
            <div class="text-xs text-muted mb-1">Calculated Pieces (QTY)</div>
            <div id="calcQtyDisplay" style="font-size: 1.5rem; font-weight: 700; color: var(--gold-light);">0</div>
            <div class="text-xs text-muted mt-1">Found by Total / Std weight</div>
          </div>

          <div class="modal-actions" style="margin-top: 1.5rem; display: flex; justify-content: space-between; align-items: center;">
            <button type="button" class="btn btn-danger" id="btnDeleteCast" style="display: none;">
              ${UI.icon('trash')} Delete Listing
            </button>
            <div style="display: flex; gap: var(--space-sm);">
              <button type="button" class="btn btn-secondary" id="castModalCancel">Cancel</button>
              <button type="submit" class="btn btn-primary" id="castFormSubmit">Submit Entry</button>
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
  const btnTransact = document.getElementById('btnTransactCast');
  const tableBody = document.getElementById('castTableBody');
  const modal = document.getElementById('castModal');
  const modalTitle = document.getElementById('castModalTitle');
  const form = document.getElementById('castForm');
  const listingContainer = document.getElementById('castListingContainer');
  const cardGrid = document.getElementById('castCardGrid');
  const searchInput = document.getElementById('cSearch');
  const btnSearch = document.getElementById('btnSearchCast');
  const sortSelect = document.getElementById('cSort');
  const catFilterSelect = document.getElementById('cCatFilter');
  const attrFilterSelect = document.getElementById('cAttrFilter');
  const stockFilterSelect = document.getElementById('cStockFilter');
  const catModalSelect = document.getElementById('cCategory');
  const attrContainer = document.getElementById('cAttributeContainer');
  const selectedAttrsInput = document.getElementById('cSelectedAttrs');
  const btnViewTable = document.getElementById('btnViewTable');
  const btnViewCards = document.getElementById('btnViewCards');

  let currentView = 'table';

  // Set initial button states based on currentView
  if (currentView === 'cards') {
    btnViewCards.style.background = 'var(--bg-glass)';
    btnViewCards.style.color = 'var(--text-primary)';
    btnViewTable.style.background = 'transparent';
    btnViewTable.style.color = 'var(--text-muted)';
  } else { // currentView === 'table'
    btnViewTable.style.background = 'var(--bg-glass)';
    btnViewTable.style.color = 'var(--text-primary)';
    btnViewCards.style.background = 'transparent';
    btnViewCards.style.color = 'var(--text-muted)';
  }

  if (!isAdmin && btnTransact) btnTransact.style.display = 'none';

  // View Toggles (same pattern as Finished Goods)
  btnViewTable.addEventListener('click', () => {
    currentView = 'table';
    btnViewTable.style.background = 'var(--bg-glass)';
    btnViewTable.style.color = 'var(--text-primary)';
    btnViewCards.style.background = 'transparent';
    btnViewCards.style.color = 'var(--text-muted)';
    listingContainer.style.display = 'block';
    cardGrid.style.display = 'none';
    renderTable();
  });

  btnViewCards.addEventListener('click', () => {
    currentView = 'cards';
    btnViewCards.style.background = 'var(--bg-glass)';
    btnViewCards.style.color = 'var(--text-primary)';
    btnViewTable.style.background = 'transparent';
    btnViewTable.style.color = 'var(--text-muted)';
    listingContainer.style.display = 'none';
    cardGrid.style.display = 'grid';
    renderCards();
  });

  const imageInput = document.getElementById('cImageInput');
  const imagePreview = document.getElementById('castImagePreview');
  const btnRemoveImage = document.getElementById('btnRemoveCastImage');

  // Modal handlers
  if (btnTransact) {
    btnTransact.addEventListener('click', async () => {
      form.reset();
      document.getElementById('cId').value = '';
      modalTitle.textContent = 'Add Casting Stock';
      imageInput.value = '';
      currentImageUrl = null;
      imagePreview.innerHTML = UI.icon('image');
      btnRemoveImage.style.display = 'none';
      document.getElementById('calcQtyDisplay').innerText = '0';
      document.getElementById('btnDeleteCast').style.display = 'none';
      modal.classList.add('active');
    });
  }

  // Live Calculation Logic
  function updateCalcQty() {
    const inputTotalWt = document.getElementById('cTotalWt');
    const inputStdWt = document.getElementById('cStdWt');
    const calcDisplay = document.getElementById('calcQtyDisplay');

    if (!inputTotalWt || !inputStdWt || !calcDisplay) return;

    const total = parseFloat(inputTotalWt.value) || 0;
    const std = parseFloat(inputStdWt.value) || 0;

    if (std > 0) {
      const qty = Math.round(total / std);
      calcDisplay.innerText = qty;
    } else {
      calcDisplay.innerText = '0';
    }
  }

  // We'll attach these to the document because the modal elements are static in this setup
  document.addEventListener('input', (e) => {
    if (e.target.id === 'cTotalWt' || e.target.id === 'cStdWt') updateCalcQty();
  });
  document.addEventListener('change', (e) => {
    if (e.target.id === 'cTotalWt' || e.target.id === 'cStdWt') updateCalcQty();
  });
  document.addEventListener('keyup', (e) => {
    if (e.target.id === 'cTotalWt' || e.target.id === 'cStdWt') updateCalcQty();
  });

  imageInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      imagePreview.innerHTML = '<div class="spinner" style="width:20px;height:20px;border-width:2px;"></div>';
      const fileName = `casting_${Date.now()}_${file.name}`;
      const url = await api.uploadFile('product_images', fileName, file);
      currentImageUrl = url.publicUrl || url;
      imagePreview.innerHTML = `<img src="${currentImageUrl}" style="width:100%; height:100%; object-fit:cover;" />`;
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

  document.getElementById('castModalClose').addEventListener('click', () => modal.classList.remove('active'));
  document.getElementById('castModalCancel').addEventListener('click', () => modal.classList.remove('active'));

  function renderCurrentView() {
    if (currentView === 'table') {
      listingContainer.style.display = 'block';
      cardGrid.style.display = 'none';
      renderTable();
    } else {
      listingContainer.style.display = 'none';
      cardGrid.style.display = 'grid';
      renderCards();
    }
  }

  function renderTable() {
    const tbody = document.getElementById('castTableBody');
    if (!tbody) return;

    if (filteredInventory.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state">No casting inventory found.</div></td></tr>`;
      return;
    }

    tbody.innerHTML = filteredInventory.map(item => {
      const img = item.image_url
        ? `<img src="${item.image_url}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px; cursor: pointer;" loading="lazy" onclick="UI.showImage(this.src)" />`
        : `<div style="width:40px; height:40px; background:var(--bg-glass); border-radius:4px; display:flex; align-items:center; justify-content:center; font-size:10px; color:var(--text-muted)">No Img</div>`;

      const catName = categories.find(c => c.id === item.category_id)?.name || '\u2014';

      const invStr = `
        <div style="font-weight:bold; color:${item.qty === 0 ? 'var(--error)' : 'inherit'}">${item.qty} in stock</div>
        <div class="text-xs text-muted">Reserved: ${item.reserved_qty || 0}</div>
      `;

      const attrCount = (item.attribute_ids || []).length;
      const detailsStr = `
        <div class="text-xs text-secondary">Std: ${parseFloat(item.std_weight).toFixed(2)}g</div>
        ${attrCount > 0 ? `<div class="text-xs text-muted">${attrCount} attr${attrCount > 1 ? 's' : ''}</div>` : ''}
      `;

      return `
        <tr>
          <td data-label="Image" class="img-cell">
            <div class="product-img-wrapper" style="width: 100%; aspect-ratio: 1; border-radius: var(--radius-sm); overflow: hidden; background: var(--bg-hover); display: flex; align-items: center; justify-content: center;">
              ${item.image_url ? `<img src="${item.image_url}" style="width: 100%; height: 100%; object-fit: cover; cursor: pointer;" onclick="event.stopPropagation(); UI.showImage('${item.image_url}')">` : `<span class="text-muted">${UI.icon('image')}</span>`}
            </div>
          </td>
          <td data-label="Casting Code">
            <div style="font-weight: 500; color: var(--gold-light);">${escapeHtml(item.casting_product_code)}</div>
            ${item.product_code ? `<div class="text-xs text-muted">FG: ${escapeHtml(item.product_code)}</div>` : ''}
          </td>
          <td data-label="Category">${escapeHtml(catName)}</td>
          <td data-label="Inventory">${invStr}</td>
          <td data-label="Details">${detailsStr}</td>
          <td data-label="Actions">
            <div style="display: flex; gap: 0.5rem;">
              <button class="btn btn-sm btn-secondary" onclick="event.stopPropagation(); editCasting('${item.id}')" title="Edit">${UI.icon('edit')}</button>
              ${isAdmin ? `<button class="btn btn-sm btn-danger" onclick="event.stopPropagation(); deleteCasting('${item.id}')" title="Delete">${UI.icon('trash')}</button>` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  function renderCards() {
    const grid = document.getElementById('castCardGrid');
    if (!grid) return;
    if (filteredInventory.length === 0) {
      grid.innerHTML = `<div style="grid-column: 1 / -1;"><div class="empty-state">No casting inventory found.</div></div>`;
      return;
    }

    grid.innerHTML = filteredInventory.map(item => {
      const img = item.image_url
        ? `<img src="${item.image_url}" style="width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: var(--radius-md) var(--radius-md) 0 0; cursor: pointer;" loading="lazy" onclick="UI.showImage(this.src)" />`
        : `<div style="width:100%; aspect-ratio:1; background:var(--bg-glass); border-radius:var(--radius-md) var(--radius-md) 0 0; display:flex; align-items:center; justify-content:center; color:var(--text-muted)">No Img</div>`;

      return `
        <div class="card" style="padding: 0; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; overflow: hidden; position: relative;" onclick="editCasting('${item.id}')">
          ${img}
          <div style="padding: 1rem;">
            <h3 style="margin: 0 0 0.5rem 0; font-size: 1.1rem; color: var(--text-primary);">${escapeHtml(item.casting_product_code)}</h3>
            <div class="text-sm text-muted">Stock: <strong style="color:${item.qty === 0 ? 'var(--error)' : 'var(--text-primary)'}">${item.qty}</strong></div>
          </div>
          ${isAdmin ? `
            <button class="btn btn-danger" style="position: absolute; top: 0.5rem; right: 0.5rem; padding: 0.3rem; border-radius: 50%; opacity: 0.8; box-shadow: 0 2px 4px rgba(0,0,0,0.5);" onclick="event.stopPropagation(); deleteCasting('${item.id}')" title="Delete">
                ${UI.icon('trash')}
            </button>
            ` : ''}
        </div>
      `;
    }).join('');
  }

  catFilterSelect.addEventListener('change', applyFiltersAndSort);
  attrFilterSelect.addEventListener('change', applyFiltersAndSort);
  stockFilterSelect.addEventListener('change', applyFiltersAndSort);
  sortSelect.addEventListener('change', applyFiltersAndSort);
  searchInput.addEventListener('input', applyFiltersAndSort);
  btnSearch.addEventListener('click', applyFiltersAndSort);

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
      if (sortMode === 'code_asc') return (a.casting_product_code || '').localeCompare(b.casting_product_code || '');
      if (sortMode === 'qty_desc') return b.qty - a.qty;
      if (sortMode === 'qty_asc') return a.qty - b.qty;
      if (sortMode === 'weight_desc') return b.total_weight - a.total_weight;
      if (sortMode === 'newest') return new Date(b.updated_at) - new Date(a.updated_at);
      return 0;
    });

    filteredInventory = result;
    renderCurrentView();
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('castFormSubmit');
    const id = document.getElementById('cId').value;
    const total = parseFloat(document.getElementById('cTotalWt').value) || 0;
    const std = parseFloat(document.getElementById('cStdWt').value) || 0;
    const calculatedQty = std > 0 ? Math.round(total / std) : 0;

    btn.disabled = true;
    btn.innerHTML = 'Processing...';

    try {
      let qtyChange = id ? 0 : calculatedQty;

      if (id) {
        const item = inventory.find(x => x.id === id);
        if (item) {
          // Calculate delta if weights changed
          qtyChange = calculatedQty - item.qty;
        }
      }

      let finalId = id;
      const inputCode = document.getElementById('cCode').value || '';

      // Check for duplicates if creating new
      if (!finalId && inputCode) {
        const existing = inventory.find(i => (i.casting_product_code || '').toLowerCase() === inputCode.toLowerCase());
        if (existing) {
          const proceed = await UI.confirm('Duplicate Casting Code', `Casting code "${inputCode}" already exists. Do you want to update the existing entry instead of creating a new one?`);
          if (!proceed) {
            btn.disabled = false;
            btn.innerHTML = 'Submit Entry';
            return;
          }
          finalId = existing.id;
          qtyChange = calculatedQty - (existing.qty || 0);
        }
      }

      const payload = {
        id: finalId || null,
        product_code: inputCode,
        casting_product_code: document.getElementById('cCastCode').value,
        qty_change: qtyChange,
        std_weight: std,
        manual_total_weight: total,
        image_url: currentImageUrl,
        category_id: document.getElementById('cCategory').value || null,
        attribute_ids: JSON.parse(document.getElementById('cSelectedAttrs').value || '[]')
      };

      await api.transactCasting(payload);
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

  window.deleteCasting = async function (id) {
    if (!id) return;

    try {
      const p = inventory.find(x => x.id === id);
      if (!p) return;

      const codeToDisplay = p.casting_product_code || 'Casting Product';
      const { links } = await api.checkDeleteLinks('casting', id);

      if (links.fg || links.wax) {
        const targets = await UI.crossDeleteConfirm(codeToDisplay, links);
        if (!targets) return;

        const btn = document.getElementById('btnDeleteCast');
        if (btn) {
          btn.disabled = true;
          btn.innerHTML = '<div class="spinner"></div>';
        }

        await api.executeCrossDelete(targets);
        UI.toast('Selected inventory records deleted successfully', 'success');
        modal.classList.remove('active');
        loadInventory();
      } else {
        const confirmed = await UI.confirm('Delete Casting Listing', 'Are you sure you want to delete this casting inventory? This action cannot be undone.');
        if (!confirmed) return;

        const btn = document.getElementById('btnDeleteCast');
        if (btn) {
          btn.disabled = true;
          btn.innerHTML = '<div class="spinner"></div>';
        }

        await api.deleteCasting(id);
        UI.toast('Casting deleted successfully', 'success');
        modal.classList.remove('active');
        loadInventory();
      }
    } catch (err) {
      UI.toast(err.message, 'error');
    } finally {
      const btn = document.getElementById('btnDeleteCast');
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `${UI.icon('trash')} Delete Listing`;
      }
    }
  };

  const btnDelete = document.getElementById('btnDeleteCast');
  btnDelete.addEventListener('click', () => {
    const id = document.getElementById('cId').value;
    window.deleteCasting(id);
  });

  window.editCasting = function (id) {
    const item = inventory.find(x => x.id === id);
    if (!item) return;

    form.reset();
    document.getElementById('cId').value = item.id;
    modalTitle.textContent = 'Edit Listing';

    document.getElementById('cCastCode').value = item.casting_product_code;
    document.getElementById('cCode').value = item.product_code || '';
    document.getElementById('cTotalWt').value = item.total_weight;
    document.getElementById('cStdWt').value = item.std_weight;
    document.getElementById('calcQtyDisplay').textContent = item.qty;

    const catModalSelect = document.getElementById('cCategory');
    if (catModalSelect) catModalSelect.value = item.category_id || '';
    renderAttributeSelector(item.attribute_ids || []);

    if (item.image_url) {
      currentImageUrl = item.image_url;
      imagePreview.innerHTML = `<img src="${item.image_url}" style="width: 100%; height: 100%; object-fit: cover;" />`;
      document.getElementById('btnRemoveCastImage').style.display = 'inline-block';
    } else {
      currentImageUrl = null;
      imagePreview.innerHTML = UI.icon('image');
      document.getElementById('btnRemoveCastImage').style.display = 'none';
    }

    document.getElementById('btnDeleteCast').style.display = 'inline-flex';
    modal.classList.add('active');
  };

  // CSV Import Logic
  function setupCsvImport() {
    const csvInput = document.getElementById('cCsvInput');
    if (!csvInput) return;

    csvInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        const text = await file.text();
        const rows = text.split('\\n').map(r => r.trim()).filter(r => r);
        if (rows.length < 2) throw new Error("CSV appears empty or missing headers");

        const headers = rows[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
        const pCodeIdx = headers.findIndex(h => h === 'product_code' || h === 'product code' || h === 'code');
        const cCodeIdx = headers.findIndex(h => h === 'casting_code' || h === 'cast code' || h === 'casting code' || h === 'casting_product_code');
        const qtyIdx = headers.findIndex(h => h === 'qty' || h === 'quantity' || h === 'qty_change');
        const stdWtIdx = headers.findIndex(h => h === 'std_weight' || h === 'std weight' || h === 'standard weight');

        if (cCodeIdx === -1 && pCodeIdx === -1) throw new Error("Could not find a 'casting code' or 'product code' column");

        const items = [];
        for (let i = 1; i < rows.length; i++) {
          const cols = rows[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || rows[i].split(',');
          const clean = cols.map(c => c.replace(/^"|"$/g, '').trim());

          const cc = cCodeIdx !== -1 ? clean[cCodeIdx] : null;
          const pc = pCodeIdx !== -1 ? clean[pCodeIdx] : null;

          if (!cc && !pc) continue;

          const payload = {
            product_code: pc,
            casting_product_code: cc
          };
          if (qtyIdx !== -1 && clean[qtyIdx] !== '') payload.qty = parseInt(clean[qtyIdx]);
          if (stdWtIdx !== -1 && clean[stdWtIdx] !== '') payload.std_weight = parseFloat(clean[stdWtIdx]);

          items.push(payload);
        }

        if (items.length === 0) throw new Error("No valid rows found in CSV");

        UI.toast(`Uploading ${items.length} items...`, 'info');
        const resp = await api.bulkUploadCasting(items);
        UI.toast(resp.message, 'success');
        loadInventory();

      } catch (err) {
        UI.toast(err.message || "Failed to process CSV", 'error');
        console.error(err);
      } finally {
        e.target.value = '';
      }
    });
  }

  async function init() {
    try {
      const config = await api.getInvConfig();
      categories = config.categories || [];

      const attrRes = await api.getCastingAttributes();
      availableAttributes = attrRes.attributes || [];

      catFilterSelect.innerHTML = '<option value="">All Categories</option>' +
        categories.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');

      const catModalSel = document.getElementById('cCategory');
      if (catModalSel) {
        document.getElementById('cCategory').innerHTML = '<option value="">No Category</option>' + String(categories.map(c => `<option value="${c.id}">${c.name}</option>`).join(''));
      }

      renderAttributeSelector([]);

      // Populate attribute filter dropdown
      attrFilterSelect.innerHTML = '<option value="">All Attributes</option>' +
        availableAttributes.map(a => `<option value="${a.id}">${escapeHtml(a.name)}</option>`).join('');

      loadInventory(); // Load inventory after initial setup
    } catch (err) {
      UI.toast('Failed to load initial configuration', 'error');
      console.error(err);
    }
  }

  async function loadInventory() {
    try {
      const data = await api.getCastingInventory();
      inventory = data.inventory || [];
      applyFiltersAndSort();
    } catch (err) {
      UI.toast('Failed to load casting inventory', 'error');
      console.error(err);
    }
  }

  function renderAttributeSelector(selectedIds = []) {
    const attrCont = document.getElementById('cAttributeContainer');
    const selInput = document.getElementById('cSelectedAttrs');
    if (!attrCont || !selInput) return;

    if (availableAttributes.length === 0) {
      attrCont.innerHTML = '<span class="text-xs text-muted">No attributes available in settings</span>';
      return;
    }

    selInput.value = JSON.stringify(selectedIds);

    attrCont.innerHTML = availableAttributes.map(attr => {
      const isSelected = selectedIds.includes(attr.id);
      return `
        <div class="attr-chip ${isSelected ? 'active' : ''}" data-id="${attr.id}"
             style="padding: 0.2rem 0.6rem; border-radius: 1rem; border: 1px solid ${isSelected ? 'var(--gold-light)' : 'var(--border-color)'};
                    background: ${isSelected ? 'var(--gold-dark)' : 'transparent'}; color: ${isSelected ? 'white' : 'var(--text-muted)'};
                    cursor: pointer; font-size: 0.75rem; transition: all 0.2s; display: flex; align-items: center; gap: 4px;">
          ${escapeHtml(attr.name)}
          ${isSelected ? '<span>&times;</span>' : ''}
        </div>
      `;
    }).join('');

    attrCont.querySelectorAll('.attr-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const id = chip.dataset.id;
        let current = JSON.parse(selInput.value || '[]');
        if (current.includes(id)) current = current.filter(x => x !== id);
        else current.push(id);
        renderAttributeSelector(current);
      });
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]);
  }

  init();
  setupCsvImport();
})();
