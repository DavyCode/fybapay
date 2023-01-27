// @flow

/**
 * Wallet Database Operations
 */

import { Wallet, Transaction, validMongooseObjectId } from '../models';

export default {
  /**
   * Get Wallet
   * @private
   */
  async getWallet(id: string) {
    if (!validMongooseObjectId(id)) { return Promise.resolve(false) }
    return await Wallet.findById({ 
      _id: id 
    })
    .populate('user', 'firstName lastName email _id')
    .populate('commissionWallet');
  },
  
  /**
   * Get Wallet By Id
   * @param {string} id 
   * @private
   */
  async getWalletById(id: string) {
    if (!validMongooseObjectId(id)) { return Promise.resolve(false) }
    return await Wallet.findById({ 
      _id: id 
    })
    .populate('user', 'firstName lastName email _id')
    .populate('commissionWallet');
  },
  
  /**
   * Get wallet by user Id
   * @param {string} userId 
   * @private
   */
  async getWalletByUserId(userId: string) {
    if (!validMongooseObjectId(userId)) { return Promise.resolve(false) }
    return await Wallet.findOne({ 
      user: userId 
    })
    .populate('user', 'firstName lastName email _id')
    .populate('commissionWallet');
  },

  /**
   * Find Wallet By AccountNumber
   * @param {string} accountNumber
   * @private 
   */
  async findByAccountNumber(accountNumber: string) {
    return await Wallet.findOne({ 
      accountNumber 
    })
    .populate('user', 'firstName lastName email _id')
    .populate('commissionWallet');
  },
  

  /**
   * findByAccountNumberAndPopulate
   * @param {string} accountNumber 
   */
  async findByAccountNumberAndPopulate(accountNumber: string) {
    return await Wallet.findOne({ 
      accountNumber 
    })
    .populate('user', 'firstName lastName email _id')
    .populate('commissionWallet');
  },

  /**
   * Get wallet By Monify Account Reference
   * @param {string} monifyAccountReference 
   * @private
   */
  async getWalletByMonifyAccountReference (monifyAccountReference: string) {
    return await Wallet.findOne({ 
      monifyAccountReference 
    })
    .populate('user', 'firstName lastName email _id')
    .populate('commissionWallet');
  },

  /**
   * Insert Wallet
   * @param {} query 
   * @param {} update 
   * @param {} option 
   * @private
   */
  async insertWallet(query: {}, update: {}, option: { new: boolean, upsert: boolean }) {
    return await Wallet.findOneAndUpdate(query, update, option);
  },
  
  /**
   * Create Wallet
   * @private 
   */
  async walletCreate(params: {}) {
    return await Wallet.create(params);
  },

  /**
  * Wallet User Instance
  * @private
  */
  async saveWallet(walletIntance: Wallet) {
    return await walletIntance.save();
  },

  /**
   * Wallet Instance
   * @private
   */
  async walletInstance() {
    return await new Wallet();
  }

}