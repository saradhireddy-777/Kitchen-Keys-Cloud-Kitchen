const db = require('../database/database');
const { isValidId, validateBookingPayload } = require('../utils/validation');

/**
 * Get all bookings with joined chef and station details
 * GET /bookings/details
 */
async function getBookingDetails(req, res, next) {
    try {
        const sql = `
            SELECT 
                b.id,
                b.booking_date,
                b.start_time,
                b.end_time,
                b.status,
                b.chef_id,
                c.name AS chef_name,
                c.email AS chef_email,
                c.phone AS chef_phone,
                b.station_id,
                s.name AS station_name,
                s.cuisine AS station_cuisine,
                s.status AS station_status
            FROM bookings b
            JOIN chefs c ON b.chef_id = c.id
            JOIN stations s ON b.station_id = s.id
            ORDER BY b.booking_date DESC, b.start_time ASC
        `;

        const rows = await db.all(sql);

        const formatted = rows.map(row => ({
            id: row.id,
            booking_date: row.booking_date,
            start_time: row.start_time,
            end_time: row.end_time,
            status: row.status,
            chef_id: row.chef_id,
            station_id: row.station_id,
            chef: {
                id: row.chef_id,
                name: row.chef_name,
                email: row.chef_email,
                phone: row.chef_phone
            },
            station: {
                id: row.station_id,
                name: row.station_name,
                cuisine: row.station_cuisine,
                status: row.station_status
            }
        }));

        return res.status(200).json(formatted);
    } catch (err) {
        next(err);
    }
}

/**
 * Get all bookings
 * GET /bookings
 */
async function getAllBookings(req, res, next) {
    try {
        const bookings = await db.all('SELECT * FROM bookings ORDER BY id ASC');
        return res.status(200).json(bookings);
    } catch (err) {
        next(err);
    }
}

/**
 * Get booking by ID
 * GET /bookings/:id
 */
async function getBookingById(req, res, next) {
    try {
        const { id } = req.params;
        if (!isValidId(id)) {
            return res.status(400).json({ error: 'Invalid booking ID' });
        }

        const booking = await db.get('SELECT * FROM bookings WHERE id = ?', [Number(id)]);
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        return res.status(200).json(booking);
    } catch (err) {
        next(err);
    }
}

/**
 * Check for overlapping confirmed bookings for a station on a given date
 * @param {number} stationId 
 * @param {string} bookingDate 
 * @param {string} startTime 
 * @param {string} endTime 
 * @param {number|null} excludeBookingId 
 * @returns {Promise<Object|null>}
 */
async function checkBookingConflict(stationId, bookingDate, startTime, endTime, excludeBookingId = null) {
    let sql = `
        SELECT * FROM bookings 
        WHERE station_id = ? 
          AND booking_date = ? 
          AND status = 'Confirmed'
          AND start_time < ? 
          AND end_time > ?
    `;
    const params = [stationId, bookingDate, endTime, startTime];

    if (excludeBookingId) {
        sql += ' AND id != ?';
        params.push(excludeBookingId);
    }

    return await db.get(sql, params);
}

/**
 * Create a new booking
 * POST /bookings
 */
