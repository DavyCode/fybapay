// @flow

import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '../utils/errors';
import enumType from '../enumType';

export default (request: Request, response: Response, next: NextFunction) => {
  if (!request.user) {
    throw new UnauthorizedError('Unauthorized');
  }

  if (request.user.role !== enumType.rolesType.SUPERAGENT) {
    throw new UnauthorizedError('Access denied');
  }

  next();
};