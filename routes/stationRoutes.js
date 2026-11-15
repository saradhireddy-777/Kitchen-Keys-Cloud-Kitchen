const express = require('express');
const router = express.Router();
const stationController = require('../controllers/stationController');

// GET /stations - list all stations (supports ?cuisine=..., ?sort=..., ?order=...)
router.get('/', stationController.getAllStations);

// GET /stations/:id - get station by ID
router.get('/:id', stationController.getStationById);

// POST /stations - create a new station
router.post('/', stationController.createStation);

// PUT /stations/:id - update a station
router.put('/:id', stationController.updateStation);

// DELETE /stations/:id - delete a station
router.delete('/:id', stationController.deleteStation);

module.exports = router;
