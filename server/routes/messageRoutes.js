const express = require('express');
const router = express.Router();
const { getMessages, markAsSeen, deleteMessage } = require('../controllers/messageController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/:roomId',              protect, getMessages);   // fetch chat history
router.put('/seen',                 protect, markAsSeen);    // mark messages as seen
router.delete('/:messageId',        protect, deleteMessage); // delete a message

module.exports = router;