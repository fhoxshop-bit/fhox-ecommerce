// Cloudinary Configuration for Admin Panel
// This file provides direct URLs for all assets displayed on live hosting

const CLOUDINARY_CONFIG = {
  cloudName: 'dmanbuay5',
  baseUrl: 'https://res.cloudinary.com/dmanbuay5'
}

// Your Cloudinary URLs structure:
// https://res.cloudinary.com/dmanbuay5/image/upload/v1234567890/fhox-ecommerce/products/imagename.jpg

export const CLOUDINARY = {
  // Product Images - New uploads go here automatically
  PRODUCTS_FOLDER: 'https://res.cloudinary.com/dmanbuay5/image/upload/fhox-ecommerce/products/',
  
  // Videos
  VIDEOS_FOLDER: 'https://res.cloudinary.com/dmanbuay5/video/upload/fhox-ecommerce/videos/',
  
  // Banners & Marketing
  BANNERS_FOLDER: 'https://res.cloudinary.com/dmanbuay5/image/upload/fhox-ecommerce/banners/',
  
  // Static brand assets
  BRAND_IMAGES: {
    logo: 'https://res.cloudinary.com/dmanbuay5/image/upload/fhox-ecommerce/brand/logo.png',
    favicon: 'https://res.cloudinary.com/dmanbuay5/image/upload/fhox-ecommerce/brand/favicon.ico',
  }
}

export default CLOUDINARY
