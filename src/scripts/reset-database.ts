import { executeQuery, testConnection } from '../config/database';

// SQL statements to drop all tables
const dropTables = [
  'DROP TABLE IF EXISTS alerts',
  'DROP TABLE IF EXISTS recordings', 
  'DROP TABLE IF EXISTS system_settings',
  'DROP TABLE IF EXISTS cameras'
];

// Reset database by dropping all tables
export async function resetDatabase(): Promise<boolean> {
  try {
    console.log('🔄 Resetting database...');
    
    // Test connection first
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Failed to connect to database');
    }

    // Drop all tables in correct order (due to foreign key constraints)
    console.log('  🗑️  Dropping existing tables...');
    for (const sql of dropTables) {
      await executeQuery(sql);
      console.log(`  ✓ Executed: ${sql}`);
    }
    console.log('✅ Database reset completed successfully - all tables dropped');
    console.log('💡 Run "npm run db:init" to recreate the tables');
    
    return true;
  } catch (error) {
    console.error('❌ Database reset failed:', error);
    return false;
  }
}

// Main execution if run directly
if (require.main === module) {
  resetDatabase()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Reset error:', error);
      process.exit(1);
    });
}
