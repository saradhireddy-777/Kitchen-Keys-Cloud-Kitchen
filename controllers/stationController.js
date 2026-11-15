const db = require('../database/database');
const { isValidId, validateStationPayload, validateStationQuery } = require('../utils/validation');

/**
 * Get all stations with optional cuisine filter and sorting
 * GET /stations
 * Query params: cuisine, sort, order
 */
async function getAllStations(req, res, next) {
    try {
        const queryValidation = validateStationQuery(req.query);
        if (!queryValidation.valid) {
            return res.status(400).json({ error: queryValidation.error });
        }

        const { cuisine, sort, order } = queryValidation.params;
        const sqlParams = [];
        let sql = 'SELECT * FROM stations';

        if (cuisine) {
            sql += ' WHERE LOWER(cuisine) = LOWER(?)';
            sqlParams.push(cuisine);
        }

        if (sort) {
            // Sort column is safely checked against whitelist in validateStationQuery
            const direction = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
            // Use COLLATE NOCASE for textual columns to ensure true alphabetical sorting
            if (sort === 'name' || sort === 'cuisine' || sort === 'status') {
                sql += ` ORDER BY ${sort} COLLATE NOCASE ${direction}`;
            } else {
                sql += ` ORDER BY ${sort} ${direction}`;
            }
        } else {
            sql += ' ORDER BY id ASC';
        }

        const stations = await db.all(sql, sqlParams);
        return res.status(200).json(stations);
    } catch (err) {
        next(err);
    }
}

/**
 * Get station by ID
 * GET /stations/:id
 */
async function getStationById(req, res, next) {
    try {
        const { id } = req.params;
        if (!isValidId(id)) {
            return res.status(400).json({ error: 'Invalid station ID' });
        }

        const station = await db.get('SELECT * FROM stations WHERE id = ?', [Number(id)]);
        if (!station) {
            return res.status(404).json({ error: 'Station not found' });
        }

        return res.status(200).json(station);
    } catch (err) {
        next(err);
    }
}

/**
 * Create a new station
 * POST /stations
 */
async function createStation(req, res, next) {
    try {
        const validation = validateStationPayload(req.body, false);
        if (!validation.valid) {
            return res.status(400).json({ error: validation.error });
        }

        const { name, cuisine, status } = validation.sanitized;

        const result = await db.run(
            'INSERT INTO stations (name, cuisine, status) VALUES (?, ?, ?)',
            [name, cuisine, status]
        );

        const newStation = await db.get('SELECT * FROM stations WHERE id = ?', [result.lastID]);
        return res.status(201).json(newStation);
    } catch (err) {
        next(err);
    }
}

/**
 * Update an existing station
 * PUT /stations/:id
 */
async function updateStation(req, res, next) {
    try {
        const { id } = req.params;
        if (!isValidId(id)) {
            return res.status(400).json({ error: 'Invalid station ID' });
        }

        const existingStation = await db.get('SELECT * FROM stations WHERE id = ?', [Number(id)]);
        if (!existingStation) {
            return res.status(404).json({ error: 'Station not found' });
        }

        const validation = validateStationPayload(req.body, true);
        if (!validation.valid) {
            return res.status(400).json({ error: validation.error });
        }

        const { name, cuisine, status } = validation.sanitized;

        const updatedName = name !== undefined ? name : existingStation.name;
        const updatedCuisine = cuisine !== undefined ? cuisine : existingStation.cuisine;
        const updatedStatus = status !== undefined ? status : existingStation.status;

        await db.run(
            'UPDATE stations SET name = ?, cuisine = ?, status = ? WHERE id = ?',
            [updatedName, updatedCuisine, updatedStatus, Number(id)]
        );

        const updatedStation = await db.get('SELECT * FROM stations WHERE id = ?', [Number(id)]);
        return res.status(200).json(updatedStation);
    } catch (err) {
        next(err);
    }
}

/**
 * Delete a station
 * DELETE /stations/:id
 */
async function deleteStation(req, res, next) {
    try {
        const { id } = req.params;
        if (!isValidId(id)) {
            return res.status(400).json({ error: 'Invalid station ID' });
        }

        const station = await db.get('SELECT id FROM stations WHERE id = ?', [Number(id)]);
        if (!station) {
            return res.status(404).json({ error: 'Station not found' });
        }

        await db.run('DELETE FROM stations WHERE id = ?', [Number(id)]);
        return res.status(204).send();
    } catch (err) {
        next(err);
    }
}

module.exports = {
    getAllStations,
    getStationById,
    createStation,
    updateStation,
    deleteStation
};
