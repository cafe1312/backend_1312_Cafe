const prisma = require('../config/db');

// Get all coupons (Admin only)
async function getCoupons(req, res, next) {
  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: { id: 'desc' }
    });
    res.status(200).json({ success: true, coupons });
  } catch (error) {
    next(error);
  }
}

// Create coupon (Admin only)
async function createCoupon(req, res, next) {
  try {
    const { code, discount, active } = req.body;

    if (!code || discount === undefined) {
      return res.status(400).json({ success: false, message: 'Coupon code and discount percentage are required' });
    }

    const uppercaseCode = code.toUpperCase();
    const existingCoupon = await prisma.coupon.findUnique({ where: { code: uppercaseCode } });
    
    if (existingCoupon) {
      return res.status(400).json({ success: false, message: 'Coupon code already exists' });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: uppercaseCode,
        discount: parseFloat(discount),
        active: active !== undefined ? active : true
      }
    });

    res.status(201).json({ success: true, message: 'Coupon created successfully', coupon });
  } catch (error) {
    next(error);
  }
}

// Toggle coupon state (Admin only)
async function updateCoupon(req, res, next) {
  try {
    const { id } = req.params;
    const couponId = parseInt(id);
    const { active, discount } = req.body;

    if (isNaN(couponId)) {
      return res.status(400).json({ success: false, message: 'Invalid coupon ID' });
    }

    let updateData = {};
    if (active !== undefined) updateData.active = active;
    if (discount !== undefined) updateData.discount = parseFloat(discount);

    const coupon = await prisma.coupon.update({
      where: { id: couponId },
      data: updateData
    });

    res.status(200).json({ success: true, message: 'Coupon updated successfully', coupon });
  } catch (error) {
    next(error);
  }
}

// Delete coupon (Admin only)
async function deleteCoupon(req, res, next) {
  try {
    const { id } = req.params;
    const couponId = parseInt(id);

    if (isNaN(couponId)) {
      return res.status(400).json({ success: false, message: 'Invalid coupon ID' });
    }

    await prisma.coupon.delete({
      where: { id: couponId }
    });

    res.status(200).json({ success: true, message: 'Coupon deleted successfully' });
  } catch (error) {
    next(error);
  }
}

// Validate coupon (Public)
async function validateCoupon(req, res, next) {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Coupon code is required' });
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() }
    });

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Invalid coupon code' });
    }

    if (!coupon.active) {
      return res.status(400).json({ success: false, message: 'Coupon is inactive or expired' });
    }

    res.status(200).json({
      success: true,
      message: 'Coupon code validated successfully',
      discount: coupon.discount
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
};
