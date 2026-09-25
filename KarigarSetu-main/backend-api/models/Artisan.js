const mongoose = require('mongoose');

const artisanSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  name: { type: String, required: true, trim: true },
  craft: { type: String, required: true, trim: true },
  state: { type: String, trim: true },
  district: { type: String, trim: true },
  village: { type: String, trim: true },
  bio: { type: String, trim: true },
  phone: { type: String, trim: true },
  imageUrl: { type: String, trim: true }
}, { timestamps: true });

module.exports = mongoose.model('Artisan', artisanSchema);
