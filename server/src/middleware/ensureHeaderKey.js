// @flow

import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '../utils/errors';

export default (request: Request, response: Response, next: NextFunction) => {
  if (!request.headers.authorization) {
    throw new UnauthorizedError('Authorization required!');
  }
  
  request.headerKey = request.headers.authorization.split(' ')[1];
  next();
};