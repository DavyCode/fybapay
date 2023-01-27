// @flow

import { Request, Response, NextFunction } from 'express';
import ReferralServices from '../services/ReferralServices';

export default {
  
  /**
   * Get Referral Stats
   * @public
   */
  async getReferralStats(request: Request, response: Response, next: NextFunction) {
    const result = await ReferralServices.getReferralStats(request);
    return response.status(result.statusCode).send(result);
  },
};
