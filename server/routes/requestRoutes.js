const express = require('express');
const router = express.Router();

// ✅ Imports MUST come before using anything
const { 
  sendRequest, 
  getIncomingRequests, 
  getOutgoingRequests, 
  updateRequestStatus 
} = require('../controllers/requestController');
const { protect } = require('../middlewares/authMiddleware');

// ✅ Static routes BEFORE dynamic /:id routes
router.post('/send', protect, sendRequest);
router.get('/incoming', protect, getIncomingRequests);
router.get('/outgoing', protect, getOutgoingRequests);

router.put('/:id/accept', protect, (req, res) => {
  req.body = req.body || {};
  req.body.status = 'accepted';
  updateRequestStatus(req, res);
});

router.put('/:id/reject', protect, (req, res) => {
  req.body = req.body || {};
  req.body.status = 'rejected';
  updateRequestStatus(req, res);
});

module.exports = router;