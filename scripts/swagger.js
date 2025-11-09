// scripts/swagger.js
require('dotenv').config();
const swaggerAutogen = require('swagger-autogen')({ openapi: '3.0.3' });

const outputFile = './docs/swagger.json';
const endpointsFiles = [
  './routers/index.js',
  './routers/auth.js',
  './routers/oauth.js'
];

const doc = {
  info: {
    title: 'Storefront API',
    version: '1.0.0',
    description: 'Items CRUD API with OAuth/JWT authentication',
  },
  servers: [
    { url: `http://localhost:${process.env.PORT || 3000}/api`, description: 'Local' },
    { url: 'https://web-services-final.onrender.com/api', description: 'Render (prod)' },
  ],
  tags: [
    { name: 'OAuth', description: 'Google OAuth 2.0 login' },
    { name: 'Auth', description: 'User registration and login' },
    { name: 'Items', description: 'CRUD operations for store items' },
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
      Item: {
        type: 'object',
        required: ['name', 'price'],
        properties: {
          _id: { type: 'string', description: 'Mongo ObjectId', example: '691024ceae194892f0154ea1' },
          name: { type: 'string', example: 'Widget' },
          price: { type: 'number', example: 12.5 },
          description: { type: 'string', example: 'A shiny widget' },
          sku: { type: 'string', example: 'WID-001' },
          quantity: { type: 'integer', example: 10 },
          category: { type: 'string', example: 'hardware' },
          isActive: { type: 'boolean', example: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },


      // for GET /items/:id success
      ItemResponse: {
        type: 'object',
        properties: {
          status: { type: 'integer', example: 200 },
          data: { $ref: '#/components/schemas/Item' },
        },
      },

      // for GET /items success (list)
      ItemListResponse: {
        type: 'object',
        properties: {
          status: { type: 'integer', example: 200 },
          data: {
            type: 'array',
            items: { $ref: '#/components/schemas/Item' },
          },
        },
      },

      // for 400 / 404
      ErrorResponse: {
        type: 'object',
        properties: {
          status: { type: 'integer', example: 400 },
          error: { type: 'string', example: 'Invalid id' },
        },
      },

      // for delete / simple messages
      MessageResponse: {
        type: 'object',
        properties: {
          status: { type: 'integer', example: 200 },
          message: { type: 'string', example: 'Deleted' },
        },
      },

      UserRegister: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', example: 'test1@example.com' },
          password: { type: 'string', example: 'password123' },
        },
        example: {
          email: 'test1@example.com',
          password: 'password123',
        },
      },
      UserLogin: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', example: 'test1@example.com' },
          password: { type: 'string', example: 'password123' },
        },
        example: {
          email: 'test1@example.com',
          password: 'password123',
        },
      },

      UpdateEmail: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', example: 'newemail@example.com' }
        }
      },
      UpdatePassword: {
        type: 'object',
        required: ['currentPassword', 'newPassword'],
        properties: {
          currentPassword: { type: 'string', example: 'password123' },
          newPassword: { type: 'string', example: 'newpassword456' }
        }
      },
    },
  },
};

swaggerAutogen(outputFile, endpointsFiles, doc);