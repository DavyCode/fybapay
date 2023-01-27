// @flow

import { Request, Response, NextFunction } from 'express';
import POSTerminalServices from '../services/POSTerminalServices';

export default {
  /**
   * posNotificationItex
   * @param {*} request 
   * @param {*} response 
   * @param {*} next 
   */
  async posNotificationItex(request: Request, response: Response, next: NextFunction) {
    const result = await POSTerminalServices.posNotificationItex(request);
    return response.status(result.statusCode).send(result);
  }
};