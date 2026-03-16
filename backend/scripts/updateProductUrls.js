#!/usr/bin/env node
// backend/scripts/updateProductUrls.js
// Update products.json with Cloudinary URLs

const fs = require('fs')
const path = require('path')

const PRODUCTS_FILE = path.join(__dirname, '..', 'products.json')
const MAPPING_FILE = path.join(__dirname, '..', 'cloudinary-upload-mapping.json')
const CLOUDINARY_BASE = 'https://res.cloudinary.com/dmanbuay5/image/upload/fhox-ecommerce/products/'

// Read products
const products = JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf8'))

// Create mapping if it doesn't exist
let mapping = {}
if (fs.existsSync(MAPPING_FILE)) {
  const mappingData = JSON.parse(fs.readFileSync(MAPPING_FILE, 'utf8'))
  mappingData.forEach(item => {
    const filename = item.filename
    const url = item.cloudinaryUrl
    mapping[filename] = url
  })
}

let updated = 0

const updatedProducts = products.map(product => {
  if (product.imageUrl) {
    // If already a Cloudinary URL, skip
    if (product.imageUrl.includes('cloudinary.com')) {
      return product
    }
    
    // Extract filename from local path
    const filename = path.basename(product.imageUrl)
    
    // Use mapping if available, otherwise construct URL
    if (mapping[filename]) {
      product.imageUrl = mapping[filename]
    } else {
      product.imageUrl = CLOUDINARY_BASE + filename
    }
    updated++
  }
  return product
})

// Write back
fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(updatedProducts, null, 2), 'utf8')

console.log(`✅ Updated ${updated} product URLs to Cloudinary`)
console.log(`📄 products.json saved`)
