import app from './setup/express';
import database from './setup/database';
import logging, { logger } from './setup/logging';
import startups from './setup/startups';
// require('./services/api/firebaseServices');
// console.log({ logging, logger })

logging();
database();
startups();

export default app;
