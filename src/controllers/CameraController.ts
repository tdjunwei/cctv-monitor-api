import { Request, Response } from 'express';
import { CameraModel } from '../models';
import { ApiResponse, CreateCameraRequest, UpdateCameraRequest } from '../types';
import Joi from 'joi';

// Validation schemas
const createCameraSchema = Joi.object({
  name: Joi.string().required().min(1).max(255),
  location: Joi.string().required().min(1).max(255),
  streamUrl: Joi.string().uri().required(),
  resolution: Joi.string().valid('720p', '1080p', '4K').required(),
  type: Joi.string().valid('indoor', 'outdoor').required(),
  recordingEnabled: Joi.boolean().default(false)
});

const updateCameraSchema = Joi.object({
  name: Joi.string().min(1).max(255),
  location: Joi.string().min(1).max(255),
  streamUrl: Joi.string().uri(),
  resolution: Joi.string().valid('720p', '1080p', '4K'),
  type: Joi.string().valid('indoor', 'outdoor'),
  recordingEnabled: Joi.boolean(),
  isOnline: Joi.boolean(),
  lastMotionDetected: Joi.date()
});

export class CameraController {
  // Get all cameras
  static async getAllCameras(req: Request, res: Response): Promise<void> {
    try {
      const cameras = await CameraModel.getAll();
      
      const response: ApiResponse = {
        success: true,
        data: cameras,
        message: `Retrieved ${cameras.length} cameras`
      };
      
      res.json(response);
    } catch (error) {
      console.error('Error fetching cameras:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to fetch cameras'
      };
      res.status(500).json(response);
    }
  }

  // Get camera by ID
  static async getCameraById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const camera = await CameraModel.getById(id);
      
      if (!camera) {
        const response: ApiResponse = {
          success: false,
          error: 'Camera not found'
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: camera
      };
      
      res.json(response);
    } catch (error) {
      console.error('Error fetching camera:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to fetch camera'
      };
      res.status(500).json(response);
    }
  }

  // Create new camera
  static async createCamera(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const { error, value } = createCameraSchema.validate(req.body);
      if (error) {
        const response: ApiResponse = {
          success: false,
          error: error.details[0].message
        };
        res.status(400).json(response);
        return;
      }

      const cameraData: CreateCameraRequest = value;
      const camera = await CameraModel.create(cameraData);
      
      const response: ApiResponse = {
        success: true,
        data: camera,
        message: 'Camera created successfully'
      };
      
      res.status(201).json(response);
    } catch (error) {
      console.error('Error creating camera:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to create camera'
      };
      res.status(500).json(response);
    }
  }

  // Update camera
  static async updateCamera(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // Validate request body
      const { error, value } = updateCameraSchema.validate(req.body);
      if (error) {
        const response: ApiResponse = {
          success: false,
          error: error.details[0].message
        };
        res.status(400).json(response);
        return;
      }

      const updateData: UpdateCameraRequest = value;
      const camera = await CameraModel.update(id, updateData);
      
      if (!camera) {
        const response: ApiResponse = {
          success: false,
          error: 'Camera not found'
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: camera,
        message: 'Camera updated successfully'
      };
      
      res.json(response);
    } catch (error) {
      console.error('Error updating camera:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to update camera'
      };
      res.status(500).json(response);
    }
  }

  // Delete camera
  static async deleteCamera(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const success = await CameraModel.delete(id);
      
      if (!success) {
        const response: ApiResponse = {
          success: false,
          error: 'Camera not found'
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: 'Camera deleted successfully'
      };
      
      res.json(response);
    } catch (error) {
      console.error('Error deleting camera:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to delete camera'
      };
      res.status(500).json(response);
    }
  }

  // Get cameras by type
  static async getCamerasByType(req: Request, res: Response): Promise<void> {
    try {
      const { type } = req.params;
      
      if (type !== 'indoor' && type !== 'outdoor') {
        const response: ApiResponse = {
          success: false,
          error: 'Invalid camera type. Must be "indoor" or "outdoor"'
        };
        res.status(400).json(response);
        return;
      }

      const cameras = await CameraModel.getByType(type);
      
      const response: ApiResponse = {
        success: true,
        data: cameras,
        message: `Retrieved ${cameras.length} ${type} cameras`
      };
      
      res.json(response);
    } catch (error) {
      console.error('Error fetching cameras by type:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to fetch cameras'
      };
      res.status(500).json(response);
    }
  }

  // Update camera online status
  static async updateOnlineStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { isOnline } = req.body;
      
      if (typeof isOnline !== 'boolean') {
        const response: ApiResponse = {
          success: false,
          error: 'isOnline must be a boolean value'
        };
        res.status(400).json(response);
        return;
      }

      const success = await CameraModel.updateOnlineStatus(id, isOnline);
      
      if (!success) {
        const response: ApiResponse = {
          success: false,
          error: 'Camera not found'
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: `Camera status updated to ${isOnline ? 'online' : 'offline'}`
      };
      
      res.json(response);
    } catch (error) {
      console.error('Error updating camera status:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to update camera status'
      };
      res.status(500).json(response);
    }
  }
}
