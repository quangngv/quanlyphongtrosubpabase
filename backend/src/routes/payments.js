const express = require('express');
const PaymentHistory = require('../models/PaymentHistory');
const Room = require('../models/Room');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

// Get all payment history
router.get('/', async (req, res, next) => {
  try {
    const { month, roomId, paid } = req.query;
    
    const filter = {};
    if (month) filter.month = month;
    if (roomId) {
      const room = await Room.findOne({ roomNumber: parseInt(roomId) });
      if (room) filter.room = room._id;
    }
    if (paid !== undefined) filter.paid = paid === 'true';

    const payments = await PaymentHistory.find(filter)
      .sort({ createdAt: -1 })
      .populate('room');

    res.json({
      success: true,
      data: payments.map(p => ({
        id: p._id.toString(),
        roomId: p.room?.roomNumber,
        roomName: p.roomName,
        tenantName: p.tenantName,
        month: p.month,
        rent: p.rent,
        electricity: p.electricity,
        water: p.water,
        total: p.total,
        paid: p.paid,
        paidDate: p.paidDate,
        electricityUsed: p.electricityUsed,
        waterUsed: p.waterUsed,
        electricityRate: p.electricityRate,
        waterRate: p.waterRate,
        createdAt: p.createdAt.toISOString()
      }))
    });
  } catch (error) {
    next(error);
  }
});

// Get statistics
router.get('/statistics', async (req, res, next) => {
  try {
    const rooms = await Room.find();
    const payments = await PaymentHistory.find();

    const totalRooms = rooms.length;
    const occupiedRooms = rooms.filter(r => r.status === 'occupied').length;
    const availableRooms = totalRooms - occupiedRooms;
    const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

    // Calculate monthly revenue
    const currentMonth = new Date().toISOString().slice(0, 7);
    const currentMonthPayments = payments.filter(p => p.month === currentMonth && p.paid);
    const monthlyRevenue = currentMonthPayments.reduce((sum, p) => sum + p.total, 0);

    // Calculate total revenue
    const totalRevenue = payments.filter(p => p.paid).reduce((sum, p) => sum + p.total, 0);

    // Pending payments
    const pendingPayments = rooms.filter(r => 
      r.status === 'occupied' && 
      r.utilities && 
      (!r.payment || r.payment.month !== r.utilities.month)
    ).length;

    res.json({
      success: true,
      data: {
        totalRooms,
        occupiedRooms,
        availableRooms,
        occupancyRate,
        monthlyRevenue,
        totalRevenue,
        pendingPayments,
        totalTenants: occupiedRooms
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get revenue by month
router.get('/revenue', async (req, res, next) => {
  try {
    const { year } = req.query;
    const targetYear = year || new Date().getFullYear().toString();

    const payments = await PaymentHistory.find({
      month: { $regex: `^${targetYear}` },
      paid: true
    });

    // Group by month
    const revenueByMonth = {};
    for (let i = 1; i <= 12; i++) {
      const monthKey = `${targetYear}-${String(i).padStart(2, '0')}`;
      revenueByMonth[monthKey] = 0;
    }

    payments.forEach(p => {
      if (revenueByMonth[p.month] !== undefined) {
        revenueByMonth[p.month] += p.total;
      }
    });

    res.json({
      success: true,
      data: Object.entries(revenueByMonth).map(([month, revenue]) => ({
        month,
        revenue
      }))
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
