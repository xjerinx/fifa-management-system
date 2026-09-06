const express = require('express');
const router = express.Router();
const c = require('../controllers/associationController');

router.get('/', c.getAll);
router.get('/:id', c.getOne);
router.post('/', c.create);
router.put('/:id', c.update);
router.delete('/:id', c.remove);
router.get('/:id/teams', c.getTeams);

module.exports = router;