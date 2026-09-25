const express = require('express');
const Product = require('../models/Product');
const Artisan = require('../models/Artisan');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const filter = { isActive: true };
    if (req.query.category) filter.category = new RegExp(req.query.category, 'i');
    if (req.query.material) filter.material = new RegExp(req.query.material, 'i');
    if (req.query.artisan) filter.artisan = req.query.artisan;
    if (req.query.search) {
      const q = new RegExp(req.query.search, 'i');
      filter.$or = [{ name: q }, { description: q }, { category: q }, { material: q }, { tags: q }];
    }

    const products = await Product.find(filter)
      .populate({ path: 'artisan', populate: { path: 'user', select: 'name' } })
      .sort({ createdAt: -1 });

    res.json({ success: true, products });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate({ path: 'artisan', populate: { path: 'user', select: 'name' } });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, product });
  } catch (error) {
    next(error);
  }
});

router.post('/', requireAuth, requireRole('artisan', 'admin'), async (req, res, next) => {
  try {
    let artisan;
    if (req.user.role === 'admin' && req.body.artisan) {
      artisan = await Artisan.findById(req.body.artisan);
    } else {
      artisan = await Artisan.findOne({ user: req.user.id });
    }

    if (!artisan) {
      return res.status(400).json({ success: false, message: 'Create an artisan profile before adding products' });
    }

    const product = await Product.create({ ...req.body, artisan: artisan._id });
    const populated = await Product.findById(product._id).populate('artisan');
    res.status(201).json({ success: true, product: populated });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', requireAuth, async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate('artisan');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    const ownerId = product.artisan?.user?.toString();
    if (req.user.role !== 'admin' && ownerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    Object.assign(product, req.body);
    await product.save();
    res.json({ success: true, product });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate('artisan');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    const ownerId = product.artisan?.user?.toString();
    if (req.user.role !== 'admin' && ownerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    product.isActive = false;
    await product.save();
    res.json({ success: true, message: 'Product archived' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
