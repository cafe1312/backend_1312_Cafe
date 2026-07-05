const fs = require('fs');
const path = require('path');
const prisma = require('../config/db');
const jwt = require('jsonwebtoken');


// Create new order
async function createOrder(req, res, next) {
  try {
    const { name, phone, address, items, paymentMethod, deliveryMethod, couponCode, latitude, longitude } = req.body;

    if (!phone || !items || !items.length || !paymentMethod) {
      return res.status(400).json({ success: false, message: 'Phone, payment method, and items are required' });
    }

    // 1. Find or create Customer
    let customer = await prisma.customer.findUnique({ where: { phone } });
    if (!customer) {
      if (!name) {
        return res.status(400).json({ success: false, message: 'Name is required for new customers' });
      }
      customer = await prisma.customer.create({
        data: { name, phone, address },
      });
    } else {
      // Update name and address if they changed
      let updateData = {};
      if (name && customer.name !== name) updateData.name = name;
      if (address && customer.address !== address) updateData.address = address;
      if (Object.keys(updateData).length > 0) {
        customer = await prisma.customer.update({
          where: { phone },
          data: updateData
        });
      }
    }

    // 2. Fetch product prices and calculate totals
    let totalAmount = 0;
    const orderItemsToCreate = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product) {
        return res.status(404).json({ success: false, message: `Product with ID ${item.productId} not found` });
      }
      if (!product.available) {
        return res.status(400).json({ success: false, message: `Product ${product.name} is currently unavailable` });
      }

      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      orderItemsToCreate.push({
        productId: product.id,
        quantity: item.quantity,
        price: product.price,
      });
    }

    // 3. Apply coupon if valid
    let discountAmount = 0;
    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({ where: { code: couponCode } });
      if (coupon && coupon.active) {
        discountAmount = totalAmount * (coupon.discount / 100);
      }
    }

    const taxableAmount = Math.max(0, totalAmount - discountAmount);

    // Read delivery and tax settings
    let deliveryCharges = 0;
    let taxPercentage = 0;
    let calculatedDistance = null;
    let finalLat = null;
    let finalLon = null;

    try {
      const settingsFilePath = path.join(__dirname, '../data/settings.json');
      if (fs.existsSync(settingsFilePath)) {
        const settings = JSON.parse(fs.readFileSync(settingsFilePath, 'utf-8'));
        taxPercentage = parseFloat(settings.taxPercentage) || 0;

        if (deliveryMethod === 'DELIVERY') {
          if (latitude === undefined || longitude === undefined) {
            return res.status(400).json({ success: false, message: 'Live location coordinates are required for delivery orders.' });
          }

          finalLat = parseFloat(latitude);
          finalLon = parseFloat(longitude);

          if (isNaN(finalLat) || isNaN(finalLon)) {
            return res.status(400).json({ success: false, message: 'Invalid live location coordinates.' });
          }
          const shopLat = parseFloat(settings.shopLatitude);
          const shopLon = parseFloat(settings.shopLongitude);

          if (isNaN(shopLat) || isNaN(shopLon)) {
            return res.status(500).json({ success: false, message: 'Shop coordinates are not configured in system settings.' });
          }

          const maxRange = parseFloat(settings.deliveryRangeKm) || 10.0;
          const chargePerKm = parseFloat(settings.deliveryChargePerKm) || 10.0;

          // Haversine distance
          const R = 6371; // km
          const dLat = (finalLat - shopLat) * Math.PI / 180;
          const dLon = (finalLon - shopLon) * Math.PI / 180;
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(shopLat * Math.PI / 180) * Math.cos(finalLat * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          calculatedDistance = R * c;

          if (calculatedDistance > maxRange) {
            return res.status(400).json({
              success: false,
              message: `Your location is outside our delivery range of ${maxRange} km. (Distance: ${calculatedDistance.toFixed(2)} km)`
            });
          }

          deliveryCharges = calculatedDistance * chargePerKm;
        }
      }
    } catch (err) {
      console.error('Error reading settings in orderController:', err);
    }

    const taxAmount = taxableAmount * (taxPercentage / 100);
    const finalTotalAmount = taxableAmount + taxAmount + deliveryCharges;

    // 4. Create Order and OrderItems in database transaction
    const order = await prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          customerId: customer.id,
          totalAmount: finalTotalAmount,
          paymentMethod,
          paymentStatus: paymentMethod === 'CASH' ? 'PENDING' : 'PAID', // simulated
          status: 'PENDING',
          deliveryMethod: deliveryMethod || 'TAKEAWAY',
          address: deliveryMethod === 'DELIVERY' ? address : null,
          latitude: deliveryMethod === 'DELIVERY' ? finalLat : null,
          longitude: deliveryMethod === 'DELIVERY' ? finalLon : null,
          distance: deliveryMethod === 'DELIVERY' ? calculatedDistance : null,
          deliveryCharges: deliveryMethod === 'DELIVERY' ? deliveryCharges : null,
          items: {
            create: orderItemsToCreate,
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          customer: true,
        },
      });
      return createdOrder;
    });

    res.status(201).json({ success: true, message: 'Order placed successfully', order });
  } catch (error) {
    next(error);
  }
}

