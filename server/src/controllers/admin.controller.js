// @flow

import { Request, Response, NextFunction } from 'express';
import AdminService from '../services/AdminServices';
import UserService from '../services/UserService';
import WalletServices from '../services/WalletServices';
import TransactionServices from '../services/TransactionServices';


export default {
  /**
   * ENDPOINTS
   * addUser
   * deleteUser
   * getUserByRole
   * lockUserAccount
   * getAllUsers
   * getInsight
   * sendAppUpdateNotification
   * serviceSwitch
   * getServices
   * updateUserWalletLimit
   * 
   * get charges
   * get one charges
   * update charges
   */

  /***************
   * USERS
   **********************/

  /**
   * Get all users
   * @public
   */
  async getAllUsers(request: Request, response: Response, next: NextFunction) {
    const result = await UserService.getAllUsers(request);
    return response.status(result.statusCode).send(result);
  },

  /**
   * getAuthOtpUsers
   * @param {*} request 
   * @param {*} response 
   * @param {*} next 
   */
  async getAuthOtpUsers(request: Request, response: Response, next: NextFunction) {
    const result = await UserService.getAuthOtpUsers(request);
    return response.status(result.statusCode).send(result);
  },

  /**
  * Add User
  * @public
  */
  async addUser(request: Request, response: Response, next: NextFunction) {

  },

  
  
  
  
  /**
   * Get Insight
   * @public
   */
  async getInsight(request: Request, response: Response, next: NextFunction) {
    
  },
  
  /**
   * Send App Update Notification
   * @public
   */
  async sendAppUpdateNotification(request: Request, response: Response, next: NextFunction) {
    
  },
  
  /**
   * Service Switch
   * @public
   */
  async updateServiceChargeAndPlatform(request: Request, response: Response, next: NextFunction) { // todo: validate, secure
    const result = await AdminService.updateServiceChargeAndPlatform(request);
    return response.status(result.statusCode).send(result);
  },
  
  /**
   * Get Services
   * @public
   */
  async getAllServices(request: Request, response: Response, next: NextFunction) {
    const result = await AdminService.getAllServices(request.query);
    return response.status(result.statusCode).send(result);
  },
  
  /**
   * Create Switch Services
   * @public
   */
  async createSwitchServices(request: Request, response: Response, next: NextFunction) {
    const result = await AdminService.createSwitchServices(request.body);
    return response.status(result.statusCode).send(result);
  },
  
  /**
   * get Switch Service Logs
   * @public
   */
  async getSwitchServiceLogs(request: Request, response: Response, next: NextFunction) {
    const result = await AdminService.getSwitchServiceLogs(request);
    return response.status(result.statusCode).send(result);
  },

  /**************************************
   * USER MANAGEMENT
   *****************************************/
  
  /**
   * Update User Wallet Limit
   * @public
   * @todo 
   */
  async updateUserWalletLimit(request: Request, response: Response, next: NextFunction) {
    const result = await AdminService.updateUserWalletLimit(request);
    return response.status(result.statusCode).send(result);
  },
  
  /**
   * Refund user wallet
   * @public
   */
  async refundWallet(request: Request, response: Response, next: NextFunction) {
    const result = await WalletServices.refundWallet(request);
    return response.status(result.statusCode).send(result);
  },

  /**
   * Update Service Charge
   * @param {} request 
   * @param {} response 
   * @param {} next
   * @public 
   */
  // async updateServiceCharge(request: Request, response: Response, next: NextFunction) {
    //   const result = await AdminService.updateServiceCharge(request);
    //   return response.status(result.statusCode).send(result);
    // },

  /**
  * Delete User
  * @public
  */
  async deleteUser (request: Request, response: Response, next: NextFunction) {},

  // /**
  // * Get Users By Role
  // * @public
  // */
  // async getUsersByRole (request: Request, response: Response, next: NextFunction) {
  //   const result = await UserService.getAllUsers(request);
  //   return response.status(result.statusCode).send(result);
  // },
    
  /**
  * Lock User Account
  * @public
  */
  async lockUserAccount(request: Request, response: Response, next: NextFunction) {
    const result = await AdminService.lockUserAccount(request);
    return response.status(result.statusCode).send(result);
  },

  /**
  * unLock User Account
  * @public
  */
  async unlockUserAccount(request: Request, response: Response, next: NextFunction) {
    const result = await AdminService.unlockUserAccount(request);
    return response.status(result.statusCode).send(result);
  },

  /**
   * admin update user bank data
   * @public
   */
  async updateUserBankData(request: Request, response: Response, next: NextFunction) {
    const result = await UserService.adminUpdateUserBankData(request);
    return response.status(result.statusCode).send(result);
  },
  /**
   * Assign user role
   * @public
   */
  async assignUserRole(request: Request, response: Response, next: NextFunction) {
    const result = await AdminService.assignUserRole(request);
    return response.status(result.statusCode).send(result);
  },

  /**
   * update user profile data
   * @public
   */
  async updateUserProfileData(request: Request, response: Response, next: NextFunction) {
    const result = await UserService.updateUserProfileData(request);
    return response.status(result.statusCode).send(result);
  },

  /**
   * getAllCacheBvn
   * @param {*} request 
   * @param {*} response 
   * @param {*} next 
   */
  async getAllCacheBvn(request: Request, response: Response, next: NextFunction) {
    const result = await UserService.getAllCacheBvn(request);
    return response.status(result.statusCode).send(result);
  },

};