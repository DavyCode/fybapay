import ensureAuth from '../middleware/ensureAuth';
import { API_BASE_URI } from '../config/env';
import CommissionController from '../controllers/commission.controller';
import { mobileDataServiceValidator, mobileDataVerifyServiceValidator, amountValidator } from '../validations/inputValidator';
import grantAccess from '../middleware/grantAccess';

export default router => {
  router.get(`${API_BASE_URI}/commissions/wallet`, ensureAuth, grantAccess('readOwn', 'CommissionWallet'), CommissionController.getUserCommissionWallet);
  router.get(`${API_BASE_URI}/commissions/wallet/find`, ensureAuth, grantAccess('readOwn', 'CommissionWallet'), CommissionController.findCommissionWalletByIdOrUser); // todo - search ops by admin
  router.get(`${API_BASE_URI}/commissions/history`, ensureAuth, grantAccess('readOwn', 'CommissionHistory'), CommissionController.getUserCommissionHistory);
  router.get(`${API_BASE_URI}/commissions/history/find`, ensureAuth, grantAccess('readOwn', 'CommissionHistory'), CommissionController.findCommissionHistoryById); // todo - search ops by admin
  router.get(`${API_BASE_URI}/commissions/history/findby`, ensureAuth, grantAccess('readAny', 'CommissionHistory'), CommissionController.getCommissionHistoryByUserOrCommissionWalletId); // todo - search ops by admin
  router.post(`${API_BASE_URI}/commissions/transfer`, ensureAuth, amountValidator, grantAccess('createOwn', 'CommissionHistory'), CommissionController.moveCommissionBalanceToWallet);
};
