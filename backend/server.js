const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const serverConfig = require('./src/configs/server.config');
const errorHandler = require('./src/middleware/errorHandler');
const paymentController = require('./src/controllers/payment.controller');

const app = express();

// Middleware
app.use(cors({
  origin: serverConfig.clientUrl,
  credentials: true
}));

// ⚠️ QUAN TRỌNG: Webhook mount TRƯỚC express.json()
// express.raw() giúp giữ body dưới dạng Buffer — Stripe cần raw body để verify signature
// Mount trực tiếp controller (KHÔNG qua router) để tránh double-mount conflict
app.post(
  '/api/payments/webhook',
  express.raw({ type: 'application/json' }),
  paymentController.handleWebhook
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());  // Parse cookies — required for refresh token flow

// Mount routes
app.use('/api/auth', require('./src/routes/auth.routes'));
app.use('/api/users', require('./src/routes/user.routes'));
app.use('/api/products', require('./src/routes/product.routes'));
app.use('/api/cart', require('./src/routes/cart.routes'));
app.use('/api/orders', require('./src/routes/order.routes'));
app.use('/api/admin/orders', require('./src/routes/admin.order.routes'));
app.use('/api/admin', require('./src/routes/admin.routes'));       // Stats, Products, Users
app.use('/api/payments', require('./src/routes/payment.routes')); // GET intent/status


// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is running' });
});

// Handle 404 (Not Found)
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'API Route Not Found' });
});

// Global error handler
app.use(errorHandler);

const PORT = serverConfig.port;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
