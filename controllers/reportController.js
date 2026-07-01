const prisma = require('../config/db');

// Get overall dashboard stats
async function getDashboardStats(req, res, next) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 1. Today's orders
    const todayOrders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    const todayOrdersCount = todayOrders.length;
    const todaySalesAmount = todayOrders
      .filter((o) => o.status !== 'CANCELLED')
      .reduce((sum, o) => sum + o.totalAmount, 0);

    // 2. Pending orders count
    const pendingOrdersCount = await prisma.order.count({
      where: { status: 'PENDING' },
    });

    // 3. Completed orders count
    const completedOrdersCount = await prisma.order.count({
      where: { status: 'COMPLETED' },
    });

    // 4. Total revenue
    const allCompletedOrders = await prisma.order.findMany({
      where: { status: 'COMPLETED' },
      select: { totalAmount: true },
    });
    const totalRevenue = allCompletedOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    // 5. Popular products
    // Fetch items from COMPLETED orders, group them manually or via prisma group by
    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          status: 'COMPLETED'
        }
      },
      include: {
        product: true
      }
    });

    const productMap = {};
    orderItems.forEach(item => {
      if (!productMap[item.productId]) {
        productMap[item.productId] = {
          id: item.productId,
          name: item.product.name,
          price: item.product.price,
          image: item.product.image,
          quantitySold: 0,
        };
      }
      productMap[item.productId].quantitySold += item.quantity;
    });

    const popularProducts = Object.values(productMap)
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 5);

    // 6. Recent Orders
    const recentOrders = await prisma.order.findMany({
      include: {
        customer: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    });

    res.status(200).json({
      success: true,
      stats: {
        todaySales: todaySalesAmount,
        todayOrders: todayOrdersCount,
        pendingOrders: pendingOrdersCount,
        completedOrders: completedOrdersCount,
        revenue: totalRevenue,
      },
      popularProducts,
      recentOrders,
    });
  } catch (error) {
    next(error);
  }
}

// Get Sales Reports (Daily, Weekly, Monthly chart data)
async function getSalesReports(req, res, next) {
  try {
    const { range } = req.query; // 'daily' (last 7 days), 'weekly' (last 4 weeks), 'monthly' (last 6 months)
    
    const now = new Date();
    let startDate = new Date();

    if (range === 'monthly') {
      startDate.setMonth(now.getMonth() - 6);
    } else if (range === 'weekly') {
      startDate.setDate(now.getDate() - 28);
    } else {
      // default daily
      startDate.setDate(now.getDate() - 7);
    }

    const orders = await prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: startDate,
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Grouping logic based on ranges
    const chartData = {};
    
    if (range === 'monthly') {
      // Group by Month (Name/Year)
      orders.forEach(order => {
        const date = new Date(order.createdAt);
        const monthLabel = date.toLocaleString('default', { month: 'short' }) + ' ' + date.getFullYear();
        if (!chartData[monthLabel]) {
          chartData[monthLabel] = 0;
        }
        chartData[monthLabel] += order.totalAmount;
      });
    } else if (range === 'weekly') {
      // Group by Week (Week of Month)
      orders.forEach(order => {
        const date = new Date(order.createdAt);
        const weekNumber = Math.ceil(date.getDate() / 7);
        const weekLabel = `W${weekNumber} - ${date.toLocaleString('default', { month: 'short' })}`;
        if (!chartData[weekLabel]) {
          chartData[weekLabel] = 0;
        }
        chartData[weekLabel] += order.totalAmount;
      });
    } else {
      // Group by Date (YYYY-MM-DD or Day Name)
      orders.forEach(order => {
        const date = new Date(order.createdAt);
        const dayLabel = date.toLocaleDateString('default', { weekday: 'short', month: 'short', day: 'numeric' });
        if (!chartData[dayLabel]) {
          chartData[dayLabel] = 0;
        }
        chartData[dayLabel] += order.totalAmount;
      });
    }

    const formattedData = Object.keys(chartData).map(label => ({
      label,
      sales: chartData[label],
    }));

    res.status(200).json({
      success: true,
      range: range || 'daily',
      chartData: formattedData,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDashboardStats,
  getSalesReports,
};
