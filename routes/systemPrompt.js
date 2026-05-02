const express = require('express');
const SystemPromptController = require('../controllers/SystemPromptController');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();

router.get('/', SystemPromptController.list);
router.get('/active', SystemPromptController.getActive);
router.post('/', adminAuth, SystemPromptController.create);
router.put('/:id', adminAuth, SystemPromptController.update);
router.delete('/:id', adminAuth, SystemPromptController.delete);
router.post('/:id/activate', adminAuth, SystemPromptController.activate);

module.exports = router;
