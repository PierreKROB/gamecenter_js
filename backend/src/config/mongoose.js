import mongoose from 'mongoose';
import config from './config';
import logger from './logger';

const mongooseConnect = async () => {
  try {
    await mongoose.connect(config.DATABASE_URI);
    logger.info('🚀 Connected to MongoDB!');
  } catch (error) {
    logger.error(`❌ MongoDB connection error: ${error}`);
    process.exit(1);
  }

  mongoose.connection.on('disconnected', () => {
    logger.error('❌ MongoDB disconnected!');
  });

  mongoose.connection.on('reconnected', () => {
    logger.info('🚀 MongoDB reconnected!');
  });
};

module.exports = mongooseConnect;
