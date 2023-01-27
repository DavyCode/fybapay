// @flow

import { Request, Response, NextFunction } from 'express';
import POSTerminalServices from '../services/POSTerminalServices';

export default {
  /**
   * posNotificationRubies
   * @param {*} request 
   * @param {*} response 
   * @param {*} next 
   */
  async posNotificationRubies(request: Request, response: Response, next: NextFunction) {
    const result = await POSTerminalServices.posNotificationRubies(request);
    return response.status(result.statusCode).send(result);
  }
};