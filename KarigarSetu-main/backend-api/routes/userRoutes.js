const express = require('express');
const User = require('../models/User');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
