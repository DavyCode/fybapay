import ensureAuth from "../middleware/ensureAuth";
import { API_BASE_URI } from "../config/env";
import formatPhone from "../utils/formatPhone";
import {
  meterVerifyValidator,
  electricityServiceValidator,
} from "../validations/inputValidator";
import ElectricityController from '../controllers/electricity.controller';
import { limitPaymentRequest } from '../middleware/rateLimiter';


export default router => {
  router.post(`${API_BASE_URI}/services/electricity/pay`, ensureAuth, limitPaymentRequest, electricityServiceValidator, ElectricityController.vendElectricity);
  router.post(`${API_BASE_URI}/services/electricity/verify`, ensureAuth, meterVerifyValidator, ElectricityController.verifyUserMeter);
};
