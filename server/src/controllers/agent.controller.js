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
import AgentServices from '../services/AgentServices';

export default {
  /**
   * getAllAgentRequestAndSearch
   * @param {*} request 
   * @param {*} response 
   * @param {*} next 
   */
  async getAllAgentRequestAndSearch(request: Request, response: Response, next: NextFunction) {
    const result = await AgentServices.getAllAgentRequestAndSearch(request);
    return response.status(result.statusCode).send(result);
  },

  /**
   * approveAgent
   * @param {*} request 
   * @param {*} response 
   * @param {*} next 
   */
  async approveAgent(request: Request, response: Response, next: NextFunction) {
    const result = await AgentServices.approveAgent(request);
    return response.status(result.statusCode).send(result);
  },

  /**
   * disapproveAgent
   * @param {*} request 
   * @param {*} response 
   * @param {*} next 
   */
  async disapproveAgent(request: Request, response: Response, next: NextFunction) {
    const result = await AgentServices.disapproveAgent(request);
    return response.status(result.statusCode).send(result);
  },

  /**
    *  Onboard new agent
    * @public
    * @param {*} request
    * @param {*} response
    * @param {*} next
    */
  async agentOnboarding(request: Request, response: Response, next: NextFunction) {
    const result = await AgentServices.newAgentRequest(request);
    return response.status(result.statusCode).send(result);
  },

}