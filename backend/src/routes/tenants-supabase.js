const express = require('express');
const { supabase } = require('../supabase');
const { authMiddleware } = require('../middleware/auth-supabase');

const router = express.Router();

router.use(authMiddleware);

// Get all tenants (rooms with tenants)
router.get('/', async (req, res, next) => {
  try {
    const { data: rooms, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('status', 'occupied')
      .order('room_number', { ascending: true });

    if (error) throw new Error(error.message);

    const tenants = rooms.map(room => ({
      id: room.room_number,
      roomId: room.room_number,
      roomName: room.name,
      name: room.tenant_name,
      phone: room.tenant_phone,
      identityCard: room.tenant_identity_card,
      startDate: room.tenant_start_date,
      endDate: room.tenant_end_date,
      photo: room.tenant_photo
    }));

    res.json({
      success: true,
      data: tenants
    });
  } catch (error) {
    next(error);
  }
});

// Get tenant by room number
router.get('/:roomId', async (req, res, next) => {
  try {
    const { data: room, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('room_number', parseInt(req.params.roomId))
      .single();

    if (error || !room || !room.tenant_name) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người thuê'
      });
    }

    res.json({
      success: true,
      data: {
        id: room.room_number,
        roomId: room.room_number,
        roomName: room.name,
        name: room.tenant_name,
        phone: room.tenant_phone,
        identityCard: room.tenant_identity_card,
        startDate: room.tenant_start_date,
        endDate: room.tenant_end_date,
        photo: room.tenant_photo
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
