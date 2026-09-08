const express = require('express');
const router = express.Router();
const coachController = require('../controllers/coachController');

router.get('/', coachController.getAll);
router.get('/:id', coachController.getOne);
router.post('/', coachController.create);
router.put('/:id', coachController.update);
router.post('/bulk-delete', coachController.bulkRemove);
router.post('/bulk-import', coachController.bulkImport);
router.delete('/bulk', coachController.bulkRemove);
router.delete('/:id', coachController.remove);

module.exports = router;