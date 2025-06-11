import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '33006'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'cctv',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+00:00'
};

// Create connection pool
export const pool = mysql.createPool(dbConfig);

// Test connection function
export async function testConnection(): Promise<boolean> {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

// Execute query helper function
export async function executeQuery<T = unknown>(
  query: string,
  params: unknown[] = []
): Promise<T> {
  try {
    const [results] = await pool.execute(query, params);
    return results as T;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Get single row helper
export async function getOne<T = unknown>(
  query: string,
  params: unknown[] = []
): Promise<T | null> {
  const results = await executeQuery<T[]>(query, params);
  return results.length > 0 ? results[0] : null;
}

// Close all connections (useful for cleanup)
export async function closePool(): Promise<void> {
  await pool.end();
}

// Database health check
export async function healthCheck(): Promise<{
  status: 'healthy' | 'unhealthy';
  message: string;
  timestamp: Date;
}> {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    
    return {
      status: 'healthy',
      message: 'Database connection is healthy',
      timestamp: new Date()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Unknown database error',
      timestamp: new Date()
    };
  }
}
