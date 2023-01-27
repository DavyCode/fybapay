// @flow

import { Request, Response, NextFunction } from 'express';
import CommissionServices from '../services/CommissionServices'

export default {
  /**
   * Get user commission wallet
   * @public
   */
  async getUserCommissionWallet(request, response, next) {
    const result = await CommissionServices.getUserCommissionWallet(request);
    return response.status(result.statusCode).send(result);
  },

  /**
   * Find commission wallet by id or user
   * @public
   */
  async findCommissionWalletByIdOrUser(request, response, next) {
    const result = await CommissionServices.findCommissionWalletByIdOrUser(request);
    return response.status(result.statusCode).send(result);
  },

  /**
   * Get user commission history
   * @public
   */
  async getUserCommissionHistory(request, response, next) {
    const result = await CommissionServices.getUserCommissionHistory(request);
    return response.status(result.statusCode).send(result);
  },

  /**
   * Find Commission History by id
   * @public
   */
  async findCommissionHistoryById(request, response, next) {
    const result = await CommissionServices.findCommissionHistoryById(request);
    return response.status(result.statusCode).send(result);
  },

  /**
   * Get all Commission History
   * @public
   */
  async getCommissionHistory(request, response, next) {
    const result = await CommissionServices.getCommissionHistory(request);
    return response.status(result.statusCode).send(result);
  },

  /**
   * getCommissionHistoryByUserOrCommissionWalletId
   * @public
   */
  async getCommissionHistoryByUserOrCommissionWalletId(request, response, next) {
    const result = await CommissionServices.getCommissionHistoryByUserOrCommissionWalletId(request);
    return response.status(result.statusCode).send(result);
  },

  /**
   * Move Commission Balance To Wallet
   * @param {*} request
   * @param {*} response
   * @param {*} next
   * @public
   */
  async moveCommissionBalanceToWallet(request, response, next) {
    const result = await CommissionServices.moveCommissionBalanceToWallet(request);
    return response.status(result.statusCode).send(result);
  },
};
