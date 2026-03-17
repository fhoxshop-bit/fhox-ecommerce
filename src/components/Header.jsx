import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useAuthModal } from '../context/AuthModalContext'
import { getLogoUrl } from '../utils/cloudinaryImageService'

export default function Header(){
  const navigate = useNavigate();
  const { getTotalItems, openCart } = useCart();
  const { user, logout, isLoggedIn } = useAuth();
  const { openAuthModal } = useAuthModal();
  const totalItems = getTotalItems();
  const [wishlistCount, setWishlistCount] = React.useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const items = [
    {label:'Home', to:'/'},
    {label:'Collection', to:'/collection'},
    {label:'Reviews', to:'/reviews'},
    {label:'About Us', to:'/about'},
    {label:'Connect', to:'/connect'},
  ];

  // if user is logged in, show orders link
  if (isLoggedIn()) {
    items.push({ label: 'My Orders', to: '/orders' });
    items.push({ label: '🎟️ My Coupons', to: '/my-coupons' });
  }

  React.useEffect(() => {
    const update = () => {
      let list = [];
      
      if (isLoggedIn() && user) {
        // Load user's wishlist
        const savedWishlist = localStorage.getItem(`wishlist_${user.id}`);
        if (savedWishlist) {
          list = JSON.parse(savedWishlist);
        }
      } else {
        // Load guest wishlist (tab-specific)
        const guestWishlist = sessionStorage.getItem('guest_wishlist');
        if (guestWishlist) {
          list = JSON.parse(guestWishlist);
        }
      }
      
      if (!Array.isArray(list)) list = [];
      // convert values to string and remove empties/duplicates
      list = list.map(String)
                 .filter(id => id && id !== 'null' && id !== 'undefined')
                 .filter((v, i, a) => a.indexOf(v) === i);
      setWishlistCount(list.length);
    };
    
    update();
    window.addEventListener('wishlistUpdated', update);
    window.addEventListener('authChanged', update);
    return () => {
      window.removeEventListener('wishlistUpdated', update);
      window.removeEventListener('authChanged', update);
    };
  }, [isLoggedIn, user]);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const handleNavClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <div className="logo">
            <img src={getLogoUrl('fhox.png')} alt="FHOX" className="logo-img" />
          </div>

          {/* Desktop Navigation */}
          <nav className="center-nav">
            {items.map(({label,to}) => (
              <NavLink
                key={label}
                to={to}
                className={({isActive}) => isActive ? 'active' : ''}
              >
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Mobile Header - Right Side Actions */}
          {isLoggedIn() ? (
            <div className="mobile-header-right">
              <span className="mobile-username">👤 {user?.customerName?.split(' ')[0] || user?.email?.split('@')[0]}</span>
              <button 
                className="mobile-menu-btn"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                <span></span>
                <span></span>
                <span></span>
              </button>
              <button 
                className="mobile-logout-btn" 
                onClick={handleLogout}
                title="Logout"
              >
                ⏻
              </button>
            </div>
          ) : (
            <div className="mobile-header-right">
              <button 
                className="mobile-signup-btn"
                onClick={() => openAuthModal('signup')}
                title="Sign Up"
              >
                👤
              </button>
              <button 
                className="mobile-menu-btn"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                <span></span>
                <span></span>
                <span></span>
              </button>
            </div>
          )}

          <div className="actions right-actions">
            <NavLink to="/wishlist" className="wishlist-icon-btn" title="My Wishlist">
              ❤️
              {wishlistCount > 0 && <span className="wishlist-badge">{wishlistCount}</span>}
            </NavLink>
            <button className="cart-icon-btn" onClick={openCart}>
              🛍️
              {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
            </button>
            {isLoggedIn() ? (
              <>
                <span className="user-info" style={{ color: '#fff', fontWeight: 'bold', fontSize: '16px' }}>
                  👤 {user?.customerName || user?.email}
                </span>
                <button className="linkish" onClick={handleLogout}>Logout</button>
              </>
            ) : (
              <>
                <button className="linkish" onClick={() => openAuthModal('login')}>Login</button>
                <button className="primary" onClick={() => openAuthModal('signup')}>Sign Up</button>
              </>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        <nav className={`mobile-nav ${mobileMenuOpen ? 'open' : ''}`}>
          {items.map(({label,to}) => (
            <NavLink
              key={label}
              to={to}
              className={({isActive}) => isActive ? 'active' : ''}
              onClick={handleNavClick}
            >
              {label}
            </NavLink>
          ))}
          <div className="mobile-nav-divider"></div>
          {!isLoggedIn() && (
            <>
              <button className="mobile-nav-btn login-btn" onClick={() => {openAuthModal('login'); handleNavClick();}}>
                Login
              </button>
              <button className="mobile-nav-btn signup-btn" onClick={() => {openAuthModal('signup'); handleNavClick();}}>
                Sign Up
              </button>
            </>
          )}
        </nav>
      </header>
    </>
  )
}
