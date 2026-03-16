import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './About.css';

const About = () => {
  const navigate = useNavigate();
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 2;
      
      // Handle video end - pause for 0.5 seconds before looping
      const handleVideoEnd = () => {
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.currentTime = 0;
            videoRef.current.play();
          }
        }, 500);
      };
      
      videoRef.current.addEventListener('ended', handleVideoEnd);
      
      return () => {
        if (videoRef.current) {
          videoRef.current.removeEventListener('ended', handleVideoEnd);
        }
      };
    }
  }, []);
  return (
    <div className="about-page">
      {/* Hero Banner Section */}
      <section className="about-banner">
        <div className="banner-overlay"></div>
        <video 
          ref={videoRef}
          className="banner-video" 
          autoPlay 
          muted 
          playsInline
        >
          <source src="/videos/Image_To_Video_Conversion.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </section>

      {/* Brand Story Section */}
      <section className="brand-story">
        <div className="container">
          <div className="section-header">
            <h2>Our Story</h2>
            <div className="header-underline"></div>
          </div>
          
          <div className="story-content">
            <p className="story-intro">
              FHOX is a <span className="highlight">fashion-forward clothing brand</span> created for individuals who believe in expressing their unique style and building confidence — through fashion and self-expression.
            </p>
            
            <p className="story-text">
              We design premium clothing for men and women who demand comfort, durability, and style in every moment. FHOX understands that fashion is more than just clothing — it's self-expression, confidence, and personal style.
            </p>
            
            <p className="story-text">
              That's why our apparel is crafted using <span className="highlight">high-quality, premium fabrics</span> that support comfort, versatility, and long-lasting elegance. Whether you're working, socializing, or making a statement, FHOX complements your lifestyle.
            </p>
          </div>
        </div>
      </section>

      {/* Design Philosophy Section */}
      <section className="design-philosophy">
        <div className="container">
          <div className="section-header">
            <h2>Design Philosophy</h2>
            <div className="header-underline"></div>
          </div>
          
          <div className="philosophy-content">
            <p className="philosophy-intro">
              Our designs blend <span className="highlight">modern aesthetics with timeless elegance</span>. From contemporary fits to confidence-boosting silhouettes, every piece is made to enhance your personal style while keeping you fashionable in any setting.
            </p>
            
            <div className="philosophy-grid">
              <div className="philosophy-card">
                <div className="card-icon">✨</div>
                <h3>Quality</h3>
                <p>Premium fabrics and craftsmanship that stand the test of time</p>
              </div>
              
              <div className="philosophy-card">
                <div className="card-icon">🎨</div>
                <h3>Style</h3>
                <p>Contemporary designs that express your unique personality</p>
              </div>
              
              <div className="philosophy-card">
                <div className="card-icon">👔</div>
                <h3>Versatility</h3>
                <p>Clothing that transitions seamlessly from casual to formal occasions</p>
              </div>
              
              <div className="philosophy-card">
                <div className="card-icon">💫</div>
                <h3>Confidence</h3>
                <p>Designs that boost your confidence and celebrate your individuality</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Commitment Section */}
      <section className="commitment">
        <div className="container">
          <div className="section-header">
            <h2>Our Commitment</h2>
            <div className="header-underline"></div>
          </div>
          
          <div className="commitment-grid">
            <div className="commitment-item">
              <div className="commitment-number">01</div>
              <h3>Superior Quality & Comfort</h3>
              <p>Every garment undergoes rigorous quality testing to ensure maximum comfort and durability for your everyday lifestyle</p>
            </div>
            
            <div className="commitment-item">
              <div className="commitment-number">02</div>
              <h3>Versatile Everyday Wear</h3>
              <p>Designed to transition effortlessly from casual outings to formal occasions, so you stay stylish throughout your day</p>
            </div>
            
            <div className="commitment-item">
              <div className="commitment-number">03</div>
              <h3>Confidence & Self-Expression</h3>
              <p>We celebrate individual style and promote self-expression, inclusivity, and confidence in our community</p>
            </div>
            
            <div className="commitment-item">
              <div className="commitment-number">04</div>
              <h3>Timeless Fashion Values</h3>
              <p>We support and champion the pursuit of personal style and the confidence that comes with expressing your true self</p>
            </div>
          </div>
        </div>
      </section>

      {/* Mindset Section */}
      <section className="mindset">
        <div className="container">
          <div className="mindset-content">
            <h2>FHOX is More Than a Brand</h2>
            <p className="mindset-subtitle">It's a Mindset of Style, Confidence, and Self-Expression</p>
            
            <div className="mindset-text">
              <p>
                We believe that fashion is a powerful form of self-expression. Every outfit tells a story, every choice reflects your personality. 
                FHOX is for those who understand that style isn't just about clothing — it's about confidence, individuality, and making a statement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tagline Section */}
      <section className="tagline-section">
        <div className="tagline-content">
          <h3 className="tagline-primary">Dress Smart</h3>
          <h3 className="tagline-secondary">Dress Bold</h3>
          <h3 className="tagline-tertiary">Dress with FHOX</h3>
        </div>
      </section>

      {/* Why Choose FHOX Section */}
      <section className="why-choose">
        <div className="container">
          <div className="section-header">
            <h2>Why Choose FHOX?</h2>
            <div className="header-underline"></div>
          </div>

          <div className="why-grid">
            <div className="why-item">
              <div className="why-icon">🏆</div>
              <h3>Premium Quality</h3>
              <p>Only the finest materials and expert craftsmanship in every piece</p>
            </div>

            <div className="why-item">
              <div className="why-icon">💰</div>
              <h3>Affordable Luxury</h3>
              <p>High-end fashion at prices that won't break your budget</p>
            </div>

            <div className="why-item">
              <div className="why-icon">🚚</div>
              <h3>Fast Delivery</h3>
              <p>Quick and reliable shipping to get your orders to you fast</p>
            </div>

            <div className="why-item">
              <div className="why-icon">🔄</div>
              <h3>Easy Returns</h3>
              <p>Hassle-free returns and exchanges within 30 days</p>
            </div>

            <div className="why-item">
              <div className="why-icon">👥</div>
              <h3>24/7 Support</h3>
              <p>Our customer service team is always here to help</p>
            </div>

            <div className="why-item">
              <div className="why-icon">🌟</div>
              <h3>Trend Setting</h3>
              <p>Stay ahead of fashion trends with our latest collections</p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values Section */}
      <section className="values">
        <div className="container">
          <div className="section-header">
            <h2>Our Values</h2>
            <div className="header-underline"></div>
          </div>

          <div className="values-content">
            <div className="value-item">
              <h3>Inclusivity</h3>
              <p>Fashion for everyone, celebrating all body types, styles, and backgrounds</p>
            </div>

            <div className="value-item">
              <h3>Sustainability</h3>
              <p>Committed to eco-friendly practices and ethical manufacturing</p>
            </div>

            <div className="value-item">
              <h3>Innovation</h3>
              <p>Constantly pushing boundaries with new designs and technologies</p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="about-cta">
        <div className="container">
          <h2>Ready to Elevate Your Style?</h2>
          <p>Discover our complete collection of premium clothing designed for confident individuals</p>
          <div className="cta-buttons">
            <button className="cta-button primary" onClick={() => navigate('/')}>Shop Now</button>
            <button className="cta-button secondary" onClick={() => navigate('/collection')}>View Collections</button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
