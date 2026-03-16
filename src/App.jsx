import React, { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { CSSTransition, TransitionGroup } from 'react-transition-group'
import Layout from './components/Layout'

// page components
import Home from './pages/Home'
import About from './pages/About'
import Collection from './pages/Collection'
import Reviews from './pages/Reviews'
import Community from './pages/Community'
import MediaPrints from './pages/MediaPrints'
import Connect from './pages/Connect'
import Wishlist from './pages/Wishlist'
import Checkout from './pages/Checkout'
import Orders from './pages/Orders'
import OrderTracking from './pages/OrderTracking'
import Login from './pages/Login'
import Register from './pages/Register'
import MyCoupons from './pages/MyCoupons'

export default function App(){
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  // Scroll to top whenever the location changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  if (isAuthPage) {
    return (
      <Routes location={location}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    );
  }

  return (
    <Layout>
      <TransitionGroup className="route-transition-wrapper">
        <CSSTransition key={location.pathname} classNames="page" timeout={300}>
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/collection" element={<Collection />} />
            <Route path="/reviews" element={<Reviews />} />
            <Route path="/community" element={<Community />} />
            <Route path="/mediaprints" element={<MediaPrints />} />
            <Route path="/connect" element={<Connect />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/my-coupons" element={<MyCoupons />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/orders/:orderId" element={<OrderTracking />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </CSSTransition>
      </TransitionGroup>
    </Layout>
  )
}
