export class HttpError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const asyncHandler = (handler) => async (req, res, next) => {
  try {
    await handler(req, res, next);
  } catch (error) {
    next(error);
  }
};

export const notFoundHandler = (req, res) => {
  res.status(404).json({ error: 'Route not found' });
};

export const errorHandler = (error, req, res, next) => {
  const statusCode = error.statusCode ?? 500;
  res.status(statusCode).json({
    error: error.message ?? 'Internal server error',
  });
};

