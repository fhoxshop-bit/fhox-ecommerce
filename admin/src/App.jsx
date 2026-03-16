import React, { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Dashboard from './pages/Dashboard'
import Analytics from './pages/Analytics'
import Collections from './pages/Collections'
import ProductUpload from './pages/ProductUpload.jsx'
import Users from './pages/Users'
import Messages from './pages/Messages'
import Orders from './pages/Orders'
import Settings from './pages/Settings'
import CouponManagement from './pages/CouponManagement'
import FlashDeals from './pages/FlashDeals'
import Login from './pages/Login'
import './App.css'

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(sessionStorage.getItem('adminAuthToken') !== null)
  const [theme, setTheme] = useState(localStorage.getItem('adminTheme') || 'dark')

  const handleLogin = () => {
    setIsLoggedIn(true)
  }

  const handleLogout = () => {
    sessionStorage.removeItem('adminAuthToken')
    sessionStorage.removeItem('adminUsername')
    sessionStorage.removeItem('adminRole')
    setIsLoggedIn(false)
  }

  const handleThemeChange = (newTheme) => {
    localStorage.setItem('adminTheme', newTheme)
    setTheme(newTheme)
    document.body.className = `theme-${newTheme}`
  }

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <div className={`admin-container theme-${theme}`}>
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className="admin-main">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} onLogout={handleLogout} />
        <div className="admin-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/collections" element={<Collections />} />
            <Route path="/upload" element={<ProductUpload />} />
            <Route path="/users" element={<Users />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/coupons" element={<CouponManagement />} />
            <Route path="/flash-deals" element={<FlashDeals />} />
            <Route path="/settings" element={<Settings theme={theme} onThemeChange={handleThemeChange} />} />
          </Routes>
        </div>
      </div>
    </div>
  )
}
