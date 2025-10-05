import {
  FilOpsError,
  ValidationError,
  NotFoundError,
  ConflictError,
  UnauthorizedError,
  ForbiddenError,
} from '../errors';

describe('Errors', () => {
  describe('FilOpsError', () => {
    it('should create a base error with correct properties', () => {
      const error = new FilOpsError('Test error', 'TEST_ERROR', 500, { key: 'value' });

      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.statusCode).toBe(500);
      expect(error.details).toEqual({ key: 'value' });
      expect(error.name).toBe('FilOpsError');
    });
  });

  describe('ValidationError', () => {
    it('should create a validation error with 400 status', () => {
      const error = new ValidationError('Invalid input', { field: 'name' });

      expect(error.message).toBe('Invalid input');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error.details).toEqual({ field: 'name' });
    });
  });

  describe('NotFoundError', () => {
    it('should create a not found error with 404 status', () => {
      const error = new NotFoundError('Policy', '123');

      expect(error.message).toBe('Policy with id 123 not found');
      expect(error.code).toBe('NOT_FOUND');
      expect(error.statusCode).toBe(404);
    });
  });

  describe('ConflictError', () => {
    it('should create a conflict error with 409 status', () => {
      const error = new ConflictError('Resource already exists');

      expect(error.message).toBe('Resource already exists');
      expect(error.code).toBe('CONFLICT');
      expect(error.statusCode).toBe(409);
    });
  });

  describe('UnauthorizedError', () => {
    it('should create an unauthorized error with 401 status', () => {
      const error = new UnauthorizedError();

      expect(error.message).toBe('Unauthorized');
      expect(error.code).toBe('UNAUTHORIZED');
      expect(error.statusCode).toBe(401);
    });
  });

  describe('ForbiddenError', () => {
    it('should create a forbidden error with 403 status', () => {
      const error = new ForbiddenError();

      expect(error.message).toBe('Forbidden');
      expect(error.code).toBe('FORBIDDEN');
      expect(error.statusCode).toBe(403);
    });
  });
});
