import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
/**
 * Generic validation middleware factory
 */
export declare function validate<T>(schema: ZodSchema<T>, source?: 'body' | 'query' | 'params'): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Validate request body
 */
export declare function validateBody<T>(schema: ZodSchema<T>): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Validate query parameters
 */
export declare function validateQuery<T>(schema: ZodSchema<T>): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Validate URL parameters
 */
export declare function validateParams<T>(schema: ZodSchema<T>): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Validate multiple sources at once
 */
export declare function validateMultiple(validations: {
    body?: ZodSchema<unknown>;
    query?: ZodSchema<unknown>;
    params?: ZodSchema<unknown>;
}): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Sanitize request body
 * Removes potentially dangerous fields
 */
export declare function sanitizeBody(allowedFields: string[]): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Trim string values in request body
 */
export declare function trimBody(req: Request, _res: Response, next: NextFunction): void;
/**
 * Convert numeric strings to numbers
 */
export declare function convertNumericBody(fields: string[]): (req: Request, _res: Response, next: NextFunction) => void;
/**
 * Parse JSON fields in request body
 */
export declare function parseJsonFields(fields: string[]): (req: Request, _res: Response, next: NextFunction) => void;
declare const _default: {
    validate: typeof validate;
    validateBody: typeof validateBody;
    validateQuery: typeof validateQuery;
    validateParams: typeof validateParams;
    validateMultiple: typeof validateMultiple;
    sanitizeBody: typeof sanitizeBody;
    trimBody: typeof trimBody;
    convertNumericBody: typeof convertNumericBody;
    parseJsonFields: typeof parseJsonFields;
};
export default _default;
//# sourceMappingURL=validation.d.ts.map