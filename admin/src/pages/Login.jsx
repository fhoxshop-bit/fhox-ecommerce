import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiUser, FiLock } from 'react-icons/fi'
import './Login.css'

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      const resp = await fetch('http://localhost:5000/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })

      const data = await resp.json()

      if (!resp.ok) {
        setError(data.message || 'Login failed')
        setLoading(false)
        return
      }

      // Save token and admin info
      sessionStorage.setItem('adminAuthToken', data.token)
      sessionStorage.setItem('adminUsername', data.admin.username)
      sessionStorage.setItem('adminRole', data.admin.role)

      setLoading(false)
      onLogin()
      navigate('/')
    } catch (err) {
      console.error('Login error:', err)
      setError('Failed to connect to server')
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <img src="/images/fhoxxxx.png" alt="FHOX Logo" className="login-logo" />
          <h1>Admin Panel</h1>
          <p>Welcome Back</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="label">Username</label>
            <div className="input-wrapper">
              <FiUser size={18} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field"
                placeholder="admin"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="label">Password</label>
            <div className="input-wrapper">
              <FiLock size={18} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="btn btn-login" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>

      <div className="login-bg"></div>
    </div>
  )
}
