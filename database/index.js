// /db/mongo.js
require('dotenv').config();
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME; // keep this name; align error text below

let client;
let db;

async function connect() {
  if (db) return db;
  if (!uri) throw new Error('Missing MONGODB_URI in environment');
  if (!dbName) throw new Error('Missing DB_NAME in environment');

  client = new MongoClient(uri /* , { serverApi: { version: '1', strict: true, deprecationErrors: true } } */);
  await client.connect();
  db = client.db(dbName);
  console.log(`[mongo] connected to "${dbName}"`);
  return db;
}

function getDb() {
  if (!db) throw new Error('Mongo not initialized. Call connect() first.');
  return db;
}

function getCollection(name) {
  return getDb().collection(name);
}

async function close() {
  if (client) {
    await client.close();
    client = undefined;
    db = undefined;
    console.log('[mongo] connection closed');
  }
}

process.on('SIGINT', () => close().finally(() => process.exit(0)));
process.on('SIGTERM', () => close().finally(() => process.exit(0)));

module.exports = { connect, getDb, getCollection, close };