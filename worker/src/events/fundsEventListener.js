// @flow

import Pubsub from '../events';
import { appLogger } from '../setup/logging';
import { NODE_ENV, LOGS_MAIL } from '../config/env';
import MailerServices from '../services/MailerServices';

// import { sendSms } from '../utils/Sms';


Pubsub.on('fund_transfer', async ({ transaction, user }) => {
  /**
   * @todo - MAIL ADMIN
   */
  try {


  } catch (error) {
    appLogger.log('error', 'PUBSUB_FUND_TRANSFER', {
      additionalInfo: {
        file: 'fundEventListener.js',
        stack: error.stack,
      },
    });

    console.log(error.message);
  }
});

/**
 * success_verify_transactions
 */
Pubsub.on('success_verify_transactions', async ({ transaction, user }) => {
  try {
    const { phone, email } = user;
    const {
      amount,
      transactionId,
      serviceType,
      status,
      recipientName,
      recipientAccount,
      senderAccount,
      narration,
      paidAt,
    } = transaction;

    const date = new Date(paidAt).toLocaleString();

    // transfer - mail & sms
    if (serviceType === 'TRANSFER' && status === 'Successful') {

      // send SMS
      if (phone) {
        const a = String(senderAccount).slice(0, 1);
        const b = String(senderAccount).slice(7);
        const c = String(recipientName).slice(0, 20);
        const d = String(narration).slice(0, 15);

        await MailerServices.sendVendorSmsInternal({
          phone,
          message: `Fyba: Dr Fr: ${a}****${b} To: ${recipientAccount}-${c}; NGN${amount}; Desc: Trf - ${d};${date}`,
        });
      }

      // send EMAIL
      if (email) {
        await MailerServices.sendMailInternal({
          email,
          templateName: 'fund-transfer',
          firstName: user.firstName,
          amount,
          transactionId,
          recipientName: recipientName ? recipientName : 'NIL',
          recipientAccount: recipientAccount ? recipientAccount : 'NIL',
          date,
        });
      }
      else {
        await MailerServices.sendMailInternal({
          email: LOGS_MAIL,
          templateName: 'fund-transfer',
          firstName: user.firstName,
          amount,
          transactionId,
          recipientName: recipientName ? recipientName : 'NIL',
          recipientAccount: recipientAccount ? recipientAccount : 'NIL',
          date,
        });
      }
    }

    if (serviceType === 'WITHDRAW' && status === 'Successful') {
      // send SMS
      if (phone) {
        const a = String(senderAccount).slice(0, 1);
        const b = String(senderAccount).slice(7);
        const c = String(recipientName).slice(0, 20);
        const d = String(narration).slice(0, 15);

        await MailerServices.sendVendorSmsInternal({
          phone,
          message: `Fyba: Dr Fr: ${a}****${b} To: ${recipientAccount}-${c}; NGN${amount}; Desc: Trf - ${d};${date}`,
        });
      }

      // send EMAIL
      if (email) {
        await MailerServices.sendMailInternal({
          email,
          templateName: 'wallet-withdraw',
          firstName: user.firstName,
          amount,
          transactionId,
          recipientName: recipientName ? recipientName : 'NIL',
          recipientAccount: recipientAccount ? recipientAccount : 'NIL',
          date,
        });
      }
      else {
        await MailerServices.sendMailInternal({
          email: LOGS_MAIL,
          templateName: 'wallet-withdraw',
          firstName: user.firstName,
          amount,
          transactionId,
          recipientName: recipientName ? recipientName : 'NIL',
          recipientAccount: recipientAccount ? recipientAccount : 'NIL',
          date,
        });
      }
    }

    if (serviceType === 'AIRTIME' && status === 'Successful') {}
    if (serviceType === 'DATA' && status === 'Successful') {}
    if (serviceType === 'CABLETV' && status === 'Successful') {}
    if (serviceType === 'ELECTRICITY' && status === 'Successful') {}
    if (serviceType === 'BULK_TRANSFER' && status === 'Successful') {}

  } catch (error) {
    appLogger.log('error', 'PUBSUB_success_verify_transactions', {
      additionalInfo: {
        file: 'fundEventListener.js',
        stack: error.stack,
      },
    });

    console.log(error.message);
  }
});

export default Pubsub;


// WITHDRAW: 'WITHDRAW',
// TRANSFER: 'TRANSFER',
// AIRTIME: 'AIRTIME',
// DATA: 'DATA',
// CABLETV: 'CABLETV',
// ELECTRICITY: 'ELECTRICITY',
// BULK_TRANSFER: 'BULK_TRANSFER',

// POS: 'POS', XX
// FUND: 'FUND',
// WAEC: 'WAEC',
// JAMB: 'JAMB',


// Dr Fr: 1****062 To: 9901510591-TMoni-THRIVE  MONI; NGN191,325.00; Desc: Trf - Part Repayment Azemoh;03/12/2020 05:52:24; Avl Bal: NGN
// Dr Fr: 1****062
// To: 9901510591-TMoni-THRIVE  MONI;
// NGN191,325.00;
// Desc: Trf - Part Repayment Azemoh;
// 03/12/2020 05:52:24;
// Avl Bal: NGN

// You have received N34425.0 from TAOFEEK AZEEZ 9933183013 via TMoni
// Daud

// You have received N5200.0 from OPERATION FINANCE KADUNA PAMBEGUA 9919662280 via TMoni
// Payment for water and fuel

// DSTV: dstv-yanga N2565.0 for 10431121374 was successful via TMoni.
// Ref: TMoni648647|20201117201108

// GOTV: gotv-max N3600.0 for 4613034243 was successful via TMoni.
// Ref: TMoni371849|20201117205055