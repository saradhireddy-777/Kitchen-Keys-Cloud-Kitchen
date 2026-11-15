-- Enable Foreign Key support in SQLite
PRAGMA foreign_keys = ON;

-- Chefs table
CREATE TABLE IF NOT EXISTS chefs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL
);

-- Stations table
CREATE TABLE IF NOT EXISTS stations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    cuisine TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('Active', 'Inactive', 'Maintenance'))
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chef_id INTEGER NOT NULL,
    station_id INTEGER NOT NULL,
    booking_date TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Confirmed' CHECK(status IN ('Confirmed', 'Pending', 'Cancelled', 'Completed')),
    FOREIGN KEY (chef_id) REFERENCES chefs (id) ON DELETE CASCADE,
    FOREIGN KEY (station_id) REFERENCES stations (id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_bookings_station_date ON bookings (station_id, booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_chef ON bookings (chef_id);
CREATE INDEX IF NOT EXISTS idx_stations_cuisine ON stations (cuisine);
