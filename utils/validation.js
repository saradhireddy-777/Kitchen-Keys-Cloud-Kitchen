/**
 * Validation utilities for KitchenKeys Cloud Kitchen API
 */

const ALLOWED_STATION_STATUSES = ['Active', 'Inactive', 'Maintenance'];
const ALLOWED_BOOKING_STATUSES = ['Confirmed', 'Pending', 'Cancelled', 'Completed'];
const ALLOWED_STATION_SORT_FIELDS = ['id', 'name', 'cuisine', 'status'];

/**
 * Validates whether an ID is a positive integer
 * @param {any} id 
 * @returns {boolean}
 */
function isValidId(id) {
    const parsed = Number(id);
    return Number.isInteger(parsed) && parsed > 0 && String(id).trim() === String(parsed);
}

/**
 * Validates date in YYYY-MM-DD format and verifies it is a valid calendar date
 * @param {string} dateStr 
 * @returns {boolean}
 */
function isValidDate(dateStr) {
    if (typeof dateStr !== 'string') return false;
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateStr)) return false;

    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return (
        date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day
    );
}

/**
 * Validates time in HH:MM or HH:MM:SS 24-hour format
 * @param {string} timeStr 
 * @returns {boolean}
 */
function isValidTime(timeStr) {
    if (typeof timeStr !== 'string') return false;
    const regex = /^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/;
    return regex.test(timeStr);
}

/**
 * Normalizes time string to HH:MM format for reliable comparison
 * @param {string} timeStr 
 * @returns {string}
 */
function normalizeTime(timeStr) {
    if (!timeStr) return '';
    const parts = timeStr.trim().split(':');
    const hours = parts[0].padStart(2, '0');
    const minutes = parts[1].padStart(2, '0');
    return `${hours}:${minutes}`;
}

/**
 * Validates email format
 * @param {string} email 
 * @returns {boolean}
 */
function isValidEmail(email) {
    if (typeof email !== 'string') return false;
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email.trim());
}

/**
 * Validates phone format (supports standard international and local patterns)
 * @param {string} phone 
 * @returns {boolean}
 */
function isValidPhone(phone) {
    if (typeof phone !== 'string') return false;
    const cleaned = phone.replace(/[\s\-\(\)\+]/g, '');
    return /^\d{7,15}$/.test(cleaned);
}

/**
 * Validates chef creation and update payload
 * @param {Object} data 
 * @param {boolean} isUpdate 
 * @returns {{ valid: boolean, error?: string, sanitized?: Object }}
 */
function validateChefPayload(data, isUpdate = false) {
    if (!data || typeof data !== 'object') {
        return { valid: false, error: 'Request body must be a valid JSON object' };
    }

    const { name, email, phone } = data;

    if (!isUpdate) {
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return { valid: false, error: 'Chef name is required' };
        }
        if (!email || typeof email !== 'string' || email.trim().length === 0) {
            return { valid: false, error: 'Chef email is required' };
        }
        if (!phone || typeof phone !== 'string' || phone.trim().length === 0) {
            return { valid: false, error: 'Chef phone is required' };
        }
    }

    if (name !== undefined) {
        if (typeof name !== 'string' || name.trim().length < 2) {
            return { valid: false, error: 'Chef name must be at least 2 characters' };
        }
    }

    if (email !== undefined) {
        if (!isValidEmail(email)) {
            return { valid: false, error: 'Invalid email format' };
        }
    }

    if (phone !== undefined) {
        if (!isValidPhone(phone)) {
            return { valid: false, error: 'Invalid phone number format' };
        }
    }

    return {
        valid: true,
        sanitized: {
            name: name !== undefined ? name.trim() : undefined,
            email: email !== undefined ? email.trim().toLowerCase() : undefined,
            phone: phone !== undefined ? phone.trim() : undefined
        }
    };
}

/**
 * Validates station creation and update payload
 * @param {Object} data 
 * @param {boolean} isUpdate 
 * @returns {{ valid: boolean, error?: string, sanitized?: Object }}
 */
function validateStationPayload(data, isUpdate = false) {
    if (!data || typeof data !== 'object') {
        return { valid: false, error: 'Request body must be a valid JSON object' };
    }

    const { name, cuisine, status } = data;

    if (!isUpdate) {
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return { valid: false, error: 'Station name is required' };
        }
        if (!cuisine || typeof cuisine !== 'string' || cuisine.trim().length === 0) {
            return { valid: false, error: 'Station cuisine is required' };
        }
        if (!status || typeof status !== 'string' || status.trim().length === 0) {
            return { valid: false, error: 'Station status is required' };
        }
    }

    if (name !== undefined) {
        if (typeof name !== 'string' || name.trim().length < 2) {
            return { valid: false, error: 'Station name must be at least 2 characters' };
        }
    }

    if (cuisine !== undefined) {
        if (typeof cuisine !== 'string' || cuisine.trim().length < 2) {
            return { valid: false, error: 'Station cuisine must be at least 2 characters' };
        }
    }

    let normalizedStatus;
    if (status !== undefined) {
        if (typeof status !== 'string') {
            return { valid: false, error: `Station status must be one of: ${ALLOWED_STATION_STATUSES.join(', ')}` };
        }
        const matched = ALLOWED_STATION_STATUSES.find(s => s.toLowerCase() === status.trim().toLowerCase());
        if (!matched) {
            return { valid: false, error: `Station status must be one of: ${ALLOWED_STATION_STATUSES.join(', ')}` };
        }
        normalizedStatus = matched;
    }

    return {
        valid: true,
        sanitized: {
            name: name !== undefined ? name.trim() : undefined,
            cuisine: cuisine !== undefined ? cuisine.trim() : undefined,
            status: normalizedStatus
        }
    };
}

