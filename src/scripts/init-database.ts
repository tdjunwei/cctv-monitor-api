import { executeQuery, testConnection } from '../config/database';

// SQL statements to create the required tables
const createTables = [
  // Cameras table
  `CREATE TABLE IF NOT EXISTS cameras (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    stream_url TEXT NOT NULL,
    is_online BOOLEAN DEFAULT TRUE,
    last_motion_detected DATETIME NULL,
    recording_enabled BOOLEAN DEFAULT TRUE,
    resolution VARCHAR(10) NOT NULL DEFAULT '1080p',
    type ENUM('indoor', 'outdoor') NOT NULL DEFAULT 'indoor',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_cameras_type (type),
    INDEX idx_cameras_online (is_online),
    INDEX idx_cameras_recording (recording_enabled)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // Recordings table
  `CREATE TABLE IF NOT EXISTS recordings (
    id VARCHAR(255) PRIMARY KEY,
    camera_id VARCHAR(255) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    duration INT NOT NULL DEFAULT 0,
    size DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    thumbnail TEXT NULL,
    type ENUM('scheduled', 'motion', 'manual') NOT NULL DEFAULT 'manual',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (camera_id) REFERENCES cameras(id) ON DELETE CASCADE,
    INDEX idx_recordings_camera (camera_id),
    INDEX idx_recordings_type (type),
    INDEX idx_recordings_start_time (start_time),
    INDEX idx_recordings_end_time (end_time)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // Alerts table
  `CREATE TABLE IF NOT EXISTS alerts (
    id VARCHAR(255) PRIMARY KEY,
    camera_id VARCHAR(255) NOT NULL,
    type ENUM('motion', 'offline', 'recording_failed', 'storage_full') NOT NULL,
    message TEXT NOT NULL,
    severity ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium',
    is_read BOOLEAN DEFAULT FALSE,
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    thumbnail TEXT NULL,
    FOREIGN KEY (camera_id) REFERENCES cameras(id) ON DELETE CASCADE,
    INDEX idx_alerts_camera (camera_id),
    INDEX idx_alerts_type (type),
    INDEX idx_alerts_severity (severity),
    INDEX idx_alerts_read (is_read),
    INDEX idx_alerts_timestamp (timestamp)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // System settings table
  `CREATE TABLE IF NOT EXISTS system_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    data_type ENUM('string', 'number', 'boolean', 'json') NOT NULL DEFAULT 'string',
    description TEXT NULL,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_settings_key (setting_key)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // Insert default system settings
  `INSERT IGNORE INTO system_settings (setting_key, setting_value, data_type, description) VALUES
    ('recording_quality', 'high', 'string', 'Default recording quality: low, medium, high, ultra'),
    ('storage_retention_days', '30', 'number', 'Number of days to retain recordings'),
    ('motion_sensitivity', '5', 'number', 'Motion detection sensitivity (1-10)'),
    ('notifications_enabled', 'true', 'boolean', 'Enable system notifications'),
    ('email_alerts', 'false', 'boolean', 'Enable email alerts'),
    ('max_concurrent_streams', '4', 'number', 'Maximum concurrent camera streams'),
    ('night_vision_enabled', 'true', 'boolean', 'Enable night vision mode'),
    ('audio_recording_enabled', 'false', 'boolean', 'Enable audio recording')`
];

// Initialize database tables
export async function initializeDatabase(): Promise<boolean> {
  try {
    console.log('🔄 Initializing database...');
    
    // Test connection first
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Failed to connect to database');
    }

    // Create tables
    for (const sql of createTables) {
      await executeQuery(sql);
    }

    console.log('✅ Database initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    return false;
  }
}

// Main execution if run directly
if (require.main === module) {
  initializeDatabase()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Initialization error:', error);
      process.exit(1);
    });
}
