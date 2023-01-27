import app from './setup/express';
import database from './setup/database';
import logging from './setup/logging';
import startups from './setup/startups';
import Scheduler from './scheduler';

logging();
database();
startups();
Scheduler();

export default app;
