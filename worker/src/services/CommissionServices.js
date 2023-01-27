// @flow

import { BadRequestError, InternalServerError, PaymentRequiredError, NotFoundError, ForbiddenError, NotAcceptableError } from '../utils/errors';
import enumType, { service } from '../enumType';
import Utility from '../utils';
import UserRepository from '../repository/UserRepository';
import TransactionRepository from '../repository/TransactionRepository';
import Pubsub from '../events/commissionEventListener';
import WalletRepository from '../repository/WalletRepository';
import CommissionRepository from '../repository/CommissionRepository';
import { paymentError, walletError } from '../constant/errorMessages';

export default {
  /**
   * issueCommission
   * @param {*} transaction 
   * @param {*} user 
   * @param {*} commission 
   * @private
   */
  async issueCommission(transaction, user, commission, commissionWallet): void {
    console.log({ commissionWallet})
    const preCommissionBalance = commissionWallet ? commissionWallet.balance : 0;
    const postCommissionBalance = preCommissionBalance + commission; 

    commissionWallet.balance += commission;
    commissionWallet.overallEarnings += commission;
    commissionWallet.meta.updatedAt = Date.now();
    await CommissionRepository.saveCommission(commissionWallet);
    
    await CommissionRepository.createCommissionHistory({
      commission,
      transaction,
      user: user._id,
      userId: user.userId,
      wallet: user.wallet,
      preCommissionBalance,
      postCommissionBalance,
      commissionWallet
    });
  },

};
