// @flow

import { Request, Response, NextFunction } from 'express';
import roles from '../utils/roles';
import { UnauthorizedError } from '../utils/errors';

export default (action, resource) => {
  return async (request: Request, response: Response, next: NextFunction) => {
    const permission = roles.can(request.user.role)[action](resource);
    if (!permission.granted) {
      throw new UnauthorizedError('You don\'t have enough permission to perform this action');
    }
    next();
  };
};
