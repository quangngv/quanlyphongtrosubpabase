require('dotenv').config();
const { supabase } = require('./supabase');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function seed() {
  console.log('🌱 Starting database seed...');

  try {
    // Check if admin exists
    const { data: existingAdmin } = await supabase
      .from('admins')
      .select('id')
      .eq('username', 'thanhnam')
      .single();

    if (!existingAdmin) {
      // Create default admin
      const hashedPassword = await bcrypt.hash('thanhtrung', 12);
      const { error: adminError } = await supabase
        .from('admins')
        .insert({
          username: 'thanhnam',
          password: hashedPassword,
          name: 'Bà Tuất',
          email: 'batuat@example.com',
          phone: '0123456789',
          address: 'Hà Nội, Việt Nam'
        });

      if (adminError) {
        console.error('Error creating admin:', adminError);
      } else {
        console.log('✅ Created default admin: thanhnam/thanhtrung');
      }
    } else {
      console.log('ℹ️  Admin already exists');
    }

    // Check if rooms exist
    const { data: existingRooms } = await supabase
      .from('rooms')
      .select('id')
      .limit(1);

    if (!existingRooms || existingRooms.length === 0) {
      // Create sample rooms
      const currentMonth = new Date().toISOString().slice(0, 7);
      const sampleRooms = [
        {
          name: 'Phòng 101',
          monthly_rent: 2500000,
          due_date: new Date().toISOString().slice(0, 10),
          electricity_rate: 3500,
          water_rate: 30000,
          electricity_used: 0,
          water_used: 0,
          utilities_month: currentMonth,
          status: 'available'
        },
        {
          name: 'Phòng 102',
          monthly_rent: 2800000,
          due_date: new Date().toISOString().slice(0, 10),
          electricity_rate: 3500,
          water_rate: 30000,
          electricity_used: 50,
          water_used: 5,
          utilities_month: currentMonth,
          status: 'occupied',
          tenant_name: 'Nguyễn Văn A',
          tenant_phone: '0987654321',
          tenant_identity_card: '001234567890',
          tenant_start_date: '2024-01-01'
        },
        {
          name: 'Phòng 103',
          monthly_rent: 3000000,
          due_date: new Date().toISOString().slice(0, 10),
          electricity_rate: 3500,
          water_rate: 30000,
          electricity_used: 0,
          water_used: 0,
          utilities_month: currentMonth,
          status: 'available'
        },
        {
          name: 'Phòng 201',
          monthly_rent: 2600000,
          due_date: new Date().toISOString().slice(0, 10),
          electricity_rate: 3500,
          water_rate: 30000,
          electricity_used: 45,
          water_used: 4,
          utilities_month: currentMonth,
          status: 'occupied',
          tenant_name: 'Trần Thị B',
          tenant_phone: '0912345678',
          tenant_identity_card: '001234567891',
          tenant_start_date: '2024-02-15'
        },
        {
          name: 'Phòng 202',
          monthly_rent: 2700000,
          due_date: new Date().toISOString().slice(0, 10),
          electricity_rate: 3500,
          water_rate: 30000,
          electricity_used: 0,
          water_used: 0,
          utilities_month: currentMonth,
          status: 'available'
        }
      ];

      const { data: rooms, error: roomsError } = await supabase
        .from('rooms')
        .insert(sampleRooms)
        .select();

      if (roomsError) {
        console.error('Error creating rooms:', roomsError);
      } else {
        console.log(`✅ Created ${rooms.length} sample rooms`);

        // Create client users for occupied rooms
        const occupiedRooms = rooms.filter(r => r.status === 'occupied');
        for (const room of occupiedRooms) {
          const { error: userError } = await supabase
            .from('client_users')
            .insert({
              phone: room.tenant_phone,
              access_code: 'ABC123',
              room_id: room.id,
              is_active: true
            });

          if (!userError) {
            console.log(`✅ Created client user for ${room.name}`);
          }
        }
      }
    } else {
      console.log('ℹ️  Rooms already exist');
    }

    console.log('🎉 Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

seed();
