// @flow

import { Request, Response, NextFunction } from 'express';
import VariationServices from '../services/VariationServices';

export default {
  /**
   * testApi
   * @param {*} request 
   * @param {*} response 
   * @param {*} next 
   */
  async testApi(request: Request, response: Response, next: NextFunction) {
    return response.status(200).send('Full authentication is required to access resource');
  },
  
  /**
  * GET Service Variation
  * @public
  */
  async getServiceVariation(request: Request, response: Response, next: NextFunction) {
    const result = await VariationServices.getServiceVariation(request.body);
    return response.status(result.statusCode).send(result);
  },

  /**
  * GET Available Services
  * @public
  */
  async getAvailableServiceResource(request: Request, response: Response, next: NextFunction) {
    const result = await VariationServices.getAvailableServiceResource(request);
    return response.status(result.statusCode).send(result);
  },

  /**
   * Get available service types
   * @param {*} request 
   * @param {*} response 
   * @param {*} next
   * @public
   */
  async getAvailableServiceTypes(request: Request, response: Response, next: NextFunction) {
    const result = await VariationServices.getAvailableServiceTypes(request);
    return response.status(result.statusCode).send(result);
  },

  /**
  * Get Approved Payment Methods
  * @public
  */
  async getApprovedPaymentMethods (request: Request, response: Response, next: NextFunction) {
    const result = await VariationServices.getApprovedPaymentMethods(request)
    return response.status(result.statusCode).send(result);
  },

  /**
   * Get All Service Charges
   * @public
   */
  async getAllServiceCharges(request: Request, response: Response, next: NextFunction) {
    const result = await VariationServices.getAllServiceCharges(request);
    return response.status(result.statusCode).send(result);
  },

  /**
   * getAllUserServiceCharges
   * @param {*} request 
   * @param {*} response 
   * @param {*} next 
   */
  async getAllServiceChargesByUser(request: Request, response: Response, next: NextFunction) {
    const result = await VariationServices.getAllServiceChargesByUser(request);
    return response.status(result.statusCode).send(result);
  },

  /**
  * Get One Charge
  * @public
  */
  async getOneCharge(request: Request, response: Response, next: NextFunction) {
    const result = await VariationServices.getOneCharge(request);
    return response.status(result.statusCode).send(result);
  },

  /**
   * getOneUserCharge
   * @param {*} request 
   * @param {*} response 
   * @param {*} next 
   */
  async getOneChargeByUser(request: Request, response: Response, next: NextFunction) {
    const result = await VariationServices.getOneChargeByUser(request);
    return response.status(result.statusCode).send(result);
  },

  /**
   * Get Available Service Platforms
   * @public
   */
  async getAvailableServicePlatforms(request, response, next) {
    const result = await VariationServices.getAvailableServicePlatforms(request);
    return response.status(result.statusCode).send(result);
  },

  /**
   * getListedBanks
   * @public
   */
  // async getListedBanks(request, response, next) {
  //   const result = await VariationServices.getListedBanks(request);
  //   return response.status(result.statusCode).send(result);
  // },

  /**
   * getListedBanks
   * @param {*} request 
   * @param {*} response 
   * @param {*} next 
   */
  async getListedBanks(request, response, next) {
    const result = await VariationServices.getListedBanksForTransferV2(request);
    return response.status(result.statusCode).send(result);
  },

  /**
   * verifyBankAccount
   * @param {*} request 
   * @param {*} response 
   * @param {*} next
   * @public 
   */
  async verifyBankAccount(request, response, next) {
    const result = await VariationServices.verifyBankAccount(request);
    return response.status(result.statusCode).send(result);
  },

  /**
   * verifyBankAccountV2
   * @param {*} request 
   * @param {*} response 
   * @param {*} next 
   */
  async verifyBankAccountV2(request, response, next) {
    const result = await VariationServices.verifyBankAccountForTransfersV2(request);
    return response.status(result.statusCode).send(result);
  },
}