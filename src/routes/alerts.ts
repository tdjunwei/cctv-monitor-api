import { Router } from 'express';
import { AlertController } from '../controllers';
import { generalRateLimit } from '../middleware';

const router = Router();

// Apply rate limiting to all alert routes
router.use(generalRateLimit);

// GET /api/alerts - Get all alerts (with filters)
router.get('/', AlertController.getAllAlerts);

// GET /api/alerts/recent - Get recent alerts
router.get('/recent', AlertController.getRecentAlerts);

// GET /api/alerts/stats - Get alert statistics
router.get('/stats', AlertController.getStats);

// GET /api/alerts/unread-count - Get unread alerts count
router.get('/unread-count', AlertController.getUnreadCount);

// GET /api/alerts/:id - Get alert by ID
router.get('/:id', AlertController.getAlertById);

// POST /api/alerts - Create new alert
router.post('/', AlertController.createAlert);

// PUT /api/alerts/:id/read - Mark alert as read
router.put('/:id/read', AlertController.markAsRead);

// PUT /api/alerts/mark-read - Mark multiple alerts as read
router.put('/mark-read', AlertController.markMultipleAsRead);

// DELETE /api/alerts/:id - Delete alert
router.delete('/:id', AlertController.deleteAlert);

export default router;
