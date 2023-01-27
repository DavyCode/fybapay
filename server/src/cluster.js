// @flow

/**
  * Run node in cluster mode
 */
import cluster from 'cluster';
import os from 'os';
import Pubsub from './events/clusterEventlistener';
import { appLogger } from './setup/logging';
import { NODE_ENV } from './config/env';

if (cluster.isMaster) {
  // get no of CPU's in machine
  const cpuCount = os.cpus().length;

  appLogger.log('info', `&&&&&& Master cluster setting up ${cpuCount} workers &&&&&&`, {
    additionalInfo: {
      file: 'Cluster.js',
    },
  });

  // create a worker for each CPU
  for (let i = 0; i < cpuCount; i += 1) {
    cluster.fork();
  }

  cluster.on('online', (worker) => {

    appLogger.log('info', `Worker ${worker.process.pid} is online`, {
      additionalInfo: {
        file: 'Cluster.js',
      },
    });
  });

  // Lister for dead workers
  cluster.on('exit', (worker, code, signal) => {

    appLogger.log('info', `Worker ${worker.process.pid} died with code: ${code} (signal: ${signal})`, {
      additionalInfo: {
        file: 'Cluster.js',
      },
    });

    appLogger.log('info', 'New worker starting...', {
      additionalInfo: {
        file: 'Cluster.js',
      },
    });

    cluster.fork();
  });
} else {
  // require server here
  if (NODE_ENV === 'production') {
    require('./bin/www');
  }
  else {
    require('./bin/www');
  }
}

// // In the master:
// for (var i = 0; i < cpuCount; i += 1) {
//   cluster.fork({ RUN_CRON : process.env.SRV_TYPE === "cron" && i === 0 });
// }

// // In the worker:
// if (process.env.RUN_CRON === 'true') {
//   ...create the scheduler...
// }