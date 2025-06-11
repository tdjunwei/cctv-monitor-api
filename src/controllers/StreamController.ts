import { Request, Response } from 'express';
import { FFmpegService } from '../services/FFmpegService';
import { CameraModel } from '../models';
import Joi from 'joi';

interface ApiResponse {
  success: boolean;
  data?: unknown;
  error?: string;
  message?: string;
}

// Validation schemas
const startStreamSchema = Joi.object({
  cameraId: Joi.string().required(),
  format: Joi.string().valid('hls', 'mp4', 'webm', 'flv').default('hls'),
  resolution: Joi.string().optional(),
  bitrate: Joi.string().optional(),
  framerate: Joi.number().min(1).max(60).optional(),
  preset: Joi.string().valid('ultrafast', 'superfast', 'veryfast', 'faster', 'fast', 'medium', 'slow', 'slower', 'veryslow').default('faster')
});

const startRecordingSchema = Joi.object({
  cameraId: Joi.string().required(),
  duration: Joi.number().min(1).max(86400).optional(), // Max 24 hours
  format: Joi.string().valid('mp4', 'mkv', 'avi').default('mp4'),
  quality: Joi.string().valid('low', 'medium', 'high', 'uhd').default('medium')
});

const streamIdSchema = Joi.object({
  streamId: Joi.string().required()
});

const recordingIdSchema = Joi.object({
  recordingId: Joi.string().required()
});

const testStreamSchema = Joi.object({
  rtspUrl: Joi.string().uri().required(),
  timeout: Joi.number().min(1000).max(30000).default(10000)
});

