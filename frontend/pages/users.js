/**
 * Jai Gems — User Management Page Script
 * Loaded dynamically into the dashboard content area.
 */

(async function () {
    const container = document.getElementById('pageContent');

    // Render the page structure
    container.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">User Management</h1>
        <p class="page-subtitle">Manage employee accounts and roles</p>
      </div>
      <button class="btn btn-primary" id="btnCreateUser">
        ${UI.icon('plus')}
        <span>Add User</span>
      </button>
    </div>

    <div class="card">
      <div class="table-container">
        <table class="table" id="usersTable">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="usersTableBody">
            <tr><td colspan="6" style="text-align:center; padding: 2rem;">
              <div class="spinner" style="margin: 0 auto;"></div>
            </td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create/Edit User Modal -->
    <div class="modal-overlay" id="userModal">
      <div class="modal">
        <div class="modal-header">
          <h2 class="modal-title" id="userModalTitle">Add New User</h2>
          <button class="modal-close" id="userModalClose">&times;</button>
        </div>
        <form id="userForm">
          <input type="hidden" id="userId" />
          <div class="form-group">
            <label class="form-label" for="userFullName">Full Name *</label>
            <input class="form-input" type="text" id="userFullName" placeholder="Enter full name" required />
          </div>
          <div class="form-group" id="emailGroup">
            <label class="form-label" for="userEmail">Email *</label>
            <input class="form-input" type="email" id="userEmail" placeholder="Enter email address" required />
          </div>
          <div class="form-group" id="passwordGroup">
            <label class="form-label" for="userPassword">Password *</label>
            <input class="form-input" type="password" id="userPassword" placeholder="Min 6 characters" required minlength="6" />
          </div>
          <div class="form-group">
            <label class="form-label" for="userRole">Role *</label>
            <select class="form-select" id="userRole" required>
              <option value="">Select role...</option>
              <option value="admin">Admin / Owner</option>
              <option value="wax_employee">Wax Employee</option>
              <option value="jhalai_employee">Jhalai Employee</option>
              <option value="wax_tree_employee">Wax Tree Employee</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="userPhone">Phone</label>
            <input class="form-input" type="tel" id="userPhone" placeholder="Enter phone number" />
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" id="userModalCancel">Cancel</button>
            <button type="submit" class="btn btn-primary" id="userFormSubmit">
              <span>Create User</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

    // State
    let users = [];

    // Elements
    const tableBody = document.getElementById('usersTableBody');
    const modal = document.getElementById('userModal');
    const form = document.getElementById('userForm');
    const modalTitle = document.getElementById('userModalTitle');
    const submitBtn = document.getElementById('userFormSubmit');
    const emailGroup = document.getElementById('emailGroup');
    const passwordGroup = document.getElementById('passwordGroup');

    // Render users table
    function renderUsers() {
        if (users.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><p>No users found. Create your first user above.</p></div></td></tr>`;
            return;
        }

        tableBody.innerHTML = users.map(user => {
            const rb = UI.roleBadge(user.role);
            const statusBadge = user.is_active
                ? '<span class="badge badge-success">Active</span>'
                : '<span class="badge badge-error">Inactive</span>';
            const currentUser = Auth.getUser();
            const isSelf = currentUser && currentUser.id === user.id;

            return `
        <tr>
          <td><strong>${escapeHtml(user.full_name)}</strong></td>
          <td style="color: var(--text-secondary);">${escapeHtml(user.email || '—')}</td>
          <td><span class="badge ${rb.class}">${rb.label}</span></td>
          <td style="color: var(--text-secondary);">${escapeHtml(user.phone || '—')}</td>
          <td>${statusBadge}</td>
          <td>
            <div class="user-actions">
              <button class="btn btn-sm btn-secondary" onclick="editUser('${user.id}')" title="Edit">
                ${UI.icon('edit')}
              </button>
              ${!isSelf ? `<button class="btn btn-sm btn-danger" onclick="deactivateUser('${user.id}', '${escapeHtml(user.full_name)}')" title="${user.is_active ? 'Deactivate' : 'Already inactive'}">
                ${UI.icon('trash')}
              </button>` : ''}
            </div>
          </td>
        </tr>
      `;
        }).join('');
    }

    // Load users
    async function loadUsers() {
        try {
            const data = await api.getUsers();
            users = data.users;

            // Fetch emails from auth (we'll show email from the users list)
            // Email is not stored in the users profile table, but we get it from Supabase auth
            // For display, we'll need to get it from the auth endpoint
            renderUsers();
        } catch (err) {
            UI.toast(err.message, 'error');
            tableBody.innerHTML = `<tr><td colspan="6" class="text-center" style="padding:2rem;color:var(--error);">${err.message}</td></tr>`;
        }
    }

    // Open modal for create
    document.getElementById('btnCreateUser').addEventListener('click', () => {
        form.reset();
        document.getElementById('userId').value = '';
        modalTitle.textContent = 'Add New User';
        submitBtn.innerHTML = '<span>Create User</span>';
        emailGroup.style.display = '';
        passwordGroup.style.display = '';
        document.getElementById('userEmail').required = true;
        document.getElementById('userPassword').required = true;
        modal.classList.add('active');
    });

    // Close modal
    document.getElementById('userModalClose').addEventListener('click', () => modal.classList.remove('active'));
    document.getElementById('userModalCancel').addEventListener('click', () => modal.classList.remove('active'));
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('active'); });

    // Edit user
    window.editUser = function (id) {
        const user = users.find(u => u.id === id);
        if (!user) return;

        form.reset();
        document.getElementById('userId').value = user.id;
        document.getElementById('userFullName').value = user.full_name;
        document.getElementById('userRole').value = user.role;
        document.getElementById('userPhone').value = user.phone || '';
        modalTitle.textContent = 'Edit User';
        submitBtn.innerHTML = '<span>Save Changes</span>';

        // Hide email and password for edit
        emailGroup.style.display = 'none';
        passwordGroup.style.display = 'none';
        document.getElementById('userEmail').required = false;
        document.getElementById('userPassword').required = false;

        modal.classList.add('active');
    };

    // Deactivate user
    window.deactivateUser = async function (id, name) {
        if (!confirm(`Are you sure you want to deactivate "${name}"?`)) return;

        try {
            await api.deleteUser(id);
            UI.toast(`${name} has been deactivated`, 'success');
            loadUsers();
        } catch (err) {
            UI.toast(err.message, 'error');
        }
    };

    // Form submit
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const userId = document.getElementById('userId').value;
        const isEdit = !!userId;

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<div class="spinner"></div><span>Saving...</span>';

        try {
            if (isEdit) {
                await api.updateUser(userId, {
                    full_name: document.getElementById('userFullName').value,
                    role: document.getElementById('userRole').value,
                    phone: document.getElementById('userPhone').value || null,
                });
                UI.toast('User updated successfully', 'success');
            } else {
                await api.createUser({
                    email: document.getElementById('userEmail').value,
                    password: document.getElementById('userPassword').value,
                    full_name: document.getElementById('userFullName').value,
                    role: document.getElementById('userRole').value,
                    phone: document.getElementById('userPhone').value || null,
                });
                UI.toast('User created successfully', 'success');
            }

            modal.classList.remove('active');
            loadUsers();
        } catch (err) {
            UI.toast(err.message, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `<span>${isEdit ? 'Save Changes' : 'Create User'}</span>`;
        }
    });

    // Utility
    function escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // Load data
    loadUsers();
})();
