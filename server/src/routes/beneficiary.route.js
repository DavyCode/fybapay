import ensureAuth from '../middleware/ensureAuth';
import { API_BASE_URI } from '../config/env';
import { } from '../validations/inputValidator';
import beneficiaryController from '../controllers/beneficiary.controller';
import grantAccess from '../middleware/grantAccess';

export default router => {
  router.get(`${API_BASE_URI}/transactions/beneficiaries/find`, ensureAuth, grantAccess('readOwn', 'Beneficiary'), beneficiaryController.findBeneficiaryById);
  router.get(`${API_BASE_URI}/transactions/beneficiaries`, ensureAuth, grantAccess('readOwn', 'Beneficiary'), beneficiaryController.getUserBeneficiary);
};
