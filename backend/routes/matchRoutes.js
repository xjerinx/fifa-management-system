const express = require('express');
const router = express.Router();
const matchController = require('../controllers/matchController');

router.get('/', matchController.getAll);
router.get('/:id', matchController.getOne);
router.post('/', matchController.create);
router.put('/:id', matchController.update);
router.post('/bulk-delete', matchController.bulkRemove);
router.post('/bulk-import', matchController.bulkImport);
router.delete('/bulk', matchController.bulkRemove);
router.delete('/:id', matchController.remove);

router.get('/:id/events', matchController.getEvents);

router.get('/:id/referees', matchController.getReferees);
router.post('/:id/referees', matchController.addReferee);
router.delete('/:id/referees/:refereeId', matchController.removeReferee);

module.exports = router;