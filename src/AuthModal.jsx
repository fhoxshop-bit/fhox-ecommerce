import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';

export default function AuthModal({ show, mode, onClose, onSwitch }) {
  const { login, signup } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    customerName: ''
  });

  if (!show) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const result = await login(formData.email, formData.password);
        if (result.success) {
          setFormData({ email: '', password: '', confirmPassword: '', customerName: '' });
          onClose();
        } else {
          setError(result.error || 'Login failed');
        }
      } else {
        // Signup
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }
        if (!formData.customerName) {
          setError('Please enter your name');
          setLoading(false);
          return;
        }
        const result = await signup(formData.email, formData.password, formData.customerName);
        if (result.success) {
          setFormData({ email: '', password: '', confirmPassword: '', customerName: '' });
          onClose();
        } else {
          setError(result.error || 'Signup failed');
        }
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSwitch = () => {
    setError('');
    setFormData({ email: '', password: '', confirmPassword: '', customerName: '' });
    if (onSwitch) onSwitch(mode === 'login' ? 'signup' : 'login');
  };

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={e => e.stopPropagation()}>
        <button className="auth-close" onClick={onClose}>&times;</button>
        <div className="auth-left">
          <h2>{mode === 'login' ? 'Login' : 'Sign Up'}</h2>
          <p>India's biggest clothing community</p>
          <form onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <input
                type="text"
                name="customerName"
                placeholder="Your Name"
                value={formData.customerName}
                onChange={handleChange}
                required
              />
            )}
            <input
              type="email"
              name="email"
              placeholder="Email or Mobile"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            {mode === 'signup' && (
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            )}
            {error && <p style={{ color: 'red', fontSize: '0.9em', margin: '10px 0' }}>{error}</p>}
            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? 'Please wait...' : (mode === 'login' ? 'Login' : 'Create Account')}
            </button>
          </form>
          <p>
            {mode === 'login' ? 'New to our community?' : 'Already registered?'}{' '}
            <button className="auth-switch" onClick={handleSwitch} type="button">
              {mode === 'login' ? 'Click here to Register' : 'Click here to Login'}
            </button>
          </p>
        </div>
        <div className="auth-right">
          {/* put your desired photo into public/images/login-photo.jpg and it will appear here */}
          <img
            src="\images\appa.png" /* fallback, replace with your own */
            alt="login"
            onError={e => {
              e.target.onerror = null;
              e.target.src = 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=60';
            }}
          />
        </div>
      </div>
    </div>
  );
}
