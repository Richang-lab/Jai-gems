/**
 * Jai Gems — Finished Goods Page
 */

(async function () {
  const container = document.getElementById('pageContent');

  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Finished Goods</h1>
        <p class="page-subtitle">Manage finished inventory ready for orders</p>
      </div>
      <div style="display:flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
        <!-- Filter/Sort Bar -->
        <div style="display:flex; gap: 0.5rem; background: var(--bg-glass); padding: 0.3rem; border-radius: var(--radius-md);">
           <select id="pCategoryFilter" class="form-input" style="width: 140px; padding: 0.2rem 0.5rem; font-size: 0.85rem;">
              <option value="">All Categories</option>
           </select>
           <select id="pStockFilter" class="form-input" style="width: 120px; padding: 0.2rem 0.5rem; font-size: 0.85rem;">
              <option value="all">All Stock</option>
              <option value="in">In Stock (>0)</option>
              <option value="out">Out of Stock (=0)</option>
           </select>
           <select id="pAttrFilter" class="form-input" style="width: 140px; padding: 0.2rem 0.5rem; font-size: 0.85rem;">
              <option value="">All Attributes</option>
           </select>
           <select id="pSort" class="form-input" style="width: 120px; padding: 0.2rem 0.5rem; font-size: 0.85rem;">
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="code_asc">Code (A-Z)</option>
              <option value="qty_desc">Qty (High-Low)</option>
              <option value="qty_asc">Qty (Low-High)</option>
              <option value="weight_desc">Weight (High-Low)</option>
           </select>
        </div>

        <div class="search-bar" style="display:flex; gap: 0.5rem; align-items: center;">
          <input type="text" id="fgSearch" class="form-input" placeholder="Search..." style="width: 180px;" />
          <button class="btn btn-secondary btn-sm" id="btnSearchFg">Search</button>
        </div>
        
        <div class="view-toggles" style="display:flex; background:var(--bg-primary); border-radius:var(--radius-md); padding:2px;">
           <button class="btn btn-sm" id="btnViewTable" style="background:var(--bg-glass); color:var(--text-primary);" title="Table View">${UI.icon('list')}</button>
           <button class="btn btn-sm" id="btnViewCard" style="background:transparent; color:var(--text-muted);" title="Card View">${UI.icon('grid')}</button>
        </div>
        
        <button class="btn btn-primary" id="btnCreateFg">
          ${UI.icon('plus')} Add Product
        </button>
      </div>
    </div>

    <div class="card" id="tableViewContainer">
      <div class="table-container">
        <table class="table" id="fgTable">
          <thead>
            <tr>
              <th>Image</th>
              <th>Product Code</th>
              <th>Category</th>
              <th>Inventory</th>
              <th>Details</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="fgTableBody">
            <tr><td colspan="6" class="text-center"><div class="spinner"></div></td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <div id="cardViewContainer" style="display:none; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: var(--space-md); margin-bottom: 2rem;">
       <!-- Cards injected here -->
    </div>

    <!-- Product Modal -->
    <div class="modal-overlay" id="fgModal">
      <div class="modal" style="max-width: 800px; width: 95%;">
        <div class="modal-header">
          <h2 class="modal-title" id="fgModalTitle">Add Product</h2>
          <button class="modal-close" id="fgModalClose">&times;</button>
        </div>
        <form id="fgForm">
          <input type="hidden" id="fgId" />
          <input type="hidden" id="fgImageUrl" />

          <div style="display: grid; grid-template-columns: 1fr 2fr; gap: var(--space-lg); margin-bottom: 1rem;">
            
            <!-- Left Col: Image Upload -->
            <div>
              <label class="form-label">Product Image</label>
              <div id="imagePreview" style="width: 100%; aspect-ratio: 1; background: var(--bg-primary); border: 2px dashed var(--border-color); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; overflow: hidden; margin-bottom: 0.5rem; position: relative;">
                <span class="text-muted text-sm" id="imagePlaceholder">No Image</span>
                <img id="imageActual" src="" style="display: none; width: 100%; height: 100%; object-fit: cover;" />
              </div>
              <input type="file" id="imageInput" accept="image/*" class="form-input" style="font-size: 0.8em; padding: 0.4rem;" />
              <div id="imageUploadStatus" class="text-xs text-muted" style="margin-top: 4px;"></div>
            </div>

            <!-- Right Col: Primary Info -->
            <div>
              <div class="form-group">
                <label class="form-label">Product Code *</label>
                <input class="form-input" type="text" id="pCode" required />
              </div>
              <div class="form-group">
                <label class="form-label">Casting Code</label>
                <input class="form-input" type="text" id="cCode" />
              </div>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-md);">
                <div class="form-group">
                  <label class="form-label">Category</label>
                  <select class="form-input" id="pCategory"></select>
                </div>
                <div class="form-group">
                  <label class="form-label">Quantity</label>
                  <input class="form-input" type="number" id="pQty" min="0" value="0" />
                </div>
              </div>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-md);">
                <div class="form-group">
                  <label class="form-label">Price</label>
                  <input class="form-input" type="number" step="0.01" id="pPrice" value="0" />
                </div>
                <div class="form-group">
                  <label class="form-label">Weight (g)</label>
                  <input class="form-input" type="number" step="0.001" id="pWeight" value="0" />
                </div>
              </div>
            </div>

          </div> <!-- End top grid -->

          <div class="form-group">
            <label class="form-label">Attributes</label>
            <div id="fgAttributeContainer" style="display: flex; flex-wrap: wrap; gap: 0.5rem; padding: 0.5rem; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-md); min-height: 42px;">
              <span class="text-xs text-muted">Loading attributes...</span>
            </div>
            <input type="hidden" id="fgSelectedAttrs" value="[]" />
          </div>

          <h3 style="margin: 1rem 0 1rem; font-size: 1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem;">Stone Configuration (Max 5)</h3>
          
          <div id="stoneRowsContainer">
            <!-- 5 rows injected by JS -->
          </div>

          <div class="modal-actions" style="margin-top: 2rem;">
            <button type="button" class="btn btn-secondary" id="fgModalCancel">Cancel</button>
            <button type="submit" class="btn btn-primary" id="fgFormSubmit">Save Product</button>
          </div>
        </form>
      </div>
    </div>
  `;

  // Application State
  let products = [];
  let filteredProducts = [];
  let config = { categories: [], shapes: [], materials: [] };
  let availableAttributes = [];
  const isAdmin = Auth.getUser()?.role === 'admin';
  let currentView = 'table';

  // Elements
  const btnCreate = document.getElementById('btnCreateFg');
  const tableBody = document.getElementById('fgTableBody');
  const tableViewContainer = document.getElementById('tableViewContainer');
  const cardViewContainer = document.getElementById('cardViewContainer');

  const searchInput = document.getElementById('fgSearch');
  const btnSearch = document.getElementById('btnSearchFg');
  const btnViewTable = document.getElementById('btnViewTable');
  const btnViewCard = document.getElementById('btnViewCard');
  const modal = document.getElementById('fgModal');
  const form = document.getElementById('fgForm');
  const imageInput = document.getElementById('imageInput');

  // Filter/Sort Elements
  const categoryFilter = document.getElementById('pCategoryFilter');
  const stockFilter = document.getElementById('pStockFilter');
  const attrFilter = document.getElementById('pAttrFilter');
  const sortSelect = document.getElementById('pSort');

  if (!isAdmin && btnCreate) btnCreate.style.display = 'none';

  // Build the 5 stone rows
  const stonesContainer = document.getElementById('stoneRowsContainer');
  for (let i = 1; i <= 5; i++) {
    stonesContainer.innerHTML += `
      <div style="display: grid; grid-template-columns: 2fr 2fr 1fr; gap: var(--space-md); margin-bottom: 0.5rem; background: var(--bg-primary); padding: 0.5rem; border-radius: var(--radius-sm);">
        <div>
          <label class="form-label text-xs">Stone ${i} Shape & Size</label>
          <select class="form-input shape-select" id="s${i}_shape"><option value="">-- None --</option></select>
        </div>
        <div>
          <label class="form-label text-xs">Material</label>
          <select class="form-input mat-select" id="s${i}_mat"><option value="">-- None --</option></select>
        </div>
        <div>
          <label class="form-label text-xs">Qty</label>
          <input class="form-input" type="number" min="0" id="s${i}_qty" />
        </div>
      </div>
    `;
  }

  // Initial Load
  async function init() {
    try {
      config = await api.getInvConfig();
      populateDropdowns();

      // Load shared attributes pool
      const attrRes = await api.getCastingAttributes();
      availableAttributes = attrRes.attributes || [];
      renderFgAttributeSelector([]);

      // Populate attribute filter dropdown
      attrFilter.innerHTML = '<option value="">All Attributes</option>' +
        availableAttributes.map(a => `<option value="${a.id}">${escapeHtml(a.name)}</option>`).join('');

      await loadProducts();
      setupImageUploader();
    } catch (err) {
      UI.toast('Failed to initialize page', 'error');
    }
  }

  function renderFgAttributeSelector(selectedIds = []) {
    const container = document.getElementById('fgAttributeContainer');
    const hiddenInput = document.getElementById('fgSelectedAttrs');
    if (!container || !hiddenInput) return;

    if (availableAttributes.length === 0) {
      container.innerHTML = '<span class="text-xs text-muted">No attributes found — add some in Settings</span>';
      return;
    }

    hiddenInput.value = JSON.stringify(selectedIds);
    container.innerHTML = availableAttributes.map(attr => {
      const isSelected = selectedIds.includes(attr.id);
      return `
        <div class="attr-chip" data-id="${attr.id}"
             style="padding: 0.2rem 0.6rem; border-radius: 1rem; cursor: pointer; font-size: 0.75rem; transition: all 0.2s; display: flex; align-items: center; gap: 4px;
                    border: 1px solid ${isSelected ? 'var(--gold-light)' : 'var(--border-color)'};
                    background: ${isSelected ? 'var(--gold-dark)' : 'transparent'};
                    color: ${isSelected ? 'white' : 'var(--text-muted)'}">
          ${escapeHtml(attr.name)}
          ${isSelected ? '<span>&times;</span>' : ''}
        </div>
      `;
    }).join('');

    container.querySelectorAll('.attr-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const id = chip.dataset.id;
        let current = JSON.parse(hiddenInput.value || '[]');
        if (current.includes(id)) current = current.filter(x => x !== id);
        else current.push(id);
        renderFgAttributeSelector(current);
      });
    });
  }

  function populateDropdowns() {
    const catSel = document.getElementById('pCategory');
    const catList = config.categories.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');

    catSel.innerHTML = '<option value="">-- Select --</option>' + catList;
    categoryFilter.innerHTML = '<option value="">All Categories</option>' + catList;

    const shapeOpts = '<option value="">-- None --</option>' + config.stoneTypes.map(s => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join('');
    const matOpts = '<option value="">-- None --</option>' + config.materials.map(m => `<option value="${m.id}">${escapeHtml(m.name)}</option>`).join('');

    document.querySelectorAll('.shape-select').forEach(el => el.innerHTML = shapeOpts);
    document.querySelectorAll('.mat-select').forEach(el => el.innerHTML = matOpts);
  }

  async function loadProducts() {
    try {
      const data = await api.getFinishedGoods();
      products = data.products;
      filteredProducts = [...products];
      renderCurrentView();
    } catch (err) {
      tableBody.innerHTML = `<tr><td colspan="6" class="text-error">${err.message}</td></tr>`;
      cardViewContainer.innerHTML = `<div class="text-error">${err.message}</div>`;
    }
  }

  function renderCurrentView() {
    if (currentView === 'table') {
      tableViewContainer.style.display = 'block';
      cardViewContainer.style.display = 'none';
      renderTable();
    } else {
      tableViewContainer.style.display = 'none';
      cardViewContainer.style.display = 'grid';
      renderCards();
    }
  }

  function renderTable() {
    if (filteredProducts.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="6"><div class="empty-state">No products found.</div></td></tr>`;
      return;
    }

    tableBody.innerHTML = filteredProducts.map(p => {
      const img = p.image_url
        ? `<img src="${p.image_url}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;" loading="lazy" />`
        : `<div style="width:40px; height:40px; background:var(--bg-glass); border-radius:4px; display:flex; align-items:center; justify-content:center; font-size:10px; color:var(--text-muted)">No Img</div>`;

      const invStr = `
        <div style="font-weight:bold;">${p.qty} in stock</div>
        <div class="text-xs text-muted">Reserved: ${p.reserved_qty}</div>
      `;

      const attrCount = (p.attribute_ids || []).length;
      const detailsStr = `
        <div class="text-xs text-secondary">Wt: ${p.weight}g</div>
        <div class="text-xs text-gold">₹${p.price}</div>
        ${attrCount > 0 ? `<div class="text-xs text-muted">${attrCount} attr${attrCount > 1 ? 's' : ''}</div>` : ''}
      `;

      return `
        <tr>
          <td>${img}</td>
          <td>
            <strong>${escapeHtml(p.product_code)}</strong>
            ${p.casting_product_code ? `<br/><span class="text-xs text-muted">Cast: ${escapeHtml(p.casting_product_code)}</span>` : ''}
          </td>
          <td>${escapeHtml(p.category?.name || '—')}</td>
          <td>${invStr}</td>
          <td>${detailsStr}</td>
          <td>
            ${isAdmin ? `
              <button class="btn btn-sm btn-secondary" onclick="event.stopPropagation(); editProduct('${p.id}')">${UI.icon('edit')}</button>
              <button class="btn btn-sm btn-danger" onclick="event.stopPropagation(); deleteProduct('${p.id}')">${UI.icon('trash')}</button>
            ` : '<span class="text-muted text-xs">Read Only</span>'}
          </td>
        </tr>
      `;
    }).join('');
  }

  function renderCards() {
    if (filteredProducts.length === 0) {
      cardViewContainer.innerHTML = `<div style="grid-column: 1 / -1;"><div class="empty-state">No products found.</div></div>`;
      return;
    }

    cardViewContainer.innerHTML = filteredProducts.map(p => {
      const img = p.image_url
        ? `<img src="${p.image_url}" style="width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: var(--radius-md) var(--radius-md) 0 0;" loading="lazy" />`
        : `<div style="width:100%; aspect-ratio:1; background:var(--bg-glass); border-radius:var(--radius-md) var(--radius-md) 0 0; display:flex; align-items:center; justify-content:center; color:var(--text-muted)">No Img</div>`;

      return `
               <div class="card" style="padding: 0; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; overflow: hidden; position: relative;" onclick="editProduct('${p.id}')">
                  ${img}
                  <div style="padding: 1rem;">
                      <h3 style="margin: 0 0 0.5rem 0; font-size: 1.1rem; color: var(--text-primary);">${escapeHtml(p.product_code)}</h3>
                      <div class="text-sm text-muted">Stock: <strong style="color:var(--text-primary)">${p.qty}</strong></div>
                  </div>
                  
                  ${isAdmin ? `
                  <button class="btn btn-danger" style="position: absolute; top: 0.5rem; right: 0.5rem; padding: 0.3rem; border-radius: 50%; opacity: 0.8; box-shadow: 0 2px 4px rgba(0,0,0,0.5);" onclick="event.stopPropagation(); deleteProduct('${p.id}')" title="Delete">
                      ${UI.icon('trash')}
                  </button>
                  ` : ''}
               </div>
            `;
    }).join('');
  }

  // Search and Toggle Handlers
  function applyFiltersAndSort() {
    const query = searchInput.value.toLowerCase().trim();
    const catId = categoryFilter.value;
    const stockMode = stockFilter.value;
    const attrId = attrFilter.value;
    const sortMode = sortSelect.value;

    let result = [...products];

    // 1. Search filter
    if (query) {
      result = result.filter(p =>
        p.product_code.toLowerCase().includes(query) ||
        (p.casting_product_code && p.casting_product_code.toLowerCase().includes(query)) ||
        (p.category && p.category.name.toLowerCase().includes(query))
      );
    }

    // 2. Category filter
    if (catId) {
      result = result.filter(p => p.category_id === catId);
    }

    // 3. Attribute filter
    if (attrId) {
      result = result.filter(p => (p.attribute_ids || []).includes(attrId));
    }

    // 4. Stock filter
    if (stockMode === 'in') {
      result = result.filter(p => p.qty > 0);
    } else if (stockMode === 'out') {
      result = result.filter(p => p.qty === 0);
    }

    // 4. Sort
    result.sort((a, b) => {
      if (sortMode === 'newest') return new Date(b.created_at) - new Date(a.created_at);
      if (sortMode === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
      if (sortMode === 'code_asc') return a.product_code.localeCompare(b.product_code);
      if (sortMode === 'qty_desc') return b.qty - a.qty;
      if (sortMode === 'qty_asc') return a.qty - b.qty;
      if (sortMode === 'weight_desc') return b.weight - a.weight;
      return 0;
    });

    filteredProducts = result;
    renderCurrentView();
  }

  function doSearch() {
    applyFiltersAndSort();
  }

  btnSearch.addEventListener('click', doSearch);
  searchInput.addEventListener('input', doSearch);
  categoryFilter.addEventListener('change', applyFiltersAndSort);
  stockFilter.addEventListener('change', applyFiltersAndSort);
  attrFilter.addEventListener('change', applyFiltersAndSort);
  sortSelect.addEventListener('change', applyFiltersAndSort);

  btnViewTable.addEventListener('click', () => {
    currentView = 'table';
    btnViewTable.style.background = 'var(--bg-glass)';
    btnViewTable.style.color = 'var(--text-primary)';
    btnViewCard.style.background = 'transparent';
    btnViewCard.style.color = 'var(--text-muted)';
    renderCurrentView();
  });

  btnViewCard.addEventListener('click', () => {
    currentView = 'card';
    btnViewCard.style.background = 'var(--bg-glass)';
    btnViewCard.style.color = 'var(--text-primary)';
    btnViewTable.style.background = 'transparent';
    btnViewTable.style.color = 'var(--text-muted)';
    renderCurrentView();
  });

  // Supabase direct storage upload
  function setupImageUploader() {
    imageInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const statusEl = document.getElementById('imageUploadStatus');
      const previewImg = document.getElementById('imageActual');
      const placeholder = document.getElementById('imagePlaceholder');

      statusEl.textContent = 'Uploading to Supabase...';
      statusEl.style.color = 'var(--text-gold)';

      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_fg_${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { publicUrl } = await api.uploadFile('product_images', fileName, file);

        document.getElementById('fgImageUrl').value = publicUrl;
        previewImg.src = publicUrl;
        previewImg.style.display = 'block';
        placeholder.style.display = 'none';

        statusEl.textContent = 'Upload complete ✓';
        statusEl.style.color = 'var(--success)';
      } catch (err) {
        statusEl.textContent = 'Upload failed: ' + err.message;
        statusEl.style.color = 'var(--error)';
        console.error(err);
      }
    });
  }

  // UI Handlers
  if (btnCreate) {
    btnCreate.addEventListener('click', () => {
      form.reset();
      document.getElementById('fgId').value = '';
      document.getElementById('fgImageUrl').value = '';
      document.getElementById('imageActual').style.display = 'none';
      document.getElementById('imagePlaceholder').style.display = 'block';
      document.getElementById('imageUploadStatus').textContent = '';
      renderFgAttributeSelector([]);

      document.getElementById('fgModalTitle').textContent = 'Add Finished Product';
      modal.classList.add('active');
    });
  }

  document.getElementById('fgModalClose').addEventListener('click', () => modal.classList.remove('active'));
  document.getElementById('fgModalCancel').addEventListener('click', () => modal.classList.remove('active'));

  window.editProduct = function (id) {
    const p = products.find(x => x.id === id);
    if (!p) return;

    form.reset();
    document.getElementById('fgId').value = p.id;
    document.getElementById('fgImageUrl').value = p.image_url || '';

    document.getElementById('pCode').value = p.product_code || '';
    document.getElementById('cCode').value = p.casting_product_code || '';
    document.getElementById('pCategory').value = p.category_id || '';
    document.getElementById('pQty').value = p.qty || 0;
    document.getElementById('pPrice').value = p.price || 0;
    document.getElementById('pWeight').value = p.weight || 0;

    for (let i = 1; i <= 5; i++) {
      document.getElementById(`s${i}_shape`).value = p[`stone_${i}_type_id`] || '';
      document.getElementById(`s${i}_mat`).value = p[`stone_${i}_material_id`] || '';
      document.getElementById(`s${i}_qty`).value = p[`stone_${i}_qty`] || '';
    }

    renderFgAttributeSelector(p.attribute_ids || []);

    const imgEl = document.getElementById('imageActual');
    const phEl = document.getElementById('imagePlaceholder');
    if (p.image_url) {
      imgEl.src = p.image_url;
      imgEl.style.display = 'block';
      phEl.style.display = 'none';
    } else {
      imgEl.style.display = 'none';
      phEl.style.display = 'block';
    }
    document.getElementById('imageUploadStatus').textContent = '';

    document.getElementById('fgModalTitle').textContent = 'Edit Product';
    modal.classList.add('active');
  };

  window.deleteProduct = async function (id) {
    try {
      const p = products.find(x => x.id === id);
      if (!p) return;

      const codeToDisplay = p.product_code || 'Product';
      const { links } = await api.checkDeleteLinks('fg', id);

      if (links.casting || links.wax) {
        // Exists in multiple places
        const targets = await UI.crossDeleteConfirm(codeToDisplay, links);
        if (!targets) return; // Cancelled

        await api.executeCrossDelete(targets);
        UI.toast('Selected inventory records deleted successfully', 'success');
      } else {
        // Only exists here
        const confirmed = await UI.confirm('Delete Product', 'Are you sure you want to delete this product? This action cannot be undone.');
        if (!confirmed) return;

        await api.deleteFinishedGood(id);
        UI.toast('Deleted successfully', 'success');
      }

      loadProducts();
    } catch (e) {
      UI.toast(e.message, 'error');
    }
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('fgId').value;
    const btn = document.getElementById('fgFormSubmit');
    btn.disabled = true;
    btn.innerHTML = 'Saving...';

    const payload = {
      product_code: document.getElementById('pCode').value,
      casting_product_code: document.getElementById('cCode').value || null,
      image_url: document.getElementById('fgImageUrl').value || null,
      category_id: document.getElementById('pCategory').value || null,
      qty: document.getElementById('pQty').value,
      price: document.getElementById('pPrice').value,
      weight: document.getElementById('pWeight').value,
      attribute_ids: JSON.parse(document.getElementById('fgSelectedAttrs').value || '[]'),
    };

    // Add stones
    for (let i = 1; i <= 5; i++) {
      payload[`stone_${i}_type_id`] = document.getElementById(`s${i}_shape`).value || null;
      payload[`stone_${i}_material_id`] = document.getElementById(`s${i}_mat`).value || null;
      payload[`stone_${i}_qty`] = document.getElementById(`s${i}_qty`).value || null;
    }

    try {
      if (id) await api.updateFinishedGood(id, payload);
      else await api.createFinishedGood(payload);

      UI.toast('Product Saved', 'success');
      modal.classList.remove('active');
      loadProducts();
    } catch (err) {
      UI.toast(err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = 'Save Product';
    }
  });

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]);
  }

  // To allow supabase url parsing in client
  async function fetchEnv() {
    try {
      // If we ever want to expose env publicly we can, but for now we rely on origin for API calls
    } catch (e) { }
  }

  init();
})();
