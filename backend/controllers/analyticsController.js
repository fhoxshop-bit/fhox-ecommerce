const Order = require('../models/Order');
const User = require('../models/User');
const { readProducts } = require('./productController');

// Get revenue data by date (last 30 days)
exports.getRevenueData = async (req, res) => {
  try {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    // Only include completed, delivered, and paid orders - exclude cancelled/returned orders
    const orders = await Order.find({
      createdAt: { $gte: thirtyDaysAgo },
      paymentStatus: { $in: ['paid', 'pending'] },
      orderStatus: { $nin: ['cancelled', 'return_requested'] } // Exclude cancelled and return requests
    }).sort({ createdAt: 1 });

    // Group by date
    const revenueMap = {};
    orders.forEach(order => {
      const date = new Date(order.createdAt).toLocaleDateString('en-IN', { month: 'short', day: '2-digit' });
      revenueMap[date] = (revenueMap[date] || 0) + order.total;
    });

    // Generate array for all dates in the range
    const revenueData = [];
    const currentDate = new Date(thirtyDaysAgo);
    
    while (currentDate <= today) {
      const dateString = currentDate.toLocaleDateString('en-IN', { month: 'short', day: '2-digit' });
      revenueData.push({
        day: dateString,
        revenue: Math.round(revenueMap[dateString] || 0),
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    res.json(revenueData);
  } catch (error) {
    console.error('Error fetching revenue data:', error);
    res.status(500).json({ error: 'Failed to fetch revenue data' });
  }
};

// Get top selling products
exports.getTopProducts = async (req, res) => {
  try {
    // Only count products from completed/delivered orders, exclude cancelled/returned
    const orders = await Order.find({
      orderStatus: { $nin: ['cancelled', 'return_requested'] }
    });

    // Count product sales
    const productMap = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        if (!productMap[item.productId]) {
          productMap[item.productId] = { name: item.name, sales: 0, price: item.price };
        }
        productMap[item.productId].sales += item.quantity;
      });
    });

    // Sort by sales and get top 5
    const topProducts = Object.values(productMap)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5)
      .map(p => ({
        name: p.name.substring(0, 15),
        sales: p.sales,
        price: p.price,
      }));

    res.json(topProducts);
  } catch (error) {
    console.error('Error fetching top products:', error);
    res.status(500).json({ error: 'Failed to fetch top products' });
  }
};

// Get product category distribution
exports.getCategoryData = async (req, res) => {
  try {
    const products = readProducts();

    // Group by category
    const categoryMap = {};
    products.forEach(p => {
      const cat = p.category || 'Others';
      categoryMap[cat] = (categoryMap[cat] || 0) + 1;
    });

    const categoryData = Object.entries(categoryMap).map(([name, value]) => ({
      name,
      value,
    }));

    res.json(categoryData);
  } catch (error) {
    console.error('Error fetching category data:', error);
    res.status(500).json({ error: 'Failed to fetch category data' });
  }
};

// Get monthly orders count
exports.getMonthlyOrders = async (req, res) => {
  try {
    // Only count valid orders, exclude cancelled and returned
    const orders = await Order.find({
      orderStatus: { $nin: ['cancelled', 'return_requested'] }
    });

    // Group by month
    const monthMap = {};
    orders.forEach(order => {
      const month = new Date(order.createdAt).toLocaleDateString('en-IN', { month: 'short' });
      monthMap[month] = (monthMap[month] || 0) + 1;
    });

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const ordersData = monthNames.map(month => ({
      month,
      orders: monthMap[month] || 0,
    }));

    res.json(ordersData);
  } catch (error) {
    console.error('Error fetching monthly orders:', error);
    res.status(500).json({ error: 'Failed to fetch monthly orders' });
  }
};

// Get order status distribution
exports.getOrderStatus = async (req, res) => {
  try {
    const orders = await Order.find();

    const statusMap = {
      completed: 0,
      pending: 0,
      shipped: 0,
      accepted: 0,
      cancelled: 0,
      return_requested: 0,
    };

    orders.forEach(order => {
      const status = order.orderStatus || 'pending';
      if (statusMap.hasOwnProperty(status)) {
        statusMap[status]++;
      }
    });

    const orderStatus = [
      { name: 'Completed', value: statusMap.completed },
      { name: 'Pending', value: statusMap.pending },
      { name: 'Accepted', value: statusMap.accepted },
      { name: 'Shipped', value: statusMap.shipped },
      { name: 'Cancelled', value: statusMap.cancelled },
      { name: 'Return Requested', value: statusMap.return_requested },
    ].filter(item => item.value > 0);

    res.json(orderStatus);
  } catch (error) {
    console.error('Error fetching order status:', error);
    res.status(500).json({ error: 'Failed to fetch order status' });
  }
};

// Get user growth (registration over time)
exports.getUserGrowth = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: 1 });

    // Group by month
    const monthMap = {};
    let cumulativeCount = 0;

    users.forEach(user => {
      const month = new Date(user.createdAt || Date.now()).toLocaleDateString('en-IN', { month: 'short' });
      monthMap[month] = (monthMap[month] || 0) + 1;
    });

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const userGrowth = monthNames.map(month => {
      cumulativeCount += monthMap[month] || 0;
      return {
        month,
        users: cumulativeCount,
      };
    });

    res.json(userGrowth);
  } catch (error) {
    console.error('Error fetching user growth:', error);
    res.status(500).json({ error: 'Failed to fetch user growth' });
  }
};

// Get top customers
exports.getTopCustomers = async (req, res) => {
  try {
    const orders = await Order.find().populate('user', 'customerName email');

    // Group by customer
    const customerMap = {};
    orders.forEach(order => {
      const customerId = order.user._id.toString();
      const customerName = order.user.customerName || 'Anonymous';
      if (!customerMap[customerId]) {
        customerMap[customerId] = { name: customerName, spent: 0 };
      }
      customerMap[customerId].spent += order.total;
    });

    // Sort by spent and get top 5
    const topCustomers = Object.values(customerMap)
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 5)
      .map(c => ({
        name: c.name.substring(0, 20),
        spent: Math.round(c.spent),
      }));

    res.json(topCustomers);
  } catch (error) {
    console.error('Error fetching top customers:', error);
    res.status(500).json({ error: 'Failed to fetch top customers' });
  }
};

// Get overall stats
exports.getOverallStats = async (req, res) => {
  try {
    const [orders, users, products] = await Promise.all([
      Order.find(),
      User.find(),
      readProducts(),
    ]);

    // Only count valid orders, exclude cancelled and returned
    const validOrders = orders.filter(o => !['cancelled', 'return_requested'].includes(o.orderStatus));

    const totalRevenue = validOrders
      .filter(o => o.paymentStatus === 'paid')
      .reduce((sum, o) => sum + o.total, 0);

    const totalOrders = validOrders.length;
    const totalUsers = users.length;
    const totalProducts = Array.isArray(products) ? products.length : 0;

    res.json({
      totalRevenue: Math.round(totalRevenue),
      totalOrders,
      totalUsers,
      totalProducts,
    });
  } catch (error) {
    console.error('Error fetching overall stats:', error);
    res.status(500).json({ error: 'Failed to fetch overall stats' });
  }
};
