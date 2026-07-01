const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const { rateLimiter } = require('./middleware/rateLimiter');
const { errorHandler } = require('./middleware/errorMiddleware');
const { setupSwagger } = require('./utils/swagger');

// Import routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const orderRoutes = require('./routes/orders');
const couponRoutes = require('./routes/coupons');
const customerRoutes = require('./routes/customers');
const settingRoutes = require('./routes/settings');
const reportRoutes = require('./routes/reports');

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false, // Allow loading images from different origins if needed
}));
app.use(cors({
  origin: '*', // Customize this as needed
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate Limiter for all routes
app.use(rateLimiter);

// Logger
app.use(morgan('dev'));

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static upload folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Swagger API documentation
setupSwagger(app);

// Base route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to 1312 Cafe API',
    docs: '/api-docs',
  });
});

// Register API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/reports', reportRoutes);

// 404 Route handler
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'API Route not found' });
});

// Centralized error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`Swagger documentation available at http://localhost:${PORT}/api-docs`);
});
