import ensureAuth from '../middleware/ensureAuth';
import { API_BASE_URI } from '../config/env';
import VariationController from '../controllers/variation.controller';
import { serviceVariationValidator, serviceTypeQueryValidator } from '../validations/inputValidator';

export default (router) => {
  router.get('/', VariationController.testApi);
  router.post(`${API_BASE_URI}/services/variation`, serviceVariationValidator, VariationController.getServiceVariation);
  router.get(`${API_BASE_URI}/services`, VariationController.getAvailableServiceResource);
  router.get(`${API_BASE_URI}/services/paymentMethods`, VariationController.getApprovedPaymentMethods);
  router.get(`${API_BASE_URI}/services/platforms`, VariationController.getAvailableServicePlatforms);
  router.get(`${API_BASE_URI}/services/types`, VariationController.getAvailableServiceTypes);

  router.get(`${API_BASE_URI}/services/charges`, VariationController.getAllServiceCharges);
  router.get(`${API_BASE_URI}/services/charges/find-one`, serviceTypeQueryValidator, VariationController.getOneCharge);

  router.get(`${API_BASE_URI}/services/charges/user`, ensureAuth, VariationController.getAllServiceChargesByUser);
  router.get(`${API_BASE_URI}/services/charges/find-one/user`, ensureAuth, serviceTypeQueryValidator, VariationController.getOneChargeByUser);

  // router.get(`${API_BASE_URI}/services/banks`, VariationController.getListedBanks);
  router.get(`${API_BASE_URI}/services/banks`, VariationController.getListedBanks);
  
  router.post(`${API_BASE_URI}/services/banks/resolve`, VariationController.verifyBankAccountV2);
  // router.post(`${API_BASE_URI}/services/banks/resolve/v2`, VariationController.verifyBankAccountV2);
};
