// @flow

import Pubsub from '../events'
// import { sendSms } from "../utils/Sms";

/**
 * Subscribe to registration
 */
Pubsub.on('api_error', async function(message) {
  console.log('Pubsub api_error: starting to log Api error...');
  console.log("LOG THIS ERROR TO A DB", {message}, "...........")
  console.log('Pubsub api_error logged...');
});


export default Pubsub;