import React, { useState, useEffect } from 'react';
import Header from './Header';
// import SponsorSlider from './SponsorSlider';
import Footer from './Footer';
import CartModal from './CartModal';
import AuthModal from './AuthModal';
import Loader from './Loader';
import MobileBottomNav from './MobileBottomNav';

export default function Layout({ children }) {
  const [showLoader, setShowLoader] = useState(true);

  useEffect(() => {
    // Check if loader has been shown in this session
    const loaderShown = sessionStorage.getItem('loaderShown');
    if (loaderShown) {
      setShowLoader(false);
    } else {
      sessionStorage.setItem('loaderShown', 'true');
    }
  }, []);

  const handleLoaderComplete = () => {
    setShowLoader(false);
  };

  return (
    <>
      {showLoader && <Loader onLoadComplete={handleLoaderComplete} />}
      <Header />
      <div className="page-container">{children}</div>
      {/* <SponsorSlider /> */}
      <Footer />
      <CartModal />
      <AuthModal />
      <MobileBottomNav />
    </>
  );
}
