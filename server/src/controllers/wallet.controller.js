// @flow

import { Request, Response, NextFunction } from 'express';
import WalletServices from '../services/WalletServices';

/**
 * Wallet 2 Other Banks Transfer (cash out)
 * @param {}  
 */
const walletToBankCashout = async (request, response, next) => {};


/**
 * Wallet Topup
 * 3 ways to fund wallet
 *  - Ussd
 *  - Bank transfer
 *  - Card
 * @param {}  
 */

/**
 * Wallet 2 Savings 
 * @param {}  
 */

/**
 * Wallet 2 Growth (investment) 
 * @param {}  
 */

/**
 * Monnify Webhook register transaction 
 *  - USSD & Bank Transfer 
 *  updates wallet with webhook from monify
 * @param {}  
 */

/**
 *  Webhook register transaction 
 *  - Card 
 *  updates wallet with webhook from monify/paystack/(optional gateway)
 * @param {}  
 */

export default {
  
  /**
   * Get User Wallet
   * @param {} request 
   * @param {} response 
   * @param {} next 
   */
  async getUserWallet(request, response, next) {
    const result = await WalletServices.getUserWallet(request);
    return response.status(result.statusCode).send(result);
  },

  /**
   * Get User Wallet Transactions
   */
  async getUserWalletTransactions(request, response, next) {
    const result = await WalletServices.getUserWalletTransactions(request);
    return response.status(result.statusCode).send(result);
  },

  /**
   * Wallet 2 Wallet Transfer
   * @public
   */
  async walletToWalletTransfer(request, response, next) {
    const result = await WalletServices.transferWalletToWallet(request);
    return response.status(result.statusCode).send(result);
  },

  /**
   * Verify Wallet AccountNumber
   * @public
   */
  async verifyWalletAccountNumber(request, response, next) {
    const result = await WalletServices.verifyWalletAccountNumber(request);
    return response.status(result.statusCode).send(result);
  },

  /**
   * Resolve Wallet Phone To AccountNumber
   * @public
   */
  async resolveWalletPhoneToAccountNumber(request, response, next) {
    const result = await WalletServices.resolveWalletPhoneToAccountNumber(request);
    return response.status(result.statusCode).send(result);
  },

  /**
   * Withdraw From Wallet
   * @public
   */
  async withdrawFromWallet(request, response, next) {
    const result = await WalletServices.withdrawFromWallet(request);
    return response.status(result.statusCode).send(result);
  },

  /**
   * Get Wallet Withdrawal Charges
   * @public
   */
  async getWalletWithdrawCharges(request, response, next) {
    const result = await WalletServices.getWalletWithdrawCharges(request);
    return response.status(result.statusCode).send(result);
  },

  /**
   * Payment Notification Monify Webhook
   * @private
   * @description - Listens for webhook notification from monify
   */
  async paymentNotificationMonifyWebhook(request, response, next) {
    const result = await WalletServices.paymentNotificationMonifyWebhook(request);
    return response.status(result.statusCode).send(result);
  },

  /**
   * Verify Payment Monify
   * @private
   * @description - Listens for webhook notification from monify
   */
  async verifyPaymentMonify(request, response, next) {
    const result = await WalletServices.verifyPaymentMonify(request);
    return response.status(result.statusCode).send(result);
  },

  /**
   * getAllPaymentNotificationsAndFilter
   * @param {*} request 
   * @param {*} response 
   * @param {*} next 
   */
  async getAllPaymentNotificationsAndFilter(request, response, next) {
    const result = await WalletServices.getAllPaymentNotificationsAndFilter(request);
    return response.status(result.statusCode).send(result);
  },

};
