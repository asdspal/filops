"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForbiddenError = exports.UnauthorizedError = exports.ConflictError = exports.NotFoundError = exports.ValidationError = exports.FilOpsError = void 0;
class FilOpsError extends Error {
    code;
    statusCode;
    details;
    constructor(message, code, statusCode = 500, details) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;
        this.name = 'FilOpsError';
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.FilOpsError = FilOpsError;
class ValidationError extends FilOpsError {
    constructor(message, details) {
        super(message, 'VALIDATION_ERROR', 400, details);
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
class NotFoundError extends FilOpsError {
    constructor(resource, id) {
        super(`${resource} with id ${id} not found`, 'NOT_FOUND', 404);
        this.name = 'NotFoundError';
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends FilOpsError {
    constructor(message, details) {
        super(message, 'CONFLICT', 409, details);
        this.name = 'ConflictError';
    }
}
exports.ConflictError = ConflictError;
class UnauthorizedError extends FilOpsError {
    constructor(message = 'Unauthorized') {
        super(message, 'UNAUTHORIZED', 401);
        this.name = 'UnauthorizedError';
    }
}
exports.UnauthorizedError = UnauthorizedError;
class ForbiddenError extends FilOpsError {
    constructor(message = 'Forbidden') {
        super(message, 'FORBIDDEN', 403);
        this.name = 'ForbiddenError';
    }
}
exports.ForbiddenError = ForbiddenError;
//# sourceMappingURL=index.js.map