import { Router } from 'express';
import { RecordingController } from '../controllers';
import { generalRateLimit } from '../middleware';

const router = Router();

// Apply rate limiting to all recording routes
router.use(generalRateLimit);

// GET /api/recordings - Get all recordings (with filters)
router.get('/', RecordingController.getAllRecordings);

// GET /api/recordings/storage-stats - Get storage statistics
router.get('/storage-stats', RecordingController.getStorageStats);

// GET /api/recordings/camera/:cameraId - Get recordings by camera
router.get('/camera/:cameraId', RecordingController.getRecordingsByCamera);

// GET /api/recordings/:id - Get recording by ID
router.get('/:id', RecordingController.getRecordingById);

// POST /api/recordings - Create new recording
router.post('/', RecordingController.createRecording);

// DELETE /api/recordings/:id - Delete recording
router.delete('/:id', RecordingController.deleteRecording);

export default router;
