const { initDatabase, db, run, all } = require('./database');

const chefsData = [
    { name: 'Sanjeev Kapoor', email: 'sanjeev@kitchenkeys.com', phone: '+919876543210' },
    { name: 'Gordon Ramsay', email: 'gordon@kitchenkeys.com', phone: '+447911123456' },
    { name: 'Massimo Bottura', email: 'massimo@kitchenkeys.com', phone: '+39059223912' },
    { name: 'Vikas Khanna', email: 'vikas@kitchenkeys.com', phone: '+919811122233' },
    { name: 'Ranveer Brar', email: 'ranveer@kitchenkeys.com', phone: '+919822233344' },
    { name: 'Jamie Oliver', email: 'jamie@kitchenkeys.com', phone: '+447922233445' },
    { name: 'Wolfgang Puck', email: 'wolfgang@kitchenkeys.com', phone: '+13105550101' },
    { name: 'Nobu Matsuhisa', email: 'nobu@kitchenkeys.com', phone: '+81335550102' },
    { name: 'Alice Waters', email: 'alice@kitchenkeys.com', phone: '+15105550103' },
    { name: 'Ferran Adria', email: 'ferran@kitchenkeys.com', phone: '+34935550104' },
    { name: 'Heston Blumenthal', email: 'heston@kitchenkeys.com', phone: '+447933344556' },
    { name: 'Thomas Keller', email: 'thomas@kitchenkeys.com', phone: '+17075550105' },
    { name: 'Gaggan Anand', email: 'gaggan@kitchenkeys.com', phone: '+6625550106' },
    { name: 'Dominique Crenn', email: 'dominique@kitchenkeys.com', phone: '+14155550107' },
    { name: 'Alain Ducasse', email: 'alain@kitchenkeys.com', phone: '+33155550108' }
];

const stationsData = [
    { name: 'Tandoor & Curry Station 1', cuisine: 'Indian', status: 'Active' },
    { name: 'Artisan Bakery & Pastry Deck', cuisine: 'French', status: 'Active' },
    { name: 'Woodfired Pizza & Pasta Deck', cuisine: 'Italian', status: 'Active' },
    { name: 'Wok & Dim Sum Master Station', cuisine: 'Chinese', status: 'Active' },
    { name: 'Sushi & Teppanyaki Station', cuisine: 'Japanese', status: 'Active' },
    { name: 'Taco & Fajita Grill Station', cuisine: 'Mexican', status: 'Active' },
    { name: 'Royal Biryani & Kebab Hub', cuisine: 'Indian', status: 'Active' },
    { name: 'Bangkok Street Wok Station', cuisine: 'Thai', status: 'Active' },
    { name: 'Mediterranean Mezze & Grill', cuisine: 'Mediterranean', status: 'Active' },
    { name: 'Texas Smokehouse BBQ Pit', cuisine: 'American', status: 'Active' },
    { name: 'Gelato & Dessert Craft Lab', cuisine: 'Italian', status: 'Active' },
    { name: 'Sourdough & Baguette Oven', cuisine: 'French', status: 'Active' },
    { name: 'Seoul BBQ & Kimchi Deck', cuisine: 'Korean', status: 'Maintenance' },
    { name: 'Gourmet Burger & Fries Bay', cuisine: 'American', status: 'Inactive' },
    { name: 'Specialty Espresso & Brew Bar', cuisine: 'Continental', status: 'Active' }
];

