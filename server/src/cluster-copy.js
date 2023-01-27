// // @flow

// import cluster from 'cluster';
// import os from 'os';

// const httpServer = require('./app/http-server');
// const jobWorker = require('./app/job-worker');

// const jobWorkers = [];
// const webWorkers = [];


// function addWebWorker() {
//   webWorkers.push(cluster.fork({ web: 1 }).id);
// }

// function addJobWorker() {
//   jobWorkers.push(cluster.fork({ job: 1 }).id);
// }

// function removeWebWorker(id) {
//   webWorkers.splice(webWorkers.indexOf(id), 1);
// }

// function removeJobWorker(id) {
//   jobWorkers.splice(jobWorkers.indexOf(id), 1);
// }


// if (cluster.isMaster) {
//   const cpuCount = os.cpus().length;
//   // Create a worker for each CPU
//   for (let i = 0; i < cpuCount; i += 1) {
//     addJobWorker();
//     addWebWorker();
//   }

//   cluster.on('exit', (worker, code, signal) => {
//     if (jobWorkers.indexOf(worker.id) !== -1) {
//       console.log(`job worker ${worker.process.pid}
// exited (signal: ${signal}). Trying to respawn...`);
//       removeJobWorker(worker.id);
//       addJobWorker();
//     }

//     if (webWorkers.indexOf(worker.id) !== -1) {
//       console.log(`http worker ${worker.process.pid}
// exited (signal: ${signal}). Trying to respawn...`);
//       removeWebWorker(worker.id);
//       addWebWorker();
//     }
//   });
// } else {
//   if (process.env.web) {
//     console.log(`start http server: ${cluster.worker.id}`);
//     // Initialize the http server here
//     httpServer.start();
//   }

//   if (process.env.job) {
//     console.log(`start job server: ${cluster.worker.id}`);
//     // Initialize the Agenda here
//     jobWorker.start();
//   }
// }
