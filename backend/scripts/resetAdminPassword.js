const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const NEW_PASSWORD = 'admin123'; // <-- Change this to your desired password

async function resetPassword() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const hashedPassword = await bcrypt.hash(NEW_PASSWORD, 10);

    const result = await mongoose.connection.db.collection('users').updateOne(
      { email: 'admin@example.com' },
      { $set: { password: hashedPassword } }
    );

    if (result.matchedCount === 0) {
      console.log('❌ No user found with email: admin@example.com');
    } else {
      console.log('✅ Admin password reset successfully!');
      console.log(`   Email:    admin@example.com`);
      console.log(`   Password: ${NEW_PASSWORD}`);
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

resetPassword();
