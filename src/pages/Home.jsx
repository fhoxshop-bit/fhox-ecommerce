import React from 'react';
import Banner from '../components/Banner';
import FlashDealsSlider from '../components/FlashDealsSlider';
import Slider from '../components/Slider';
import BottomBanner from '../components/BottomBanner';
import HeroSection from '../components/HeroSection';
import { getVideoUrl } from '../utils/cloudinaryVideoService';

export default function Home() {
  return (
    <div className="home-page">
      {/* Section 1: Banner - 500px height */}
      <section className="home-banner-section">
        <Banner videoSrc={getVideoUrl('5899457-hd_1920_1080_24fps.mp4')} />
      </section>

      {/* Section 2: Tagline - Define Your Style */}
      <section className="home-tagline-section">
        <div className="collection-intro">
          <div>
            <h2 className="brand-tagline">✨ Define Your Style. Express Your Edge.</h2>
          </div>
        </div>
      </section>

      {/* Section 3: Men/Women Sliders */}
      <section className="home-sliders-section">
        <Slider />
      </section>

      {/* Section 4: Flash Deals Slider */}
      <section className="home-flash-slider-section">
        <FlashDealsSlider />
      </section>

      {/* Section 5: Bottom Banner */}
      <section className="home-bottom-banner-section">
        <BottomBanner />
      </section>

      {/* Section 6: Hero Section */}
      <section className="home-hero-section">
        <HeroSection />
      </section>
    </div>
  );
}
 