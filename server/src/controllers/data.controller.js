// @flow

import { Request, Response, NextFunction } from 'express';
import DataServices from '../services/DataServices';

export default {
  /**
  * Data Top Up
  * @param {string} mobileNumber 
  * @param {string} serviceName 
  * @param {number} amount
  * @param {number} paymentMadeWith  
  * @public
  */
  async dataTopUp(request: Request, response: Response, next: NextFunction) {
    const result = await DataServices.dataTopUp(request);
    return response.status(result.statusCode).send(result);
  },

  /**
  * Verify Mobile Data Number
  * @param {string} mobileNumber 
  * @param {String} serviceName 
  * @public
  */
  async verifyMobileDataNumber(request: Request, response: Response, next: NextFunction) {
    const result = await DataServices.verifyMobileDataNumber(request.body);
    return response.status(result.statusCode).send(result);
  }, 
}