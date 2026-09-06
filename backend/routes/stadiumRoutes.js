const express = require('express');
const router = express.Router();
const stadiumController = require('../controllers/stadiumController');

router.get('/', stadiumController.getAll);
router.get('/:id', stadiumController.getOne);
router.post('/', stadiumController.create);
router.put('/:id', stadiumController.update);
router.delete('/:id', stadiumController.remove);

module.exports = router;