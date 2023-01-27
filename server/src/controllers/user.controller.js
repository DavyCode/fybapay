// @flow

/**
 * Controllers hold request response
 * web/HTTP logic only
 * Controllers handle some basic things like validation, pulling out what data is needed
 * form the HTTP request (if you’re using Express, that’s the req object)
 * and deciding what service that data should go to.
 * And of course ultimately returning a response.
 */

import { Request, Response, NextFunction } from 'express';
import UserService from '../services/UserService';
import AgentServices from '../services/AgentServices';

export default {

  /**
  * Register a new user
  * @public
  */
  async authOtpVerify(request, response, next) {
    const { phone } = request.body;
    const result = await UserService.authOtpVerify(request);
    return response.status(result.statusCode).send(result);
  },

  /**
  * Verify user phone
  * @public
  */
  async confirmAuthOtpVerify(request, response, next) {
    const result = await UserService.confirmAuthOtpVerify(request);
    return response.status(result.statusCode).send(result);
  },

  /**
  * Create user profile
  * @public
  */
  async createNewUserAccount(request, response, next) {
    const result = await UserService.createNewUserAccount(request);
    return response.status(result.statusCode).send(result);
  },

  /**
  * Authenticate user
  * @public
  */
  async authenticateUser(request, response, next) {
    const result = await UserService.authenticateUser(request.body);
    return response.status(result.statusCode).send(result);
  },

  /**
  * Update user data
  * @public
  */
  async updateUserData(request, response, next) {
    const result = await UserService.updateUserData(request);
    return response.status(result.statusCode).send(result);
  },

  /**
  * Get user profile
  * @public
  */
  async getUserProfile(request, response, next) {
    const result = await UserService.fetchUser(request.user.id);
    return response.status(result.statusCode).send(result);
  },

  /**
  * Get pin to reset user password
  * @public
  */
  async getResetPasswordPin(request, response, next) {
    const result = await UserService.getResetPasswordPin(request.body.phone);
    return response.status(result.statusCode).send(result);
  },

  /**
  * Reset user password
  * @public
  */
  async resetPassword(request, response, next) {
    const result = await UserService.resetPassword(request);
    return response.status(result.statusCode).send(result);
  },

  /**
   * changeUserPassword
   * @param {*} request 
   * @param {*} response 
   * @param {*} next
   * @public
   */
  async changeUserPassword(request, response, next) {
    const result = await UserService.changeUserPassword(request);
    return response.status(result.statusCode).send(result);
  },

  /**
  * Update user bank info
  * @public
  */
  async updateUserBankData(request, response, next) {
    const result = await UserService.updateBankData(request);
    return response.status(result.statusCode).send(result);
  },

  /**
  * Update user BVN
  * @public
  */
  async updateUserBvn(request, response, next) {
    const result = await UserService.updateUserBvn(request);
    return response.status(result.statusCode).send(result);
  },

  /**
  * Confirm user BVN by OTP of DOB
  * @public
  */
  async confirmBvnVerify(request, response, next) {
    const result = await UserService.confirmBvnVerify(request);
    return response.status(result.statusCode).send(result);
  },

  /**
  * Create Transaction Pin
  * @public
  * @param {*} request
  * @param {*} response
  * @param {*} next
  */
  async createTransactionPin(request, response, next) {},

  /**
  * Change Transaction Pin
  * @public
  * @param {*} request
  * @param {*} response
  * @param {*} next
  */
  async changeTransactionPin(request, response, next) {},

  /**
  *  Upgrade agent Kyc level
  * @public
  * @param {*} request
  * @param {*} response
  * @param {*} next
  * @todo 
  */
  async agentKyc(request, response, next) {},

}