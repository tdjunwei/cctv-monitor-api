import { executeQuery, getOne } from '../config/database';
import { Alert, CreateAlertRequest, DatabaseResult, AlertRow } from '../types';

export class AlertModel {
  // Get all alerts with optional filters
  static async getAll(filters?: {
    cameraId?: string;
    type?: string;
    severity?: string;
    isRead?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Alert[]> {
    let query = `
      SELECT 
        a.id, a.camera_id as cameraId, c.name as cameraName,
        a.type, a.message, a.severity, a.is_read as isRead,
        a.timestamp, a.thumbnail
      FROM alerts a
      LEFT JOIN cameras c ON a.camera_id = c.id
      WHERE 1=1
    `;
    
    const params: unknown[] = [];
    
    if (filters?.cameraId) {
      query += ' AND a.camera_id = ?';
      params.push(filters.cameraId);
    }
    
    if (filters?.type) {
      query += ' AND a.type = ?';
      params.push(filters.type);
    }
    
    if (filters?.severity) {
      query += ' AND a.severity = ?';
      params.push(filters.severity);
    }
    
    if (filters?.isRead !== undefined) {
      query += ' AND a.is_read = ?';
      params.push(filters.isRead);
    }
    
    query += ' ORDER BY a.timestamp DESC';
    
    if (filters?.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
      
      if (filters?.offset) {
        query += ' OFFSET ?';
        params.push(filters.offset);
      }
    }
    
    const alerts = await executeQuery<AlertRow[]>(query, params);
    return alerts.map(this.transformFromDb);
  }

  // Get alert by ID
  static async getById(id: string): Promise<Alert | null> {
    const query = `
      SELECT 
        a.id, a.camera_id as cameraId, c.name as cameraName,
        a.type, a.message, a.severity, a.is_read as isRead,
        a.timestamp, a.thumbnail
      FROM alerts a
      LEFT JOIN cameras c ON a.camera_id = c.id
      WHERE a.id = ?
    `;
    
    const alert = await getOne<AlertRow>(query, [id]);
    return alert ? this.transformFromDb(alert) : null;
  }

  // Create new alert
  static async create(alertData: CreateAlertRequest): Promise<Alert> {
    const id = Date.now().toString();
    const timestamp = new Date();
    
    const query = `
      INSERT INTO alerts (
        id, camera_id, type, message, severity, is_read, timestamp, thumbnail
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    await executeQuery(query, [
      id,
      alertData.cameraId,
      alertData.type,
      alertData.message,
      alertData.severity,
      false, // Default to unread
      timestamp,
      alertData.thumbnail
    ]);
    
    const alert = await this.getById(id);
    if (!alert) {
      throw new Error('Failed to create alert');
    }
    
    return alert;
  }

  // Mark alert as read
  static async markAsRead(id: string): Promise<boolean> {
    const query = 'UPDATE alerts SET is_read = 1 WHERE id = ?';
    const result = await executeQuery<DatabaseResult>(query, [id]);
    return result.affectedRows > 0;
  }

  // Mark multiple alerts as read
  static async markMultipleAsRead(ids: string[]): Promise<number> {
    if (ids.length === 0) return 0;
    
    const placeholders = ids.map(() => '?').join(',');
    const query = `UPDATE alerts SET is_read = 1 WHERE id IN (${placeholders})`;
    const result = await executeQuery<DatabaseResult>(query, ids);
    return result.affectedRows;
  }

  // Mark all alerts as read for a camera
  static async markAllAsReadForCamera(cameraId: string): Promise<number> {
    const query = 'UPDATE alerts SET is_read = 1 WHERE camera_id = ? AND is_read = 0';
    const result = await executeQuery<DatabaseResult>(query, [cameraId]);
    return result.affectedRows;
  }

  // Delete alert
  static async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM alerts WHERE id = ?';
    const result = await executeQuery<DatabaseResult>(query, [id]);
    return result.affectedRows > 0;
  }

  // Get unread alerts count
  static async getUnreadCount(): Promise<number> {
    const query = 'SELECT COUNT(*) as count FROM alerts WHERE is_read = 0';
    const result = await getOne<{ count: number }>(query);
    return result?.count || 0;
  }

  // Get recent alerts (last 24 hours)
  static async getRecent(limit: number = 10): Promise<Alert[]> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const query = `
      SELECT 
        a.id, a.camera_id as cameraId, c.name as cameraName,
        a.type, a.message, a.severity, a.is_read as isRead,
        a.timestamp, a.thumbnail
      FROM alerts a
      LEFT JOIN cameras c ON a.camera_id = c.id
      WHERE a.timestamp >= ?
      ORDER BY a.timestamp DESC
      LIMIT ?
    `;
    
    const alerts = await executeQuery<AlertRow[]>(query, [yesterday, limit]);
    return alerts.map(this.transformFromDb);
  }

  // Get alerts by camera ID
  static async getByCameraId(cameraId: string, limit?: number): Promise<Alert[]> {
    return this.getAll({ cameraId, limit });
  }

  // Get alerts statistics
  static async getStats(): Promise<{
    total: number;
    unread: number;
    byType: { [key: string]: number };
    bySeverity: { [key: string]: number };
  }> {
    const [totalResult, typeResults, severityResults] = await Promise.all([
      getOne<{ total: number; unread: number }>('SELECT COUNT(*) as total, SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) as unread FROM alerts'),
      executeQuery<{ type: string; count: number }[]>('SELECT type, COUNT(*) as count FROM alerts GROUP BY type'),
      executeQuery<{ severity: string; count: number }[]>('SELECT severity, COUNT(*) as count FROM alerts GROUP BY severity')
    ]);
    
    const byType: { [key: string]: number } = {};
    typeResults.forEach(row => {
      byType[row.type] = row.count;
    });
    
    const bySeverity: { [key: string]: number } = {};
    severityResults.forEach(row => {
      bySeverity[row.severity] = row.count;
    });
    
    return {
      total: totalResult?.total || 0,
      unread: totalResult?.unread || 0,
      byType,
      bySeverity
    };
  }

  // Transform database row to Alert interface
  private static transformFromDb(row: AlertRow): Alert {
    return {
      id: row.id,
      cameraId: row.cameraId || row.camera_id,
      cameraName: row.cameraName || 'Unknown Camera',
      type: row.type as Alert['type'],
      message: row.message,
      severity: row.severity as Alert['severity'],
      isRead: Boolean(row.isRead ?? row.is_read),
      timestamp: new Date(row.timestamp),
      thumbnail: row.thumbnail
    };
  }
}
