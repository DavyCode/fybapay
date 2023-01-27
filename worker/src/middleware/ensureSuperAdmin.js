// @flow

import { UnauthorizedError } from '../utils/errors';
import enumType from '../enumType';

export default (request, response, next) => {
  if (!request.user) {
    throw new UnauthorizedError('Unauthorized');
  }
  if (request.user.role !== enumType.rolesType.SUPERADMIN) {
    throw new UnauthorizedError('Access denied');
  }
  next();
};
