import { Request, Response } from 'express';
import { CameraModel, RecordingModel, AlertModel } from '../models';
import { testConnection, healthCheck } from '../config/database';
import { ApiResponse } from '../types';

export class DashboardController {
  // Get dashboard statistics
  static async getDashboardStats(req: Request, res: Response): Promise<void> {
    try {
      const [
        totalCameras,
        onlineCameras,
        offlineCameras,
        totalRecordings,
        unreadAlerts,
        storageStats
      ] = await Promise.all([
        CameraModel.getAll().then(cameras => cameras.length),
        CameraModel.getOnlineCount(),
        CameraModel.getOfflineCount(),
        RecordingModel.getTotalCount(),
        AlertModel.getUnreadCount(),
        RecordingModel.getStorageStats()
      ]);

      // Get last motion detected
      const cameras = await CameraModel.getAll();
      const lastMotionDetected = cameras
        .filter(camera => camera.lastMotionDetected)
        .sort((a, b) => 
          (b.lastMotionDetected?.getTime() || 0) - (a.lastMotionDetected?.getTime() || 0)
        )[0]?.lastMotionDetected;

      const stats = {
        totalCameras,
        onlineCameras,
        offlineCameras,
        totalRecordings,
        storageUsed: Number((storageStats.totalSize / 1024).toFixed(2)), // Convert MB to GB
        storageTotal: 500, // This would typically come from system info
        unreadAlerts,
        lastMotionDetected
      };

      const response: ApiResponse = {
        success: true,
        data: stats
      };
      
      res.json(response);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to fetch dashboard statistics'
      };
      res.status(500).json(response);
    }
  }

  // Get system health
  static async getSystemHealth(req: Request, res: Response): Promise<void> {
    try {
      const dbHealth = await healthCheck();
      const uptime = process.uptime();
      const memoryUsage = process.memoryUsage();

      const health = {
        status: dbHealth.status === 'healthy' ? 'healthy' : 'unhealthy',
        uptime: Math.floor(uptime),
        database: dbHealth,
        memory: {
          rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
          external: Math.round(memoryUsage.external / 1024 / 1024) // MB
        },
        timestamp: new Date()
      };

      const response: ApiResponse = {
        success: true,
        data: health
      };
      
      res.json(response);
    } catch (error) {
      console.error('Error fetching system health:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to fetch system health'
      };
      res.status(500).json(response);
    }
  }

  // Test database connection
  static async testDatabaseConnection(req: Request, res: Response): Promise<void> {
    try {
      const isConnected = await testConnection();
      
      const response: ApiResponse = {
        success: isConnected,
        data: { connected: isConnected },
        message: isConnected ? 'Database connection successful' : 'Database connection failed'
      };
      
      if (isConnected) {
        res.json(response);
      } else {
        res.status(500).json(response);
      }
    } catch (error) {
      console.error('Error testing database connection:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to test database connection'
      };
      res.status(500).json(response);
    }
  }
}
