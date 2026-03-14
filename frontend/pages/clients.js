/**
 * Jai Gems — Client Management Page Script
 * Loaded dynamically into the dashboard content area.
 */

(async function () {
    const container = document.getElementById('pageContent');

    // Render the page structure
    container.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Client Management</h1>
        <p class="page-subtitle">Manage business clients and their contact details</p>
      </div>
      <button class="btn btn-primary" id="btnCreateClient">
        ${UI.icon('plus')}
        <span>Add Client</span>
      </button>
    </div>

    <div class="card">
      <div class="table-container">
        <table class="table" id="clientsTable">
          <thead>
            <tr>
              <th>Business / Nickname</th>
              <th>Contact</th>
              <th>GST / Address</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="clientsTableBody">
            <tr><td colspan="4" style="text-align:center; padding: 2rem;">
              <div class="spinner" style="margin: 0 auto;"></div>
            </td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create/Edit Client Modal -->
    <div class="modal-overlay" id="clientModal">
      <div class="modal" style="max-width: 600px;">
        <div class="modal-header">
          <h2 class="modal-title" id="clientModalTitle">Add New Client</h2>
          <button class="modal-close" id="clientModalClose">&times;</button>
        </div>
        <form id="clientForm">
          <input type="hidden" id="clientId" />
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0 var(--space-md);">
            <div class="form-group">
              <label class="form-label" for="cBusinessName">Business Name *</label>
              <input class="form-input" type="text" id="cBusinessName" placeholder="E.g., Sharma Jewellers" required />
            </div>
            <div class="form-group">
              <label class="form-label" for="cNickname">Nickname</label>
              <input class="form-input" type="text" id="cNickname" placeholder="Short name for quick search" />
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0 var(--space-md);">
            <div class="form-group">
              <label class="form-label" for="cPhone">Phone Number *</label>
              <input class="form-input" type="tel" id="cPhone" placeholder="Mobile / Landline" required />
            </div>
            <div class="form-group">
              <label class="form-label" for="cEmail">Email Address</label>
              <input class="form-input" type="email" id="cEmail" placeholder="Optional" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="cGst">GST Number</label>
            <input class="form-input" type="text" id="cGst" placeholder="E.g., 07AAAAA0000A1Z5" />
          </div>

          <div class="form-group">
            <label class="form-label" for="cAddress">Street Address</label>
            <input class="form-input" type="text" id="cAddress" placeholder="Full street address" />
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0 var(--space-md);">
            <div class="form-group">
              <label class="form-label" for="cCity">City</label>
              <input class="form-input" type="text" id="cCity" placeholder="City" />
            </div>
            <div class="form-group">
              <label class="form-label" for="cState">State</label>
              <input class="form-input" type="text" id="cState" placeholder="State" />
            </div>
            <div class="form-group">
              <label class="form-label" for="cPincode">Pincode</label>
              <input class="form-input" type="text" id="cPincode" placeholder="Pincode" />
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" id="clientModalCancel">Cancel</button>
            <button type="submit" class="btn btn-primary" id="clientFormSubmit">
              <span>Save Client</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

    // State
    let clients = [];
    const currentUser = Auth.getUser();
    const isAdmin = currentUser && currentUser.role === 'admin';

    // Elements
    const tableBody = document.getElementById('clientsTableBody');
    const modal = document.getElementById('clientModal');
    const form = document.getElementById('clientForm');
    const modalTitle = document.getElementById('clientModalTitle');
    const submitBtn = document.getElementById('clientFormSubmit');
    const btnCreate = document.getElementById('btnCreateClient');

    // Hide create button if not admin
    if (!isAdmin && btnCreate) {
        btnCreate.style.display = 'none';
    }

    // Render table
    function renderClients() {
        if (clients.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="4"><div class="empty-state"><p>No clients found.</p></div></td></tr>`;
            return;
        }

        tableBody.innerHTML = clients.map(c => {
            const contactInfo = [
                c.phone_number ? `<div style="font-weight:500;">📞 ${escapeHtml(c.phone_number)}</div>` : '',
                c.email ? `<div style="color:var(--text-secondary);font-size:0.8em;">✉️ ${escapeHtml(c.email)}</div>` : ''
            ].filter(Boolean).join('');

            const addressInfo = [
                c.gst_number ? `<div style="font-size:0.85em;color:var(--text-gold);">GST: ${escapeHtml(c.gst_number)}</div>` : '',
                c.address ? `<div style="font-size:0.85em;color:var(--text-secondary);margin-top:4px;">${escapeHtml(c.address)}</div>` : '',
                (c.city || c.state || c.pincode) ? `<div style="font-size:0.85em;color:var(--text-muted);">${escapeHtml([c.city, c.state, c.pincode].filter(Boolean).join(', '))}</div>` : ''
            ].filter(Boolean).join('');

            return `
        <tr>
          <td>
            <strong>${escapeHtml(c.business_name)}</strong>
            ${c.nickname ? `<div style="font-size:0.85em;color:var(--text-muted);">(${escapeHtml(c.nickname)})</div>` : ''}
          </td>
          <td>${contactInfo || '<span class="text-muted">—</span>'}</td>
          <td>${addressInfo || '<span class="text-muted">—</span>'}</td>
          <td>
            ${isAdmin ? `
            <div class="user-actions">
              <button class="btn btn-sm btn-secondary" onclick="editClient('${c.id}')" title="Edit">
                ${UI.icon('edit')}
              </button>
              <button class="btn btn-sm btn-danger" onclick="deleteClient('${c.id}', '${escapeHtml(c.business_name)}')" title="Delete">
                ${UI.icon('trash')}
              </button>
            </div>
            ` : '<span class="text-muted text-xs">Read Only</span>'}
          </td>
        </tr>
      `;
        }).join('');
    }

    // Load clients
    async function loadClients() {
        try {
            const data = await api.getClients();
            clients = data.clients;
            renderClients();
        } catch (err) {
            UI.toast(err.message, 'error');
            tableBody.innerHTML = `<tr><td colspan="4" class="text-center" style="padding:2rem;color:var(--error);">${err.message}</td></tr>`;
        }
    }

    // Open modal for create
    if (btnCreate) {
        btnCreate.addEventListener('click', () => {
            form.reset();
            document.getElementById('clientId').value = '';
            modalTitle.textContent = 'Add New Client';
            submitBtn.innerHTML = '<span>Save Client</span>';
            modal.classList.add('active');
        });
    }

    // Close modal
    document.getElementById('clientModalClose').addEventListener('click', () => modal.classList.remove('active'));
    document.getElementById('clientModalCancel').addEventListener('click', () => modal.classList.remove('active'));
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('active'); });

    // Edit client
    window.editClient = function (id) {
        const c = clients.find(x => x.id === id);
        if (!c) return;

        form.reset();
        document.getElementById('clientId').value = c.id;
        document.getElementById('cBusinessName').value = c.business_name || '';
        document.getElementById('cPhone').value = c.phone_number || '';
        document.getElementById('cEmail').value = c.email || '';
        document.getElementById('cGst').value = c.gst_number || '';
        document.getElementById('cAddress').value = c.address || '';
        document.getElementById('cCity').value = c.city || '';
        document.getElementById('cState').value = c.state || '';
        document.getElementById('cPincode').value = c.pincode || '';
        document.getElementById('cNickname').value = c.nickname || '';

        modalTitle.textContent = 'Edit Client';
        submitBtn.innerHTML = '<span>Update Client</span>';
        modal.classList.add('active');
    };

    // Delete client
    window.deleteClient = async function (id, name) {
        if (!confirm(`Are you sure you want to delete client "${name}"? This action cannot be undone.`)) return;

        try {
            await api.deleteClient(id);
            UI.toast(`Client ${name} deleted`, 'success');
            loadClients();
        } catch (err) {
            UI.toast(err.message, 'error');
        }
    };

    // Form submit
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('clientId').value;
        const isEdit = !!id;

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<div class="spinner"></div><span>Saving...</span>';

        const payload = {
            business_name: document.getElementById('cBusinessName').value,
            phone_number: document.getElementById('cPhone').value,
            email: document.getElementById('cEmail').value || null,
            gst_number: document.getElementById('cGst').value || null,
            address: document.getElementById('cAddress').value || null,
            city: document.getElementById('cCity').value || null,
            state: document.getElementById('cState').value || null,
            pincode: document.getElementById('cPincode').value || null,
            nickname: document.getElementById('cNickname').value || null,
        };

        try {
            if (isEdit) {
                await api.updateClient(id, payload);
                UI.toast('Client updated successfully', 'success');
            } else {
                await api.createClient(payload);
                UI.toast('Client created successfully', 'success');
            }

            modal.classList.remove('active');
            loadClients();
        } catch (err) {
            UI.toast(err.message, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `<span>${isEdit ? 'Update Client' : 'Save Client'}</span>`;
        }
    });

    // Utility
    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // Init
    loadClients();
})();
