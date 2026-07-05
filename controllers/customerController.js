const prisma = require('../config/db');

// Get all customers (Admin only)
async function getCustomers(req, res, next) {
  try {
    const { search } = req.query;

    let where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const customers = await prisma.customer.findMany({
      where,
      include: {
        _count: {
          select: { orders: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({ success: true, customers });
  } catch (error) {
    next(error);
  }
}

// Get customer detail and their order history (Admin only)
async function getCustomerDetails(req, res, next) {
  try {
    const { id } = req.params;
    const customerId = parseInt(id);

    if (isNaN(customerId)) {
      return res.status(400).json({ success: false, message: 'Invalid customer ID' });
    }

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        orders: {
          include: {
            items: {
              include: {
                product: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    res.status(200).json({ success: true, customer });
  } catch (error) {
    next(error);
  }
}

// Create or verify customer (public)
async function createOrVerifyCustomer(req, res, next) {
  try {
    const { name, phone, address } = req.body;

    if (!phone || !name) {
      return res.status(400).json({ success: false, message: 'Name and phone are required' });
    }

    let customer = await prisma.customer.findUnique({ where: { phone } });

    if (!customer) {
      customer = await prisma.customer.create({
        data: { name, phone, address }
      });
    } else {
      let updateData = {};
      if (customer.name !== name) updateData.name = name;
      if (address && customer.address !== address) updateData.address = address;

      if (Object.keys(updateData).length > 0) {
        customer = await prisma.customer.update({
          where: { phone },
          data: updateData
        });
      }
    }

    res.status(200).json({ success: true, customer });
  } catch (error) {
    next(error);
  }
}

// Delete customer (Admin only)
async function deleteCustomer(req, res, next) {
  try {
    const { id } = req.params;
    const customerId = parseInt(id);

    if (isNaN(customerId)) {
      return res.status(400).json({ success: false, message: 'Invalid customer ID' });
    }

    const existingCustomer = await prisma.customer.findUnique({
      where: { id: customerId }
    });

    if (!existingCustomer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    await prisma.customer.delete({
      where: { id: customerId }
    });

    res.status(200).json({ success: true, message: 'Customer and their order history successfully deleted.' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getCustomers,
  getCustomerDetails,
  createOrVerifyCustomer,
  deleteCustomer,
};
