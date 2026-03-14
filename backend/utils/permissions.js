/**
 * Role-based permissions map for Jai Gems.
 * 
 * Each role defines:
 *   - modules: which modules the user can see
 *   - canEdit: what specific actions the user can perform
 */

const ROLES = {
    admin: {
        label: 'Admin / Owner',
        modules: ['dashboard', 'inventory', 'orders', 'invoices', 'clients', 'work_distribution', 'outsource_payments', 'address_slips', 'users'],
        canEdit: ['*'], // wildcard â€” can edit everything
    },
    wax_employee: {
        label: 'Wax Employee',
        modules: ['work_distribution_wax', 'outsource_payments_wax'],
        canEdit: ['wax_work_status'],
    },
    jhalai_employee: {
        label: 'Jhalai Employee',
        modules: ['work_distribution_jhalai', 'outsource_payments_jhalai'],
        canEdit: ['jhalai_work_status'],
    },
    wax_tree_employee: {
        label: 'Wax Tree Employee',
        modules: ['work_distribution_wax_tree'],
        canEdit: ['wax_tree_work_status'],
    },
};

/**
 * Check if a role has access to a specific module.
 */
function canAccessModule(role, module) {
    const config = ROLES[role];
    if (!config) return false;
    if (config.modules.includes('*') || role === 'admin') return true;
    return config.modules.includes(module);
}

/**
 * Check if a role can perform a specific edit action.
 */
function canPerformAction(role, action) {
    const config = ROLES[role];
    if (!config) return false;
    if (config.canEdit.includes('*')) return true;
    return config.canEdit.includes(action);
}

/**
 * Get navigation items for a specific role.
 */
function getNavItemsForRole(role) {
    const allNavItems = [
        { id: 'dashboard', label: 'Dashboard', icon: 'grid', module: 'dashboard' },
        { id: 'clients', label: 'Clients', icon: 'users', module: 'clients' },
        { id: 'inventory-fg', label: 'Finished Goods', icon: 'box', module: 'inventory' },
        { id: 'inventory-wax', label: 'Wax Inventory', icon: 'database', module: 'inventory' },
        { id: 'inventory-cast', label: 'Casting Inventory', icon: 'layers', module: 'inventory' },
        { id: 'orders', label: 'Order Generation', icon: 'clipboard', module: 'orders' },
        { id: 'order-tracking', label: 'Order Tracking', icon: 'list', module: 'orders' },
        { id: 'invoices', label: 'Invoices', icon: 'file-text', module: 'invoices' },
        { id: 'work-wax', label: 'Wax Work', icon: 'layers', module: 'work_distribution_wax' },
        { id: 'work-tree', label: 'Wax Tree', icon: 'git-branch', module: 'work_distribution_wax_tree' },
        { id: 'work-jhalai', label: 'Jhalai Work', icon: 'zap', module: 'work_distribution_jhalai' },
        { id: 'outsource-payments', label: 'Outsource Payments', icon: 'credit-card', module: 'outsource_payments' },
        { id: 'outsource-payments-wax', label: 'Wax Payments', icon: 'credit-card', module: 'outsource_payments_wax' },
        { id: 'outsource-payments-jhalai', label: 'Jhalai Payments', icon: 'credit-card', module: 'outsource_payments_jhalai' },
        { id: 'address-slips', label: 'Address Slips', icon: 'map-pin', module: 'address_slips' },
        { id: 'settings', label: 'Settings', icon: 'settings', module: 'admin' },
        { id: 'users', label: 'User Management', icon: 'shield', module: 'users' },
    ];

    if (role === 'admin') return allNavItems;
    return allNavItems.filter(item => canAccessModule(role, item.module));
}

module.exports = { ROLES, canAccessModule, canPerformAction, getNavItemsForRole };



