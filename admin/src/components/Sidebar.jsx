import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { FiHome, FiPackage, FiUpload, FiMail, FiSettings, FiShoppingCart, FiX, FiBarChart2, FiTag, FiZap } from 'react-icons/fi'
import './Sidebar.css'

export default function Sidebar({ open, setOpen }) {
  const location = useLocation()
  const [unreadCount, setUnreadCount] = useState(0)
  const [pendingOrders, setPendingOrders] = useState(0)
  const [token, setToken] = useState('')

  useEffect(() => {
    const savedToken = sessionStorage.getItem('adminAuthToken')
    if (savedToken) setToken(savedToken)
  }, [])

  // Fetch unread messages count
  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/messages')
      const data = await response.json()
      const unread = data.filter(msg => msg.status === 'unread').length
      setUnreadCount(unread)
    } catch (error) {
      console.error('Error fetching unread count:', error)
    }
  }

  // Fetch pending orders count
  const fetchPendingOrders = async () => {
    if (!token) return
    try {
      const response = await fetch('http://localhost:5000/api/orders', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      if (!response.ok) throw new Error('Failed to fetch orders')
      const data = await response.json()
      const pending = data.filter(order => order.orderStatus === 'pending').length
      setPendingOrders(pending)
    } catch (error) {
      console.error('Error fetching pending orders:', error)
    }
  }

  useEffect(() => {
    fetchUnreadCount()
    fetchPendingOrders()
    const interval = setInterval(() => {
      fetchUnreadCount()
      fetchPendingOrders()
    }, 10000)

    const handler = () => {
      fetchUnreadCount()
      fetchPendingOrders()
    }
    window.addEventListener('dataUpdated', handler)

    return () => {
      clearInterval(interval)
      window.removeEventListener('dataUpdated', handler)
    }
  }, [token])

  const navItems = [
    { path: '/', label: 'Dashboard', icon: FiHome },
    { path: '/analytics', label: 'Analytics', icon: FiBarChart2 },
    { path: '/collections', label: 'Collections', icon: FiPackage },
    { path: '/upload', label: 'Upload Product', icon: FiUpload },
    { path: '/orders', label: 'Orders', icon: FiShoppingCart, badge: pendingOrders },
    { path: '/messages', label: 'Customer Messages', icon: FiMail, badge: unreadCount },
    { path: '/coupons', label: '🎟️ Coupon Management', icon: FiTag },
    { path: '/flash-deals', label: '⚡ Flash Deals', icon: FiZap },
    { path: '/settings', label: 'Settings', icon: FiSettings },
  ]

  return (
    <>
      {open && <div className="sidebar-overlay" onClick={() => setOpen(false)} />}
      <aside className={`sidebar ${open ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="logo">
            <img src="/images/fhoxxxx.png" alt="FHOX Logo" className="logo-image" />
            <span>Admin</span>
          </div>
          <button className="close-btn" onClick={() => setOpen(false)}>
            <FiX />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setOpen(false)}
              >
                <div className="nav-item-content">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className={`nav-badge ${item.badge > 0 ? 'has-unread' : 'no-unread'}`}>
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </div>
              </Link>
            )
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="user-card">
            <div className="user-avatar">
              <img src="/images/fhoxxxx.png" alt="FHOX" className="avatar-logo" />
            </div>
            <div className="user-info">
              <p>Admin User</p>
              <span>Super Admin</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
