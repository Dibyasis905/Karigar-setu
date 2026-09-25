const express = require('express');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Artisan = require('../models/Artisan');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', requireAuth, requireRole('buyer', 'admin'), async (req, res, next) => {
  try {
    const { items, shippingAddress, paymentMethod = 'upi' } = req.body;
    if (!Array.isArray(items) || items.length === 0 || !shippingAddress) {
      return res.status(400).json({ success: false, message: 'items and shippingAddress are required' });
    }
    if (!shippingAddress.line1 || !shippingAddress.city || !shippingAddress.state || !shippingAddress.pincode) {
      return res.status(400).json({ success: false, message: 'Complete shippingAddress is required' });
    }
    const ids = items.map(item => item.product);
    const products = await Product.find({ _id: { $in: ids }, isActive: true });
    const byId = new Map(products.map(p => [p._id.toString(), p]));
    const orderItems = items.map(item => {
      const product = byId.get(String(item.product));
      const quantity = Number(item.quantity || 1);
      if (!product) throw Object.assign(new Error(`Product not found: ${item.product}`), { status: 400 });
      if (!Number.isInteger(quantity) || quantity < 1) throw Object.assign(new Error('Quantity must be a positive integer'), { status: 400 });
      if (product.stock < quantity) throw Object.assign(new Error(`Insufficient stock for ${product.name}`), { status: 400 });
      return { product: product._id, name: product.name, quantity, unitPrice: product.price };
    });

    const subtotal = orderItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const deliveryFee = 60;
    const totalAmount = subtotal + deliveryFee;
    const order = await Order.create({ buyer: req.user.id, items: orderItems, totalAmount, deliveryFee, paymentMethod, shippingAddress });
    for (const item of orderItems) await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
    const populated = await Order.findById(order._id).populate('items.product', 'name price images');
    res.status(201).json({ success: true, order: populated });
  } catch (error) { next(error); }
});

router.get('/my', requireAuth, async (req, res, next) => {
  try {
    const orders = await Order.find({ buyer: req.user.id }).populate('items.product', 'name images').sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (error) { next(error); }
});

router.get('/artisan/my', requireAuth, requireRole('artisan', 'admin'), async (req, res, next) => {
  try {
    const artisan = await Artisan.findOne({ user: req.user.id });
    if (!artisan) return res.json({ success: true, orders: [] });
    const products = await Product.find({ artisan: artisan._id }).select('_id');
    const productIds = products.map(p => p._id);
    const orders = await Order.find({ 'items.product': { $in: productIds } })
      .populate('buyer', 'name email')
      .populate('items.product', 'name images')
      .sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (error) { next(error); }
});

router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('buyer', 'name email').populate('items.product', 'name images');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (req.user.role === 'buyer' && order.buyer._id.toString() !== req.user.id) return res.status(403).json({ success: false, message: 'Access denied' });
    res.json({ success: true, order });
  } catch (error) { next(error); }
});

router.get('/', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const orders = await Order.find().populate('buyer', 'name email').populate('items.product', 'name').sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (error) { next(error); }
});

router.patch('/:id/status', requireAuth, requireRole('artisan', 'admin'), async (req, res, next) => {
  try {
    const allowed = ['placed', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled'];
    if (!allowed.includes(req.body.status)) return res.status(400).json({ success: false, message: 'Invalid order status' });
    const order = await Order.findById(req.params.id).populate({ path: 'items.product', populate: { path: 'artisan' } });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (req.user.role === 'artisan') {
      const artisan = await Artisan.findOne({ user: req.user.id });
      const owns = artisan && order.items.some(item => item.product?.artisan?._id?.toString() === artisan._id.toString());
      if (!owns) return res.status(403).json({ success: false, message: 'Access denied' });
    }
    order.status = req.body.status;
    await order.save();
    res.json({ success: true, order });
  } catch (error) { next(error); }
});

module.exports = router;
