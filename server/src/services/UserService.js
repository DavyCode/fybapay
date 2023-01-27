// @flow

import Userauth from '../utils/Userauth';
import UserRepository from '../repository/UserRepository';
import WalletRepository from '../repository/WalletRepository';
import ReferralRepository from '../repository/ReferralRepository';
import { BadRequestError, InternalServerError, APIError, PaymentRequiredError, NotFoundError, ForbiddenError, NotAcceptableError } from '../utils/errors';
import Pubsub from '../events/userEventListeners';
import { generateAgentId } from '../utils/agentCounter';
import { walletDailyLimit, kycLevel } from '../enumType';
import { buildResponse, genUniqueId, getRandomInteger, genTimeStamp, genRefcode, generateTrxReference, getYearMonthDayFormatToString } from '../utils';
import CommissionRepository from '../repository/CommissionRepository';
import enumType from '../enumType';
import WalletServices from '../services/WalletServices';
import API_PAYSTACK from '../services/api/paystackServices';
import API_MONIFY from '../services/api/vendorServices/MONIFY/monifyApiServices';
import API_RUBIES from '../services/api/vendorServices/RUBIES/rubiesServices';
import BankHelper from '../helpers/BankHelper';
import accountReference from '../utils/accountReference';
import { paymentError, walletError } from '../constant/errorMessages';
import CacheDataRepository from '../repository/cacheDataRepository';
import PaymentSecretServices from './PaymentSecretServices';
import ServiceSwitchRepository from '../repository/ServiceSwitchRepository';
import OtpServices from './OtpServices';
import { formatNumber } from '../utils/formatPhone';
import AppConstant from '../constant';


import {
  JWT_EXPIRATION_MINUTES,
  JWT_BEARER,
  HOST_NAME,
  MONNIFY_CONTRACT_CODE,
} from '../config/env';


/**
 * Helper function to reserve new monnify account number for users
 * @param email
 * @param firstName
 * @param lastName
 * @private
 */
const generateReservedUserAccount = async ({ email, firstName, lastName }) => {
  try {
    // const { email, firstName, lastName } = params;
    const accessToken = await API_MONIFY.getMonifyAccessToken();
  
    if (!accessToken || !accessToken.requestSuccessful) {
      return null;
    }
    let ref = await accountReference();
  
    const accountObject = {
      accountReference: ref,
      accountName: `${firstName} ${lastName}`, // Remove FybaPay
      currencyCode: 'NGN',
      contractCode: MONNIFY_CONTRACT_CODE,
      customerEmail: email ? email : 'fybapay@gmail.com', //  "responseMessage": "Field customerEmail must not be blank",
      customerName: `${firstName} ${lastName}`,
      // incomeSplitConfig: [ // todo: for split payment to sub accounts
      //   {
      //     subAccountCode: MONNIFY_ACCOUNT_CODE,
      //     feePercentage: MONNIFY_FEE_PERCENTAGE,
      //     splitPercentage: MONNIFY_SPLIT_PERCENTAGE,
      //     feeBearer: MONNIFY_FEE_BEARER
      //   }
      // ]
    };
  
    const reservedAct = await API_MONIFY.createReservedAccount(
      accountObject,
      accessToken.responseBody.accessToken
    );
  
    if (!reservedAct && !reservedAct.requestSuccessful) {
      return null;
    }
    return reservedAct;  
  } catch (error) {
    return false;
  }
};


