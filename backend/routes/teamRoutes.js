const express = require('express');
const router = express.Router();
const c = require('../controllers/teamController');

router.get('/', c.getAll);
router.get('/:id', c.getOne);
router.post('/', c.create);
router.put('/:id', c.update);
router.post('/bulk-delete', c.bulkRemove);
router.delete('/bulk', c.bulkRemove);
router.delete('/:id', c.remove);
router.get('/:id/players', c.getPlayers);
router.get('/:id/tournaments', c.getTournaments);

module.exports = router;