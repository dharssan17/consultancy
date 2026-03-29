/**
 * Migration script to ensure all existing users have a role assigned
 * Run this once to update existing users without roles
 * 
 * Usage: node scripts/migrateUserRoles.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const migrateUserRoles = async () => {
  try {
    console.log('[MIGRATION] Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[MIGRATION] Connected to MongoDB');

    // Find all users without a role
    const usersWithoutRole = await User.find({ 
      $or: [
        { role: { $exists: false } },
        { role: null },
        { role: '' }
      ]
    });

    console.log(`[MIGRATION] Found ${usersWithoutRole.length} users without role`);

    if (usersWithoutRole.length === 0) {
      console.log('[MIGRATION] No users need migration. Exiting.');
      await mongoose.connection.close();
      return;
    }

    // Update all users without role to have default 'data_entry' role
    const result = await User.updateMany(
      {
        $or: [
          { role: { $exists: false } },
          { role: null },
          { role: '' }
        ]
      },
      {
        $set: { role: 'data_entry' }
      }
    );

    console.log(`[MIGRATION] Updated ${result.modifiedCount} users with default role 'data_entry'`);
    console.log('[MIGRATION] Migration completed successfully');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('[MIGRATION] Error during migration:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run migration
migrateUserRoles();

