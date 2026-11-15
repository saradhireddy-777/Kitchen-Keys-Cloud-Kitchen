const db = require('../database/database');
const { isValidId, validateChefPayload } = require('../utils/validation');

/**
 * Get all chefs
 * GET /chefs
 */
async function getAllChefs(req, res, next) {
    try {
        const chefs = await db.all('SELECT * FROM chefs ORDER BY id ASC');
        return res.status(200).json(chefs);
    } catch (err) {
        next(err);
    }
}

/**
 * Get chef by ID
 * GET /chefs/:id
 */
async function getChefById(req, res, next) {
    try {
        const { id } = req.params;
        if (!isValidId(id)) {
            return res.status(400).json({ error: 'Invalid chef ID' });
        }

        const chef = await db.get('SELECT * FROM chefs WHERE id = ?', [Number(id)]);
        if (!chef) {
            return res.status(404).json({ error: 'Chef not found' });
        }

        return res.status(200).json(chef);
    } catch (err) {
        next(err);
    }
}

/**
 * Create a new chef
 * POST /chefs
 */
async function createChef(req, res, next) {
    try {
        const validation = validateChefPayload(req.body, false);
        if (!validation.valid) {
            return res.status(400).json({ error: validation.error });
        }

        const { name, email, phone } = validation.sanitized;

        // Check if email already exists (case-insensitive)
        const existing = await db.get('SELECT id FROM chefs WHERE LOWER(email) = LOWER(?)', [email]);
        if (existing) {
            return res.status(409).json({ error: 'Chef with this email already exists' });
        }

        const result = await db.run(
            'INSERT INTO chefs (name, email, phone) VALUES (?, ?, ?)',
            [name, email, phone]
        );

        const newChef = await db.get('SELECT * FROM chefs WHERE id = ?', [result.lastID]);
        return res.status(201).json(newChef);
    } catch (err) {
        next(err);
    }
}

/**
 * Update an existing chef
 * PUT /chefs/:id
 */
async function updateChef(req, res, next) {
    try {
        const { id } = req.params;
        if (!isValidId(id)) {
            return res.status(400).json({ error: 'Invalid chef ID' });
        }

        const existingChef = await db.get('SELECT * FROM chefs WHERE id = ?', [Number(id)]);
        if (!existingChef) {
            return res.status(404).json({ error: 'Chef not found' });
        }

        const validation = validateChefPayload(req.body, true);
        if (!validation.valid) {
            return res.status(400).json({ error: validation.error });
        }

        const { name, email, phone } = validation.sanitized;

        const updatedName = name !== undefined ? name : existingChef.name;
        const updatedEmail = email !== undefined ? email : existingChef.email;
        const updatedPhone = phone !== undefined ? phone : existingChef.phone;

        // If email is changing, ensure uniqueness
        if (email !== undefined && email.toLowerCase() !== existingChef.email.toLowerCase()) {
            const conflict = await db.get(
                'SELECT id FROM chefs WHERE LOWER(email) = LOWER(?) AND id != ?',
                [email, Number(id)]
            );
            if (conflict) {
                return res.status(409).json({ error: 'Chef with this email already exists' });
            }
        }

        await db.run(
            'UPDATE chefs SET name = ?, email = ?, phone = ? WHERE id = ?',
            [updatedName, updatedEmail, updatedPhone, Number(id)]
        );

        const updatedChef = await db.get('SELECT * FROM chefs WHERE id = ?', [Number(id)]);
        return res.status(200).json(updatedChef);
    } catch (err) {
        next(err);
    }
}

/**
 * Delete a chef
 * DELETE /chefs/:id
 */
async function deleteChef(req, res, next) {
    try {
        const { id } = req.params;
        if (!isValidId(id)) {
            return res.status(400).json({ error: 'Invalid chef ID' });
        }

        const chef = await db.get('SELECT id FROM chefs WHERE id = ?', [Number(id)]);
        if (!chef) {
            return res.status(404).json({ error: 'Chef not found' });
        }

        await db.run('DELETE FROM chefs WHERE id = ?', [Number(id)]);
        return res.status(204).send();
    } catch (err) {
        next(err);
    }
}

module.exports = {
    getAllChefs,
    getChefById,
    createChef,
    updateChef,
    deleteChef
};
