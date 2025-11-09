// routers/index.js
const express = require('express');
const { ObjectId } = require('mongodb');
const { getCollection } = require('../database/index');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();
const coll = () => getCollection('items');

// uniform JSON envelope
const send = (res, httpStatus, payload = {}) => res.status(httpStatus).json({ status: httpStatus, ...payload });

// helper: parse strictly 24-hex ObjectId
const parseOid = (id) => (ObjectId.isValid(id) && String(new ObjectId(id)) === id ? new ObjectId(id) : null);

// GET /api/items
router.get('/items', async (req, res, next) => {
  /* #swagger.tags = ['Items']
     #swagger.summary = 'List items'
     #swagger.parameters['skip'] = { in: 'query', schema: { type: 'integer', minimum: 0 } }
     #swagger.parameters['limit'] = { in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100 } }
     #swagger.responses[200] = { description: 'OK', content: { "application/json": { schema: { $ref: '#/components/schemas/ItemListResponse' } } } }
  */
  try {
    const skip = Math.max(0, parseInt(req.query.skip ?? '0', 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit ?? '50', 10)));
    const items = await coll().find({}).skip(skip).limit(limit).toArray();
    return send(res, 200, { data: items });
  } catch (err) { next(err); }
});

// GET /api/items/:id
router.get('/items/:id', async (req, res, next) => {
  /* #swagger.tags = ['Items']
     #swagger.summary = 'Get item by ID'
     #swagger.parameters['id'] = { $ref: '#/components/parameters/MongoId' }
     #swagger.responses[200] = { description: 'OK', content: { "application/json": { schema: { $ref: '#/components/schemas/ItemResponse' } } } }
     #swagger.responses[400] = { description: 'Invalid ID', content: { "application/json": { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
     #swagger.responses[404] = { description: 'Not Found', content: { "application/json": { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
  */
  try {
    const oid = parseOid(req.params.id);
    if (!oid) return send(res, 400, { error: 'Invalid id' });

    const item = await coll().findOne({ _id: oid });
    if (!item) return send(res, 404, { error: 'Not found' });
    return send(res, 200, { data: item });
  } catch (err) { next(err); }
});

// POST /api/items
router.post('/items', requireAuth, async (req, res, next) => {
  /* #swagger.tags = ['Items']
     #swagger.summary = 'Create item'
     #swagger.requestBody = {
       required: true,
       content: { "application/json": {
         schema: { type: 'object', required: ['name', 'price'], properties: { name: { type: 'string' }, price: { type: 'number' } } },
         examples: { sample: { value: { name: 'Widget', price: 12.5 } } }
       } }
     }
     #swagger.responses[201] = { description: 'Created', content: { "application/json": { schema: { $ref: '#/components/schemas/ItemResponse' } } } }
     #swagger.responses[400] = { description: 'Bad Request', content: { "application/json": { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
  */
  try {
    const { name, price } = req.body || {};
    if (!name || price == null) return send(res, 400, { error: 'name and price are required' });

    // Ignore any client _id so Mongo assigns an ObjectId
    const doc = { name: String(name), price: Number(price), createdAt: new Date() };
    const result = await coll().insertOne(doc);

    res.location(`/api/items/${result.insertedId}`);
    return send(res, 201, { data: { _id: result.insertedId, ...doc } });
  } catch (err) { next(err); }
});

// PUT /api/items/:id
router.put('/items/:id', requireAuth, async (req, res, next) => {
  /* #swagger.tags = ['Items']
     #swagger.summary = 'Replace an item (full update)'
     #swagger.parameters['id'] = { $ref: '#/components/parameters/MongoId' }
     #swagger.requestBody = {
       required: true,
       content: { "application/json": {
         schema: { type: 'object', required: ['name','price'], properties: { name: { type: 'string' }, price: { type: 'number' } } }
       } }
     }
     #swagger.responses[201] = { description: 'Updated', content: { "application/json": { schema: { $ref: '#/components/schemas/ItemResponse' } } } }
     #swagger.responses[400] = { description: 'Bad Request', content: { "application/json": { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
     #swagger.responses[404] = { description: 'Not Found', content: { "application/json": { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
  */
  try {
    const oid = (ObjectId.isValid(req.params.id) && String(new ObjectId(req.params.id)) === req.params.id)
      ? new ObjectId(req.params.id)
      : null;
    if (!oid) return send(res, 400, { error: 'Invalid id' });

    const { name, price } = req.body || {};
    if (!name || price == null) return send(res, 400, { error: 'name and price required' });

    const update = { $set: { name: String(name), price: Number(price), updatedAt: new Date() } };

    const upd = await coll().updateOne({ _id: oid }, update);
    if (upd.matchedCount === 0) return send(res, 404, { error: 'Not found' });

    const doc = await coll().findOne({ _id: oid });
    return send(res, 201, { data: doc });
  } catch (err) { next(err); }
});

// DELETE /api/items/:id
router.delete('/items/:id', requireAuth, async (req, res, next) => {
  /* #swagger.tags = ['Items']
     #swagger.summary = 'Delete item'
     #swagger.parameters['id'] = { $ref: '#/components/parameters/MongoId' }
     #swagger.responses[200] = { description: 'Deleted', content: { "application/json": { schema: { $ref: '#/components/schemas/MessageResponse' } } } }
  */
  try {
    const oid = parseOid(req.params.id);
    if (!oid) return send(res, 400, { error: 'Invalid id' });

    const result = await coll().deleteOne({ _id: oid });
    if (!result.deletedCount) return send(res, 404, { error: 'Not found' });
    return send(res, 200, { message: 'Deleted' });
  } catch (err) { next(err); }
});

module.exports = router;