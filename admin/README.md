# FHOX Admin Panel

A modern, beautiful admin panel built with React and Vite featuring a rich gradient design with purple, blue, and pink accents.

## Features

- ✨ **Modern Gradient UI** - Purple to pink gradient theme with glass-morphism effects
- 📊 **Dashboard** - Overview with stats cards and recent activity
- 📦 **Collections Manager** - View, search, filter, and delete products
- 📤 **Product Upload** - Drag-and-drop image upload with preview
- ⚙️ **Settings** - Configure site settings and theme
- 📱 **Fully Responsive** - Works on desktop, tablet, and mobile
- 🎨 **Rich Visual Design** - Smooth animations, shadows, and transitions

## Project Structure

```
admin/
├── src/
│   ├── components/
│   │   ├── Sidebar.jsx
│   │   ├── Header.jsx
│   │   └── ... (other components)
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── Collections.jsx
│   │   ├── ProductUpload.jsx
│   │   └── Settings.jsx
│   ├── App.jsx
│   ├── App.css
│   ├── main.jsx
│   └── index.css
├── index.html
├── vite.config.js
└── package.json
```

## Installation

1. Navigate to the admin folder:
```bash
cd admin
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

The admin panel will be available at `http://localhost:5173`

## Build

To create a production build:

```bash
npm run build
```

## Default Credentials

- **Username**: Admin
- **Password**: (Authentication to be implemented)

## Color Scheme

- **Primary Gradient**: #667eea → #764ba2 (Purple-Blue)
- **Secondary Gradient**: #f093fb → #f5576c (Pink-Red)
- **Background**: #0f1419 (Dark)
- **Cards**: rgba(255, 255, 255, 0.08) with blur effect
- **Accent**: #667eea (Blue)

## Pages

### Dashboard
- Statistics cards with gradient backgrounds
- Recent activity feed
- Quick action buttons

### Collections
- List of all products
- Search functionality
- Filter by gender
- Edit/Delete actions
- Status badges

### Product Upload
- Drag-and-drop file upload
- Image preview
- Product form with details
- Real-time upload feedback

### Settings
- General site configuration
- Theme selection
- About information

## Integration with Backend

Update the API endpoints in `vite.config.js`:

```javascript
proxy: {
  '/api': {
    target: 'http://localhost:5000',
    changeOrigin: true
  }
}
```

## Notes

- This is a frontend-only admin panel
- Backend API integration will be added
- Image upload currently simulates upload (real upload to be implemented)
- Authentication to be implemented

## License

MIT
