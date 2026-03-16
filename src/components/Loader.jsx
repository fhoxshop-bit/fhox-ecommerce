import React, { useEffect, useState, useRef } from 'react';
import './Loader.css';

export default function Loader({ onLoadComplete }) {
  const [isVisible, setIsVisible] = useState(true);
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 3;
    }

    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onLoadComplete) {
        onLoadComplete();
      }
    }, 3500);

    return () => clearTimeout(timer);
  }, [onLoadComplete]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="loader-container">
      <video
        ref={videoRef}
        className="loader-video"
        autoPlay
        muted
        playsInline
      >
        <source src="/videos/Image_To_Video_Conversion.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
