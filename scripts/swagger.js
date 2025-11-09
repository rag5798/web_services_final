// scripts/swagger.js
require('dotenv').config();
const swaggerAutogen = require('swagger-autogen')({ openapi: '3.0.3' });

const outputFile = './docs/swagger.json';
const endpointsFiles = [
  './routers/index.js',
  './routers/auth.js',
  './routers/oauth.js'   // 👈 add this
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
      Item: {
        type: 'object',
        required: ['name', 'price'],
        properties: {
          _id: { type: 'string', description: 'Mongo ObjectId' },
          name: { type: 'string', example: 'Widget' },
          price: { type: 'number', example: 12.5 },
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
    },
  },
};

swaggerAutogen(outputFile, endpointsFiles, doc);