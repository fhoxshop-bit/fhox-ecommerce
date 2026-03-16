import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Register.css';

export default function Register() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  
  const handleBack = () => {
    navigate(-1);
  };
  const [formData, setFormData] = useState({
    customerName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!formData.customerName) {
      setError('Please enter your name');
      return;
    }

    setLoading(true);

    try {
      const result = await signup(formData.email, formData.password, formData.customerName);
      if (result.success) {
        setFormData({ customerName: '', email: '', password: '', confirmPassword: '' });
        navigate('/');
      } else {
        setError(result.error || 'Registration failed');
      }
    } catch (error) {
      setError(error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <button className="back-btn" onClick={handleBack}>← Back</button>
      <div className="register-container">
        <div className="register-form-section">
            <h2>Register</h2>
            <p className="register-subtitle">Join India's biggest clothing community</p>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit} className="register-form">
              <div className="form-group">
                <input
                  type="text"
                  name="customerName"
                  placeholder="Full Name"
                  value={formData.customerName}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              <button type="submit" className="register-btn" disabled={loading}>
                {loading ? 'Registering...' : 'Register'}
              </button>
            </form>

            <p className="login-link">
              Already have an account?{' '}
              <a href="#login" onClick={() => navigate('/login')}>
                Click here to Login
              </a>
            </p>
          </div>
      </div>
    </div>
  );
}
