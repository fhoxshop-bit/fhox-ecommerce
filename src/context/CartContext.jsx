import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { isLoggedIn, user } = useAuth();

  useEffect(() => {
    const loadCart = () => {
      let savedCart = null;
      
      if (isLoggedIn() && user) {
        // Load user's saved cart
        savedCart = localStorage.getItem(`cart_${user.id}`);
      } else {
        // Load guest cart (tab-specific)
        savedCart = sessionStorage.getItem('guest_cart');
      }
      
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        
        // Ensure all cart items have size property (for backward compatibility)
        const migratedCart = parsedCart.map(item => ({
          ...item,
          size: item.size || 'Default' // Give old items a default size
        }));
        
        setCart(migratedCart);
        // Don't auto-open cart on page load - only open on explicit user action
        setIsCartOpen(false);
      } else {
        setCart([]);
        setIsCartOpen(false);
      }
    };

    loadCart();
    
    // Listen for auth changes
    const handleAuthChange = () => {
      loadCart();
    };
    
    window.addEventListener('authChanged', handleAuthChange);
    return () => window.removeEventListener('authChanged', handleAuthChange);
  }, [isLoggedIn, user]);

  useEffect(() => {
    if (isLoggedIn() && user) {
      // Save to user's localStorage
      localStorage.setItem(`cart_${user.id}`, JSON.stringify(cart));
    } else {
      // Save to guest sessionStorage (tab-specific)
      sessionStorage.setItem('guest_cart', JSON.stringify(cart));
    }
    
    // Notify other components about cart updates
    window.dispatchEvent(new Event('cartUpdated'));
  }, [cart, isLoggedIn, user]);

  const addToCart = (product) => {
    setCart(prevCart => {
      // Use both id and size to uniquely identify items
      const existingItem = prevCart.find(item => item.id === product.id && item.size === product.size);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id && item.size === product.size
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevCart, { ...product, quantity: 1 }];
      }
    });
    // Open cart when item is added
    setIsCartOpen(true);
  };

  const removeFromCart = (productId, size) => {
    setCart(prevCart => prevCart.filter(item => !(item.id === productId && item.size === size)));
  };

  const updateQuantity = (productId, quantity, size) => {
    if (quantity <= 0) {
      removeFromCart(productId, size);
      return;
    }
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === productId && item.size === size ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => {
      // Use discountPrice if available (with actualPrice), otherwise use price
      let itemPrice = (item.discountPrice && item.actualPrice) ? item.discountPrice : item.price;
      
      // Apply flash deal discount on top of the price
      if (item.flashDealDiscount) {
        itemPrice = itemPrice * (1 - item.flashDealDiscount / 100);
      }
      
      return total + (itemPrice * item.quantity);
    }, 0);
  };

  const getOrderSummary = () => {
    let subtotal = 0;
    let totalFlashDiscount = 0;
    let totalProductDiscount = 0;

    cart.forEach(item => {
      // Use discountPrice if available (with actualPrice), otherwise use price
      const basePrice = (item.discountPrice && item.actualPrice) ? item.discountPrice : item.price;
      const originalPrice = (item.discountPrice && item.actualPrice) ? item.actualPrice : item.price;
      let itemPrice = basePrice;
      
      // Calculate product discount (from actualPrice to discountPrice)
      if (item.discountPrice && item.actualPrice) {
        const productDiscountAmount = (item.actualPrice - item.discountPrice) * item.quantity;
        totalProductDiscount += productDiscountAmount;
      }
      
      // Apply flash deal discount on top
      if (item.flashDealDiscount) {
        const discountAmount = itemPrice * (item.flashDealDiscount / 100);
        totalFlashDiscount += discountAmount * item.quantity;
        itemPrice = itemPrice - discountAmount;
      }
      
      subtotal += itemPrice * item.quantity;
    });

    const shipping = subtotal * 0.05; // 5% shipping
    const tax = subtotal * 0.15; // 15% tax
    const total = subtotal + shipping + tax;
    
    return {
      subtotal,
      shipping,
      tax,
      total,
      flashDiscount: totalFlashDiscount,
      productDiscount: totalProductDiscount,
      originalSubtotal: subtotal + totalFlashDiscount + totalProductDiscount
    };
  };

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getTotalItems,
      getTotalPrice,
      getOrderSummary,
      isCartOpen,
      setIsCartOpen,
      openCart: () => setIsCartOpen(true),
      closeCart: () => setIsCartOpen(false)
    }}>
      {children}
    </CartContext.Provider>
  );
};