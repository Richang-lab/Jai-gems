require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth.routes');
const usersRoutes = require('./routes/users.routes');
const clientsRoutes = require('./routes/clients.routes');
const inventoryRoutes = require('./routes/inventory.routes');
const ordersRoutes = require('./routes/orders.routes');
const slipsRoutes = require('./routes/slips.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve frontend static files
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/slips', slipsRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Fallback: serve index.html for any non-API route (SPA support)
app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
    } else {
        res.status(404).json({ error: 'API route not found' });
    }
});

// Export for Vercel
module.exports = app;

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`\n  🏢 Jai Gems Management System`);
        console.log(`  ────────────────────────────`);
        console.log(`  Local:            http://localhost:${PORT}`);
        console.log(`  Network (WiFi):   http://192.168.1.75:${PORT}`);
        console.log(`  Press Ctrl+C to stop\n`);
    });
}
