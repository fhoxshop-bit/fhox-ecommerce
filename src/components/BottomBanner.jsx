import React from 'react'
import { getVideoUrl } from '../utils/cloudinaryVideoService'

export default function BottomBanner(){
  return (
    <div className="banner-video bottom-banner">
      <div className="video-wrap">
        <video autoPlay muted loop playsInline>
          <source src={getVideoUrl('7855750-uhd_3840_2160_25fps.mp4')} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div className="video-dark-overlay" />
      </div>
    </div>
  )
}
