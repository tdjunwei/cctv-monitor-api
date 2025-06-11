import { executeQuery, testConnection } from '../config/database';

// Sample data for seeding
const sampleCameras = [
  {
    id: '1',
    name: 'Front Door',
    location: 'Main Entrance',
    stream_url: 'rtsp://192.168.1.100:554/stream1',
    is_online: true,
    recording_enabled: true,
    resolution: '1080p',
    type: 'outdoor',
    onvif_enabled: true,
    onvif_host: '192.168.1.100',
    onvif_port: 80,
    onvif_username: 'admin',
    onvif_password: 'admin123',
    onvif_profile_token: 'profile_1'
  },
  {
    id: '2',
    name: 'Living Room',
    location: 'Interior Living Area',
    stream_url: 'rtsp://192.168.1.101:554/stream1',
    is_online: true,
    recording_enabled: true,
    resolution: '720p',
    type: 'indoor',
    onvif_enabled: false,
    onvif_host: null,
    onvif_port: null,
    onvif_username: null,
    onvif_password: null,
    onvif_profile_token: null
  },
  {
    id: '3',
    name: 'Backyard',
    location: 'Garden Area',
    stream_url: 'rtsp://192.168.1.102:554/stream1',
    is_online: false,
    recording_enabled: true,
    resolution: '4K',
    type: 'outdoor',
    onvif_enabled: true,
    onvif_host: '192.168.1.102',
    onvif_port: 80,
    onvif_username: 'admin',
    onvif_password: 'password',
    onvif_profile_token: 'profile_2'
  },
  {
    id: '4',
    name: 'Garage',
    location: 'Side Entrance',
    stream_url: 'rtsp://192.168.1.103:554/stream1',
    is_online: true,
    recording_enabled: false,
    resolution: '1080p',
    type: 'indoor',
    onvif_enabled: false,
    onvif_host: null,
    onvif_port: null,
    onvif_username: null,
    onvif_password: null,
    onvif_profile_token: null
  }
];

const sampleRecordings = [
  {
    id: '1',
    camera_id: '1',
    filename: 'front_door_20240611_120000.mp4',
    duration: 300,
    size: 45.2,
    start_time: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    end_time: new Date(Date.now() - 2 * 60 * 60 * 1000 + 5 * 60 * 1000), // 2 hours ago + 5 minutes
    type: 'motion'
  },
  {
    id: '2',
    camera_id: '2',
    filename: 'living_room_20240611_100000.mp4',
    duration: 1800,
    size: 120.5,
    start_time: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    end_time: new Date(Date.now() - 4 * 60 * 60 * 1000 + 30 * 60 * 1000), // 4 hours ago + 30 minutes
    type: 'scheduled'
  },
  {
    id: '3',
    camera_id: '1',
    filename: 'front_door_20240611_080000.mp4',
    duration: 600,
    size: 89.3,
    start_time: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    end_time: new Date(Date.now() - 6 * 60 * 60 * 1000 + 10 * 60 * 1000), // 6 hours ago + 10 minutes
    type: 'manual'
  }
];

const sampleAlerts = [
  {
    id: '1',
    camera_id: '1',
    type: 'motion',
    message: 'Motion detected at main entrance',
    severity: 'medium',
    is_read: false,
    timestamp: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
  },
  {
    id: '2',
    camera_id: '3',
    type: 'offline',
    message: 'Camera went offline',
    severity: 'high',
    is_read: false,
    timestamp: new Date(Date.now() - 60 * 60 * 1000) // 1 hour ago
  },
  {
    id: '3',
    camera_id: '2',
    type: 'motion',
    message: 'Motion detected in living room',
    severity: 'low',
    is_read: true,
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
  }
];

// Seed database with sample data
export async function seedDatabase(): Promise<boolean> {
  try {
    console.log('🔄 Seeding database with sample data...');

    // Test connection first
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Failed to connect to database');
    }

    // Insert sample cameras
    for (const camera of sampleCameras) {
      const checkQuery = 'SELECT id FROM cameras WHERE id = ?';
      const existing = await executeQuery(checkQuery, [camera.id]);
      
      if ((existing as any[]).length === 0) {
        const insertQuery = `
          INSERT INTO cameras (
            id, name, location, stream_url, is_online, recording_enabled, resolution, type,
            onvif_enabled, onvif_host, onvif_port, onvif_username, onvif_password, onvif_profile_token
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        await executeQuery(insertQuery, [
          camera.id, camera.name, camera.location, camera.stream_url,
          camera.is_online, camera.recording_enabled, camera.resolution, camera.type,
          camera.onvif_enabled, camera.onvif_host, camera.onvif_port, 
          camera.onvif_username, camera.onvif_password, camera.onvif_profile_token
        ]);
        console.log(`  ✓ Created camera: ${camera.name}`);
      } else {
        console.log(`  - Camera already exists: ${camera.name}`);
      }
    }

    // Insert sample recordings
    for (const recording of sampleRecordings) {
      const checkQuery = 'SELECT id FROM recordings WHERE id = ?';
      const existing = await executeQuery(checkQuery, [recording.id]);
      
      if ((existing as any[]).length === 0) {
        const insertQuery = `
          INSERT INTO recordings (id, camera_id, filename, duration, size, start_time, end_time, type)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        await executeQuery(insertQuery, [
          recording.id, recording.camera_id, recording.filename, recording.duration,
          recording.size, recording.start_time, recording.end_time, recording.type
        ]);
        console.log(`  ✓ Created recording: ${recording.filename}`);
      } else {
        console.log(`  - Recording already exists: ${recording.filename}`);
      }
    }

    // Insert sample alerts
    for (const alert of sampleAlerts) {
      const checkQuery = 'SELECT id FROM alerts WHERE id = ?';
      const existing = await executeQuery(checkQuery, [alert.id]);
      
      if ((existing as any[]).length === 0) {
        const insertQuery = `
          INSERT INTO alerts (id, camera_id, type, message, severity, is_read, timestamp)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        await executeQuery(insertQuery, [
          alert.id, alert.camera_id, alert.type, alert.message,
          alert.severity, alert.is_read, alert.timestamp
        ]);
        console.log(`  ✓ Created alert: ${alert.message}`);
      } else {
        console.log(`  - Alert already exists: ${alert.message}`);
      }
    }

    console.log('✅ Database seeded successfully');
    return true;
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    return false;
  }
}

// Main execution if run directly
if (require.main === module) {
  seedDatabase()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Seeding error:', error);
      process.exit(1);
    });
}
