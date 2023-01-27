// @flow

import { Request, Response, NextFunction } from 'express';
import PaymentSecretServices from '../services/PaymentSecretServices';

export default {
  /**
  * confirmUserPin
  * @public
  */
  async confirmUserPin(request: Request, response: Response, next: NextFunction) {
    const result = await PaymentSecretServices.confirmUserPin(request);
    return response.status(result.statusCode).send(result);
  },

  /**
   * resetUserPaymentSecret
   * @param {*} request 
   * @param {*} response 
   * @param {*} next 
   */
  async resetUserPaymentSecret(request: Request, response: Response, next: NextFunction) {
    const result = await PaymentSecretServices.resetUserPaymentSecret(request);
    return response.status(result.statusCode).send(result);
  },
}