const jwt = require('jsonwebtoken');
const prisma = require('../config/db');

async function protect(req, res, next) {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, token missing' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || '1312_cafe_jwt_secret_key_2026_premium');
    
    // Check if admin or customer
    if (decoded.role === 'admin') {
      const admin = await prisma.admin.findUnique({ where: { id: decoded.id } });
      if (!admin) {
        return res.status(401).json({ success: false, message: 'User not found' });
      }
      req.user = admin;
      req.user.role = 'admin';
    } else {
      const customer = await prisma.customer.findUnique({ where: { id: decoded.id } });
      if (!customer) {
        return res.status(401).json({ success: false, message: 'User not found' });
      }
      req.user = customer;
      req.user.role = 'customer';
    }
    
    next();
  } catch (error) {
    console.error('JWT verification error:', error);
    return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
  }
}

function adminOnly(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Access denied: admin privilege required' });
  }
}

module.exports = { protect, adminOnly };
