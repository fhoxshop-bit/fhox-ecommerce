import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function MobileBottomNav() {
  const { getTotalItems, openCart } = useCart();
  const [wishlistCount, setWishlistCount] = React.useState(0);
  const totalItems = getTotalItems();

  React.useEffect(() => {
    const updateWishlist = () => {
      let list = [];
      
      const savedWishlist = localStorage.getItem('guest_wishlist');
      if (savedWishlist) {
        list = JSON.parse(savedWishlist);
      }
      
      if (!Array.isArray(list)) list = [];
      list = list.map(String)
                 .filter(id => id && id !== 'null' && id !== 'undefined')
                 .filter((v, i, a) => a.indexOf(v) === i);
      setWishlistCount(list.length);
    };
    
    updateWishlist();
    window.addEventListener('wishlistUpdated', updateWishlist);
    return () => {
      window.removeEventListener('wishlistUpdated', updateWishlist);
    };
  }, []);

  return (
    <nav className="mobile-bottom-nav">
      <NavLink to="/wishlist" className="nav-item wishlist-item">
        <span className="nav-icon">❤️</span>
        <span className="nav-label">Wishlist</span>
        {wishlistCount > 0 && <span className="nav-badge">{wishlistCount}</span>}
      </NavLink>

      <button className="nav-item cart-item" onClick={openCart}>
        <span className="nav-icon">🛍️</span>
        <span className="nav-label">Cart</span>
        {totalItems > 0 && <span className="nav-badge">{totalItems}</span>}
      </button>
    </nav>
  );
}
