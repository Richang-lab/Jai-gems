/**
 * Jai Gems — Settings Page Script
 * Manages configuration tables: Categories, Stone Shapes, and Stone Materials
 */

(async function () {
    const container = document.getElementById('pageContent');

    container.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">System Settings</h1>
          <p class="page-subtitle">Configure dropdown options for the inventory modules</p>
        </div>
      </div>
  
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: var(--space-lg);">
        
        <!-- Categories Admin -->
        <div class="card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <h3 style="font-size: 1.1rem; color: var(--text-primary); margin: 0;">Product Categories</h3>
            <button class="btn btn-sm btn-primary" id="btnAddCat">
              ${UI.icon('plus')} Add
            </button>
          </div>
          <div class="table-container">
            <table class="table" style="min-width: 100%;">
              <thead><tr><th>Name</th><th style="width:60px">Action</th></tr></thead>
              <tbody id="catTableBody"><tr><td colspan="2" class="text-center"><div class="spinner"></div></td></tr></tbody>
            </table>
          </div>
        </div>
  
        <!-- Stone Shapes Admin -->
        <div class="card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h3 style="font-size: 1.1rem; color: var(--text-primary); margin: 0;">Stone Shapes</h3>
                <button class="btn btn-sm btn-primary" id="btnAddShape">
                ${UI.icon('plus')} Add
                </button>
            </div>
            <div class="table-container">
                <table class="table" style="min-width: 100%;">
                <thead><tr><th>Name (E.g. Square 4x4)</th><th style="width:60px">Action</th></tr></thead>
                <tbody id="shapeTableBody"><tr><td colspan="2" class="text-center"><div class="spinner"></div></td></tr></tbody>
                </table>
            </div>
        </div>

        <!-- Materials Admin -->
        <div class="card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h3 style="font-size: 1.1rem; color: var(--text-primary); margin: 0;">Stone Materials</h3>
                <button class="btn btn-sm btn-primary" id="btnAddMat">
                ${UI.icon('plus')} Add
                </button>
            </div>
            <div class="table-container">
                <table class="table" style="min-width: 100%;">
                <thead><tr><th>Name (E.g. Zircon)</th><th style="width:60px">Action</th></tr></thead>
                <tbody id="matTableBody"><tr><td colspan="2" class="text-center"><div class="spinner"></div></td></tr></tbody>
                </table>
            </div>
        </div>

        <!-- Casting Attributes Admin -->
        <div class="card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h3 style="font-size: 1.1rem; color: var(--text-primary); margin: 0;">Casting Attributes</h3>
                <button class="btn btn-sm btn-primary" id="btnAddCastAttr">
                ${UI.icon('plus')} Add
                </button>
            </div>
            <div class="table-container">
                <table class="table" style="min-width: 100%;">
                <thead><tr><th>Name (E.g. Filing, Polish)</th><th style="width:60px">Action</th></tr></thead>
                <tbody id="castAttrTableBody"><tr><td colspan="2" class="text-center"><div class="spinner"></div></td></tr></tbody>
                </table>
            </div>
        </div>

        <!-- Casting Rate -->
        <div class="card">
            <div style="margin-bottom:1rem;">
              <h3 style="font-size:1.1rem;color:var(--text-primary);margin:0 0 0.25rem;">Casting Rate</h3>
              <p class="text-muted text-sm" style="margin:0;">Rate per gram (₹) used to calculate estimated value for Casting Orders.</p>
            </div>
            <div style="display:flex;gap:0.75rem;align-items:center;">
              <span style="color:var(--gold-light);font-size:1.1rem;font-weight:600;">₹</span>
              <input class="form-input" type="number" id="castingRateInput" min="0" step="1" style="width:130px;" placeholder="e.g. 500" />
              <span class="text-muted text-sm">/gram</span>
              <button class="btn btn-primary btn-sm" id="btnSaveCastRate">${UI.icon('check')} Save</button>
            </div>
            <div id="castRateStatus" class="text-xs text-muted" style="margin-top:0.5rem;"></div>
        </div>

      </div>

      <!-- Super Admin Danger Zone -->
      ${Auth.getUser()?.role === 'admin' ? `
      <div class="card" style="margin-top: var(--space-xl); border: 2px solid var(--error); position: relative; overflow: hidden;">
        <div style="position: absolute; top:0; left:0; right:0; height: 4px; background: var(--error);"></div>
        <div style="margin-bottom:1rem;">
          <h3 style="font-size:1.2rem;color:var(--error);margin:0 0 0.25rem; display: flex; align-items:center; gap: 0.5rem;">
            ${UI.icon('alert-triangle')} DANGER ZONE
          </h3>
          <p class="text-muted text-sm" style="margin:0;">Destructive actions that cannot be undone.</p>
        </div>
        
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: rgba(2ef, 68, 68, 0.05); border-radius: var(--radius-md); border: 1px solid rgba(2ef, 68, 68, 0.2);">
          <div>
            <strong style="color:var(--text-primary); display:block; margin-bottom:0.25rem;">Delete All Inventory Data</strong>
            <span class="text-sm text-muted">Permanently deletes all products from Finished Goods, Casting, and Wax modules.</span>
          </div>
          <button class="btn btn-danger" id="btnDangerDeleteAll">
            ${UI.icon('trash')} Delete Everything
          </button>
        </div>
      </div>
      ` : ''}
    `;

    // Elements
    const catBody = document.getElementById('catTableBody');
    const shapeBody = document.getElementById('shapeTableBody');
    const matBody = document.getElementById('matTableBody');
    const castAttrBody = document.getElementById('castAttrTableBody');

    // Load initial data
    async function loadConfig() {
        try {
            const data = await api.getInvConfig();
            renderTable(catBody, data.categories, 'cat');
            renderTable(shapeBody, data.stoneTypes, 'shape');
            renderTable(matBody, data.materials, 'mat');

            const attrData = await api.getCastingAttributes();
            renderTable(castAttrBody, attrData.attributes, 'cast-attr');

            // Load casting rate
            const settingsRes = await api.getAppSettings();
            const rate = settingsRes.settings?.casting_rate || '';
            document.getElementById('castingRateInput').value = rate;
            if (rate) document.getElementById('castRateStatus').textContent = `Current rate: ₹${rate}/g`;
        } catch (err) {
            UI.toast('Failed to load settings', 'error');
        }
    }

    function renderTable(tbody, items, typeStr) {
        if (!items || items.length === 0) {
            tbody.innerHTML = `<tr><td colspan="2" class="text-center text-muted text-sm">No entries</td></tr>`;
            return;
        }

        tbody.innerHTML = items.map(i => `
            <tr>
                <td data-label="Name">${escapeHtml(i.name)}</td>
                <td data-label="Action">
                    <button class="btn btn-sm btn-danger" onclick="deleteConfigItem('${typeStr}', '${i.id}')" title="Delete">
                        ${UI.icon('trash')}
                    </button>
                </td>
            </tr>
        `).join('');
    }

    // Handlers
    document.getElementById('btnAddCat').addEventListener('click', () => addItem('Category', api.addCategory.bind(api)));
    document.getElementById('btnAddShape').addEventListener('click', () => addItem('Stone Shape & Size', api.addShape.bind(api)));
    document.getElementById('btnAddMat').addEventListener('click', () => addItem('Material', api.addMaterial.bind(api)));
    document.getElementById('btnAddCastAttr').addEventListener('click', () => addItem('Casting Attribute', (data) => api.addCastingAttribute(data.name)));

    document.getElementById('btnSaveCastRate').addEventListener('click', async () => {
        const val = document.getElementById('castingRateInput').value;
        if (!val || isNaN(val)) { UI.toast('Enter a valid rate', 'error'); return; }
        try {
            await api.updateAppSetting('casting_rate', val);
            UI.toast('Casting rate saved', 'success');
            document.getElementById('castRateStatus').textContent = `Current rate: ₹${val}/g`;
        } catch (err) {
            UI.toast(err.message || 'Failed to save rate', 'error');
        }
    });

    const btnDanger = document.getElementById('btnDangerDeleteAll');
    if (btnDanger) {
        btnDanger.addEventListener('click', async () => {
            const confirmed1 = await UI.confirm(
                'WARNING: IRREVERSIBLE ACTION',
                'You are about to permanently delete **ALL** inventory data across Finished Goods, Casting, and Wax.\n\nAre you absolutely sure you want to do this?'
            );

            if (!confirmed1) return;

            const confirmed2 = await UI.prompt(
                'FINAL CONFIRMATION',
                'Type "DELETE ALL" to confirm total data destruction:',
                ''
            );

            if (confirmed2 !== 'DELETE ALL') {
                UI.toast('Aborted. Incorrect confirmation text.', 'info');
                return;
            }

            try {
                btnDanger.disabled = true;
                btnDanger.innerHTML = '<div class="spinner text-xs"></div> Deleting...';

                const res = await api.deleteAllInventory();
                UI.toast(res.message || 'All inventory data deleted', 'success');

            } catch (err) {
                UI.toast(err.message || 'Failed to delete inventory', 'error');
            } finally {
                btnDanger.disabled = false;
                btnDanger.innerHTML = `${UI.icon('trash')} Delete Everything`;
            }
        });
    }

    async function addItem(label, apiFunc) {
        const name = await UI.prompt(`Add New ${label}`, `Enter name for ${label}:`, `New ${label} name...`);
        if (!name) return;

        try {
            await apiFunc({ name: name.trim() });
            UI.toast(`${label} added`, 'success');
            loadConfig();
        } catch (err) {
            UI.toast(err.message, 'error');
        }
    }

    window.deleteConfigItem = async function (type, id) {
        const confirmed = await UI.confirm('Confirm Deletion', 'Are you sure you want to delete this item? If it is used by inventory products, the deletion will fail.');
        if (!confirmed) return;

        try {
            if (type === 'cat') await api.deleteCategory(id);
            else if (type === 'shape') await api.deleteShape(id);
            else if (type === 'mat') await api.deleteMaterial(id);
            else if (type === 'cast-attr') await api.deleteCastingAttribute(id);

            UI.toast('Deleted successfully', 'success');
            loadConfig();
        } catch (err) {
            UI.toast(err.message, 'error');
        }
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]);
    }

    loadConfig();
})();
