const express = require('express');
const { supabase } = require('../supabase');
const { authMiddleware } = require('../middleware/auth-supabase');

const router = express.Router();

router.use(authMiddleware);

// Get all payment history
router.get('/', async (req, res, next) => {
  try {
    const { month, roomId, paid } = req.query;
    
    let query = supabase
      .from('payment_history')
      .select(`
        *,
        rooms:room_id (room_number)
      `)
      .order('created_at', { ascending: false });

    if (month) {
      query = query.eq('month', month);
    }
    if (paid !== undefined) {
      query = query.eq('paid', paid === 'true');
    }

    const { data: payments, error } = await query;

    if (error) throw new Error(error.message);

    // Filter by roomId if provided
    let filteredPayments = payments;
    if (roomId) {
      filteredPayments = payments.filter(p => p.rooms?.room_number === parseInt(roomId));
    }

    res.json({
      success: true,
      data: filteredPayments.map(p => ({
        id: p.id,
        roomId: p.rooms?.room_number,
        roomName: p.room_name,
        tenantName: p.tenant_name,
        month: p.month,
        rent: Number(p.rent),
        electricity: Number(p.electricity),
        water: Number(p.water),
        total: Number(p.total),
        paid: p.paid,
        paidDate: p.paid_date,
        electricityUsed: Number(p.electricity_used),
        waterUsed: Number(p.water_used),
        electricityRate: Number(p.electricity_rate),
        waterRate: Number(p.water_rate),
        createdAt: p.created_at
      }))
    });
  } catch (error) {
    next(error);
  }
});

// Get statistics
router.get('/statistics', async (req, res, next) => {
  try {
    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select('*');

    const { data: payments, error: paymentsError } = await supabase
      .from('payment_history')
      .select('*');

    if (roomsError) throw new Error(roomsError.message);
    if (paymentsError) throw new Error(paymentsError.message);

    const totalRooms = rooms.length;
    const occupiedRooms = rooms.filter(r => r.status === 'occupied').length;
    const availableRooms = totalRooms - occupiedRooms;
    const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

    // Calculate monthly revenue
    const currentMonth = new Date().toISOString().slice(0, 7);
    const currentMonthPayments = payments.filter(p => p.month === currentMonth && p.paid);
    const monthlyRevenue = currentMonthPayments.reduce((sum, p) => sum + Number(p.total), 0);

    // Calculate total revenue
    const totalRevenue = payments.filter(p => p.paid).reduce((sum, p) => sum + Number(p.total), 0);

    // Pending payments
    const pendingPayments = rooms.filter(r => 
      r.status === 'occupied' && 
      r.utilities_month && 
      (!r.payment_id || r.payment_month !== r.utilities_month)
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

    const { data: payments, error } = await supabase
      .from('payment_history')
      .select('*')
      .like('month', `${targetYear}%`)
      .eq('paid', true);

    if (error) throw new Error(error.message);

    // Group by month
    const revenueByMonth = {};
    for (let i = 1; i <= 12; i++) {
      const monthKey = `${targetYear}-${String(i).padStart(2, '0')}`;
      revenueByMonth[monthKey] = 0;
    }

    payments.forEach(p => {
      if (revenueByMonth[p.month] !== undefined) {
        revenueByMonth[p.month] += Number(p.total);
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
