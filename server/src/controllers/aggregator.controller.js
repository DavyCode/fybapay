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
import AggregatorServices from '../services/AggregatorServices';

export default {
  /**
   * adminMakeUserAggregator
   * @param {*} request
   * @param {*} response
   * @param {*} next
   */
  async adminMakeUserAggregator(request, response, next) {
    const result = await AggregatorServices.adminMakeUserAggregator(request);
    return response.status(result.statusCode).send(result);
  },

  /**
   * getAggregatorTerminals
   * @param {*} request
   * @param {*} response
   * @param {*} next
   */
  async getAggregatorTerminals(request, response, next) {
    const result = await AggregatorServices.getAggregatorTerminals(request);
    return response.status(result.statusCode).send(result);
  },

  /**
   * aggregatorAssignTerminalToAgent
   * @param {*} request
   * @param {*} response
   * @param {*} next
   */
  async aggregatorAssignTerminalToAgent(request, response, next) {
    const result = await AggregatorServices.aggregatorAssignTerminalToAgent(request);
    return response.status(result.statusCode).send(result);
  },

  /**
   * aggregatorRemoveAgentFromTerminal
   * @param {*} request 
   * @param {*} response 
   * @param {*} next 
   */
  async aggregatorRemoveAgentFromTerminal(request, response, next) {
    const result = await AggregatorServices.aggregatorRemoveAgentFromTerminal(request);
    return response.status(result.statusCode).send(result);
  },

  /**
   * aggregatorBlockPOS
   * @param {*} request 
   * @param {*} response 
   * @param {*} next 
   */
  async aggregatorBlockPOS(request, response, next) {
    const result = await AggregatorServices.aggregatorBlockPOS(request);
    return response.status(result.statusCode).send(result);
  },

  /**
   * aggregatorUnblockPOS
   * @param {*} request 
   * @param {*} response 
   * @param {*} next 
   */
  async aggregatorUnblockPOS(request, response, next) {
    const result = await AggregatorServices.aggregatorUnblockPOS(request);
    return response.status(result.statusCode).send(result);
  },

  /**
   * getAggregatorTerminalTransactionsAndFilter
   * @param {*} request 
   * @param {*} response 
   * @param {*} next 
   */
  async getAggregatorTerminalTransactionsAndFilter(request, response, next) {
    const result = await AggregatorServices.getAggregatorTerminalTransactionsAndFilter(request);
    return response.status(result.statusCode).send(result);
  },

  /**
   * getAggregatorDashboardInsight
   * @param {*} request 
   * @param {*} response 
   * @param {*} next 
   */
  async getAggregatorDashboardInsight(request, response, next) {
    const result = await AggregatorServices.getAggregatorDashboardInsight(request);
    return response.status(result.statusCode).send(result);
  },
};
