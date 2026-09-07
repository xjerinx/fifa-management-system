const express = require('express');
const router = express.Router();
const tournamentController = require('../controllers/tournamentController');

router.get('/', tournamentController.getAll);
router.get('/:id', tournamentController.getOne);
router.post('/', tournamentController.create);
router.put('/:id', tournamentController.update);
router.post('/bulk-delete', tournamentController.bulkRemove);
router.delete('/bulk', tournamentController.bulkRemove);
router.delete('/:id', tournamentController.remove);

router.get('/:id/teams', tournamentController.getTeams);
router.post('/:id/teams', tournamentController.addTeam);
router.delete('/:id/teams/:teamId', tournamentController.removeTeam);
router.get('/:id/matches', tournamentController.getMatches);

module.exports = router;