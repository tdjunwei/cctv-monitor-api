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
  recordingEnabled: Joi.boolean().default(false),
  // ONVIF Support
  onvifEnabled: Joi.boolean().default(false),
  onvifHost: Joi.string().ip().optional().allow(null, ''),
  onvifPort: Joi.number().integer().min(1).max(65535).default(80),
  onvifUsername: Joi.string().min(1).max(255).optional().allow(null, ''),
  onvifPassword: Joi.string().min(1).max(255).optional().allow(null, '')
});

const updateCameraSchema = Joi.object({
  name: Joi.string().min(1).max(255),
  location: Joi.string().min(1).max(255),
  streamUrl: Joi.string().uri(),
  resolution: Joi.string().valid('720p', '1080p', '4K'),
  type: Joi.string().valid('indoor', 'outdoor'),
  recordingEnabled: Joi.boolean(),
  isOnline: Joi.boolean(),
  lastMotionDetected: Joi.date(),
  // ONVIF Support
  onvifEnabled: Joi.boolean(),
  onvifHost: Joi.string().ip().optional().allow(null, ''),
  onvifPort: Joi.number().integer().min(1).max(65535),
  onvifUsername: Joi.string().min(1).max(255).optional().allow(null, ''),
  onvifPassword: Joi.string().min(1).max(255).optional().allow(null, ''),
  onvifProfileToken: Joi.string().optional().allow(null, ''),
  onvifCapabilities: Joi.object().optional().allow(null)
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

  // ONVIF Discovery endpoint
  static async discoverONVIFDevices(req: Request, res: Response): Promise<void> {
    try {
      const { ONVIFService } = await import('../services');
      const { timeout } = req.query;
      
      const discoveryTimeout = timeout ? parseInt(timeout as string) : 5000;
      const result = await ONVIFService.discoverDevices(discoveryTimeout);
      
      const response: ApiResponse = {
        success: true,
        data: result,
        message: `Found ${result.devices.length} ONVIF devices`
      };
      
      res.json(response);
    } catch (error) {
      console.error('Error discovering ONVIF devices:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to discover ONVIF devices'
      };
      res.status(500).json(response);
    }
  }

  // Test ONVIF connection
  static async testONVIFConnection(req: Request, res: Response): Promise<void> {
    try {
      const { ONVIFService } = await import('../services');
      const { host, port, username, password } = req.body;
      
      if (!host || !username || !password) {
        const response: ApiResponse = {
          success: false,
          error: 'Host, username, and password are required'
        };
        res.status(400).json(response);
        return;
      }
      
      const result = await ONVIFService.testConnection(
        host,
        port || 80,
        { username, password }
      );
      
      // Remove the device object from the response to avoid serialization issues
      const { device, ...safeResult } = result;
      
      const response: ApiResponse = {
        success: result.success,
        data: safeResult,
        message: result.success ? 'ONVIF connection successful' : 'ONVIF connection failed'
      };
      
      if (!result.success) {
        res.status(400).json(response);
      } else {
        res.json(response);
      }
    } catch (error) {
      console.error('Error testing ONVIF connection:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to test ONVIF connection'
      };
      res.status(500).json(response);
    }
  }

  // Get ONVIF capabilities for a camera
  static async getONVIFCapabilities(req: Request, res: Response): Promise<void> {
    try {
      const { ONVIFService } = await import('../services');
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
      
      if (!camera.onvifEnabled || !camera.onvifHost || !camera.onvifUsername || !camera.onvifPassword) {
        const response: ApiResponse = {
          success: false,
          error: 'Camera does not have ONVIF configured'
        };
        res.status(400).json(response);
        return;
      }
      
      const device = await ONVIFService.connectDevice(
        camera.onvifHost,
        camera.onvifPort || 80,
        { username: camera.onvifUsername, password: camera.onvifPassword }
      );
      
      const capabilities = await ONVIFService.getDeviceCapabilities(device);
      const profiles = await ONVIFService.getProfiles(device);
      
      const response: ApiResponse = {
        success: true,
        data: { capabilities, profiles },
        message: 'Retrieved ONVIF capabilities successfully'
      };
      
      res.json(response);
    } catch (error) {
      console.error('Error getting ONVIF capabilities:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to get ONVIF capabilities'
      };
      res.status(500).json(response);
    }
  }

  // Control PTZ (Pan-Tilt-Zoom)
  static async controlPTZ(req: Request, res: Response): Promise<void> {
    try {
      const { ONVIFService } = await import('../services');
      const { id } = req.params;
      const { action, direction, speed } = req.body;
      
      const camera = await CameraModel.getById(id);
      if (!camera) {
        const response: ApiResponse = {
          success: false,
          error: 'Camera not found'
        };
        res.status(404).json(response);
        return;
      }
      
      if (!camera.onvifEnabled || !camera.onvifHost || !camera.onvifUsername || !camera.onvifPassword) {
        const response: ApiResponse = {
          success: false,
          error: 'Camera does not have ONVIF configured'
        };
        res.status(400).json(response);
        return;
      }
      
      const device = await ONVIFService.connectDevice(
        camera.onvifHost,
        camera.onvifPort || 80,
        { username: camera.onvifUsername, password: camera.onvifPassword }
      );
      
      let result = false;
      const profileToken = camera.onvifProfileToken;
      
      if (!profileToken) {
        const response: ApiResponse = {
          success: false,
          error: 'No ONVIF profile token configured for camera'
        };
        res.status(400).json(response);
        return;
      }
      
      if (action === 'move' && direction) {
        result = await ONVIFService.ptzMove(device, profileToken, direction, speed || 0.5);
      } else if (action === 'stop') {
        result = await ONVIFService.ptzStop(device, profileToken);
      }
      
      const response: ApiResponse = {
        success: result,
        data: { action, direction, speed, result },
        message: result ? 'PTZ command executed successfully' : 'PTZ command failed'
      };
      
      res.json(response);
    } catch (error) {
      console.error('Error controlling PTZ:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to control PTZ'
      };
      res.status(500).json(response);
    }
  }
}
