import ensureAuth from '../middleware/ensureAuth';
import { API_BASE_URI } from '../config/env';
import { cabletvServiceValidator, cabletvVerifyValidator } from '../validations/inputValidator';
import CabletvController from '../controllers/cabletv.controller';
import { limitPaymentRequest } from '../middleware/rateLimiter';


export default router => {
  router.post(`${API_BASE_URI}/services/cabletv/pay`, ensureAuth, limitPaymentRequest, cabletvServiceValidator, CabletvController.vendCableTv);
  router.post(`${API_BASE_URI}/services/cabletv/verify`, ensureAuth, cabletvVerifyValidator, CabletvController.verifySmartCardNumber);
};