// 18 non-conflicting bookings across different dates and active stations
const bookingsData = [
    { chef_index: 0, station_index: 0, date: '2026-12-01', start: '08:00', end: '11:00', status: 'Confirmed' },
    { chef_index: 3, station_index: 0, date: '2026-12-01', start: '12:00', end: '16:00', status: 'Confirmed' },
    { chef_index: 4, station_index: 0, date: '2026-12-01', start: '17:00', end: '21:00', status: 'Confirmed' },
    
    { chef_index: 1, station_index: 1, date: '2026-12-01', start: '06:00', end: '11:00', status: 'Confirmed' },
    { chef_index: 13, station_index: 1, date: '2026-12-01', start: '13:00', end: '18:00', status: 'Confirmed' },

    { chef_index: 2, station_index: 2, date: '2026-12-01', start: '10:00', end: '14:00', status: 'Confirmed' },
    { chef_index: 5, station_index: 2, date: '2026-12-01', start: '15:00', end: '20:00', status: 'Confirmed' },

    { chef_index: 12, station_index: 3, date: '2026-12-01', start: '11:00', end: '15:00', status: 'Confirmed' },
    { chef_index: 7, station_index: 4, date: '2026-12-01', start: '12:00', end: '16:00', status: 'Confirmed' },
    { chef_index: 6, station_index: 5, date: '2026-12-01', start: '14:00', end: '19:00', status: 'Confirmed' },

    { chef_index: 0, station_index: 6, date: '2026-12-02', start: '09:00', end: '13:00', status: 'Confirmed' },
    { chef_index: 4, station_index: 6, date: '2026-12-02', start: '14:00', end: '18:00', status: 'Confirmed' },

    { chef_index: 12, station_index: 7, date: '2026-12-02', start: '10:00', end: '14:00', status: 'Confirmed' },
    { chef_index: 8, station_index: 8, date: '2026-12-02', start: '11:00', end: '15:00', status: 'Confirmed' },
    { chef_index: 9, station_index: 9, date: '2026-12-02', start: '12:00', end: '16:00', status: 'Confirmed' },

    { chef_index: 10, station_index: 10, date: '2026-12-03', start: '10:00', end: '13:00', status: 'Confirmed' },
    { chef_index: 11, station_index: 11, date: '2026-12-03', start: '07:00', end: '12:00', status: 'Confirmed' },
    { chef_index: 14, station_index: 14, date: '2026-12-03', start: '08:00', end: '14:00', status: 'Confirmed' }
];

async function seed(force = true) {
    console.log('Initializing database schema...');
    await initDatabase();

    if (force) {
        console.log('Resetting and seeding fresh data (15 chefs, 15 stations, 18 bookings)...');
        await run('DELETE FROM bookings');
        await run('DELETE FROM sqlite_sequence WHERE name IN ("bookings", "chefs", "stations")');
        await run('DELETE FROM chefs');
        await run('DELETE FROM stations');
    } else {
        const existing = await all('SELECT COUNT(*) as count FROM chefs');
        if (existing[0].count > 0) {
            console.log('Database already populated. Use force to reseed.');
            return;
        }
    }

    // Insert 15 Chefs
    const chefIds = [];
    for (const chef of chefsData) {
        const res = await run(
            'INSERT INTO chefs (name, email, phone) VALUES (?, ?, ?)',
            [chef.name, chef.email, chef.phone]
        );
        chefIds.push(res.lastID);
    }
    console.log(`Inserted ${chefIds.length} chefs.`);

    // Insert 15 Stations
    const stationIds = [];
    for (const st of stationsData) {
        const res = await run(
            'INSERT INTO stations (name, cuisine, status) VALUES (?, ?, ?)',
            [st.name, st.cuisine, st.status]
        );
        stationIds.push(res.lastID);
    }
    console.log(`Inserted ${stationIds.length} stations.`);

    // Insert 18 Bookings
    let bookingCount = 0;
    for (const b of bookingsData) {
        const cId = chefIds[b.chef_index];
        const sId = stationIds[b.station_index];
        await run(
            'INSERT INTO bookings (chef_id, station_id, booking_date, start_time, end_time, status) VALUES (?, ?, ?, ?, ?, ?)',
            [cId, sId, b.date, b.start, b.end, b.status]
        );
        bookingCount++;
    }
    console.log(`Inserted ${bookingCount} bookings.`);
    console.log('Database successfully seeded with comprehensive sample records!');
}

if (require.main === module) {
    seed(true)
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
