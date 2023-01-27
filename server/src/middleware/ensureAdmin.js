// @flow

import { UnauthorizedError } from '../utils/errors';
import enumType from '../enumType';

export default (request: Request, response: Response, next: NextFunction) => {
  if (!request.user) {
    throw new UnauthorizedError('Unauthorized');
  }
  if (request.user.role !== enumType.rolesType.SUPERADMIN) {
    if (request.user.role !== enumType.rolesType.ADMIN) {
      throw new UnauthorizedError('Access denied');
    } 
  }
  next();
};