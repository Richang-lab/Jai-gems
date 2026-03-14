/**
 * Jai Gems â€” Toast Notifications & UI Utilities
 */

const UI = {
    /**
     * Show a toast notification.
     */
    toast(message, type = 'info', duration = 3500) {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        const icons = {
            success: 'âœ“',
            error: 'âœ•',
            info: 'â„¹',
        };

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `<span>${icons[type] || 'â„¹'}</span><span>${message}</span>`;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-10px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    /**
     * SVG icons used in navigation and buttons.
     */
    icons: {
        grid: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
        users: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
        package: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27,6.96 12,12.01 20.73,6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`,
        clipboard: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>`,
        'file-text': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10,9 9,9 8,9"/></svg>`,
        layers: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12,2 2,7 12,12 22,7"/><polyline points="2,17 12,22 22,17"/><polyline points="2,12 12,17 22,12"/></svg>`,
        'git-branch': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg>`,
        zap: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13,2 3,14 12,14 11,22 21,10 12,10"/></svg>`,
        'credit-card': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>`,
        'map-pin': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
        shield: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
        menu: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`,
        logout: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
        edit: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
        trash: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3,6 5,6 21,6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,
        plus: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
        settings: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`,
        box: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>`,
        database: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>`,
        image: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
        upload: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`,
        list: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>`,
        search: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
    },

    /**
     * Get SVG icon by name.
     */
    icon(name) {
        return this.icons[name] || '';
    },

    /**
     * Get role display label and badge class.
     */
    roleBadge(role) {
        const map = {
            admin: { label: 'Admin', class: 'badge-gold' },
            wax_employee: { label: 'Wax Employee', class: 'badge-info' },
            jhalai_employee: { label: 'Jhalai Employee', class: 'badge-success' },
            wax_tree_employee: { label: 'Wax Tree', class: 'badge-info' },
        };
        return map[role] || { label: role, class: 'badge-gold' };
    },

    /**
     * Build the sidebar navigation based on the user's role.
     */
    buildSidebar() {
        const user = Auth.getUser();
        const navItems = Auth.getNavItems();
        if (!user || !navItems) return;

        // Set user info in sidebar
        const avatar = document.getElementById('sidebarUserAvatar');
        const name = document.getElementById('sidebarUserName');
        const role = document.getElementById('sidebarUserRole');
        if (avatar) avatar.textContent = user.full_name.charAt(0).toUpperCase();
        if (name) name.textContent = user.full_name;
        if (role) {
            const rb = this.roleBadge(user.role);
            role.textContent = rb.label;
        }

        // Build navigation
        const nav = document.getElementById('sidebarNav');
        if (!nav) return;

        // Group items into sections
        const mainItems = navItems.filter(i => ['dashboard', 'clients'].includes(i.id));
        const invItems = navItems.filter(i => i.id.startsWith('inventory-'));
        const orderItems = navItems.filter(i => ['orders', 'order-tracking', 'invoices'].includes(i.id));
        const workItems = navItems.filter(i => i.id.startsWith('work-'));
        const paymentItems = navItems.filter(i => i.id.startsWith('outsource-'));
        const otherItems = navItems.filter(i => ['address-slips', 'settings', 'users'].includes(i.id));

        let html = '';

        if (mainItems.length) {
            html += '<div class="nav-section-label">Main</div>';
            mainItems.forEach(item => {
                html += `<a class="nav-item" data-page="${item.id}" href="/pages/${item.id}.html">
          ${this.icon(item.icon)}
          <span>${item.label}</span>
        </a>`;
            });
        }

        if (invItems.length) {
            html += '<div class="nav-section-label">Inventory</div>';
            invItems.forEach(item => {
                html += `<a class="nav-item" data-page="${item.id}" href="/pages/${item.id}.html">
          ${this.icon(item.icon)}
          <span>${item.label}</span>
        </a>`;
            });
        }

        if (orderItems.length) {
            html += '<div class="nav-section-label">Orders</div>';
            orderItems.forEach(item => {
                html += `<a class="nav-item" data-page="${item.id}" href="/pages/${item.id}.html">
          ${this.icon(item.icon)}
          <span>${item.label}</span>
        </a>`;
            });
        }

        if (workItems.length) {
            html += '<div class="nav-section-label">Work Distribution</div>';
            workItems.forEach(item => {
                html += `<a class="nav-item" data-page="${item.id}" href="/pages/${item.id}.html">
          ${this.icon(item.icon)}
          <span>${item.label}</span>
        </a>`;
            });
        }

        if (paymentItems.length) {
            html += '<div class="nav-section-label">Payments</div>';
            paymentItems.forEach(item => {
                html += `<a class="nav-item" data-page="${item.id}" href="/pages/${item.id}.html">
          ${this.icon(item.icon)}
          <span>${item.label}</span>
        </a>`;
            });
        }

        if (otherItems.length) {
            html += '<div class="nav-section-label">Settings</div>';
            otherItems.forEach(item => {
                html += `<a class="nav-item" data-page="${item.id}" href="/pages/${item.id}.html">
          ${this.icon(item.icon)}
          <span>${item.label}</span>
        </a>`;
            });
        }

        nav.innerHTML = html;

        // Add click handlers
        nav.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                this.navigateTo(page);
            });
        });

        // Highlight current page
        this.highlightCurrentNav();
    },

    /**
     * Navigate to a page by loading it into the main content area.
     */
    async navigateTo(page) {
        const container = document.getElementById('pageContent');
        const pageTitle = document.getElementById('pageTitle');
        if (!container) return;

        // Show loading
        container.innerHTML = '<div class="flex justify-center items-center" style="padding: 4rem;"><div class="spinner spinner-lg"></div></div>';

        // Update active nav
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        document.querySelector(`.nav-item[data-page="${page}"]`)?.classList.add('active');

        // Close sidebar on mobile
        document.querySelector('.sidebar')?.classList.remove('open');

        try {
            // Try to load page content
            let pagePath = `/pages/${page}.html`;
            const response = await fetch(pagePath);

            if (response.ok) {
                const html = await response.text();
                container.innerHTML = html;

                // Execute any scripts in the loaded page
                container.querySelectorAll('script').forEach(oldScript => {
                    const newScript = document.createElement('script');
                    if (oldScript.src) {
                        newScript.src = oldScript.src;
                    } else {
                        newScript.textContent = oldScript.textContent;
                    }
                    oldScript.parentNode.replaceChild(newScript, oldScript);
                });

                // Update page title
                const titleMap = {
                    dashboard: 'Dashboard',
                    clients: 'Clients',
                    'inventory-fg': 'Finished Goods',
                    'inventory-wax': 'Wax Inventory',
                    'inventory-cast': 'Casting Inventory',
                    orders: 'Orders',
                    invoices: 'Invoices',
                    'work-wax': 'Wax Work',
                    'work-tree': 'Wax Tree',
                    'work-jhalai': 'Jhalai Work',
                    'outsource-payments': 'Outsource Payments',
                    'outsource-payments-wax': 'Wax Payments',
                    'outsource-payments-jhalai': 'Jhalai Payments',
                    'address-slips': 'Address Slips',
                    settings: 'System Settings',
                    users: 'User Management',
                };
                if (pageTitle) pageTitle.textContent = titleMap[page] || page;

            } else {
                container.innerHTML = `
          <div class="empty-state">
            ${this.icon('package')}
            <h3 style="margin-bottom: 0.5rem; color: var(--text-primary);">Coming Soon</h3>
            <p>This module is under development.</p>
          </div>
        `;
                if (pageTitle) pageTitle.textContent = page.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            }
        } catch (err) {
            container.innerHTML = `
        <div class="empty-state">
          <h3 style="color: var(--error);">Failed to load page</h3>
          <p>${err.message}</p>
        </div>
      `;
        }

        // Save current page to URL hash
        window.location.hash = page;
    },

    /**
     * Highlight the current navigation item.
     */
    highlightCurrentNav() {
        const page = window.location.hash.replace('#', '') || 'dashboard';
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        document.querySelector(`.nav-item[data-page="${page}"]`)?.classList.add('active');
    },

    /**
     * Custom promise-based confirmation modal.
     */
    confirm(title, message) {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay active';
            overlay.style.zIndex = '3000'; // Above everything

            overlay.innerHTML = `
                <div class="modal card-glass" style="max-width: 400px; animation: slideInUp 0.3s ease;">
                    <div class="modal-header">
                        <h2 class="modal-title">${title}</h2>
                    </div>
                    <div style="margin-bottom: var(--space-lg); color: var(--text-secondary);">
                        ${message}
                    </div>
                    <div class="modal-actions">
                        <button class="btn btn-secondary" id="uiConfirmCancel">Cancel</button>
                        <button class="btn btn-primary" id="uiConfirmOk">Confirm</button>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);

            overlay.querySelector('#uiConfirmCancel').addEventListener('click', () => {
                overlay.remove();
                resolve(false);
            });
            overlay.querySelector('#uiConfirmOk').addEventListener('click', () => {
                overlay.remove();
                resolve(true);
            });
        });
    },

    /**
     * Custom promise-based prompt modal.
     */
    prompt(title, label, placeholder = '', defaultValue = '') {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay active';
            overlay.style.zIndex = '3000';

            overlay.innerHTML = `
                <div class="modal card-glass" style="max-width: 400px; animation: slideInUp 0.3s ease;">
                    <div class="modal-header">
                        <h2 class="modal-title">${title}</h2>
                    </div>
                    <div class="form-group">
                        <label class="form-label">${label}</label>
                        <input type="text" class="form-input" id="uiPromptInput" placeholder="${placeholder}" value="${defaultValue}">
                    </div>
                    <div class="modal-actions">
                        <button class="btn btn-secondary" id="uiPromptCancel">Cancel</button>
                        <button class="btn btn-primary" id="uiPromptOk">Save</button>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);

            const input = overlay.querySelector('#uiPromptInput');
            input.focus();
            input.select();

            overlay.querySelector('#uiPromptCancel').addEventListener('click', () => {
                overlay.remove();
                resolve(null);
            });

            const submit = () => {
                const val = input.value.trim();
                overlay.remove();
                resolve(val || null);
            };

            overlay.querySelector('#uiPromptOk').addEventListener('click', submit);
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') submit();
                if (e.key === 'Escape') {
                    overlay.remove();
                    resolve(null);
                }
            });
        });
    },

    /**
     * Cross-Module Delete Confirmation Modal
     */
    crossDeleteConfirm(itemCode, linkedItems) {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay active';
            overlay.style.zIndex = '3000';

            const { fg, casting, wax } = linkedItems;

            let tickBoxesHtml = '';

            if (fg) {
                tickBoxesHtml += `
                    <label style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; cursor: pointer;">
                        <input type="checkbox" id="cdk_fg" value="fg" checked style="width: 1.2rem; height: 1.2rem;" />
                        <span><strong>Finished Goods:</strong> ${fg.code}</span>
                    </label>
                `;
            }
            if (casting) {
                tickBoxesHtml += `
                    <label style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; cursor: pointer;">
                        <input type="checkbox" id="cdk_casting" value="casting" checked style="width: 1.2rem; height: 1.2rem;" />
                        <span><strong>Casting Inventory:</strong> ${casting.code}</span>
                    </label>
                `;
            }
            if (wax) {
                tickBoxesHtml += `
                    <label style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; cursor: pointer;">
                        <input type="checkbox" id="cdk_wax" value="wax" checked style="width: 1.2rem; height: 1.2rem;" />
                        <span><strong>Wax Inventory:</strong> ${wax.code}</span>
                    </label>
                `;
            }

            overlay.innerHTML = `
                <div class="modal card-glass" style="max-width: 450px; animation: slideInUp 0.3s ease;">
                    <div class="modal-header">
                        <h2 class="modal-title text-danger">Cascading Delete</h2>
                    </div>
                    <div style="margin-bottom: 1rem; color: var(--text-secondary);">
                        <p style="margin-bottom: 1rem;">
                            <strong>${itemCode}</strong> exists in multiple inventory stages.
                            Select where you want to delete it:
                        </p>
                        <div style="background: var(--bg-hover); padding: 1rem; border-radius: var(--radius-md);">
                            ${tickBoxesHtml}
                        </div>
                        <p style="margin-top: 1rem; font-size: 0.85rem; color: var(--error);">
                            Warning: Deleting a product completely removes all its stock data and history from the selected modules.
                        </p>
                    </div>
                    <div class="modal-actions">
                        <button class="btn btn-secondary" id="uiCrossDeleteCancel">Cancel</button>
                        <button class="btn btn-danger" id="uiCrossDeleteOk">Delete Selected</button>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);

            overlay.querySelector('#uiCrossDeleteCancel').addEventListener('click', () => {
                overlay.remove();
                resolve(null);
            });

            overlay.querySelector('#uiCrossDeleteOk').addEventListener('click', () => {
                const results = [];
                if (fg && overlay.querySelector('#cdk_fg')?.checked) results.push({ table: 'finished_goods', id: fg.id });
                if (casting && overlay.querySelector('#cdk_casting')?.checked) results.push({ table: 'casting_inventory', id: casting.id });
                if (wax && overlay.querySelector('#cdk_wax')?.checked) results.push({ table: 'wax_inventory', id: wax.id });

                overlay.remove();
                resolve(results.length > 0 ? results : null);
            });
        });
    }
};



