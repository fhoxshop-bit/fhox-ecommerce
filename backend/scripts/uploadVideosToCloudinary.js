#!/usr/bin/env node
// backend/scripts/uploadVideosToCloudinary.js
// Upload all videos to Cloudinary before removing from git

require('dotenv').config()
const cloudinary = require('cloudinary').v2
const fs = require('fs')
const path = require('path')

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

async function uploadVideos() {
  const videosDir = path.join(__dirname, '..', '..', 'public', 'videos')
  
  if (!fs.existsSync(videosDir)) {
    console.log('❌ No videos folder found')
    return
  }
  
  const files = fs.readdirSync(videosDir).filter(f => 
    /\.(mp4|mov|avi|webm|mkv)$/i.test(f)
  )
  
  if (files.length === 0) {
    console.log('ℹ️  No video files to upload')
    return
  }
  
  console.log(`📤 Found ${files.length} videos to upload to Cloudinary...`)
  console.log('⏳ This may take a while for large files...\n')
  
  const uploadResults = []
  let successCount = 0
  let errorCount = 0
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    try {
      console.log(`[${i + 1}/${files.length}] Uploading ${file}...`)
      
      const filePath = path.join(videosDir, file)
      const fileSize = fs.statSync(filePath).size / (1024 * 1024) // MB
      
      console.log(`   Size: ${fileSize.toFixed(2)} MB`)
      
      const result = await cloudinary.uploader.upload(
        filePath,
        { 
          folder: 'fhox-ecommerce/videos',
          resource_type: 'video',
          type: 'upload',
          timeout: 600000 // 10 minutes timeout for large files
        }
      )
      
      uploadResults.push({
        localFilename: file,
        cloudinaryUrl: result.secure_url,
        cloudinaryPublicId: result.public_id,
        size: fileSize
      })
      
      console.log(`✅ Success! URL: ${result.secure_url}\n`)
      successCount++
    } catch (error) {
      console.log(`❌ Error uploading ${file}:`)
      console.log(`   ${error.message}\n`)
      errorCount++
    }
  }
  
  // Save mapping
  const mappingFile = path.join(__dirname, '..', 'cloudinary-video-mapping.json')
  const mapping = {}
  uploadResults.forEach(item => {
    mapping[item.localFilename] = item.cloudinaryUrl
  })
  
  fs.writeFileSync(mappingFile, JSON.stringify(mapping, null, 2))
  
  console.log('\n' + '='.repeat(60))
  console.log('📊 Upload Summary:')
  console.log(`✅ Successful: ${successCount}`)
  console.log(`❌ Failed: ${errorCount}`)
  console.log(`📄 Mapping saved to: cloudinary-video-mapping.json`)
  console.log('='.repeat(60))
  
  if (errorCount > 0) {
    console.log('\n⚠️  Some videos failed to upload. Please check the errors above.')
    console.log('💡 Tip: Large files may timeout. Try uploading them individually or split the batch.')
    process.exit(1)
  }
  
  console.log('\n✨ All videos uploaded successfully!')
  console.log('📝 Next steps:')
  console.log('   1. Update your components to use Cloudinary URLs')
  console.log('   2. Run: git rm --cached public/videos/*.mp4')
  console.log('   3. Run: git commit -m "Remove local videos - using Cloudinary"')
  console.log('   4. Run: git push')
}

uploadVideos().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
