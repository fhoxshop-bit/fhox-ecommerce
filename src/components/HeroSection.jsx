import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function HeroSection() {
  const navigate = useNavigate();
  const [productCount, setProductCount] = useState(0);
  const [customerCount, setCustomerCount] = useState(0);
  const [displayProductCount, setDisplayProductCount] = useState(0);
  const [displayCustomerCount, setDisplayCustomerCount] = useState(0);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fixed stats: 100+ products, 1000+ happy customers
      const totalProducts = 100;
      const uniqueCustomers = 1000;
      
      setProductCount(totalProducts);
      setCustomerCount(uniqueCustomers);

      // Animate numbers quickly (1 second)
      animateNumber(totalProducts, setDisplayProductCount, 1000);
      animateNumber(uniqueCustomers, setDisplayCustomerCount, 1000);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
      // Fallback values
      setProductCount(100);
      setCustomerCount(1000);
      animateNumber(100, setDisplayProductCount, 1000);
      animateNumber(1000, setDisplayCustomerCount, 1000);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0+$/, '') + 'k';
    }
    return num.toString();
  };

  const animateNumber = (target, setter, duration) => {
    let start = 0;
    const increment = target / (duration / 50);
    const interval = setInterval(() => {
      start += increment;
      if (start >= target) {
        setter(target);
        clearInterval(interval);
      } else {
        setter(Math.floor(start));
      }
    }, 50);
  };

  const handleExploreNow = () => {
    navigate('/collection');
  };

  return (
    <div className="hero-section">
      <div className="hero-video">
        <video autoPlay muted loop playsInline>
          <source src="\videos\5789981-hd_1920_1080_30fps.mp4" type="video/mp4" />
        </video>
      </div>
      <div className="hero-content">
        <div className="hero-tag">PREMIUM COLLECTION</div>
        <h2 className="hero-title">FASHION FORWARD</h2>
        <p className="hero-subtitle">Express yourself with confidence.</p>
        <p className="hero-description">
          Discover our exclusive collection of premium clothing and activewear designed for modern trendsetters. From casual comfort to bold statement pieces, FHOX delivers quality and style for every occasion and every personality.
        </p>
        <div className="hero-stats">
          <div className="stat-item">
            <div className="stat-number">{formatNumber(displayProductCount)}+</div>
            <div className="stat-label">Products</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">{formatNumber(displayCustomerCount)}+</div>
            <div className="stat-label">Happy Customers</div>
          </div>
        </div>
        <button className="hero-button" onClick={handleExploreNow}>EXPLORE NOW</button>
      </div>
    </div>
  );
}
