const express = require('express');
const router = express.Router();
const playerController = require('../controllers/playerController');

router.get('/', playerController.getAll);
router.get('/:id', playerController.getOne);
router.post('/', playerController.create);
router.put('/:id', playerController.update);
router.post('/bulk-delete', playerController.bulkRemove);
router.delete('/bulk', playerController.bulkRemove);
router.delete('/:id', playerController.remove);

module.exports = router;