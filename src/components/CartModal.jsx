import React, { useEffect, useState } from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import './CartModal.css';

export default function CartModal() {
  const { 
    cart, 
    isCartOpen, 
    closeCart, 
    removeFromCart, 
    updateQuantity,
    addToCart,
    getTotalPrice 
  } = useCart();
  const navigate = useNavigate();
  const [editingItemId, setEditingItemId] = useState(null);
  const [editingItemSize, setEditingItemSize] = useState(null);
  const [newSize, setNewSize] = useState('');

  // Scroll to top when cart opens
  useEffect(() => {
    if (isCartOpen) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [isCartOpen]);

  const handleEditSize = (itemId, currentSize) => {
    setEditingItemId(itemId);
    setEditingItemSize(currentSize);
    setNewSize(currentSize);
  };

  const handleSaveSize = (itemId, oldSize) => {
    if (!newSize) {
      window.alert('❌ Please select a size!');
      return;
    }
    
    if (newSize === oldSize) {
      // Size didn't change, just close the editor
      setEditingItemId(null);
      setEditingItemSize(null);
      setNewSize('');
      return;
    }

    // Size changed - remove old and add with new size
    const item = cart.find(i => i.id === itemId && i.size === oldSize);
    if (item) {
      // Get the quantity to preserve it
      const quantity = item.quantity;
      
      // Remove the old item
      removeFromCart(itemId, oldSize);
      
      // Create new item with updated size and same quantity
      const updatedItem = { ...item, size: newSize, quantity: quantity };
      
      // Add the new item back
      for (let i = 0; i < quantity; i++) {
        addToCart({ ...item, size: newSize });
      }
      
      console.log(`✓ Size changed from ${oldSize} to ${newSize}!`);
    }
    
    setEditingItemId(null);
    setEditingItemSize(null);
    setNewSize('');
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
    setEditingItemSize(null);
    setNewSize('');
  };

  if (!isCartOpen) return null;

  return (
    <div className="cart-modal-overlay" onClick={closeCart}>
      <div className="cart-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cart-modal-header">
          <h2>Shopping Cart</h2>
          <button className="cart-close-btn" onClick={closeCart}>✕</button>
        </div>

        <div className="cart-modal-body">
          {cart.length === 0 ? (
            <div className="empty-cart">
              <p>Your cart is empty</p>
            </div>
          ) : (
            <>
              <div className="cart-edit-instructions">
                💡 <strong>Edit items:</strong> Use +/- to change quantity. Delete to remove or change size.
              </div>
              <div className="cart-items">
                {cart.map((item) => (
                  <div key={`${item.id}-${item.size}`} className="cart-item">
                    <img src={item.imageUrl || item.image || '/images/apparel.png'} alt={item.name} className="cart-item-image" />
                    
                    <div className="cart-item-details">
                      <h4 className="cart-item-name">{item.name}</h4>
                      <div className="cart-item-meta">
                        {editingItemId === item.id ? (
                          <div className="size-edit-controls">
                            <select 
                              value={newSize}
                              onChange={(e) => setNewSize(e.target.value)}
                              style={{
                                padding: '6px 10px',
                                borderRadius: '4px',
                                border: '2px solid #ff6b6b',
                                fontWeight: 'bold',
                                fontSize: '13px'
                              }}
                            >
                              <option value="">Select Size</option>
                              <option value="S">S</option>
                              <option value="M">M</option>
                              <option value="L">L</option>
                              <option value="XL">XL</option>
                              <option value="XXL">XXL</option>
                              <option value="XXXL">XXXL</option>
                            </select>
                            <button 
                              onClick={() => handleSaveSize(item.id, editingItemSize)}
                              style={{
                                padding: '6px 10px',
                                background: '#4ade80',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '4px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                marginLeft: '6px'
                              }}
                            >
                              ✓ Update
                            </button>
                            <button 
                              onClick={handleCancelEdit}
                              style={{
                                padding: '6px 10px',
                                background: '#ef4444',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '4px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                marginLeft: '4px'
                              }}
                            >
                              ✕ Cancel
                            </button>
                          </div>
                        ) : (
                          <>
                            <span 
                              className="cart-item-size"
                              onClick={() => handleEditSize(item.id, item.size)}
                              style={{
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                background: 'rgba(255, 107, 107, 0.2)',
                                border: '1px solid #ff6b6b',
                                transition: 'all 0.2s'
                              }}
                              title="Click to edit size"
                            >
                              Size: <strong>{item.size}</strong> ✏️
                            </span>
                            {(() => {
                              const basePrice = (item.discountPrice && item.actualPrice) ? item.discountPrice : item.price;
                              const finalPrice = basePrice * (1 - (item.flashDealDiscount || 0) / 100);
                              return (
                                <>
                                  {item.actualPrice && item.discountPrice && (
                                    <span className="cart-item-price" style={{color: '#4ade80', fontWeight: 'bold'}}>
                                      ₹{finalPrice.toFixed(2)}
                                      <span style={{color: '#999', marginLeft: '8px', textDecoration: 'line-through', fontSize: '0.9rem'}}>
                                        ₹{item.actualPrice}
                                      </span>
                                      {item.flashDealDiscount > 0 && (
                                        <span style={{color: '#ff6b35', marginLeft: '8px', fontWeight: 'bold'}}>
                                          🔥{item.flashDealDiscount}%
                                        </span>
                                      )}
                                    </span>
                                  )}
                                  {!(item.actualPrice && item.discountPrice) && (
                                    <span className="cart-item-price">
                                      ₹{finalPrice.toFixed(2)}
                                      {item.flashDealDiscount > 0 && (
                                        <span style={{color: '#ff6b35', marginLeft: '8px', fontWeight: 'bold'}}>
                                          🔥{item.flashDealDiscount}%
                                        </span>
                                      )}
                                    </span>
                                  )}
                                </>
                              );
                            })()}
                          </>
                        )}
                      </div>
                    </div>

                    <div className="cart-item-controls">
                      <button 
                        className="qty-btn qty-decrease"
                        onClick={() => updateQuantity(item.id, item.quantity - 1, item.size)}
                        title="Decrease quantity"
                      >
                        −
                      </button>
                      <span className="cart-qty">{item.quantity}</span>
                      <button 
                        className="qty-btn qty-increase"
                        onClick={() => updateQuantity(item.id, item.quantity + 1, item.size)}
                        title="Increase quantity"
                      >
                        +
                      </button>
                    </div>

                    <div className="cart-item-subtotal">
                      ₹{((() => {
                        const basePrice = (item.discountPrice && item.actualPrice) ? item.discountPrice : item.price;
                        return basePrice * (1 - (item.flashDealDiscount || 0) / 100) * item.quantity;
                      })()).toFixed(2)}
                    </div>

                    <button 
                      className="cart-remove-btn"
                      onClick={() => removeFromCart(item.id, item.size)}
                      title="Remove from cart"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {cart.length > 0 && (
          <div className="cart-modal-footer">
            <div className="cart-total">
              <span>Total:</span>
              <span className="total-price">₹{getTotalPrice().toFixed(2)}</span>
            </div>
            <button
              className="checkout-btn"
              onClick={() => {
                closeCart();
                navigate('/checkout');
              }}
            >
              Proceed to Checkout
            </button>
            <button className="continue-shopping-btn" onClick={closeCart}>
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
