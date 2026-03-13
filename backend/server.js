const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const serverConfig = require('./src/configs/server.config');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();

// Middleware
app.use(cors({
  origin: serverConfig.clientUrl,
  credentials: true
}));

app.use('/api/payments/webhook', express.raw({ type: 'application/json' }), require('./src/routes/payment.routes'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());  // Parse cookies — required for refresh token flow

// Mount routes
app.use('/api/auth', require('./src/routes/auth.routes'));
app.use('/api/products', require('./src/routes/product.routes'));
app.use('/api/cart', require('./src/routes/cart.routes'));
app.use('/api/orders', require('./src/routes/order.routes'));

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
