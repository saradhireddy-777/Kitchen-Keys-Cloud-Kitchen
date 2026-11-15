/**
 * Centralized Error Handling Middleware for KitchenKeys Cloud Kitchen API
 */

function errorHandler(err, req, res, next) {
    // Handle JSON syntax error from express.json()
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({
            error: 'Malformed JSON payload in request body'
        });
    }

    // Handle SQLite unique constraint errors
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
        let field = 'record';
        if (err.message.includes('chefs.email')) field = 'Chef email';
        return res.status(409).json({
            error: `${field} already exists`
        });
    }

    // Handle SQLite foreign key constraint errors
    if (err.message && err.message.includes('FOREIGN KEY constraint failed')) {
        return res.status(400).json({
            error: 'Foreign key constraint failed: Referenced chef or station does not exist'
        });
    }

    // Handle custom status codes if set on error
    const statusCode = err.statusCode || err.status || 500;
    const message = err.message || 'Internal Server Error';

    if (statusCode === 500) {
        console.error('Unhandled Server Error:', err);
    }

    return res.status(statusCode).json({
        error: message
    });
}

/**
 * 404 Not Found Handler for undefined routes
 */
function notFoundHandler(req, res) {
    return res.status(404).json({
        error: `Endpoint not found: ${req.method} ${req.originalUrl}`
    });
}

module.exports = {
    errorHandler,
    notFoundHandler
};
