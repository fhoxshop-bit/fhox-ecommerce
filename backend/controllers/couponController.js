const fs = require('fs');
const path = require('path');
const { sendCouponEmail } = require('../utils/emailService');
const User = require('../models/User');
const Order = require('../models/Order');

const COUPONS_FILE = path.join(__dirname, '../coupons.json');
const ASSIGNMENTS_FILE = path.join(__dirname, '../coupon_assignments.json');
const USERS_FILE = path.join(__dirname, '../users.json');

// Helper to read files
const readFile = (filePath) => {
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    console.log(`[Read File] ${filePath} - ${data.length} records`);
    return data;
  } catch {
    return [];
  }
};

// Helper to write files
const writeFile = (filePath, data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`[Write File] ${filePath} - Wrote ${data.length} records`);
};

// Generate new coupon
exports.generateCoupon = (req, res) => {
  try {
    const { code, discountPercentage, expiryDate, minOrderValue, targetSegment } = req.body;

    if (!code || !discountPercentage || !expiryDate || !targetSegment) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Validate targetSegment
    const validSegments = ['NEW', 'ALL', 'TOP_BUYERS', 'INACTIVE'];
    if (!validSegments.includes(targetSegment)) {
      return res.status(400).json({ success: false, message: 'Invalid target segment' });
    }

    const coupons = readFile(COUPONS_FILE);

    // Check if coupon code already exists
    if (coupons.some(c => c.code.toUpperCase() === code.toUpperCase())) {
      return res.status(400).json({ success: false, message: 'Coupon code already exists' });
    }

    const newCoupon = {
      id: coupons.length > 0 ? Math.max(...coupons.map(c => c.id)) + 1 : 1,
      code: code.toUpperCase(),
      discountPercentage,
      expiryDate,
      minOrderValue: minOrderValue || 0,
      targetSegment,
      isActive: true,
      createdAt: new Date().toISOString().split('T')[0]
    };

    coupons.push(newCoupon);
    writeFile(COUPONS_FILE, coupons);

    res.status(201).json({ success: true, coupon: newCoupon, message: 'Coupon created successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// Get all coupons
exports.getCoupons = (req, res) => {
  try {
    const coupons = readFile(COUPONS_FILE);
    res.json(coupons);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// Get users by category (New, All, Top Buyers, Inactive)
exports.getUsersByCategory = async (req, res) => {
  try {
    const { category } = req.query;
    
    if (!category) {
      return res.status(400).json({ success: false, message: 'Category is required' });
    }
    
    // Get users from MongoDB
    const users = await User.find({}, '_id customerName email createdAt');
    console.log(`[Coupon] Fetched ${users.length} total users from MongoDB for category: ${category}`);
    
    const orders = await Order.find({}).select('userId totalAmount createdAt');
    console.log(`[Coupon] Fetched ${orders.length} total orders from MongoDB`);

    let filteredUsers = [];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const categoryLower = category.toLowerCase().replace('-', '_').toUpperCase();

    switch (categoryLower) {
      case 'NEW':
        // Users created in last 30 days
        filteredUsers = users.filter(u => {
          const userDate = new Date(u.createdAt).toISOString().split('T')[0];
          return userDate >= thirtyDaysAgo;
        });
        console.log(`[Coupon] Filtered to ${filteredUsers.length} NEW users`);
        break;

      case 'ALL':
        filteredUsers = users;
        console.log(`[Coupon] Using ALL users: ${filteredUsers.length}`);
        break;

      case 'TOP_BUYERS':
        // Users with highest total spending
        const userSpending = {};
        orders.forEach(order => {
          if (order.userId) {
            const userId = order.userId.toString();
            userSpending[userId] = (userSpending[userId] || 0) + (order.totalAmount || 0);
          }
        });
        filteredUsers = users
          .filter(u => userSpending[u._id.toString()] > 0)
          .sort((a, b) => (userSpending[b._id.toString()] || 0) - (userSpending[a._id.toString()] || 0))
          .slice(0, 50); // Top 50 buyers
        console.log(`[Coupon] Filtered to ${filteredUsers.length} TOP_BUYERS users`);
        break;

      case 'INACTIVE':
        // Users who haven't ordered in 30+ days
        const userLastOrder = {};
        orders.forEach(order => {
          if (order.userId) {
            const userId = order.userId.toString();
            const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
            if (!userLastOrder[userId] || orderDate > userLastOrder[userId]) {
              userLastOrder[userId] = orderDate;
            }
          }
        });
        filteredUsers = users.filter(u => {
          const userId = u._id.toString();
          const lastOrder = userLastOrder[userId];
          return !lastOrder || lastOrder < thirtyDaysAgo;
        });
        console.log(`[Coupon] Filtered to ${filteredUsers.length} INACTIVE users`);
        break;

      default:
        return res.status(400).json({ success: false, message: 'Invalid category' });
    }

    const mappedUsers = filteredUsers.map(u => ({
      id: u._id.toString(),
      name: u.customerName || 'User',
      email: u.email,
      createdAt: new Date(u.createdAt).toISOString().split('T')[0]
    }));

    res.json({
      success: true,
      category,
      count: mappedUsers.length,
      users: mappedUsers
    });
  } catch (err) {
    console.error('[Coupon] Error fetching users by category:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// Send coupon to selected users
exports.sendCouponToUsers = async (req, res) => {
  try {
    const { couponId, userIds } = req.body;

    if (!couponId || !userIds || userIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Missing couponId or userIds' });
    }

    const coupons = readFile(COUPONS_FILE);
    const assignments = readFile(ASSIGNMENTS_FILE);

    const coupon = coupons.find(c => c.id == couponId);
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    // Get users from MongoDB
    const users = await User.find({ _id: { $in: userIds } }).select('_id customerName email');
    const userMap = {};
    users.forEach(u => {
      userMap[u._id.toString()] = u;
    });

    let successCount = 0;
    const newAssignments = [];

    userIds.forEach(userId => {
      const user = userMap[userId];
      if (user && user.email) {
        // Check if already sent
        const alreadySent = assignments.some(a => a.couponId == couponId && a.userId == userId);
        if (!alreadySent) {
          const assignment = {
            id: assignments.length > 0 ? Math.max(...assignments.map(a => a.id), 0) + 1 : 1,
            couponId,
            userId,
            userEmail: user.email,
            sentAt: new Date().toISOString(),
            used: false,
            usedAt: null,
            orderId: null
          };
          assignments.push(assignment);
          newAssignments.push(assignment);
          successCount++;

          // Send email with coupon code
          sendCouponEmail(user.email, coupon.code, coupon.discountPercentage, coupon.expiryDate, coupon.targetSegment)
            .then(sent => {
              if (sent) {
                console.log(`✓ Coupon email sent to ${user.email}`);
              } else {
                console.warn(`⚠ Failed to send coupon email to ${user.email}, but coupon assigned`);
              }
            })
            .catch(err => console.error(`Error sending email to ${user.email}:`, err.message));
        }
      }
    });

    writeFile(ASSIGNMENTS_FILE, assignments);

    res.json({
      success: true,
      message: `Coupon sent to ${successCount} users`,
      sentCount: successCount,
      totalUsers: userIds.length
    });
  } catch (err) {
    console.error('Error sending coupon:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// Get user's available coupons
exports.getUserCoupons = (req, res) => {
  try {
    const { userId } = req.params;

    const coupons = readFile(COUPONS_FILE);
    const assignments = readFile(ASSIGNMENTS_FILE);

    // Get all coupons assigned to this user that haven't been used
    const userAssignments = assignments.filter(a => String(a.userId) === String(userId) && !a.used);

    const userCoupons = userAssignments
      .map(assignment => {
        const coupon = coupons.find(c => String(c.id) === String(assignment.couponId));
        if (coupon) {
          // Check if expired
          const isExpired = new Date(coupon.expiryDate) < new Date();
          return {
            ...coupon,
            assignmentId: assignment.id,
            sentAt: assignment.sentAt,
            isExpired,
            availableToUse: !isExpired
          };
        }
        return null;
      })
      .filter(c => c !== null);

    res.json({ success: true, coupons: userCoupons });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// Validate coupon for user
exports.validateCoupon = async (req, res) => {
  try {
    const { code, userId, orderTotal } = req.body;

    if (!code || !userId || !orderTotal) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    console.log(`[Coupon Validate] Validating coupon for userId: ${userId}, code: ${code}, orderTotal: ${orderTotal}`);

    const coupons = readFile(COUPONS_FILE);
    let assignments = readFile(ASSIGNMENTS_FILE);

    const coupon = coupons.find(c => c.code.toUpperCase() === code.toUpperCase());
    if (!coupon) {
      return res.status(400).json({ success: false, message: 'Invalid coupon code' });
    }

    // Check if active
    if (!coupon.isActive) {
      return res.status(400).json({ success: false, message: 'Coupon is inactive' });
    }

    // Check if expired
    if (new Date(coupon.expiryDate) < new Date()) {
      return res.status(400).json({ success: false, message: 'Coupon has expired' });
    }

    // FIRST: Check if user has ALREADY USED this coupon (regardless of segment)
    const allUserCouponUsages = assignments.filter(a => {
      return String(a.couponId) === String(coupon.id) && String(a.userId) === String(userId);
    });
    
    const usedInstance = allUserCouponUsages.find(a => a.used === true);
    
    if (usedInstance) {
      console.log(`[Coupon Validate] ❌ User ${userId} has already used coupon ${coupon.code} on order ${usedInstance.orderId}`);
      return res.status(400).json({ success: false, message: 'You have already used this coupon' });
    }

    console.log(`[Coupon Validate] Total assignments for this coupon+user: ${allUserCouponUsages.length}, Used: ${allUserCouponUsages.filter(a => a.used).length}`);

    // Check if user exists in MongoDB FIRST
    console.log(`[Coupon Validate] Checking user in MongoDB: ${userId}`);
    let user;
    try {
      user = await User.findById(userId).select('customerName email createdAt');
      console.log(`[Coupon Validate] User found: ${user ? user.customerName : 'NOT FOUND'}`);
    } catch (mongoError) {
      console.error(`[Coupon Validate] MongoDB error:`, mongoError.message);
      return res.status(500).json({ 
        success: false, 
        message: 'Database error checking user',
        error: mongoError.message 
      });
    }
    
    if (!user) {
      console.error(`[Coupon Validate] User not found in MongoDB for userId: ${userId}`);
      return res.status(400).json({ success: false, message: 'User account not found in database' });
    }

    // Look for available (unused) assignment for this coupon
    let userAssignment = assignments.find(a => {
      return String(a.couponId) === String(coupon.id) && String(a.userId) === String(userId) && !a.used;
    });
    
    console.log(`[Coupon Validate] Unused assignment found: ${userAssignment ? 'YES' : 'NO'}, Segment: ${coupon.targetSegment}`);
    
    // If no unused assignment and NOT ALL segment, reject
    if (!userAssignment && coupon.targetSegment !== 'ALL') {
      console.log(`[Coupon Validate] ❌ Non-ALL segment coupon has no unused assignment for this user`);
      return res.status(400).json({ success: false, message: 'This coupon was not sent to your account' });
    }

    // For ALL segment coupons, create a temporary assignment if none exist
    if (!userAssignment && coupon.targetSegment === 'ALL') {
      console.log(`[Coupon Validate] Creating temporary assignment for ALL segment coupon`);
      const tempAssignment = {
        id: assignments.length > 0 ? Math.max(...assignments.map(a => a.id), 0) + 1 : 1,
        couponId: coupon.id,
        userId,
        userEmail: user.email,
        sentAt: new Date().toISOString(),
        used: false,
        usedAt: null,
        orderId: null,
        isTemporary: true
      };
      assignments.push(tempAssignment);
      writeFile(ASSIGNMENTS_FILE, assignments);
      userAssignment = tempAssignment;
      console.log(`[Coupon Validate] ✓ Created temp assignment with ID: ${userAssignment.id}`);
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    let isInSegment = false;

    if (coupon.targetSegment === 'ALL') {
      isInSegment = true;
    } else if (coupon.targetSegment === 'NEW') {
      const userDate = new Date(user.createdAt).toISOString().split('T')[0];
      isInSegment = userDate >= thirtyDaysAgo;
    } else if (coupon.targetSegment === 'TOP_BUYERS') {
      const userOrders = await Order.find({ userId }).select('totalAmount');
      const totalSpent = userOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      // Get all user spending and check if in top 50
      const allOrders = await Order.find({}).select('userId totalAmount');
      const allUserSpending = {};
      allOrders.forEach(order => {
        if (order.userId) {
          const userIdStr = order.userId.toString();
          allUserSpending[userIdStr] = (allUserSpending[userIdStr] || 0) + (order.totalAmount || 0);
        }
      });
      const sortedBySpending = Object.entries(allUserSpending).sort((a, b) => b[1] - a[1]);
      const topBuyerIds = sortedBySpending.slice(0, 50).map(entry => entry[0]);
      isInSegment = topBuyerIds.includes(userId.toString());
    } else if (coupon.targetSegment === 'INACTIVE') {
      const userOrders = await Order.find({ userId }).select('createdAt').sort({ createdAt: -1 });
      if (userOrders.length === 0) {
        isInSegment = true; // No orders at all
      } else {
        const lastOrder = userOrders[0];
        const lastOrderDate = new Date(lastOrder.createdAt).toISOString().split('T')[0];
        isInSegment = lastOrderDate < thirtyDaysAgo;
      }
    }

    if (!isInSegment) {
      return res.status(400).json({ success: false, message: 'This coupon is not applicable to your account segment' });
    }

    // Check minimum order value
    if (orderTotal < coupon.minOrderValue) {
      return res.status(400).json({
        success: false,
        message: `Minimum order value of ₹${coupon.minOrderValue} required`
      });
    }

    // Calculate discount
    const discountAmount = Math.floor((orderTotal * coupon.discountPercentage) / 100);
    const finalPrice = orderTotal - discountAmount;

    res.json({
      success: true,
      message: 'Coupon is valid',
      coupon: {
        code: coupon.code,
        discountPercentage: coupon.discountPercentage,
        discountAmount,
        finalPrice,
        savings: `You save ₹${discountAmount} (${coupon.discountPercentage}%)`
      },
      assignmentId: userAssignment.id
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// Apply coupon to order (mark as used)
exports.applyCoupon = (req, res) => {
  try {
    const { assignmentId, orderId } = req.body;

    if (!assignmentId || !orderId) {
      return res.status(400).json({ success: false, message: 'Missing required fields: assignmentId and orderId' });
    }

    const assignments = readFile(ASSIGNMENTS_FILE);
    const coupons = readFile(COUPONS_FILE);

    const assignment = assignments.find(a => String(a.id) === String(assignmentId));
    if (!assignment) {
      console.warn(`[Coupon Apply] Assignment not found with ID: ${assignmentId}`);
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    // Check if already used
    if (assignment.used === true) {
      console.warn(`[Coupon Apply] Assignment already used: ${assignmentId}`);
      return res.status(400).json({ success: false, message: 'This coupon has already been used' });
    }

    // Mark as used
    assignment.used = true;
    assignment.usedAt = new Date().toISOString();
    assignment.orderId = orderId;

    // Increment coupon usage count
    const coupon = coupons.find(c => String(c.id) === String(assignment.couponId));
    if (coupon) {
      coupon.usedCount = (coupon.usedCount || 0) + 1;
      writeFile(COUPONS_FILE, coupons);
      console.log(`[Coupon Apply] Coupon ${coupon.code} usage count increased to: ${coupon.usedCount}`);
    }

    writeFile(ASSIGNMENTS_FILE, assignments);

    console.log(`[Coupon Apply] Coupon marked as used - assignmentId: ${assignmentId}, orderId: ${orderId}`);
    res.json({ success: true, message: 'Coupon applied successfully' });
  } catch (err) {
    console.error('[Coupon Apply] Error:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// Delete coupon (admin only)
exports.deleteCoupon = (req, res) => {
  try {
    const { id } = req.params;

    const coupons = readFile(COUPONS_FILE);
    const assignments = readFile(ASSIGNMENTS_FILE);

    // Remove coupon
    const filtered = coupons.filter(c => c.id != id);
    if (filtered.length === coupons.length) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    // Remove assignments for this coupon
    const assignmentsFiltered = assignments.filter(a => a.couponId != id);

    writeFile(COUPONS_FILE, filtered);
    writeFile(ASSIGNMENTS_FILE, assignmentsFiltered);

    res.json({ success: true, message: 'Coupon deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// Update coupon
exports.updateCoupon = (req, res) => {
  try {
    const { id } = req.params;
    const { discountPercentage, expiryDate, minOrderValue, maxUsageLimit, isActive } = req.body;

    const coupons = readFile(COUPONS_FILE);
    const coupon = coupons.find(c => c.id == id);

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    // Update fields
    if (discountPercentage !== undefined) coupon.discountPercentage = discountPercentage;
    if (expiryDate !== undefined) coupon.expiryDate = expiryDate;
    if (minOrderValue !== undefined) coupon.minOrderValue = minOrderValue;
    if (maxUsageLimit !== undefined) coupon.maxUsageLimit = maxUsageLimit;
    if (isActive !== undefined) coupon.isActive = isActive;

    writeFile(COUPONS_FILE, coupons);

    res.json({ success: true, coupon, message: 'Coupon updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// DEBUG: Check coupon assignment state for user + coupon
exports.debugAssignments = (req, res) => {
  try {
    const { userId, couponCode } = req.params;
    
    const coupons = readFile(COUPONS_FILE);
    const assignments = readFile(ASSIGNMENTS_FILE);
    
    const coupon = coupons.find(c => c.code.toUpperCase() === couponCode.toUpperCase());
    if (!coupon) {
      return res.json({ success: false, message: 'Coupon not found', couponCode });
    }
    
    // Find all assignments for this user + coupon
    const userAssignments = assignments.filter(a => {
      const aid = String(a.couponId);
      const cid = String(coupon.id);
      const uid = String(a.userId);
      const uid2 = String(userId);
      
      console.log(`[Debug] Comparing - Aid:${aid} vs Cid:${cid}, Uid:${uid} vs Uid2:${uid2}`);
      
      return aid === cid && uid === uid2;
    });
    
    res.json({
      success: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        targetSegment: coupon.targetSegment
      },
      userId,
      totalAssignments: userAssignments.length,
      assignments: userAssignments.map(a => ({
        id: a.id,
        used: a.used,
        usedAt: a.usedAt,
        orderId: a.orderId,
        sentAt: a.sentAt,
        isTemporary: a.isTemporary
      }))
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Debug error', error: err.message });
  }
};
