const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Default admin credentials - change after first login!
const ADMIN_USERNAME = 'admin';
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'admin123';

async function setupDatabase() {
  try {
    const mongoURI = process.env.MONGODB_URI;

    if (!mongoURI) {
      console.error('❌ MONGODB_URI is not set in .env file');
      console.error('');
      console.error('Please create a .env file in the backend folder with:');
      console.error('  MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/weaving_mill_db?retryWrites=true&w=majority');
      console.error('');
      console.error('See .env.example for reference.');
      process.exit(1);
    }

    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 15000,
    });
    console.log('✅ Connected to MongoDB successfully!\n');

    const usersCollection = mongoose.connection.db.collection('users');

    // Check if admin already exists
    const existingAdmin = await usersCollection.findOne({ email: ADMIN_EMAIL });

    if (existingAdmin) {
      console.log('ℹ️  Admin user already exists:');
      console.log(`   Email:    ${existingAdmin.email}`);
      console.log(`   Username: ${existingAdmin.username}`);
      console.log(`   Role:     ${existingAdmin.role}`);
      console.log('');
      console.log('If you need to reset the password, run:');
      console.log('  node scripts/resetAdminPassword.js');
    } else {
      // Create admin user
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

      await usersCollection.insertOne({
        username: ADMIN_USERNAME,
        email: ADMIN_EMAIL,
        password: hashedPassword,
        role: 'admin',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log('✅ Admin user created successfully!');
      console.log(`   Email:    ${ADMIN_EMAIL}`);
      console.log(`   Password: ${ADMIN_PASSWORD}`);
      console.log(`   Role:     admin`);
      console.log('');
      console.log('⚠️  Please change the password after first login!');
    }

    // Show database info
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n📂 Database collections:');
    if (collections.length === 0) {
      console.log('   (none yet — they will be created when you start using the app)');
    } else {
      for (const col of collections) {
        const count = await mongoose.connection.db.collection(col.name).countDocuments();
        console.log(`   - ${col.name} (${count} documents)`);
      }
    }

    console.log('\n🎉 Setup complete! You can now start the server with: npm start');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    
    if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
      console.error('\n💡 Could not reach the MongoDB server. Check:');
      console.error('   - Your internet connection');
      console.error('   - The cluster URL in your .env file');
    } else if (error.message.includes('Authentication') || error.message.includes('auth')) {
      console.error('\n💡 Authentication failed. Check:');
      console.error('   - Username and password in your MONGODB_URI');
      console.error('   - That the database user exists in Atlas → Database Access');
    } else if (error.message.includes('IP') || error.message.includes('whitelist')) {
      console.error('\n💡 Your IP may not be whitelisted. Go to:');
      console.error('   Atlas → Network Access → Add IP Address → Add Current IP');
    }
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

setupDatabase();
