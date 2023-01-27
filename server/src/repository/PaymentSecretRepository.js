// @flow

/**
 * Platforms Database Operations
 */

import { PaymentSecret } from '../models';
import Utility from '../utils';

export default {
  /**
  * getPaymentSecretByUserId
  * @private
  */
  async getPaymentSecretByUserId(userId: string) {
    return await PaymentSecret.findOne({ user: userId});
  },

  /**
   * createPaymentSecret
   * @param {*} params 
   */
  async createPaymentSecret(params: {}) {
    return await PaymentSecret.create(params);
  },

  /**
   * updatePaymentSecret
   * @param {*} query 
   * @param {*} update 
   * @param {*} option 
   */
  async updatePaymentSecret(query: {}, update: {}, option: { new: boolean, upsert: boolean }) {
    return await PaymentSecret.findOneAndUpdate(query, update, option);
  },

  /**
   * paymentSecretSave
   * @param {*} paymentSecretInstance 
   */
  async paymentSecretSave(paymentSecretInstance: PaymentSecret) {
    return await paymentSecretInstance.save();
  },
}