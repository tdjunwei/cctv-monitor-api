import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error:', error);

  // Default error response
  const response: ApiResponse = {
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message
  };

  // Handle specific error types
  if (error.name === 'ValidationError') {
    res.status(400).json({
      ...response,
      error: 'Validation error'
    });
    return;
  }

  if (error.name === 'UnauthorizedError') {
    res.status(401).json({
      ...response,
      error: 'Unauthorized'
    });
    return;
  }

  if (error.name === 'NotFoundError') {
    res.status(404).json({
      ...response,
      error: 'Resource not found'
    });
    return;
  }

  // Default to 500 server error
  res.status(500).json(response);
};

export const notFoundHandler = (
  req: Request,
  res: Response
): void => {
  const response: ApiResponse = {
    success: false,
    error: `Route ${req.method} ${req.path} not found`
  };
  
  res.status(404).json(response);
};
