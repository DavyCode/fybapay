import ensureAuth from '../middleware/ensureAuth';
import { API_BASE_URI, MONNIFY_WEBHOOK_URL } from '../config/env';
import WalletController from '../controllers/wallet.controller';
import { amountValidator, walletToWalletTransferValidator, walletAccountValidator, withdrawFromWalletValidator, ValidatePhone } from '../validations/inputValidator';
import formatPhone from "../utils/formatPhone";
import grantAccess from '../middleware/grantAccess';
import { limitPaymentRequest } from '../middleware/rateLimiter';


export default (router) => {
  router.get(`${API_BASE_URI}/wallet`, ensureAuth, grantAccess('readOwn', 'Wallet'), WalletController.getUserWallet);
  router.get(`${API_BASE_URI}/wallet/transactions`, ensureAuth, grantAccess('readOwn', 'Wallet'), WalletController.getUserWalletTransactions);
  router.post(`${API_BASE_URI}/wallet/transfer/w2w`, ensureAuth, limitPaymentRequest, walletToWalletTransferValidator, grantAccess('createAny', 'Transaction'), WalletController.walletToWalletTransfer);
  router.post(`${API_BASE_URI}/wallet/account/verify`, ensureAuth, walletAccountValidator, grantAccess('readAny', 'Wallet'), WalletController.verifyWalletAccountNumber);
  router.post(`${API_BASE_URI}/wallet/account/resolve_phone`, ensureAuth, ValidatePhone, formatPhone, grantAccess('readAny', 'Wallet'), WalletController.resolveWalletPhoneToAccountNumber);
  router.post(`${API_BASE_URI}/wallet/withdraw`, ensureAuth, limitPaymentRequest, withdrawFromWalletValidator, formatPhone, grantAccess('createAny', 'Transaction'), WalletController.withdrawFromWallet);
  router.get(`${API_BASE_URI}/wallet/withdraw/charges`, ensureAuth, grantAccess('readOwn', 'Wallet'), WalletController.getWalletWithdrawCharges);

  /**
   * Webhook
   * @private
   */
  router.post(`${API_BASE_URI}/wallet/webhook/notify/${MONNIFY_WEBHOOK_URL}`, WalletController.paymentNotificationMonifyWebhook);

  router.get(`${API_BASE_URI}/wallet/fund/monify/verify`, ensureAuth, grantAccess('readAny', 'Transaction'), WalletController.verifyPaymentMonify);
};
