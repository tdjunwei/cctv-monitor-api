import { executeQuery, getOne } from '../config/database';
import { Recording, CreateRecordingRequest } from '../types';

export class RecordingModel {
  // Get all recordings with optional filters
  static async getAll(filters?: {
    cameraId?: string;
    type?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<Recording[]> {
    let query = `
      SELECT 
        r.id, r.camera_id as cameraId, c.name as cameraName,
        r.filename, r.duration, r.size, r.start_time as startTime,
        r.end_time as endTime, r.thumbnail, r.type
      FROM recordings r
      LEFT JOIN cameras c ON r.camera_id = c.id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    
    if (filters?.cameraId) {
      query += ' AND r.camera_id = ?';
      params.push(filters.cameraId);
    }
    
    if (filters?.type) {
      query += ' AND r.type = ?';
      params.push(filters.type);
    }
    
    if (filters?.startDate) {
      query += ' AND r.start_time >= ?';
      params.push(filters.startDate);
    }
    
    if (filters?.endDate) {
      query += ' AND r.end_time <= ?';
      params.push(filters.endDate);
    }
    
    query += ' ORDER BY r.start_time DESC';
    
    if (filters?.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
      
      if (filters?.offset) {
        query += ' OFFSET ?';
        params.push(filters.offset);
      }
    }
    
    const recordings = await executeQuery<any[]>(query, params);
    return recordings.map(this.transformFromDb);
  }

  // Get recording by ID
  static async getById(id: string): Promise<Recording | null> {
    const query = `
      SELECT 
        r.id, r.camera_id as cameraId, c.name as cameraName,
        r.filename, r.duration, r.size, r.start_time as startTime,
        r.end_time as endTime, r.thumbnail, r.type
      FROM recordings r
      LEFT JOIN cameras c ON r.camera_id = c.id
      WHERE r.id = ?
    `;
    
    const recording = await getOne<any>(query, [id]);
    return recording ? this.transformFromDb(recording) : null;
  }

  // Create new recording
  static async create(recordingData: CreateRecordingRequest): Promise<Recording> {
    const id = Date.now().toString();
    
    const query = `
      INSERT INTO recordings (
        id, camera_id, filename, duration, size, start_time, end_time, thumbnail, type, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    await executeQuery(query, [
      id,
      recordingData.cameraId,
      recordingData.filename,
      recordingData.duration,
      recordingData.size,
      recordingData.startTime,
      recordingData.endTime,
      recordingData.thumbnail,
      recordingData.type,
      new Date()
    ]);
    
    const recording = await this.getById(id);
    if (!recording) {
      throw new Error('Failed to create recording');
    }
    
    return recording;
  }

  // Delete recording
  static async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM recordings WHERE id = ?';
    const result = await executeQuery(query, [id]);
    return (result as any).affectedRows > 0;
  }

  // Get recordings by camera ID
  static async getByCameraId(cameraId: string, limit?: number): Promise<Recording[]> {
    return this.getAll({ cameraId, limit });
  }

  // Get storage usage statistics
  static async getStorageStats(): Promise<{
    totalRecordings: number;
    totalSize: number;
    sizeByType: { [key: string]: number };
  }> {
    const totalQuery = 'SELECT COUNT(*) as count, SUM(size) as totalSize FROM recordings';
    const typeQuery = 'SELECT type, SUM(size) as size FROM recordings GROUP BY type';
    
    const [totalResult, typeResults] = await Promise.all([
      getOne<{ count: number; totalSize: number }>(totalQuery),
      executeQuery<{ type: string; size: number }[]>(typeQuery)
    ]);
    
    const sizeByType: { [key: string]: number } = {};
    typeResults.forEach(row => {
      sizeByType[row.type] = row.size;
    });
    
    return {
      totalRecordings: totalResult?.count || 0,
      totalSize: totalResult?.totalSize || 0,
      sizeByType
    };
  }

  // Get recordings count
  static async getTotalCount(): Promise<number> {
    const query = 'SELECT COUNT(*) as count FROM recordings';
    const result = await getOne<{ count: number }>(query);
    return result?.count || 0;
  }

  // Transform database row to Recording interface
  private static transformFromDb(row: any): Recording {
    return {
      id: row.id,
      cameraId: row.cameraId,
      cameraName: row.cameraName || 'Unknown Camera',
      filename: row.filename,
      duration: row.duration,
      size: row.size,
      startTime: new Date(row.startTime),
      endTime: new Date(row.endTime),
      thumbnail: row.thumbnail,
      type: row.type
    };
  }
}
