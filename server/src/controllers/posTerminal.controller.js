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
  async createTerminal(request: Request, response: Response, next: NextFunction) {
    const result = await POSTerminalServices.createTerminal(request);
    return response.status(result.statusCode).send(result);
  },

  /**
   * updateTerminal
   * @param {*} request 
   * @param {*} response 
   * @param {*} next 
   */
  async updateTerminal(request: Request, response: Response, next: NextFunction) {
    const result = await POSTerminalServices.updateTerminal(request);
    return response.status(result.statusCode).send(result);
  },

  /**
   * deleteTerminal
   * @param {*} request 
   * @param {*} response 
   * @param {*} next 
   */
  async deleteTerminal(request: Request, response: Response, next: NextFunction) {
    const result = await POSTerminalServices.deleteTerminal(request);
    return response.status(result.statusCode).send(result);
  },

  /**
   * adminAssignTerminalToAgent
   * @param {*} request 
   * @param {*} response 
   * @param {*} next 
   */
  async adminAssignTerminalToAgent(request: Request, response: Response, next: NextFunction) {
    const result = await POSTerminalServices.adminAssignTerminalToAgent(request);
    return response.status(result.statusCode).send(result);
  },

  /**
   * adminRemoveAgentFromTerminal
   * @param {*} request 
   * @param {*} response 
   * @param {*} next 
   */
  async adminRemoveAgentFromTerminal(request: Request, response: Response, next: NextFunction) {
    const result = await POSTerminalServices.adminRemoveAgentFromTerminal(request);
    return response.status(result.statusCode).send(result);
  },

  /**
   * adminAssignTerminalToAggregator
   * @param {*} request 
   * @param {*} response 
   * @param {*} next 
   */
  async adminAssignTerminalToAggregator(request: Request, response: Response, next: NextFunction) {
    const result = await POSTerminalServices.adminAssignTerminalToAggregator(request);
    return response.status(result.statusCode).send(result);
  },

  /**
   * adminRemoveAggregatorFromTerminal
   * @param {*} request 
   * @param {*} response 
   * @param {*} next 
   */
  async adminRemoveAggregatorFromTerminal(request: Request, response: Response, next: NextFunction) {
    const result = await POSTerminalServices.adminRemoveAggregatorFromTerminal(request);
    return response.status(result.statusCode).send(result);
  },

  /**
   * getTerminalsAndFilter
   * @param {*} request 
   * @param {*} response 
   * @param {*} next 
   */
  async getTerminalsAndFilter(request: Request, response: Response, next: NextFunction) {
    const result = await POSTerminalServices.getTerminalsAndFilter(request);
    return response.status(result.statusCode).send(result);
  },

  /**
   * adminBlockPOS
   * @param {*} request 
   * @param {*} response 
   * @param {*} next 
   */
  async adminBlockPOS(request: Request, response: Response, next: NextFunction) {
    const result = await POSTerminalServices.adminBlockPOS(request);
    return response.status(result.statusCode).send(result);
  },

  /**
   * adminUnblockPOS
   * @param {*} request 
   * @param {*} response 
   * @param {*} next 
   */
  async adminUnblockPOS(request: Request, response: Response, next: NextFunction) {
    const result = await POSTerminalServices.adminUnblockPOS(request);
    return response.status(result.statusCode).send(result);
  },
  
  /**
   * getTransactionsByTerminalAndFilter
   * @param {*} request 
   * @param {*} response 
   * @param {*} next 
   */
  // async getTransactionsByTerminalAndFilter(request: Request, response: Response, next: NextFunction) {
  //   const result = await POSTerminalServices.getTransactionsByTerminalAndFilter(request);
  //   return response.status(result.statusCode).send(result);
  // },

  /**
   * getPosCharges
   * @param {*} request 
   * @param {*} response 
   * @param {*} next 
   */
  async getPosCharges(request: Request, response: Response, next: NextFunction) {
    const result = await POSTerminalServices.getPosCharges(request);
    return response.status(result.statusCode).send(result);
  },
  
};