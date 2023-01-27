const Agenda = require('agenda');
import { DBURL } from '../../config/env';

async function run() {
  const agenda = new Agenda({
    db: { address: DBURL, collection: 'jobs' }
  })

  // Wait for agenda to connect. Should never fail since connection failures
  // should happen in the `await MongoClient.connect()` call.
  await new Promise(resolve => agenda.once('ready', resolve));

  // Schedule a job for 1 second from now and persist it to mongodb.
  // Jobs are uniquely defined by their name, in this case "hello"
  agenda.schedule(new Date(Date.now() + 1000), 'hello', {
    message: 'Hello!'
  });
}

// run().catch(error => {
//   console.error(error);
//   process.exit(-1);
// });

export default run
