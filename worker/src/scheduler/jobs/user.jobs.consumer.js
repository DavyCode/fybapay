//@ flow

import Agenda from 'agenda';
import { DBURL } from '../../config/env';

async function run() {
  const agenda = new Agenda({
    db: { address: DBURL, collection: 'jobs'}
  })
  agenda.processEvery('5 seconds');
  agenda.maxConcurrency(20);


  // Define a "job", an arbitrary function that agenda can execute
  agenda.define('hello', (job) => {
    console.log('Hello, World!');
    console.log({MESSAGE: job.attrs.data.message});
    // process.exit(0);
  });

  // Wait for agenda to connect. Should never fail since connection failures
  // should happen in the `await MongoClient.connect()` call.
  await new Promise(resolve => agenda.once('ready', resolve));

  // `start()` is how you tell agenda to start processing jobs. If you just
  // want to produce (AKA schedule) jobs then don't call `start()`
  agenda.start();
}

// run().catch(error => {
//   console.error(error);
//   process.exit(-1);
// });
export default run;