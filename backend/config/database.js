const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/weaving_mill_db';
    console.log('[MONGODB] Attempting to connect to MongoDB...');
    console.log('[MONGODB] URI:', mongoURI.replace(/\/\/.*@/, '//***:***@')); // Hide credentials in logs
    
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // 10 seconds timeout
    });

    console.log(`[MONGODB] ✅ Connected successfully`);
    console.log(`[MONGODB] Host: ${conn.connection.host}`);
    console.log(`[MONGODB] Database: ${conn.connection.name}`);
    console.log(`[MONGODB] Ready State: ${conn.connection.readyState} (1=connected)`);
  } catch (error) {
    console.error(`[MONGODB] ❌ Connection Error: ${error.message}`);
    console.error(`[MONGODB] Error Code: ${error.code || 'N/A'}`);
    console.error('\n[MONGODB] 💡 Please ensure MongoDB is running:');
    console.error('   - Local: Start MongoDB service or run "mongod"');
    console.error('   - Cloud: Update MONGODB_URI in .env file');
    console.error('\n[MONGODB] ⚠️  Server will continue but database operations will fail.');
    // Don't exit - let server start so we can see the error
    // process.exit(1);
  }
};

module.exports = connectDB;

