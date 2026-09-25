const express = require('express');
const Artisan = require('../models/Artisan');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.craft) filter.craft = new RegExp(req.query.craft, 'i');
    if (req.query.state) filter.state = new RegExp(req.query.state, 'i');
    const artisans = await Artisan.find(filter).populate('user', 'name email');
    res.json({ success: true, artisans });
  } catch (error) {
    next(error);
  }
});

router.get('/me', requireAuth, requireRole('artisan', 'admin'), async (req, res, next) => {
  try {
    const artisan = await Artisan.findOne({ user: req.user.id }).populate('user', 'name email');
    if (!artisan) return res.status(404).json({ success: false, message: 'Artisan profile not found' });
    res.json({ success: true, artisan });
  } catch (error) { next(error); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const artisan = await Artisan.findById(req.params.id).populate('user', 'name email');
    if (!artisan) return res.status(404).json({ success: false, message: 'Artisan not found' });
    res.json({ success: true, artisan });
  } catch (error) {
    next(error);
  }
});

router.post('/', requireAuth, requireRole('artisan', 'admin'), async (req, res, next) => {
  try {
    const data = { ...req.body, user: req.user.id };
    const artisan = await Artisan.create(data);
    res.status(201).json({ success: true, artisan });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', requireAuth, async (req, res, next) => {
  try {
    const artisan = await Artisan.findById(req.params.id);
    if (!artisan) return res.status(404).json({ success: false, message: 'Artisan not found' });
    if (req.user.role !== 'admin' && artisan.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    Object.assign(artisan, req.body);
    await artisan.save();
    res.json({ success: true, artisan });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
