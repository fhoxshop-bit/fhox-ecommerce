import React, { useState, useEffect, useRef } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './FlashDealsSlider.css';

export default function FlashDealsSlider() {
  const [flashDeals, setFlashDeals] = useState([]);
  const [products, setProducts] = useState([]);
  const [countdowns, setCountdowns] = useState({});
  const [loading, setLoading] = useState(true);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedFlashDeal, setSelectedFlashDeal] = useState(null);
  const [selectedSize, setSelectedSize] = useState('');
  const sliderRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const [dragScrollLeft, setDragScrollLeft] = useState(0);
  const navigate = useNavigate();
  const { addToCart } = useCart();

  useEffect(() => {
    fetchFlashDeals();
    fetchProducts();
  }, []);

  // Update countdowns every second
  useEffect(() => {
    const interval = setInterval(() => {
      updateCountdowns();
    }, 1000);
    return () => clearInterval(interval);
  }, [flashDeals]);

  const fetchFlashDeals = async () => {
    try {
      const res = await fetch('/api/flash-deals/active');
      const data = await res.json();
      setFlashDeals(data);
      initializeCountdowns(data);
    } catch (err) {
      console.error('Failed to fetch flash deals', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error('Failed to fetch products', err);
    }
  };

  const initializeCountdowns = (deals) => {
    const newCountdowns = {};
    deals.forEach(deal => {
      // Parse endTime properly - handle ISO strings
      let endTime;
      if (typeof deal.endTime === 'string') {
        endTime = new Date(deal.endTime).getTime();
      } else {
        endTime = deal.endTime;
      }
      const now = new Date().getTime();
      const diff = Math.max(0, endTime - now);
      newCountdowns[deal.id] = calculateTimeLeft(diff);
    });
    setCountdowns(newCountdowns);
  };

  const calculateTimeLeft = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const days = Math.floor(totalSeconds / (24 * 60 * 60));
    const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return { days, hours, minutes, seconds };
  };

  const updateCountdowns = () => {
    const now = new Date().getTime();
    const newCountdowns = {};

    flashDeals.forEach(deal => {
      // Parse endTime properly - handle ISO strings
      let endTime;
      if (typeof deal.endTime === 'string') {
        endTime = new Date(deal.endTime).getTime();
      } else {
        endTime = deal.endTime;
      }
      const diff = Math.max(0, endTime - now);
      newCountdowns[deal.id] = calculateTimeLeft(diff);
    });

    setCountdowns(newCountdowns);
  };

  const getProductDetails = (productId) => {
    return products.find(p => p.id === productId);
  };

  const openProductModal = (product, deal) => {
    setSelectedProduct(product);
    setSelectedFlashDeal(deal);
    setSelectedSize('');
    console.log('🔥 Opening modal for product:', product.id, 'with deal:', deal.id);
  };

  const closeProductModal = () => {
    setSelectedProduct(null);
    setSelectedFlashDeal(null);
    setSelectedSize('');
  };

  const handleAddToCart = () => {
    if (!selectedProduct || !selectedSize.trim()) {
      alert('❌ YOU MUST SELECT A SIZE FIRST!\n\nPlease choose S, M, L, XL, XXL, or XXXL');
      return;
    }

    let cartItem = { ...selectedProduct, size: selectedSize };
    
    if (selectedFlashDeal) {
      cartItem.flashDealId = selectedFlashDeal.id;
      cartItem.flashDealDiscount = selectedFlashDeal.discountPercent;
    }
    
    addToCart(cartItem);
    closeProductModal();
  };

  const handleViewProduct = (deal) => {
    // Navigate to product detail page with flash deal info
    navigate(`/productdetail/${deal.productId}?flashDealId=${deal.id}&flashDealDiscount=${deal.discountPercent}`);
  };

  const scroll = (direction) => {
    if (sliderRef.current) {
      const scrollAmount = 320;
      const newPosition = direction === 'left' 
        ? scrollPosition - scrollAmount 
        : scrollPosition + scrollAmount;
      
      sliderRef.current.scrollTo({
        left: newPosition,
        behavior: 'smooth'
      });
      setScrollPosition(newPosition);
    }
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart(e.clientX);
    if (sliderRef.current) {
      setDragScrollLeft(sliderRef.current.scrollLeft);
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !sliderRef.current) return;
    
    const walk = (e.clientX - dragStart) * 1.5;
    sliderRef.current.scrollLeft = dragScrollLeft - walk;
    setScrollPosition(dragScrollLeft - walk);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleCardClick = (product, deal, e) => {
    // Only open modal if the drag distance was minimal (actual click, not drag)
    const dragDistance = Math.abs(e.clientX - dragStart);
    if (dragDistance < 10) { // Less than 10px = click, not drag
      openProductModal(product, deal);
    }
  };

  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider) return;

    slider.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    slider.addEventListener('mouseleave', handleMouseUp);

    return () => {
      slider.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      slider.removeEventListener('mouseleave', handleMouseUp);
    };
  }, [isDragging, dragStart, dragScrollLeft]);

  if (loading) return null;
  if (flashDeals.length === 0) return null;

  const showNavButtons = flashDeals.length > 2;

  return (
    <div className="flash-deals-slider-section">
      <div className="slider-header">
        <div className="header-content">
          <h2>⚡ Lightning Deals</h2>
          <p>Exclusive offers available for limited time</p>
        </div>
      </div>

      <div className="slider-container" data-deals-count={flashDeals.length}>
        {showNavButtons && (
          <button 
            className="slider-nav-btn slider-nav-left"
            onClick={() => scroll('left')}
            aria-label="Scroll left"
          >
            <FiChevronLeft size={24} />
          </button>
        )}

        <div className="deals-slider-wrapper" ref={sliderRef}>
          {flashDeals.map((deal, index) => {
            const product = getProductDetails(deal.productId);
            const countdown = countdowns[deal.id];

            if (!product) return null;

            return (
              <div 
                key={deal.id} 
                className="slider-deal-card"
                onClick={(e) => handleCardClick(product, deal, e)}
                onMouseDown={handleMouseDown}
                style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
              >
                <div className="deal-image-container">
                  <div className="deal-image">
                    <img
                      src={product.imageUrl || product.image || '/images/apparel.png'}
                      alt={product.name}
                    />
                    <div className="deal-badge">{deal.discountPercent}% OFF</div>
                  </div>
                  <div className="deal-overlay"></div>
                  <p className="card-hint">Click to view details</p>
                </div>

                <div className="deal-info">
                  <h3 className="deal-product-name">{product.name}</h3>
                  <p className="deal-title">{deal.title}</p>

                  <div className="deal-prices">
                    {product.actualPrice && (
                      <span className="deal-original-price">₹{product.actualPrice}</span>
                    )}
                    <span className="deal-sale-price">₹{product.discountPrice || product.price}</span>
                  </div>

                  {countdown && (
                    <div className="timer-container">
                      <span className="timer-label">Ends in:</span>
                      <div className="timer-display">
                        {countdown.hours > 0 && (
                          <>
                            <span className="timer-value">{String(countdown.hours).padStart(2, '0')}</span>
                            <span className="timer-unit">h</span>
                          </>
                        )}
                        <span className="timer-value">{String(countdown.minutes).padStart(2, '0')}</span>
                        <span className="timer-unit">m</span>
                        <span className="timer-value">{String(countdown.seconds).padStart(2, '0')}</span>
                        <span className="timer-unit">s</span>
                      </div>
                    </div>
                  )}

                  <button
                    className="deal-buy-btn"
                    onClick={(e) => handleAddToCart(deal, e)}
                  >
                    Buy Now
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {showNavButtons && (
          <button 
            className="slider-nav-btn slider-nav-right"
            onClick={() => scroll('right')}
            aria-label="Scroll right"
          >
            <FiChevronRight size={24} />
          </button>
        )}
      </div>

      {/* Product Modal Overlay */}
      {selectedProduct && selectedFlashDeal && (
        <div className="product-modal-overlay" onClick={closeProductModal}>
          <div className="product-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-back-btn" onClick={closeProductModal}>← Back</button>
            
            <div className="modal-product-container">
              <div className="modal-product-image">
                <img src={selectedProduct.imageUrl || selectedProduct.image || '/images/apparel.png'} alt={selectedProduct.name} />
              </div>
              
              <div className="modal-product-info">
                <h2 className="modal-product-title">{selectedProduct.name}</h2>
                
                {/* Flash Deal Badge */}
                <div style={{background: '#ff6b35', color: 'white', padding: '10px 14px', borderRadius: '6px', display: 'inline-block', marginBottom: '16px', fontWeight: 'bold', fontSize: '16px'}}>
                  🔥 FLASH DEAL: {selectedFlashDeal.discountPercent}% OFF!
                </div>
                
                {/* Pricing Section */}
                <div style={{background: 'rgba(255, 107, 53, 0.1)', padding: '16px', borderRadius: '8px', marginBottom: '16px', border: '2px solid rgba(255, 107, 53, 0.3)'}}>
                  <div style={{marginBottom: '12px'}}>
                    <p style={{margin: '0 0 8px 0', color: '#aaa', fontSize: '12px', fontWeight: '600'}}>PRICING</p>
                    {selectedProduct.actualPrice && selectedProduct.discountPrice ? (
                      <div>
                        <div style={{marginBottom: '8px'}}>
                          <span style={{color: '#999', textDecoration: 'line-through', fontSize: '16px'}}>₹{selectedProduct.actualPrice}</span>
                          <span style={{background: '#dc143c', color: '#fff', padding: '2px 8px', borderRadius: '3px', fontSize: '12px', marginLeft: '8px', fontWeight: 'bold'}}>
                            {Math.round(((selectedProduct.actualPrice - selectedProduct.discountPrice) / selectedProduct.actualPrice) * 100)}% OFF
                          </span>
                        </div>
                        <div style={{marginBottom: '8px'}}>
                          <span style={{color: '#4ade80', fontSize: '18px', fontWeight: 'bold'}}>₹{selectedProduct.discountPrice}</span>
                          <span style={{color: '#aaa', fontSize: '12px', marginLeft: '8px'}}>Regular Price</span>
                        </div>
                        <div style={{borderTop: '1px solid rgba(255, 107, 53, 0.3)', paddingTop: '8px', marginTop: '8px'}}>
                          <span style={{color: '#ff6b35', fontSize: '16px', fontWeight: 'bold'}}>💥 Flash Price: ₹{Math.round(selectedProduct.discountPrice * (1 - selectedFlashDeal.discountPercent / 100))}</span>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <span style={{color: '#4ade80', fontSize: '18px', fontWeight: 'bold'}}>₹{selectedProduct.price}</span>
                        <span style={{color: '#ff6b35', fontSize: '14px', fontWeight: 'bold', marginLeft: '16px'}}>💥 Flash Price: ₹{Math.round(selectedProduct.price * (1 - selectedFlashDeal.discountPercent / 100))}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Description */}
                {selectedProduct.description && (
                  <div style={{marginBottom: '16px'}}>
                    <p style={{margin: '0 0 8px 0', color: '#aaa', fontSize: '12px', fontWeight: '600'}}>DESCRIPTION</p>
                    <p style={{margin: '0', color: 'rgba(255, 255, 255, 0.8)', lineHeight: '1.5', fontSize: '14px'}}>{selectedProduct.description}</p>
                  </div>
                )}
                
                {/* Availability */}
                <div style={{marginBottom: '16px'}}>
                  {selectedProduct.stock > 0 ? (
                    <span style={{background: 'rgba(74, 222, 128, 0.2)', padding: '8px 12px', borderRadius: '6px', color: '#4ade80', fontWeight: '600', display: 'inline-block'}}>
                      ✓ Product available
                    </span>
                  ) : (
                    <span style={{background: 'rgba(248, 113, 113, 0.2)', padding: '8px 12px', borderRadius: '6px', color: '#f87171', fontWeight: '600', display: 'inline-block'}}>
                      Out of stock
                    </span>
                  )}
                </div>
                
                {/* SIZE SELECTOR IN MODAL */}
                {selectedProduct.stock > 0 && (
                  <div style={{ margin: '20px 0', padding: '20px', backgroundColor: 'rgba(255, 107, 107, 0.2)', border: '3px solid #ff2b2b', borderRadius: '8px' }}>
                    <label style={{ display: 'block', fontSize: '16px', fontWeight: 'bold', color: '#fff', marginBottom: '15px', textAlign: 'center' }}>
                      📏 SELECT YOUR SIZE (REQUIRED):
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px', marginBottom: '12px' }}>
                      {['S', 'M', 'L', 'XL', 'XXL', 'XXXL'].map(size => {
                        const sizeStock = selectedProduct.sizeStock ? selectedProduct.sizeStock[size] : 0;
                        const isOutOfStock = sizeStock === 0 || sizeStock === undefined;
                        
                        return (
                          <button
                            key={size}
                            onClick={() => !isOutOfStock && setSelectedSize(size)}
                            disabled={isOutOfStock}
                            style={{
                              padding: '12px',
                              fontSize: '14px',
                              fontWeight: 'bold',
                              backgroundColor: selectedSize === size ? '#ff6b35' : isOutOfStock ? '#444' : '#333',
                              color: selectedSize === size ? '#fff' : isOutOfStock ? '#888' : '#fff',
                              border: selectedSize === size ? '3px solid #ff8c00' : isOutOfStock ? '1px solid #555' : '2px solid #666',
                              borderRadius: '6px',
                              cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                              transition: 'all 0.2s',
                              opacity: isOutOfStock ? 0.5 : 1
                            }}
                            title={isOutOfStock ? 'Out of stock' : ''}
                          >
                            {size}
                            {isOutOfStock && <div style={{fontSize: '10px', color: '#888'}}>sold</div>}
                          </button>
                        );
                      })}
                    </div>
                    {selectedSize && <p style={{color: '#4ade80', fontWeight: 'bold', textAlign: 'center'}}>✓ Size {selectedSize} selected</p>}
                  </div>
                )}
                
                {selectedProduct.stock > 0 && (
                  <button
                    onClick={handleAddToCart}
                    style={{
                      width: '100%',
                      padding: '14px',
                      backgroundColor: selectedSize ? '#ff6b35' : '#666',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      cursor: selectedSize ? 'pointer' : 'not-allowed',
                      transition: 'all 0.2s',
                      marginTop: '12px'
                    }}
                    disabled={!selectedSize}
                  >
                    {selectedSize ? '✓ Add to Cart' : '⚠️ Select Size First'}
                  </button>
                )}
                {selectedProduct.stock === 0 && (
                  <button style={{width: '100%', padding: '14px', backgroundColor: '#666', color: 'white', border: 'none', borderRadius: '6px', marginTop: '12px', cursor: 'not-allowed'}} disabled>
                    Out of Stock
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
