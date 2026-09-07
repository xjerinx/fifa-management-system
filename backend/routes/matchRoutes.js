const express = require('express');
const router = express.Router();
const matchController = require('../controllers/matchController');

router.get('/', matchController.getAll);
router.get('/:id', matchController.getOne);
router.post('/', matchController.create);
router.put('/:id', matchController.update);
router.post('/bulk-delete', matchController.bulkRemove);
router.delete('/bulk', matchController.bulkRemove);
router.delete('/:id', matchController.remove);

router.get('/:id/events', matchController.getEvents);

router.get('/:id/referees', matchController.getReferees);
router.post('/:id/referees', matchController.addReferee);
router.delete('/:id/referees/:refereeId', matchController.removeReferee);

router.get('/:id/sponsors', matchController.getSponsors);
router.post('/:id/sponsors', matchController.addSponsor);
router.delete('/:id/sponsors/:sponsorId', matchController.removeSponsor);

module.exports = router;