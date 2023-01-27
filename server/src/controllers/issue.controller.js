// @flow

import { Request, Response, NextFunction } from 'express';
import IssueServices from '../services/IssueServices';

export default {
  /**
   * createIssue
   * @param {*} request 
   * @param {*} response 
   * @param {*} next 
   */
  async createIssue(request: Request, response: Response, next: NextFunction) {
    const result = await IssueServices.createIssue(request);
    return response.status(result.statusCode).send(result);
  },

  /**
   * getUserIssues
   * @param {*} request 
   * @param {*} response 
   * @param {*} next 
   */
  async getUserIssues(request: Request, response: Response, next: NextFunction) {
    const result = await IssueServices.getUserIssues(request);
    return response.status(result.statusCode).send(result);
  },

  /**
   * getAllIssuesAndFilter
   * @param {*} request 
   * @param {*} response 
   * @param {*} next 
   */
  async getAllIssuesAndFilter(request: Request, response: Response, next: NextFunction) {
    const result = await IssueServices.getAllIssuesAndFilter(request);
    return response.status(result.statusCode).send(result);
  },

  /**
   * closeIssue
   * @param {*} request 
   * @param {*} response 
   * @param {*} next 
   */
  async closeIssue(request: Request, response: Response, next: NextFunction) {
    const result = await IssueServices.closeIssue(request);
    return response.status(result.statusCode).send(result);
  },
};
