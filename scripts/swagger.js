// scripts/swagger.js
require('dotenv').config();
const swaggerAutogen = require('swagger-autogen')({ openapi: '3.0.3' });

const outputFile = './docs/swagger.json';
const endpointsFiles = ['./routers/index.js'];

const doc = {
  info: { title: 'Storefront API', version: '1.0.0', description: 'Items CRUD API' },
  servers: [
    // 👇 IMPORTANT: include /api here so Try it Out calls /api/items, etc.
    { url: `http://localhost:${process.env.PORT || 3000}/api`, description: 'Local' },
  ],
  tags: [{ name: 'Items' }],
  components: {
    schemas: {
      Item: {
        type: 'object',
        required: ['name', 'price'],
        properties: {
          _id: { type: 'string', description: 'Mongo ObjectId', example: '66f0b8f3d9c0a8a7d1a2b3c4' },
          name: { type: 'string', example: 'Widget' },
          price: { type: 'number', example: 12.5 },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      // Envelopes
      ItemResponse: {
        type: 'object',
        properties: {
          status: { type: 'integer', example: 200 },
          data: { $ref: '#/components/schemas/Item' }
        }
      },
      ItemListResponse: {
        type: 'object',
        properties: {
          status: { type: 'integer', example: 200 },
          data: { type: 'array', items: { $ref: '#/components/schemas/Item' } }
        }
      },
      MessageResponse: {
        type: 'object',
        properties: {
          status: { type: 'integer', example: 200 },
          message: { type: 'string', example: 'Deleted' }
        }
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          status: { type: 'integer', example: 404 },
          error: { type: 'string', example: 'Not found' }
        }
      }
    },
    parameters: {
      MongoId: { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
    }
  }
};

swaggerAutogen(outputFile, endpointsFiles, doc);