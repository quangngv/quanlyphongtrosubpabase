const express = require('express');
const { supabase } = require('../supabase');
const { authMiddleware } = require('../middleware/auth-supabase');

const router = express.Router();

router.use(authMiddleware);

// Get all client users
router.get('/', async (req, res, next) => {
  try {
    const { data: users, error } = await supabase
      .from('client_users')
      .select(`
        *,
        rooms:room_id (room_number, name)
      `)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    const transformedUsers = users.map(user => ({
      id: user.id,
      phone: user.phone,
      accessCode: user.access_code,
      roomId: user.rooms?.room_number,
      roomName: user.rooms?.name,
      createdAt: user.created_at,
      isActive: user.is_active
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
    const { data: existing } = await supabase
      .from('client_users')
      .select('id')
      .eq('phone', phone)
      .maybeSingle();

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Số điện thoại đã tồn tại'
      });
    }

    // Find room by roomNumber if roomId provided
    let roomUuid = null;
    if (roomId) {
      const { data: room } = await supabase
        .from('rooms')
        .select('id')
        .eq('room_number', roomId)
        .single();
      
      if (room) {
        roomUuid = room.id;
      }
    }

    const { data: user, error } = await supabase
      .from('client_users')
      .insert({
        phone,
        access_code: accessCode.trim().toUpperCase(),
        room_id: roomUuid,
        is_active: isActive !== false
      })
      .select(`
        *,
        rooms:room_id (room_number, name)
      `)
      .single();

    if (error) throw new Error(error.message);

    res.status(201).json({
      success: true,
      message: 'Tạo tài khoản thành công',
      data: {
        id: user.id,
        phone: user.phone,
        accessCode: user.access_code,
        roomId: user.rooms?.room_number,
        roomName: user.rooms?.name,
        createdAt: user.created_at,
        isActive: user.is_active
      }
    });
  } catch (error) {
    // Handle duplicate key error
    if (error.message && error.message.includes('duplicate key')) {
      return res.status(400).json({
        success: false,
        message: 'Số điện thoại đã tồn tại trong hệ thống'
      });
    }
    next(error);
  }
});

// Update client user
router.put('/:id', async (req, res, next) => {
  try {
    const { phone, accessCode, roomId, isActive } = req.body;

    // Check if phone already exists for another user
    if (phone !== undefined) {
      const { data: existing } = await supabase
        .from('client_users')
        .select('id')
        .eq('phone', phone)
        .neq('id', req.params.id)
        .maybeSingle();

      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Số điện thoại đã được sử dụng bởi người dùng khác'
        });
      }
    }

    // Find room by roomNumber if roomId provided
    let roomUuid = null;
    if (roomId !== undefined) {
      if (roomId === null) {
        roomUuid = null;
      } else {
        const { data: room } = await supabase
          .from('rooms')
          .select('id')
          .eq('room_number', roomId)
          .single();
        
        if (room) {
          roomUuid = room.id;
        }
      }
    }

    const updates = {};
    if (phone !== undefined) updates.phone = phone;
    if (accessCode !== undefined) updates.access_code = accessCode.trim().toUpperCase();
    if (roomId !== undefined) updates.room_id = roomUuid;
    if (isActive !== undefined) updates.is_active = isActive;

    const { data: user, error } = await supabase
      .from('client_users')
      .update(updates)
      .eq('id', req.params.id)
      .select(`
        *,
        rooms:room_id (room_number, name)
      `)
      .single();

    if (error || !user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    res.json({
      success: true,
      message: 'Cập nhật thành công',
      data: {
        id: user.id,
        phone: user.phone,
        accessCode: user.access_code,
        roomId: user.rooms?.room_number,
        roomName: user.rooms?.name,
        createdAt: user.created_at,
        isActive: user.is_active
      }
    });
  } catch (error) {
    // Handle duplicate key error
    if (error.message && error.message.includes('duplicate key')) {
      return res.status(400).json({
        success: false,
        message: 'Số điện thoại đã được sử dụng bởi người dùng khác'
      });
    }
    next(error);
  }
});

// Delete client user
router.delete('/:id', async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('client_users')
      .delete()
      .eq('id', req.params.id);

    if (error) throw new Error(error.message);

    res.json({
      success: true,
      message: 'Xóa thành công'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
