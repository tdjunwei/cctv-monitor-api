import { Router } from 'express';
import cameraRoutes from './cameras';
import alertRoutes from './alerts';
import recordingRoutes from './recordings';
import dashboardRoutes from './dashboard';

const router = Router();

// API version prefix
const API_VERSION = process.env.API_VERSION || 'v1';

// Mount routes
router.use(`/${API_VERSION}/cameras`, cameraRoutes);
router.use(`/${API_VERSION}/alerts`, alertRoutes);
router.use(`/${API_VERSION}/recordings`, recordingRoutes);
router.use(`/${API_VERSION}/dashboard`, dashboardRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: API_VERSION
  });
});

// API info endpoint
router.get('/', (req, res) => {
  res.json({
    name: 'CCTV Monitor API',
    version: API_VERSION,
    description: 'API for managing CCTV cameras, recordings, and alerts',
    endpoints: {
      cameras: `/${API_VERSION}/cameras`,
      alerts: `/${API_VERSION}/alerts`,
      recordings: `/${API_VERSION}/recordings`,
      dashboard: `/${API_VERSION}/dashboard`
    },
    documentation: 'See README.md for API documentation'
  });
});

export default router;
