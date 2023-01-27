import ensureAuth from '../middleware/ensureAuth';
import { API_BASE_URI } from '../config/env';
import DataController from '../controllers/data.controller'
import { mobileDataServiceValidator, mobileDataVerifyServiceValidator } from '../validations/inputValidator';
import { limitPaymentRequest } from '../middleware/rateLimiter';


export default router => {
  router.post(`${API_BASE_URI}/services/data/pay`, ensureAuth, limitPaymentRequest, mobileDataServiceValidator, DataController.dataTopUp);
  router.post(`${API_BASE_URI}/services/data/verify`, ensureAuth, mobileDataVerifyServiceValidator, DataController.verifyMobileDataNumber);
};
