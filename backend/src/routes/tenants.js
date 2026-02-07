const express = require('express');
const Room = require('../models/Room');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

// Get all tenants
router.get('/', async (req, res, next) => {
  try {
    const rooms = await Room.find({ status: 'occupied', tenant: { $exists: true } });
    
    const tenants = rooms.map(room => ({
      roomId: room.roomNumber,
      roomName: room.name,
      ...room.tenant.toObject()
    }));

    res.json({
      success: true,
      data: tenants
    });
  } catch (error) {
    next(error);
  }
});

// Get tenant by room ID
router.get('/room/:roomId', async (req, res, next) => {
  try {
    const room = await Room.findOne({ roomNumber: parseInt(req.params.roomId) });
    
    if (!room || !room.tenant) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người thuê'
      });
    }

    res.json({
      success: true,
      data: {
        roomId: room.roomNumber,
        roomName: room.name,
        ...room.tenant.toObject()
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
