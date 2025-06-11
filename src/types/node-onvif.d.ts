declare module 'node-onvif' {
  export interface OnvifDeviceOptions {
    xaddr: string;
    user?: string;
    pass?: string;
  }

  export interface OnvifDevice {
    urn: string;
    name?: string;
    address: string;
    port?: number;
    xaddrs?: string[];
    scopes?: string[];
    types?: string[];
  }

  export interface StreamUriParams {
    protocol: 'UDP' | 'TCP' | 'RTSP' | 'HTTP';
    profileToken: string;
  }

  export interface StreamUriResult {
    uri: string;
  }

  export interface PTZMoveParams {
    profileToken: string;
    velocity: {
      PanTilt: { x: number; y: number };
      Zoom: { x: number };
    };
    timeout?: number;
  }

  export interface PTZStopParams {
    profileToken: string;
    panTilt?: boolean;
    zoom?: boolean;
  }

  export interface PresetParams {
    profileToken: string;
    presetName?: string;
    presetToken?: string;
  }

  export interface PresetResult {
    presetToken: string;
  }

  export interface MediaProfile {
    token: string;
    name?: string;
    videoSourceConfiguration?: unknown;
    videoEncoderConfiguration?: unknown;
    ptzConfiguration?: unknown;
  }

  export interface DeviceCapabilities {
    device?: unknown;
    media?: unknown;
    ptz?: unknown;
    imaging?: unknown;
    analytics?: unknown;
    events?: unknown;
  }

  export class OnvifDevice {
    constructor(options: OnvifDeviceOptions);
    init(): Promise<void>;
    getCapabilities(): Promise<DeviceCapabilities>;
    getProfiles(): Promise<MediaProfile[]>;
    getStreamUri(params: StreamUriParams): Promise<StreamUriResult>;
    getDeviceInformation(): Promise<unknown>;
    ptzMove(params: PTZMoveParams): Promise<void>;
    ptzStop(params: PTZStopParams): Promise<void>;
    setPreset(params: PresetParams): Promise<PresetResult>;
    gotoPreset(params: PresetParams): Promise<void>;
  }

  export function startProbe(timeout?: number): Promise<OnvifDevice[]>;
}
