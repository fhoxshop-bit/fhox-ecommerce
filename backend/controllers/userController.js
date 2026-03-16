const fs = require('fs')
const path = require('path')
const User = require('../models/User')

const USERS_FILE = path.join(__dirname, '..', 'users.json')

function readUsers() {
  try {
    const raw = fs.readFileSync(USERS_FILE, 'utf8')
    return JSON.parse(raw)
  } catch (err) {
    return []
  }
}

function writeUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8')
}

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({}, 'customerName email createdAt')
    res.json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    res.status(500).json({ error: 'Failed to fetch users' })
  }
}

// optional placeholders for creating / updating users later
exports.createUser = (req, res) => {
  try {
    const users = readUsers()
    const { name, email } = req.body
    const maxId = users.reduce((m, u) => Math.max(m, u.id || 0), 0)
    const newUser = {
      id: maxId + 1,
      name: name || '',
      email: email || '',
      created: new Date().toISOString(),
    }
    users.push(newUser)
    writeUsers(users)
    res.status(201).json(newUser)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Failed to create user' })
  }
}

// Cart operations
exports.getCart = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, cart: user.cart || [] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.addToCart = async (req, res) => {
  try {
    const { id, name, price, image, imageUrl } = req.body;
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.cart) user.cart = [];

    const existingItem = user.cart.find(item => String(item.id) === String(id));
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      user.cart.push({
        id: String(id),
        name,
        price,
        image,
        imageUrl,
        quantity: 1
      });
    }

    await user.save();
    res.json({ success: true, cart: user.cart });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateCartItem = async (req, res) => {
  try {
    const { id, quantity } = req.body;
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (quantity <= 0) {
      user.cart = user.cart.filter(item => String(item.id) !== String(id));
    } else {
      const item = user.cart.find(item => String(item.id) === String(id));
      if (item) {
        item.quantity = quantity;
      }
    }

    await user.save();
    res.json({ success: true, cart: user.cart });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.removeFromCart = async (req, res) => {
  try {
    const { id } = req.body;
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.cart = user.cart.filter(item => String(item.id) !== String(id));
    await user.save();
    res.json({ success: true, cart: user.cart });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.clearCart = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.cart = [];
    await user.save();
    res.json({ success: true, cart: [] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Wishlist operations
exports.getWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, wishlist: user.wishlist || [] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.addToWishlist = async (req, res) => {
  try {
    const { id } = req.body;
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.wishlist) user.wishlist = [];
    if (!user.wishlist.includes(String(id))) {
      user.wishlist.push(String(id));
    }

    await user.save();
    res.json({ success: true, wishlist: user.wishlist });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.removeFromWishlist = async (req, res) => {
  try {
    const { id } = req.body;
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.wishlist = (user.wishlist || []).filter(item => String(item) !== String(id));
    await user.save();
    res.json({ success: true, wishlist: user.wishlist });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.clearWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.wishlist = [];
    await user.save();
    res.json({ success: true, wishlist: [] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};