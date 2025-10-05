export declare class FilOpsError extends Error {
    code: string;
    statusCode: number;
    details?: Record<string, unknown> | undefined;
    constructor(message: string, code: string, statusCode?: number, details?: Record<string, unknown> | undefined);
}
export declare class ValidationError extends FilOpsError {
    constructor(message: string, details?: Record<string, unknown>);
}
export declare class NotFoundError extends FilOpsError {
    constructor(resource: string, id: string);
}
export declare class ConflictError extends FilOpsError {
    constructor(message: string, details?: Record<string, unknown>);
}
export declare class UnauthorizedError extends FilOpsError {
    constructor(message?: string);
}
export declare class ForbiddenError extends FilOpsError {
    constructor(message?: string);
}
//# sourceMappingURL=index.d.ts.map