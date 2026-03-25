require('dotenv').config();
require('./src/jobs/scheduledEmailJob');
require('./src/configs/passport.config'); // Register OAuth strategies (side-effect import)
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const serverConfig = require('./src/configs/server.config');
const errorHandler = require('./src/middleware/errorHandler');
const { specialRoutes, apiRoutes } = require('./src/configs/route.config');

const app = express();

// --- CORS ---
app.use(cors({
  origin: serverConfig.clientUrl,
  credentials: true
}));

app.options('*', cors())

// ⚠️ Special routes TRƯỚC express.json() (vd: Stripe webhook cần raw body)
// ⚠️ QUAN TRỌNG: Webhook mount TRƯỚC express.json()
// express.raw() giúp giữ body dưới dạng Buffer — Stripe cần raw body để verify signature
// Mount trực tiếp controller (KHÔNG qua router) để tránh double-mount conflict
specialRoutes.forEach(({ method, path, middlewares, handler }) => {
  app[method](path, ...middlewares, handler);
});

// --- Global middleware ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());  // Parse cookies — required for refresh token flow
app.use(passport.initialize()); // Stateless Passport — NO passport.session()

// --- API routes ---
apiRoutes.forEach(({ prefix, router }) => {
  app.use(prefix, router);
});

// --- Health check ---
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is running' });
});

// --- 404 handler ---
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'API Route Not Found' });
});

// --- Global error handler ---
app.use(errorHandler);

const PORT = serverConfig.port;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

