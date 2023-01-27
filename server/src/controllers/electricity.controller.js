// @flow

import { Request, Response, NextFunction } from 'express';
import ElectricityServices from '../services/ElectricityServices';

export default {
  /**
  * Buy Electricity
  * @param {string} meterNumber 
  * @param {string} serviceName 
  * @param {number} amount
  * @param {number} paymentMadeWith  
  * @param {string} mobileNumber
  * @param {string} customername
  * @param {string} customernumber
  * @public
  */
  async vendElectricity(request: Request, response: Response, next: NextFunction) {
    const result = await ElectricityServices.vendElectricity(request);
    return response.status(result.statusCode).send(result);
  },

  /**
  * Verify Meter Number
  * @param {string} meterNumber 
  * @param {string} serviceName 
  * @public
  */
  async verifyUserMeter(request: Request, response: Response, next: NextFunction) {
    const result = await ElectricityServices.verifyUserMeter(request.body);
    return response.status(result.statusCode).send(result);
  }, 

  /**
  * Get Transaction Charge
  * @public
  */
  async getElectricityCharge(request: Request, response: Response, next: NextFunction) {
    const result = await ElectricityServices.getElectricityCharge();
    return response.status(result.statusCode).send(result);
  },
}