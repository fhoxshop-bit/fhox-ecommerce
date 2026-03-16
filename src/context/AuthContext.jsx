import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth from sessionStorage on mount
  useEffect(() => {
    const storedToken = sessionStorage.getItem('authToken');
    const storedUser = sessionStorage.getItem('authUser');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const signup = async (email, password, customerName) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password, customerName })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Signup failed');
      }

      // Store in sessionStorage for tab isolation
      sessionStorage.setItem('authToken', data.token);
      sessionStorage.setItem('authUser', JSON.stringify(data.user));
      
      setToken(data.token);
      setUser(data.user);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const login = async (email, password) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Store in sessionStorage for tab isolation
      sessionStorage.setItem('authToken', data.token);
      sessionStorage.setItem('authUser', JSON.stringify(data.user));
      
      setToken(data.token);
      setUser(data.user);
      
      // Restore user's cart and wishlist from localStorage
      const userCartKey = `cart_${data.user.id}`;
      const userWishlistKey = `wishlist_${data.user.id}`;
      
      const savedCart = localStorage.getItem(userCartKey);
      const savedWishlist = localStorage.getItem(userWishlistKey);
      
      if (savedCart) {
        localStorage.setItem(`cart_${data.user.id}`, savedCart);
        window.dispatchEvent(new Event('cartUpdated'));
      }
      
      if (savedWishlist) {
        localStorage.setItem(`wishlist_${data.user.id}`, savedWishlist);
        window.dispatchEvent(new Event('wishlistUpdated'));
      }
      
      // Notify auth change
      window.dispatchEvent(new Event('authChanged'));
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    // Clear auth tokens from sessionStorage
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('authUser');
    // Clear guest cart (guests shouldn't have it anyway)
    sessionStorage.removeItem('guest_cart');
    
    // NOTE: User's cart and wishlist stay in localStorage with user ID keys
    // They will be restored when user logs in again
    
    setToken(null);
    setUser(null);
    
    // Notify components to update
    window.dispatchEvent(new Event('authChanged'));
  };

  const isLoggedIn = () => {
    return !!user && !!token;
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      signup,
      login,
      logout,
      isLoggedIn
    }}>
      {children}
    </AuthContext.Provider>
  );
};
