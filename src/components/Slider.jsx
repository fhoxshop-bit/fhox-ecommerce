import React, { useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getVideoUrl } from "../utils/cloudinaryVideoService";
import "./Slider.css";

const data = [
  { id: 1, title: "Men", video: "9710159-uhd_3840_2160_25fps.mp4", type: "video" },
  { id: 2, title: "Women", video: "7871216-uhd_4096_2160_25fps.mp4", type: "video" },
];

export default function Slider() {
  const navigate = useNavigate();

  const handleCategoryClick = (category) => {
    navigate(`/collection?category=${category}`);
  };

  return (
    <div className="full-slider-container">
      <div className="sliders-wrapper">
        {data.map((item) => (
          <div 
            key={item.id} 
            className="category-card"
            onClick={() => handleCategoryClick(item.title)}
          >
            <div className="card-image">
              {item.type === "video" ? (
                <video autoPlay muted loop playsInline>
                  <source src={getVideoUrl(item.video)} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              ) : (
                <img src={item.img} alt={item.title} />
              )}
              <div className="card-overlay"></div>
            </div>
            <div className="card-content">
              <h2 className="category-title">{item.title}</h2>
              <p className="category-subtitle">Explore Collection</p>
              <button className="cta-button">View {item.title}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
