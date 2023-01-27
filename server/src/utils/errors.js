// @flow 

import winston from "winston";
import { NODE_ENV } from '../config/env';
import ServerResponseStatus from '../constant/ServerResponseStatus';
import Pubsub from '../events';

export class APIError extends Error {
  constructor(status: number = 500, message: string = `Unknown Server Error.`, data: {} = {}) {
    super(message);
    this.status = status;
  }
};

export class UnauthorizedError extends APIError {
  constructor(message: string) {
    super(401, message);
  }
};

export class BadRequestError extends APIError {
  constructor(reason) {
    super(400, `${reason}`);
  }
};

export class NotFoundError extends APIError {
  constructor(message: string) {
    super(404, message || 'Not Found');
  }
};

export class ForbiddenError extends APIError {
  constructor(message: string) {
    super(403, message)
  }
};

export class NotAcceptableError extends APIError {
  constructor(message: string) {
    super(406, message)
  }
};

export class InternalServerError extends APIError {
  constructor(message: string) {
    super(500, message)
  }
};

export class PaymentRequiredError extends APIError {
  constructor(message: string) {
    super(402, message)
  }
};

export const errorHandler = (error: any, request: any, response: any, next: any) => { 
  /**
   * log the error message, and meta object
   */
  let res = { 
    message: error.message,
    statusCode: error.status || ServerResponseStatus.INTERNAL_SERVER_ERROR,
    status: "failure"
  };

  if (NODE_ENV === 'development' && !(error instanceof APIError)) {
    res = Object.assign({}, res, { stack: error.stack });
  }

  if (NODE_ENV === 'production' && !(error instanceof APIError)) {
    Pubsub.emit('error', {res, error});
  }
  
  if (NODE_ENV === 'development') {
    winston.error(error.message, error);
  } 
  response.status(error.status || ServerResponseStatus.INTERNAL_SERVER_ERROR).json(res);
};
