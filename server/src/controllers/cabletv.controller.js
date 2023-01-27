// @flow

import { Request, Response, NextFunction } from 'express';
import CabletvServices from '../services/CabletvServices';

export default {
  /**
  * Buy Cable TV
  * @param {string} smartCardNumber 
  * @param {string} serviceName 
  * @param {number} amount
  * @param {number} paymentMadeWith  
  * @param {string} mobileNumber
  * @param {string} customername
  * @param {string} customernumber
  * @public
  */
  async vendCableTv(request: Request, response: Response, next: NextFunction) {
    const result = await CabletvServices.vendCableTv(request);
    return response.status(result.statusCode).send(result);
  },

  /**
  * Verify SmartCard Number
  * @param {string} smartCardNumber 
  * @param {string} serviceName 
  * @public
  */
  async verifySmartCardNumber(request: Request, response: Response, next: NextFunction) {
    const result = await CabletvServices.verifySmartCardNumber(request.body);
    return response.status(result.statusCode).send(result);
  }, 

  /**
  * Get CableTv Transaction Charge
  * @public
  */
  async getCableTvCharge(request: Request, response: Response, next: NextFunction) {
    const result = await CabletvServices.getCableTvCharge();
    return response.status(result.statusCode).send(result);
  },
}