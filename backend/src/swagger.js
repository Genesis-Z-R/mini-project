import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env.js';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Estudy Student Workspace API',
      version: '1.0.0',
      description: 'Node.js REST API Backend for Estudy Student Workspace'
    },
    servers: [
      {
        url: `http://localhost:${env.PORT || 8080}/api`,
        description: 'Development Server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./src/routes/*.js']
};

const swaggerSpec = swaggerJSDoc(options);

export const setupSwagger = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};
