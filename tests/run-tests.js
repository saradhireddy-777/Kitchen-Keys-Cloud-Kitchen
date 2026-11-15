const http = require('http');
const path = require('path');
const fs = require('fs');

// Set test environment database
const testDbPath = path.resolve(__dirname, 'test_kitchenkeys.db');
if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
}
process.env.TEST_DB_PATH = testDbPath;
process.env.NODE_ENV = 'test';

const { app } = require('../server');
const { initDatabase, db } = require('../database/database');

let baseUrl = '';
let serverInstance = null;

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
    totalTests++;
    if (condition) {
        passedTests++;
        console.log(`  ✓ ${message}`);
    } else {
        failedTests++;
        console.error(`  ✗ FAIL: ${message}`);
    }
}

async function request(method, path, body = null) {
    const url = `${baseUrl}${path}`;
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json'
        }
    };
    if (body !== null) {
        options.body = typeof body === 'string' ? body : JSON.stringify(body);
    }
    const response = await fetch(url, options);
    let data = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        data = await response.json();
    } else {
        data = await response.text();
    }
    return {
        status: response.status,
        data
    };
}

async function runTests() {
    console.log('====================================================');
    console.log('   KitchenKeys Cloud Kitchen - API Verification');
    console.log('====================================================\n');

    // 1. Initialize Test Database
    console.log('[SETUP] Initializing database schema...');
    await initDatabase();

    // Start server on random free port
    await new Promise((resolve) => {
        serverInstance = app.listen(0, () => {
            const port = serverInstance.address().port;
            baseUrl = `http://127.0.0.1:${port}`;
            console.log(`[SETUP] Test server running on ${baseUrl}\n`);
            resolve();
        });
    });

    try {
        // --- TEST SUITE 1: API Welcome & Basic Status ---
        console.log('Test Suite 1: Server Root & Status');
        {
            const res = await request('GET', '/');
            assert(res.status === 200, 'GET / returns HTTP 200');
            assert(res.data.status === 'Online', 'GET / returns Online status');
        }

        // --- TEST SUITE 2: Chefs CRUD & Validations ---
        console.log('\nTest Suite 2: Chefs CRUD & Validations');
        let chef1Id, chef2Id;
        {
            // Create Chef 1
            const res1 = await request('POST', '/chefs', {
                name: 'Sanjeev Kapoor',
                email: 'sanjeev@kitchenkeys.com',
                phone: '+919876543210'
            });
            assert(res1.status === 201, 'POST /chefs creates chef with HTTP 201');
            assert(res1.data.id !== undefined, 'Created chef has an ID');
            assert(res1.data.name === 'Sanjeev Kapoor', 'Chef name matches');
            chef1Id = res1.data.id;

            // Create Chef 2
            const res2 = await request('POST', '/chefs', {
                name: 'Gordon Ramsay',
                email: 'gordon@kitchenkeys.com',
                phone: '+447911123456'
            });
            assert(res2.status === 201, 'POST /chefs creates second chef with HTTP 201');
            chef2Id = res2.data.id;

            // Reject duplicate email (HTTP 409)
            const dupRes = await request('POST', '/chefs', {
                name: 'Duplicate Sanjeev',
                email: 'sanjeev@kitchenkeys.com',
                phone: '+919999999999'
            });
            assert(dupRes.status === 409, 'POST /chefs rejects duplicate email with HTTP 409');
            assert(dupRes.data.error !== undefined, 'Returns error message for duplicate email');

            // Reject missing fields (HTTP 400)
            const missingRes = await request('POST', '/chefs', {
                name: 'Incomplete Chef'
            });
            assert(missingRes.status === 400, 'POST /chefs rejects missing required fields with HTTP 400');

            // Reject invalid email format (HTTP 400)
            const badEmailRes = await request('POST', '/chefs', {
                name: 'Bad Email Chef',
                email: 'not-an-email',
                phone: '+919876543210'
            });
            assert(badEmailRes.status === 400, 'POST /chefs rejects invalid email format with HTTP 400');

            // GET /chefs
            const listRes = await request('GET', '/chefs');
            assert(listRes.status === 200, 'GET /chefs returns HTTP 200');
            assert(Array.isArray(listRes.data) && listRes.data.length >= 2, 'GET /chefs returns array of chefs');

            // GET /chefs/:id
            const getRes = await request('GET', `/chefs/${chef1Id}`);
            assert(getRes.status === 200, 'GET /chefs/:id returns HTTP 200');
            assert(getRes.data.name === 'Sanjeev Kapoor', 'Returns correct chef by ID');

            // GET /chefs/:id with invalid ID format
            const badIdRes = await request('GET', '/chefs/not-a-number');
            assert(badIdRes.status === 400, 'GET /chefs/invalid-id returns HTTP 400');

            // GET /chefs/:id with non-existent ID
            const notFoundRes = await request('GET', '/chefs/99999');
            assert(notFoundRes.status === 404, 'GET /chefs/99999 returns HTTP 404');

            // PUT /chefs/:id
            const updateRes = await request('PUT', `/chefs/${chef1Id}`, {
                name: 'Chef Sanjeev Kapoor',
                phone: '+919876500000'
            });
            assert(updateRes.status === 200, 'PUT /chefs/:id updates chef with HTTP 200');
            assert(updateRes.data.name === 'Chef Sanjeev Kapoor', 'Chef name updated');

            // PUT /chefs/:id duplicate email conflict
            const putDupRes = await request('PUT', `/chefs/${chef1Id}`, {
                email: 'gordon@kitchenkeys.com'
            });
            assert(putDupRes.status === 409, 'PUT /chefs/:id rejects email conflict with HTTP 409');

            // DELETE /chefs/:id
            const deleteRes = await request('DELETE', `/chefs/${chef2Id}`);
            assert(deleteRes.status === 204, 'DELETE /chefs/:id returns HTTP 204');

            // Verify deleted
            const verifyDel = await request('GET', `/chefs/${chef2Id}`);
            assert(verifyDel.status === 404, 'GET /chefs/:id on deleted chef returns HTTP 404');
        }

        // --- TEST SUITE 3: Stations CRUD, Sorting & Cuisine Filter ---
        console.log('\nTest Suite 3: Stations CRUD, Sorting & Cuisine Filtering');
        let stTandoorId, stBakeryId, stWokId, stMaintId;
        {
            // Create stations
            const s1 = await request('POST', '/stations', {
                name: 'Tandoor & Curry Hub',
                cuisine: 'Indian',
                status: 'Active'
            });
            assert(s1.status === 201, 'POST /stations creates station with HTTP 201');
            stTandoorId = s1.data.id;

            const s2 = await request('POST', '/stations', {
                name: 'Artisan Bakery',
                cuisine: 'French',
                status: 'Active'
            });
            assert(s2.status === 201, 'POST /stations creates second station');
            stBakeryId = s2.data.id;

            const s3 = await request('POST', '/stations', {
                name: 'Wok & Dim Sum Master',
                cuisine: 'Chinese',
                status: 'Active'
            });
            assert(s3.status === 201, 'POST /stations creates third station');
            stWokId = s3.data.id;

            const s4 = await request('POST', '/stations', {
                name: 'Pizza & Pasta Deck',
                cuisine: 'Italian',
                status: 'Maintenance'
            });
            assert(s4.status === 201, 'POST /stations creates station with Maintenance status');
            stMaintId = s4.data.id;

            // Reject invalid station status (HTTP 400)
            const badStatusRes = await request('POST', '/stations', {
                name: 'Broken Station',
                cuisine: 'Continental',
                status: 'Demolished'
            });
            assert(badStatusRes.status === 400, 'POST /stations rejects invalid status with HTTP 400');

            // GET /stations
            const allStations = await request('GET', '/stations');
            assert(allStations.status === 200, 'GET /stations returns HTTP 200');
            assert(allStations.data.length >= 4, 'Returns all stations');

            // CUISINE FILTERING: GET /stations?cuisine=Indian
            const indianStations = await request('GET', '/stations?cuisine=Indian');
            assert(indianStations.status === 200, 'GET /stations?cuisine=Indian returns HTTP 200');
            assert(indianStations.data.length === 1, 'Only 1 Indian station returned');
            assert(indianStations.data[0].cuisine.toLowerCase() === 'indian', 'Station cuisine is Indian');

            // IMPORTANT SORTING REQUIREMENTS:
            // 1. GET /stations?sort=name&order=asc must return A-Z
            const ascStations = await request('GET', '/stations?sort=name&order=asc');
            assert(ascStations.status === 200, 'GET /stations?sort=name&order=asc returns HTTP 200');
            const ascNames = ascStations.data.map(s => s.name);
            const isAscSorted = ascNames.every((v, i, a) => !i || a[i - 1].localeCompare(v) <= 0);
            assert(isAscSorted, 'GET /stations?sort=name&order=asc returns stations in A-Z order');

            // 2. GET /stations?sort=name&order=desc must return Z-A
            const descStations = await request('GET', '/stations?sort=name&order=desc');
            assert(descStations.status === 200, 'GET /stations?sort=name&order=desc returns HTTP 200');
            const descNames = descStations.data.map(s => s.name);
            const isDescSorted = descNames.every((v, i, a) => !i || a[i - 1].localeCompare(v) >= 0);
            assert(isDescSorted, 'GET /stations?sort=name&order=desc returns stations in Z-A order');

            // 3. GET /stations?sort=colour must return HTTP 400 with {"error":"Cannot sort by that field"}
            const colourRes = await request('GET', '/stations?sort=colour');
            assert(colourRes.status === 400, 'GET /stations?sort=colour returns HTTP 400');
            assert(colourRes.data.error === 'Cannot sort by that field', 'Exact error message: "Cannot sort by that field"');

            // 4. GET /stations?sort=name&order=invalid
            const badOrderRes = await request('GET', '/stations?sort=name&order=invalid');
            assert(badOrderRes.status === 400, 'GET /stations with invalid order returns HTTP 400');

            // PUT /stations/:id
            const updateStationRes = await request('PUT', `/stations/${stTandoorId}`, {
                name: 'Royal Tandoor & Biryani Hub',
                status: 'Active'
            });
            assert(updateStationRes.status === 200, 'PUT /stations/:id updates station with HTTP 200');
            assert(updateStationRes.data.name === 'Royal Tandoor & Biryani Hub', 'Station name updated');

            // DELETE /stations/:id
            const delStationRes = await request('DELETE', `/stations/${stWokId}`);
            assert(delStationRes.status === 204, 'DELETE /stations/:id returns HTTP 204');
            const verifyStDel = await request('GET', `/stations/${stWokId}`);
            assert(verifyStDel.status === 404, 'GET /stations/:id on deleted station returns HTTP 404');
        }

        // --- TEST SUITE 4: Bookings CRUD, Details JOIN & Overlap Conflicts ---
        console.log('\nTest Suite 4: Bookings CRUD, SQL JOIN Details & Overlap Conflicts');
        let booking1Id;
        {
            // Attempt to book a station in Maintenance status -> 400 Bad Request
            const maintBooking = await request('POST', '/bookings', {
                chef_id: chef1Id,
                station_id: stMaintId,
                booking_date: '2026-12-01',
                start_time: '10:00',
                end_time: '12:00'
            });
            assert(maintBooking.status === 400, 'POST /bookings on Maintenance station returns HTTP 400');

            // Attempt to book with invalid times (start_time >= end_time) -> 400 Bad Request
            const badTimes = await request('POST', '/bookings', {
                chef_id: chef1Id,
                station_id: stTandoorId,
                booking_date: '2026-12-01',
                start_time: '14:00',
                end_time: '12:00'
            });
            assert(badTimes.status === 400, 'POST /bookings with start_time >= end_time returns HTTP 400');

            // Attempt to book with non-existent chef -> 404 Not Found
            const badChef = await request('POST', '/bookings', {
                chef_id: 99999,
                station_id: stTandoorId,
                booking_date: '2026-12-01',
                start_time: '10:00',
                end_time: '12:00'
            });
            assert(badChef.status === 404, 'POST /bookings with non-existent chef returns HTTP 404');

            // Create valid Booking 1: Station 1, 2026-12-01, 10:00 - 12:00 (Confirmed)
            const b1 = await request('POST', '/bookings', {
                chef_id: chef1Id,
                station_id: stTandoorId,
                booking_date: '2026-12-01',
                start_time: '10:00',
                end_time: '12:00',
                status: 'Confirmed'
            });
            assert(b1.status === 201, 'POST /bookings creates confirmed booking with HTTP 201');
            assert(b1.data.status === 'Confirmed', 'Booking status is Confirmed');
            booking1Id = b1.data.id;

            // --- OVERLAP CONFLICT TESTS (HTTP 409) ---
            // Conflict 1: Starts during existing booking (11:00 - 13:00)
            const c1 = await request('POST', '/bookings', {
                chef_id: chef1Id,
                station_id: stTandoorId,
                booking_date: '2026-12-01',
                start_time: '11:00',
                end_time: '13:00',
                status: 'Confirmed'
            });
            assert(c1.status === 409, 'Conflict 1: 11:00-13:00 returns HTTP 409 Conflict');

            // Conflict 2: Ends during existing booking (09:00 - 11:00)
            const c2 = await request('POST', '/bookings', {
                chef_id: chef1Id,
                station_id: stTandoorId,
                booking_date: '2026-12-01',
                start_time: '09:00',
                end_time: '11:00',
                status: 'Confirmed'
            });
            assert(c2.status === 409, 'Conflict 2: 09:00-11:00 returns HTTP 409 Conflict');

            // Conflict 3: Engulfs existing booking completely (09:00 - 13:00)
            const c3 = await request('POST', '/bookings', {
                chef_id: chef1Id,
                station_id: stTandoorId,
                booking_date: '2026-12-01',
                start_time: '09:00',
                end_time: '13:00',
                status: 'Confirmed'
            });
            assert(c3.status === 409, 'Conflict 3: 09:00-13:00 (engulfing) returns HTTP 409 Conflict');

            // Conflict 4: Inside existing booking (10:30 - 11:30)
            const c4 = await request('POST', '/bookings', {
                chef_id: chef1Id,
                station_id: stTandoorId,
                booking_date: '2026-12-01',
                start_time: '10:30',
                end_time: '11:30',
                status: 'Confirmed'
            });
            assert(c4.status === 409, 'Conflict 4: 10:30-11:30 (inside) returns HTTP 409 Conflict');

            // --- ALLOWED SIMULTANEOUS / ADJACENT BOOKINGS ---
            // Allowed 1: Adjacent end-to-start (08:00 - 10:00) -> Allowed!
            const adj1 = await request('POST', '/bookings', {
                chef_id: chef1Id,
                station_id: stTandoorId,
                booking_date: '2026-12-01',
                start_time: '08:00',
                end_time: '10:00',
                status: 'Confirmed'
            });
            assert(adj1.status === 201, 'Adjacent slot 08:00-10:00 created successfully (HTTP 201)');

            // Allowed 2: Adjacent start-to-end (12:00 - 14:00) -> Allowed!
            const adj2 = await request('POST', '/bookings', {
                chef_id: chef1Id,
                station_id: stTandoorId,
                booking_date: '2026-12-01',
                start_time: '12:00',
                end_time: '14:00',
                status: 'Confirmed'
            });
            assert(adj2.status === 201, 'Adjacent slot 12:00-14:00 created successfully (HTTP 201)');

            // Allowed 3: Different station booked simultaneously (Station 2, 10:00 - 12:00) -> Allowed!
            const diffStation = await request('POST', '/bookings', {
                chef_id: chef1Id,
                station_id: stBakeryId,
                booking_date: '2026-12-01',
                start_time: '10:00',
                end_time: '12:00',
                status: 'Confirmed'
            });
            assert(diffStation.status === 201, 'Different station booked simultaneously created successfully (HTTP 201)');

            // Allowed 4: Same station on different date (Station 1, 2026-12-02, 10:00 - 12:00) -> Allowed!
            const diffDate = await request('POST', '/bookings', {
                chef_id: chef1Id,
                station_id: stTandoorId,
                booking_date: '2026-12-02',
                start_time: '10:00',
                end_time: '12:00',
                status: 'Confirmed'
            });
            assert(diffDate.status === 201, 'Same station on different date created successfully (HTTP 201)');

            // --- GET /bookings/details (SQL JOIN) ---
            const detailsRes = await request('GET', '/bookings/details');
            assert(detailsRes.status === 200, 'GET /bookings/details returns HTTP 200');
            assert(Array.isArray(detailsRes.data) && detailsRes.data.length >= 4, 'Details returns array of joined bookings');
            const sampleDetail = detailsRes.data[0];
            assert(sampleDetail.chef !== undefined && sampleDetail.chef.name !== undefined, 'Joined response includes chef details');
            assert(sampleDetail.station !== undefined && sampleDetail.station.name !== undefined, 'Joined response includes station details');

            // --- PUT /bookings/:id update & conflict detection ---
            const updateBookingRes = await request('PUT', `/bookings/${diffDate.data.id}`, {
                booking_date: '2026-12-01',
                start_time: '10:30',
                end_time: '11:30'
            });
            assert(updateBookingRes.status === 409, 'PUT /bookings/:id moving to conflicting slot returns HTTP 409 Conflict');

            // PUT booking to non-conflicting time
            const validUpdateBooking = await request('PUT', `/bookings/${diffDate.data.id}`, {
                start_time: '15:00',
                end_time: '17:00'
            });
            assert(validUpdateBooking.status === 200, 'PUT /bookings/:id with valid new time returns HTTP 200');
            assert(validUpdateBooking.data.start_time === '15:00', 'Updated start_time verified');

            // DELETE /bookings/:id
            const delBookingRes = await request('DELETE', `/bookings/${booking1Id}`);
            assert(delBookingRes.status === 204, 'DELETE /bookings/:id returns HTTP 204');
            const verifyBkDel = await request('GET', `/bookings/${booking1Id}`);
            assert(verifyBkDel.status === 404, 'GET /bookings/:id on deleted booking returns HTTP 404');
        }

        // --- TEST SUITE 5: Global Error Handling ---
        console.log('\nTest Suite 5: Global Error Handling & Unknown Routes');
        {
            // 404 for unknown route
            const unkRoute = await request('GET', '/api/non-existent-endpoint');
            assert(unkRoute.status === 404, 'Unknown endpoint returns HTTP 404');

            // 400 for malformed JSON
            const badJson = await request('POST', '/chefs', '{ "name": "Broken JSON"');
            assert(badJson.status === 400, 'Malformed JSON payload returns HTTP 400');
        }

    } finally {
        if (serverInstance) {
            serverInstance.close();
        }
        // Cleanup test database
        if (fs.existsSync(testDbPath)) {
            try {
                fs.unlinkSync(testDbPath);
            } catch (e) {
                // SQLite file might remain open briefly on Windows
            }
        }
    }

    console.log('\n====================================================');
    console.log(`Test Summary: ${passedTests}/${totalTests} Passed (${failedTests} Failed)`);
    console.log('====================================================\n');

    if (failedTests > 0) {
        process.exit(1);
    } else {
        process.exit(0);
    }
}

runTests().catch(err => {
    console.error('Unhandled test execution error:', err);
    process.exit(1);
});
