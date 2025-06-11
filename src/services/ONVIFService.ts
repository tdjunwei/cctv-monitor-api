import * as onvif from 'node-onvif';
import { ONVIFDevice, ONVIFProfile, ONVIFCapabilities, ONVIFCredentials, ONVIFDiscoveryResult } from '../types';

export class ONVIFService {
  private static readonly DISCOVERY_TIMEOUT = 5000; // 5 seconds
  private static readonly DEFAULT_PORT = 80;

  /**
   * Discover ONVIF devices on the network
   */
  static async discoverDevices(timeout: number = this.DISCOVERY_TIMEOUT): Promise<ONVIFDiscoveryResult> {
    try {
      console.log('🔍 Starting ONVIF device discovery...');
      
      const devices = await onvif.startProbe(timeout);
      
      const onvifDevices: ONVIFDevice[] = devices.map((device: any) => ({
        urn: device.urn,
        name: device.name || 'Unknown ONVIF Device',
        host: device.address,
        port: device.port || this.DEFAULT_PORT,
        xaddrs: device.xaddrs || [],
        scopes: device.scopes || [],
        types: device.types || []
      }));

      console.log(`✅ Found ${onvifDevices.length} ONVIF devices`);
      return { devices: onvifDevices };
    } catch (error) {
      console.error('❌ ONVIF discovery failed:', error);
      return { 
        devices: [], 
        error: error instanceof Error ? error.message : 'Unknown discovery error' 
      };
    }
  }

