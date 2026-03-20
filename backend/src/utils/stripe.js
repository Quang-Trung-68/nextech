require('dotenv').config();
const Stripe = require('stripe');

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('⚠️ Missing STRIPE_SECRET_KEY in environment variables');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16', // or current active version; this acts as a safe fallback
  appInfo: { 
    name: 'ecommerce-backend',
    version: '1.0.0'
  }
});

module.exports = stripe;
