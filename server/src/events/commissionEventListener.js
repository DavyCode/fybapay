// @flow

import Pubsub from '../events'
// import { sendSms } from '../utils/Sms';

/**
 * Subscribe to Transfer from wallet event
 */
Pubsub.on('commission_wallet_not_found', async function(message) {
  /**
   * @todo - MAIL ADMIN
   */
});


/**
 * Subscribe to Transfer commission to wallet
 */
Pubsub.on('commission_transfer_to_wallet', async function(message) {
  /**
   * @todo - MAIL USER
   */
});

export default Pubsub;
