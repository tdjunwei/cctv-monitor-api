import { Router } from 'express';
import { StreamController } from '../controllers/StreamController';
import { generalRateLimit } from '../middleware';

const router = Router();

// Apply rate limiting to all stream routes
router.use(generalRateLimit);

// Stream management routes
router.post('/start', StreamController.startStream);
router.delete('/:streamId', StreamController.stopStream);
router.get('/:streamId', StreamController.getStreamInfo);
router.get('/', StreamController.getActiveStreams);

// Recording routes
router.post('/recording/start', StreamController.startRecording);
router.delete('/recording/:recordingId', StreamController.stopRecording);

// Utility routes
router.post('/thumbnail/:cameraId', StreamController.generateThumbnail);
router.post('/test', StreamController.testStream);

export default router;
