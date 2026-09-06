const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

router.get('/stats', dashboardController.getStats);
router.get('/upcoming-matches', dashboardController.getUpcomingMatches);
router.get('/recent-matches', dashboardController.getRecentMatches);
router.get('/recent-events', dashboardController.getRecentEvents);
router.get('/top-players', dashboardController.getTopPlayers);
router.get('/players-by-position', dashboardController.getPlayersByPosition);
router.get('/teams-by-association', dashboardController.getTeamsByAssociation);

module.exports = router;