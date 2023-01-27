// @flow

import { Request, Response, NextFunction } from 'express';
import AppUpdateServices from '../services/AppUpdateServices';

export default {
  /**
  * checkAppUpdate
  * @public
  */
  async checkAppUpdate(request: Request, response: Response, next: NextFunction) {
    const result = await AppUpdateServices.checkAppUpdate(request);
    return response.status(result.statusCode).send(result);
  },

  /**
   * createAppUpdate
   * @param {*} request 
   * @param {*} response 
   * @param {*} next 
   */
  async createAppUpdate(request: Request, response: Response, next: NextFunction) {
    const result = await AppUpdateServices.createAppUpdate(request);
    return response.status(result.statusCode).send(result);
  },
  
  /**
   * getAllAppUpdates
   * @param {*} request 
   * @param {*} response 
   * @param {*} next 
   */
  async getAllAppUpdates(request: Request, response: Response, next: NextFunction) {
    const result = await AppUpdateServices.getAllAppUpdates(request);
    return response.status(result.statusCode).send(result);
  },

  /**
   * updateAppUpdate
   * @param {*} request 
   * @param {*} response 
   * @param {*} next 
   */
  async updateAppUpdate(request: Request, response: Response, next: NextFunction) {
    const result = await AppUpdateServices.updateAppUpdate(request);
    return response.status(result.statusCode).send(result);
  },

  /**
   * getAppPlatformsAndTypes
   * @param {*} request 
   * @param {*} response 
   * @param {*} next 
   */
  async getAppPlatformsAndTypes(request: Request, response: Response, next: NextFunction) {
    const result = await AppUpdateServices.getAppPlatformsAndTypes(request);
    return response.status(result.statusCode).send(result);
  },
};
