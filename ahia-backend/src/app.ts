import express from "express";
import cors from "cors";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";

import authRoutes from "./modules/auth/auth.routes.js";

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());

// Swagger config
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Ahia API",
      version: "1.0.0",
      description: "Campus Marketplace API",
    },
    servers: [
      {
        url: "http://localhost:5000/api",
      },
    ],
  },
  apis: ["./src/modules/**/*.ts"],
};

const swaggerSpec = swaggerJsdoc(options);


app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use("/api/auth", authRoutes);

export default app;