// @flow

import Joi from 'joi';

const mailValidator = async (request: any, response: any, next: any) => {
  // console.log({ BODY: request.body })

  let schema;

  if (!request.body.templateName) {
    return response
      .status(400)
      .json({ status: 'error', message: 'Template name is required' });
  }
  
  switch (request.body.templateName) {
    case 'airtime_purchase':
      schema = Joi.object().keys({
        email: Joi.string().email().required(),
        firstName: Joi.string().required(),
        templateName: Joi.string().required(),
        amount: Joi.number().required(),
        date: Joi.string().required(),
        transactionId: Joi.string().required(),
        recipientPhone: Joi.string().required(),
        serviceName: Joi.string().required(),
      })
      break;
    case 'data_purchase':
      schema = Joi.object().keys({
        email: Joi.string().email().required(),
        firstName: Joi.string().required(),
        templateName: Joi.string().required(),
        amount: Joi.number().required(),
        date: Joi.string().required(),
        transactionId: Joi.string().required(),
        recipientPhone: Joi.string().required(),
        serviceName: Joi.string().required(),
        product: Joi.string().required(),
      })
      break;
    case 'cabletv_purchase':
      schema = Joi.object().keys({
        email: Joi.string().email().required(),
        firstName: Joi.string().required(),
        templateName: Joi.string().required(),
        amount: Joi.number().required(),
        date: Joi.string().required(),
        transactionId: Joi.string().required(),
        serviceName: Joi.string().required(),
        product: Joi.string().required(),
        recipientCustomer: Joi.string().required(),
        recipientAccount: Joi.string().required(),        
      })
      break;
    case 'wallet_fund':
      schema = Joi.object().keys({
        email: Joi.string().email().required(),
        fullName: Joi.string().required(),
        firstName: Joi.string().required(),
        templateName: Joi.string().required(),
        accountNumber: Joi.string().required(),
        amount: Joi.number().required(),
        transactionRef: Joi.string().required(),
        date: Joi.string().required(),
      })
      break;
    case 'wallet_fund_notify_admin': 
      schema = Joi.object().keys({
        email: Joi.string().email().required(),
        fullName: Joi.string().required(),
        templateName: Joi.string().required(),
        accountNumber: Joi.string().required(),
        // phone: Joi.string().required(),
        amount: Joi.number().required(),
        transactionRef: Joi.string().required(),
        date: Joi.string().required(),
      })
      break;
    case 'password-reset-successful':
      schema = Joi.object().keys({
        email: Joi.string().email().required(),
        firstName: Joi.string().required(),
        templateName: Joi.string().required(),
      })
      break;
    case 'new-referral':
      schema = Joi.object().keys({
        email: Joi.string().email().required(),
        firstName: Joi.string().required(),
        referredUser: Joi.string().required(),
        templateName: Joi.string().required(),
      })
      break; 
    case 'upgrade_to_agent': // TODO - 
      schema = Joi.object().keys({
        email: Joi.string().email().required(),
        last_name: Joi.string().min(3).max(50).required(),
        first_name: Joi.string().min(3).max(50).required(),
        phone: Joi.string().min(8).max(15).required(),
        message: Joi.string().min(8).max(200).required()
      })
      break; 
    case 'welcome-to-fyba':
      schema = Joi.object().keys({
        email: Joi.string().email().required(),
        lastName: Joi.string().required(),
        firstName: Joi.string().required(),
        templateName: Joi.string().required(),
        newAccountNumber: Joi.string().required(),
        link: Joi.string().required()
      })
      break;
    case 'electricity-purchase':
      schema = Joi.object().keys({
        email: Joi.string().email().required(),
        templateName: Joi.string().required(),
        firstName: Joi.string().required(),
        token: Joi.string().required(),
        product: Joi.string().required(),
        units: Joi.string().required(),
        meterNumber: Joi.string().required(),
        customerName: Joi.string().required(),
        transactionId: Joi.string().required(),
        date: Joi.string().required(),
        address: Joi.string().required(),
      })
      break;
    case 'new_pos_notification':
      schema = Joi.object().keys({
        email: Joi.string().email().required(),
        firstName: Joi.string().required(),
        templateName: Joi.string().required(),
        amount: Joi.number().required(),
        date: Joi.string().required(),
        transactionId: Joi.string().required(),
        terminal: Joi.string().required(),
      })
      break;
    case 'w2wallet-recipient':
      schema = Joi.object().keys({
        email: Joi.string().email().required(),
        firstName: Joi.string().required(),
        templateName: Joi.string().required(),
        amount: Joi.number().required(),
        date: Joi.string().required(),
        transactionId: Joi.string().required(),
        senderName: Joi.string().required(),
        recipientAccount: Joi.string().required(),
      })
      break;
    case 'w2wallet-sender':
      schema = Joi.object().keys({
        email: Joi.string().email().required(),
        firstName: Joi.string().required(),
        templateName: Joi.string().required(),
        amount: Joi.number().required(),
        date: Joi.string().required(),
        transactionId: Joi.string().required(),
        recipientName: Joi.string().required(),
        recipientAccount: Joi.string().required(),
      })
      break;
    default:
      return response
        .status(400)
        .json({ status: 'error', message: 'No matching template found' });
  }

  if (!schema) {
    return response
      .status(400)
      .json({ status: 'error', message: 'No matching template or object Schema found' });
  }

  try {
    await schema.validateAsync(request.body);
    return next();
  }
  catch (err) {
    return response
      .status(400)
      .json({ status: 'error', message: `${err.details[0].message}` });
  }
};

const enquiryValidator = async (request: any, response: any, next: any) => {
  const schema = Joi.object().keys({
      email: Joi.string().email().required(),
      last_name: Joi.string().min(3).max(50).required(),
      first_name: Joi.string().min(3).max(50).required(),
      phone: Joi.string().min(8).max(15).required(),
      message: Joi.string().min(8).max(200).required()
    })

  try {
    await schema.validateAsync(request.body);
    return next();
  }
  catch (err) {
    return response
      .status(400)
      .json({ status: 'error', message: `${err.details[0].message}` });
  }
};

export {
  mailValidator,
  enquiryValidator
};