export class StreamController {
  /**
   * Start streaming a camera's RTSP feed
   */
  static async startStream(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = startStreamSchema.validate(req.body);
      if (error) {
        const response: ApiResponse = {
          success: false,
          error: `Validation error: ${error.details[0].message}`
        };
        res.status(400).json(response);
        return;
      }

      const { cameraId, format, resolution, bitrate, framerate, preset } = value;

      // Get camera details
      const camera = await CameraModel.getById(cameraId);
      if (!camera) {
        const response: ApiResponse = {
          success: false,
          error: 'Camera not found'
        };
        res.status(404).json(response);
        return;
      }

      if (!camera.streamUrl) {
        const response: ApiResponse = {
          success: false,
          error: 'Camera does not have a stream URL configured'
        };
        res.status(400).json(response);
        return;
      }

      const ffmpegService = FFmpegService.getInstance();
      const streamOptions = {
        rtspUrl: camera.streamUrl,
        outputFormat: format,
        resolution,
        bitrate,
        framerate,
        preset
      };

      const outputPath = await ffmpegService.startHLSStream(cameraId, streamOptions);

      const response: ApiResponse = {
        success: true,
        data: {
          streamId: cameraId,
          camera: {
            id: camera.id,
            name: camera.name,
            location: camera.location
          },
          streamUrl: `http://localhost:3001${outputPath}`,
          outputPath,
          format,
          startedAt: new Date().toISOString()
        },
        message: 'Stream started successfully'
      };

      res.json(response);
    } catch (error) {
      console.error('Error starting stream:', error);
      const response: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to start stream'
      };
      res.status(500).json(response);
    }
  }

  /**
   * Stop an active stream
   */
  static async stopStream(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = streamIdSchema.validate(req.params);
      if (error) {
        const response: ApiResponse = {
          success: false,
          error: `Validation error: ${error.details[0].message}`
        };
        res.status(400).json(response);
        return;
      }

      const { streamId } = value;
      const ffmpegService = FFmpegService.getInstance();
      const stopped = ffmpegService.stopStream(streamId);

      const response: ApiResponse = {
        success: stopped,
        data: { streamId, stopped },
        message: stopped ? 'Stream stopped successfully' : 'Stream not found or already stopped'
      };

      res.json(response);
    } catch (error) {
      console.error('Error stopping stream:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to stop stream'
      };
      res.status(500).json(response);
    }
  }

  /**
   * Get stream status and info
   */
  static async getStreamInfo(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = streamIdSchema.validate(req.params);
      if (error) {
        const response: ApiResponse = {
          success: false,
          error: `Validation error: ${error.details[0].message}`
        };
        res.status(400).json(response);
        return;
      }

      const { streamId } = value;
      const ffmpegService = FFmpegService.getInstance();
      const streamInfo = ffmpegService.getStreamInfo(streamId);

      if (!streamInfo) {
        const response: ApiResponse = {
          success: false,
          error: 'Stream not found'
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: {
          ...streamInfo,
          process: undefined // Don't expose process object
        }
      };

      res.json(response);
    } catch (error) {
      console.error('Error getting stream info:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to get stream info'
      };
      res.status(500).json(response);
    }
  }

  /**
   * Get all active streams
   */
  static async getActiveStreams(req: Request, res: Response): Promise<void> {
    try {
      const ffmpegService = FFmpegService.getInstance();
      const activeStreams = ffmpegService.getActiveStreams().map(stream => ({
        ...stream,
        process: undefined // Don't expose process object
      }));

      const response: ApiResponse = {
        success: true,
        data: activeStreams,
        message: `Found ${activeStreams.length} active streams`
      };

      res.json(response);
    } catch (error) {
      console.error('Error getting active streams:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to get active streams'
      };
      res.status(500).json(response);
    }
  }

  /**
   * Start recording a camera's stream
   */
  static async startRecording(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = startRecordingSchema.validate(req.body);
      if (error) {
        const response: ApiResponse = {
          success: false,
          error: `Validation error: ${error.details[0].message}`
        };
        res.status(400).json(response);
        return;
      }

      const { cameraId, duration, format, quality } = value;

      // Get camera details
      const camera = await CameraModel.getById(cameraId);
      if (!camera) {
        const response: ApiResponse = {
          success: false,
          error: 'Camera not found'
        };
        res.status(404).json(response);
        return;
      }

      if (!camera.streamUrl) {
        const response: ApiResponse = {
          success: false,
          error: 'Camera does not have a stream URL configured'
        };
        res.status(400).json(response);
        return;
      }

      const recordingId = `${cameraId}_${Date.now()}`;
      const ffmpegService = FFmpegService.getInstance();
      
      const recordingOptions = {
        rtspUrl: camera.streamUrl,
        outputPath: `recordings/${camera.name.replace(/[^a-zA-Z0-9]/g, '_')}_${recordingId}.${format}`,
        duration,
        format,
        quality
      };

      const outputPath = await ffmpegService.startRecording(recordingId, recordingOptions);

      const response: ApiResponse = {
        success: true,
        data: {
          recordingId,
          camera: {
            id: camera.id,
            name: camera.name,
            location: camera.location
          },
          outputPath,
          duration,
          format,
          quality,
          startedAt: new Date().toISOString()
        },
        message: 'Recording started successfully'
      };

      res.json(response);
    } catch (error) {
      console.error('Error starting recording:', error);
      const response: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to start recording'
      };
      res.status(500).json(response);
    }
  }

  /**
   * Stop an active recording
   */
  static async stopRecording(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = recordingIdSchema.validate(req.params);
      if (error) {
        const response: ApiResponse = {
          success: false,
          error: `Validation error: ${error.details[0].message}`
        };
        res.status(400).json(response);
        return;
      }

      const { recordingId } = value;
      const ffmpegService = FFmpegService.getInstance();
      const stopped = ffmpegService.stopRecording(recordingId);

      const response: ApiResponse = {
        success: stopped,
        data: { recordingId, stopped },
        message: stopped ? 'Recording stopped successfully' : 'Recording not found or already stopped'
      };

      res.json(response);
    } catch (error) {
      console.error('Error stopping recording:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to stop recording'
      };
      res.status(500).json(response);
    }
  }

  /**
   * Generate thumbnail from camera stream
   */
  static async generateThumbnail(req: Request, res: Response): Promise<void> {
    try {
      const { cameraId } = req.params;

      // Get camera details
      const camera = await CameraModel.getById(cameraId);
      if (!camera) {
        const response: ApiResponse = {
          success: false,
          error: 'Camera not found'
        };
        res.status(404).json(response);
        return;
      }

      if (!camera.streamUrl) {
        const response: ApiResponse = {
          success: false,
          error: 'Camera does not have a stream URL configured'
        };
        res.status(400).json(response);
        return;
      }

      const ffmpegService = FFmpegService.getInstance();
      const thumbnailPath = `public/thumbnails/${cameraId}_${Date.now()}.jpg`;
      
      const outputPath = await ffmpegService.generateThumbnail(camera.streamUrl, thumbnailPath);
      const publicPath = outputPath.replace('public/', '/');

      const response: ApiResponse = {
        success: true,
        data: {
          cameraId,
          thumbnailUrl: `http://localhost:3001${publicPath}`,
          generatedAt: new Date().toISOString()
        },
        message: 'Thumbnail generated successfully'
      };

      res.json(response);
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      const response: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate thumbnail'
      };
      res.status(500).json(response);
    }
  }

  /**
   * Test RTSP stream connectivity
   */
  static async testStream(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = testStreamSchema.validate(req.body);
      if (error) {
        const response: ApiResponse = {
          success: false,
          error: `Validation error: ${error.details[0].message}`
        };
        res.status(400).json(response);
        return;
      }

      const { rtspUrl, timeout } = value;
      const ffmpegService = FFmpegService.getInstance();
      
      const startTime = Date.now();
      const isAccessible = await ffmpegService.testStream(rtspUrl, timeout);
      const duration = Date.now() - startTime;

      const response: ApiResponse = {
        success: true,
        data: {
          rtspUrl,
          accessible: isAccessible,
          responseTime: duration,
          testedAt: new Date().toISOString()
        },
        message: isAccessible ? 'Stream is accessible' : 'Stream is not accessible'
      };

      res.json(response);
    } catch (error) {
      console.error('Error testing stream:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to test stream'
      };
      res.status(500).json(response);
    }
  }
}
