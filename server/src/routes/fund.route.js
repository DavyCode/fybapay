import FundController from '../controllers/fund.controller'
import ensureAuth from '../middleware/ensureAuth';
import { API_BASE_URI } from '../config/env';
import { fundTransferValidator } from '../validations/inputValidator';
import { fileValidator } from '../validations/fileValidator'
import grantAccess from '../middleware/grantAccess';
import formatPhone from "../utils/formatPhone";
import { limitPaymentRequest } from '../middleware/rateLimiter';


export default (router) => {
  router.post(`${API_BASE_URI}/fund/transfer`, ensureAuth, limitPaymentRequest, fundTransferValidator, formatPhone, grantAccess('createOwn', 'Transaction'), FundController.fundTransfer);
  router.get(`${API_BASE_URI}/fund/transfer/charges`, ensureAuth, FundController.getTransferCharges);

  router.get(`${API_BASE_URI}/fund/transfer/bulk/charges`, ensureAuth, FundController.bulkTransferCharges);
  router.get(`${API_BASE_URI}/fund/transfer/bulk/template`, FundController.getBulkFundTransferTemplate);
  router.post(`${API_BASE_URI}/fund/transfer/bulk/wallet2wallet`, ensureAuth, limitPaymentRequest, fileValidator, grantAccess('createOwn', 'Transaction'), FundController.bulkTransferWalletToWallet);
  router.post(`${API_BASE_URI}/fund/transfer/bulk/bank`, ensureAuth, fileValidator, grantAccess('createOwn', 'Transaction'), FundController.bulkFundTransfer);
};
