// @flow

import { Request, Response, NextFunction } from 'express';
import IssueServices from '../services/IssueServices';
import MessageServices from '../services/MessageServices';

export default {
  /**
   * getUserMessages
   * @param {*} request 
   * @param {*} response 
   * @param {*} next 
   */
  async getUserDirectMessages(request: Request, response: Response, next: NextFunction) {
    const result = await MessageServices.getUserDirectMessages(request);
    return response.status(result.statusCode).send(result);
  },

  /**
   * getUserBroadcastMessages
   * @param {*} request 
   * @param {*} response 
   * @param {*} next 
   */
  async getUserBroadcastMessages(request: Request, response: Response, next: NextFunction) {
    const result = await MessageServices.getUserBroadcastMessages(request);
    return response.status(result.statusCode).send(result);
  },

  /**
   * readReceiptWebhook
   * @param {*} request 
   * @param {*} response 
   * @param {*} next 
   */
  async readReceiptWebhook(request: Request, response: Response, next: NextFunction) {
    const result = await MessageServices.readReceiptWebhook(request);
    return response.status(result.statusCode).send(result);
  },

  /**
   * getAllMessages
   * @param {*} request 
   * @param {*} response 
   * @param {*} next 
   */
  async getAllMessages(request: Request, response: Response, next: NextFunction) {
    const result = await MessageServices.getAllMessages(request);
    return response.status(result.statusCode).send(result);
  },

  /**
   * createDirectMessage
   * @param {*} request 
   * @param {*} response 
   * @param {*} next 
   */
  async createDirectMessage(request: Request, response: Response, next: NextFunction) {
    const result = await MessageServices.createDirectMessage(request);
    return response.status(result.statusCode).send(result);
  },

  /**
   * createBroadcastMessage
   * @param {*} request 
   * @param {*} response 
   * @param {*} next 
   */
  async createBroadcastMessage(request: Request, response: Response, next: NextFunction) {
    const result = await MessageServices.createBroadcastMessage(request);
    return response.status(result.statusCode).send(result);
  },

  /**
   * updateMessage
   * @param {*} request 
   * @param {*} response 
   * @param {*} next 
   */
  async updateMessage(request: Request, response: Response, next: NextFunction) {
    const result = await MessageServices.updateMessage(request);
    return response.status(result.statusCode).send(result);
  },

  /**
   * Message
   * @param {*} request 
   * @param {*} response 
   * @param {*} next 
   */
  async Message(request: Request, response: Response, next: NextFunction) {
    const result = await MessageServices.Message(request);
    return response.status(result.statusCode).send(result);
  },

  /**
   * messageApproveForViewing
   * @param {*} request 
   * @param {*} response 
   * @param {*} next 
   */
  async messageApproveForViewing(request: Request, response: Response, next: NextFunction) {
    const result = await MessageServices.messageApproveForViewing(request);
    return response.status(result.statusCode).send(result);
  },

  /**
   * getMessagesEnum
   * @param {*} request 
   * @param {*} response 
   * @param {*} next 
   */
  async getMessagesEnum(request: Request, response: Response, next: NextFunction) {
    const result = await MessageServices.getMessagesEnum(request);
    return response.status(result.statusCode).send(result);
  },
  

}