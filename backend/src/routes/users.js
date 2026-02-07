const express = require('express');
const ClientUser = require('../models/ClientUser');
const Room = require('../models/Room');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

// Get all client users
router.get('/', async (req, res, next) => {
  try {
    const users = await ClientUser.find().populate('roomId');
    
    const transformedUsers = users.map(user => ({
      id: user._id.toString(),
      phone: user.phone,
      accessCode: user.accessCode,
      roomId: user.roomId ? user.roomId.roomNumber : undefined,
      roomName: user.roomId ? user.roomId.name : undefined,
      createdAt: user.createdAt.toISOString(),
      isActive: user.isActive
    }));

    res.json({
      success: true,
      data: transformedUsers
    });
  } catch (error) {
    next(error);
  }
});

// Create client user
router.post('/', async (req, res, next) => {
  try {
    const { phone, accessCode, roomId, isActive } = req.body;

    // Check if phone already exists
    const existing = await ClientUser.findOne({ phone });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Số điện thoại đã tồn tại'
      });
    }

    // Find room by roomNumber if roomId provided
    let roomObjectId = null;
    if (roomId) {
      const room = await Room.findOne({ roomNumber: roomId });
      if (room) {
        roomObjectId = room._id;
      }
    }

    const user = await ClientUser.create({
      phone,
      accessCode: accessCode.trim().toUpperCase(),
      roomId: roomObjectId,
      isActive: isActive !== false
    });

    // Populate room info
    await user.populate('roomId');

    res.status(201).json({
      success: true,
      message: 'Tạo tài khoản thành công',
      data: {
        id: user._id.toString(),
        phone: user.phone,
        accessCode: user.accessCode,
        roomId: user.roomId ? user.roomId.roomNumber : undefined,
        roomName: user.roomId ? user.roomId.name : undefined,
        createdAt: user.createdAt.toISOString(),
        isActive: user.isActive
      }
    });
  } catch (error) {
    next(error);
  }
});

// Update client user
router.put('/:id', async (req, res, next) => {
  try {
    const { phone, accessCode, roomId, isActive } = req.body;

    // Find room by roomNumber if roomId provided
    let roomObjectId = null;
    if (roomId) {
      const room = await Room.findOne({ roomNumber: roomId });
      if (room) {
        roomObjectId = room._id;
      }
    }

    const updateData = { phone, isActive };
    if (accessCode) {
      updateData.accessCode = accessCode.trim().toUpperCase();
    }
    if (roomId !== undefined) {
      updateData.roomId = roomObjectId;
    }

    const user = await ClientUser.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('roomId');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản'
      });
    }

    res.json({
      success: true,
      message: 'Cập nhật tài khoản thành công',
      data: {
        id: user._id.toString(),
        phone: user.phone,
        accessCode: user.accessCode,
        roomId: user.roomId ? user.roomId.roomNumber : undefined,
        roomName: user.roomId ? user.roomId.name : undefined,
        createdAt: user.createdAt.toISOString(),
        isActive: user.isActive
      }
    });
  } catch (error) {
    next(error);
  }
});

// Delete client user
router.delete('/:id', async (req, res, next) => {
  try {
    const user = await ClientUser.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản'
      });
    }

    res.json({
      success: true,
      message: 'Xóa tài khoản thành công'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
