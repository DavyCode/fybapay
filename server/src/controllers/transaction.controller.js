// @flow

import { Request, Response, NextFunction } from 'express';
import TransactionServices from '../services/TransactionServices'

export default {
  
  /**
   * Get All Transactions
   * @public
   */
  async getAllTransactionsAndByType (request: Request, response: Response, next: NextFunction) {
    const result = await TransactionServices.getAllTransactionsAndByTypeAndORStatus(request);
    return response.status(result.statusCode).send(result);
  },
  
  /**
   * Get Transactions By User And By Type And OR Status
   * @public
   */
  async getUserTransactionsAndByTypeAndORStatus(request: Request, response: Response, next: NextFunction) {
    const result = await TransactionServices.getUserTransactionsAndByTypeAndORStatus(request);
    return response.status(result.statusCode).send(result);
  },

  /**
   * Get Transactions By User And By Type And OR Status
   * @public
   * @route - /transactions/verify
   */
  async findTransactionByTransactionReference(request: Request, response: Response, next: NextFunction) {
    const result = await TransactionServices.findTransactionByTransactionReference(request);
    return response.status(result.statusCode).send(result);
  },

  /**
   * findTransactionByTransactionId
   * @param {*} request 
   * @param {*} response 
   * @param {*} next 
   */
  async findTransactionByTransactionId(request: Request, response: Response, next: NextFunction) {
    const result = await TransactionServices.findTransactionByTransactionId(request);
    return response.status(result.statusCode).send(result);
  },

  /**
   * getUserBeneficiariesByTransactionType
   * @param {*} request 
   * @param {*} response 
   * @param {*} next 
   * @public
   */
  async getUserBeneficiariesByTransactionType(request: Request, response: Response, next: NextFunction) {
    const result = await TransactionServices.getUserBeneficiariesByTransactionType(request);
    return response.status(result.statusCode).send(result);
  },
  

  /**
   * @function sumTransactionAmountByUserId
   * @description sum Transaction Amount By User Id
   *
   * @param {Object} request - express request object
   * @param {Object} response - express response object
   * @param {Function} next - callback to call next middleware
   *
   * @returns {Object} response from the server
   */
  async sumTransactionAmountByUserId(request, response, next) {
    const result = await TransactionServices.sumTransactionAmountByUserId(request);
    return response.status(result.statusCode).send(result);
  },
  
}