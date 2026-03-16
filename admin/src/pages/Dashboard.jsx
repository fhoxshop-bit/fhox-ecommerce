import React, { useState, useEffect } from 'react'
import { FiShoppingBag, FiUsers, FiTrendingUp, FiUploadCloud } from 'react-icons/fi'
import './Dashboard.css'

import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalUsers: 0,
    revenue: 0,
  })
  const [recent, setRecent] = useState([]) // recent activity items with actual timestamps
  const [recentData, setRecentData] = useState([]) // store raw data with actual timestamps

  // Format time display functions
  const formatTimeAgo = (date) => {
    const now = new Date()
    const diff = Math.floor((now - new Date(date)) / 1000) // difference in seconds
    
    if (diff < 60) return 'just now'
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`
    if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`
    return new Date(date).toLocaleDateString()
  }

  // Fetch data function
  const fetchDashboardData = async () => {
    try {
      const [products, users, orders] = await Promise.all([
        fetch('/api/products').then(r => r.json()),
        fetch('/api/users').then(r => r.ok ? r.json() : []),
        fetch('http://localhost:5000/api/orders').then(r => r.ok ? r.json() : []),
      ])
      
      const totalProducts = products.length
      const revenue = products.reduce((sum, p) => sum + (parseFloat(p.price) || 0), 0)

      // Get recent activities from orders (cancellations, returns, new orders)
      const recentActivities = []
      
      // Sort orders by creation date (newest first)
      const sortedOrders = [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      
      // Take last 3 activities
      sortedOrders.slice(0, 3).forEach(order => {
        let activityMsg = ''
        let icon = '📦'
        
        if (order.orderStatus === 'cancelled') {
          activityMsg = `Order #${order.orderId?.substring(0, 6)} cancelled - ₹${order.total}`
          icon = '❌'
        } else if (order.orderStatus === 'return_requested' || order.refund?.status === 'pending') {
          activityMsg = `Return requested for Order #${order.orderId?.substring(0, 6)} - ₹${order.total}`
          icon = '↩️'
        } else if (order.orderStatus === 'delivered') {
          activityMsg = `Order #${order.orderId?.substring(0, 6)} delivered - ₹${order.total}`
          icon = '✓'
        } else if (order.orderStatus === 'shipped') {
          activityMsg = `Order #${order.orderId?.substring(0, 6)} shipped`
          icon = '🚚'
        } else {
          activityMsg = `New order #${order.orderId?.substring(0, 6)} - ₹${order.total}`
          icon = '🛒'
        }
        
        recentActivities.push({
          msg: activityMsg,
          createdAt: order.createdAt,
          time: formatTimeAgo(order.createdAt),
          icon
        })
      })

      setStats({
        totalProducts,
        totalUsers: users.length || 0,
        revenue,
      })
      
      setRecentData(recentActivities)
      setRecent(recentActivities)
    } catch (err) {
      console.error('Failed to fetch dashboard stats', err)
      // fallback
      setStats({
        totalProducts: 24,
        totalUsers: 0,
        revenue: 12450,
      })
      setRecent([
        { msg: 'Black Denim Wear uploaded to Apparel', time: '2 hours ago', icon: '📌' },
        { msg: 'Sports Watch details updated', time: '4 hours ago', icon: '📌' },
        { msg: 'Theme settings modified', time: '1 day ago', icon: '📌' },
      ])
    }
  }

  useEffect(() => {
    // Initial fetch
    fetchDashboardData()
    
    // Refetch every 5 seconds for new orders/activities
    const dataInterval = setInterval(fetchDashboardData, 5000)
    
    // Update timestamp display every 10 seconds (min/hours ago updates)
    const timeInterval = setInterval(() => {
      if (recentData.length > 0) {
        setRecent(recentData.map(item => ({
          ...item,
          time: formatTimeAgo(item.createdAt)
        })))
      }
    }, 10000)
    
    return () => {
      clearInterval(dataInterval)
      clearInterval(timeInterval)
    }
  }, [recentData])

  const StatCard = ({ icon: Icon, label, value, gradient }) => (
    <div className={`stat-card gradient-${gradient}`}>
      <div className="stat-icon">
        <Icon size={28} />
      </div>
      <div className="stat-content">
        <p className="stat-label">{label}</p>
        <p className="stat-value">{value}</p>
      </div>
      <div className="stat-bar"></div>
    </div>
  )

  const RecentActivity = () => (
    <div className="card activity-card">
      <h3>Recent Activity</h3>
      <div className="activity-list">
        {recent.map((item, idx) => (
          <div key={idx} className="activity-item">
            <div className="activity-icon">{item.icon || '📌'}</div>
            <div className="activity-content">
              <p>{item.msg}</p>
              <span>{item.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const QuickActions = () => (
    <div className="card actions-card">
      <h3>Quick Actions</h3>
      <div className="actions-grid">
        <button className="action-btn" onClick={() => navigate('/upload')}>
          <FiUploadCloud size={24} />
          <span>Upload Product</span>
        </button>
        <button className="action-btn" onClick={() => navigate('/collections')}>
          <FiShoppingBag size={24} />
          <span>Manage Collections</span>
        </button>
        <button className="action-btn" onClick={() => navigate('/users')}>
          <FiUsers size={24} />
          <span>View Users</span>
        </button>
        <button className="action-btn" onClick={() => navigate('/analytics')}>
          <FiTrendingUp size={24} />
          <span>View Analytics</span>
        </button>
      </div>
    </div>
  )

  return (
    <div className="dashboard fade-in">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Welcome back! Here's your business overview.</p>
      </div>

      <div className="stats-grid">
        <StatCard
          icon={FiShoppingBag}
          label="Total Products"
          value={stats.totalProducts}
          gradient="blue"
        />
        <StatCard
          icon={FiUsers}
          label="Users"
          value={stats.totalUsers || 'N/A'}
          gradient="pink"
        />
        <StatCard
          icon={FiTrendingUp}
          label="Revenue"
          value={
            new Intl.NumberFormat('en-IN', {
              style: 'currency',
              currency: 'INR',
            }).format(stats.revenue)
          }
          gradient="orange"
        />
      </div>

      <div className="dashboard-grid">
        <RecentActivity />
        <QuickActions />
      </div>
    </div>
  )
}
