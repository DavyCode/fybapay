// @flow

/**
 * 
 * get all trx
 * get one trx
 * get user trx (Wallet)
 * get user trx (Services)
 * failed, init, success (filter status)
 * search by criteria (ref, id, )
 */

import TransactionRepository from '../repository/TransactionRepository';
import { BadRequestError, InternalServerError, APIError, NotFoundError, ForbiddenError, NotAcceptableError } from '../utils/errors';
import Utility from '../utils';
import UserRepository from '../repository/UserRepository';

// const trx =  async (params) => {
//   const trx = await TransactionRepository.findPendingAndInitTransactions("MONIFY");
//   console.log({ ALLLLLLLLLLLLLLLLLLLLL: trx })
// }
// trx();

export default {

  /**
  * Get All Transactions
  * @private
  */
  async getAllTransactionsAndByTypeAndORStatus(request: any) {
    const transactions = await TransactionRepository.getAllTransactionsAndByTypeAndORStatus(request.query);
    if (!transactions.data) { throw new NotFoundError('Transactions not found'); }
    return Utility.buildResponse({ ...transactions });
  },

  /**
   * Get Transactions By User And By Type And OR Status
   * @param {} user 
   * @param {} query 
   * @private
   */
  async getUserTransactionsAndByTypeAndORStatus(request: any) {
    const transactions = await TransactionRepository.getUserTransactionsAndByTypeAndORStatus(request.user.id, request.query);
    if (!transactions.data) { throw new NotFoundError('Transactions not found'); }
    return Utility.buildResponse({ ...transactions });
  },

  /**
   * Verify Transaction
   * @private
   * @todo - not wired
   */
  async findTransactionByTransactionReference(request) { // todo - not wired
    const transaction = await TransactionRepository.findByTransactionReference(request.query.transactionReference);
    if (!transaction) { throw new NotFoundError('Transaction not found'); }
    return Utility.buildResponse({ data: transaction });
  },

  /**
   * findTransactionByTransactionId
   * @param {*} request
   * @public
   */
  async findTransactionByTransactionId(request) { // todo - not wired
    const transaction = await TransactionRepository.findByTransactionId(request.query.transactionId);
    if (!transaction) { throw new NotFoundError('Transaction not found'); }
    return Utility.buildResponse({ data: transaction });
  },

  /**
   * getBeneficiaryByTransactionType
   * @param {Object} request - express request object
   * @private
   */
  async getUserBeneficiariesByTransactionType(request) {
    const user = await UserRepository.getUserById(request.user.id);
    if (!user) { throw new NotFoundError('User not found') }
    const beneficiaries = await TransactionRepository.getUserBeneficiariesOrByTransactionType(request.user.id, request.query);
    if (!beneficiaries.data) { throw new NotFoundError('No beneficiary found'); }
    return Utility.buildResponse({ ...beneficiaries });
  },

  /**
   * sumTransactionAmountByUserId
   * @param {Object} request - express request object
   * @public
   */
  async sumTransactionAmountByUserId(request) {
    const user = await UserRepository.getUserById(request.user.id);
    if (!user) { throw new NotFoundError('User not found') }
    const sum = await TransactionRepository.sumTransactionAmountByUserIdAndFilter(request.user.id, request.query);

    if (!sum) {
      throw new NotFoundError('Could not retrieve sum');
    }
    if (sum.length < 1) { throw new NotFoundError('No available transaction'); }

    return Utility.buildResponse({ data: sum });
  },

  /**
   * sumTransactionAmount
   * sumTransactionAmountByStatusAndDate
   * sumTransactionAmountByStatus
   * sumTransactionAmountByTypeAndDate
   * 
   * sumDailyTransactionAmountAndFilter
   */
};
