#!/usr/bin/env node

import { FFmpegService } from '../services/FFmpegService';
import { program } from 'commander';

const ffmpegService = FFmpegService.getInstance();

program
  .name('ffmpeg-test')
  .description('CLI tool to test FFmpeg streaming functionality')
  .version('1.0.0');

program
  .command('test-stream')
  .description('Test RTSP stream connectivity')
  .argument('<rtsp-url>', 'RTSP stream URL to test')
  .option('-t, --timeout <timeout>', 'Timeout in milliseconds', '10000')
  .action(async (rtspUrl, options) => {
    console.log(`🧪 Testing RTSP stream: ${rtspUrl}`);
    
    try {
      const accessible = await ffmpegService.testStream(rtspUrl, parseInt(options.timeout));
      
      if (accessible) {
        console.log('✅ Stream is accessible and working!');
        process.exit(0);
      } else {
        console.log('❌ Stream is not accessible or has issues');
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Error testing stream:', error);
      process.exit(1);
    }
  });

program
  .command('start-hls')
  .description('Start HLS streaming from RTSP source')
  .argument('<stream-id>', 'Unique identifier for the stream')
  .argument('<rtsp-url>', 'RTSP stream URL')
  .option('-r, --resolution <resolution>', 'Video resolution (e.g., 1920x1080)')
  .option('-b, --bitrate <bitrate>', 'Video bitrate (e.g., 2M)')
  .option('-f, --framerate <framerate>', 'Frame rate', '25')
  .option('-p, --preset <preset>', 'FFmpeg preset', 'faster')
  .action(async (streamId, rtspUrl, options) => {
    console.log(`🎬 Starting HLS stream for ${streamId} from ${rtspUrl}`);
    
    try {
      const streamOptions = {
        rtspUrl,
        resolution: options.resolution,
        bitrate: options.bitrate,
        framerate: options.framerate ? parseInt(options.framerate) : undefined,
        preset: options.preset
      };
      
      const outputPath = await ffmpegService.startHLSStream(streamId, streamOptions);
      console.log(`✅ HLS stream started successfully!`);
      console.log(`📺 Stream URL: http://localhost:3001${outputPath}`);
      console.log('Press Ctrl+C to stop the stream...');
      
      // Keep the process running
      process.on('SIGINT', async () => {
        console.log('\n🛑 Stopping stream...');
        ffmpegService.stopStream(streamId);
        process.exit(0);
      });
      
    } catch (error) {
      console.error('❌ Error starting HLS stream:', error);
      process.exit(1);
    }
  });

program
  .command('record')
  .description('Record RTSP stream to file')
  .argument('<recording-id>', 'Unique identifier for the recording')
  .argument('<rtsp-url>', 'RTSP stream URL')
  .option('-d, --duration <duration>', 'Recording duration in seconds')
  .option('-f, --format <format>', 'Output format', 'mp4')
  .option('-q, --quality <quality>', 'Recording quality', 'medium')
  .option('-o, --output <output>', 'Output file path')
  .action(async (recordingId, rtspUrl, options) => {
    console.log(`🔴 Starting recording ${recordingId} from ${rtspUrl}`);
    
    try {
      const recordingOptions = {
        rtspUrl,
        outputPath: options.output || `recording_${recordingId}_${Date.now()}.${options.format}`,
        duration: options.duration ? parseInt(options.duration) : undefined,
        format: options.format,
        quality: options.quality
      };
      
      const outputPath = await ffmpegService.startRecording(recordingId, recordingOptions);
      console.log(`✅ Recording started successfully!`);
      console.log(`💾 Output file: ${outputPath}`);
      
      if (options.duration) {
        console.log(`⏱️ Recording will stop automatically after ${options.duration} seconds`);
      } else {
        console.log('Press Ctrl+C to stop recording...');
      }
      
      // Keep the process running
      process.on('SIGINT', () => {
        console.log('\n🛑 Stopping recording...');
        ffmpegService.stopRecording(recordingId);
        process.exit(0);
      });
      
    } catch (error) {
      console.error('❌ Error starting recording:', error);
      process.exit(1);
    }
  });

program
  .command('thumbnail')
  .description('Generate thumbnail from RTSP stream')
  .argument('<rtsp-url>', 'RTSP stream URL')
  .option('-o, --output <output>', 'Output image path', `thumbnail_${Date.now()}.jpg`)
  .action(async (rtspUrl, options) => {
    console.log(`📸 Generating thumbnail from ${rtspUrl}`);
    
    try {
      const outputPath = await ffmpegService.generateThumbnail(rtspUrl, options.output);
      console.log(`✅ Thumbnail generated successfully!`);
      console.log(`🖼️ Saved to: ${outputPath}`);
    } catch (error) {
      console.error('❌ Error generating thumbnail:', error);
      process.exit(1);
    }
  });

program
  .command('list-streams')
  .description('List all active streams')
  .action(() => {
    const activeStreams = ffmpegService.getActiveStreams();
    
    if (activeStreams.length === 0) {
      console.log('📭 No active streams');
      return;
    }
    
    console.log(`📺 Active streams (${activeStreams.length}):`);
    console.log('─'.repeat(80));
    
    activeStreams.forEach((stream, index) => {
      console.log(`${index + 1}. Stream ID: ${stream.id}`);
      console.log(`   Status: ${stream.status}`);
      console.log(`   RTSP URL: ${stream.rtspUrl}`);
      console.log(`   Viewers: ${stream.viewers}`);
      console.log(`   Started: ${stream.startTime}`);
      if (stream.outputPath) {
        console.log(`   HLS URL: http://localhost:3001${stream.outputPath}`);
      }
      console.log('');
    });
  });

program
  .command('stop-stream')
  .description('Stop an active stream')
  .argument('<stream-id>', 'Stream ID to stop')
  .action((streamId) => {
    console.log(`🛑 Stopping stream: ${streamId}`);
    
    const stopped = ffmpegService.stopStream(streamId);
    
    if (stopped) {
      console.log('✅ Stream stopped successfully');
    } else {
      console.log('⚠️ Stream not found or already stopped');
    }
  });

// Error handling
program.exitOverride();

try {
  program.parse();
} catch (error) {
  console.error('❌ Command failed:', error);
  process.exit(1);
}
