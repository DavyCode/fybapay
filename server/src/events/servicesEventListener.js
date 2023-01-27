// @flow

import Pubsub from '../events';
import { appLogger } from '../setup/logging';
import enumType from '../enumType';
import MailerServices from '../services/MailerServices';
import { formatNumber } from '../utils/formatPhone';
import { LOGS_MAIL } from '../config/env';
// import { sendSms } from '../utils/Sms';

/**
 * Subscribe to airtime purchase
 */
Pubsub.on('airtime_purchase', async ({ transaction, user }) => {
  try {
    const { email, firstName } = user;
    const { amount, transactionId, paidAt, recipientPhone, serviceName } = transaction;
    const service = serviceName.split('_')[0];

    if (email) {
      await MailerServices.sendMail({
        recipientPhone,
        amount,
        serviceName: service,
        transactionId,
        date: new Date(paidAt).toLocaleString(),
        email,
        firstName,
        templateName: enumType.emailTemplates.AIRTIME_PURCHASE,
      });
    }
    else {
      await MailerServices.sendMail({
        recipientPhone,
        amount,
        serviceName: service,
        transactionId,
        date: new Date(paidAt).toLocaleString(),
        email: LOGS_MAIL,
        firstName,
        templateName: enumType.emailTemplates.AIRTIME_PURCHASE,
      });
    }
  } catch (error) {
    appLogger.log('error', 'PUBSUB_airtime_purchase', {
      additionalInfo: {
        file: 'servicesEventListener.js',
        stack: error.stack,
        message: `${error.message}`,
        errorData: error.response ? error.response.data : 'Something went wrong',
      },
    });
  }
});

/**
 * Subscribe to airtime purchase failed
 */
Pubsub.on('airtime_purchase_failed', async (message) => {
});

/**
 * Subscribe to data purchase
 */
Pubsub.on('data_purchase', async ({ transaction, user, variation }) => {
  try {
    const { email, firstName } = user;
    const { amount, transactionId, paidAt, recipientPhone, serviceName } = transaction;
    const service = serviceName.split('_')[0];

    if (email) {
      await MailerServices.sendMail({
        recipientPhone,
        amount,
        serviceName: service,
        product: variation.toUpperCase(),
        transactionId,
        date: new Date(paidAt).toLocaleString(),
        email,
        firstName,
        templateName: enumType.emailTemplates.DATA_PURCHASE,
      });
    }
    else {
      await MailerServices.sendMail({
        recipientPhone,
        amount,
        serviceName: service,
        product: variation.toUpperCase(),
        transactionId,
        date: new Date(paidAt).toLocaleString(),
        email: LOGS_MAIL,
        firstName,
        templateName: enumType.emailTemplates.DATA_PURCHASE,
      });
    }
  } catch (error) {
    appLogger.log('error', 'PUBSUB_data_purchase', {
      additionalInfo: {
        file: 'servicesEventListener.js',
        stack: error.stack,
        message: `${error.message}`,
        errorData: error.response ? error.response.data : 'Something went wrong',
      },
    });
  }
});

/**
 * Subscribe to data purchase failed
 */
Pubsub.on('data_purchase_failed', async (message) => {});

/**
 * Subscribe to electricity purchase
 */
Pubsub.on('electricity_purchase', async (message) => {

//   4774-9245-8968-6846-9760
// Payment for power via was successful.
});

/**
 * Subscribe to electricity purchase VTPASS
 */
