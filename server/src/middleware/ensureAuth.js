// @flow

import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '../utils/errors';

export default (request: Request, response: Response, next: NextFunction) => {
  if (!request.user) {
    throw new UnauthorizedError('Unauthorized')
  }
  
  next();
};