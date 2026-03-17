import React, { useState } from 'react';
import { getVideoUrl } from '../utils/cloudinaryVideoService';
import './Connect.css';

const Connect = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const [expandedFAQ, setExpandedFAQ] = useState(null);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [newsletterMessage, setNewsletterMessage] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:5000/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        alert(result.message);
        setFormData({ name: '', email: '', subject: '', message: '' });
        window.dispatchEvent(new Event('dataUpdated'))
      } else {
        alert(result.message || 'Failed to send message. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Failed to send message. Please try again.');
    }
  };

  const toggleFAQ = (index) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newsletterEmail)) {
      setNewsletterMessage({ type: 'error', text: 'Please enter a valid email address.' });
      setTimeout(() => setNewsletterMessage(''), 4000);
      return;
    }

    setNewsletterLoading(true);
    setNewsletterMessage('');

    try {
      const response = await fetch('http://localhost:5000/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: newsletterEmail }),
      });

      const result = await response.json();

      if (result.success) {
        setNewsletterMessage({ type: 'success', text: result.message || 'Successfully subscribed!' });
        setNewsletterEmail('');
        window.dispatchEvent(new Event('dataUpdated'));
      } else {
        setNewsletterMessage({ type: 'error', text: result.message || 'Failed to subscribe. Please try again.' });
      }
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      setNewsletterMessage({ type: 'error', text: 'Failed to subscribe. Please try again.' });
    } finally {
      setNewsletterLoading(false);
      setTimeout(() => setNewsletterMessage(''), 4000);
    }
  };

  const faqData = [
    {
      question: "How do I track my order?",
      answer: "You can track your order by logging into your account and visiting the 'Orders' section. You'll find a tracking number and link to monitor your package's progress."
    },
    {
      question: "What is your return policy?",
      answer: "We offer a 30-day return policy for all items. Items must be in their original condition with tags attached. Return shipping costs may apply for certain items."
    },
    {
      question: "Do you offer international shipping?",
      answer: "Yes, we ship to most countries worldwide. Shipping costs and delivery times vary by location. You can check specific rates during checkout."
    },
    {
      question: "How do I care for my FHOX clothing?",
      answer: "Most of our items are machine washable. Check the care label on each garment for specific instructions. We recommend washing in cold water and hanging to dry to preserve quality."
    },
    {
      question: "Can I exchange an item for a different size?",
      answer: "Absolutely! Size exchanges are available within 30 days of purchase. Contact our customer service team to initiate an exchange."
    },
    {
      question: "Do you offer custom sizing or alterations?",
      answer: "Currently, we offer standard sizing. If you need alterations, we recommend consulting a professional tailor. We're working on expanding our size range."
    }
  ];

  return (
    <div className="connect-page">
      {/* Video Banner */}
      <div className="connect-video-banner">
        <video 
          className="banner-video" 
          autoPlay 
          loop 
          muted 
          playsInline
        >
          <source src={getVideoUrl('8865709-hd_1920_1080_25fps.mp4')} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        
        {/* Overlay for better text readability */}
        <div className="banner-overlay"></div>
        
        {/* Banner Content */}
        <div className="banner-content">
          <h1>Connect With Us</h1>
          <p>We're here to help you look and feel your best</p>
        </div>
      </div>

      {/* Contact Information Section */}
      <section className="contact-info">
        <div className="container">
          <div className="section-header">
            <h2>Get In Touch</h2>
            <div className="header-underline"></div>
          </div>

          <div className="contact-grid">
            <div className="contact-card">
              <div className="contact-icon">📧</div>
              <h3>Email Us</h3>
              <p>fhoxshop@gmail.com</p>
             
              <span className="response-time">Response within 24 hours</span>
            </div>

            <div className="contact-card">
              <div className="contact-icon">📞</div>
              <h3>Call Us</h3>
              <p>+1 (555) 123-4567</p>
              <p>+1 (555) 987-6543</p>
              <span className="response-time">Mon-Fri: 9AM-6PM EST</span>
            </div>

            <div className="contact-card">
              <div className="contact-icon">📍</div>
              <h3>Visit Us</h3>
              <p>123 Fashion Street</p>
              <p>New York, NY 10001</p>
              <span className="response-time">By appointment only</span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section">
        <div className="container">
          <div className="section-header">
            <h2>Frequently Asked Questions</h2>
            <div className="header-underline"></div>
          </div>

          <div className="faq-container">
            {faqData.map((faq, index) => (
              <div key={index} className="faq-item">
                <button
                  className={`faq-question ${expandedFAQ === index ? 'active' : ''}`}
                  onClick={() => toggleFAQ(index)}
                >
                  <span>{faq.question}</span>
                  <span className="faq-icon">{expandedFAQ === index ? '−' : '+'}</span>
                </button>
                <div className={`faq-answer ${expandedFAQ === index ? 'active' : ''}`}>
                  <p>{faq.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="contact-form-section">
        <div className="container">
          <div className="section-header">
            <h2>Send Us a Message</h2>
            <div className="header-underline"></div>
          </div>

          <div className="contact-form-container">
            <div className="form-info">
              <h3>Have a Question?</h3>
              <p>Fill out the form below and we'll get back to you as soon as possible. We're here to help with any questions about our products, orders, or services.</p>

              <div className="form-features">
                <div className="feature-item">
                  <span className="feature-icon">⚡</span>
                  <span>Quick Response</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">🔒</span>
                  <span>Secure & Private</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">💯</span>
                  <span>Expert Support</span>
                </div>
              </div>
            </div>

            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Full Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter your full name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter your email address"
                />
              </div>

              <div className="form-group">
                <label htmlFor="subject">Subject *</label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select a subject</option>
                  <option value="order">Order Inquiry</option>
                  <option value="product">Product Information</option>
                  <option value="returns">Returns & Exchanges</option>
                  <option value="shipping">Shipping Information</option>
                  <option value="feedback">Feedback</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="message">Message *</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  placeholder="Tell us how we can help you..."
                  rows="5"
                ></textarea>
              </div>

              <button type="submit" className="submit-btn">
                Send Message
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="newsletter-section">
        <div className="container">
          <div className="newsletter-content">
            <h2>Stay Connected</h2>
            <p>Subscribe to our newsletter for the latest updates, exclusive offers, and fashion tips.</p>
            <form className="newsletter-form" onSubmit={handleNewsletterSubmit}>
              <input 
                type="email" 
                placeholder="Enter your email address"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                required
                disabled={newsletterLoading}
              />
              <button 
                type="submit"
                disabled={newsletterLoading}
              >
                {newsletterLoading ? 'Subscribing...' : 'Subscribe'}
              </button>
            </form>
            {newsletterMessage && (
              <div className={`newsletter-message newsletter-message-${newsletterMessage.type}`}>
                {newsletterMessage.text}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Connect;

