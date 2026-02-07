require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./models/Admin');
const Room = require('./models/Room');
const ClientUser = require('./models/ClientUser');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/quanlyphongtro';

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Admin.deleteMany({});
    await Room.deleteMany({});
    await ClientUser.deleteMany({});
    
    // Drop the roomNumber index to avoid duplicate key issues
    try {
      await mongoose.connection.collection('rooms').dropIndex('roomNumber_1');
    } catch (e) {
      // Index might not exist, that's fine
    }
    
    console.log('🧹 Cleared existing data');

    // Create default admin
    const admin = await Admin.create({
      username: process.env.ADMIN_USERNAME || 'thanhnam',
      password: process.env.ADMIN_PASSWORD || 'thanhtrung',
      name: 'Bà Tuất',
      email: 'batuat@example.com',
      phone: '0123456789',
      address: 'Hà Nội, Việt Nam'
    });
    console.log('👤 Created admin:', admin.username);

    // Create sample rooms
    const currentMonth = new Date().toISOString().slice(0, 7);
    const dueDate = new Date();
    dueDate.setDate(5);

    const rooms = await Room.create([
      {
        name: 'Phòng 101',
        status: 'occupied',
        monthlyRent: 2500000,
        dueDate: dueDate.toISOString().slice(0, 10),
        tenant: {
          name: 'Nguyễn Văn A',
          phone: '0987654321',
          identityCard: '001234567890',
          startDate: '2024-01-15'
        },
        utilities: {
          electricityUsed: 120,
          electricityRate: 3500,
          waterUsed: 15,
          waterRate: 25000,
          month: currentMonth
        }
      },
      {
        name: 'Phòng 102',
        status: 'available',
        monthlyRent: 2800000,
        dueDate: dueDate.toISOString().slice(0, 10),
        utilities: {
          electricityUsed: 0,
          electricityRate: 3500,
          waterUsed: 0,
          waterRate: 25000,
          month: currentMonth
        }
      },
      {
        name: 'Phòng 103',
        status: 'occupied',
        monthlyRent: 3000000,
        dueDate: dueDate.toISOString().slice(0, 10),
        tenant: {
          name: 'Trần Thị B',
          phone: '0912345678',
          identityCard: '001234567891',
          startDate: '2024-03-01'
        },
        utilities: {
          electricityUsed: 85,
          electricityRate: 3500,
          waterUsed: 10,
          waterRate: 25000,
          month: currentMonth
        }
      }
    ]);
    console.log(`🏠 Created ${rooms.length} rooms`);

    // Create sample client users
    const room1 = await Room.findOne({ name: 'Phòng 101' });
    const room3 = await Room.findOne({ name: 'Phòng 103' });

    const clientUsers = await ClientUser.create([
      {
        phone: '0987654321',
        accessCode: 'ABC123',
        roomId: room1._id,
        isActive: true
      },
      {
        phone: '0912345678',
        accessCode: 'XYZ789',
        roomId: room3._id,
        isActive: true
      }
    ]);
    console.log(`👥 Created ${clientUsers.length} client users`);

    console.log('\n✅ Seed completed successfully!');
    console.log('\n📋 Test credentials:');
    console.log('Admin: thanhnam / thanhtrung');
    console.log('Client 1: 0987654321 / ABC123');
    console.log('Client 2: 0912345678 / XYZ789');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

seed();
