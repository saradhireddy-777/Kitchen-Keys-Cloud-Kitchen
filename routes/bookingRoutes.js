const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');

// GET /bookings/details - get bookings with joined chef and station details
// Must be defined before /:id to prevent route shadowing
router.get('/details', bookingController.getBookingDetails);

// GET /bookings - list all bookings
router.get('/', bookingController.getAllBookings);

// GET /bookings/:id - get booking by ID
router.get('/:id', bookingController.getBookingById);

// POST /bookings - create a new booking (includes conflict detection)
router.post('/', bookingController.createBooking);

// PUT /bookings/:id - update a booking
router.put('/:id', bookingController.updateBooking);

// DELETE /bookings/:id - delete a booking
router.delete('/:id', bookingController.deleteBooking);

module.exports = router;
