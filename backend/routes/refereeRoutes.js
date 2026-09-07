const express = require('express');
const router = express.Router();
const refereeController = require('../controllers/refereeController');

router.get('/', refereeController.getAll);
router.get('/:id', refereeController.getOne);
router.post('/', refereeController.create);
router.put('/:id', refereeController.update);
router.post('/bulk-delete', refereeController.bulkRemove);
router.delete('/bulk', refereeController.bulkRemove);
router.delete('/:id', refereeController.remove);

module.exports = router;