import { executeQuery, getOne } from '../config/database';
import { Camera, CreateCameraRequest, UpdateCameraRequest } from '../types';

export class CameraModel {
  // Get all cameras
  static async getAll(): Promise<Camera[]> {
    const query = `
      SELECT 
        id, name, location, stream_url as streamUrl, is_online as isOnline,
        last_motion_detected as lastMotionDetected, recording_enabled as recordingEnabled,
        resolution, type, created_at as createdAt, updated_at as updatedAt
      FROM cameras
      ORDER BY created_at DESC
    `;
    
    const cameras = await executeQuery<any[]>(query);
    return cameras.map(this.transformFromDb);
  }

  // Get camera by ID
  static async getById(id: string): Promise<Camera | null> {
    const query = `
      SELECT 
        id, name, location, stream_url as streamUrl, is_online as isOnline,
        last_motion_detected as lastMotionDetected, recording_enabled as recordingEnabled,
        resolution, type, created_at as createdAt, updated_at as updatedAt
      FROM cameras
      WHERE id = ?
    `;
    
    const camera = await getOne<any>(query, [id]);
    return camera ? this.transformFromDb(camera) : null;
  }

  // Create new camera
  static async create(cameraData: CreateCameraRequest): Promise<Camera> {
    const id = Date.now().toString();
    const now = new Date();
    
    const query = `
      INSERT INTO cameras (
        id, name, location, stream_url, is_online, recording_enabled,
        resolution, type, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    await executeQuery(query, [
      id,
      cameraData.name,
      cameraData.location,
      cameraData.streamUrl,
      true, // Default to online for new cameras
      cameraData.recordingEnabled || false,
      cameraData.resolution,
      cameraData.type,
      now,
      now
    ]);
    
    const camera = await this.getById(id);
    if (!camera) {
      throw new Error('Failed to create camera');
    }
    
    return camera;
  }

  // Update camera
  static async update(id: string, updates: UpdateCameraRequest): Promise<Camera | null> {
    const existing = await this.getById(id);
    if (!existing) {
      return null;
    }

    const updatedCamera = { ...existing, ...updates, updatedAt: new Date() };
    
    const query = `
      UPDATE cameras SET
        name = ?, location = ?, stream_url = ?, is_online = ?,
        last_motion_detected = ?, recording_enabled = ?, resolution = ?,
        type = ?, updated_at = ?
      WHERE id = ?
    `;
    
    await executeQuery(query, [
      updatedCamera.name,
      updatedCamera.location,
      updatedCamera.streamUrl,
      updatedCamera.isOnline,
      updatedCamera.lastMotionDetected,
      updatedCamera.recordingEnabled,
      updatedCamera.resolution,
      updatedCamera.type,
      updatedCamera.updatedAt,
      id
    ]);
    
    return this.getById(id);
  }

  // Delete camera
  static async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM cameras WHERE id = ?';
    const result = await executeQuery(query, [id]);
    return (result as any).affectedRows > 0;
  }

  // Get online cameras count
  static async getOnlineCount(): Promise<number> {
    const query = 'SELECT COUNT(*) as count FROM cameras WHERE is_online = 1';
    const result = await getOne<{ count: number }>(query);
    return result?.count || 0;
  }

  // Get offline cameras count
  static async getOfflineCount(): Promise<number> {
    const query = 'SELECT COUNT(*) as count FROM cameras WHERE is_online = 0';
    const result = await getOne<{ count: number }>(query);
    return result?.count || 0;
  }

  // Update camera online status
  static async updateOnlineStatus(id: string, isOnline: boolean): Promise<boolean> {
    const query = 'UPDATE cameras SET is_online = ?, updated_at = ? WHERE id = ?';
    const result = await executeQuery(query, [isOnline, new Date(), id]);
    return (result as any).affectedRows > 0;
  }

  // Update last motion detected
  static async updateLastMotion(id: string, timestamp: Date): Promise<boolean> {
    const query = 'UPDATE cameras SET last_motion_detected = ?, updated_at = ? WHERE id = ?';
    const result = await executeQuery(query, [timestamp, new Date(), id]);
    return (result as any).affectedRows > 0;
  }

  // Get cameras by type
  static async getByType(type: 'indoor' | 'outdoor'): Promise<Camera[]> {
    const query = `
      SELECT 
        id, name, location, stream_url as streamUrl, is_online as isOnline,
        last_motion_detected as lastMotionDetected, recording_enabled as recordingEnabled,
        resolution, type, created_at as createdAt, updated_at as updatedAt
      FROM cameras
      WHERE type = ?
      ORDER BY created_at DESC
    `;
    
    const cameras = await executeQuery<any[]>(query, [type]);
    return cameras.map(this.transformFromDb);
  }

  // Get recording enabled cameras
  static async getRecordingEnabled(): Promise<Camera[]> {
    const query = `
      SELECT 
        id, name, location, stream_url as streamUrl, is_online as isOnline,
        last_motion_detected as lastMotionDetected, recording_enabled as recordingEnabled,
        resolution, type, created_at as createdAt, updated_at as updatedAt
      FROM cameras
      WHERE recording_enabled = 1
      ORDER BY created_at DESC
    `;
    
    const cameras = await executeQuery<any[]>(query);
    return cameras.map(this.transformFromDb);
  }

  // Transform database row to Camera interface
  private static transformFromDb(row: any): Camera {
    return {
      id: row.id,
      name: row.name,
      location: row.location,
      streamUrl: row.streamUrl,
      isOnline: Boolean(row.isOnline),
      lastMotionDetected: row.lastMotionDetected ? new Date(row.lastMotionDetected) : undefined,
      recordingEnabled: Boolean(row.recordingEnabled),
      resolution: row.resolution,
      type: row.type,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt)
    };
  }
}
