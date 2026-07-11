const prisma = require('../config/db');
const PDFDocument = require('pdfkit');

// Get overall dashboard stats
async function getDashboardStats(req, res, next) {
  try {
    // Align daily stats with Indian Standard Time (IST - UTC+5:30)
    const nowIST = new Date(new Date().getTime() + 5.5 * 60 * 60 * 1000);
    const todayIST = new Date(nowIST);
    todayIST.setUTCHours(0, 0, 0, 0);
    
    const today = new Date(todayIST.getTime() - 5.5 * 60 * 60 * 1000);
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

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

    // 5. Product sales quantities (quantities sold for completed orders today)
    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          status: 'COMPLETED',
          createdAt: {
            gte: today,
            lt: tomorrow,
          },
        },
      },
      include: {
        product: true,
      },
    });

    const salesMap = {};
    orderItems.forEach(item => {
      salesMap[item.productId] = (salesMap[item.productId] || 0) + item.quantity;
    });

    const allProducts = await prisma.product.findMany();

    const popularProducts = allProducts.map(p => ({
      id: p.id,
      name: p.name,
      price: p.price,
      image: p.image,
      quantitySold: salesMap[p.id] || 0
    })).sort((a, b) => b.quantitySold - a.quantitySold);

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

// Generate and download weekly PDF report
async function downloadWeeklyPDF(req, res, next) {
  try {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // Fetch all orders in the last 7 days
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
          lte: today,
        },
      },
      include: {
        items: {
          include: {
            product: true
          }
        },
        customer: true
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate report statistics
    const totalOrdersCount = orders.length;
    const completedOrders = orders.filter(o => o.status === 'COMPLETED');
    const completedOrdersCount = completedOrders.length;
    const cancelledOrdersCount = orders.filter(o => o.status === 'CANCELLED').length;
    const totalSalesAmount = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const avgOrderValue = completedOrdersCount > 0 ? (totalSalesAmount / completedOrdersCount) : 0;

    // Group sales and order count by day (last 7 days)
    const dailyStats = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString('default', { weekday: 'short', month: 'short', day: 'numeric' });
      dailyStats[label] = { sales: 0, count: 0 };
    }

    orders.forEach(order => {
      const date = new Date(order.createdAt);
      const label = date.toLocaleDateString('default', { weekday: 'short', month: 'short', day: 'numeric' });
      if (dailyStats[label]) {
        dailyStats[label].count++;
        if (order.status === 'COMPLETED') {
          dailyStats[label].sales += order.totalAmount;
        }
      }
    });

    // Best selling products in this range
    const productSalesMap = {};
    orders.forEach(order => {
      if (order.status === 'COMPLETED') {
        order.items.forEach(item => {
          if (!productSalesMap[item.productId]) {
            productSalesMap[item.productId] = {
              name: item.product.name,
              price: item.price,
              quantity: 0,
              total: 0
            };
          }
          productSalesMap[item.productId].quantity += item.quantity;
          productSalesMap[item.productId].total += item.price * item.quantity;
        });
      }
    });

    const popularProducts = Object.values(productSalesMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // Initialize PDF Document
    const doc = new PDFDocument({ margin: 50 });

    // Set Response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=weekly-sales-report-${new Date().toISOString().slice(0, 10)}.pdf`);

    // Stream PDF directly to Response
    doc.pipe(res);

    // Styling Colors
    const primaryColor = '#9BB578'; // Green accent
    const darkColor = '#1E2219'; // Cafe Dark
    const greyColor = '#555555';
    const lightGreyColor = '#E8EBE6';

    const fs = require('fs');
    const path = require('path');
    let cafeName = "1312 Cafe";
    let address = "1312 Gourmet St, Culinary City";
    let phone = "+1 234 567 8900";
    let email = "contact@1312cafe.com";
    
    try {
      const settingsFilePath = path.join(__dirname, '../data/settings.json');
      if (fs.existsSync(settingsFilePath)) {
        const settings = JSON.parse(fs.readFileSync(settingsFilePath, 'utf-8'));
        if (settings.cafeName) cafeName = settings.cafeName;
        if (settings.address) address = settings.address;
        if (settings.phone) phone = settings.phone;
        if (settings.email) email = settings.email;
      }
    } catch (err) {
      console.error('Error reading settings in downloadWeeklyPDF:', err);
    }

    // PDF Header
    doc
      .fillColor(darkColor)
      .fontSize(22)
      .font('Helvetica-Bold')
      .text(cafeName.toUpperCase(), 50, 50);

    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor(greyColor)
      .text(address, 50, 75)
      .text(`Phone: ${phone} | ${email}`, 50, 90);

    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .fillColor(darkColor)
      .text('WEEKLY SALES REPORT', 380, 50, { align: 'right' });

    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor(greyColor)
      .text(`Period: ${sevenDaysAgo.toLocaleDateString()} - ${today.toLocaleDateString()}`, 380, 70, { align: 'right' })
      .text(`Generated: ${new Date().toLocaleString()}`, 380, 85, { align: 'right' });

    // Horizontal line separator
    doc
      .moveTo(50, 115)
      .lineTo(560, 115)
      .strokeColor(primaryColor)
      .lineWidth(2)
      .stroke();

    // Summary Metrics Section
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .fillColor(darkColor)
      .text('Summary Metrics (Completed Orders)', 50, 135);

    // Draw KPI Boxes
    const kpis = [
      { label: 'Total Revenue', value: `INR ${totalSalesAmount.toFixed(2)}` },
      { label: 'Orders Placed', value: `${totalOrdersCount}` },
      { label: 'Completed Orders', value: `${completedOrdersCount}` },
      { label: 'Avg Order Value', value: `INR ${avgOrderValue.toFixed(2)}` }
    ];

    const boxWidth = 115;
    const boxHeight = 50;
    const startY = 160;

    kpis.forEach((kpi, idx) => {
      const startX = 50 + idx * 130;
      doc
        .rect(startX, startY, boxWidth, boxHeight)
        .fill(lightGreyColor);

      doc
        .fillColor(darkColor)
        .fontSize(9)
        .font('Helvetica-Bold')
        .text(kpi.label, startX + 10, startY + 10);

      doc
        .fillColor(primaryColor)
        .fontSize(12)
        .font('Helvetica-Bold')
        .text(kpi.value, startX + 10, startY + 28);
    });

    // Daily breakdown table
    doc
      .fillColor(darkColor)
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Daily Performance (Last 7 Days)', 50, 240);

    let tableY = 265;
    
    // Draw table headers
    doc
      .rect(50, tableY, 510, 20)
      .fill(primaryColor);

    doc
      .fillColor('#FFFFFF')
      .fontSize(9)
      .font('Helvetica-Bold')
      .text('Date', 70, tableY + 6)
      .text('Orders Placed', 250, tableY + 6)
      .text('Revenue (INR)', 430, tableY + 6);

    tableY += 20;

    // Sort days chronologically
    const sortedDays = Object.keys(dailyStats).reverse();

    sortedDays.forEach((day, idx) => {
      const stats = dailyStats[day];
      // Alternate row backgrounds
      if (idx % 2 === 1) {
        doc.rect(50, tableY, 510, 20).fill(lightGreyColor);
      }

      doc
        .fillColor(darkColor)
        .fontSize(9)
        .font('Helvetica')
        .text(day, 70, tableY + 6)
        .text(`${stats.count}`, 250, tableY + 6)
        .text(`INR ${stats.sales.toFixed(2)}`, 430, tableY + 6);

      tableY += 20;
    });

    // Popular creations section
    doc
      .fillColor(darkColor)
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Top Weekly Best Sellers', 50, tableY + 30);

    tableY += 55;

    // Draw popular products table headers
    doc
      .rect(50, tableY, 510, 20)
      .fill(primaryColor);

    doc
      .fillColor('#FFFFFF')
      .fontSize(9)
      .font('Helvetica-Bold')
      .text('Product Name', 70, tableY + 6)
      .text('Price', 250, tableY + 6)
      .text('Quantity Sold', 350, tableY + 6)
      .text('Total Sales (INR)', 450, tableY + 6);

    tableY += 20;

    if (popularProducts.length === 0) {
      doc
        .fillColor(greyColor)
        .fontSize(9)
        .font('Helvetica')
        .text('No sales data recorded this week.', 70, tableY + 6);
    } else {
      popularProducts.forEach((prod, idx) => {
        if (idx % 2 === 1) {
          doc.rect(50, tableY, 510, 20).fill(lightGreyColor);
        }

        doc
          .fillColor(darkColor)
          .fontSize(9)
          .font('Helvetica')
          .text(prod.name, 70, tableY + 6)
          .text(`INR ${prod.price.toFixed(2)}`, 250, tableY + 6)
          .text(`${prod.quantity}`, 350, tableY + 6)
          .text(`INR ${prod.total.toFixed(2)}`, 450, tableY + 6);

        tableY += 20;
      });
    }

    // Report Footer
    doc
      .moveTo(50, 720)
      .lineTo(560, 720)
      .strokeColor(primaryColor)
      .lineWidth(1)
      .stroke();

    doc
      .fillColor(greyColor)
      .fontSize(8)
      .font('Helvetica')
      .text('Report powered by 1312 Cafe Administrative Portal. Confidential.', 50, 730)
      .text('Page 1', 500, 730);

    // ----------------------------------------------------
    // PAGE 2+: WEEKLY ORDER HISTORY (LAST 7 DAYS)
    // ----------------------------------------------------
    doc.addPage();
    let currentPageNum = 2;
    
    // Draw Header Function
    const drawPageHeader = (pageNumber) => {
      doc
        .fillColor(darkColor)
        .fontSize(22)
        .font('Helvetica-Bold')
        .text(cafeName.toUpperCase(), 50, 50);

      doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor(greyColor)
        .text(address, 50, 75)
        .text(`Phone: ${phone} | ${email}`, 50, 90);

      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .fillColor(darkColor)
        .text('WEEKLY ORDER HISTORY', 320, 50, { align: 'right' });

      doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor(greyColor)
        .text(`Period: ${sevenDaysAgo.toLocaleDateString()} - ${today.toLocaleDateString()}`, 320, 70, { align: 'right' });

      doc
        .moveTo(50, 115)
        .lineTo(560, 115)
        .strokeColor(primaryColor)
        .lineWidth(2)
        .stroke();
        
      // Draw table header
      doc.rect(50, 130, 510, 20).fill(primaryColor);
      doc
        .fillColor('#FFFFFF')
        .fontSize(8)
        .font('Helvetica-Bold')
        .text('Order ID', 60, 136)
        .text('Date', 100, 136)
        .text('Customer Name', 180, 136)
        .text('Mobile Phone', 270, 136)
        .text('What They Ordered', 350, 136)
        .text('Total Bill', 490, 136);
    };

    // Draw Footer Function
    const drawPageFooter = (pageNumber) => {
      doc
        .moveTo(50, 720)
        .lineTo(560, 720)
        .strokeColor(primaryColor)
        .lineWidth(1)
        .stroke();
      doc
        .fillColor(greyColor)
        .fontSize(8)
        .font('Helvetica')
        .text('Report powered by 1312 Cafe Administrative Portal. Confidential.', 50, 730)
        .text(`Page ${pageNumber}`, 500, 730);
    };

    drawPageHeader(currentPageNum);

    let orderY = 155;
    
    if (orders.length === 0) {
      doc
        .fillColor(greyColor)
        .fontSize(10)
        .font('Helvetica')
        .text('No orders recorded in the past week.', 70, orderY + 15);
      drawPageFooter(currentPageNum);
    } else {
      orders.forEach((o, idx) => {
        const customerName = o.customer?.name || 'Walk-in';
        const customerPhone = o.customer?.phone || 'N/A';
        const itemsStr = o.items.map(i => `${i.product?.name || 'Item'} x${i.quantity}`).join(', ');
        const dateStr = new Date(o.createdAt).toLocaleDateString() + ' ' + new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        // Estimate height for wrapped items text (width: 135)
        doc.fontSize(7.5);
        const itemsHeight = doc.heightOfString(itemsStr, { width: 135 });
        const rowHeight = Math.max(25, itemsHeight + 10);

        // Check page boundary
        if (orderY + rowHeight > 700) {
          drawPageFooter(currentPageNum);
          doc.addPage();
          currentPageNum++;
          drawPageHeader(currentPageNum);
          orderY = 155;
        }

        // Draw background for alternate rows
        if (idx % 2 === 1) {
          doc.rect(50, orderY, 510, rowHeight).fill(lightGreyColor);
        }

        doc
          .fillColor(darkColor)
          .fontSize(7.5)
          .font('Helvetica')
          .text(`#${o.id}`, 60, orderY + 6)
          .text(dateStr, 100, orderY + 6, { width: 75 })
          .text(customerName, 180, orderY + 6, { width: 85 })
          .text(customerPhone, 270, orderY + 6, { width: 75 })
          .text(itemsStr, 350, orderY + 6, { width: 135 })
          .text(`INR ${o.totalAmount.toFixed(2)}`, 490, orderY + 6);

        orderY += rowHeight;
      });
      
      drawPageFooter(currentPageNum);
    }
    
    // Finalize the PDF Document
    doc.end();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDashboardStats,
  getSalesReports,
  downloadWeeklyPDF,
};
