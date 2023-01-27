// @flow

import { Request, Response, NextFunction } from 'express';
import BeneficiaryServices from '../services/BeneficiaryServices';

export default {
  /**
  * find Beneficiary By Id
  * @public
  */
  async findBeneficiaryById(request: Request, response: Response, next: NextFunction) {
    const result = await BeneficiaryServices.findBeneficiaryById(request);
    return response.status(result.statusCode).send(result);
  },

  /**
   * get User Beneficiary
   * @param {*} request 
   * @param {*} response 
   * @param {*} next
   * @public 
   */
  async getUserBeneficiary(request: Request, response: Response, next: NextFunction) {
    const result = await BeneficiaryServices.getUserBeneficiary(request);
    return response.status(result.statusCode).send(result);
  },

  /**
   * get All Beneficiaries
   * @param {*} request 
   * @param {*} response 
   * @param {*} next
   * @public
   */
  async getAllBeneficiaries(request: Request, response: Response, next: NextFunction) {
    const result = await BeneficiaryServices.getAllBeneficiaries(request);
    return response.status(result.statusCode).send(result);
  },
};
