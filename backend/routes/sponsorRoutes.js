const express = require('express');
const router = express.Router();
const sponsorController = require('../controllers/sponsorController');

router.get('/', sponsorController.getAll);
router.get('/:id', sponsorController.getOne);
router.post('/', sponsorController.create);
router.put('/:id', sponsorController.update);
router.post('/bulk-delete', sponsorController.bulkRemove);
router.delete('/bulk', sponsorController.bulkRemove);
router.delete('/:id', sponsorController.remove);

router.get('/:id/matches', sponsorController.getMatches);

module.exports = router;