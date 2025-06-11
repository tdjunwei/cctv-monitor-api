import { Router } from 'express';
import { DashboardController } from '../controllers';
import { generalRateLimit } from '../middleware';

const router = Router();

// Apply rate limiting to dashboard routes
router.use(generalRateLimit);

// GET /api/dashboard/stats - Get dashboard statistics
router.get('/stats', DashboardController.getDashboardStats);

// GET /api/dashboard/health - Get system health
router.get('/health', DashboardController.getSystemHealth);

// GET /api/dashboard/test-db - Test database connection
router.get('/test-db', DashboardController.testDatabaseConnection);

export default router;
