const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = process.env.NODE_ENV === 'test' && process.env.TEST_DB_PATH
    ? process.env.TEST_DB_PATH
    : path.resolve(__dirname, 'kitchenkeys.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to SQLite database:', err.message);
    } else {
        // Enable foreign key support
        db.run('PRAGMA foreign_keys = ON;', (pragmaErr) => {
            if (pragmaErr) {
                console.error('Error enabling foreign keys:', pragmaErr.message);
            }
        });
    }
});

/**
 * Initialize database schema from schema.sql
 */
function initDatabase() {
    return new Promise((resolve, reject) => {
        const schemaPath = path.resolve(__dirname, 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        db.exec(schemaSql, (err) => {
            if (err) {
                console.error('Error initializing database schema:', err.message);
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

/**
 * Execute a query that returns multiple rows using a prepared statement
 * @param {string} sql 
 * @param {Array} params 
 * @returns {Promise<Array>}
 */
function all(sql, params = []) {
    return new Promise((resolve, reject) => {
        const stmt = db.prepare(sql, (err) => {
            if (err) return reject(err);
            stmt.all(params, (err, rows) => {
                stmt.finalize();
                if (err) return reject(err);
                resolve(rows);
            });
        });
    });
}

/**
 * Execute a query that returns a single row using a prepared statement
 * @param {string} sql 
 * @param {Array} params 
 * @returns {Promise<Object|null>}
 */
function get(sql, params = []) {
    return new Promise((resolve, reject) => {
        const stmt = db.prepare(sql, (err) => {
            if (err) return reject(err);
            stmt.get(params, (err, row) => {
                stmt.finalize();
                if (err) return reject(err);
                resolve(row || null);
            });
        });
    });
}

/**
 * Execute an INSERT, UPDATE, or DELETE query using a prepared statement
 * @param {string} sql 
 * @param {Array} params 
 * @returns {Promise<{ lastID: number, changes: number }>}
 */
function run(sql, params = []) {
    return new Promise((resolve, reject) => {
        const stmt = db.prepare(sql, (err) => {
            if (err) return reject(err);
            stmt.run(params, function (err) {
                stmt.finalize();
                if (err) return reject(err);
                resolve({ lastID: this.lastID, changes: this.changes });
            });
        });
    });
}

module.exports = {
    db,
    initDatabase,
    all,
    get,
    run
};
