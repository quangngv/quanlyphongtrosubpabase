const express = require('express');
const ClientUser = require('../models/ClientUser');
const Room = require('../models/Room');
const PaymentHistory = require('../models/PaymentHistory');
const Admin = require('../models/Admin');

const router = express.Router();

// Client login (no admin auth required)
router.post('/login', async (req, res, next) => {
  try {
    const { phone, accessCode } = req.body;

    if (!phone || !accessCode) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập số điện thoại và mã truy cập'
      });
    }

    const user = await ClientUser.findOne({ 
      phone,
      accessCode: accessCode.trim().toUpperCase(),
      isActive: true
    }).populate('roomId');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Sai số điện thoại hoặc mã truy cập'
      });
    }

    let roomInfo = { property: 'Chưa gán phòng', roomCode: '-' };
    let tenantName = user.phone;

    if (user.roomId) {
      roomInfo = {
        property: 'Nhà Trọ Bà Tuất',
        roomCode: user.roomId.name
      };
      if (user.roomId.tenant?.name) {
        tenantName = user.roomId.tenant.name;
      }
    }

    res.json({
      success: true,
      data: {
        name: tenantName,
        phone: user.phone,
        accessCode: user.accessCode,
        email: `${user.phone}@tenant.local`,
        property: roomInfo.property,
        roomCode: roomInfo.roomCode,
        roomId: user.roomId?.roomNumber
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get lease info for client
router.post('/lease', async (req, res, next) => {
  try {
    const { phone, accessCode } = req.body;

    const user = await ClientUser.findOne({ 
      phone,
      accessCode: accessCode.trim().toUpperCase(),
      isActive: true
    }).populate('roomId');

    if (!user || !user.roomId) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin thuê phòng'
      });
    }

    const room = user.roomId;
    
    // Get admin/manager info
    const adminUser = await Admin.findOne().select('name email phone address');
    const managerInfo = adminUser ? {
      name: adminUser.name || 'Quản lý',
      phone: adminUser.phone || '0838 000 222',
      zalo: adminUser.phone || '0838 000 222',
      email: adminUser.email || 'quanly@batuat.vn'
    } : {
      name: 'Quản lý',
      phone: '0838 000 222',
      zalo: '0838 000 222',
      email: 'quanly@batuat.vn'
    };
    
    // Get payment history for this room
    const payments = await PaymentHistory.find({ room: room._id })
      .sort({ createdAt: -1 })
      .limit(12);

    // Calculate current bill
    let currentBill = null;
    if (room.utilities) {
      const electricity = room.utilities.electricityUsed * room.utilities.electricityRate;
      const water = room.utilities.waterUsed * room.utilities.waterRate;
      const total = room.monthlyRent + electricity + water;
      const isPaid = room.payment && room.payment.month === room.utilities.month && room.payment.paid;

      currentBill = {
        month: room.utilities.month,
        rent: room.monthlyRent,
        electricity,
        water,
        total,
        paid: isPaid,
        paidDate: isPaid ? room.payment.paidDate : null
      };
    }

    res.json({
      success: true,
      data: {
        leaseCode: `LEASE-${room.roomNumber}`,
        roomCode: room.name,
        propertyName: 'Nhà Trọ Bà Tuất',
        address: adminUser?.address || 'Hà Nội, Việt Nam',
        tenantName: room.tenant?.name || user.phone,
        phone: room.tenant?.phone || user.phone,
        startedAt: room.tenant?.startDate,
        nextDue: room.dueDate,
        rent: room.monthlyRent,
        deposit: room.monthlyRent, // Assuming deposit equals one month rent
        utilities: room.utilities ? [
          {
            name: 'Điện',
            pricing: `${room.utilities.electricityRate.toLocaleString('vi-VN')} đ/kWh`,
            latestReading: `${room.utilities.electricityUsed} kWh`
          },
          {
            name: 'Nước',
            pricing: `${room.utilities.waterRate.toLocaleString('vi-VN')} đ/m³`,
            latestReading: `${room.utilities.waterUsed} m³`
          }
        ] : [],
        currentBill,
        payments: payments.map(p => ({
          title: `Tiền phòng tháng ${p.month}`,
          amount: p.total,
          status: p.paid ? 'paid' : 'due',
          date: p.paidDate || p.month,
          note: p.paid ? `Điện: ${p.electricityUsed}kWh, Nước: ${p.waterUsed}m³` : undefined
        })),
        manager: managerInfo,
        notes: []
      }
    });
  } catch (error) {
    next(error);
  }
});

// Client pay bill (no admin auth required, uses phone + accessCode)
router.post('/pay', async (req, res, next) => {
  try {
    const { phone, accessCode } = req.body;

    const user = await ClientUser.findOne({ 
      phone,
      accessCode: accessCode.trim().toUpperCase(),
      isActive: true
    }).populate('roomId');

    if (!user || !user.roomId) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin thuê phòng'
      });
    }

    const room = user.roomId;

    if (!room.utilities) {
      return res.status(400).json({
        success: false,
        message: 'Chưa có thông tin điện nước'
      });
    }

    // Check if already paid
    if (room.payment && room.payment.month === room.utilities.month && room.payment.paid) {
      return res.status(400).json({
        success: false,
        message: 'Hóa đơn tháng này đã được thanh toán'
      });
    }

    const electricity = room.utilities.electricityUsed * room.utilities.electricityRate;
    const water = room.utilities.waterUsed * room.utilities.waterRate;
    const total = room.monthlyRent + electricity + water;
    const paidDate = new Date().toISOString().slice(0, 10);

    const payment = {
      paymentId: require('uuid').v4(),
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
        roomId: room.roomNumber,
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
