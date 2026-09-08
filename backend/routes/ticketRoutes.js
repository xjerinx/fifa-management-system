const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');

router.get('/', ticketController.getAll);
router.get('/:ref', ticketController.getByRef);
router.post('/', ticketController.create);
router.put('/:id/cancel', ticketController.cancel);
router.delete('/:id', ticketController.delete);

module.exports = router;
