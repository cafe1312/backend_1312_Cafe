const prisma = require('../config/db');

// Create new order
async function createOrder(req, res, next) {
  try {
    const { name, phone, items, paymentMethod, couponCode } = req.body;

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
        data: { name, phone },
      });
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
    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({ where: { code: couponCode } });
      if (coupon && coupon.active) {
        const discountAmount = totalAmount * (coupon.discount / 100);
        totalAmount = Math.max(0, totalAmount - discountAmount);
      }
    }

    // 4. Create Order and OrderItems in database transaction
    const order = await prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          customerId: customer.id,
          totalAmount,
          paymentMethod,
          paymentStatus: paymentMethod === 'CASH' ? 'PENDING' : 'PAID', // simulated
          status: 'PENDING',
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

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  trackOrder,
};
