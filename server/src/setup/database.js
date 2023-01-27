import mongoose from 'mongoose';
import winston from 'winston';
import { DBURL } from '../config/env';

const database = () => {
  /********************
   * database config  *
   ********************/
  let db;

  mongoose.Promise = require('bluebird');

  const options = {
    useNewUrlParser: true,
    useCreateIndex: true,
    socketTimeoutMS: 0,
    keepAlive: true,
    // usePushEach: true
  };

  mongoose.set('useFindAndModify', false);
  mongoose.set('useUnifiedTopology', true);
  mongoose.connect(DBURL, options);
  db = mongoose.connection;
  db.on('error', (err) => {
    winston.error('There was a db connection error', err);
  });
  db.once('connected', () => {
    winston.info('DB connection created successfully!');
  });
  db.once('disconnected', () => {
    winston.info('DB connection disconnected!');
  });
  process.on('SIGINT', () => {
    mongoose.connection.close((err) => {
      winston.info('DB connection closed due to app termination');
      process.exit(err ? 1 : 0);
    });
  });
};

// This catches every exit event I can find that can be handled. Seems quite reliable and clean so far.
// [`exit`, `SIGINT`, `SIGUSR1`, `SIGUSR2`, `uncaughtException`, `SIGTERM`].forEach((eventType) => {
//   process.on(eventType, cleanUpServer.bind(null, eventType));
// });
// npm install node-cleanup --save

export { database as default };
