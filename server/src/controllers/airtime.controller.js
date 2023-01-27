// @flow

import { Request, Response, NextFunction } from 'express';
import AirtimeServices from '../services/AirtimeServices';

export default {
  /**
  * Virtual Top Up
  * @param {string} mobileNumber 
  * @param {string} serviceName 
  * @param {number} amount 
  * @param {number} paymentMadeWith 
  * @public
  */
  async airtimeTopUp(request: Request, response: Response, next: NextFunction) {
    const result = await AirtimeServices.airtimeTopUp(request);
    return response.status(result.statusCode).send(result);
  },

}