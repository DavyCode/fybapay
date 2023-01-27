// @flow

import Pubsub from '../events'

/**
 * Subscribe to node custering
 */
Pubsub.on('worker_online', async function(message) {
  console.log(`Pubsub - New worker: ${message} online : new worker ...`);
  /**
   * @todo - MAIL ADMIN
   */
  console.log('TODO:  MAIL ADMIN worker online', {message}, '...........')
});

/**
 * 
 */
Pubsub.on('worker_died', async function(message) {
  console.log('Pubsub - Worker died: ${message}');
  /**
   * @todo - MAIL ADMIN
   */
  console.log('TODO:  MAIL ADMIN worker died', {message}, '...........')
});


export default Pubsub;
