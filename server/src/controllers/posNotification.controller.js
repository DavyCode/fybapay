// @flow

import { Request, Response, NextFunction } from 'express';
import POSTerminalServices from '../services/POSTerminalServices';

export default {
  /**
   * createTerminal
   * @param {*} request 
   * @param {*} response 
   * @param {*} next 
   */
  async getAllPosNotificationAndFilter(request: Request, response: Response, next: NextFunction) {
    const result = await POSTerminalServices.getAllPosNotificationAndFilter(request);
    return response.status(result.statusCode).send(result);
  },
};