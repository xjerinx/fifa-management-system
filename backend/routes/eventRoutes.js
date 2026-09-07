const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');

router.get('/', eventController.getAll);
router.get('/:id', eventController.getOne);
router.post('/', eventController.create);
router.put('/:id', eventController.update);
router.post('/bulk-delete', eventController.bulkRemove);
router.delete('/bulk', eventController.bulkRemove);
router.delete('/:id', eventController.remove);

module.exports = router;