#!/usr/bin/env node
// backend/scripts/compressVideo.js
// Compress large video file for Cloudinary upload

const ffmpeg = require('fluent-ffmpeg')
const ffmpegStatic = require('ffmpeg-static')
const fs = require('fs')
const path = require('path')

// Set FFmpeg path
ffmpeg.setFfmpegPath(ffmpegStatic)

const inputFile = path.join(__dirname, '..', '..', 'public', 'videos', '72564-543910238.mp4')
const outputFile = path.join(__dirname, '..', '..', 'public', 'videos', '72564-543910238-compressed.mp4')

// Check if input exists
if (!fs.existsSync(inputFile)) {
  console.error('❌ Input file not found:', inputFile)
  process.exit(1)
}

const inputStats = fs.statSync(inputFile)
const inputSizeMB = (inputStats.size / (1024 * 1024)).toFixed(2)

console.log('🎬 Video Compression Started')
console.log(`📁 Input: ${inputFile}`)
console.log(`📦 Size: ${inputSizeMB} MB`)
console.log(`⏳ This will take 5-15 minutes depending on your system...\n`)

const command = ffmpeg(inputFile)
  .videoCodec('libx264')
  .audioCodec('aac')
  .size('1920x1080')
  .videoBitrate('2500k')
  .audioBitrate('128k')
  .on('start', (cmdLine) => {
    console.log('🚀 FFmpeg command:', cmdLine)
  })
  .on('progress', (progress) => {
    const percent = Math.round((progress.timemark.split(':')[0] * 3600 + 
                               progress.timemark.split(':')[1] * 60 + 
                               progress.timemark.split(':')[2]) / (inputStats.size / 1024 / 1024 / 5) * 100)
    process.stdout.write(`\r⏳ Compression: ${Math.min(percent, 100)}%`)
  })
  .on('end', () => {
    const outputStats = fs.statSync(outputFile)
    const outputSizeMB = (outputStats.size / (1024 * 1024)).toFixed(2)
    const ratio = ((1 - outputStats.size / inputStats.size) * 100).toFixed(1)
    
    console.log('\n\n✅ Compression Complete!')
    console.log(`📊 Output: ${outputFile}`)
    console.log(`📦 New Size: ${outputSizeMB} MB (reduced by ${ratio}%)`)
    console.log(`\n📝 Next Step: Upload to Cloudinary`)
    console.log('Run: node scripts/uploadVideosToCloudinary.js')
  })
  .on('error', (err) => {
    console.error('\n❌ Compression Error:', err.message)
    process.exit(1)
  })
  .output(outputFile)
  .run()
