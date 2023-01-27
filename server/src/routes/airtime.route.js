import ensureAuth from '../middleware/ensureAuth';
import { API_BASE_URI } from '../config/env';
import { limitPaymentRequest } from '../middleware/rateLimiter';


import { airtimeServiceValidator } from '../validations/inputValidator';
import AirtimeController from '../controllers/airtime.controller';

export default (router) => {
  router.post(`${API_BASE_URI}/services/airtime/pay`, ensureAuth, limitPaymentRequest, airtimeServiceValidator, AirtimeController.airtimeTopUp);
};
