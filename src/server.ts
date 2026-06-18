import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerJsdoc from "swagger-jsdoc";
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import webhookService
from "./services/webhook.service.js";
import webhooksRoutes from "./routes/webhooks.routes.js";
// import { swaggerSpec } from "./config/swagger.js";
// Load env
dotenv.config();
import route from "./routes/index.js";
// Configs
import { connectDatabase } from './config/database.js';
import { redis } from './config/redis.js';
import { verifyCloudinaryConnection } from './config/cloudinary.js';
import { xrplService } from './config/xrpl.js';
import logger from './config/logger.js';

// Middlewares
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { expressRateLimiter } from './middleware/rateLimiter.js';

// Routes
// import routes from "./routes/listing.routes.js";
import { swaggerUi } from './config/swagger.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app: Application = express();
const PORT = process.env.PORT || 5000;

// ============================================
// GLOBAL MIDDLEWARE
// ============================================

app.use(helmet());
// app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(cors({
  origin: true,
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(expressRateLimiter);

// Logger
app.use((req, _res, next) => {
  logger.http(`${req.method} ${req.originalUrl}`);
  next();
});


// app.use(
//     "/api/v1/webhooks",
//     webhooksRoutes
// );
// ============================================
// SWAGGER SETUP (FIXED)
// ============================================

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Ahia Marketplace API',
      version: '1.0.0',
      description: 'Full API documentation for Ahia Marketplace',
    },
    servers: [
      {
        url: `http://localhost:${PORT}/api/v1`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        RegisterInput: {
          type: 'object',
          example: {
            email: 'test@example.com',
            password: 'Password123!',
            firstName: 'John',
            lastName: 'Doe',
            campusId: 'uuid-here'
          },
        },
        LoginInput: {
          type: 'object',
          example: {
            email: 'test@example.com',
            password: 'Password123!'
          },
        },
        CreateListingInput: {
          type: 'object',
          example: {
            title: 'iPhone 13',
            description: 'Clean phone, no issues',
            category: 'electronics',
            condition: 'like_new',
            listingType: 'BUY_NOW',
            buyNowPrice: 300000
          },
        },
      },
    },
  },

  // ✅ SUPPORT BOTH DEV (.ts) AND PROD (.js)
apis: [
  './src/routes/*.ts',
  './src/routes/**/*.ts',
  './dist/routes/*.js',
  './dist/routes/**/*.js',
],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// ✅ MUST COME BEFORE ROUTES
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/docs.json', (_req, res) => {
  res.json(swaggerSpec);
});

// ============================================
// ROUTES
// ============================================

// app.use('/api', routes);
app.use('/api', route);


// ============================================
// STATIC FILES
// ============================================

if (process.env.NODE_ENV === 'development') {
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
}

// ============================================
// ERROR HANDLING (LAST)
// ============================================

app.use(notFoundHandler);
app.use(errorHandler);





// ============================================
// SERVER STARTUP
// ============================================

async function startServer() {
  try {
    await connectDatabase();
    logger.info('Database connected');

    await redis.ping();
    logger.info('Redis connected');

    try {
      await verifyCloudinaryConnection();
    } catch {
      logger.warn('Cloudinary not configured');
    }

    // ✅ XRPL CONNECT ONCE
    try {
      await xrplService.connect();
      logger.info('XRPL connected');
    } catch (err) {
      logger.warn('XRPL not connected');
    }


    await webhookService.start();

logger.info(
    "XRPL Webhook Listening"
);   

    // ✅ START SERVER ONLY ONCE
    app.listen(PORT, () => {
      logger.info(`Server running on http://localhost:${PORT}`);
      logger.info(`Swagger docs: http://localhost:${PORT}/docs`);
    });

  } catch (error) {
    logger.error('Startup error:', error);
    process.exit(1);
  }
}

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

async function gracefulShutdown(signal: string) {
  logger.info(`${signal} received... shutting down`);

  try {
    const { disconnectDatabase } = await import('./config/database.js');
    await disconnectDatabase();
    await webhookService.stop();
    await redis.quit();
    await xrplService.disconnect();

    process.exit(0);
  } catch (error) {
    logger.error(error);
    process.exit(1);
  }
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

process.on('uncaughtException', (err) => {
  logger.error(err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error(reason);
});



// START
startServer();

export default app;