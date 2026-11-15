# KitchenKeys Cloud Kitchen - REST API

A complete, production-grade backend REST API for **KitchenKeys Cloud Kitchen** built with **Node.js**, **Express.js**, and **SQLite**.

This backend manages cloud kitchen operations across chefs, cooking stations, and hourly schedule bookings with SQL JOIN queries, strict payload validation, SQL injection prevention via prepared statements, foreign key integrity, cuisine filtering, whitelisted sorting, and booking conflict detection.

---

## 📋 Table of Contents

- [Group Members & Contribution Breakdown](#-group-members--contribution-breakdown)
- [Features](#-features)
- [Project Architecture](#-project-architecture)
- [Database Schema & Design](#-database-schema--design)
- [Installation & Getting Started](#-installation--getting-started)
- [Running Automated Tests](#-running-automated-tests)
- [API Documentation & Endpoints](#-api-documentation--endpoints)
  - [Chefs Endpoints](#1-chefs-api)
  - [Stations Endpoints (with Filtering & Sorting)](#2-stations-api)
  - [Bookings Endpoints (with SQL JOIN & Conflict Detection)](#3-bookings-api)
- [HTTP Status Codes Reference](#-http-status-codes-reference)
- [Postman Collection & Testing Guide](#-postman-collection--testing-guide)

---

## 👥 Group Members & Contribution Breakdown

| Sl. No. | Member Name | Registration Number | Assigned Module & Key Responsibilities |
|:---:|---|:---:|---|
| 1 | **Vijaya Saradhi Reddy** | `252U1R3072` | **System Architecture & Booking Engine**: Server bootstrap (`server.js`), bookings module (`controllers/bookingController.js`, `routes/bookingRoutes.js`), SQL JOIN details aggregation (`GET /bookings/details`), and booking time-slot overlap conflict detection algorithm (HTTP 409). |
| 2 | **Mujib Khan** | `252U1R3073` | **Database Engineering & Data Layer**: SQLite relational schema design (`database/schema.sql`), foreign key enforcement (`PRAGMA foreign_keys = ON;`), prepared statement abstraction layer (`database/database.js`), and database seeder (`database/seed.js`). |
| 3 | **Ram Karthik** | `252U1R3086` | **Chefs Module & Validation Engine**: Chefs CRUD operations (`controllers/chefController.js`, `routes/chefRoutes.js`), email uniqueness verification, and centralized validation utility (`utils/validation.js` - ID, email, phone, and date/time format validation). |
| 4 | **Karthikeya** | `252U1R3084` | **Stations Module, Filtering & Sorting**: Stations CRUD operations (`controllers/stationController.js`, `routes/stationRoutes.js`), station operational status enforcement (`Active`, `Inactive`, `Maintenance`), cuisine search filter (`?cuisine=Indian`), and whitelisted sorting system (A-Z, Z-A, and `?sort=colour` validation). |
| 5 | **Madhu** | `252U1R3060` | **Error Handling, Testing & API Verification**: Centralized error middleware (`middleware/errorHandler.js` for malformed JSON, constraints, 404s, and 500s), automated test suite with 66 test assertions (`tests/run-tests.js`), and comprehensive Postman collection preparation (`KitchenKeys_Cloud_Kitchen.postman_collection.json`). |

---

## 🚀 Features

- **Modular Express Routing**: Clean separation of routes, controllers, middleware, database layer, and validation utilities.
- **SQLite Database with Prepared Statements**: Full relational modeling using foreign keys (`PRAGMA foreign_keys = ON;`) and prepared statements to eliminate SQL injection.
- **Complete CRUD Operations**: Full CRUD for `chefs`, `stations`, and `bookings`.
- **SQL JOIN Aggregation**: `GET /bookings/details` executes a multi-table SQL `JOIN` returning booking, chef, and station details in a unified JSON response.
- **Cuisine Filtering**: `GET /stations?cuisine=Indian` filters stations by cuisine with case-insensitive search.
- **Secure Whitelisted Sorting**:
  - `GET /stations?sort=name&order=asc` returns stations sorted A-Z.
  - `GET /stations?sort=name&order=desc` returns stations sorted Z-A.
  - `GET /stations?sort=colour` returns HTTP 400 with `{"error":"Cannot sort by that field"}`.
  - Prevents SQL injection by validating fields before execution.
- **Time Slot Overlap Conflict Prevention**:
  - Automatically prevents overlapping confirmed bookings on the same station and date.
  - Returns HTTP 409 for conflicts.
  - Allows simultaneous bookings on different stations.
  - Allows back-to-back/adjacent bookings (e.g., 08:00-10:00 and 10:00-12:00).
- **Comprehensive Validation & Error Handling**:
  - Validates positive integer IDs, email format, phone numbers, date formats (`YYYY-MM-DD`), time formats (`HH:MM`), station status (`Active`, `Inactive`, `Maintenance`), and booking chronological integrity (`start_time < end_time`).
  - Standardized JSON responses with HTTP status codes: `200`, `201`, `204`, `400`, `404`, `409`, and `500`.
- **Zero Frontend**: Pure RESTful API service.

---

## 📁 Project Architecture

```
backend group assignment/
├── controllers/
│   ├── bookingController.js      # Booking business logic, JOIN details, conflict checks
│   ├── chefController.js         # Chef CRUD and email uniqueness
│   └── stationController.js      # Station CRUD, sorting, and cuisine filtering
├── database/
│   ├── database.js               # SQLite connection, foreign keys & prepared statement helpers
│   ├── schema.sql                # Table definitions, constraints, and indexes
│   ├── seed.js                   # Development database seeder script
│   └── kitchenkeys.db            # SQLite database file
├── middleware/
│   └── errorHandler.js           # Central error handling (JSON parser, SQLite errors, 404s, 500s)
├── routes/
│   ├── bookingRoutes.js          # Booking route definitions (/bookings, /bookings/details)
│   ├── chefRoutes.js             # Chef route definitions (/chefs)
│   └── stationRoutes.js          # Station route definitions (/stations)
├── tests/
│   └── run-tests.js              # Comprehensive test runner (66 assertions)
├── utils/
│   └── validation.js             # Payload validators, regex checks, and sorting whitelists
├── KitchenKeys_Cloud_Kitchen.postman_collection.json  # Postman test collection
├── server.js                     # Express app setup and server entry point
├── package.json                  # Dependencies and scripts
├── .gitignore                    # Ignored files and directories
└── README.md                     # Documentation and execution guide
```

---

## 🗄 Database Schema & Design

### 1. `chefs` Table
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique Chef ID |
| `name` | TEXT | NOT NULL | Chef full name (min 2 characters) |
| `email` | TEXT | NOT NULL UNIQUE | Unique contact email address |
| `phone` | TEXT | NOT NULL | Contact phone number |

### 2. `stations` Table
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique Station ID |
| `name` | TEXT | NOT NULL | Station name (e.g., "Tandoor Station 1") |
| `cuisine` | TEXT | NOT NULL | Cuisine type (e.g., "Indian", "Italian") |
| `status` | TEXT | NOT NULL CHECK (Active, Inactive, Maintenance) | Operating status |

### 3. `bookings` Table
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique Booking ID |
| `chef_id` | INTEGER | NOT NULL, FOREIGN KEY -> chefs(id) | Assigned chef |
| `station_id` | INTEGER | NOT NULL, FOREIGN KEY -> stations(id) | Assigned station |
| `booking_date` | TEXT | NOT NULL | Booking date (`YYYY-MM-DD`) |
| `start_time` | TEXT | NOT NULL | Start time (`HH:MM`) |
| `end_time` | TEXT | NOT NULL | End time (`HH:MM`) |
| `status` | TEXT | NOT NULL DEFAULT 'Confirmed' | `Confirmed`, `Pending`, `Cancelled`, `Completed` |

---

## ⚙️ Installation & Getting Started

### Prerequisites
- **Node.js** (v18.0.0 or higher recommended)
- **npm** (v9.0.0 or higher)

### Setup Steps

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Initialize and seed the SQLite database**:
   ```bash
   npm run seed
   ```
   *This automatically creates `database/kitchenkeys.db` and populates sample chefs, stations, and bookings.*

3. **Start the API server**:
   ```bash
   npm start
   ```
   *The server starts listening on `http://localhost:3000`.*

---

## 🧪 Running Automated Tests

The project includes an automated test suite verifying all 66 criteria (CRUD, status codes, cuisine search, A-Z and Z-A sorting, rejected fields, SQL JOIN details, and overlap conflict matrix):

```bash
npm test
```

### Test Coverage Highlights:
- **Chef Operations**: Valid creation, duplicate email rejection (409), missing fields (400), invalid email format (400), retrieval, update, and deletion (204).
- **Station Operations**: Valid creation, invalid status rejection (400), retrieval, update, deletion (204).
- **Cuisine Filtering**: `GET /stations?cuisine=Indian` verifies case-insensitive match.
- **Sorting Validation**:
  - `GET /stations?sort=name&order=asc` -> Verified A-Z.
  - `GET /stations?sort=name&order=desc` -> Verified Z-A.
  - `GET /stations?sort=colour` -> Verified HTTP 400 with `{"error":"Cannot sort by that field"}`.
- **Booking Conflict Matrix (HTTP 409)**:
  - Overlap starting inside existing booking (`11:00-13:00`) -> 409 Conflict.
  - Overlap ending inside existing booking (`09:00-11:00`) -> 409 Conflict.
  - Overlap engulfing existing booking (`09:00-13:00`) -> 409 Conflict.
  - Overlap inside existing booking (`10:30-11:30`) -> 409 Conflict.
  - Adjacent before (`08:00-10:00`) -> Allowed (201 Created).
  - Adjacent after (`12:00-14:00`) -> Allowed (201 Created).
  - Simultaneous different station -> Allowed (201 Created).
  - Same station different date -> Allowed (201 Created).
- **SQL JOIN**: `GET /bookings/details` joins `bookings`, `chefs`, and `stations`.

---

## 📡 API Documentation & Endpoints

Base URL: `http://localhost:3000`

### 1. Chefs API

#### `GET /chefs`
- **Description**: Returns all chefs.
- **Response**: `200 OK`
```json
[
  {
    "id": 1,
    "name": "Sanjeev Kapoor",
    "email": "sanjeev@kitchenkeys.com",
    "phone": "+919876543210"
  }
]
```

#### `GET /chefs/:id`
- **Description**: Returns a single chef by ID.
- **Response**: `200 OK` (or `400` if invalid ID, `404` if not found)

#### `POST /chefs`
- **Description**: Registers a new chef.
- **Headers**: `Content-Type: application/json`
- **Body**:
```json
{
  "name": "Gordon Ramsay",
  "email": "gordon@kitchenkeys.com",
  "phone": "+447911123456"
}
```
- **Response**: `201 Created` (or `409 Conflict` if email already exists, `400 Bad Request` if invalid)

#### `PUT /chefs/:id`
- **Description**: Updates chef details.
- **Body**: Any of `name`, `email`, `phone`.
- **Response**: `200 OK` (or `409` on email conflict)

#### `DELETE /chefs/:id`
- **Description**: Deletes a chef.
- **Response**: `204 No Content` (or `404 Not Found`)

---

### 2. Stations API

#### `GET /stations`
- **Description**: Lists all stations. Supports optional cuisine filtering and sorting.
- **Query Parameters**:
  - `cuisine` (string): Filter by cuisine (e.g. `?cuisine=Indian`).
  - `sort` (string): Whitelisted sort field (`name`, `cuisine`, `status`, `id`).
  - `order` (string): Sort order (`asc` or `desc`). Defaults to `asc`.
- **Examples**:
  - `GET /stations?cuisine=Indian` -> Returns stations serving Indian cuisine.
  - `GET /stations?sort=name&order=asc` -> Returns stations ordered A-Z.
  - `GET /stations?sort=name&order=desc` -> Returns stations ordered Z-A.
  - `GET /stations?sort=colour` -> Returns HTTP 400:
    ```json
    { "error": "Cannot sort by that field" }
    ```
- **Response**: `200 OK`

#### `GET /stations/:id`
- **Description**: Returns a station by ID.
- **Response**: `200 OK` (or `404 Not Found`)

#### `POST /stations`
- **Description**: Creates a new station.
- **Body**:
```json
{
  "name": "Tandoor & Curry Station",
  "cuisine": "Indian",
  "status": "Active"
}
```
- **Valid Status Values**: `Active`, `Inactive`, `Maintenance`.
- **Response**: `201 Created` (or `400 Bad Request` if status is invalid)

#### `PUT /stations/:id`
- **Description**: Updates station details.
- **Body**: Any of `name`, `cuisine`, `status`.
- **Response**: `200 OK`

#### `DELETE /stations/:id`
- **Description**: Deletes a station.
- **Response**: `204 No Content` (or `404 Not Found`)

---

### 3. Bookings API

#### `GET /bookings/details` *(SQL JOIN)*
- **Description**: Uses a SQL `JOIN` across `bookings`, `chefs`, and `stations` to return complete booking schedules with chef and station details.
- **Response**: `200 OK`
```json
[
  {
    "id": 1,
    "booking_date": "2026-12-01",
    "start_time": "10:00",
    "end_time": "12:00",
    "status": "Confirmed",
    "chef_id": 1,
    "station_id": 1,
    "chef": {
      "id": 1,
      "name": "Sanjeev Kapoor",
      "email": "sanjeev@kitchenkeys.com",
      "phone": "+919876543210"
    },
    "station": {
      "id": 1,
      "name": "Tandoor & Curry Station",
      "cuisine": "Indian",
      "status": "Active"
    }
  }
]
```

#### `GET /bookings`
- **Description**: Lists all bookings.
- **Response**: `200 OK`

#### `GET /bookings/:id`
- **Description**: Returns a booking by ID.
- **Response**: `200 OK` (or `404 Not Found`)

#### `POST /bookings`
- **Description**: Creates a new booking.
- **Body**:
```json
{
  "chef_id": 1,
  "station_id": 1,
  "booking_date": "2026-12-01",
  "start_time": "10:00",
  "end_time": "12:00",
  "status": "Confirmed"
}
```
- **Validation & Business Rules**:
  - `chef_id` and `station_id` must reference existing resources (HTTP 404 if not found).
  - Station status must be `Active` (HTTP 400 if `Maintenance` or `Inactive`).
  - `start_time` must be earlier than `end_time` (HTTP 400).
  - Dates must follow `YYYY-MM-DD` and times `HH:MM`.
  - **Conflict Prevention**: If a confirmed booking overlaps on the same station and date, returns **HTTP 409 Conflict**:
    ```json
    {
      "error": "Booking conflict: Station is already booked for an overlapping time slot on this date",
      "conflictingBooking": {
        "id": 1,
        "station_id": 1,
        "booking_date": "2026-12-01",
        "start_time": "10:00",
        "end_time": "12:00",
        "status": "Confirmed"
      }
    }
    ```
- **Response**: `201 Created`

#### `PUT /bookings/:id`
- **Description**: Updates booking details. Validates against conflicts (excluding the current booking ID).
- **Response**: `200 OK` (or `409 Conflict` if updated times collide)

#### `DELETE /bookings/:id`
- **Description**: Deletes a booking.
- **Response**: `204 No Content` (or `404 Not Found`)

---

## 🚦 HTTP Status Codes Reference

| Code | Status | Meaning in KitchenKeys API |
|---|---|---|
| `200` | OK | Successful GET or PUT request |
| `201` | Created | Successfully created a chef, station, or booking |
| `204` | No Content | Successfully deleted a resource |
| `400` | Bad Request | Validation error (e.g. invalid date, start_time >= end_time, station in maintenance, invalid sort field `?sort=colour`) |
| `404` | Not Found | Resource does not exist (chef, station, booking, or unknown route) |
| `409` | Conflict | Booking time conflict on the same station and date, or duplicate chef email |
| `500` | Internal Server Error | Unhandled server error caught by centralized error handler |

---

## 📮 Postman Collection & Testing Guide

A pre-built Postman collection is included in the project root:
`KitchenKeys_Cloud_Kitchen.postman_collection.json`

### Importing into Postman
1. Open **Postman**.
2. Click **Import** (top left).
3. Select or drag-and-drop `KitchenKeys_Cloud_Kitchen.postman_collection.json`.
4. Ensure the `baseUrl` collection variable is set to `http://localhost:3000` (default).

### Included Test Scenarios:
- **System Health**: Verifies API online status.
- **Chefs CRUD & Edge Cases**:
  - Create Chef (201)
  - Duplicate Email Conflict (409)
  - Missing Required Fields (400)
  - Get All / Get By ID (200)
  - Update Chef (200)
  - Delete Chef (204)
- **Stations CRUD, Sorting & Filtering**:
  - Create Station (201)
  - Invalid Status Validation (400)
  - Filter by Cuisine (`GET /stations?cuisine=Indian`) (200)
  - Sort by Name ASC A-Z (`GET /stations?sort=name&order=asc`) (200)
  - Sort by Name DESC Z-A (`GET /stations?sort=name&order=desc`) (200)
  - Sort by Invalid Field (`GET /stations?sort=colour`) (400 with `{"error":"Cannot sort by that field"}`)
- **Bookings CRUD, JOIN & Conflicts**:
  - Create Confirmed Booking (201)
  - Overlap Conflict Check (409)
  - Invalid Times start >= end (400)
  - SQL JOIN Details (`GET /bookings/details`) (200)
  - Update Booking (200)
  - Delete Booking (204)
