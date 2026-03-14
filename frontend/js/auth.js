/**
 * Jai Gems — Auth Module
 * Handles login, logout, session management.
 */

const Auth = {
    /**
     * Login and redirect to dashboard.
     */
    async login(email, password) {
        const data = await api.login(email, password);
        api.setToken(data.token);
        api.setRefreshToken(data.refreshToken);
        localStorage.setItem('jai_gems_user', JSON.stringify(data.user));
        localStorage.setItem('jai_gems_nav', JSON.stringify(data.navItems));
        window.location.href = '/dashboard.html';
        return data;
    },

    /**
     * Logout and redirect to login.
     */
    logout() {
        api.setToken(null);
        api.setRefreshToken(null);
        localStorage.removeItem('jai_gems_user');
        localStorage.removeItem('jai_gems_nav');
        window.location.href = '/';
    },

    /**
     * Get current user from localStorage.
     */
    getUser() {
        const raw = localStorage.getItem('jai_gems_user');
        return raw ? JSON.parse(raw) : null;
    },

    /**
     * Get navigation items for current user.
     */
    getNavItems() {
        const raw = localStorage.getItem('jai_gems_nav');
        return raw ? JSON.parse(raw) : [];
    },

    /**
     * Check if user is logged in (has token).
     */
    isLoggedIn() {
        return !!localStorage.getItem('jai_gems_token');
    },

    /**
     * Require authentication — redirects to login if not authenticated.
     */
    requireAuth() {
        if (!this.isLoggedIn()) {
            window.location.href = '/';
            return false;
        }
        return true;
    },

    /**
     * Require a specific role. Returns true if user has the role.
     */
    requireRole(role) {
        const user = this.getUser();
        return user && user.role === role;
    },

    /**
     * Verify session with server (used on page load).
     */
    async verifySession() {
        try {
            const data = await api.getMe();
            localStorage.setItem('jai_gems_user', JSON.stringify(data.user));
            localStorage.setItem('jai_gems_nav', JSON.stringify(data.navItems));
            return data;
        } catch {
            this.logout();
            return null;
        }
    }
};
