// @flow

import { BadRequestError, InternalServerError, APIError, NotFoundError, ForbiddenError, NotAcceptableError } from '../utils/errors';
import Utility from '../utils';
import UserRepository from '../repository/UserRepository';
import PaymentSecretRepository from '../repository/PaymentSecretRepository'

export default {
  // create user secret
  // admin reset secret
  // reset user payment secret
  // confirmPin

  /**
   * confirmUserPin
   * @param {*} request
   */
  async confirmUserPin(request) {
    const user = await UserRepository.getUserById(request.user.id);
    if (!user) { throw new NotFoundError('User not found') };
    if (user.lock) { throw new ForbiddenError('User account locked, contact support'); }

    const paymentSecret = await PaymentSecretRepository.getPaymentSecretByUserId(request.user.id);
    if (!paymentSecret) { throw new NotFoundError('Transaction pin not found, kindly create one'); }

    if (!paymentSecret.secretHash) { throw new ForbiddenError('User transaction pin not found, kindly create one') };
    const isMatch = paymentSecret.comparePaymentSecret(request.body.confirmPin);
    if (!isMatch) { throw new BadRequestError('Wrong transaction pin')};

    return Utility.buildResponse({ message: 'Valid pin' })
  },

  /**
   * createUserPaymentSecret
   * @param {*} request
   */
  async createUserPaymentSecret(user, transactionSecret) {
    const paymentSecret = await PaymentSecretRepository.createPaymentSecret({
      user,
      userId: user.userId,
      phone: user.phone,
      secretPin: transactionSecret,
    });

    if (!paymentSecret) { throw new InternalServerError('Could not create user secret'); }
    return paymentSecret;
  },

  /**
   * resetUserPaymentSecret
   * @param {*} request
   */
  async resetUserPaymentSecret(request) {
    const { oldTransactionSecret, newTransactionSecret, confirmTransactionSecret } = request.body;

    const user = await UserRepository.getUserById(request.user.id);
    if (!user) { throw new NotFoundError('User not found') };
    if (user.lock) { throw new ForbiddenError('User account locked, contact support'); }

    const paymentSecret = await PaymentSecretRepository.getPaymentSecretByUserId(request.user.id);
    if (!paymentSecret) { throw new NotFoundError('Transaction pin not found, kindly create one'); }

    if (!paymentSecret.secretHash) { throw new ForbiddenError('User transaction pin not found, kindly create one') };
    const isMatch = paymentSecret.comparePaymentSecret(oldTransactionSecret);
    if (!isMatch) { throw new BadRequestError('Provide correct old transaction pin')};

    if (confirmTransactionSecret !== newTransactionSecret) { throw new BadRequestError('Transactions confirmation pin don\'t match') };

    paymentSecret.secretPin = newTransactionSecret;
    paymentSecret.meta.updatedAt = Date.now();
    await PaymentSecretRepository.paymentSecretSave(paymentSecret);

    return Utility.buildResponse({ message: 'Transaction pin changed successfully' });
  },

  /**
   * adminResetPaymentSecret
   * @param {*} request
   */
  async adminResetPaymentSecret(request) {

  },

};
