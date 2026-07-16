const express = require('express');
const router = express.Router();
const { registerUser, loginUser, submitOnboarding, getMe } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/onboarding', protect, submitOnboarding);
router.get('/me', protect, getMe);


module.exports = router;