export default {
  
  /**
  * Insert User
  * @private
  * @todo - review, move to repository
  */
  // async userInsert(query: {}, update: {}, option: { new: boolean, upsert: boolean}) {
  //   const user = await UserRepository.userInsert(query, update, option);
  //   if (option.new && !user) { throw new InternalServerError('Something went wrong updating user record') };
  //   return user;
  // },

  /**
   * authOtpVerify
   * @private
   */
  async authOtpVerify(request) {
    const { phone } = request.body;
    const user = await UserRepository.findOne({ phone });
    if (user) { throw new ForbiddenError('User exist please login instead') };

    const otpUser = await UserRepository.getAuthOtpVerifyUser({ phone });
    if (otpUser && !otpUser.verified && otpUser.verifyPhoneOtpTimer && new Date(otpUser.verifyPhoneOtpTimer) > new Date()) {
      throw new NotAcceptableError('Wait after 5 mins to request new verification OTP');
    }

    // if (otpUser && otpUser.verified) {
    //   throw new NotAcceptableError('Phone already verified skip to create an account or call help center');
    // }

    let currentUser;
    if (!otpUser) {
      currentUser = await UserRepository.createUserForOtpVerify({
        phone,
        verifyPhoneOtp: getRandomInteger().toString().substring(2, 6),
        verifyPhoneOtpTimer: genTimeStamp(60, 5),
      })
    }
    else {
      if (otpUser.otpRequestCount >= 5) { throw new ForbiddenError('Maximum OTP request limit, contact support to proceed'); }

      currentUser = await UserRepository.otpUserInsert({ phone }, {
        verifyPhoneOtp: getRandomInteger().toString().substring(2, 6),
        verifyPhoneOtpTimer: genTimeStamp(60, 5),
        otpRequestCount: otpUser.otpRequestCount + 1,
        'meta.updatedAt': Date.now(),
      }, { new: true, upsert: false })
    }

    // const switchService = await ServiceSwitchRepository.findByServiceType(enumType.serviceType.OTP);
    // if (switchService && switchService.shouldUseService === true) { 
    //   // throw new NotFoundError('Invalid service name or type, service not available') 
    //   await OtpServices.sendTermiiOtpToken({ use: 'authOtpVerify', message: `Fyba verification OTP: <1234>` });
    //   return buildResponse({ message: 'OTP Verification sent' });
    // }
    // else {// }
    const message = { phone, message: `Your Fyba confirmation OTP is ${currentUser.verifyPhoneOtp}. Valid for 10 minutes, one-time use only.` };
    Pubsub.emit('user_signup', message);
    return buildResponse({ message: 'OTP Verification sent' });
  },

  /**
   * confirmAuthOtpVerify
   * @private
   */
  async confirmAuthOtpVerify(request) {
    const otpUser = await UserRepository.otpUserInsert({ verifyPhoneOtp: request.body.verifyPhoneOtp }, {
      verified: true,
      verifyPhoneOtp: null,
      'meta.updatedAt': Date.now()
    }, { new: true, upsert: false })

    if (!otpUser) { throw new NotFoundError('Wrong verification OTP') }
    return buildResponse({ message: 'Phone number verified' });
  },

  /**
   * Create New User Account
   * @private
   */
  async createNewUserAccount(request) {
    const { 
      phone, 
      confirmPassword, 
      password, 
      firstName, 
      lastName, 
      email, 
      referredBy,
      howDidYouHearAboutUs,
      transactionSecret,
      confirmTransactionSecret, 
    } = request.body;
    const user = await UserRepository.findOne({ phone });
    if (user) { throw new ForbiddenError('User exist please login instead') };
    const otpVerifiedUser = await UserRepository.getAuthOtpVerifyUser({ phone });
    if (!otpVerifiedUser || !otpVerifiedUser.verified) { throw new ForbiddenError('Phone number needs verification') }
    if (confirmPassword !== password) { throw new BadRequestError('Both OTP don\'t match') };
    
    if (transactionSecret !== confirmTransactionSecret) { throw new BadRequestError('Transaction pin dont match'); }
    
    const reservedAct = await generateReservedUserAccount(request.body);
    if (!reservedAct) { throw new InternalServerError('Could not create user profile, please try again'); };
    const { accountReference, accountName, accountNumber, bankName, bankCode, reservationReference } = reservedAct.responseBody;
    
    const refcode = genRefcode(phone);

    const currentUser = await UserRepository.userCreate({
      phone,
      howDidYouHearAboutUs,
      referral_code: refcode,
      password: password,
      firstName: firstName.toUpperCase(),
      lastName: lastName.toUpperCase(),
      email: email,
      userId: `FB${genUniqueId()}`,
      Kyc: kycLevel.KYC_ONE,  
    });
    
    /**
     * create payment secret
     */
    await PaymentSecretServices.createUserPaymentSecret(currentUser, transactionSecret);

    /**
     * Create wallet
     */
    const createdWallet = await WalletRepository.walletCreate({
      user: currentUser._id, // todo create user first
      userId: currentUser.userId, // todo create user first
      accountNumber: accountNumber,
      accountName: accountName,
      monifyAccountReference: accountReference,
      monifyReservetionReference: reservationReference,
      bankName: bankName,
      bankCode: bankCode,
      limit: walletDailyLimit.KYC_ONE,
    });

    const commissionWallet = await CommissionRepository.createCommission({
      user: currentUser._id,
      wallet: createdWallet._id,
      userId: currentUser.userId,
    });

    createdWallet.commissionWallet = commissionWallet._id;
    await WalletRepository.saveWallet(createdWallet);
    
    currentUser.wallet = createdWallet._id;
    currentUser.commissionWallet = commissionWallet._id;
    const updatedUser = await UserRepository.userSave(currentUser); // move to pubsub
    
    Pubsub.emit('signup-activities', {
      referralCreate: {
        phone,
        referral_code: refcode,
        referred_by: referredBy ? referredBy : null, 
        user: currentUser,
        userId: currentUser.userId,
      },
      user: updatedUser,
      referredBy: referredBy ? referredBy : false,
    })

    Pubsub.emit('user_signup_welcome', updatedUser, createdWallet);

    const token = await Userauth.generateToken(updatedUser);
    return buildResponse({ 
      data: updatedUser, 
      message: 'User profile created', 
      access_token: token, 
      token_type: JWT_BEARER, 
      expiresIn: JWT_EXPIRATION_MINUTES 
    });
  },

  /**
  * Login user
  * @private
  */
  async authenticateUser(params: { phone: string, password: string }) {
    const { phone, password } = params
    const user = await UserRepository.findOne({ phone });
    if (!user) { throw new NotFoundError('User not found') };
    const isUserProfile = user.passwordHash ? user.passwordHash : undefined;
    if (!isUserProfile) { throw new ForbiddenError('User profile not found') };
    if (user.lock) { throw new ForbiddenError('User access denied, contact support'); }
    const isMatch = user.comparePassword(password);
    if (!isMatch) { throw new BadRequestError('Login failed, wrong pin or phone number')};
    const token = await Userauth.generateToken(user);
    return buildResponse({ data: user, access_token: token, token_type: JWT_BEARER, expiresIn: JWT_EXPIRATION_MINUTES });
  },

  /**
   * confirm user pin
   * @private
   */
  // async confirmUserPin(request) {
  //   const user = await UserRepository.getUserById(request.user.id);
  //   if (!user) { throw new NotFoundError('User not found') };
  //   if (user.lock) { throw new ForbiddenError('User account locked, contact support'); }
  //   const isUserProfile = user.passwordHash ? user.passwordHash : undefined;
  //   if (!isUserProfile) { throw new ForbiddenError('User profile not found') };
  //   const isMatch = user.comparePassword(request.body.confirmPin);
  //   if (!isMatch) { throw new BadRequestError('Wrong pin')};

  //   return buildResponse({ message: 'Valid pin' })
  // },

  /**
  * Update user profile
  * @private
  */ 
  async updateUserData(request) {
    const {
      userId,
      email,
      lastName,
      firstName,
      username,
      dateOfBirth,
      gender,
      address,
      street,
      lga,
      state,
      businessState,
      businessAddress,
      businessLga,
      businessCity } = request.body;

    const user = await UserRepository.getUserById(request.user.id);
    if (!user) { throw new NotFoundError('User not found') };
    
    user.email = email;
    user.username = username;
    user.gender = gender;
    user.address = address;
    user.street = street;
    user.lga = lga;
    user.state = state;
    user.businessState = businessState;
    user.businessAddress = businessAddress;
    user.businessLga = businessLga;
    user.businessCity = businessCity;
    // if user is BVN verified, don't change their name again
    if (!user.isBVN_verified) {
      user.dateOfBirth = dateOfBirth;
      user.lastName = lastName.toUpperCase();
      user.firstName = firstName.toUpperCase();
    }
    user.meta.updatedAt = Date.now();

    await UserRepository.userSave(user);

    return buildResponse({ data: user, message: 'Successfully updated user data' });
  },

  /**
  * Update user profile
  * @private
  */ 
  async fetchUser(id: string) {
    const user = await UserRepository.getUserById(id);
    if (!user) { throw new NotFoundError('User not found') };
    return buildResponse({ data: user });
  },

  /**
   * Get Reset user password pin
   * @private
   */
  async getResetPasswordPin(phone: string) {
    const user = await UserRepository.findOne({ phone });
    if (!user) { throw new NotFoundError('User not found')}
    if (user.lock) { throw new ForbiddenError('User account locked, contact support'); }
    if (user.resetPasswordTimer && new Date(user.resetPasswordTimer) > new Date()) {
      throw new NotAcceptableError('Wait for 5 mins to request new reset OTP')
    }
    const updatedUser = await UserRepository.userInsert({_id: user._id}, {
      resetPasswordPin: getRandomInteger().toString().substring(2, 6),
      resetPasswordTimer: genTimeStamp(60, 5),
      'meta.updatedAt': Date.now(),
    }, { new: true, upsert: true })
    
    const message = { phone, message: `Your Fyba confirmation OTP: ${updatedUser.resetPasswordPin}. Valid for 10 minutes, one-time use only.` };

    Pubsub.emit('user_password_reset_pin', message);
    
    return buildResponse({  message: 'Reset pin sent' });
  },

  /**
   * Reset user password 
   * @private
   */
  async resetPassword(request) {
    const { password, resetPasswordPin } = request.body;
    const user = await UserRepository.findOne({ resetPasswordPin })
    if (!user) { throw new NotFoundError('Wrong reset otp supplied') };
    
    user.password = password;
    user.resetPasswordPin = "";
    user.resetPasswordTimer = new Date('2000-01-01');
    user.meta.updatedAt = Date.now();
    await UserRepository.userSave(user);
    
    Pubsub.emit('password_reset_successful', user);

    return buildResponse({ data: user, message: 'Password changed successfully' });
  },

  /**
   * changeUserPassword
   * @param {*} request 
   */
  async changeUserPassword(request) {
    const { oldPassword, newPassword, confirmPassword } = request.body;
    const user = await UserRepository.getUserById(request.user.id);
    if (!user) { throw new NotFoundError('User not found') };
    if (user.lock) { throw new ForbiddenError('User account locked, contact support'); };
    const isMatch = user.comparePassword(oldPassword);
    if (!isMatch) { throw new BadRequestError('Wrong pin')};
    if (confirmPassword !== newPassword) { throw new BadRequestError('Confirmation pin don\'t match') };

    user.password = newPassword;
    user.meta.updatedAt = Date.now();
    await UserRepository.userSave(user);
    
    return buildResponse({ data: user, message: 'Password changed successfully' });
  },

  /**
   * Update Bank Data
   * @private
   */
  async updateBankData(request) {
    const { bankAccountNumber, bankCode } = request.body;
    const bankName = await BankHelper.getBankName(bankCode); // TODO - REVIEW FOR OTHER BANK LIST VARIATIONS
    if (!bankName) { throw new NotFoundError('Selected bank does not exist') };
    
    const bankDetails = await API_PAYSTACK.verifyBankDetails(bankAccountNumber, bankCode);
    if (bankDetails.error && bankDetails.statusCode === 422) {
      throw new BadRequestError(bankDetails.error);
    }
    if (bankDetails.error) {
      throw new InternalServerError('Could not verify bank account at this time');
    }
    const { account_name, account_number } = bankDetails;
    const user = await UserRepository.userInsert({_id: request.user.id}, {
      $set: { // todo : move db code to repository
        bank: {
          bankName,
          bankCode,
          bankAccountNumber: account_number,
          bankAccountName: account_name,
        },
      },
      'meta.updatedAt': Date.now()
    }, { upsert: false, new: true });

    return buildResponse({ message: 'Bank update successful', data: user });
  },

  /**
   * Update user BVN
   * @private
   * @todo - fix charges
   */
  async updateUserBvn(request) {
    const user = await UserRepository.getUserByIdWithWallet(request.user.id);
    if (!user) { throw new NotFoundError('User not found') };
    if (!user.bank) { throw new ForbiddenError('Update bank details to proceed') }
    if (user.isBVN_verified && user.bank.bvn) { throw new ForbiddenError('User account already verified') }

    /**
     * check if bvn already exist and is used
     */
    let cachedBvn = await CacheDataRepository.findOneCacheBvn({ bvn: request.body.bvn });
    
    if (cachedBvn) {
      if (cachedBvn.bvn && cachedBvn.verified) {
        throw new BadRequestError('Bvn already in use');
      }
  
      if (cachedBvn.user.toString() !== user._id.toString()) {
        throw new BadRequestError('Bvn already in use');
      }
    }
    
    /**
     * use cached bvn data
     * @todo- may not need this
     */
    if (!cachedBvn) {
      cachedBvn = await CacheDataRepository.getCachedBvnResponse(user._id);
    }
    
    if (cachedBvn) {
      if (!cachedBvn.mobile) {
        if (cachedBvn.formatted_dob) {
          return buildResponse({ bvnVerifyMethod: 'dob', message: 'Verify bvn with DOB in format: YYYY-MM-DD' });
        }
        throw new InternalServerError('Something went wrong with bvn verify method, contact support');
      }

      if (cachedBvn.bvnRequestCount >= 5) {
        throw new ForbiddenError('Please contact support for help, cannot proceed after 5 OTP request')
      }
      if (cachedBvn.bvnRequestTimer && new Date(cachedBvn.bvnRequestTimer) > new Date()) {
        throw new ForbiddenError('Wait for 5 mins to request new bvn verification OTP');
      }

      let updatedUser = await UserRepository.userInsert({_id: user._id}, {
        BVN_verificationCode: getRandomInteger().toString().substring(2, 6),
        'meta.updatedAt': Date.now(),
      }, { new: true, upsert: false });

      cachedBvn.bvnRequestCount += 1;
      cachedBvn.bvnRequestTimer = genTimeStamp(60, 5);
      await CacheDataRepository.saveCacheData(cachedBvn);

      let phone = formatNumber(cachedBvn.mobile);
      let message = {
        phone,
        message: `Your Fyba confirmation OTP: ${updatedUser.BVN_verificationCode}. Valid for 10 minutes, one-time use only.`
      };

      Pubsub.emit('send_bvn_verify_code', message);

      let bvnNum = `${phone.substring(0, 7)}***${phone.substring(11, 14)}`;
      
      return buildResponse({ bvnVerifyMethod: 'phone', message: `BVN confirmation OTP sent to ${bvnNum}` });
    }

    // first time bvn verification
    /**
     * TODO - an agent should not be paying for bvn
     * How will you know an agent when they haven't registered ??
     */
    if (!user.wallet) { throw new NotFoundError(walletError.walletNotFound) };
    if (user.wallet.balance < AppConstant.BVN_CHARGE) { throw new PaymentRequiredError(`Insufficient balance. ₦${AppConstant.BVN_CHARGE} charge apply. Please fund your account to proceed`) };
    
    const serviceType = enumType.serviceType.BVN;
    const switchService = await ServiceSwitchRepository.findByServiceType(serviceType);
    if (!switchService) { throw new NotFoundError('Invalid service name or type, service not available') };
   
    /**
     *  use BVN SWITCH HERE
     */
    let resolvedBvn;
    if (switchService.platform == enumType.platform.PAYSTACK) {
      const resolvedResult = await API_PAYSTACK.resolveBvn(request.body.bvn);

      if (resolvedResult.error && resolvedResult.statusCode === 400) {
        throw new BadRequestError(resolvedResult.error);
      }
      if (resolvedResult.error) {
        throw new InternalServerError(resolvedResult.error);
      }

      let { first_name, last_name, dob, formatted_dob, mobile, bvn } = resolvedResult;
      resolvedBvn = {
        first_name,
        last_name,
        dob,
        formatted_dob: getYearMonthDayFormatToString(formatted_dob),
        mobile,
        bvn
      }
    }
    else if (switchService.platform == enumType.platform.RUBIES) {
      const reference = getRandomInteger().toString().substring(1, 11);
      // const reference = await generateTrxReference();

      const resolvedResult = await API_RUBIES.resolveBvn(request.body.bvn, reference);
      
      // check if error first
      if (resolvedResult.error) {
        if (resolvedResult.error && resolvedResult.statusCode === 400) {
          throw new BadRequestError(resolvedResult.error);
        }
        else {
          throw new InternalServerError(resolvedResult.error);
        }
      }

      if (resolvedResult.responsecode === "00") {
        let { firstName, lastName, gender, dateOfBirth, middleName, bvn, } = resolvedResult.data;
        resolvedBvn = {
          first_name: firstName,
          last_name: lastName,
          dob: dateOfBirth,
          formatted_dob: getYearMonthDayFormatToString(dateOfBirth),
          mobile: resolvedResult.phoneNumber,
          bvn,
          gender,
          middle_name: middleName
        }
      }
      else {
        let msg = resolvedResult.responsemessage ? resolvedResult.responsemessage : 'Something went wrong. Contact support';
        throw new InternalServerError(msg);
      }
      
    }
    else {
      throw new InternalServerError('No switch service at the moment. Contact Support')
    }

    /**
     * cache bvn resolve data
     */
    await CacheDataRepository.cacheBvn(Object.assign({}, resolvedBvn, {
      bvnRequestTimer: genTimeStamp(60, 5)
    }), user);

    /**
     * deduct from wallet bvn charge
     */
    const walletBalance = user.wallet.balance - AppConstant.BVN_CHARGE;
    await WalletRepository.insertWallet({ _id: user.wallet._id }, {
      balance: walletBalance,
      'meta.updatedAt': Date.now(),
    }, { new: true, upsert: false });
    
    // Treat bvn charge as a transaction
    await WalletServices.bvnWalletCharge({ amount: AppConstant.BVN_CHARGE, user });
    
    /**
     * use phone or DOB to verify user
     */
    const { mobile, formatted_dob } = resolvedBvn;
    if (!mobile) {
      if (formatted_dob) {
        return buildResponse({ bvnVerifyMethod: 'dob', message: 'Verify bvn with DOB in format: YYYY-MM-DD' });
      }
      throw new InternalServerError('Something went wrong with bvn verification method, contact support');
    }
    
    const updatedUser = await UserRepository.userInsert({_id: user._id}, {
      BVN_verificationCode: getRandomInteger().toString().substring(2, 6),
      'meta.updatedAt': Date.now(),
    }, { new: true, upsert: false });
      
    let phone = formatNumber(mobile); 
    let message = {
      phone,
      message: `Your Fyba confirmation OTP: ${updatedUser.BVN_verificationCode}. Valid for 10 minutes, one-time use only.` 
    };
    Pubsub.emit('send_bvn_verify_code', message);

    // let bvnNum = `${mobile.substring(0, 3)}*****${mobile.substring(7, 11)}`;
    let bvnNum = `${phone.substring(0, 7)}***${phone.substring(11, 14)}`;
    
    return buildResponse({ bvnVerifyMethod: 'phone', message: `BVN confirmation OTP sent to ${bvnNum}` });
  },

  /**
   * switchBVNPlatform
   * @private
   * @todo - NOT IN USE
   */
  // TODO - NOT IN USE
  async switchBVNPlatform(bvn: string) {
    const serviceType = enumType.serviceType.BVN;
    const switchService = await ServiceSwitchRepository.findByServiceType(serviceType);
    if (!switchService) { throw new NotFoundError('Invalid service name or type, service not available') };
    
     switch (switchService.platform) {
      case enumType.platform.PAYSTACK:
        return await API_PAYSTACK.resolveBvn(bvn);
      case enumType.platform.RUBIES:
        return await API_RUBIES.resolveBvn(bvn);
      default:
        throw new InternalServerError('Switch service not available, please contact support');
    }
  },

  /**
   * Confirm BVN code
   * @private
   */
  async confirmBvnVerify(request) {
    const { bvnVerifyCode, dob } = request.query;
    if (!bvnVerifyCode && !dob) {
      throw new BadRequestError('Verify params cannot be empty');
    }
    if (bvnVerifyCode && dob) {
      throw new BadRequestError('Verify params can either be bvnVerifyCode or dob');
    }
    
    /**
     * dont verify a verified user
     */
    const requestedUser = await UserRepository.getUserById(request.user.id);
    if (!requestedUser) { throw new NotFoundError('User not found'); }
    if (requestedUser.isBVN_verified && requestedUser.bank.bvn) {
      throw new ForbiddenError('User bvn already verified');
    }
    
    let user;
    if (bvnVerifyCode) {
      const cachedBvn = await CacheDataRepository.getCachedBvnResponse(request.user.id);
      if (!cachedBvn) { throw new ForbiddenError('Update user bvn to proceed') }
      
      /**
       * update user bvn
       */
      // user = await UserRepository.userInsert({ BVN_verificationCode: bvnVerifyCode }, {
      //   isBVN_verified: true,
      //   BVN_verificationCode: '',
      //   'bank.bvn': cachedBvn.bvn,
      //   'bank.bvnVerified': true,
      //   Kyc: kycLevel.KYC_TWO,
        
      //   dateOfBirth: cachedBvn.formatted_dob,
      //   'meta.updatedAt': Date.now(),
      // }, { new: true, upsert: false });

      user = await UserRepository.findOne({ BVN_verificationCode: bvnVerifyCode });
      
      if (!user) { throw new NotFoundError('Wrong verification code supplied, user not found') };
      
      user.isBVN_verified = true;
      user.BVN_verificationCode = '';
      user.bank.bvn = cachedBvn.bvn;
      user.bank.bvnVerified = true;
      user.Kyc = kycLevel.KYC_TWO;
      user.dateOfBirth = cachedBvn.formatted_dob;
      user.meta.updatedAt = Date.now();
      if (cachedBvn.first_name) {
        user.firstName = cachedBvn.first_name.toUpperCase();
      }
      if (cachedBvn.last_name) {
        user.lastName = cachedBvn.last_name.toUpperCase();
      }

      user = await UserRepository.userSave(user);
      /**
       * upgrade wallet limit
       */
      const wallet = await WalletRepository.insertWallet({_id: user.wallet._id}, {
        limit: walletDailyLimit.KYC_ONE,
        'meta.updatedAt': Date.now(),
      }, { new: true, upsert: false });

      // mark bvn as verified
      // check if user was referred
      // issue commission
      await CacheDataRepository.insertCachedBvn({ _id: cachedBvn._id }, {
        verified: true,
        'meta.updatedAt': Date.now(),
        // bvnRequestTimer: new Date('2000-01-01'), // Take date to old
      }, { new: true, upsert: false })

      /**
       * Issue referral commission
       */
      Pubsub.emit('issue_referral_commission', {user})
    }

    if (dob) {
      const cachedBvn = await CacheDataRepository.getCachedBvnResponse(request.user.id);
      if (!cachedBvn) { throw new ForbiddenError('Update user bvn to proceed') }

      /**
       * check if dob matches
       */
      if (dob !== cachedBvn.formatted_dob) { 
        throw new NotFoundError('Wrong Date Of Birth');
      }
      
      /**
       * update user bvn
       */
      // user = await UserRepository.userInsert({ _id: request.user.id }, {
      //   isBVN_verified: true,
      //   BVN_verificationCode: '',
      //   'meta.updatedAt': Date.now(),
      //   'bank.bvn': cachedBvn.bvn,
      //   'bank.bvnVerified': true,
      //   Kyc: kycLevel.KYC_TWO,
      //   dateOfBirth: cachedBvn.formatted_dob,
      // }, { new: true, upsert: false });
      

      user = await UserRepository.getUserById(request.user.id);

      if (!user) { throw new NotFoundError('Something went wrong, user not found') };
            
      user.isBVN_verified = true;
      user.BVN_verificationCode = '';
      user.bank.bvn = cachedBvn.bvn;
      user.bank.bvnVerified = true;
      user.Kyc = kycLevel.KYC_TWO;
      user.dateOfBirth = cachedBvn.formatted_dob;
      user.meta.updatedAt = Date.now();
      if (cachedBvn.first_name) {
        user.firstName = cachedBvn.first_name.toUpperCase();
      }
      if (cachedBvn.last_name) {
        user.lastName = cachedBvn.last_name.toUpperCase();
      }

      user = await UserRepository.userSave(user);

      /**
       * upgrade wallet limit
       */
      await WalletRepository.insertWallet({ _id: user.wallet._id }, {
        limit: walletDailyLimit.KYC_ONE,
        'meta.updatedAt': Date.now(),
      }, { new: true, upsert: true });

      // mark bvn as verified
      // check if user was referred
      // issue commission
      await CacheDataRepository.insertCachedBvn({ _id: cachedBvn._id }, {
        'meta.updatedAt': Date.now(),
        verified: true,
      }, { new: true, upsert: false })

      /**
       * Issue referral commission
       */
      Pubsub.emit('issue_referral_commission', { user })
    }

    return buildResponse({ data: user, message: 'Successfully verified bvn' });
  },

  /**
   * Register new agent
   * @private
   * @todo - halt user agent approval to admin alone
   * @todo - TODO remove
   */
  //  TODO remove SERVICE
  async registerNewAgent(request) {
    const id = request.user.id;
    const params = request.body
    const user = await UserRepository.getUserById(id);
    if(!user) { throw new NotFoundError('User not found') };
    if (user.agentApproved || user.role === 'agent' || user.role === 'superAgent') { throw new NotAcceptableError('Agent already on-boarded, upgrade Kyc to upgrade account') }
    
    if (!user.phone) { throw new NotFoundError('Something went wrong, user phone not found'); }
    const agentId = await generateAgentId(user.phone);
    
    // TODO -
    // create a new agent request to admin
    // move this to a logic where admin approves agent
    
    // const newAgent = await UserRepository.userInsert({ _id: id }, {
    //   ...params,
    //   agentId,
    //   Kyc: kycLevel.KYC_THREE,
    //   role: 'agent',
    //   agentApproved: true,
    //   agentOnboardingDate: Date.now(),
    //   'meta.updatedAt': Date.now()
    // }, { new: true, upsert: true });
    
    // await WalletRepository.insertWallet({ _id: user.wallet}, {
    //   limit: walletDailyLimit.KYC_THREE,
    //   'meta.updatedAt': Date.now()
    // }, {new: false, upsert: false });

    // Pubsub.emit('new_agent_joined', newAgent);
    // return buildResponse({ data: newAgent, message: 'Agent application successful' });
    // TODO -

    return buildResponse({ data: user, message: 'Agent application received' });
  },
  
  
  /*******************************************
   * USER MANAGEMENT - ADMIN OPERATIONS
   ***********************************/
  
  /**
    * getAllCacheBvn
    * @param {*} request 
    */
  async getAllCacheBvn(request) {
    const cache = await CacheDataRepository.getAllCachedBvn(request.query);
    if (!cache.data) { throw new NotFoundError('Cached Bvn data not found') };
    return buildResponse({ ...cache });
  },

  /**
  * Get All Users
  * @private
  */
  async getAllUsers(request) {
    const users = await UserRepository.getAllUsers(request.query);
    if (!users.data) { throw new NotFoundError('Users not found') };
    return buildResponse({ ...users });
  },

  /**
   * Admin update user bank data
   * @private
   */
  async adminUpdateUserBankData(request) {
    const { bankAccountNumber, bankCode, userId } = request.body;
    const bankName = await BankHelper.getBankName(bankCode);
    if (!bankName) { throw new NotFoundError('Selected bank does not exist') };
    
    const bankDetails = await API_PAYSTACK.verifyBankDetails(bankAccountNumber, bankCode);
    if (bankDetails.error && bankDetails.statusCode === 422) {
      throw new BadRequestError(bankDetails.error);
    }
    if (bankDetails.error) {
      throw new InternalServerError('Could not verify bank account at this time');
    }
    const { account_name, account_number } = bankDetails;
    const user = await UserRepository.userInsert({_id: userId }, {
      $set: { // todo : move db code to repository
        bank: {
          bankName,
          bankCode,
          bankAccountNumber: account_number,
          bankAccountName: account_name,
        },
      },
      'meta.updatedAt': Date.now()
    }, { upsert: false, new: true });

    return buildResponse({ message: 'Bank update successful', data: user });
  },

  /**
  * Admin Update user profile
  * @private
  */ 
  async updateUserProfileData(request) {
    if (request.user.id.toString() === request.body.userId.toString()) {
      throw new ForbiddenError('Same user update blocked. Update a different user instead');
    }

    const { userId } = request.body;
    delete request.body.userId;
    
    const user = await UserRepository.userInsert({ _id: userId }, {
      ...request.body,
      'meta.updatedAt': Date.now()
    }, { new: true, upsert: false });

    if (!user) { throw new NotFoundError('User not found') };
    
    return buildResponse({ data: user, message: 'Successfully updated user data' });
  },

  /**
   * getAuthOtpUsers
   * @param {*} request 
   */
  async getAuthOtpUsers(request) {
    const authOtpUsers = await UserRepository.getAuthOtpUsers(request.query);
    if (!authOtpUsers.data) { throw new NotFoundError('User record not found'); }

    return buildResponse({ ...authOtpUsers });
  },
  
  /**
   * updateUserAuthOtp
   * @param {*} request 
   */
  async updateUserAuthOtp(request) {},
};
