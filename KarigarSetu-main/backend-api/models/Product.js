const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  artisan: { type: mongoose.Schema.Types.ObjectId, ref: 'Artisan', required: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  category: { type: String, required: true, trim: true },
  material: { type: String, trim: true },
  craftType: { type: String, trim: true },
  price: { type: Number, required: true, min: 0 },
  stock: { type: Number, required: true, min: 0, default: 1 },
  images: [{ type: String }],
  tags: [{ type: String, trim: true }],
  aiGenerated: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