// Get all orders (Admin only)
async function getOrders(req, res, next) {
  try {
    const { status, limit } = req.query;
    
    let where = {};
    if (status) {
      where.status = status;
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        customer: true,
        items: {
          include: {
            product: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit ? parseInt(limit) : undefined,
    });

    res.status(200).json({ success: true, orders });
  } catch (error) {
    next(error);
  }
}

// Get order details
async function getOrderById(req, res, next) {
  try {
    const { id } = req.params;
    const orderId = parseInt(id);

    if (isNaN(orderId)) {
      return res.status(400).json({ success: false, message: 'Invalid order ID' });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Check if the user is a logged-in admin
    let isAdmin = false;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || '1312_cafe_jwt_secret_key_2026_premium');
        if (decoded.role === 'admin') {
          isAdmin = true;
        }
      } catch (err) {
        // Not a valid admin token
      }
    }

    // If not admin, sanitize customer details to prevent data leak
    if (!isAdmin && order.customer) {
      order.customer = {
        id: order.customer.id,
        name: order.customer.name,
        phone: order.customer.phone ? order.customer.phone.replace(/.(?=.{4})/g, '*') : null, // mask phone except last 4 digits
        address: order.customer.address ? 'Masked' : null,
        createdAt: order.customer.createdAt
      };
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    next(error);
  }
}

// Update order status (Admin only)
async function updateOrderStatus(req, res, next) {
  try {
    const { id } = req.params;
    const orderId = parseInt(id);
    const { status, paymentStatus } = req.body;

    if (isNaN(orderId)) {
      return res.status(400).json({ success: false, message: 'Invalid order ID' });
    }

    const validStatuses = ['PENDING', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid order status' });
    }

    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!existingOrder) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const elapsedSeconds = (Date.now() - new Date(existingOrder.createdAt).getTime()) / 1000;
    if (elapsedSeconds < 10) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be confirmed or modified within the first 10 seconds of placement (remaining: ${Math.ceil(10 - elapsedSeconds)}s).`
      });
    }

    let updateData = {};
    if (status) updateData.status = status;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;

    const order = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        customer: true,
      }
    });

    res.status(200).json({ success: true, message: `Order status updated to ${status || order.status}`, order });
  } catch (error) {
    next(error);
  }
}

// Track Order by Customer phone / order ID
async function trackOrder(req, res, next) {
  try {
    const { id } = req.params;
    const orderId = parseInt(id);

    if (isNaN(orderId)) {
      return res.status(400).json({ success: false, message: 'Invalid order ID' });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        totalAmount: true,
        createdAt: true,
        customer: {
          select: {
            name: true,
          }
        },
        items: {
          select: {
            quantity: true,
            product: {
              select: {
                name: true,
              }
            }
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    next(error);
  }
}

// Cancel Order by customer within 10 seconds
async function cancelOrder(req, res, next) {
  try {
    const { id } = req.params;
    const orderId = parseInt(id);

    if (isNaN(orderId)) {
      return res.status(400).json({ success: false, message: 'Invalid order ID' });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: 'Only pending orders can be cancelled.' });
    }

    // Check if placed within 10 seconds (10000 ms)
    const orderTime = new Date(order.createdAt).getTime();
    const now = Date.now();
    const diffSeconds = (now - orderTime) / 1000;

    if (diffSeconds > 10) {
      return res.status(400).json({ success: false, message: 'Order can only be cancelled within 10 seconds of placement.' });
    }

    const cancelledOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: 'CANCELLED' }
    });

    res.status(200).json({ success: true, message: 'Order cancelled successfully', order: cancelledOrder });
  } catch (error) {
    next(error);
  }
}

// Delete order (Admin only)
async function deleteOrder(req, res, next) {
  try {
    const { id } = req.params;
    const orderId = parseInt(id);

    if (isNaN(orderId)) {
      return res.status(400).json({ success: false, message: 'Invalid order ID' });
    }

    // Delete items first to maintain referential integrity
    await prisma.orderItem.deleteMany({
      where: { orderId }
    });

    // Delete order
    await prisma.order.delete({
      where: { id: orderId }
    });

    res.status(200).json({ success: true, message: 'Order deleted successfully from database' });
  } catch (error) {
    next(error);
  }
}

// Bulk delete / clean up orders (Admin only)
async function cleanupOrders(req, res, next) {
  try {
    const { olderThanDays, status } = req.query;
    let whereClause = {};

    if (olderThanDays !== undefined) {
      const days = parseInt(olderThanDays);
      if (!isNaN(days) && days > 0) {
        const cutOffDate = new Date();
        cutOffDate.setDate(cutOffDate.getDate() - days);
        whereClause.createdAt = {
          lt: cutOffDate
        };
      }
    }

    // Delete orders matching criteria regardless of status (completed, cancelled, pending, preparing, ready)

    const ordersToDelete = await prisma.order.findMany({
      where: whereClause,
      select: { id: true }
    });

    const orderIds = ordersToDelete.map(o => o.id);

    if (orderIds.length > 0) {
      // Delete order items first to maintain referential integrity
      await prisma.orderItem.deleteMany({
        where: {
          orderId: {
            in: orderIds
          }
        }
      });

      const deleteResult = await prisma.order.deleteMany({
        where: {
          id: {
            in: orderIds
          }
        }
      });

      return res.status(200).json({
        success: true,
        message: `Successfully deleted ${deleteResult.count} orders from database.`,
        deletedCount: deleteResult.count
      });
    } else {
      return res.status(200).json({
        success: true,
        message: 'No orders found matching the criteria for cleanup.',
        deletedCount: 0
      });
    }
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  trackOrder,
  cancelOrder,
  deleteOrder,
  cleanupOrders,
};

