require('dotenv').config()
const express = require('express')
const cors = require('cors')
const path = require('path')
const mongoose = require('mongoose')

const productsRouter = require('./routes/products')

const app = express()
const PORT = process.env.PORT || 5000

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB Atlas'))
.catch(err => console.error('MongoDB connection error:', err))

app.use(cors())
app.use(express.json())

// Serve uploaded files from backend/uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// API routes
app.use('/api/products', productsRouter)
app.use('/api/auth', require('./routes/auth'))
app.use('/api/users', require('./routes/users'))
app.use('/api/messages', require('./routes/messages'))
app.use('/api/newsletter', require('./routes/newsletter'))
app.use('/api/reviews', require('./routes/reviews'))
app.use('/api/orders', require('./routes/orders'))
app.use('/api/analytics', require('./routes/analytics'))
app.use('/api/settings', require('./routes/settings'))
app.use('/api/coupons', require('./routes/coupons'))
app.use('/api/flash-deals', require('./routes/flashDeals'))

app.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`)
})

