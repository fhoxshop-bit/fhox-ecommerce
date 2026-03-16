import React, { useState, useEffect } from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts'
import './Analytics.css'

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F']
const API_URL = 'http://localhost:5000/api/analytics'

export default function Analytics() {
  const [stats, setStats] = useState({
    revenueData: [],
    topProducts: [],
    categoryData: [],
    ordersData: [],
    orderStatus: [],
    userGrowth: [],
    topCustomers: [],
    overallStats: { totalRevenue: 0, totalOrders: 0, totalUsers: 0, totalProducts: 0 },
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAllAnalyticsData = async () => {
      try {
        const [
          revenueRes,
          topProductsRes,
          categoryRes,
          monthlyOrdersRes,
          orderStatusRes,
          userGrowthRes,
          topCustomersRes,
          overallStatsRes,
        ] = await Promise.all([
          fetch(`${API_URL}/revenue`),
          fetch(`${API_URL}/top-products`),
          fetch(`${API_URL}/categories`),
          fetch(`${API_URL}/monthly-orders`),
          fetch(`${API_URL}/order-status`),
          fetch(`${API_URL}/user-growth`),
          fetch(`${API_URL}/top-customers`),
          fetch(`${API_URL}/overall-stats`),
        ])

        const [
          revenueData,
          topProducts,
          categoryData,
          ordersData,
          orderStatus,
          userGrowth,
          topCustomers,
          overallStats,
        ] = await Promise.all([
          revenueRes.ok ? revenueRes.json() : [],
          topProductsRes.ok ? topProductsRes.json() : [],
          categoryRes.ok ? categoryRes.json() : [],
          monthlyOrdersRes.ok ? monthlyOrdersRes.json() : [],
          orderStatusRes.ok ? orderStatusRes.json() : [],
          userGrowthRes.ok ? userGrowthRes.json() : [],
          topCustomersRes.ok ? topCustomersRes.json() : [],
          overallStatsRes.ok ? overallStatsRes.json() : { totalRevenue: 0, totalOrders: 0, totalUsers: 0, totalProducts: 0 },
        ])

        setStats({
          revenueData: revenueData.length > 0 ? revenueData : getDefaultRevenueData(),
          topProducts: topProducts.length > 0 ? topProducts : getDefaultTopProducts(),
          categoryData: categoryData.length > 0 ? categoryData : getDefaultCategoryData(),
          ordersData: ordersData.length > 0 ? ordersData : getDefaultOrdersData(),
          orderStatus: orderStatus.length > 0 ? orderStatus : getDefaultOrderStatus(),
          userGrowth: userGrowth.length > 0 ? userGrowth : getDefaultUserGrowth(),
          topCustomers: topCustomers.length > 0 ? topCustomers : getDefaultTopCustomers(),
          overallStats,
        })
        setLoading(false)
      } catch (err) {
        console.error('Failed to fetch analytics data:', err)
        // Set default data on error
        setStats({
          revenueData: getDefaultRevenueData(),
          topProducts: getDefaultTopProducts(),
          categoryData: getDefaultCategoryData(),
          ordersData: getDefaultOrdersData(),
          orderStatus: getDefaultOrderStatus(),
          userGrowth: getDefaultUserGrowth(),
          topCustomers: getDefaultTopCustomers(),
          overallStats: { totalRevenue: 0, totalOrders: 0, totalUsers: 0, totalProducts: 0 },
        })
        setLoading(false)
      }
    }

    // Initial fetch
    fetchAllAnalyticsData()
    
    // Auto-refresh analytics data every 10 seconds to detect cancelled/returned orders
    const interval = setInterval(fetchAllAnalyticsData, 10000)
    
    return () => clearInterval(interval)
  }, [])

  // Default data fallbacks
  const getDefaultRevenueData = () => [
    { day: 'Mon', revenue: 0 },
    { day: 'Tue', revenue: 0 },
    { day: 'Wed', revenue: 0 },
    { day: 'Thu', revenue: 0 },
    { day: 'Fri', revenue: 0 },
    { day: 'Sat', revenue: 0 },
    { day: 'Sun', revenue: 0 },
  ]

  const getDefaultTopProducts = () => [
    { name: 'No products', sales: 0, price: 0 },
  ]

  const getDefaultCategoryData = () => [
    { name: 'No categories', value: 0 },
  ]

  const getDefaultOrdersData = () => [
    { month: 'Jan', orders: 0 },
    { month: 'Feb', orders: 0 },
    { month: 'Mar', orders: 0 },
    { month: 'Apr', orders: 0 },
    { month: 'May', orders: 0 },
    { month: 'Jun', orders: 0 },
  ]

  const getDefaultOrderStatus = () => [
    { name: 'No orders', value: 0 },
  ]

  const getDefaultUserGrowth = () => [
    { month: 'Jan', users: 0 },
    { month: 'Feb', users: 0 },
    { month: 'Mar', users: 0 },
    { month: 'Apr', users: 0 },
    { month: 'May', users: 0 },
    { month: 'Jun', users: 0 },
  ]

  const getDefaultTopCustomers = () => [
    { name: 'No customers', spent: 0 },
  ]

  if (loading) {
    return <div className="analytics-container">Loading analytics...</div>
  }

  return (
    <div className="analytics-container">
      <h1 className="analytics-title">📊 Analytics Dashboard</h1>

      {/* Overall Stats */}
      <div className="stats-summary">
        <div className="stat-box">
          <div className="stat-label">Total Revenue</div>
          <div className="stat-number">₹{stats.overallStats.totalRevenue?.toLocaleString('en-IN') || 0}</div>
        </div>
        <div className="stat-box">
          <div className="stat-label">Total Orders</div>
          <div className="stat-number">{stats.overallStats.totalOrders || 0}</div>
        </div>
        <div className="stat-box">
          <div className="stat-label">Total Users</div>
          <div className="stat-number">{stats.overallStats.totalUsers || 0}</div>
        </div>
        <div className="stat-box">
          <div className="stat-label">Total Products</div>
          <div className="stat-number">{stats.overallStats.totalProducts || 0}</div>
        </div>
      </div>

      {/* Revenue Trend */}
      <div className="chart-card">
        <h2>Revenue Trend (Last 30 Days)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={stats.revenueData}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FF6B6B" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#FF6B6B" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip formatter={(value) => `₹${value.toLocaleString('en-IN')}`} />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#FF6B6B"
              fillOpacity={1}
              fill="url(#colorRevenue)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="charts-grid">
        {/* Top Selling Products */}
        <div className="chart-card">
          <h2>Top Selling Products</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.topProducts}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="sales" fill="#4ECDC4" name="Units Sold" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category Distribution */}
        <div className="chart-card">
          <h2>Products by Category</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stats.categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {stats.categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="charts-grid">
        {/* Monthly Orders */}
        <div className="chart-card">
          <h2>Monthly Orders</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.ordersData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="orders" fill="#45B7D1" name="Orders" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Order Status */}
        <div className="chart-card">
          <h2>Order Status Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stats.orderStatus}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {stats.orderStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="charts-grid">
        {/* User Growth */}
        <div className="chart-card">
          <h2>User Growth (Cumulative)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.userGrowth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="users" stroke="#98D8C8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top Customers */}
        <div className="chart-card">
          <h2>Top Customers</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={stats.topCustomers}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 150, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={140} />
              <Tooltip formatter={(value) => `₹${value.toLocaleString('en-IN')}`} />
              <Legend />
              <Bar dataKey="spent" fill="#F7DC6F" name="Amount Spent" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
