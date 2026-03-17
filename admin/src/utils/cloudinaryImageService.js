// admin/src/utils/cloudinaryImageService.js
// Load image URLs from Cloudinary for admin panel

// Logo/Brand images
export const LOGO_URLS = {
  'fhox.png': 'https://res.cloudinary.com/dmanbuay5/image/upload/v1000000000/fhox-ecommerce/logos/fhox.png',
  'fhoxxxx.png': 'https://res.cloudinary.com/dmanbuay5/image/upload/v1000000000/fhox-ecommerce/logos/fhoxxxx.png',
  'logo2.png': 'https://res.cloudinary.com/dmanbuay5/image/upload/v1000000000/fhox-ecommerce/logos/logo2.png',
}

// Sponsor logos
export const SPONSOR_LOGOS = {
  'eatfit.png': 'https://res.cloudinary.com/dmanbuay5/image/upload/v1000000000/fhox-ecommerce/sponsors/eatfit.png',
}

// Default fallback images
export const DEFAULT_IMAGES = {
  'apparel.png': 'https://res.cloudinary.com/dmanbuay5/image/upload/v1000000000/fhox-ecommerce/defaults/apparel.png',
}

/**
 * Get logo URL for a given logo filename
 * @param {string} filename - The logo filename
 * @returns {string} - The Cloudinary URL
 */
export const getLogoUrl = (filename) => {
  return LOGO_URLS[filename] || `/images/${filename}`
}

/**
 * Get sponsor logo URL
 * @param {string} filename - The sponsor logo filename
 * @returns {string} - The Cloudinary URL
 */
export const getSponsorLogoUrl = (filename) => {
  return SPONSOR_LOGOS[filename] || `/images/${filename}`
}

/**
 * Get default image URL
 * @param {string} filename - The default image filename
 * @returns {string} - The Cloudinary URL
 */
export const getDefaultImageUrl = (filename) => {
  return DEFAULT_IMAGES[filename] || `/images/${filename}`
}

export default {
  getLogoUrl,
  getSponsorLogoUrl,
  getDefaultImageUrl,
  LOGO_URLS,
  SPONSOR_LOGOS,
  DEFAULT_IMAGES
}
