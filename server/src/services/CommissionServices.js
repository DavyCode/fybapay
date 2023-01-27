// @flow

import { BadRequestError, InternalServerError, PaymentRequiredError, NotFoundError, ForbiddenError, NotAcceptableError } from '../utils/errors';
import enumType, { service } from '../enumType';
import constant from '../constant';
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
   * @param {Object} transaction
   * @param {Object} user 
   * @param {Object} commission 
   * @public
   */
  async issueCommission(transaction, user, commission, commissionWallet): void {
    const preCommissionBalance = commissionWallet ? commissionWallet.balance : 0;
    const postCommissionBalance = preCommissionBalance + Math.round(commission);

    commissionWallet.balance += Math.round(commission);
    commissionWallet.overallEarnings += Math.round(commission);
    commissionWallet.meta.updatedAt = Date.now();
    await CommissionRepository.saveCommission(commissionWallet);
    
    await CommissionRepository.createCommissionHistory({
      commission: Math.round(commission),
      transaction,
      user: user._id,
      userId: user.userId,
      wallet: user.wallet,
      preCommissionBalance,
      postCommissionBalance,
      commissionWallet
    });
  },

  /**
   * Get User Commission Wallet
   * @public
   */
  async getUserCommissionWallet(request) {
    const commissionWallet = await CommissionRepository.getCommissionWalletByUserId(request.user.id);
    if (!commissionWallet) { throw new NotFoundError('Commission wallet not found'); }
    return Utility.buildResponse({ data: commissionWallet });
  },

  /**
   * Find Commission Wallet by id or user
   * @public
   */
  async findCommissionWalletByIdOrUser(request) {
    const commissionWallet = await CommissionRepository.findCommissionWalletByIdOrUser(request.query);
    if (!commissionWallet) { throw new NotFoundError('Commission wallet not found'); }
    return Utility.buildResponse({ data: commissionWallet });
  },

  /**
   * Get User Commission History
   * @public
   */
  async getUserCommissionHistory(request) {
    const commissionHistory = await CommissionRepository.getCommissionHistoryByUser(request.user.id, request.query);
    if (!commissionHistory.data) { throw new NotFoundError('Commission history not found'); }
    return Utility.buildResponse({ ...commissionHistory });
  },

  /**
   * find a commission history
   * @public
   */
  async findCommissionHistoryById(request) {
    const commissionHistory = await CommissionRepository.getCommissionHistoryById(request.query);
    if (!commissionHistory) { throw new NotFoundError('Commission history not found'); }
    return Utility.buildResponse({ data: commissionHistory });
  },
  /**
   * Get Commission History
   * @public
   */
  async getCommissionHistory(request) {
    const commissionHistory = await CommissionRepository.getCommissionHistory(request.query);
    if (!commissionHistory.data) { throw new NotFoundError('Commission history not found'); }
    return Utility.buildResponse({ ...commissionHistory });
  },

  /**
   * get Commission History By User Or CommissionWalletId
   * @public
   */
  async getCommissionHistoryByUserOrCommissionWalletId(request) {
    const commissionHistory = await CommissionRepository.getCommissionHistoryByUserOrCommissionWalletId(request.query);
    if (!commissionHistory.data) { throw new NotFoundError('Commission history not found'); }
    return Utility.buildResponse({ ...commissionHistory });
  },

  /**
   * TODO - ATTEND TO COMMISSION TRANSFER
   * Move Commission Balance To Wallet
   * @public
   */
  async moveCommissionBalanceToWallet(request) {
    const transferAmount = Number(request.body.amount);
    const user = await UserRepository.getUserById(request.user.id);
    if (!user) { throw new NotFoundError('User not found'); }
    
    // TODO -
    /**
     * Pause commission for now
     * @todo -----------------------------------------------
     */
    throw new ForbiddenError('cannot withdraw commission at this time');
    /**
     * get commission wallet
     * get wallet
     */
    const commissionWallet = await CommissionRepository.getCommissionWalletByUserId(request.user.id);
    if (!commissionWallet) { throw new NotFoundError('Commission wallet not found'); }
    /**
     * commission wallet has enough balance
     */
    if (commissionWallet.balance < transferAmount) { throw new PaymentRequiredError(paymentError.insufficientCommissionBalance); }
    if (transferAmount < constant.COMMISSION_WITHDRAW_LIMIT) { throw new PaymentRequiredError(`${paymentError.minimumTransferAmount} of ${constant.COMMISSION_WITHDRAW_LIMIT}`); }
    
    const wallet = await WalletRepository.getWalletByUserId(request.user.id);
    if (!wallet) { throw new NotFoundError(walletError.walletNotFound); }

    const reference = await Utility.generateTrxReference();
    /**
     * create transaction record (commission history trx (-subtract) and wallet history trx (wallet fund))
     */
    const walletTransaction = await TransactionRepository.TransactionCreate({
      serviceType: enumType.serviceType.FUND, 
      amount: transferAmount,
      user: user._id,
      userId: user.userId,
      transactionReference: reference,
      transactionId: Utility.getRandomInteger().toString().substring(1, 11),
      transactionType: enumType.transactionType.WALLET,
      transactionResource: enumType.serviceType.FUND,
      paymentMethod: enumType.paymentMethod.COMMISSION_TRANSFER,
      wallet: wallet._id,
      commissionWallet,
      status: enumType.transactionStatus.SUCCESSFUL,
      serviceId: enumType.service.WALLET_TOPUP,
      serviceName: 'WALLET_TOPUP',
      initiatedAt: Date.now(),
      senderName: wallet.accountName,
      senderAccount: wallet.accountNumber,
      senderAddress: user.address ? user.address: '',
      senderPhone: user.phone,
      senderId: user._id,
      recipientName: wallet.accountName,
      recipientAccount: wallet.accountNumber,
      recipientAddress: user.address ? user.address: '',
      recipientPhone: user.phone,
      recipientId: user._id,
      preWalletBalance: wallet.balance,
      message: 'Transaction successful',
      postWalletBalance: wallet.balance + transferAmount,
      paidAt: Date.now(),
      platform: enumType.platform.FYBAPAY,
      narration: 'Transfer commission to wallet'
    });

    const commissionTransaction = await CommissionRepository.createCommissionHistory({
      commission: 0,
      transaction: walletTransaction,
      user: user._id,
      userId: user.userId,
      wallet: wallet._id,
      preCommissionBalance: commissionWallet.balance,
      postCommissionBalance: commissionWallet.balance - transferAmount,
      commissionWallet
    });

    /**
     * subtract from commission
     * add to wallet
     */
    commissionWallet.balance -= transferAmount;
    commissionWallet.meta.updatedAt = Date.now();
    await CommissionRepository.saveCommission(commissionWallet);

    wallet.balance += transferAmount;
    wallet.meta.updatedAt = Date.now();
    await WalletRepository.saveWallet(wallet);
    /**
     * Email user
     */
    Pubsub.emit('commission_transfer_to_wallet', { commissionWallet, wallet, walletTransaction, commissionTransaction })
    return Utility.buildResponse({ data: walletTransaction, message: 'Transfer to wallet successful' });
  }

};
