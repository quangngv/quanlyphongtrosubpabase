require('dotenv').config();
const { supabase } = require('./supabase');
const bcrypt = require('bcryptjs');

async function updateAdminPassword() {
  console.log('🔐 Updating admin password...');

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash('thanhtrung', 12);
    console.log('Generated hash:', hashedPassword);

    // Update admin password
    const { data, error } = await supabase
      .from('admins')
      .update({ password: hashedPassword })
      .eq('username', 'thanhnam')
      .select();

    if (error) {
      console.error('❌ Error updating password:', error);
      process.exit(1);
    }

    console.log('✅ Password updated successfully!');
    console.log('Admin:', data[0].username);
    console.log('You can now login with: thanhnam/thanhtrung');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

updateAdminPassword();
