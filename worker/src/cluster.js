// @flow

/**
  * Run node in cluster mode
 */
import cluster from 'cluster';
import os from 'os';
import Pubsub from './events/clusterEventlistener';

if (cluster.isMaster) {
  // get no of CPU's in machine
  const cpuCount = os.cpus().length;

  console.log(`&&&&&& Master cluster setting up ${cpuCount} workers &&&&&&`);

  // create a worker for each CPU
  for (let i = 0; i < cpuCount; i+= 1) {
    cluster.fork();
  }

  cluster.on('online', (worker) => {
    console.log(`Worker ${worker.process.pid} is online`);
    Pubsub.emit('worker_online', worker.process.pid);
  });

  // Lister for dead workers
  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died with code: ${code} (signal: ${signal})`);
    console.log('New worker starting');
    Pubsub.emit('worker_died', worker.process.pid);

    cluster.fork();
  });
} else {
  // require server here
  require('./bin/www');
}

// // In the master:
// for (var i = 0; i < cpuCount; i += 1) {
//   cluster.fork({ RUN_CRON : process.env.SRV_TYPE === "cron" && i === 0 });
// }

// // In the worker:
// if (process.env.RUN_CRON === 'true') {
//   ...create the scheduler...
// }