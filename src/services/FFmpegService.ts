import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';

export interface StreamOptions {
  rtspUrl: string;
  outputFormat?: 'hls' | 'mp4' | 'webm' | 'flv';
  resolution?: string;
  bitrate?: string;
  framerate?: number;
  segment_time?: number;
  preset?: 'ultrafast' | 'superfast' | 'veryfast' | 'faster' | 'fast' | 'medium' | 'slow' | 'slower' | 'veryslow';
}

export interface RecordingOptions {
  rtspUrl: string;
  outputPath: string;
  duration?: number; // in seconds
  format?: 'mp4' | 'mkv' | 'avi';
  quality?: 'low' | 'medium' | 'high' | 'uhd';
}

export interface StreamInfo {
  id: string;
  rtspUrl: string;
  status: 'starting' | 'running' | 'stopped' | 'error';
  startTime: Date;
  outputPath?: string;
  process?: ChildProcess;
  viewers: number;
}

export class FFmpegService extends EventEmitter {
  private static instance: FFmpegService;
  private activeStreams: Map<string, StreamInfo> = new Map();
  private recordingProcesses: Map<string, ChildProcess> = new Map();
  private static readonly OUTPUT_DIR = path.join(process.cwd(), 'public', 'streams');
  private static readonly RECORDINGS_DIR = path.join(process.cwd(), 'recordings');

  constructor() {
    super();
    this.ensureDirectories();
  }

  static getInstance(): FFmpegService {
    if (!FFmpegService.instance) {
      FFmpegService.instance = new FFmpegService();
    }
    return FFmpegService.instance;
  }

