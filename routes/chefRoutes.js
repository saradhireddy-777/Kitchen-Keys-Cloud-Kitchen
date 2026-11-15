const express = require('express');
const router = express.Router();
const chefController = require('../controllers/chefController');

// GET /chefs - list all chefs
router.get('/', chefController.getAllChefs);

// GET /chefs/:id - get chef by ID
router.get('/:id', chefController.getChefById);

// POST /chefs - create a new chef
router.post('/', chefController.createChef);

// PUT /chefs/:id - update a chef
router.put('/:id', chefController.updateChef);

// DELETE /chefs/:id - delete a chef
router.delete('/:id', chefController.deleteChef);

module.exports = router;
