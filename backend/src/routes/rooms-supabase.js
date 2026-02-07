const express = require('express');
const { supabase } = require('../supabase');
const { authMiddleware } = require('../middleware/auth-supabase');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Helper function to transform room data
const transformRoom = (room) => ({
  id: room.room_number,
  _id: room.id,
  name: room.name,
  status: room.status,
  monthlyRent: Number(room.monthly_rent),
  dueDate: room.due_date,
  tenant: room.tenant_name ? {
    name: room.tenant_name,
    phone: room.tenant_phone,
    identityCard: room.tenant_identity_card,
    startDate: room.tenant_start_date,
    endDate: room.tenant_end_date,
    photo: room.tenant_photo,
    identityFrontImage: room.tenant_identity_front_image,
    identityBackImage: room.tenant_identity_back_image
  } : undefined,
  utilities: room.utilities_month ? {
    electricityUsed: Number(room.electricity_used),
    electricityRate: Number(room.electricity_rate),
    waterUsed: Number(room.water_used),
    waterRate: Number(room.water_rate),
    month: room.utilities_month
  } : undefined,
  payment: room.payment_id ? {
    id: room.payment_id,
    paymentId: room.payment_id,
    month: room.payment_month,
    rent: Number(room.payment_rent),
    electricity: Number(room.payment_electricity),
    water: Number(room.payment_water),
    total: Number(room.payment_total),
    paid: room.payment_paid,
    paidDate: room.payment_paid_date,
    roomId: room.room_number
  } : undefined
});

// Get all rooms
router.get('/', async (req, res, next) => {
  try {
    const { data: rooms, error } = await supabase
      .from('rooms')
      .select('*')
      .order('room_number', { ascending: true });

    if (error) throw new Error(error.message);

    const transformedRooms = rooms.map(transformRoom);

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
    const { data: room, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('room_number', parseInt(req.params.id))
      .single();

    if (error || !room) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phòng'
      });
    }

    res.json({
      success: true,
      data: transformRoom(room)
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

    const { data: room, error } = await supabase
      .from('rooms')
      .insert({
        name,
        monthly_rent: monthlyRent,
        due_date: dueDateIso,
        electricity_rate: electricityRate,
        water_rate: waterRate,
        electricity_used: 0,
        water_used: 0,
        utilities_month: currentMonth
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    res.status(201).json({
      success: true,
      message: 'Tạo phòng thành công',
      data: transformRoom(room)
    });
  } catch (error) {
    next(error);
  }
});

// Update room
router.put('/:id', async (req, res, next) => {
  try {
    const updates = req.body;
    
    // Convert camelCase to snake_case for Supabase
    const supabaseUpdates = {};
    if (updates.name !== undefined) supabaseUpdates.name = updates.name;
    if (updates.monthlyRent !== undefined) supabaseUpdates.monthly_rent = updates.monthlyRent;
    if (updates.dueDate !== undefined) supabaseUpdates.due_date = updates.dueDate;
    if (updates.status !== undefined) supabaseUpdates.status = updates.status;

    const { data: room, error } = await supabase
      .from('rooms')
      .update(supabaseUpdates)
      .eq('room_number', parseInt(req.params.id))
      .select()
      .single();

    if (error || !room) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phòng'
      });
    }

    res.json({
      success: true,
      message: 'Cập nhật phòng thành công',
      data: transformRoom(room)
    });
  } catch (error) {
    next(error);
  }
});

// Delete room
router.delete('/:id', async (req, res, next) => {
  try {
    const { data: room, error: findError } = await supabase
      .from('rooms')
      .select('id')
      .eq('room_number', parseInt(req.params.id))
      .single();

    if (findError || !room) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phòng'
      });
    }

    const { error } = await supabase
      .from('rooms')
      .delete()
      .eq('id', room.id);

    if (error) throw new Error(error.message);

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
    
    const { data: room, error } = await supabase
      .from('rooms')
      .update({
        tenant_name: tenant.name,
        tenant_phone: tenant.phone,
        tenant_identity_card: tenant.identityCard,
        tenant_start_date: tenant.startDate,
        tenant_end_date: tenant.endDate,
        tenant_photo: tenant.photo,
        tenant_identity_front_image: tenant.identityFrontImage,
        tenant_identity_back_image: tenant.identityBackImage,
        status: 'occupied'
      })
      .eq('room_number', parseInt(req.params.id))
      .select()
      .single();

    if (error || !room) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phòng'
      });
    }

    res.json({
      success: true,
      message: 'Thêm người thuê thành công',
      data: transformRoom(room)
    });
  } catch (error) {
    next(error);
  }
});

