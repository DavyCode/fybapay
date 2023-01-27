// @flow

import Pubsub from '../events';
import { appLogger } from '../setup/logging';
import MailerServices from '../services/MailerServices';
import enumType from '../enumType';
import { ADMIN_NOTIFICATION_EMAIL } from '../config/env';
import { LOGS_MAIL } from '../config/env';


// import { sendSms } from '../utils/Sms';

/**
 * Subscribe to wallet event
 */
Pubsub.on('wallet_to_wallet_transfer', async ({
  senderWalletTransaction, receiverWalletTransaction, sender, receiver }) => {

  try {
    if (sender.email) {
      const { firstName, email } = sender;
      const { transactionId, amount, recipientName, recipientAccount, paidAt } = senderWalletTransaction;

      await MailerServices.sendMail({
        email,
        templateName: enumType.emailTemplates.WTOW_SENDER,
        firstName,
        amount,
        transactionId,
        recipientName: recipientName ? recipientName : 'NIL',
        recipientAccount: recipientAccount ? recipientAccount : 'NIL',
        date: new Date(paidAt).toLocaleString(),
      });
    }
    else {
      const { firstName } = sender;
      const { transactionId, amount, recipientName, recipientAccount, paidAt } = senderWalletTransaction;

      await MailerServices.sendMail({
        email: LOGS_MAIL,
        templateName: enumType.emailTemplates.WTOW_SENDER,
        firstName,
        amount,
        transactionId,
        recipientName: recipientName ? recipientName : 'NIL',
        recipientAccount: recipientAccount ? recipientAccount : 'NIL',
        date: new Date(paidAt).toLocaleString(),
      });
    }

    if (receiver.email) {
      const { firstName, email } = receiver;
      const { transactionId, amount, senderName, recipientAccount, paidAt } = receiverWalletTransaction;

      await MailerServices.sendMail({
        email,
        templateName: enumType.emailTemplates.WTOW_RECIPIENT,
        firstName,
        amount,
        transactionId,
        senderName: senderName ? senderName : 'NIL',
        recipientAccount: recipientAccount ? recipientAccount : 'NIL',
        date: new Date(paidAt).toLocaleString(),
      });
    }
    else {
      const { firstName } = receiver;
      const { transactionId, amount, senderName, recipientAccount, paidAt } = receiverWalletTransaction;

      await MailerServices.sendMail({
        email: LOGS_MAIL,
        templateName: enumType.emailTemplates.WTOW_RECIPIENT,
        firstName,
        amount,
        transactionId,
        senderName: senderName ? senderName : 'NIL',
        recipientAccount: recipientAccount ? recipientAccount : 'NIL',
        date: new Date(paidAt).toLocaleString(),
      });
    }

  } catch (error) {
    appLogger.log('error', 'PUBSUB_wallet_to_wallet_transfer', {
      additionalInfo: {
        file: 'walletEventListener.js',
        stack: error.stack,
      },
    });
  }
});

/**
 * Subscribe to wallet refund event
 */
Pubsub.on('wallet_refund', async (message) => {
  /**
   * @todo - MAIL RECEIVER
   * @todo - MAIL ADMIN
   * @todo - If amount is greater than N500 sms receiver
   */
});

/**
 * Subscribe to wallet withdraw event
 */
Pubsub.on('wallet_withdraw', async (message) => {
  /**
   * @todo - MAIL RECEIVER
   * @todo - MAIL ADMIN
   * @todo - If amount is greater than N500 sms receiver
   */
});

/**
 * Subscribe to wallet withdraw failed event
 */
Pubsub.on('wallet_withdraw_failed', async (message) => {
  /**
   * @todo - MAIL ADMIN
   * @todo - If amount is greater than N500 sms receiver
   */
});

/**
 * Subscribe to wallet withdraw event
 */
Pubsub.on('wallet_withdraw_failed_insufficient_bal', async (message) => {
  /**
   * @todo - MAIL ADMIN
   * @todo - critical
   */
});

/**
 * Subscribe to wallet withdraw event
 */
Pubsub.on('wallet_fund', async ({ user, wallet, transaction }) => {

  try {
    if (user.phone) {
      await MailerServices.sendVendorSms({
        phone: user.phone,
        message: `Fybapay: FUND WALLET. Your Wallet was funded with NGN${transaction.amount} on ${new Date(transaction.paidAt).toLocaleString()}`,
      });
    }

    if (user.email) {
      await MailerServices.sendMail({
        email: user.email,
        templateName: 'wallet_fund',
        accountNumber: wallet.accountNumber,
        firstName: user.firstName,
        fullName: `${user.firstName} ${user.lastName}`,
        amount: transaction.amount,
        transactionRef: transaction.transactionId, // TODO - Replace ref with transaction ID
        date: new Date(transaction.paidAt).toLocaleString(),
      });
    }
    else {
      await MailerServices.sendMail({
        email: LOGS_MAIL,
        templateName: 'wallet_fund',
        accountNumber: wallet.accountNumber,
        firstName: user.firstName,
        fullName: `${user.firstName} ${user.lastName}`,
        amount: transaction.amount,
        transactionRef: transaction.transactionId, // TODO - Replace ref with transaction ID
        date: new Date(transaction.paidAt).toLocaleString(),
      });
    }

    // await MailerServices.sendMail({
    //   email: ADMIN_NOTIFICATION_EMAIL,
    //   templateName: 'wallet_fund_notify_admin',
    //   accountNumber: wallet.accountNumber,
    //   fullName: `${user.firstName} ${user.lastName}`,
    //   amount: transaction.amount,
    //   transactionRef: transaction.transactionReference,
    //   date: new Date(transaction.paidAt).toLocaleString(),
    // });

  } catch (error) {
    appLogger.log('error', {
      stack: error.stack,
      message: `PUBSUB_FUND_WALLET: ${error}`,
    });
  }
});

export default Pubsub;
