// Quick test script to check MongoDB connection
require('dotenv').config();
const mongoose = require('mongoose');

const testConnection = async () => {
  try {
    console.log('Testing MongoDB connection...');
    console.log('MongoDB URI:', process.env.MONGODB_URI || 'Not set');
    
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/weaving_mill_db', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // 5 seconds timeout
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`Database: ${conn.connection.name}`);
    
    // Test a simple query
    const collections = await conn.connection.db.listCollections().toArray();
    console.log(`Collections: ${collections.length}`);
    
    await mongoose.connection.close();
    console.log('✅ Connection test successful!');
    process.exit(0);
  } catch (error) {
    console.error('❌ MongoDB Connection Error:');
    console.error(error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('1. Make sure MongoDB is installed and running');
    console.log('2. Check if MongoDB is running on port 27017');
    console.log('3. Try: mongod (to start MongoDB)');
    console.log('4. Or use MongoDB Atlas (cloud) and update MONGODB_URI in .env');
    process.exit(1);
  }
};

testConnection();

