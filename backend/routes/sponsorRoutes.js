const express = require('express');
const router = express.Router();
const sponsorController = require('../controllers/sponsorController');

router.get('/', sponsorController.getAll);
router.get('/:id', sponsorController.getOne);
router.post('/', sponsorController.create);
router.put('/:id', sponsorController.update);
router.post('/bulk-delete', sponsorController.bulkRemove);
router.post('/bulk-import', sponsorController.bulkImport);
router.delete('/bulk', sponsorController.bulkRemove);
router.delete('/:id', sponsorController.remove);

router.get('/:id/tournaments', sponsorController.getTournaments);
router.post('/:id/tournaments', sponsorController.addTournament);
router.put('/:id/tournaments/:tournamentId', sponsorController.updateTournament);
router.delete('/:id/tournaments/:tournamentId', sponsorController.removeTournament);

module.exports = router;