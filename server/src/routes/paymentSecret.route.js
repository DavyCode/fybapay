import paymentSecretController from '../controllers/paymentSecret.controller';
import ensureAuth from '../middleware/ensureAuth';
import grantAccess from '../middleware/grantAccess';
import { ConfirmPinValidator, changeTransactionSecretValidator } from '../validations/inputValidator';
import { API_BASE_URI } from '../config/env';

export default (router) => {
  /**
   * Confirm user secret pin
   */
  router.post(`${API_BASE_URI}/users/confirm_pin`, ensureAuth, ConfirmPinValidator, grantAccess('readOwn', 'PaymentSecret'), paymentSecretController.confirmUserPin);
  router.put(`${API_BASE_URI}/users/change_secret`, ensureAuth, changeTransactionSecretValidator, grantAccess('readOwn', 'PaymentSecret'), paymentSecretController.resetUserPaymentSecret);
};
