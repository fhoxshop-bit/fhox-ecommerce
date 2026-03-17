import React from 'react'
import { getVideoUrl } from '../utils/cloudinaryVideoService'

export default function Banner({ videoSrc }){
  // allow pages to pass custom video path, default to original
  const src = videoSrc || getVideoUrl('6214743-uhd_4096_2160_25fps.mp4');
  return (
    <div className="banner-video">
      <div className="video-wrap">
        <video autoPlay muted loop playsInline>
          <source src={src} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div className="video-dark-overlay" />
      </div>
    </div>
  )
}
