/**
 * Jai Gems — API Client
 * Handles all HTTP requests to the backend.
 */

const API_BASE = window.location.origin + '/api';

class ApiClient {
    constructor() {
        this.token = localStorage.getItem('jai_gems_token');
    }

    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('jai_gems_token', token);
        } else {
            localStorage.removeItem('jai_gems_token');
        }
    }

    setRefreshToken(token) {
        if (token) {
            localStorage.setItem('jai_gems_refresh_token', token);
        } else {
            localStorage.removeItem('jai_gems_refresh_token');
        }
    }

    getRefreshToken() {
        return localStorage.getItem('jai_gems_refresh_token');
    }

    async request(method, endpoint, body = null) {
        const headers = {
            'Content-Type': 'application/json',
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        const options = { method, headers };
        if (body) {
            options.body = JSON.stringify(body);
        }

        try {
            const response = await fetch(`${API_BASE}${endpoint}`, options);

            // If 401, try refreshing the token
            if (response.status === 401 && this.getRefreshToken()) {
                const refreshed = await this.tryRefreshToken();
                if (refreshed) {
                    headers['Authorization'] = `Bearer ${this.token}`;
                    const retryResponse = await fetch(`${API_BASE}${endpoint}`, { method, headers, body: options.body });
                    return this.handleResponse(retryResponse);
                }
            }

            return this.handleResponse(response);
        } catch (err) {
            console.error('API Error:', err);
            throw new Error('Network error. Please check your connection.');
        }
    }

    async handleResponse(response) {
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Something went wrong');
        }
        return data;
    }

    async tryRefreshToken() {
        try {
            const response = await fetch(`${API_BASE}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken: this.getRefreshToken() }),
            });

            if (response.ok) {
                const data = await response.json();
                this.setToken(data.token);
                this.setRefreshToken(data.refreshToken);
                return true;
            }
            return false;
        } catch {
            return false;
        }
    }

    // Auth
    login(email, password) { return this.request('POST', '/auth/login', { email, password }); }
    getMe() { return this.request('GET', '/auth/me'); }

    // Work Slips
    getPendingSlips(type) { return this.request('GET', `/slips/pending/${type}`); }
    generateSlip(data) { return this.request('POST', '/slips/generate', data); }
    getSlips() { return this.request('GET', '/slips'); }

    // Dashboard
    getDashboardStats() { return this.request('GET', '/dashboard/stats'); }
    getRoles() { return this.request('GET', '/users/roles'); }
    createUser(userData) { return this.request('POST', '/users', userData); }
    updateUser(id, userData) { return this.request('PUT', `/users/${id}`, userData); }
    deleteUser(id) { return this.request('DELETE', `/users/${id}`); }

    // Clients
    getClients() { return this.request('GET', '/clients'); }
    createClient(clientData) { return this.request('POST', '/clients', clientData); }
    updateClient(id, clientData) { return this.request('PUT', `/clients/${id}`, clientData); }
    deleteClient(id) { return this.request('DELETE', `/clients/${id}`); }

    // Inventory Config
    getInvConfig() { return this.request('GET', '/inventory/config'); }
    addCategory(data) { return this.request('POST', '/inventory/categories', data); }
    deleteCategory(id) { return this.request('DELETE', `/inventory/categories/${id}`); }
    addShape(data) { return this.request('POST', '/inventory/shapes', data); }
    deleteShape(id) { return this.request('DELETE', `/inventory/shapes/${id}`); }
    addMaterial(data) { return this.request('POST', '/inventory/materials', data); }
    deleteMaterial(id) { return this.request('DELETE', `/inventory/materials/${id}`); }

    // Finished Goods
    getFinishedGoods() { return this.request('GET', '/inventory/finished-goods'); }
    createFinishedGood(data) { return this.request('POST', '/inventory/finished-goods', data); }
    updateFinishedGood(id, data) { return this.request('PUT', `/inventory/finished-goods/${id}`, data); }
    deleteFinishedGood(id) { return this.request('DELETE', `/inventory/finished-goods/${id}`); }
    bulkUploadFinishedGoods(items) { return this.request('POST', '/inventory/finished-goods/bulk', { items }); }

    // WIP Inventory (Wax / Casting)
    getWaxInventory() { return this.request('GET', '/inventory/wax'); }
    transactWax(data) { return this.request('POST', '/inventory/wax/transaction', data); }
    deleteWax(id) { return this.request('DELETE', `/inventory/wax/${id}`); }

    getCastingInventory() { return this.request('GET', '/inventory/casting'); }
    transactCasting(data) { return this.request('POST', '/inventory/casting/transaction', data); }
    deleteCasting(id) { return this.request('DELETE', `/inventory/casting/${id}`); }
    bulkUploadCasting(items) { return this.request('POST', '/inventory/casting/bulk', { items }); }
    getCastingAttributes() { return this.request('GET', '/inventory/casting-attributes'); }
    addCastingAttribute(name) { return this.request('POST', '/inventory/casting-attributes', { name }); }
    deleteCastingAttribute(id) { return this.request('DELETE', `/inventory/casting-attributes/${id}`); }

    // Cross-Module Delete
    checkDeleteLinks(module, id) { return this.request('GET', `/inventory/check-delete/${module}/${id}`); }
    executeCrossDelete(payload) { return this.request('POST', '/inventory/cross-delete', payload); }
    deleteAllInventory() { return this.request('DELETE', '/inventory/destroy-all'); }

    // App Settings
    getAppSettings() { return this.request('GET', '/orders/settings'); }
    updateAppSetting(key, value) { return this.request('POST', '/orders/settings', { key, value }); }

    // Orders
    getOrders() { return this.request('GET', '/orders'); }
    getOrder(id) { return this.request('GET', `/orders/${id}`); }
    createOrder(data) { return this.request('POST', '/orders', data); }
    deleteOrder(id) { return this.request('DELETE', `/orders/${id}`); }
    updateOrderItem(itemId, data) { return this.request('PUT', `/orders/items/${itemId}`, data); }

    // Storage / File Upload
    async uploadFile(bucket, fileName, file) {
        const supabaseUrl = window.env?.SUPABASE_URL || 'https://nvrtwktfscefexyunljb.supabase.co';
        const url = `${supabaseUrl}/storage/v1/object/${bucket}/${fileName}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': file.type
            },
            body: file
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || err.error || 'Upload failed');
        }

        return {
            publicUrl: `${supabaseUrl}/storage/v1/object/public/${bucket}/${fileName}`
        };
    }
}

// Singleton instance
const api = new ApiClient();