  /**
   * Connect to an ONVIF device and authenticate
   */
  static async connectDevice(host: string, port: number, credentials: ONVIFCredentials): Promise<any> {
    try {
      console.log(`🔗 Connecting to ONVIF device at ${host}:${port}`);
      
      const device = new onvif.OnvifDevice({
        xaddr: `http://${host}:${port}/onvif/device_service`,
        user: credentials.username,
        pass: credentials.password
      });

      // Initialize the device
      await device.init();
      
      console.log(`✅ Successfully connected to ONVIF device at ${host}:${port}`);
      return device;
    } catch (error) {
      console.error(`❌ Failed to connect to ONVIF device at ${host}:${port}:`, error);
      throw new Error(`ONVIF connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get device capabilities
   */
  static async getDeviceCapabilities(device: any): Promise<ONVIFCapabilities> {
    try {
      const capabilities = await device.getCapabilities();
      return {
        device: capabilities.device,
        media: capabilities.media,
        ptz: capabilities.ptz,
        imaging: capabilities.imaging,
        analytics: capabilities.analytics,
        events: capabilities.events
      };
    } catch (error) {
      console.error('❌ Failed to get device capabilities:', error);
      throw new Error(`Failed to get capabilities: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get media profiles
   */
  static async getProfiles(device: any): Promise<ONVIFProfile[]> {
    try {
      const profiles = await device.getProfiles();
      return profiles.map((profile: any) => ({
        token: profile.token,
        name: profile.name || 'Default Profile',
        videoSourceConfiguration: profile.videoSourceConfiguration,
        videoEncoderConfiguration: profile.videoEncoderConfiguration,
        ptzConfiguration: profile.ptzConfiguration
      }));
    } catch (error) {
      console.error('❌ Failed to get media profiles:', error);
      throw new Error(`Failed to get profiles: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get stream URI for a profile
   */
  static async getStreamUri(device: any, profileToken: string, protocol: 'UDP' | 'TCP' | 'RTSP' | 'HTTP' = 'RTSP'): Promise<string> {
    try {
      const streamUri = await device.getStreamUri({
        protocol: protocol,
        profileToken: profileToken
      });
      
      return streamUri.uri;
    } catch (error) {
      console.error('❌ Failed to get stream URI:', error);
      throw new Error(`Failed to get stream URI: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Test ONVIF connection and get basic info
   */
  static async testConnection(host: string, port: number, credentials: ONVIFCredentials): Promise<{
    success: boolean;
    device?: any;
    capabilities?: ONVIFCapabilities;
    profiles?: ONVIFProfile[];
    streamUri?: string;
    error?: string;
    details?: {
      step: string;
      message: string;
    };
  }> {
    console.log(`🧪 Testing ONVIF connection to ${host}:${port} with username: ${credentials.username}`);
    
    try {
      console.log('📡 Step 1: Attempting to connect to device...');
      const device = await this.connectDevice(host, port, credentials);
      console.log('✅ Step 1: Device connection successful');
      
      console.log('📋 Step 2: Getting device capabilities...');
      const capabilities = await this.getDeviceCapabilities(device);
      console.log('✅ Step 2: Capabilities retrieved successfully');
      
      console.log('🎬 Step 3: Getting media profiles...');
      const profiles = await this.getProfiles(device);
      console.log(`✅ Step 3: Found ${profiles.length} media profiles`);
      
      let streamUri = '';
      if (profiles.length > 0) {
        console.log('🎥 Step 4: Getting stream URI...');
        streamUri = await this.getStreamUri(device, profiles[0].token);
        console.log(`✅ Step 4: Stream URI obtained: ${streamUri}`);
      } else {
        console.log('⚠️ Step 4: No profiles available for stream URI');
      }

      return {
        success: true,
        device,
        capabilities,
        profiles,
        streamUri
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ ONVIF connection test failed:', errorMessage);
      
      // Determine which step failed based on error message
      let step = 'Connection';
      if (errorMessage.includes('capabilities')) {
        step = 'Getting capabilities';
      } else if (errorMessage.includes('profiles')) {
        step = 'Getting media profiles';
      } else if (errorMessage.includes('stream')) {
        step = 'Getting stream URI';
      }
      
      return {
        success: false,
        error: errorMessage,
        details: {
          step,
          message: errorMessage
        }
      };
    }
  }

  /**
   * Get device information
   */
  static async getDeviceInformation(device: any): Promise<unknown> {
    try {
      return await device.getDeviceInformation();
    } catch (error) {
      console.error('❌ Failed to get device information:', error);
      throw new Error(`Failed to get device information: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Control PTZ (Pan-Tilt-Zoom) if supported
   */
  static async ptzMove(device: any, profileToken: string, direction: 'up' | 'down' | 'left' | 'right' | 'zoom-in' | 'zoom-out', speed: number = 0.5): Promise<boolean> {
    try {
      const moveVector = this.getPTZMoveVector(direction, speed);
      await device.ptzMove({
        profileToken: profileToken,
        velocity: moveVector,
        timeout: 1 // Move for 1 second
      });
      return true;
    } catch (error) {
      console.error('❌ PTZ move failed:', error);
      return false;
    }
  }

  /**
   * Stop PTZ movement
   */
  static async ptzStop(device: any, profileToken: string): Promise<boolean> {
    try {
      await device.ptzStop({
        profileToken: profileToken,
        panTilt: true,
        zoom: true
      });
      return true;
    } catch (error) {
      console.error('❌ PTZ stop failed:', error);
      return false;
    }
  }

  /**
   * Get PTZ move vector based on direction
   */
  private static getPTZMoveVector(direction: string, speed: number): {
    PanTilt: { x: number; y: number };
    Zoom: { x: number };
  } {
    const vectors: Record<string, { PanTilt: { x: number; y: number }; Zoom: { x: number } }> = {
      'up': { PanTilt: { x: 0, y: speed }, Zoom: { x: 0 } },
      'down': { PanTilt: { x: 0, y: -speed }, Zoom: { x: 0 } },
      'left': { PanTilt: { x: -speed, y: 0 }, Zoom: { x: 0 } },
      'right': { PanTilt: { x: speed, y: 0 }, Zoom: { x: 0 } },
      'zoom-in': { PanTilt: { x: 0, y: 0 }, Zoom: { x: speed } },
      'zoom-out': { PanTilt: { x: 0, y: 0 }, Zoom: { x: -speed } }
    };
    
    return vectors[direction] || { PanTilt: { x: 0, y: 0 }, Zoom: { x: 0 } };
  }

  /**
   * Create preset position
   */
  static async createPreset(device: any, profileToken: string, presetName: string): Promise<string | null> {
    try {
      const result = await device.setPreset({
        profileToken: profileToken,
        presetName: presetName
      });
      return result.presetToken;
    } catch (error) {
      console.error('❌ Failed to create preset:', error);
      return null;
    }
  }

  /**
   * Go to preset position
   */
  static async gotoPreset(device: any, profileToken: string, presetToken: string): Promise<boolean> {
    try {
      await device.gotoPreset({
        profileToken: profileToken,
        presetToken: presetToken
      });
      return true;
    } catch (error) {
      console.error('❌ Failed to go to preset:', error);
      return false;
    }
  }
}
