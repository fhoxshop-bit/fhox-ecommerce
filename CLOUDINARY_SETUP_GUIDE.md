# Cloudinary Complete Setup Guide for Live Hosting

## Your Cloudinary Details
```
Cloud Name: dmanbuay5
Base URL: https://res.cloudinary.com/dmanbuay5/image/upload/
Video URL: https://res.cloudinary.com/dmanbuay5/video/upload/
```

---

## Step 1: Upload Existing Product Images to Cloudinary

### Option A: Using Cloudinary Dashboard (Manual)
1. Go to **https://cloudinary.com/console**
2. Click **Media Library**
3. Create folders:
   - `fhox-ecommerce/products/`
   - `fhox-ecommerce/videos/`
   - `fhox-ecommerce/banners/`
4. Upload your product images manually
5. For each image, copy the full URL (see Step 3)

### Option B: Bulk Upload with Node.js Script
Run this script in your backend folder:

```javascript
// backend/scripts/uploadToCloudinary.js
const cloudinary = require('cloudinary').v2
const fs = require('fs')
const path = require('path')

cloudinary.config({
  cloud_name: 'dmanbuay5',
  api_key: '-687598872854364',
  api_secret: 'gJXWC6_4Ml6sQRW2o-20tqURhA4'
})

async function uploadImages() {
  const uploadsDir = path.join(__dirname, '..', 'uploads')
  const files = fs.readdirSync(uploadsDir)
  
  for (const file of files) {
    try {
      const result = await cloudinary.uploader.upload(
        path.join(uploadsDir, file),
        { folder: 'fhox-ecommerce/products' }
      )
      console.log(`✓ Uploaded: ${file} → ${result.secure_url}`)
    } catch (err) {
      console.error(`✗ Failed: ${file}`, err.message)
    }
  }
}

uploadImages()
```

Run it:
```bash
cd backend
node scripts/uploadToCloudinary.js
```

---

## Step 2: Update products.json with Cloudinary URLs

Replace local paths like `/uploads/1772523006856_ad5a74996051a533a50fd33ca9715d5d.jpg`  
With Cloudinary paths like:
```
https://res.cloudinary.com/dmanbuay5/image/upload/fhox-ecommerce/products/1772523006856_ad5a74996051a533a50fd33ca9715d5d.jpg
```

### Quick Script to Update products.json
Copy to `backend/scripts/updateProductUrls.js`:

```javascript
const fs = require('fs')
const path = require('path')

const PRODUCTS_FILE = path.join(__dirname, '..', 'products.json')
const CLOUDINARY_BASE = 'https://res.cloudinary.com/dmanbuay5/image/upload/fhox-ecommerce/products/'

const products = JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf8'))

const updated = products.map(p => {
  if (p.imageUrl && p.imageUrl.startsWith('/uploads/')) {
    const filename = p.imageUrl.split('/').pop()
    p.imageUrl = CLOUDINARY_BASE + filename
  }
  return p
})

fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(updated, null, 2))
console.log('✓ Updated all product URLs to Cloudinary')
```

Run:
```bash
node scripts/updateProductUrls.js
```

---

## Step 3: Update Frontend Code

### For Main Site - Update image references:

**In any component using product images:**
```jsx
import { CLOUDINARY } from '../config/cloudinaryConfig'

// Image from product object
<img src={product.imageUrl} alt={product.name} />

// Or use fallback
<img 
  src={product.imageUrl || CLOUDINARY.PRODUCTS_FOLDER + 'default.jpg'} 
  alt={product.name} 
/>
```

### For Admin Panel - Update API calls:

**In Collections.jsx, ProductUpload.jsx, etc:**
```jsx
import API_BASE_URL from '../config/apiConfig'

// Instead of:
// fetch('http://localhost:5000/api/products')

// Use:
const response = await fetch(`${API_BASE_URL}/api/products`)
```

---

## Step 4: Upload Videos/Banners to Cloudinary

### For Videos:
Go to **Cloudinary Dashboard → Media Library**
1. Create folder: `fhox-ecommerce/videos/`
2. Upload video files
3. Copy URL like: `https://res.cloudinary.com/dmanbuay5/video/upload/fhox-ecommerce/videos/myVideo.mp4`

### For Banners:
```jsx
const bannerUrl = 'https://res.cloudinary.com/dmanbuay5/image/upload/fhox-ecommerce/banners/banner1.jpg'
<img src={bannerUrl} alt="Banner" />
```

---

## Step 5: Configure for Production (Mileweb)

When you deploy to Mileweb:

1. **Update `.env` file on Mileweb server:**
```env
MONGODB_URI=mongodb+srv://fhoxshop_db_user:ktc8tzQiNaHFRU6y@cluster0.bvflbmm.mongodb.net/?appName=Cluster0
CLOUDINARY_CLOUD_NAME=dmanbuay5
CLOUDINARY_API_KEY=-687598872854364
CLOUDINARY_API_SECRET=gJXWC6_4Ml6sQRW2o-20tqURhA4
PORT=5001
```

2. **Update frontend API config** - Replace in `src/config/apiConfig.js` and `admin/src/config/apiConfig.js`:
```javascript
export const API_BASE_URL = 'https://yourdomain.mileweb.com/api'
```

3. **Update backend server** to NOT serve local `/uploads` folder:
Remove from `server.js`:
```javascript
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')))
```

---

## Complete URL Examples for Your Assets

### Product Image:
```
https://res.cloudinary.com/dmanbuay5/image/upload/fhox-ecommerce/products/image-name.jpg
```

### Video:
```
https://res.cloudinary.com/dmanbuay5/video/upload/fhox-ecommerce/videos/video-name.mp4
```

### Brand Logo:
```
https://res.cloudinary.com/dmanbuay5/image/upload/fhox-ecommerce/brand/logo.png
```

### Banner:
```
https://res.cloudinary.com/dmanbuay5/image/upload/fhox-ecommerce/banners/banner.jpg
```

---

## Testing on Mileweb

1. Upload latest code (with config files updated)
2. Ensure MongoDB Atlas connection is active ✓
3. Test image display from Cloudinary URLs
4. Verify API calls use correct domain

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Images not loading | Check URL format: `https://res.cloudinary.com/dmanbuay5/image/upload/...` |
| API returns 404 | Update API_BASE_URL in config (remove `/api` if already in endpoint) |
| Videos not playing | Use video URL: `/video/upload/` not `/image/upload/` |
| Products show on local but not on Mileweb | Ensure cloudinary URLs are used, not localhost |

