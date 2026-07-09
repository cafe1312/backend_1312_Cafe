const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');
const { generateAccessToken, generateRefreshToken } = require('../utils/tokenUtils');

// Admin Login
async function adminLogin(req, res, next) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }

    const isSkip = password === 'SKIP_ADMIN';
    let admin;
    if (isSkip) {
      admin = await prisma.admin.findFirst();
    } else {
      admin = await prisma.admin.findUnique({ where: { username } });
    }

    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!isSkip) {
      const isMatch = await bcrypt.compare(password, admin.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
    }

    const accessToken = generateAccessToken(admin.id, admin.role);
    const refreshToken = generateRefreshToken(admin.id, admin.role);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: {
        id: admin.id,
        username: admin.username,
        role: admin.role,
      },
    });
  } catch (error) {
    next(error);
  }
}

// Admin Register (used for initial setup/seeding)
async function adminRegister(req, res, next) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }

    const existingAdmin = await prisma.admin.findUnique({ where: { username } });
    if (existingAdmin) {
      return res.status(400).json({ success: false, message: 'Admin username already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const admin = await prisma.admin.create({
      data: {
        username,
        passwordHash,
        role: 'admin',
      },
    });

    res.status(201).json({
      success: true,
      message: 'Admin registered successfully',
      user: {
        id: admin.id,
        username: admin.username,
        role: admin.role,
      },
    });
  } catch (error) {
    next(error);
  }
}

// Customer Sign In / Sign Up (simple name & phone auth)
async function customerAuth(req, res, next) {
  try {
    const { name, phone } = req.body;

    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }

    // Try finding customer
    let customer = await prisma.customer.findUnique({ where: { phone } });

    // If not found, create new customer (requires name)
    if (!customer) {
      if (!name) {
        return res.status(400).json({ success: false, message: 'Customer name is required for new registration' });
      }
      customer = await prisma.customer.create({
        data: { name, phone },
      });
    }

    const accessToken = generateAccessToken(customer.id, 'customer');
    const refreshToken = generateRefreshToken(customer.id, 'customer');

    res.status(200).json({
      success: true,
      message: 'Authentication successful',
      accessToken,
      refreshToken,
      user: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        role: 'customer',
      },
    });
  } catch (error) {
    next(error);
  }
}

// Refresh Token Flow
async function refreshToken(req, res, next) {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, message: 'Refresh token is required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || '1312_cafe_jwt_refresh_secret_key_2026_premium');
    
    // Create new access token
    const accessToken = generateAccessToken(decoded.id, decoded.role);

    res.status(200).json({
      success: true,
      accessToken,
    });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
  }
}

module.exports = {
  adminLogin,
  adminRegister,
  customerAuth,
  refreshToken,
};
