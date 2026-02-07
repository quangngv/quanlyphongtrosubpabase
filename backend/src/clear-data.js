require('dotenv').config();
const { supabase } = require('./supabase');

async function clearDatabase() {
  console.log('🗑️  Clearing all data from database...');

  try {
    // Delete all payment history
    const { error: paymentError } = await supabase
      .from('payment_history')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (paymentError) {
      console.error('Error deleting payment history:', paymentError);
    } else {
      console.log('✅ Deleted all payment history');
    }

    // Delete all client users
    const { error: clientError } = await supabase
      .from('client_users')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (clientError) {
      console.error('Error deleting client users:', clientError);
    } else {
      console.log('✅ Deleted all client users');
    }

    // Delete all rooms
    const { error: roomError } = await supabase
      .from('rooms')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (roomError) {
      console.error('Error deleting rooms:', roomError);
    } else {
      console.log('✅ Deleted all rooms');
    }

    // Keep admin account - don't delete admins table

    console.log('');
    console.log('🎉 Database cleared successfully!');
    console.log('');
    console.log('Admin account is still active:');
    console.log('  Username: thanhnam');
    console.log('  Password: thanhtrung');
    console.log('');
    console.log('You can now add new rooms manually or run seed again.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

clearDatabase();
