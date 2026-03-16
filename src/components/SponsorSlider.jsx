import React, { useRef, useState } from 'react';

export default function SponsorSlider() {
  const sponsorsData = [
    { id: 1, name: 'EATFIT', logo: '/images/eatfit.png' },
    { id: 2, name: 'MINDLER', logo: '/images/mindler.png' },
    { id: 3, name: 'MYNTRA', logo: '/images/myntra.png' },
    { id: 4, name: 'NOISE', logo: '/images/noise.png' },
    { id: 5, name: 'BOAT', logo: '/images/boat.png' },
  ];

  const sliderRef = useRef(null);
  const [isDown, setIsDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e) => {
    setIsDown(true);
    setStartX(e.pageX - sliderRef.current.offsetLeft);
    setScrollLeft(sliderRef.current.scrollLeft);
  };

  const handleMouseMove = (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - sliderRef.current.offsetLeft;
    const walk = (x - startX) * 0.5;
    sliderRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDown(false);
  };

  return (
    <div className="sponsor-section">
      <div className="sponsor-header">
        <span className="sponsor-tag">AFFILIATE BRANDS</span>
        <h2 className="sponsor-title">OUR PROUD PARTNERS</h2>
      </div>
      
      <div 
        className="sponsors-container"
        ref={sliderRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {sponsorsData.map((sponsor) => (
          <div key={sponsor.id} className="sponsor-item">
            <img src={sponsor.logo} alt={sponsor.name} />
          </div>
        ))}
      </div>
    </div>
  );
}
