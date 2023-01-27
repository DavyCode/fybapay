// @flow

/**
*  Use Pub/Sub layer to handle background event/processes
* npm i event-dispatch
* Allows to dispatch events across the application.
*/

import EventEmitter from 'events';

class ServerEventEmitter extends EventEmitter {}

const Pubsub = new ServerEventEmitter();

Pubsub.on('event', (users) => {
  console.log('an event occurred!', users);
});

Pubsub.on('error', (err) => {
  console.log("Log unknown error to logger/file", {err});
  console.error('Pubsub - whoops! there was an error');
});


export default Pubsub;
