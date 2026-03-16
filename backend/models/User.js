const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  customerName: {
    type: String,
    required: true
  },
  cart: [{
    id: {
      type: String,
      required: true
    },
    name: String,
    price: Number,
    image: String,
    imageUrl: String,
    quantity: {
      type: Number,
      default: 1
    }
  }],
  wishlist: [String],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);
