# FHOX Frontend (minimal)

This is a minimal Vite + React scaffold implementing a header, a black promo banner, and a hero image (model) as requested.

Quick start:

```bash
npm install
npm run dev
```

Files added:
- `index.html`
- `package.json`
- `src/main.jsx`, `src/App.jsx`
- `src/components/Header.jsx`, `src/components/Banner.jsx`, `src/components/Hero.jsx`
- `src/index.css`

Adding a local banner video

1. Create a folder `public/videos` inside the project root (d:\FHOX\public\videos).
2. Copy your video file `8126811-hd_1920_1080_25fps.mp4` into that folder.
	- Full path should be `d:\FHOX\public\videos\8126811-hd_1920_1080_25fps.mp4`.
3. The app references this file at `/videos/8126811-hd_1920_1080_25fps.mp4`.
4. Vite will serve files from `public` automatically; after copying, reload the page.
