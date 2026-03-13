const mongoose = require('mongoose');
const env = require('../config/env');
const logger = require('../config/logger');

async function connectDatabase() {
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.mongodbUri);
  logger.info('MongoDB connection established');
}

module.exports = { connectDatabase };