/**
 * Validates station query parameters for sorting and filtering
 * @param {Object} query 
 * @returns {{ valid: boolean, error?: string, params?: { cuisine?: string, sort?: string, order?: string } }}
 */
function validateStationQuery(query) {
    const result = {};

    if (query.cuisine) {
        if (typeof query.cuisine !== 'string' || query.cuisine.trim().length === 0) {
            return { valid: false, error: 'Cuisine filter must not be empty' };
        }
        result.cuisine = query.cuisine.trim();
    }

    if (query.sort) {
        const sortField = String(query.sort).trim().toLowerCase();
        if (!ALLOWED_STATION_SORT_FIELDS.includes(sortField)) {
            // Note: Exact requirement: GET /stations?sort=colour must return HTTP 400 with {"error":"Cannot sort by that field"}
            return { valid: false, error: 'Cannot sort by that field' };
        }
        result.sort = sortField;
    }

    if (query.order) {
        const orderVal = String(query.order).trim().toLowerCase();
        if (orderVal !== 'asc' && orderVal !== 'desc') {
            return { valid: false, error: "Order must be either 'asc' or 'desc'" };
        }
        result.order = orderVal;
    } else {
        result.order = 'asc';
    }

    return { valid: true, params: result };
}

/**
 * Validates booking creation and update payload
 * @param {Object} data 
 * @param {boolean} isUpdate 
 * @returns {{ valid: boolean, error?: string, sanitized?: Object }}
 */
function validateBookingPayload(data, isUpdate = false) {
    if (!data || typeof data !== 'object') {
        return { valid: false, error: 'Request body must be a valid JSON object' };
    }

    const { chef_id, station_id, booking_date, start_time, end_time, status } = data;

    if (!isUpdate) {
        if (chef_id === undefined || chef_id === null) {
            return { valid: false, error: 'chef_id is required' };
        }
        if (station_id === undefined || station_id === null) {
            return { valid: false, error: 'station_id is required' };
        }
        if (!booking_date) {
            return { valid: false, error: 'booking_date is required' };
        }
        if (!start_time) {
            return { valid: false, error: 'start_time is required' };
        }
        if (!end_time) {
            return { valid: false, error: 'end_time is required' };
        }
    }

    if (chef_id !== undefined) {
        if (!isValidId(chef_id)) {
            return { valid: false, error: 'chef_id must be a positive integer' };
        }
    }

    if (station_id !== undefined) {
        if (!isValidId(station_id)) {
            return { valid: false, error: 'station_id must be a positive integer' };
        }
    }

    if (booking_date !== undefined) {
        if (!isValidDate(booking_date)) {
            return { valid: false, error: 'booking_date must be a valid date in YYYY-MM-DD format' };
        }
    }

    let normStartTime;
    if (start_time !== undefined) {
        if (!isValidTime(start_time)) {
            return { valid: false, error: 'start_time must be a valid time in HH:MM format (24-hour)' };
        }
        normStartTime = normalizeTime(start_time);
    }

    let normEndTime;
    if (end_time !== undefined) {
        if (!isValidTime(end_time)) {
            return { valid: false, error: 'end_time must be a valid time in HH:MM format (24-hour)' };
        }
        normEndTime = normalizeTime(end_time);
    }

    if (normStartTime && normEndTime) {
        if (normStartTime >= normEndTime) {
            return { valid: false, error: 'start_time must be earlier than end_time' };
        }
    }

    let normalizedStatus;
    if (status !== undefined) {
        const matched = ALLOWED_BOOKING_STATUSES.find(s => s.toLowerCase() === String(status).trim().toLowerCase());
        if (!matched) {
            return { valid: false, error: `Booking status must be one of: ${ALLOWED_BOOKING_STATUSES.join(', ')}` };
        }
        normalizedStatus = matched;
    } else if (!isUpdate) {
        normalizedStatus = 'Confirmed';
    }

    return {
        valid: true,
        sanitized: {
            chef_id: chef_id !== undefined ? Number(chef_id) : undefined,
            station_id: station_id !== undefined ? Number(station_id) : undefined,
            booking_date: booking_date !== undefined ? booking_date.trim() : undefined,
            start_time: normStartTime,
            end_time: normEndTime,
            status: normalizedStatus
        }
    };
}

module.exports = {
    ALLOWED_STATION_STATUSES,
    ALLOWED_BOOKING_STATUSES,
    ALLOWED_STATION_SORT_FIELDS,
    isValidId,
    isValidDate,
    isValidTime,
    normalizeTime,
    isValidEmail,
    isValidPhone,
    validateChefPayload,
    validateStationPayload,
    validateStationQuery,
    validateBookingPayload
};
