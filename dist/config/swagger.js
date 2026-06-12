import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Ahia API",
            version: "1.0.0",
            description: "API documentation for Ahia Marketplace",
        },
        servers: [
            {
                url: "http://localhost:5000",
            },
        ],
    },
    // ⚠️ VERY IMPORTANT
    apis: ["./src/routes/*.ts"], // for dev (ts-node)
    // apis: ["./dist/routes/*.js"], // for production (compiled)
};
const swaggerSpec = swaggerJSDoc(options);
export { swaggerUi, swaggerSpec };
//# sourceMappingURL=swagger.js.map