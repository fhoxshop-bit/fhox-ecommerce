import React from 'react';
import { getLogoUrl } from '../utils/cloudinaryImageService';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-left">
          <div className="footer-logo">
            <img src={getLogoUrl('logo2.png')} alt="FHOX Logo" />
          </div>
          <div className="footer-socials">
            <a href="#" className="social-icon" aria-label="Facebook">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 2h-3a6 6 0 0 0-6 6v3H7v4h3v8h4v-8h3l1-4h-4V8a2 2 0 0 1 2-2h1z"></path>
              </svg>
            </a>
            <a href="#" className="social-icon" aria-label="Instagram">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <circle cx="17.5" cy="6.5" r="1.5"></circle>
              </svg>
            </a>
            <a href="#" className="social-icon" aria-label="Twitter">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2s9 5 20 0a9.5 9.5 0 0 0-9-5.64"></path>
              </svg>
            </a>
            <a href="#" className="social-icon" aria-label="YouTube">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path>
                <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
              </svg>
            </a>
          </div>
        </div>

        <div className="footer-right">
          <div className="footer-column">
            <h4 className="footer-heading">NAVIGATION</h4>
            <ul className="footer-links">
              <li><a href="/">Home</a></li>
              <li><a href="/about">About Us</a></li>
              <li><a href="/collection">Collection</a></li>
              <li><a href="#">Terms & Conditions</a></li>
              <li><a href="#">Terms of Use</a></li>
            </ul>
          </div>

          <div className="footer-column">
            <h4 className="footer-heading">COLLECTIONS</h4>
            <ul className="footer-links">
              <li><a href="#">Featured</a></li>
            </ul>
          </div>

          <div className="footer-column">
            <h4 className="footer-heading">COMMUNITY</h4>
            <ul className="footer-links">
              <li><a href="#">Hub</a></li>
              <li><a href="#">Workouts</a></li>
              <li><a href="#">Podcasts</a></li>
              <li><a href="#">Community</a></li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
