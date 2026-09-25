require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Artisan = require('../models/Artisan');
const Product = require('../models/Product');

async function seed() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is missing in .env');
  await mongoose.connect(process.env.MONGODB_URI);

  await Promise.all([
    Product.deleteMany({}),
    Artisan.deleteMany({}),
    User.deleteMany({})
  ]);

  const passwordHash = await bcrypt.hash('Demo@12345', 10);
  const [buyer, artisanUser, admin] = await User.create([
    { name: 'Demo Buyer', email: 'buyer@karigarsetu.demo', passwordHash, role: 'buyer' },
    { name: 'Demo Artisan', email: 'artisan@karigarsetu.demo', passwordHash, role: 'artisan' },
    { name: 'Demo Admin', email: 'admin@karigarsetu.demo', passwordHash, role: 'admin' }
  ]);

  const artisan = await Artisan.create({
    user: artisanUser._id,
    name: artisanUser.name,
    craft: 'Terracotta',
    state: 'West Bengal',
    district: 'Bishnupur',
    village: 'Panchmura',
    bio: 'Traditional handcrafted terracotta artisan profile for prototype testing.',
    phone: '9999999999'
  });

  await Product.create([
    {
      artisan: artisan._id,
      name: 'Handcrafted Terracotta Horse',
      description: 'Traditional decorative terracotta craft piece.',
      category: 'Home Decor',
      material: 'Terracotta',
      price: 1299,
      stock: 12,
      images: ['https://images.unsplash.com/photo-1590425082795-4c6d8f1e6a6f?auto=format&fit=crop&w=800&q=80'],
      tags: ['terracotta', 'handmade', 'bengal'],
      aiGenerated: true
    },
    {
      artisan: artisan._id,
      name: 'Painted Clay Vase',
      description: 'Hand-painted clay vase made by a traditional artisan.',
      category: 'Decor',
      material: 'Clay',
      price: 899,
      stock: 8,
      images: ['https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?auto=format&fit=crop&w=800&q=80'],
      tags: ['clay', 'vase', 'handcrafted'],
      aiGenerated: false
    }
  ]);

  console.log('Seed completed. Demo credentials: buyer@karigarsetu.demo / Demo@12345');
  console.log('Artisan: artisan@karigarsetu.demo / Demo@12345');
  console.log('Admin: admin@karigarsetu.demo / Demo@12345');
  await mongoose.disconnect();
}

seed().catch(async (error) => {
  console.error(error);
  try { await mongoose.disconnect(); } catch (_) {}
  process.exit(1);
});
