const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: { type: [orderItemSchema], required: true },
  totalAmount: { type: Number, required: true, min: 0 },
  deliveryFee: { type: Number, default: 60, min: 0 },
  paymentMethod: { type: String, enum: ['upi', 'card', 'cod'], default: 'upi' },
  shippingAddress: {
    line1: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true }
  },
  status: {
    type: String,
    enum: ['placed', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled'],
    default: 'placed'
  }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
