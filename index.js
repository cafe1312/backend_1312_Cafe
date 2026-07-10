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

// Body Parsers (with size limits to prevent DoS/oversized inputs)
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

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

  // DB Cleanup Task: delete orders older than 3 days to save space
  const prisma = require('./config/db');
  const purgeOldOrders = async () => {
    try {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const result = await prisma.order.deleteMany({
        where: {
          createdAt: {
            lt: threeDaysAgo
          }
        }
      });
      console.log(`[DB Cleanup] Successfully purged ${result.count} orders older than 3 days.`);
    } catch (err) {
      console.error('[DB Cleanup] Error purging old orders:', err.message);
    }
  };

  // Run on startup
  purgeOldOrders();
  // Run every 24 hours
  setInterval(purgeOldOrders, 24 * 60 * 60 * 1000);
});
