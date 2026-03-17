import React, { useState, useEffect } from 'react'
import { FiMenu, FiBell, FiLogOut } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { getLogoUrl } from '../utils/cloudinaryImageService'
import './Header.css'

export default function Header({ onMenuClick, onLogout }) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [token, setToken] = useState('')

  useEffect(() => {
    const savedToken = sessionStorage.getItem('adminAuthToken')
    if (savedToken) setToken(savedToken)
  }, [])

  // Fetch customer messages notifications
  const fetchNotifications = async () => {
    try {
      const messagesResponse = await fetch('http://localhost:5000/api/messages')
      
      if (!messagesResponse.ok) throw new Error('Failed to fetch')
      
      const messagesData = await messagesResponse.json()
      
      // Get unread messages only
      const unreadMessages = messagesData.filter(msg => msg.status === 'unread').map(msg => ({
        ...msg,
        notificationType: 'message',
        displayName: msg.name,
        displayText: msg.subject || 'New Message',
        displayIcon: '💬'
      }))
      
      const totalCount = unreadMessages.length
      
      setUnreadCount(totalCount)
      setNotifications(unreadMessages.slice(0, 10)) // Show 10 latest messages
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  useEffect(() => {
    fetchNotifications()

    // Poll for new messages every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)

    // listen for manual updates
    const handler = () => fetchNotifications()
    window.addEventListener('dataUpdated', handler)

    return () => {
      clearInterval(interval)
      window.removeEventListener('dataUpdated', handler)
    }
  }, [])

  const handleLogout = () => {
    onLogout()
    navigate('/')
  }

  const navigate = useNavigate()

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications)
  }

  return (
    <header className="header">
      <div className="header-left">
        <button className="menu-btn" onClick={onMenuClick}>
          <FiMenu size={24} />
        </button>
      </div>

      <div className="header-right">
        <div className="notification-container">
          <button 
            className="icon-btn notification-btn"
            onClick={handleNotificationClick}
            title="View notifications"
          >
            <FiBell size={20} />
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
            )}
          </button>

          {showNotifications && (
            <div className="notification-dropdown">
              <div className="notification-header">
                <h3>Notifications</h3>
                <button 
                  className="close-notif"
                  onClick={() => setShowNotifications(false)}
                >
                  ×
                </button>
              </div>

              {notifications.length === 0 ? (
                <div className="no-notifications">
                  <p>No new messages</p>
                </div>
              ) : (
                <div className="notification-list">
                  {notifications.map((notif) => (
                    <div
                      key={notif._id}
                      className="notification-item notification-message"
                    >
                      <div className="notif-avatar">
                        <span className="notif-icon">💬</span>
                      </div>
                      <div className="notif-content">
                        <strong>{notif.displayName}</strong>
                        <p>{notif.displayText}</p>
                        <small>{new Date(notif.createdAt).toLocaleDateString()}</small>
                        <button 
                          className="accept-order-btn message-btn"
                          onClick={() => {
                            navigate(`/messages`)
                            setShowNotifications(false)
                          }}
                        >
                          💬 View Message
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="notification-footer">
                <button onClick={() => { navigate('/messages'); setShowNotifications(false) }} className="view-all-btn">
                  View All Messages →
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="header-user">
          <div className="user-avatar-small">
            <img src={getLogoUrl('fhoxxxx.png')} alt="FHOX" className="header-logo" />
          </div>
          <span>Admin</span>
        </div>
        <button
          className="logout-btn"
          onClick={handleLogout}
          title="Logout"
        >
          <FiLogOut size={18} />
        </button>
      </div>
    </header>
  )
}
