import { Request, Response } from 'express';
import { RecordingModel } from '../models';
import { ApiResponse, CreateRecordingRequest } from '../types';
import Joi from 'joi';

// Validation schemas
const createRecordingSchema = Joi.object({
  cameraId: Joi.string().required(),
  filename: Joi.string().required().min(1).max(255),
  duration: Joi.number().positive().required(),
  size: Joi.number().positive().required(),
  startTime: Joi.date().required(),
  endTime: Joi.date().greater(Joi.ref('startTime')).required(),
  thumbnail: Joi.string().uri().optional(),
  type: Joi.string().valid('scheduled', 'motion', 'manual').required()
});

export class RecordingController {
  // Get all recordings
  static async getAllRecordings(req: Request, res: Response): Promise<void> {
    try {
      const { cameraId, type, startDate, endDate, limit, offset } = req.query;
      
      const filters: any = {};
      if (cameraId) filters.cameraId = cameraId as string;
      if (type) filters.type = type as string;
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);
      if (limit) filters.limit = parseInt(limit as string);
      if (offset) filters.offset = parseInt(offset as string);

      const recordings = await RecordingModel.getAll(filters);
      
      const response: ApiResponse = {
        success: true,
        data: recordings,
        message: `Retrieved ${recordings.length} recordings`
      };
      
      res.json(response);
    } catch (error) {
      console.error('Error fetching recordings:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to fetch recordings'
      };
      res.status(500).json(response);
    }
  }

  // Get recording by ID
  static async getRecordingById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const recording = await RecordingModel.getById(id);
      
      if (!recording) {
        const response: ApiResponse = {
          success: false,
          error: 'Recording not found'
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: recording
      };
      
      res.json(response);
    } catch (error) {
      console.error('Error fetching recording:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to fetch recording'
      };
      res.status(500).json(response);
    }
  }

  // Create new recording
  static async createRecording(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const { error, value } = createRecordingSchema.validate(req.body);
      if (error) {
        const response: ApiResponse = {
          success: false,
          error: error.details[0].message
        };
        res.status(400).json(response);
        return;
      }

      const recordingData: CreateRecordingRequest = value;
      const recording = await RecordingModel.create(recordingData);
      
      const response: ApiResponse = {
        success: true,
        data: recording,
        message: 'Recording created successfully'
      };
      
      res.status(201).json(response);
    } catch (error) {
      console.error('Error creating recording:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to create recording'
      };
      res.status(500).json(response);
    }
  }

  // Delete recording
  static async deleteRecording(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const success = await RecordingModel.delete(id);
      
      if (!success) {
        const response: ApiResponse = {
          success: false,
          error: 'Recording not found'
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: 'Recording deleted successfully'
      };
      
      res.json(response);
    } catch (error) {
      console.error('Error deleting recording:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to delete recording'
      };
      res.status(500).json(response);
    }
  }

  // Get recordings by camera ID
  static async getRecordingsByCamera(req: Request, res: Response): Promise<void> {
    try {
      const { cameraId } = req.params;
      const { limit } = req.query;
      
      const recordingLimit = limit ? parseInt(limit as string) : undefined;
      const recordings = await RecordingModel.getByCameraId(cameraId, recordingLimit);
      
      const response: ApiResponse = {
        success: true,
        data: recordings,
        message: `Retrieved ${recordings.length} recordings for camera`
      };
      
      res.json(response);
    } catch (error) {
      console.error('Error fetching recordings by camera:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to fetch recordings'
      };
      res.status(500).json(response);
    }
  }

  // Get storage statistics
  static async getStorageStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await RecordingModel.getStorageStats();
      
      const response: ApiResponse = {
        success: true,
        data: stats
      };
      
      res.json(response);
    } catch (error) {
      console.error('Error fetching storage stats:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to fetch storage statistics'
      };
      res.status(500).json(response);
    }
  }
}
