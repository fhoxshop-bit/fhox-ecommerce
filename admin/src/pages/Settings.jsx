import React, { useState, useEffect } from 'react'
import { FiSave, FiLock } from 'react-icons/fi'
import './Settings.css'

export default function Settings({ theme, onThemeChange }) {
  const [adminCredentials, setAdminCredentials] = useState({
    username: 'admin',
    password: '',
    confirmPassword: ''
  })
  const [globalCodEnabled, setGlobalCodEnabled] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedTheme, setSelectedTheme] = useState(theme)
  const [credentialMessage, setCredentialMessage] = useState('')
  const [credentialError, setCredentialError] = useState('')

  useEffect(() => {
    // Fetch global COD setting
    fetch('http://localhost:5000/api/settings/cod')
      .then(r => r.json())
      .then(data => setGlobalCodEnabled(data.globalCodEnabled))
      .catch(err => console.error('Error fetching COD setting:', err))
  }, [])

  const handleCredentialChange = (e) => {
    const { name, value } = e.target
    setAdminCredentials({ ...adminCredentials, [name]: value })
  }

  const handleUpdateCredentials = async () => {
    setCredentialError('')
    setCredentialMessage('')

    // Validation
    if (!adminCredentials.username.trim()) {
      setCredentialError('Username cannot be empty')
      return
    }

    if (adminCredentials.password && adminCredentials.password !== adminCredentials.confirmPassword) {
      setCredentialError('Passwords do not match')
      return
    }

    if (adminCredentials.password && adminCredentials.password.length < 6) {
      setCredentialError('Password must be at least 6 characters long')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('http://localhost:5000/api/auth/update-admin-credentials', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: adminCredentials.username,
          password: adminCredentials.password || undefined
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setCredentialError(data.message || 'Failed to update credentials')
        setSaving(false)
        return
      }

      setCredentialMessage('Admin credentials updated successfully!')
      setAdminCredentials({ ...adminCredentials, password: '', confirmPassword: '' })
      setSaving(false)

      // Clear message after 3 seconds
      setTimeout(() => setCredentialMessage(''), 3000)
    } catch (err) {
      console.error('Error updating credentials:', err)
      setCredentialError('Failed to update credentials. Please try again.')
      setSaving(false)
    }
  }

  const handleThemeSelect = (newTheme) => {
    setSelectedTheme(newTheme)
    onThemeChange(newTheme)
  }

  const handleSaveCOD = async () => {
    setSaving(true)
    try {
      const response = await fetch('http://localhost:5000/api/settings/cod', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ globalCodEnabled }),
      })
      if (!response.ok) throw new Error('Failed to save COD setting')
      setSaving(false)
      alert('Settings saved successfully!')
    } catch (err) {
      console.error('Error saving settings:', err)
      setSaving(false)
      alert('Failed to save settings')
    }
  }

  return (
    <div className="settings-page fade-in">
      <div className="settings-header">
        <h1>Settings</h1>
        <p>Manage your application settings</p>
      </div>

      <div className="settings-container">
        {/* Change Admin Credentials */}
        <div className="card settings-card">
          <div className="card-header">
            <h3>
              <FiLock size={20} style={{ marginRight: '10px' }} />
              Change Admin ID & Password
            </h3>
            <p className="card-desc">Update your admin credentials</p>
          </div>

          {credentialMessage && (
            <div className="success-message">
              ✓ {credentialMessage}
            </div>
          )}

          {credentialError && (
            <div className="error-message">
              ✕ {credentialError}
            </div>
          )}

          <div className="form-group">
            <label className="label">Admin Username</label>
            <input
              type="text"
              name="username"
              value={adminCredentials.username}
              onChange={handleCredentialChange}
              className="input-field"
              placeholder="Enter new username"
            />
          </div>

          <div className="form-group">
            <label className="label">New Password (Optional)</label>
            <input
              type="password"
              name="password"
              value={adminCredentials.password}
              onChange={handleCredentialChange}
              className="input-field"
              placeholder="Leave empty to keep current password"
            />
            <p className="field-hint">Leave empty if you don't want to change the password</p>
          </div>

          <div className="form-group">
            <label className="label">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={adminCredentials.confirmPassword}
              onChange={handleCredentialChange}
              className="input-field"
              placeholder="Confirm new password"
            />
          </div>

          <button 
            className="btn btn-primary" 
            onClick={handleUpdateCredentials}
            disabled={saving}
          >
            {saving ? 'Updating...' : (
              <>
                <FiSave size={18} />
                Update Credentials
              </>
            )}
          </button>
        </div>

        {/* Payment Settings */}
        <div className="card settings-card">
          <h3>Payment Settings</h3>
          <p className="card-desc">Configure payment methods for your store</p>
          
          <div className="form-group">
            <label className="label-checkbox">
              <input
                type="checkbox"
                checked={globalCodEnabled}
                onChange={(e) => setGlobalCodEnabled(e.target.checked)}
              />
              <span className="checkbox-text">Enable Cash on Delivery (COD) Globally</span>
            </label>
            <p className="label-desc">
              {globalCodEnabled 
                ? '✓ COD is enabled globally. Individual products can still disable it.'
                : '✗ COD is disabled globally. No products will accept COD payments.'}
            </p>
          </div>

          <button 
            className="btn btn-primary" 
            onClick={handleSaveCOD}
            disabled={saving}
          >
            {saving ? 'Saving...' : (
              <>
                <FiSave size={18} />
                Save Settings
              </>
            )}
          </button>
        </div>

        {/* Theme Settings */}
        <div className="card settings-card">
          <h3>Theme Settings</h3>
          <p className="card-desc">Customize the look and feel of your platform</p>
          
          <div className="theme-options">
            <div 
              className={`theme-option ${selectedTheme === 'dark' ? 'selected' : ''}`}
              onClick={() => handleThemeSelect('dark')}
            >
              <div className="theme-preview dark"></div>
              <span>Dark Mode</span>
            </div>
            <div 
              className={`theme-option ${selectedTheme === 'light' ? 'selected' : ''}`}
              onClick={() => handleThemeSelect('light')}
            >
              <div className="theme-preview light"></div>
              <span>Light Mode</span>
            </div>
            <div 
              className={`theme-option ${selectedTheme === 'gradient' ? 'selected' : ''}`}
              onClick={() => handleThemeSelect('gradient')}
            >
              <div className="theme-preview gradient"></div>
              <span>Gradient</span>
            </div>
          </div>
          <p className="theme-applied">✓ Theme: <strong>{selectedTheme.toUpperCase()}</strong></p>
        </div>

        {/* About Section */}
        <div className="card settings-card">
          <h3>About FHOX Admin</h3>
          <div className="about-content">
            <p>Version: <strong>1.0.0</strong></p>
            <p>Last Updated: <strong>March 12, 2026</strong></p>
            <p>Status: <strong><span className="badge badge-success">Active</span></strong></p>
          </div>
        </div>
      </div>
    </div>
  )
}