  private ensureDirectories(): void {
    [FFmpegService.OUTPUT_DIR, FFmpegService.RECORDINGS_DIR].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Start streaming an RTSP source to HLS format for web playback
   */
  async startHLSStream(streamId: string, options: StreamOptions): Promise<string> {
    try {
      console.log(`🎬 Starting HLS stream for ${streamId} from ${options.rtspUrl}`);

      if (this.activeStreams.has(streamId)) {
        const existingStream = this.activeStreams.get(streamId)!;
        if (existingStream.status === 'running') {
          existingStream.viewers++;
          console.log(`📺 Stream ${streamId} already running, viewers: ${existingStream.viewers}`);
          return existingStream.outputPath!;
        }
      }

      const outputDir = path.join(FFmpegService.OUTPUT_DIR, streamId);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const playlistPath = path.join(outputDir, 'playlist.m3u8');
      const segmentPattern = path.join(outputDir, 'segment_%03d.ts');

      // FFmpeg command for HLS streaming
      const ffmpegArgs = [
        '-i', options.rtspUrl,
        '-c:v', 'libx264',
        '-preset', options.preset || 'faster',
        '-tune', 'zerolatency',
        '-g', '30', // GOP size
        '-sc_threshold', '0',
        '-f', 'hls',
        '-hls_time', (options.segment_time || 2).toString(),
        '-hls_list_size', '10',
        '-hls_flags', 'delete_segments+split_by_time',
        '-hls_segment_filename', segmentPattern,
        playlistPath
      ];

      // Add resolution if specified
      if (options.resolution) {
        const resolutionIndex = ffmpegArgs.indexOf('-preset') + 2;
        ffmpegArgs.splice(resolutionIndex, 0, '-s', options.resolution);
      }

      // Add bitrate if specified
      if (options.bitrate) {
        const bitrateIndex = ffmpegArgs.indexOf('-s') !== -1 ? 
          ffmpegArgs.indexOf('-s') + 2 : ffmpegArgs.indexOf('-preset') + 2;
        ffmpegArgs.splice(bitrateIndex, 0, '-b:v', options.bitrate);
      }

      // Add framerate if specified
      if (options.framerate) {
        const framerateIndex = ffmpegArgs.indexOf('-b:v') !== -1 ? 
          ffmpegArgs.indexOf('-b:v') + 2 : ffmpegArgs.indexOf('-s') !== -1 ? 
          ffmpegArgs.indexOf('-s') + 2 : ffmpegArgs.indexOf('-preset') + 2;
        ffmpegArgs.splice(framerateIndex, 0, '-r', options.framerate.toString());
      }

      console.log('🔧 FFmpeg command:', 'ffmpeg', ffmpegArgs.join(' '));

      const ffmpegProcess = spawn('ffmpeg', ffmpegArgs);

      const streamInfo: StreamInfo = {
        id: streamId,
        rtspUrl: options.rtspUrl,
        status: 'starting',
        startTime: new Date(),
        outputPath: `/streams/${streamId}/playlist.m3u8`,
        process: ffmpegProcess,
        viewers: 1
      };

      this.activeStreams.set(streamId, streamInfo);

      ffmpegProcess.stdout?.on('data', (data) => {
        console.log(`FFmpeg stdout: ${data}`);
      });

      ffmpegProcess.stderr?.on('data', (data) => {
        const output = data.toString();
        console.log(`FFmpeg stderr: ${output}`);
        
        // Check if streaming started successfully
        if (output.includes('Opening') || output.includes('Stream #')) {
          streamInfo.status = 'running';
          this.emit('streamStarted', streamId);
          console.log(`✅ Stream ${streamId} started successfully`);
        }
      });

      ffmpegProcess.on('close', (code) => {
        console.log(`🔚 FFmpeg process for ${streamId} exited with code ${code}`);
        streamInfo.status = code === 0 ? 'stopped' : 'error';
        this.emit('streamStopped', streamId, code);
        
        // Clean up files
        setTimeout(() => {
          this.cleanupStreamFiles(streamId);
        }, 5000);
      });

      ffmpegProcess.on('error', (error) => {
        console.error(`❌ FFmpeg process error for ${streamId}:`, error);
        streamInfo.status = 'error';
        this.emit('streamError', streamId, error);
      });

      // Wait a bit for the stream to start
      await new Promise(resolve => setTimeout(resolve, 3000));

      if (fs.existsSync(playlistPath)) {
        console.log(`✅ HLS playlist created for ${streamId}`);
        return streamInfo.outputPath!;
      } else {
        throw new Error('Failed to create HLS playlist');
      }

    } catch (error) {
      console.error(`❌ Failed to start HLS stream for ${streamId}:`, error);
      throw error;
    }
  }

  /**
   * Stop an active stream
   */
  stopStream(streamId: string): boolean {
    try {
      const streamInfo = this.activeStreams.get(streamId);
      if (!streamInfo) {
        console.log(`⚠️ Stream ${streamId} not found`);
        return false;
      }

      streamInfo.viewers = Math.max(0, streamInfo.viewers - 1);
      
      // Only stop if no more viewers
      if (streamInfo.viewers === 0) {
        console.log(`🛑 Stopping stream ${streamId} (no more viewers)`);
        
        if (streamInfo.process && !streamInfo.process.killed) {
          streamInfo.process.kill('SIGTERM');
          
          // Force kill if not terminated within 5 seconds
          setTimeout(() => {
            if (streamInfo.process && !streamInfo.process.killed) {
              streamInfo.process.kill('SIGKILL');
            }
          }, 5000);
        }

        streamInfo.status = 'stopped';
        this.activeStreams.delete(streamId);
        return true;
      } else {
        console.log(`📺 Stream ${streamId} still has ${streamInfo.viewers} viewers`);
        return false;
      }
    } catch (error) {
      console.error(`❌ Error stopping stream ${streamId}:`, error);
      return false;
    }
  }

  /**
   * Start recording an RTSP stream
   */
  async startRecording(recordingId: string, options: RecordingOptions): Promise<string> {
    try {
      console.log(`🔴 Starting recording ${recordingId} from ${options.rtspUrl}`);

      if (this.recordingProcesses.has(recordingId)) {
        throw new Error(`Recording ${recordingId} already in progress`);
      }

      const outputPath = options.outputPath || 
        path.join(FFmpegService.RECORDINGS_DIR, `${recordingId}_${Date.now()}.mp4`);

      // Ensure output directory exists
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // FFmpeg command for recording
      const ffmpegArgs = [
        '-i', options.rtspUrl,
        '-c:v', 'libx264',
        '-preset', 'faster',
        '-crf', this.getQualityCRF(options.quality || 'medium'),
        '-c:a', 'aac',
        '-f', options.format || 'mp4'
      ];

      // Add duration if specified
      if (options.duration) {
        ffmpegArgs.splice(-1, 0, '-t', options.duration.toString());
      }

      ffmpegArgs.push(outputPath);

      console.log('🔧 Recording FFmpeg command:', 'ffmpeg', ffmpegArgs.join(' '));

      const recordingProcess = spawn('ffmpeg', ffmpegArgs);
      this.recordingProcesses.set(recordingId, recordingProcess);

      recordingProcess.stdout?.on('data', (data) => {
        console.log(`Recording stdout: ${data}`);
      });

      recordingProcess.stderr?.on('data', (data) => {
        console.log(`Recording stderr: ${data}`);
      });

      recordingProcess.on('close', (code) => {
        console.log(`🔚 Recording ${recordingId} finished with code ${code}`);
        this.recordingProcesses.delete(recordingId);
        this.emit('recordingFinished', recordingId, code, outputPath);
      });

      recordingProcess.on('error', (error) => {
        console.error(`❌ Recording error for ${recordingId}:`, error);
        this.recordingProcesses.delete(recordingId);
        this.emit('recordingError', recordingId, error);
      });

      return outputPath;
    } catch (error) {
      console.error(`❌ Failed to start recording ${recordingId}:`, error);
      throw error;
    }
  }

  /**
   * Stop an active recording
   */
  stopRecording(recordingId: string): boolean {
    try {
      const recordingProcess = this.recordingProcesses.get(recordingId);
      if (!recordingProcess) {
        console.log(`⚠️ Recording ${recordingId} not found`);
        return false;
      }

      console.log(`🛑 Stopping recording ${recordingId}`);
      recordingProcess.kill('SIGTERM');

      // Force kill if not terminated within 5 seconds
      setTimeout(() => {
        if (!recordingProcess.killed) {
          recordingProcess.kill('SIGKILL');
        }
      }, 5000);

      this.recordingProcesses.delete(recordingId);
      return true;
    } catch (error) {
      console.error(`❌ Error stopping recording ${recordingId}:`, error);
      return false;
    }
  }

  /**
   * Get stream info by ID
   */
  getStreamInfo(streamId: string): StreamInfo | undefined {
    return this.activeStreams.get(streamId);
  }

  /**
   * Get all active streams
   */
  getActiveStreams(): StreamInfo[] {
    return Array.from(this.activeStreams.values());
  }

  /**
   * Generate thumbnail from RTSP stream
   */
  async generateThumbnail(rtspUrl: string, outputPath: string): Promise<string> {
    try {
      console.log(`📸 Generating thumbnail from ${rtspUrl}`);

      const ffmpegArgs = [
        '-i', rtspUrl,
        '-vframes', '1',
        '-f', 'image2',
        '-s', '320x240',
        '-y', // Overwrite output file
        outputPath
      ];

      return new Promise((resolve, reject) => {
        const thumbnailProcess = spawn('ffmpeg', ffmpegArgs);

        thumbnailProcess.on('close', (code) => {
          if (code === 0 && fs.existsSync(outputPath)) {
            console.log(`✅ Thumbnail generated: ${outputPath}`);
            resolve(outputPath);
          } else {
            reject(new Error(`Thumbnail generation failed with code ${code}`));
          }
        });

        thumbnailProcess.on('error', (error) => {
          reject(error);
        });

        // Timeout after 10 seconds
        setTimeout(() => {
          if (!thumbnailProcess.killed) {
            thumbnailProcess.kill();
            reject(new Error('Thumbnail generation timeout'));
          }
        }, 10000);
      });
    } catch (error) {
      console.error('❌ Thumbnail generation error:', error);
      throw error;
    }
  }

  /**
   * Test RTSP stream connectivity
   */
  async testStream(rtspUrl: string, timeout: number = 10000): Promise<boolean> {
    try {
      console.log(`🧪 Testing RTSP stream: ${rtspUrl}`);

      const ffmpegArgs = [
        '-i', rtspUrl,
        '-t', '1',
        '-f', 'null',
        '-'
      ];

      return new Promise((resolve) => {
        const testProcess = spawn('ffmpeg', ffmpegArgs);
        let resolved = false;

        const resolveOnce = (result: boolean) => {
          if (!resolved) {
            resolved = true;
            resolve(result);
          }
        };

        testProcess.stderr?.on('data', (data) => {
          const output = data.toString();
          if (output.includes('Stream #') || output.includes('Video:') || output.includes('Audio:')) {
            console.log(`✅ Stream test successful: ${rtspUrl}`);
            testProcess.kill();
            resolveOnce(true);
          }
        });

        testProcess.on('close', (code) => {
          if (!resolved) {
            resolveOnce(code === 0);
          }
        });

        testProcess.on('error', () => {
          resolveOnce(false);
        });

        // Timeout
        setTimeout(() => {
          if (!testProcess.killed) {
            testProcess.kill();
          }
          resolveOnce(false);
        }, timeout);
      });
    } catch (error) {
      console.error('❌ Stream test error:', error);
      return false;
    }
  }

  /**
   * Clean up stream files
   */
  private cleanupStreamFiles(streamId: string): void {
    try {
      const streamDir = path.join(FFmpegService.OUTPUT_DIR, streamId);
      if (fs.existsSync(streamDir)) {
        fs.rmSync(streamDir, { recursive: true, force: true });
        console.log(`🧹 Cleaned up stream files for ${streamId}`);
      }
    } catch (error) {
      console.error(`❌ Error cleaning up stream files for ${streamId}:`, error);
    }
  }

  /**
   * Get quality CRF value for recording
   */
  private getQualityCRF(quality: string): string {
    const crfMap: Record<string, string> = {
      'low': '28',
      'medium': '23',
      'high': '18',
      'uhd': '15'
    };
    return crfMap[quality] || '23';
  }

  /**
   * Stop all streams and recordings
   */
  cleanup(): void {
    console.log('🧹 Cleaning up FFmpeg service...');

    // Stop all active streams
    for (const [streamId, streamInfo] of this.activeStreams) {
      if (streamInfo.process && !streamInfo.process.killed) {
        streamInfo.process.kill('SIGTERM');
      }
      this.cleanupStreamFiles(streamId);
    }
    this.activeStreams.clear();

    // Stop all recordings
    for (const [recordingId, process] of this.recordingProcesses) {
      if (!process.killed) {
        process.kill('SIGTERM');
      }
    }
    this.recordingProcesses.clear();
  }
}

export default FFmpegService.getInstance();
