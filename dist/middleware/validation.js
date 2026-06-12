import { ZodError } from 'zod';
import logger from '../config/logger.js';
/**
 * Generic validation middleware factory
 */
export function validate(schema, source = 'body') {
    return (req, res, next) => {
        try {
            const result = schema.parse(req[source]);
            // Attach validated data to request
            const key = `validated${source.charAt(0).toUpperCase() + source.slice(1)}`;
            req[key] = result;
            next();
        }
        catch (error) {
            if (error instanceof ZodError) {
                const details = {};
                error.errors.forEach((err) => {
                    const path = err.path.join('.');
                    if (!details[path]) {
                        details[path] = [];
                    }
                    details[path].push(err.message);
                });
                logger.debug('Validation failed:', { path: req.path, details });
                res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Invalid input data',
                        details,
                    },
                });
                return;
            }
            next(error);
        }
    };
}
/**
 * Validate request body
 */
export function validateBody(schema) {
    return validate(schema, 'body');
}
/**
 * Validate query parameters
 */
export function validateQuery(schema) {
    return validate(schema, 'query');
}
/**
 * Validate URL parameters
 */
export function validateParams(schema) {
    return validate(schema, 'params');
}
/**
 * Validate multiple sources at once
 */
export function validateMultiple(validations) {
    return (req, res, next) => {
        const errors = {};
        // Validate body
        if (validations.body) {
            try {
                const result = validations.body.parse(req.body);
                req.validatedBody = result;
            }
            catch (error) {
                if (error instanceof ZodError) {
                    errors.body = formatZodErrors(error);
                }
            }
        }
        // Validate query
        if (validations.query) {
            try {
                const result = validations.query.parse(req.query);
                req.validatedQuery = result;
            }
            catch (error) {
                if (error instanceof ZodError) {
                    errors.query = formatZodErrors(error);
                }
            }
        }
        // Validate params
        if (validations.params) {
            try {
                const result = validations.params.parse(req.params);
                req.validatedParams = result;
            }
            catch (error) {
                if (error instanceof ZodError) {
                    errors.params = formatZodErrors(error);
                }
            }
        }
        // If there are any errors, return them
        if (Object.keys(errors).length > 0) {
            res.status(400).json({
                success: false,
                message: 'Validation failed',
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid input data',
                    details: errors,
                },
            });
            return;
        }
        next();
    };
}
/**
 * Format Zod errors into a simpler structure
 */
function formatZodErrors(error) {
    const details = {};
    error.errors.forEach((err) => {
        const path = err.path.join('.');
        if (!details[path]) {
            details[path] = [];
        }
        details[path].push(err.message);
    });
    return details;
}
/**
 * Sanitize request body
 * Removes potentially dangerous fields
 */
export function sanitizeBody(allowedFields) {
    return (req, res, next) => {
        if (req.body && typeof req.body === 'object') {
            const sanitized = {};
            allowedFields.forEach((field) => {
                if (field in req.body) {
                    sanitized[field] = req.body[field];
                }
            });
            req.body = sanitized;
        }
        next();
    };
}
/**
 * Trim string values in request body
 */
export function trimBody(req, _res, next) {
    if (req.body && typeof req.body === 'object') {
        Object.keys(req.body).forEach((key) => {
            if (typeof req.body[key] === 'string') {
                req.body[key] = req.body[key].trim();
            }
        });
    }
    next();
}
/**
 * Convert numeric strings to numbers
 */
export function convertNumericBody(fields) {
    return (req, _res, next) => {
        if (req.body && typeof req.body === 'object') {
            fields.forEach((field) => {
                if (field in req.body && typeof req.body[field] === 'string') {
                    const num = parseFloat(req.body[field]);
                    if (!isNaN(num)) {
                        req.body[field] = num;
                    }
                }
            });
        }
        next();
    };
}
/**
 * Parse JSON fields in request body
 */
export function parseJsonFields(fields) {
    return (req, _res, next) => {
        if (req.body && typeof req.body === 'object') {
            fields.forEach((field) => {
                if (field in req.body && typeof req.body[field] === 'string') {
                    try {
                        req.body[field] = JSON.parse(req.body[field]);
                    }
                    catch {
                        // Keep original value if parsing fails
                    }
                }
            });
        }
        next();
    };
}
export default {
    validate,
    validateBody,
    validateQuery,
    validateParams,
    validateMultiple,
    sanitizeBody,
    trimBody,
    convertNumericBody,
    parseJsonFields,
};
//# sourceMappingURL=validation.js.map