// Remove tenant
router.delete('/:id/tenant', async (req, res, next) => {
  try {
    const { data: room, error } = await supabase
      .from('rooms')
      .update({
        tenant_name: null,
        tenant_phone: null,
        tenant_identity_card: null,
        tenant_start_date: null,
        tenant_end_date: null,
        tenant_photo: null,
        tenant_identity_front_image: null,
        tenant_identity_back_image: null,
        payment_id: null,
        payment_month: null,
        payment_rent: null,
        payment_electricity: null,
        payment_water: null,
        payment_total: null,
        payment_paid: null,
        payment_paid_date: null,
        status: 'available'
      })
      .eq('room_number', parseInt(req.params.id))
      .select()
      .single();

    if (error || !room) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phòng'
      });
    }

    res.json({
      success: true,
      message: 'Xóa người thuê thành công',
      data: transformRoom(room)
    });
  } catch (error) {
    next(error);
  }
});

// Update utilities
router.put('/:id/utilities', async (req, res, next) => {
  try {
    const utilities = req.body;
    
    const { data: room, error } = await supabase
      .from('rooms')
      .update({
        electricity_used: utilities.electricityUsed,
        electricity_rate: utilities.electricityRate,
        water_used: utilities.waterUsed,
        water_rate: utilities.waterRate,
        utilities_month: utilities.month
      })
      .eq('room_number', parseInt(req.params.id))
      .select()
      .single();

    if (error || !room) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phòng'
      });
    }

    res.json({
      success: true,
      message: 'Cập nhật điện nước thành công',
      data: transformRoom(room)
    });
  } catch (error) {
    next(error);
  }
});

// Pay current bill
router.post('/:id/pay', async (req, res, next) => {
  try {
    // Get room data first
    const { data: room, error: findError } = await supabase
      .from('rooms')
      .select('*')
      .eq('room_number', parseInt(req.params.id))
      .single();

    if (findError || !room) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phòng'
      });
    }

    if (!room.utilities_month) {
      return res.status(400).json({
        success: false,
        message: 'Chưa có thông tin điện nước'
      });
    }

    // Check if already paid
    if (room.payment_id && room.payment_month === room.utilities_month && room.payment_paid) {
      return res.status(400).json({
        success: false,
        message: 'Hóa đơn tháng này đã được thanh toán'
      });
    }

    const electricity = Number(room.electricity_used) * Number(room.electricity_rate);
    const water = Number(room.water_used) * Number(room.water_rate);
    const total = Number(room.monthly_rent) + electricity + water;
    const paidDate = new Date().toISOString().slice(0, 10);
    const paymentId = uuidv4();

    // Update room with payment info
    const { data: updatedRoom, error: updateError } = await supabase
      .from('rooms')
      .update({
        payment_id: paymentId,
        payment_month: room.utilities_month,
        payment_rent: room.monthly_rent,
        payment_electricity: electricity,
        payment_water: water,
        payment_total: total,
        payment_paid: true,
        payment_paid_date: paidDate
      })
      .eq('id', room.id)
      .select()
      .single();

    if (updateError) throw new Error(updateError.message);

    // Save to payment history
    const { error: historyError } = await supabase
      .from('payment_history')
      .insert({
        room_id: room.id,
        room_name: room.name,
        tenant_name: room.tenant_name,
        month: room.utilities_month,
        rent: room.monthly_rent,
        electricity,
        water,
        total,
        paid: true,
        paid_date: paidDate,
        electricity_used: room.electricity_used,
        water_used: room.water_used,
        electricity_rate: room.electricity_rate,
        water_rate: room.water_rate
      });

    if (historyError) console.error('Error saving payment history:', historyError);

    res.json({
      success: true,
      message: 'Thanh toán thành công',
      data: {
        roomId: room.room_number,
        payment: {
          id: paymentId,
          paymentId,
          month: room.utilities_month,
          rent: Number(room.monthly_rent),
          electricity,
          water,
          total,
          paid: true,
          paidDate,
          roomId: room.room_number
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
