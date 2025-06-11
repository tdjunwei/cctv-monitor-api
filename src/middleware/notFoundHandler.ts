import { Request, Response } from 'express';

/**
 * Middleware to handle 404 Not Found errors
 */
const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    error: 'Not Found',
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method
  });
};

export { notFoundHandler };
