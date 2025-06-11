export interface Camera {
  id: string;
  name: string;
  location: string;
  streamUrl: string;
  isOnline: boolean;
  lastMotionDetected?: Date;
  recordingEnabled: boolean;
  resolution: string;
  type: 'indoor' | 'outdoor';
  createdAt: Date;
  updatedAt: Date;
}

export interface Recording {
  id: string;
  cameraId: string;
  cameraName: string;
  filename: string;
  duration: number; // in seconds
  size: number; // in MB
  startTime: Date;
  endTime: Date;
  thumbnail?: string;
  type: 'scheduled' | 'motion' | 'manual';
}

export interface Alert {
  id: string;
  cameraId: string;
  cameraName: string;
  type: 'motion' | 'offline' | 'recording_failed' | 'storage_full';
  message: string;
  severity: 'low' | 'medium' | 'high';
  isRead: boolean;
  timestamp: Date;
  thumbnail?: string;
}

export interface SystemSettings {
  recordingQuality: 'low' | 'medium' | 'high' | 'ultra';
  storageRetentionDays: number;
  motionSensitivity: number; // 1-10
  notificationsEnabled: boolean;
  emailAlerts: boolean;
  maxConcurrentStreams: number;
  nightVisionEnabled: boolean;
  audioRecordingEnabled: boolean;
}

export interface DashboardStats {
  totalCameras: number;
  onlineCameras: number;
  offlineCameras: number;
  totalRecordings: number;
  storageUsed: number; // in GB
  storageTotal: number; // in GB
  unreadAlerts: number;
  lastMotionDetected?: Date;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Request types
export interface CreateCameraRequest {
  name: string;
  location: string;
  streamUrl: string;
  resolution: string;
  type: 'indoor' | 'outdoor';
  recordingEnabled?: boolean;
}

export interface UpdateCameraRequest extends Partial<CreateCameraRequest> {
  isOnline?: boolean;
  lastMotionDetected?: Date;
}

export interface CreateRecordingRequest {
  cameraId: string;
  filename: string;
  duration: number;
  size: number;
  startTime: Date;
  endTime: Date;
  thumbnail?: string;
  type: 'scheduled' | 'motion' | 'manual';
}

export interface CreateAlertRequest {
  cameraId: string;
  type: 'motion' | 'offline' | 'recording_failed' | 'storage_full';
  message: string;
  severity: 'low' | 'medium' | 'high';
  thumbnail?: string;
}

// Database result types
export interface DatabaseResult {
  affectedRows: number;
  insertId: number;
  changedRows: number;
}

export interface DatabaseRow {
  [key: string]: unknown;
}

export interface AlertRow {
  id: string;
  camera_id: string;
  cameraId?: string;
  cameraName?: string;
  type: string;
  message: string;
  severity: string;
  is_read: boolean;
  isRead?: boolean;
  timestamp: Date;
  thumbnail?: string;
}
