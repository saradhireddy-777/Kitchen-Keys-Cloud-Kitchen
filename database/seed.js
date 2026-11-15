const { initDatabase, db, run, all } = require('./database');

async function seed() {
    console.log('Initializing database schema...');
    await initDatabase();

    const existingChefs = await all('SELECT COUNT(*) as count FROM chefs');
    if (existingChefs[0].count > 0) {
        console.log('Database already contains data, skipping seed.');
        return;
    }

    console.log('Seeding initial data for KitchenKeys Cloud Kitchen...');

    // Seed Chefs
    const chef1 = await run(
        'INSERT INTO chefs (name, email, phone) VALUES (?, ?, ?)',
        ['Sanjeev Kapoor', 'sanjeev@kitchenkeys.com', '+919876543210']
    );
    const chef2 = await run(
        'INSERT INTO chefs (name, email, phone) VALUES (?, ?, ?)',
        ['Gordon Ramsay', 'gordon@kitchenkeys.com', '+447911123456']
    );
    const chef3 = await run(
        'INSERT INTO chefs (name, email, phone) VALUES (?, ?, ?)',
        ['Massimo Bottura', 'massimo@kitchenkeys.com', '+39059223912']
    );

    // Seed Stations
    const st1 = await run(
        'INSERT INTO stations (name, cuisine, status) VALUES (?, ?, ?)',
        ['Tandoor & Curry Station', 'Indian', 'Active']
    );
    const st2 = await run(
        'INSERT INTO stations (name, cuisine, status) VALUES (?, ?, ?)',
        ['Artisan Bakery & Pastry', 'French', 'Active']
    );
    const st3 = await run(
        'INSERT INTO stations (name, cuisine, status) VALUES (?, ?, ?)',
        ['Woodfired Pizza & Pasta', 'Italian', 'Active']
    );
    const st4 = await run(
        'INSERT INTO stations (name, cuisine, status) VALUES (?, ?, ?)',
        ['Wok & Dim Sum Master', 'Chinese', 'Maintenance']
    );

    // Seed Initial Confirmed Booking
    await run(
        'INSERT INTO bookings (chef_id, station_id, booking_date, start_time, end_time, status) VALUES (?, ?, ?, ?, ?, ?)',
        [chef1.lastID, st1.lastID, '2026-12-01', '10:00', '12:00', 'Confirmed']
    );
    await run(
        'INSERT INTO bookings (chef_id, station_id, booking_date, start_time, end_time, status) VALUES (?, ?, ?, ?, ?, ?)',
        [chef2.lastID, st2.lastID, '2026-12-01', '14:00', '18:00', 'Confirmed']
    );

    console.log('Database seeded successfully with initial chefs, stations, and bookings!');
}

if (require.main === module) {
    seed()
        .then(() => {
            console.log('Done.');
            process.exit(0);
        })
        .catch(err => {
            console.error('Seeding error:', err);
            process.exit(1);
        });
}

module.exports = { seed };