Pubsub.on('electricity_purchase_vtpass', async ({
  transaction,
  currentUser,
  requestResult,
  mobileNumber,
  meterNo,
  customer,
  serviceName,
}) => {
  try {
    const productName = requestResult.content.transactions.product_name;

    const {
      PurchasedUnits, MeterNumber, Address,
    } = requestResult;

    const token = requestResult.Token ?
      requestResult.Token : requestResult.token ? requestResult.token : null;

    const units = PurchasedUnits ?
      String(PurchasedUnits) : requestResult.units ? String(requestResult.units) : 'kWh';

    const meterNumber = MeterNumber ?
      MeterNumber : requestResult.meterNumber ? requestResult.meterNumber : meterNo;

    let phone = mobileNumber ? formatNumber(mobileNumber) : currentUser.phone;

    if (phone && token) {
      await MailerServices.sendSms({
        phone,
        message: `PRODUCT: ${productName ? productName : serviceName}. UNITS: ${units}. TOKEN: ${token}`,
      });
    }

    if (currentUser.email && token) {
      await MailerServices.sendMail({
        token,
        units,
        meterNumber,
        address: Address ? Address : customer,
        product: productName ? productName : serviceName,
        customerName: customer,
        transactionId: transaction.transactionId,
        date: new Date(transaction.paidAt).toLocaleString(),
        email: currentUser.email,
        firstName: currentUser.firstName,
        templateName: enumType.emailTemplates.ELECTRICITY_PURCHASE,
      });
    }
    else {
      await MailerServices.sendMail({
        token,
        units,
        meterNumber,
        address: Address ? Address : customer,
        product: productName ? productName : serviceName,
        customerName: customer,
        transactionId: transaction.transactionId,
        date: new Date(transaction.paidAt).toLocaleString(),
        email: LOGS_MAIL,
        firstName: currentUser.firstName,
        templateName: enumType.emailTemplates.ELECTRICITY_PURCHASE,
      });
    }
  } catch (error) {
    appLogger.log('error', 'PUBSUB_electricity_purchase_vtpass', {
      additionalInfo: {
        file: 'servicesEventListener.js',
        stack: error.stack,
        message: `${error.message}`,
      },
    });
  }
});

/**
 * Subscribe to electricity purchase failed
 */
Pubsub.on('electricity_purchase_failed', async (message) => {
  // 3363-3383-6146-8528-7245
  // Payment for power via was successful.
});

/**
 * Subscribe to cabletv purchase
 */
Pubsub.on('cabletv_purchase', async ({ transaction, user, cablePlan }) => {
//   GOTV: gotv-lite N410.0 for 2028972156 was successful via TMoni.
// Ref: T108314|20200930062036
  try {
    const { email, firstName, phone } = user;
    const { narration, recipientName, recipientAccount, amount, transactionId, paidAt, serviceName } = transaction;
    const service = serviceName.split('_')[0];

    if (phone) {
      await MailerServices.sendVendorSms({
        phone,
        message: `Fybapay: ${service} ${narration} for ${recipientAccount} successful on ${new Date(paidAt).toLocaleString()}. Trans ID: ${transactionId}`,
      });
    }

    if (email) {
      await MailerServices.sendMail({
        // recipientPhone,
        amount,
        product: cablePlan,
        recipientAccount,
        recipientCustomer: recipientName,
        serviceName: service,
        transactionId,
        date: new Date(paidAt).toLocaleString(),
        email,
        firstName,
        templateName: enumType.emailTemplates.CABLETV_PURCHASE,
      });
    }
    else {
      await MailerServices.sendMail({
        // recipientPhone,
        amount,
        product: cablePlan,
        recipientAccount,
        recipientCustomer: recipientName,
        serviceName: service,
        transactionId,
        date: new Date(paidAt).toLocaleString(),
        email: LOGS_MAIL,
        firstName,
        templateName: enumType.emailTemplates.CABLETV_PURCHASE,
      });
    }
  } catch (error) {
    appLogger.log('error', 'PUBSUB_cabletv_purchase', {
      additionalInfo: {
        file: 'servicesEventListener.js',
        stack: error.stack,
        message: `${error.message}`,
        errorData: error.response ? error.response.data : 'Something went wrong',
      },
    });
  }
});

/**
 * Subscribe to cabletv purchase failed
 */
Pubsub.on('cabletv_purchase_failed', async (message) => {
});

export default Pubsub;
