import { resetDatabase } from './reset-database';
import { initializeDatabase } from './init-database';
import { seedDatabase } from './seed-database';

// Complete database reset and setup
export async function resetAndInit(): Promise<boolean> {
  try {
    console.log('🚀 Starting complete database reset and initialization...\n');

    // Step 1: Reset (drop all tables)
    console.log('Step 1: Resetting database...');
    const resetSuccess = await resetDatabase();
    if (!resetSuccess) {
      throw new Error('Failed to reset database');
    }
    console.log('');

    // Step 2: Initialize (create tables and settings)
    console.log('Step 2: Initializing database...');
    const initSuccess = await initializeDatabase();
    if (!initSuccess) {
      throw new Error('Failed to initialize database');
    }
    console.log('');

    // Step 3: Seed with sample data
    console.log('Step 3: Seeding database...');
    const seedSuccess = await seedDatabase();
    if (!seedSuccess) {
      throw new Error('Failed to seed database');
    }
    console.log('');

    console.log('🎉 Complete database reset and initialization finished successfully!');
    console.log('📊 Your CCTV monitor database is ready with sample data');
    return true;
  } catch (error) {
    console.error('❌ Complete database setup failed:', error);
    return false;
  }
}

// Main execution if run directly
if (require.main === module) {
  resetAndInit()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Setup error:', error);
      process.exit(1);
    });
}
