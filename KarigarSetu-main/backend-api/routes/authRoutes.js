const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Artisan = require('../models/Artisan');

const router = express.Router();

function createToken(user) {
  return jwt.sign({ id: user._id.toString(), role: user.role, name: user.name }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, role = 'buyer' } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'name, email and password are required' });
    }
    if (!['buyer', 'artisan'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash, role });
    if (role === 'artisan') {
      await Artisan.create({
        user: user._id,
        name: user.name,
        craft: 'Traditional Handicrafts',
        state: '',
        district: '',
        village: '',
        bio: 'New KarigarSetu artisan profile. Add your craft story from the artisan profile section.',
        phone: ''
      });
    }
    res.status(201).json({ success: true, user, token: createToken(user) });
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() });
    if (!user || !(await bcrypt.compare(password || '', user.passwordHash))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    res.json({ success: true, user, token: createToken(user) });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