async function createBooking(req, res, next) {
    try {
        const validation = validateBookingPayload(req.body, false);
        if (!validation.valid) {
            return res.status(400).json({ error: validation.error });
        }

        const { chef_id, station_id, booking_date, start_time, end_time, status } = validation.sanitized;

        // Verify chef exists
        const chef = await db.get('SELECT id FROM chefs WHERE id = ?', [chef_id]);
        if (!chef) {
            return res.status(404).json({ error: 'Chef not found' });
        }

        // Verify station exists
        const station = await db.get('SELECT id, name, status FROM stations WHERE id = ?', [station_id]);
        if (!station) {
            return res.status(404).json({ error: 'Station not found' });
        }

        // Verify station status allows bookings
        if (station.status !== 'Active') {
            return res.status(400).json({
                error: `Cannot book station: Station status is currently '${station.status}'`
            });
        }

        // If status is Confirmed, check for booking overlap on the same station and date
        if (status === 'Confirmed') {
            const conflict = await checkBookingConflict(station_id, booking_date, start_time, end_time);
            if (conflict) {
                return res.status(409).json({
                    error: 'Booking conflict: Station is already booked for an overlapping time slot on this date',
                    conflictingBooking: {
                        id: conflict.id,
                        station_id: conflict.station_id,
                        booking_date: conflict.booking_date,
                        start_time: conflict.start_time,
                        end_time: conflict.end_time,
                        status: conflict.status
                    }
                });
            }
        }

        const result = await db.run(
            `INSERT INTO bookings (chef_id, station_id, booking_date, start_time, end_time, status)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [chef_id, station_id, booking_date, start_time, end_time, status]
        );

        const newBooking = await db.get('SELECT * FROM bookings WHERE id = ?', [result.lastID]);
        return res.status(201).json(newBooking);
    } catch (err) {
        next(err);
    }
}

/**
 * Update an existing booking
 * PUT /bookings/:id
 */
async function updateBooking(req, res, next) {
    try {
        const { id } = req.params;
        if (!isValidId(id)) {
            return res.status(400).json({ error: 'Invalid booking ID' });
        }

        const existingBooking = await db.get('SELECT * FROM bookings WHERE id = ?', [Number(id)]);
        if (!existingBooking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        const validation = validateBookingPayload(req.body, true);
        if (!validation.valid) {
            return res.status(400).json({ error: validation.error });
        }

        const { chef_id, station_id, booking_date, start_time, end_time, status } = validation.sanitized;

        const targetChefId = chef_id !== undefined ? chef_id : existingBooking.chef_id;
        const targetStationId = station_id !== undefined ? station_id : existingBooking.station_id;
        const targetDate = booking_date !== undefined ? booking_date : existingBooking.booking_date;
        const targetStartTime = start_time !== undefined ? start_time : existingBooking.start_time;
        const targetEndTime = end_time !== undefined ? end_time : existingBooking.end_time;
        const targetStatus = status !== undefined ? status : existingBooking.status;

        // Verify start_time < end_time
        if (targetStartTime >= targetEndTime) {
            return res.status(400).json({ error: 'start_time must be earlier than end_time' });
        }

        // Verify chef if updated
        if (chef_id !== undefined) {
            const chef = await db.get('SELECT id FROM chefs WHERE id = ?', [targetChefId]);
            if (!chef) {
                return res.status(404).json({ error: 'Chef not found' });
            }
        }

        // Verify station if updated
        if (station_id !== undefined) {
            const station = await db.get('SELECT id, status FROM stations WHERE id = ?', [targetStationId]);
            if (!station) {
                return res.status(404).json({ error: 'Station not found' });
            }
            if (station.status !== 'Active') {
                return res.status(400).json({
                    error: `Cannot book station: Station status is currently '${station.status}'`
                });
            }
        }

        // Overlap conflict check if confirmed
        if (targetStatus === 'Confirmed') {
            const conflict = await checkBookingConflict(
                targetStationId,
                targetDate,
                targetStartTime,
                targetEndTime,
                Number(id)
            );

            if (conflict) {
                return res.status(409).json({
                    error: 'Booking conflict: Station is already booked for an overlapping time slot on this date',
                    conflictingBooking: {
                        id: conflict.id,
                        station_id: conflict.station_id,
                        booking_date: conflict.booking_date,
                        start_time: conflict.start_time,
                        end_time: conflict.end_time,
                        status: conflict.status
                    }
                });
            }
        }

        await db.run(
            `UPDATE bookings 
             SET chef_id = ?, station_id = ?, booking_date = ?, start_time = ?, end_time = ?, status = ?
             WHERE id = ?`,
            [targetChefId, targetStationId, targetDate, targetStartTime, targetEndTime, targetStatus, Number(id)]
        );

        const updatedBooking = await db.get('SELECT * FROM bookings WHERE id = ?', [Number(id)]);
        return res.status(200).json(updatedBooking);
    } catch (err) {
        next(err);
    }
}

/**
 * Delete a booking
 * DELETE /bookings/:id
 */
async function deleteBooking(req, res, next) {
    try {
        const { id } = req.params;
        if (!isValidId(id)) {
            return res.status(400).json({ error: 'Invalid booking ID' });
        }

        const booking = await db.get('SELECT id FROM bookings WHERE id = ?', [Number(id)]);
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        await db.run('DELETE FROM bookings WHERE id = ?', [Number(id)]);
        return res.status(204).send();
    } catch (err) {
        next(err);
    }
}

module.exports = {
    getBookingDetails,
    getAllBookings,
    getBookingById,
    createBooking,
    updateBooking,
    deleteBooking
};
