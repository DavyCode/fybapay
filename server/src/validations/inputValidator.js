// @flow

import Joi from 'joi';
// import * as yup from 'yup'; // for everything
/**
 * You need to separately read 
 * req.body , 
 * req.params , 
 * req.query
 * for request body, params, and query.
 */

// POST /rbq/v1/users/authorize
const LoginValidator = async (request: any, response: any, next: any) => {
  const schema = Joi.object().keys({
    password: Joi
      .string()
      // .pattern(new RegExp('^[0-9]'))
      .min(8)
      .required(),
    phone: Joi
      .string()
      .pattern(new RegExp('^[0-9]'))
      .min(10)
      .max(11)
      .required(),
  })
    .with('phone', 'password');

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

// const LoginValidaton = async (request: any, response: any, next: any) => {
//   const schema = yup.object().shape({
//     phone: yup.string().min(10).max(11).required(),
//     password: yup.number().required().positive().integer(),
//   });

//   // schema.validate({ name: 'jimmy', age: 11 }).catch(function(err) {
//   //   err.name; // => 'ValidationError'
//   //   err.errors; // => ['Deve ser maior que 18']
//   // });
  
//   try {
//     await schema.validateSync(request.body);
//     // await schema.validateAsync(request.body);
//     return next();
//   }
//   catch (err) {
//     console.log({ err })
//     return response
//       .status(400)
//       .json({ status: 'error', message: err });
//   }
// };

const ConfirmPinValidator = async (request: any, response: any, next: any) => {
  const schema = Joi.object().keys({
    confirmPin: Joi
      .string()
      .pattern(new RegExp('^[0-9]'))
      .min(5)
      .required(),
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

// POST /rbq/v1/users/onboarding
const ValidatePhone = async (request: any, response: any, next: any) => {
  const schema = Joi.object().keys({
    phone: Joi
      .string()
      .pattern(new RegExp('^[0-9]'))
      .min(10)
      .max(11)
      .required(),
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

const newProfileValidator = async (request: any, response: any, next: any) => {
  const schema = Joi.object().keys({
    phone: Joi
      .string()
      .pattern(new RegExp('^[0-9]'))
      .min(10)
      .max(11)
      .required(),
    email: Joi.string().email(), // not required
    lastName: Joi.string().min(2).max(30).required(),
    firstName: Joi.string().min(2).max(30).required(),
    password: Joi
      .string()
      .min(8)
      .required(),
      // .pattern(new RegExp('^[0-9]'))
    confirmPassword: Joi
      .string()
      .min(8)
      .required(),
      // .pattern(new RegExp('^[0-9]'))
    referredBy: Joi.string(),
    howDidYouHearAboutUs: Joi.string(),
    transactionSecret: Joi
      .string()
      .pattern(new RegExp('^[0-9]'))
      .min(5)
      .max(5)
      .required(),
    confirmTransactionSecret: Joi
      .string()
      .pattern(new RegExp('^[0-9]'))
      .min(5)
      .max(5)
      .required(),
  })

  try {
    await schema.validateAsync(request.body);
    if (request.body.password == '00000000' || request.body.password == 11111111 || request.body.password == '11111111') {
      return response
        .status(400)
        .json({ status: 'error', message: 'Kindly choose a stronger password' });
    }

    if (request.body.transactionSecret == '00000' || request.body.transactionSecret == 11111 || request.body.transactionSecret == '11111') {
      return response
        .status(400)
        .json({ status: 'error', message: 'Kindly choose a safer Transaction pin' });
    }
    return next();
  }
  catch (err) {
    return response
      .status(400)
      .json({ status: 'error', message: `${err.details[0].message}` });
  }
};

const resetPasswordValidator = async (request: any, response: any, next: any) => {
  const schema = Joi.object().keys({
    resetPasswordPin: Joi.string().min(4).required(),
    password: Joi
      .string()
      .min(8)
      .required(),
      // .pattern(new RegExp('^[0-9]'))
  });

  try {
    await schema.validateAsync(request.body);
    if (request.body.password == '00000000' || request.body.password == 11111111 || request.body.password == '11111111') {
      return response
        .status(400)
        .json({ status: 'error', message: 'Kindly choose a stronger password' });
    }
    return next();
  }
  catch (err) {
    return response
      .status(400)
      .json({ status: 'error', message: `${err.details[0].message}` });
  }
};

const changePassValidator = async (request: any, response: any, next: any) => {
  const schema = Joi.object().keys({
    oldPassword: Joi
      .string()
      .min(8)
      .required(),
      // .pattern(new RegExp('^[0-9]'))
      // .max(4)
    newPassword: Joi
      .string()
      .min(8)
      .required(),
      // .pattern(new RegExp('^[0-9]'))
      // .max(4)
    confirmPassword: Joi
      .string()
      .min(8)
      .required(),
      // .pattern(new RegExp('^[0-9]'))
      // .max(4)
  });

  try {
    await schema.validateAsync(request.body);
    if (request.body.newPassword == '00000000' || request.body.newPassword == 11111111 || request.body.newPassword == '11111111') {
      return response
        .status(400)
        .json({ status: 'error', message: 'Kindly choose a stronger password' });
    }
    return next();
  }
  catch (err) {
    return response
      .status(400)
      .json({ status: 'error', message: `${err.details[0].message}` });
  }
};

const changeTransactionSecretValidator = async (request: any, response: any, next: any) => {
  const schema = Joi.object().keys({
    oldTransactionSecret: Joi.string().min(5).max(5).required(),
    newTransactionSecret: Joi.string().min(5).max(5).required(),
    confirmTransactionSecret: Joi.string().min(5).max(5).required(),
  });

  try {
    await schema.validateAsync(request.body);
    if (request.body.newTransactionSecret == '00000' || request.body.newTransactionSecret == 11111 || request.body.newTransactionSecret == '11111') {
      return response
        .status(400)
        .json({ status: 'error', message: 'Kindly choose a safer Transaction pin' });
    }
    return next();
  }
  catch (err) {
    return response
      .status(400)
      .json({ status: 'error', message: `${err.details[0].message}` });
  }
};

const verifyBankValidator = async (request: any, response: any, next: any) => {
  const schema = Joi.object().keys({
    bankCode: Joi
      .string()
      .pattern(new RegExp('^[0-9]'))
      .min(2)
      .required(),
    bankAccountNumber: Joi
      .string()
      .pattern(new RegExp('^[0-9]'))
      .min(5)
      .max(30)
      .required(),
  });

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

const verifyBvnValidator = async (request: any, response: any, next: any) => {
  const schema = Joi.object().keys({
    bvn: Joi
      .string()
      .pattern(new RegExp('^[0-9]'))
      .min(11)
      .max(11)
      .required(),
  });

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

const bvnCodeValidator = async (request: any, response: any, next: any) => {
  const schema = Joi.object().keys({
    bvnVerifyCode: Joi.string().min(4).max(4).required(),
  });

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

const phoneTokenValidator = async (request: any, response: any, next: any) => {
  const schema = Joi.object().keys({
    verifyPhoneOtp: Joi.string()
      .min(4)
      .max(4)
      .required(),
  });

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

const updateProfileValidator = async (request: any, response: any, next: any) => {
  const schema = Joi.object().keys({
    email: Joi.string()
      .email()
      .required(),
    lastName: Joi.string()
      .min(2)
      .max(30)
      .required(),
    firstName: Joi.string()
      .min(2)
      .max(30)
      .required(),
    username: Joi.string()
      .min(2)
      .max(30)
      .required(),
    dateOfBirth: Joi.date().required(),
    gender: Joi.string().required(),
    address: Joi.string()
      .min(2)
      .max(100)
      .required(),
    street: Joi.string()
      .min(2)
      .max(50)
      .required(),
    lga: Joi.string()
      .min(2)
      .max(30)
      .required(),
    state: Joi.string()
      .min(2)
      .max(30)
      .required(),
    businessState: Joi.string(),
    businessAddress: Joi.string(),
    businessLga: Joi.string(),
    businessCity: Joi.string(),
  });

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

const agentOnboardingValidator = async (request: any, response: any, next: any) => {
  const schema = Joi.object().keys({
    businessName: Joi.string().required(),
    businessState: Joi.string().required(),
    businessAddress: Joi.string().required(),
    businessLga: Joi.string().required(),
    businessCity: Joi.string().required(),
  });

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

const meterVerifyValidator = async (request: any, response: any, next: any) => {
  const schema = Joi.object().keys({
    meterNumber: Joi
      .string()
      .pattern(new RegExp('^[0-9]'))
      .required(),
    serviceName: Joi.string().required(),
  });

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

const electricityServiceValidator = async (request: any, response: any, next: any) => {
  const schema = Joi.object().keys({
    serviceName: Joi.string().required(),
    amount: Joi.number().greater(9).integer().positive().required(),
    meterNumber: Joi
      .string()
      .pattern(new RegExp('^[0-9]'))
      .required(),
    mobileNumber: Joi
      .string()
      .pattern(new RegExp('^[0-9]'))
      .min(11)
      .max(11)
      .required(),
    customernumber: Joi.string(), //.required(), // TODO - verify if required
    customername: Joi.string(),
    customeraddress: Joi.string(),
    paymentMadeWith: Joi.string().required(),
  });

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

const cabletvVerifyValidator = async (request: any, response: any, next: any) => {
  const schema = Joi.object().keys({
    smartCardNumber: Joi.string().required(),
    serviceName: Joi.string().required(),
  });

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

const cabletvServiceValidator = async (request: any, response: any, next: any) => {
  const schema = Joi.object().keys({
    serviceName: Joi.string().required(),
    amount: Joi.number().greater(9).integer().positive().required(),
    smartCardNumber: Joi.string().required(),
    mobileNumber: Joi
      .string()
      .pattern(new RegExp('^[0-9]'))
      .min(11)
      .max(11)
      .required(),
    paymentMadeWith:  Joi.string().required(),
    customername: Joi.string(),
    customernumber: Joi.string(),
    variation_code: Joi.string(), 
  });

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

const airtimeServiceValidator = async (request: any, response: any, next: any) => {
  const schema = Joi.object().keys({
    amount: Joi.number().greater(9).integer().positive().required(),
    paymentMadeWith: Joi.string().required(),
    mobileNumber: Joi
      .string()
      .pattern(new RegExp('^[0-9]'))
      .min(11)
      .max(11)
      .required(),
    serviceName: Joi.string().required()
  });

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

const mobileDataServiceValidator = async (request: any, response: any, next: any) => {
  const schema = Joi.object().keys({
    amount: Joi.number().greater(9).integer().positive().required(),
    mobileNumber: Joi
      .string()
      .pattern(new RegExp('^[0-9]'))
      .min(11)
      .max(11)
      .required(),
    serviceName: Joi.string().required(),
    paymentMadeWith: Joi.string().required(),
    variation_code: Joi.string(),
    customernumber: Joi.string(),
  });

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

const mobileDataVerifyServiceValidator = async (request: any, response: any, next: any) => {
  const schema = Joi.object().keys({
    serviceName: Joi.string().required(),
    mobileNumber: Joi
      .string()
      .pattern(new RegExp('^[0-9]'))
      .min(11)
      .max(11)
      .required(),
  });

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

const uploadGetPresignedUrlValidator = async (request: any, response: any, next: any) => {
  const schema = Joi.object().keys({
    category: Joi.string().required(),
    ext: Joi.string().required(),
    type: Joi.string().required(),
    // name: Joi.string().required()
  });

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

const uploadUpdateValidator = async (request: any, response: any, next: any) => {
  const schema = Joi.object().keys({
    category: Joi.string().required(),
    key: Joi.string().required(),
  });

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

const createSwitchValidator = async (request: any, response: any, next: any) => {
  const schema = Joi.object().keys({
    serviceType: Joi.string().required(),
  });

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

const switchServiceValidator = async (request: any, response: any, next: any) => {
  const schema = Joi.object().keys({
    serviceType: Joi.string().required(),
    platform: Joi.string().required(),
    charge: Joi.number().required(),
  });

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

const serviceVariationValidator = async (request: any, response: any, next: any) => {
  const schema = Joi.object().keys({
    serviceType: Joi.string().required(),
    serviceName: Joi.string().required(),
  });

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

const updateServiceChargeValidator = async (request: any, response: any, next: any) => {
  const schema = Joi.object().keys({
    serviceType: Joi.string().required(),
    charge: Joi.number().required(),
  });

  try {
    await schema.validateAsync(request.body);
    return next();
  }
  catch (err) {
    return response
      .status(400)
      .json({ status: 'error', message: `${err.details[0].message}` });
  }
}

const walletToWalletTransferValidator = async (request: any, response: any, next: any) => {
  const schema = Joi.object().keys({
    // phone: Joi.string().min(10).max(11).required(),
    accountNumber: Joi.string().required(), 
    amount: Joi.number().greater(9).integer().positive().required(),
    narration: Joi.string(),
    saveBeneficiary: Joi.bool().required(),
  });

  try {
    await schema.validateAsync(request.body);
    return next();
  }
  catch (err) {
    return response
      .status(400)
      .json({ status: 'error', message: `${err.details[0].message}` });
  }
}

const walletAccountValidator = async (request: any, response: any, next: any) => {
  const schema = Joi.object().keys({
    accountNumber: Joi.string().required()
  });

  try {
    await schema.validateAsync(request.body);
    return next();
  }
  catch (err) {
    return response
      .status(400)
      .json({ status: 'error', message: `${err.details[0].message}` });
  }
}

const withdrawFromWalletValidator = async (request: any, response: any, next: any) => {
  const schema = Joi.object().keys({
    accountName: Joi.string().required(), 
    amount: Joi.number().greater(9).integer().positive().required(),
    bankName: Joi.string().required(),
    bankCode: Joi.string().required(),
    accountNumber: Joi.string().required(),
    saveBeneficiary: Joi.bool().required(),
    phone: Joi.string().min(10).max(11),
    narration: Joi.string(),
  });

  try {
    await schema.validateAsync(request.body);
    return next();
  }
  catch (err) {
    return response
      .status(400)
      .json({ status: 'error', message: `${err.details[0].message}` });
  }
}

const amountValidator = async (request: any, response: any, next: any) => {
  const schema = Joi.object().keys({
    amount: Joi.number().greater(9).integer().positive().required(),
  });

  try {
    await schema.validateAsync(request.body);
    return next();
  }
  catch (err) {
    return response
      .status(400)
      .json({ status: 'error', message: `${err.details[0].message}` });
  }
}

const refundWalletValidator = async (request: any, response: any, next: any) => {
  const schema = Joi.object().keys({
    narration: Joi.string(),
    transactionReference: Joi.string().required(), 
  });

  try {
    await schema.validateAsync(request.body);
    return next();
  }
  catch (err) {
    return response
      .status(400)
      .json({ status: 'error', message: `${err.details[0].message}` });
  }
}

const fundTransferValidator = async (request: any, response: any, next: any) => {
  const schema = Joi.object().keys({
    accountName: Joi.string().required(), 
    amount: Joi.number().greater(9).integer().positive().required(),
    bankName: Joi.string().required(), 
    bankCode: Joi.string().required(), 
    accountNumber: Joi.string().required(),
    paymentMadeWith: Joi.string().required(),
    saveBeneficiary: Joi.bool().required(),
    narration: Joi.string(),
    phone: Joi.string().min(10).max(11),
  });

  try {
    await schema.validateAsync(request.body);
    return next();
  }
  catch (err) {
    return response
      .status(400)
      .json({ status: 'error', message: `${err.details[0].message}` });
  }
}

const updateUserBankValidator = async (request: any, response: any, next: any) => {
  const schema = Joi.object().keys({
    bankCode: Joi.string().min(2).required(),
    bankAccountNumber: Joi.string().min(5).max(30).required(),
    userId: Joi.string().required(),
  });

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

const userIdValidator = async (request: any, response: any, next: any) => {
  const schema = Joi.object().keys({
    userId: Joi.string().required(),
  });

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

const walletLimitValidator = async (request: any, response: any, next: any) => {
  const schema = Joi.object().keys({
    userId: Joi.string().required(),
    amount: Joi.number().greater(9).integer().positive().required(),
  });

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

const userRoleValidator = async (request: any, response: any, next: any) => {
  const schema = Joi.object().keys({
    userId: Joi.string().required(),
    role: Joi.string().required(),
  });

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

const updateUserProfileValidator = async (request: any, response: any, next: any) => {
  const schema = Joi.object().keys({
    userId: Joi.string().required(),
    email: Joi.string().email().required(),
    lastName: Joi.string().min(2).max(30).required(),
    firstName: Joi.string().min(2).max(30).required(),
    username: Joi.string().min(2).max(30).required(),
    dateOfBirth: Joi.date().required(),
    gender: Joi.string().required(),
    address: Joi.string().min(2).max(100).required(),
    street: Joi.string().min(2).max(50).required(),
    lga: Joi.string().min(2).max(30).required(),
    state: Joi.string().min(2).max(30).required(),
    businessState: Joi.string(),
    businessAddress: Joi.string(),
    businessLga: Joi.string(),
    businessCity: Joi.string(),
  });

  try {
    await schema.validateAsync(request.body);
    request.body.firstName.toUpperCase();
    request.body.lastName.toUpperCase();
    
    return next();
  }
  catch (err) {
    return response
      .status(400)
      .json({ status: 'error', message: `${err.details[0].message}` });
  }
};

const createIssuesValidator = async (request: any, response: any, next: any) => {
  const schema = Joi.object().keys({
    message: Joi.string().max(500).min(20).required(),
    category: Joi.string(),
    key: Joi.string(),
    issueCategory: Joi.string().required(),
  });

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

const createAppUpdateValidator = async (request: any, response: any, next: any) => {
  const schema = Joi.object().keys({
    appType: Joi.string().required(),
    releaseDate: Joi.string().required(),
    versionId: Joi.string().required(),
    versionNumber: Joi.string().required(),
    platformType: Joi.string().required(),
    redirectUrl: Joi.string().required(),
  });

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

const updateAppUpdateValidator = async (request: any, response: any, next: any) => {
  const schema = Joi.object().keys({
    appType: Joi.string().required(),
    releaseDate: Joi.string().required(),
    versionId: Joi.string().required(),
    versionNumber: Joi.string().required(),
    platformType: Joi.string().required(),
    appUpdateId: Joi.string().required(),
    redirectUrl: Joi.string().required(),
  });

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

const createDirectMessageValidator = async (request: any, response: any, next: any) => {
  const schema = Joi.object().keys({
    platformType: Joi.string().required(),
    messageType: Joi.string().required(),
    // messageCategory: Joi.string().required(),
    messageBelongsTo: Joi.string().required(),
    actionLink: Joi.string(),
    includeImageUrl: Joi.string(),
    messageTitle: Joi.string().required(),
    messageBody: Joi.string().required(),
  });

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

const createBroadcastMessageValidator = async (request: any, response: any, next: any) => {
  const schema = Joi.object().keys({
    platformType: Joi.string().required(),
    messageType: Joi.string().required(),
    // messageCategory: Joi.string().required(),
    actionLink: Joi.string(),
    includeImageUrl: Joi.string(),
    messageTitle: Joi.string().required(),
    messageBody: Joi.string().required(),
  });

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

const updateMessageValidator = async (request: any, response: any, next: any) => {
  const schema = Joi.object().keys({
    actionLink: Joi.string(),
    includeImageUrl: Joi.string(),
    messageTitle: Joi.string(),
    messageBody: Joi.string(),
    platformType: Joi.string(),
    messageType: Joi.string(),
    messageCategory: Joi.string(),
    messageBelongsTo: Joi.string(),
    messageId: Joi.string().required(),
  });

  try {
    await schema.validateAsync(request.body);
    return next();
  }
  catch (err) {
    return response
      .status(400)
      .json({ status: 'error', message: `${err.details[0].message}` });
  }
}

const deleteMessageValidator = async (request: any, response: any, next: any) => {
  const schema = Joi.object().keys({
    messageId: Joi.string().required(),
  });

  try {
    await schema.validateAsync(request.body);
    return next();
  }
  catch (err) {
    return response
      .status(400)
      .json({ status: 'error', message: `${err.details[0].message}` });
  }
}

const messageApproveForViewingValidator = async (request: any, response: any, next: any) => {
  const schema = Joi.object().keys({
    messageId: Joi.string().required(),
  });

  try {
    await schema.validateAsync(request.body);
    return next();
  }
  catch (err) {
    return response
      .status(400)
      .json({ status: 'error', message: `${err.details[0].message}` });
  }
}

const readReceiptWebhookMessageValidator = async (request: any, response: any, next: any) => {
  const schema = Joi.object().keys({
    messageReadOnWhichDevice: Joi.string().required(),
    messageId: Joi.string().required(),
  });

  try {
    await schema.validateAsync(request.body);
    return next();
  }
  catch (err) {
    return response
      .status(400)
      .json({ status: 'error', message: `${err.details[0].message}` });
  }
}

const agentRequestIdValidator = async (request: any, response: any, next: any) => {
  const schema = Joi.object().keys({
    agentRequestId: Joi.string().required(),
  });

  try {
    await schema.validateAsync(request.body);
    return next();
  }
  catch (err) {
    return response
      .status(400)
      .json({ status: 'error', message: `${err.details[0].message}` });
  }
}

const createTerminalValidator = async (request, response, next) => {
  const schema = Joi.object().keys({
    state: Joi.string().required(),
    lga: Joi.string().required(),
    address: Joi.string().required(),
    serialNumber: Joi.string().required(),
    terminalId: Joi.string().required(),
    partner: Joi.string().required(),
    agentPhone:Joi
      .string()
      .pattern(new RegExp('^[0-9]'))
      .min(10)
      .max(11),
    aggregatorPhone: Joi
      .string()
      .pattern(new RegExp('^[0-9]'))
      .min(10)
      .max(11),
  });

  try {
    await schema.validateAsync(request.body);
    return next();
  }
  catch (err) {
    return response
      .status(400)
      .json({ status: 'error', message: `${err.details[0].message}` });
  }
}

const updateTerminalValidator = async (request, response, next) => {
  const schema = Joi.object().keys({
    state: Joi.string(),
    lga: Joi.string(),
    address: Joi.string(),
    serialNumber: Joi.string(),
    terminalId: Joi.string().required(),
    partner: Joi.string(),
    transactionLimit: Joi.number(),
  });

  try {
    await schema.validateAsync(request.body);
    return next();
  }
  catch (err) {
    return response
      .status(400)
      .json({ status: 'error', message: `${err.details[0].message}` });
  }
}

const terminalIdValidator = async (request, response, next) => {
  const schema = Joi.object().keys({
    terminalId: Joi.string().required(),
  });

  try {
    await schema.validateAsync(request.body);
    return next();
  }
  catch (err) {
    return response
      .status(400)
      .json({ status: 'error', message: `${err.details[0].message}` });
  }
}

const serviceTypeQueryValidator = async (request, response, next) => {
  const schema = Joi.object().keys({
    serviceType: Joi.string().required(),
  });

  try {
    await schema.validateAsync(request.query); // @desc - request.query
    return next();
  }
  catch (err) {
    return response
      .status(400)
      .json({ status: 'error', message: `${err.details[0].message}` });
  }
}

const attendToIssueValidator = async (request, response, next) => {
  const schema = Joi.object().keys({
    issueId: Joi.string().required(),
  });

  try {
    await schema.validateAsync(request.body);
    return next();
  }
  catch (err) {
    return response
      .status(400)
      .json({ status: 'error', message: `${err.details[0].message}` });
  }
}

const aggregatorAssignTerminalToAgentValidator = async (request, response, next) => {
  const schema = Joi.object().keys({
    accountNumber: Joi.string().required(),
    terminalId: Joi.string().required(),
    address: Joi.string().required(),
    state: Joi.string(),
    lga: Joi.string(),
  });

  try {
    await schema.validateAsync(request.body);
    return next();
  }
  catch (err) {
    return response
      .status(400)
      .json({ status: 'error', message: `${err.details[0].message}` });
  }
}

const aggregatorRemoveAgentFromTerminalValidator = async (request, response, next) => {
  const schema = Joi.object().keys({
    accountNumber: Joi.string().required(),
    terminalId: Joi.string().required(),    
  });

  try {
    await schema.validateAsync(request.body);
    return next();
  }
  catch (err) {
    return response
      .status(400)
      .json({ status: 'error', message: `${err.details[0].message}` });
  }
}

const assignTerminalToAgentValidator = async (request, response, next) => {
  const schema = Joi.object().keys({
    phone: Joi
      .string()
      .pattern(new RegExp('^[0-9]'))
      .min(10)
      .max(11)
      .required(),
    terminalId: Joi.string().required(),
    address: Joi.string().required(),
    state: Joi.string(),
    lga: Joi.string(),
  });

  try {
    await schema.validateAsync(request.body);
    return next();
  }
  catch (err) {
    return response
      .status(400)
      .json({ status: 'error', message: `${err.details[0].message}` });
  }
}

const removeAgentFromTerminalValidator = async (request, response, next) => {
  const schema = Joi.object().keys({
    phone: Joi
      .string()
      .pattern(new RegExp('^[0-9]'))
      .min(10)
      .max(11)
      .required(),
    terminalId: Joi.string().required(),
  });

  try {
    await schema.validateAsync(request.body);
    return next();
  }
  catch (err) {
    return response
      .status(400)
      .json({ status: 'error', message: `${err.details[0].message}` });
  }
}

const adminAssignTerminalToAggregatorValidator = async (request, response, next) => {
  const schema = Joi.object().keys({
    phone: Joi
      .string()
      .pattern(new RegExp('^[0-9]'))
      .min(10)
      .max(11)
      .required(),
    terminalId: Joi.string().required(),
  });

  try {
    await schema.validateAsync(request.body);
    return next();
  }
  catch (err) {
    return response
      .status(400)
      .json({ status: 'error', message: `${err.details[0].message}` });
  }
}

const adminRemoveAggregatorFromTerminalValidator = async (request, response, next) => {
  const schema = Joi.object().keys({
    phone: Joi
      .string()
      .pattern(new RegExp('^[0-9]'))
      .min(10)
      .max(11)
      .required(),
    terminalId: Joi.string().required(),
  });

  try {
    await schema.validateAsync(request.body);
    return next();
  }
  catch (err) {
    return response
      .status(400)
      .json({ status: 'error', message: `${err.details[0].message}` });
  }
}

const itexPosNotificationValidator = async (request, response, next) => {
  const schema = Joi.object().keys({
    MTI: Joi.string().required(),
    // amount: Joi.number().min(1).required(),
    amount: Joi.number().greater(0).integer().positive().required(), // TODO - GET POS AMOUNT
    terminalId: Joi.string().required(),
    responseCode: Joi.string().required(),
    responseDescription: Joi.string().required(),
    PAN: Joi.string().required(),
    RRN: Joi.string().required(),
    STAN: Joi.string().required(),
    authCode: Joi.string(),
    transactionTime: Joi.string().required(), // Joi.date().required(),
    reversal: Joi.bool().required(),
    merchantId: Joi.string().required(),
    merchantName: Joi.string().required(),
    merchantAddress: Joi.string().required(),
    rrn: Joi.string().required(),
  });

  try {
    await schema.validateAsync(request.body);
    return next();
  }
  catch (err) {
    return response
      .status(400)
      .json({ status: 'error', message: `${err.details[0].message}` });
  }
}

const rubiesPosNotificationValidator = async (request, response, next) => {
  const schema = Joi.object().keys({
    TransactionReference: Joi.string().required(),
    CreditAccount: Joi.string().required(),
    PaymentDate: Joi.string().required(),
    Reference: Joi.string().required(),
    Fee: Joi.string().required(),
    Amount: Joi.string().required(),
    STAN: Joi.string().required(),
    StatusCode: Joi.string().required(),
    TransactionID: Joi.string().required(),
    Type: Joi.string().required(),
    StatusDescription: Joi.string().required(),
    Currency: Joi.string().required(),
    RetrievalReferenceNumber: Joi.string().required(),
    TerminalID: Joi.string().required(),
    CustomerName: Joi.string().required(),
  });

  try {
    await schema.validateAsync(request.body);
    return next();
  }
  catch (err) {
    return response
      .status(400)
      .json({ status: 'error', message: `${err.details[0].message}` });
  }
}

export {
  LoginValidator,
  ConfirmPinValidator,
  ValidatePhone,
  newProfileValidator,
  resetPasswordValidator,
  changePassValidator,
  changeTransactionSecretValidator,
  verifyBankValidator,
  verifyBvnValidator,
  bvnCodeValidator,
  phoneTokenValidator,
  updateProfileValidator,
  agentOnboardingValidator,
  meterVerifyValidator,
  electricityServiceValidator,
  cabletvVerifyValidator,
  cabletvServiceValidator,
  airtimeServiceValidator,
  mobileDataServiceValidator,
  mobileDataVerifyServiceValidator,
  uploadGetPresignedUrlValidator,
  uploadUpdateValidator,
  createSwitchValidator,
  switchServiceValidator,
  serviceVariationValidator,
  updateServiceChargeValidator,
  walletToWalletTransferValidator,
  walletAccountValidator,
  withdrawFromWalletValidator,
  amountValidator,
  refundWalletValidator,
  fundTransferValidator,

  updateUserBankValidator,
  userIdValidator,
  walletLimitValidator,
  userRoleValidator,
  updateUserProfileValidator,
  createIssuesValidator,
  createAppUpdateValidator,
  updateAppUpdateValidator,

  createDirectMessageValidator,
  createBroadcastMessageValidator,
  updateMessageValidator,
  deleteMessageValidator,
  readReceiptWebhookMessageValidator,
  messageApproveForViewingValidator,

  agentRequestIdValidator,
  createTerminalValidator,
  updateTerminalValidator,
  terminalIdValidator,

  serviceTypeQueryValidator,
  attendToIssueValidator,

  aggregatorAssignTerminalToAgentValidator,
  aggregatorRemoveAgentFromTerminalValidator,
  assignTerminalToAgentValidator,
  removeAgentFromTerminalValidator,

  adminAssignTerminalToAggregatorValidator,
  adminRemoveAggregatorFromTerminalValidator,

  itexPosNotificationValidator,
  rubiesPosNotificationValidator,
};
