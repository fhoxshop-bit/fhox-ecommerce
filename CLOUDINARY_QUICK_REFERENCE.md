# 🎯 Cloudinary Quick Reference - Copy Your URLs Here

## Your Cloudinary Details
- **Cloud Name:** `dmanbuay5`
- **Dashboard:** https://cloudinary.com/console/media_library

---

## URL Formats - Use These for All Assets on Mileweb

### 📷 Product Images
```
https://res.cloudinary.com/dmanbuay5/image/upload/fhox-ecommerce/products/FILENAME.jpg
```
**Example:**
```
https://res.cloudinary.com/dmanbuay5/image/upload/fhox-ecommerce/products/1772523006856_ad5a74996051a533a50fd33ca9715d5d.jpg
```

### 🎬 Videos
```
https://res.cloudinary.com/dmanbuay5/video/upload/fhox-ecommerce/videos/FILENAME.mp4
```

### 🖼️ Banners
```
https://res.cloudinary.com/dmanbuay5/image/upload/fhox-ecommerce/banners/FILENAME.jpg
```

### 🏷️ Static Brand Assets
```
https://res.cloudinary.com/dmanbuay5/image/upload/fhox-ecommerce/brand/logo.png
https://res.cloudinary.com/dmanbuay5/image/upload/fhox-ecommerce/brand/favicon.ico
```

---

## 🚀 3-Step Quick Setup

### Step 1: Upload Existing Images
```bash
cd backend
node scripts/uploadToCloudinary.js
```

### Step 2: Update products.json
```bash
node scripts/updateProductUrls.js
```

### Step 3: Use Cloudinary URLs in Frontend
```jsx
// All images will automatically use Cloudinary URLs from products
<img src={product.imageUrl} alt={product.name} />

// New uploads from admin panel automatically go to Cloudinary
```

---

## 📋 Folder Structure in Cloudinary
```
fhox-ecommerce/
  ├── products/     ← Product images (auto-uploaded)
  ├── videos/       ← Video files
  ├── banners/      ← Banner images
  └── brand/        ← Logo, favicon, etc.
```

---

## 🔗 For Production Deployment to Mileweb

1. **Update backend `.env`:**
   ```env
   CLOUDINARY_CLOUD_NAME=dmanbuay5
   CLOUDINARY_API_KEY=-687598872854364
   CLOUDINARY_API_SECRET=gJXWC6_4Ml6sQRW2o-20tqURhA4
   MONGODB_URI=mongodb+srv://fhoxshop_db_user:ktc8tzQiNaHFRU6y@cluster0.bvflbmm.mongodb.net/?appName=Cluster0
   ```

2. **Update frontend config** - Replace with your Mileweb domain:
   ```javascript
   // src/config/apiConfig.js & admin/src/config/apiConfig.js
   export const API_BASE_URL = 'https://yourdomain.mileweb.com'
   ```

3. **Push to Mileweb** - All images will load from Cloudinary ✓

---

## ✅ Everything Works Because:
- ✅ Images are hosted on Cloudinary (not local server)
- ✅ Database is on MongoDB Atlas (not local)
- ✅ API connects to cloud services
- ✅ No local file dependencies for Mileweb

---

## ❓ Testing

**On Local Machine:**
```bash
# Backend running on port 5001
npm run dev

# Products have Cloudinary URLs
# Images load from https://res.cloudinary.com/...
```

**On Mileweb:**
```
Same Cloudinary URLs work everywhere
MongoDB Atlas accessible from Mileweb
API calls to your Mileweb domain
```

---

## 🆘 Common Issues

| Problem | Solution |
|---------|----------|
| Images don't load | Check URL starts with `https://res.cloudinary.com/dmanbuay5/` |
| API returns 404 | Ensure API_BASE_URL matches your domain (no `/api` if endpoint includes it) |
| Products show empty | Run `uploadToCloudinary.js` then `updateProductUrls.js` |
| Videos won't play | Use `/video/upload/` not `/image/upload/` |

