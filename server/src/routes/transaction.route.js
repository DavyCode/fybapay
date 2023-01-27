import ensureAuth from '../middleware/ensureAuth';
import { API_BASE_URI } from '../config/env';
import TransactionController from '../controllers/transaction.controller';
import { serviceVariationValidator } from '../validations/inputValidator';
import grantAccess from '../middleware/grantAccess';

export default (router) => {
  router.get(`${API_BASE_URI}/transactions`, ensureAuth, grantAccess('readOwn', 'Transaction'), TransactionController.getUserTransactionsAndByTypeAndORStatus);
  router.get(`${API_BASE_URI}/transactions/verify`, ensureAuth, grantAccess('readOwn', 'Transaction'), TransactionController.findTransactionByTransactionReference);
  router.get(`${API_BASE_URI}/transactions/sum`, ensureAuth, grantAccess('readOwn', 'Transaction'), TransactionController.sumTransactionAmountByUserId);
  router.get(`${API_BASE_URI}/transactions/findById`, ensureAuth, grantAccess('readOwn', 'Transaction'), TransactionController.findTransactionByTransactionId);

  // router.get(`${API_BASE_URI}/transactions/filter`, ensureAuth, grantAccess('readOwn', 'Transaction'), TransactionController.)
};
