const express = require('express');
const { supabase } = require('../supabase');

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

    const { data: user, error } = await supabase
      .from('client_users')
      .select(`
        *,
        rooms:room_id (*)
      `)
      .eq('phone', phone)
      .eq('access_code', accessCode.trim().toUpperCase())
      .eq('is_active', true)
      .single();

    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: 'Sai số điện thoại hoặc mã truy cập'
      });
    }

    let roomInfo = { property: 'Chưa gán phòng', roomCode: '-' };
    let tenantName = user.phone;

    if (user.rooms) {
      roomInfo = {
        property: 'Nhà Trọ Bà Tuất',
        roomCode: user.rooms.name
      };
      if (user.rooms.tenant_name) {
        tenantName = user.rooms.tenant_name;
      }
    }

    res.json({
      success: true,
      data: {
        name: tenantName,
        phone: user.phone,
        accessCode: user.access_code,
        email: `${user.phone}@tenant.local`,
        property: roomInfo.property,
        roomCode: roomInfo.roomCode,
        roomId: user.rooms?.room_number
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

    const { data: user, error } = await supabase
      .from('client_users')
      .select(`
        *,
        rooms:room_id (*)
      `)
      .eq('phone', phone)
      .eq('access_code', accessCode.trim().toUpperCase())
      .eq('is_active', true)
      .single();

    if (error || !user || !user.rooms) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin thuê phòng'
      });
    }

    const room = user.rooms;
    
    // Get admin/manager info
    const { data: adminUser } = await supabase
      .from('admins')
      .select('name, email, phone, address')
      .limit(1)
      .single();

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
    const { data: payments } = await supabase
      .from('payment_history')
      .select('*')
      .eq('room_id', room.id)
      .order('created_at', { ascending: false })
      .limit(12);

    // Calculate current bill
    let currentBill = null;
    if (room.utilities_month) {
      const electricity = Number(room.electricity_used) * Number(room.electricity_rate);
      const water = Number(room.water_used) * Number(room.water_rate);
      const total = Number(room.monthly_rent) + electricity + water;
      const isPaid = room.payment_id && room.payment_month === room.utilities_month && room.payment_paid;

      currentBill = {
        month: room.utilities_month,
        rent: Number(room.monthly_rent),
        electricity,
        water,
        total,
        paid: isPaid,
        paidDate: isPaid ? room.payment_paid_date : null
      };
    }

    res.json({
      success: true,
      data: {
        leaseCode: `LEASE-${room.room_number}`,
        roomCode: room.name,
        propertyName: 'Nhà Trọ Bà Tuất',
        address: adminUser?.address || 'Hà Nội, Việt Nam',
        tenantName: room.tenant_name || user.phone,
        phone: room.tenant_phone || user.phone,
        startedAt: room.tenant_start_date,
        nextDue: room.due_date,
        rent: Number(room.monthly_rent),
        deposit: Number(room.monthly_rent),
        utilities: room.utilities_month ? [
          {
            name: 'Điện',
            pricing: `${Number(room.electricity_rate).toLocaleString('vi-VN')} đ/kWh`,
            latestReading: `${room.electricity_used} kWh`
          },
          {
            name: 'Nước',
            pricing: `${Number(room.water_rate).toLocaleString('vi-VN')} đ/m³`,
            latestReading: `${room.water_used} m³`
          }
        ] : [],
        currentBill,
        payments: (payments || []).map(p => ({
          title: `Tiền phòng tháng ${p.month}`,
          amount: Number(p.total),
          date: p.paid_date || p.created_at?.slice(0, 10),
          status: p.paid ? 'paid' : 'due',
          note: p.paid ? `Đã thanh toán` : `Tiền phòng: ${Number(p.rent).toLocaleString('vi-VN')} đ, Điện: ${Number(p.electricity).toLocaleString('vi-VN')} đ, Nước: ${Number(p.water).toLocaleString('vi-VN')} đ`
        })),
        manager: managerInfo
      }
    });
  } catch (error) {
    next(error);
  }
});

// Pay bill for client
router.post('/pay', async (req, res, next) => {
  try {
    const { phone, accessCode } = req.body;

    const { data: user, error } = await supabase
      .from('client_users')
      .select(`
        *,
        rooms:room_id (*)
      `)
      .eq('phone', phone)
      .eq('access_code', accessCode.trim().toUpperCase())
      .eq('is_active', true)
      .single();

    if (error || !user || !user.rooms) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin thuê phòng'
      });
    }

    const room = user.rooms;

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
    const { v4: uuidv4 } = require('uuid');
    const paymentId = uuidv4();

    // Update room with payment info
    const { error: updateError } = await supabase
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
      .eq('id', room.id);

    if (updateError) throw new Error(updateError.message);

    // Save to payment history
    await supabase
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
