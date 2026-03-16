#!/usr/bin/env node
// backend/scripts/uploadToCloudinary.js
// Upload all existing product images to Cloudinary

require('dotenv').config()
const cloudinary = require('cloudinary').v2
const fs = require('fs')
const path = require('path')

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

async function uploadImages() {
  const uploadsDir = path.join(__dirname, '..', 'uploads')
  
  if (!fs.existsSync(uploadsDir)) {
    console.log('❌ No uploads folder found')
    return
  }
  
  const files = fs.readdirSync(uploadsDir).filter(f => 
    /\.(jpg|jpeg|png|gif|webp|avif)$/i.test(f)
  )
  
  if (files.length === 0) {
    console.log('ℹ️  No image files to upload')
    return
  }
  
  console.log(`📤 Found ${files.length} images to upload...`)
  
  const uploadResults = []
  
  for (const file of files) {
    try {
      const result = await cloudinary.uploader.upload(
        path.join(uploadsDir, file),
        { 
          folder: 'fhox-ecommerce/products',
          resource_type: 'auto'
        }
      )
      uploadResults.push({
        filename: file,
        cloudinaryUrl: result.secure_url
      })
      console.log(`✅ ${file}`)
      console.log(`   → ${result.secure_url}`)
    } catch (err) {
      console.error(`❌ ${file}: ${err.message}`)
    }
  }
  
  // Save mapping for reference
  const mappingFile = path.join(__dirname, '..', 'cloudinary-upload-mapping.json')
  fs.writeFileSync(mappingFile, JSON.stringify(uploadResults, null, 2))
  console.log(`\n✅ Upload complete! Mapping saved to cloudinary-upload-mapping.json`)
}

uploadImages().catch(console.error)
