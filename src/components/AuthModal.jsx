import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAuthModal } from '../context/AuthModalContext';
import { getLogoUrl } from '../utils/cloudinaryImageService';

export default function AuthModal() {
  const { showAuthModal, authModalMode, closeAuthModal } = useAuthModal();
  const { login, signup } = useAuth();
  const [mode, setMode] = useState(authModalMode);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    customerName: ''
  });
  const [error, setError] = useState('');

  React.useEffect(() => {
    setMode(authModalMode);
  }, [authModalMode]);

  if (!showAuthModal) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const result = await login(formData.email, formData.password);
        if (!result.success) {
          setError(result.error || 'Login failed');
        } else {
          closeAuthModal();
          setFormData({ email: '', password: '', confirmPassword: '', customerName: '' });
        }
      } else {
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }
        const result = await signup(formData.email, formData.password, formData.customerName);
        if (!result.success) {
          setError(result.error || 'Signup failed');
        } else {
          closeAuthModal();
          setFormData({ email: '', password: '', confirmPassword: '', customerName: '' });
        }
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setError('');
    setFormData({ email: '', password: '', confirmPassword: '', customerName: '' });
  };

  return (
    <div className="auth-modal-overlay" onClick={closeAuthModal}>
      <div className="auth-modal" onClick={e => e.stopPropagation()}>
        <button className="auth-close" onClick={closeAuthModal}>×</button>
        <div className="auth-left">
          <img src={getLogoUrl('fhox.png')} alt="Logo" className="auth-logo" />
          <h2>{mode === 'login' ? 'Login to your Account' : 'Create new Account'}</h2>
          <form onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <input
                type="text"
                placeholder="Full Name"
                name="customerName"
                value={formData.customerName}
                onChange={handleInputChange}
                required
              />
            )}
            <input
              type="email"
              placeholder="Please Enter Email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
            <input
              type="password"
              placeholder="Password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
            />
            {mode === 'signup' && (
              <input
                type="password"
                placeholder="Confirm Password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
              />
            )}
            {error && <div className="auth-error" style={{color: '#ff6b6b', fontSize: '14px', marginBottom: '10px'}}>{error}</div>}
            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? 'Processing...' : (mode === 'login' ? 'Login' : 'Sign Up')}
            </button>
          </form>
          <p style={{marginTop: '15px', textAlign: 'center', fontSize: '14px'}}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={toggleMode}
              style={{background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', textDecoration: 'underline', fontWeight: '600'}}
            >
              {mode === 'login' ? 'Sign Up' : 'Login'}
            </button>
          </p>
        </div>
        <div className="auth-right">
          <img src="\images\appa.png" alt="Appa" />
        </div>
      </div>
    </div>
  );
}
