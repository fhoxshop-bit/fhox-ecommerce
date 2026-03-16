// API Configuration - Update this based on environment
// For local development: use localhost
// For Mileweb production: use your Mileweb domain

const isDevelopment = import.meta.env.DEV

export const API_BASE_URL = isDevelopment 
  ? 'http://localhost:5001'
  : 'https://yourdomain.mileweb.com' // Replace with your actual Mileweb domain

export default API_BASE_URL
