export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    const msg = id ? `${resource} with id '${id}' not found` : `${resource} not found`;
    super(404, 'NOT_FOUND', msg);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(401, 'UNAUTHORIZED', message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(403, 'FORBIDDEN', message);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, 'VALIDATION_ERROR', message);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, 'CONFLICT', message);
  }
}

export class QuotaExceededError extends AppError {
  constructor(message = 'Storage quota exceeded') {
    super(413, 'QUOTA_EXCEEDED', message);
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(429, 'RATE_LIMIT_EXCEEDED', message);
  }
}
