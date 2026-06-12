import { Request, Response, NextFunction } from 'express';
export declare class ApiError extends Error {
    statusCode: number;
    code: string;
    details?: Record<string, string[]> | undefined;
    constructor(statusCode: number, code: string, message: string, details?: Record<string, string[]> | undefined);
}
export declare const Errors: {
    UNAUTHORIZED: (message?: string) => ApiError;
    FORBIDDEN: (message?: string) => ApiError;
    TOKEN_EXPIRED: () => ApiError;
    INVALID_TOKEN: () => ApiError;
    NOT_FOUND: (resource?: string) => ApiError;
    ALREADY_EXISTS: (resource?: string) => ApiError;
    VALIDATION_ERROR: (details: Record<string, string[]>) => ApiError;
    INVALID_INPUT: (message?: string) => ApiError;
    INSUFFICIENT_FUNDS: () => ApiError;
    ESCROW_INVALID_STATE: (message?: string) => ApiError;
    VERIFICATION_REQUIRED: () => ApiError;
    INTERNAL_ERROR: () => ApiError;
    SERVICE_UNAVAILABLE: (message?: string) => ApiError;
};
export declare function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void;
export declare function notFoundHandler(req: Request, res: Response, _next: NextFunction): void;
export declare function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): (req: Request, res: Response, next: NextFunction) => void;
export declare function validateRequest<T>(schema: {
    parse: (data: unknown) => T;
}, source?: 'body' | 'query' | 'params'): (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=errorHandler.d.ts.map