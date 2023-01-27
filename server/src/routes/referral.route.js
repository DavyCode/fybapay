import referralController from '../controllers/referral.controller';
import ensureAuth from '../middleware/ensureAuth';
import grantAccess from '../middleware/grantAccess';
import { API_BASE_URI } from '../config/env';

export default (router) => {
  router.get(`${API_BASE_URI}/referral/stats`, ensureAuth, grantAccess('readOwn', 'Referral'), referralController.getReferralStats);
};
