// @flow

import ReferralRepository from '../repository/ReferralRepository';
import CommissionRepository from '../repository/CommissionRepository';
import CommissionServices from '../services/CommissionServices';
import TransactionRepository from '../repository/TransactionRepository';
import { BadRequestError, InternalServerError, APIError, NotFoundError, ForbiddenError, NotAcceptableError } from '../utils/errors';
import Utility from '../utils';
import enumType from '../enumType';
import constant from '../constant';
import UserRepository from '../repository/UserRepository';
import Pubsub from '../events/userEventListeners';

export default {
  /**
   * issueReferral
   * @param {*} request
   */
  async issueReferral(referralObject) {
    const { user, referredBy } = referralObject;

    let referrerRecord = await ReferralRepository.findOne({ referral_code: referredBy });
    if (!referrerRecord) {

      const referrerRecordUser = await UserRepository.findOne({ phone: referredBy });
      if (!referrerRecordUser) {
        return;
      }
      referrerRecord = await ReferralRepository.findOne({ referral_code: referrerRecordUser.referral_code });
    }
    const referrer = await UserRepository.getUserByIdWithWallet(referrerRecord.user);
    if (!referrer) {
      return;
    }
    const reference = await Utility.generateTrxReference();

    const transaction = await TransactionRepository.TransactionCreate({
      serviceType: enumType.serviceType.REFERRAL,
      amount: constant.REFERRAL_BONUS,
      user: referrer._id,
      userId: referrer.userId,
      transactionReference: reference,
      transactionId: Utility.getRandomInteger().toString().substring(1, 11),
      transactionType: enumType.transactionType.WALLET,
      transactionResource: enumType.serviceType.REFERRAL,
      paymentMethod: enumType.paymentMethod.DIRECT_CREDIT,
      wallet: referrer.wallet._id,
      status: enumType.transactionStatus.SUCCESSFUL,
      serviceId: enumType.service.REFERRAL,
      serviceName: 'REFERRAL',
      initiatedAt: Date.now(),
      recipientName: `${referrer.firstName} ${referrer.lastName}`,
      recipientAccount: '',
      recipientAddress: '',
      recipientPhone: referrer.phone,
      narration: 'New referral bonus earned',
      commission: constant.REFERRAL_BONUS,
      charges: 0,
      senderName: `${enumType.platform.FYBAPAY}/Admin`,
      senderAccount: enumType.platform.FYBAPAY,
      senderAddress: enumType.platform.FYBAPAY,
      senderPhone: enumType.contacts.SUPPORT,
      platform: enumType.platform.FYBAPAY,
      message: 'Referral bonus earned',
      paidAt: Date.now(),
      preWalletBalance: referrer.wallet.balance,
      postWalletBalance: referrer.wallet.balance,
    });

    referrerRecord.referral_balance += constant.REFERRAL_BONUS;
    referrerRecord.total_referral_earning += constant.REFERRAL_BONUS;
    referrerRecord.referred_users.push(user);
    referrerRecord.referral_transactions.push(transaction);
    referrerRecord.meta.updatedAt = Date.now();
    await ReferralRepository.referralSave(referrerRecord);

    const commissionWallet = await CommissionRepository.getCommissionWalletByUserId(referrer._id);
    if (!commissionWallet) {
      return;
    }

    await CommissionServices.issueCommission(
      transaction,
      referrer,
      constant.REFERRAL_BONUS,
      commissionWallet,
    );

    Pubsub.emit('new_referral', { referredUser: user, referredBy: referrer });
  },

  /**
   * referralCreate
   * @param {*} referralObject
   */
  async referralCreate(referralObject, user) {
    let referrerRecord;

    if (referralObject.referred_by !== null) {
      referrerRecord = await ReferralRepository.findOne({ referral_code: referralObject.referred_by });
    }

    const referral = await ReferralRepository.createReferral({
      ...referralObject,
      referred_by: referrerRecord,
    });

    user.referralRecord = referral;
    await UserRepository.userSave(user);
  },

  /**
   * get Referral Stats
   * @param {*} request
   */
  async getReferralStats(request) {
    const user = await UserRepository.getUserById(request.user.id);
    if (!user) { throw new NotFoundError('User not found'); }
    const referral = await ReferralRepository.findOne({ user: request.user.id });

    return Utility.buildResponse({
      data: {
        referralCode: referral.referral_code,
        totalInvites: referral.referred_users.length,
        totalEarning: referral.total_referral_earning,
      },
    });
  },

};
