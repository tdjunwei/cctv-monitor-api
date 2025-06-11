import { Router } from 'express';
import { CameraController } from '../controllers';
import { generalRateLimit } from '../middleware';

const router = Router();

// Apply rate limiting to all camera routes
router.use(generalRateLimit);

// GET /api/cameras - Get all cameras
router.get('/', CameraController.getAllCameras);

// GET /api/cameras/type/:type - Get cameras by type
router.get('/type/:type', CameraController.getCamerasByType);

// GET /api/cameras/:id - Get camera by ID
router.get('/:id', CameraController.getCameraById);

// POST /api/cameras - Create new camera
router.post('/', CameraController.createCamera);

// PUT /api/cameras/:id - Update camera
router.put('/:id', CameraController.updateCamera);

// DELETE /api/cameras/:id - Delete camera
router.delete('/:id', CameraController.deleteCamera);

// PATCH /api/cameras/:id/status - Update camera online status
router.patch('/:id/status', CameraController.updateOnlineStatus);

// ONVIF routes
router.get('/onvif/discover', CameraController.discoverONVIFDevices);
router.post('/onvif/test', CameraController.testONVIFConnection);
router.get('/:id/onvif/capabilities', CameraController.getONVIFCapabilities);
router.post('/:id/onvif/ptz', CameraController.controlPTZ);

export default router;
