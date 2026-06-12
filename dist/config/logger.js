import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Log levels
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};
// Log colors
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
};
winston.addColors(colors);
// Determine log level based on environment
const level = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'development' ? 'debug' : 'info');
// Custom format for console output
const consoleFormat = winston.format.combine(winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston.format.colorize({ all: true }), winston.format.printf((info) => `${info.timestamp} [${info.level}]: ${info.message}${info.stack ? '\n' + info.stack : ''}`));
// Custom format for file output
const fileFormat = winston.format.combine(winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston.format.errors({ stack: true }), winston.format.json());
// Create transports array
const transports = [
    // Console transport
    new winston.transports.Console({
        format: consoleFormat,
    }),
];
// Add file transport in production
if (process.env.NODE_ENV === 'production') {
    const logFile = process.env.LOG_FILE || 'logs/app.log';
    const logDir = path.dirname(logFile);
    transports.push(new winston.transports.File({
        filename: path.join(logDir, 'error.log'),
        level: 'error',
        format: fileFormat,
    }), new winston.transports.File({
        filename: logFile,
        format: fileFormat,
    }));
}
// Create logger instance
const logger = winston.createLogger({
    level,
    levels,
    transports,
    exitOnError: false,
});
// Stream for Morgan HTTP logging integration
export const stream = {
    write: (message) => {
        logger.http(message.trim());
    },
};
// Helper methods for structured logging
export const logError = (message, error, meta) => {
    const errorMeta = { ...meta };
    if (error instanceof Error) {
        errorMeta.errorName = error.name;
        errorMeta.errorMessage = error.message;
        errorMeta.stack = error.stack;
    }
    else if (error) {
        errorMeta.error = error;
    }
    logger.error(message, errorMeta);
};
export const logInfo = (message, meta) => {
    logger.info(message, meta);
};
export const logWarn = (message, meta) => {
    logger.warn(message, meta);
};
export const logDebug = (message, meta) => {
    logger.debug(message, meta);
};
export const logHttp = (message, meta) => {
    logger.http(message, meta);
};
// Request context logger
export const createRequestLogger = (requestId) => {
    return {
        error: (message, error, meta) => {
            logError(message, error, { ...meta, requestId });
        },
        info: (message, meta) => {
            logInfo(message, { ...meta, requestId });
        },
        warn: (message, meta) => {
            logWarn(message, { ...meta, requestId });
        },
        debug: (message, meta) => {
            logDebug(message, { ...meta, requestId });
        },
    };
};
export default logger;
//# sourceMappingURL=logger.js.map