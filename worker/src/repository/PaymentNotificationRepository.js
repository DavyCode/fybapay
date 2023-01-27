// @flow

import { PaymentNotification } from '../models';

export default {
  /**
   * Save Payment Notification
   * @param {} PaymentInstance 
   */
  async savePaymentNotification(PaymentInstance: PaymentNotification) {
    return await PaymentInstance.save();
  },

  /**
  * Create Transaction
  * @private
  */
  async createPaymentNotification(params: {}) {
    return await PaymentNotification.create(params);
  },
};
