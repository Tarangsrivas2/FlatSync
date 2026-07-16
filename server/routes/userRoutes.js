 const express = require('express');
 const router = express.Router();
 const { protect } = require('../middlewares/authMiddleware');
 const { getOnlineUsers } = require('../socket');
 const { getUserProfile, updateUserProfile } = require('../controllers/userController');
 
 router.get('/online-status/:userId', protect, (req, res) => {
   try {
   const onlineUsers = getOnlineUsers();
   const isOnline = onlineUsers.has(req.params.userId);
    res.json({ isOnline });
   } catch (err) {
     res.status(500).json({ isOnline: false });
   } });
 
 router.get('/:id', protect, getUserProfile);
 router.put('/profile', protect, updateUserProfile);
 
 module.exports = router;