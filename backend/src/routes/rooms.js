const express = require('express');
const Room = require('../models/Room');
const PaymentHistory = require('../models/PaymentHistory');
const { authMiddleware } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get all rooms
router.get('/', async (req, res, next) => {
  try {
    const rooms = await Room.find().sort({ roomNumber: 1 });
    
    // Transform to match frontend format
    const transformedRooms = rooms.map(room => ({
      id: room.roomNumber,
      _id: room._id,
      name: room.name,
      status: room.status,
      monthlyRent: room.monthlyRent,
      dueDate: room.dueDate,
      tenant: room.tenant,
      utilities: room.utilities,
      payment: room.payment ? {
        ...room.payment.toObject(),
        id: room.payment.paymentId,
        roomId: room.roomNumber
      } : undefined
    }));

    res.json({
      success: true,
      data: transformedRooms
    });
  } catch (error) {
    next(error);
  }
});

// Get single room
router.get('/:id', async (req, res, next) => {
  try {
    const room = await Room.findOne({ roomNumber: parseInt(req.params.id) });
    
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phòng'
      });
    }

    res.json({
      success: true,
      data: {
        id: room.roomNumber,
        _id: room._id,
        name: room.name,
        status: room.status,
        monthlyRent: room.monthlyRent,
        dueDate: room.dueDate,
        tenant: room.tenant,
        utilities: room.utilities,
        payment: room.payment ? {
          ...room.payment.toObject(),
          id: room.payment.paymentId,
          roomId: room.roomNumber
        } : undefined
      }
    });
  } catch (error) {
    next(error);
  }
});

// Create new room
router.post('/', async (req, res, next) => {
  try {
    const { name, monthlyRent, electricityRate, waterRate } = req.body;

    const currentMonth = new Date().toISOString().slice(0, 7);
    const defaultDueDate = new Date();
    defaultDueDate.setDate(5);
    const dueDateIso = defaultDueDate.toISOString().slice(0, 10);

    const room = await Room.create({
      name,
      monthlyRent,
      dueDate: dueDateIso,
      utilities: {
        electricityUsed: 0,
        electricityRate,
        waterUsed: 0,
        waterRate,
        month: currentMonth
      }
    });

    res.status(201).json({
      success: true,
      message: 'Tạo phòng thành công',
      data: {
        id: room.roomNumber,
        _id: room._id,
        name: room.name,
        status: room.status,
        monthlyRent: room.monthlyRent,
        dueDate: room.dueDate,
        utilities: room.utilities
      }
    });
  } catch (error) {
    next(error);
  }
});

// Update room
router.put('/:id', async (req, res, next) => {
  try {
    const updates = req.body;
    
    const room = await Room.findOneAndUpdate(
      { roomNumber: parseInt(req.params.id) },
      updates,
      { new: true, runValidators: true }
    );

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phòng'
      });
    }

    res.json({
      success: true,
      message: 'Cập nhật phòng thành công',
      data: {
        id: room.roomNumber,
        _id: room._id,
        name: room.name,
        status: room.status,
        monthlyRent: room.monthlyRent,
        dueDate: room.dueDate,
        tenant: room.tenant,
        utilities: room.utilities,
        payment: room.payment
      }
    });
  } catch (error) {
    next(error);
  }
});

// Delete room
router.delete('/:id', async (req, res, next) => {
  try {
    const room = await Room.findOneAndDelete({ roomNumber: parseInt(req.params.id) });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phòng'
      });
    }

    res.json({
      success: true,
      message: 'Xóa phòng thành công'
    });
  } catch (error) {
    next(error);
  }
});

// Add/Update tenant
router.post('/:id/tenant', async (req, res, next) => {
  try {
    const tenant = req.body;
    
    const room = await Room.findOneAndUpdate(
      { roomNumber: parseInt(req.params.id) },
      { 
        tenant,
        status: 'occupied'
      },
      { new: true, runValidators: true }
    );

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phòng'
      });
    }

    res.json({
      success: true,
      message: 'Thêm người thuê thành công',
      data: room
    });
  } catch (error) {
    next(error);
  }
});

// Remove tenant
router.delete('/:id/tenant', async (req, res, next) => {
  try {
    const room = await Room.findOneAndUpdate(
      { roomNumber: parseInt(req.params.id) },
      { 
        $unset: { tenant: 1, payment: 1 },
        status: 'available'
      },
      { new: true }
    );

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phòng'
      });
    }

    res.json({
      success: true,
      message: 'Xóa người thuê thành công',
      data: room
    });
  } catch (error) {
    next(error);
  }
});

// Update utilities
router.put('/:id/utilities', async (req, res, next) => {
  try {
    const utilities = req.body;
    
    const room = await Room.findOneAndUpdate(
      { roomNumber: parseInt(req.params.id) },
      { utilities },
      { new: true, runValidators: true }
    );

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phòng'
      });
    }

    res.json({
      success: true,
      message: 'Cập nhật điện nước thành công',
      data: room
    });
  } catch (error) {
    next(error);
  }
});

// Pay current bill
router.post('/:id/pay', async (req, res, next) => {
  try {
    const room = await Room.findOne({ roomNumber: parseInt(req.params.id) });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phòng'
      });
    }

    if (!room.utilities) {
      return res.status(400).json({
        success: false,
        message: 'Chưa có thông tin điện nước'
      });
    }

    const electricity = room.utilities.electricityUsed * room.utilities.electricityRate;
    const water = room.utilities.waterUsed * room.utilities.waterRate;
    const total = room.monthlyRent + electricity + water;
    const paidDate = new Date().toISOString().slice(0, 10);

    const payment = {
      paymentId: uuidv4(),
      month: room.utilities.month,
      rent: room.monthlyRent,
      electricity,
      water,
      total,
      paid: true,
      paidDate
    };

    room.payment = payment;
    await room.save();

    // Save to payment history
    await PaymentHistory.create({
      room: room._id,
      roomName: room.name,
      tenantName: room.tenant?.name,
      month: room.utilities.month,
      rent: room.monthlyRent,
      electricity,
      water,
      total,
      paid: true,
      paidDate,
      electricityUsed: room.utilities.electricityUsed,
      waterUsed: room.utilities.waterUsed,
      electricityRate: room.utilities.electricityRate,
      waterRate: room.utilities.waterRate
    });

    res.json({
      success: true,
      message: 'Thanh toán thành công',
      data: {
        id: room.roomNumber,
        payment: {
          ...payment,
          id: payment.paymentId,
          roomId: room.roomNumber
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
