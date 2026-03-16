const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

exports.signup = async (req, res) => {
  try {
    const { email, password, customerName } = req.body;

    if (!email || !password || !customerName) {
      return res.status(400).json({ message: 'Please provide email, password, and name' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = new User({
      email,
      password: hashedPassword,
      customerName
    });

    await user.save();

    // Create JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        customerName: user.customerName
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error during signup', error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Create JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        customerName: user.customerName
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login', error: error.message });
  }
};

exports.verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No authentication token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        customerName: user.customerName
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user', error: error.message });
  }
};

// Admin login - hardcoded credentials
exports.adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Please provide username and password' });
    }

    // Read admin credentials from file
    const fs = require('fs');
    const path = require('path');
    const credentialsPath = path.join(__dirname, '../admin-credentials.json');
    
    let adminCredentials = {
      username: 'admin',
      password: 'Mayur.bhagat@123'
    };

    // Try to read from file if it exists
    if (fs.existsSync(credentialsPath)) {
      try {
        const fileData = fs.readFileSync(credentialsPath, 'utf8');
        adminCredentials = JSON.parse(fileData);
      } catch (err) {
        console.error('Error reading credentials file:', err);
        // Fall back to default credentials
      }
    }

    if (username !== adminCredentials.username || password !== adminCredentials.password) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    // Create JWT token for admin
    const token = jwt.sign(
      { adminId: 'admin', isAdmin: true },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'Admin login successful',
      token,
      admin: {
        username: adminCredentials.username,
        role: 'admin'
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Server error during admin login', error: error.message });
  }
};

// Update admin credentials
exports.updateAdminCredentials = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !username.trim()) {
      return res.status(400).json({ message: 'Username cannot be empty' });
    }

    if (password && password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const fs = require('fs');
    const path = require('path');
    const credentialsPath = path.join(__dirname, '../admin-credentials.json');

    // Read current credentials
    let adminCredentials = {
      username: 'admin',
      password: 'Mayur.bhagat@123'
    };

    if (fs.existsSync(credentialsPath)) {
      try {
        const fileData = fs.readFileSync(credentialsPath, 'utf8');
        adminCredentials = JSON.parse(fileData);
      } catch (err) {
        console.error('Error reading credentials file:', err);
      }
    }

    // Update credentials
    adminCredentials.username = username;
    if (password) {
      adminCredentials.password = password;
    }

    // Write updated credentials to file
    fs.writeFileSync(credentialsPath, JSON.stringify(adminCredentials, null, 2), 'utf8');

    res.status(200).json({
      success: true,
      message: 'Admin credentials updated successfully',
      admin: {
        username: adminCredentials.username
      }
    });
  } catch (error) {
    console.error('Update credentials error:', error);
    res.status(500).json({ message: 'Server error while updating credentials', error: error.message });
  }
};
