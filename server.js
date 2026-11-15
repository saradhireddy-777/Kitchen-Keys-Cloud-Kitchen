const express = require('express');
const { initDatabase, all } = require('./database/database');
const { seed } = require('./database/seed');
const chefRoutes = require('./routes/chefRoutes');
const stationRoutes = require('./routes/stationRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Body parsing middleware
app.use(express.json());

// API Info / Welcome route
app.get('/', (req, res) => {
    res.status(200).json({
        name: 'KitchenKeys Cloud Kitchen REST API',
        version: '1.0.0',
        status: 'Online',
        endpoints: {
            chefs: '/chefs',
            stations: '/stations',
            bookings: '/bookings',
            bookingDetails: '/bookings/details'
        }
    });
});

// Modular Routes
app.use('/chefs', chefRoutes);
app.use('/stations', stationRoutes);
app.use('/bookings', bookingRoutes);

// 404 handler for unknown routes
app.use(notFoundHandler);

// Centralized error handling middleware
app.use(errorHandler);

// Start server after ensuring database schema is initialized and seeded
let server;
if (require.main === module) {
    initDatabase()
        .then(async () => {
            console.log('Database initialized successfully.');
            const existing = await all('SELECT COUNT(*) as count FROM chefs');
            if (!existing || existing[0].count === 0) {
                console.log('Database is empty. Automatically populating initial data...');
                await seed(true);
            }
            server = app.listen(PORT, () => {
                console.log(`KitchenKeys Cloud Kitchen API running on http://localhost:${PORT}`);
            });
        })
        .catch((err) => {
            console.error('Failed to initialize database:', err);
            process.exit(1);
        });
}

module.exports = { app, server };
