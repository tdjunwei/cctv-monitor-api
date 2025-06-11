import { Request, Response } from 'express';
import { AlertModel } from '../models';
import { ApiResponse, CreateAlertRequest } from '../types';
import Joi from 'joi';

// Validation schemas
const createAlertSchema = Joi.object({
  cameraId: Joi.string().required(),
  type: Joi.string().valid('motion', 'offline', 'recording_failed', 'storage_full').required(),
  message: Joi.string().required().min(1).max(1000),
  severity: Joi.string().valid('low', 'medium', 'high').required(),
  thumbnail: Joi.string().uri().optional()
});

export class AlertController {
  // Get all alerts
  static async getAllAlerts(req: Request, res: Response): Promise<void> {
    try {
      const { cameraId, type, severity, isRead, limit, offset } = req.query;
      
      const filters: {
        cameraId?: string;
        type?: string;
        severity?: string;
        isRead?: boolean;
        limit?: number;
        offset?: number;
      } = {};
      
      if (cameraId) filters.cameraId = cameraId as string;
      if (type) filters.type = type as string;
      if (severity) filters.severity = severity as string;
      if (isRead !== undefined) filters.isRead = isRead === 'true';
      if (limit) filters.limit = parseInt(limit as string);
      if (offset) filters.offset = parseInt(offset as string);

      const alerts = await AlertModel.getAll(filters);
      
      const response: ApiResponse = {
        success: true,
        data: alerts,
        message: `Retrieved ${alerts.length} alerts`
      };
      
      res.json(response);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to fetch alerts'
      };
      res.status(500).json(response);
    }
  }

  // Get alert by ID
  static async getAlertById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const alert = await AlertModel.getById(id);
      
      if (!alert) {
        const response: ApiResponse = {
          success: false,
          error: 'Alert not found'
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: alert
      };
      
      res.json(response);
    } catch (error) {
      console.error('Error fetching alert:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to fetch alert'
      };
      res.status(500).json(response);
    }
  }

  // Create new alert
  static async createAlert(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const { error, value } = createAlertSchema.validate(req.body);
      if (error) {
        const response: ApiResponse = {
          success: false,
          error: error.details[0].message
        };
        res.status(400).json(response);
        return;
      }

      const alertData: CreateAlertRequest = value;
      const alert = await AlertModel.create(alertData);
      
      const response: ApiResponse = {
        success: true,
        data: alert,
        message: 'Alert created successfully'
      };
      
      res.status(201).json(response);
    } catch (error) {
      console.error('Error creating alert:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to create alert'
      };
      res.status(500).json(response);
    }
  }

  // Mark alert as read
  static async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const success = await AlertModel.markAsRead(id);
      
      if (!success) {
        const response: ApiResponse = {
          success: false,
          error: 'Alert not found'
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: 'Alert marked as read'
      };
      
      res.json(response);
    } catch (error) {
      console.error('Error marking alert as read:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to mark alert as read'
      };
      res.status(500).json(response);
    }
  }

  // Mark multiple alerts as read
  static async markMultipleAsRead(req: Request, res: Response): Promise<void> {
    try {
      const { ids } = req.body;
      
      if (!Array.isArray(ids) || ids.length === 0) {
        const response: ApiResponse = {
          success: false,
          error: 'ids must be a non-empty array'
        };
        res.status(400).json(response);
        return;
      }

      const count = await AlertModel.markMultipleAsRead(ids);
      
      const response: ApiResponse = {
        success: true,
        message: `Marked ${count} alerts as read`
      };
      
      res.json(response);
    } catch (error) {
      console.error('Error marking alerts as read:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to mark alerts as read'
      };
      res.status(500).json(response);
    }
  }

  // Delete alert
  static async deleteAlert(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const success = await AlertModel.delete(id);
      
      if (!success) {
        const response: ApiResponse = {
          success: false,
          error: 'Alert not found'
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: 'Alert deleted successfully'
      };
      
      res.json(response);
    } catch (error) {
      console.error('Error deleting alert:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to delete alert'
      };
      res.status(500).json(response);
    }
  }

  // Get unread alerts count
  static async getUnreadCount(req: Request, res: Response): Promise<void> {
    try {
      const count = await AlertModel.getUnreadCount();
      
      const response: ApiResponse = {
        success: true,
        data: { count },
        message: `${count} unread alerts`
      };
      
      res.json(response);
    } catch (error) {
      console.error('Error fetching unread count:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to fetch unread count'
      };
      res.status(500).json(response);
    }
  }

  // Get recent alerts
  static async getRecentAlerts(req: Request, res: Response): Promise<void> {
    try {
      const { limit } = req.query;
      const alertLimit = limit ? parseInt(limit as string) : 10;
      
      const alerts = await AlertModel.getRecent(alertLimit);
      
      const response: ApiResponse = {
        success: true,
        data: alerts,
        message: `Retrieved ${alerts.length} recent alerts`
      };
      
      res.json(response);
    } catch (error) {
      console.error('Error fetching recent alerts:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to fetch recent alerts'
      };
      res.status(500).json(response);
    }
  }

  // Get alerts statistics
  static async getStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await AlertModel.getStats();
      
      const response: ApiResponse = {
        success: true,
        data: stats
      };
      
      res.json(response);
    } catch (error) {
      console.error('Error fetching alert stats:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to fetch alert statistics'
      };
      res.status(500).json(response);
    }
  }
}
