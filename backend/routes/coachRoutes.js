const express = require('express');
const router = express.Router();
const coachController = require('../controllers/coachController');

router.get('/', coachController.getAll);
router.get('/:id', coachController.getOne);
router.post('/', coachController.create);
router.put('/:id', coachController.update);
router.delete('/:id', coachController.remove);

module.exports = router;