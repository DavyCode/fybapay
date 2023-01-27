// @flow

import Pubsub from '../events';
import ReferralServices from '../services/ReferralServices';
import ReferralRepository from '../repository/ReferralRepository';
import UserRepository from '../repository/UserRepository';
import MessageRepository from '../repository/MessageRepository';
import { InternalServerError } from '../utils/errors';
import Utility from '../utils';
import enumType from '../enumType';
import MailerServices from '../services/MailerServices';
import { appLogger } from '../setup/logging';

/**
 * Subscribe to registration
 */
Pubsub.on('user_signup', async (message) => {
  try {
    await MailerServices.sendSms(message);
  } catch (error) {
    appLogger.log('error', {
      stack: error.stack,
      message: `PUBSUB_USER_SIGNUP: ${error.message}`,
    });
  }
});

/**
 * Subscribe to user profile creation
 */
Pubsub.on('user_signup_welcome', async (user, wallet) => {
  try {
    /**
    * welcome message goes
    */
    // mail user
    if (user.email) {
      await MailerServices.sendMail({
        email: user.email,
        templateName: 'welcome-to-fyba', // enumType.emailTemplates.WELCOME, // 'welcome-to-fyba', 
        newAccountNumber: wallet.accountNumber,
        firstName: user.firstName,
        lastName: user.lastName,
        link: 'https://www.getfyba.com',
      });
    }

    // create welcome message
    const messageToken = Utility.genUniqueId();
    await MessageRepository.createMessage({
      messageToken,
      messageCategory: enumType.messageCategory.DIRECT,
      messageBelongsTo: user._id,
      platformType: enumType.appPlatforms.MOBILE,
      messageType: enumType.messageType.MESSAGE,
      messageTitle: 'Welcome to Fybapay',
      approveForViewing: true,
      messageBody: `Hi, ${user.firstName} your dedicated Fyba account number is ${wallet.accountNumber}. You can send money into your Fyba account number and start carrying out your favorite services`,
    });
  } catch (error) {
    appLogger.log('error', {
      stack: error.stack,
      message: `PUBSUB_user_signup_welcome: ${error.message}`,
    });
  }
});

/**
 * signup-activities
 */
Pubsub.on('signup-activities', async (message) => {
  try {
    await ReferralServices.referralCreate(message.referralCreate, message.user);
    // if (message.referredBy) {
    //   Pubsub.emit('issue_referral', { user: message.user, referredBy: message.referredBy });
    // }
  } catch (error) {
    appLogger.log('error', {
      stack: error.stack,
      message: `PUBSUB_issue_referral/signup-activities: ${error.message}`,
    });
  }
});

/**
 * Subscribe to new referral
 */
Pubsub.on('issue_referral', async ({ user, referredBy }) => {
  try {
    await ReferralServices.issueReferral({ user, referredBy });
  } catch (error) {
    appLogger.log('error', {
      stack: error.stack,
      message: `PUBSUB_ISSUE_REFERRAL: ${error.message}`,
    });
  }
});

/**
 * issue_referral_commission
 */
Pubsub.on('issue_referral_commission', async ({ user }) => {
  // check user ref record who referred them
  // get their referred_By
  try {
    const usersRefRecord = await ReferralRepository.findOne({ referral_code: user.referral_code });
    if (usersRefRecord) {
      if (usersRefRecord.referred_by) {
        // issue referral to referrer
        Pubsub.emit('issue_referral', { user, referredBy: usersRefRecord.referred_by });
      }
    }
  } catch (error) {
    appLogger.log('error', {
      stack: error.stack,
      message: `PUBSUB_ISSUE_REFERRAL_COMMISSION: ${error.message}`,
    });
  }
});

/**
 * Subscribe to new referral
 */
Pubsub.on('new_referral', async ({ referredUser, referredBy }) => { //TODO - DONE
  try {
    // mail user
    if (referredBy.email) {
      await MailerServices.sendMail({
        email: referredBy.email,
        templateName: 'new-referral', // 'new_referral',
        firstName: referredBy.firstName,
        referredUser: referredUser.firstName,
      });
    }
  } catch (error) {
    appLogger.log('error', {
      stack: error.stack,
      message: `PUBSUB_NEW_REFERRAL: ${error.message}`,
    });
  }
});

/**
 * Subscribe to user reset password pin
 */
Pubsub.on('user_password_reset_pin', async (message) => { //TODO - MAIL
  try {
    await MailerServices.sendSms(message);
  } catch (error) {
    appLogger.log('error', {
      stack: error.stack,
      message: `PUBSUB_PASSWORD_RESET_PIN: ${error.message}`,
    });
  }
});

/**
 * Subscribe to password reset successful
 */
Pubsub.on('password_reset_successful', async (user) => {
  try {
    if (user.email) {
      await MailerServices.sendMail({
        email: user.email,
        templateName: 'password-reset-successful', // enumType.emailTemplates.WELCOME, // 'welcome-to-fyba', 
        firstName: user.firstName,
      });
    }
  } catch (error) {
    appLogger.log('error', {
      stack: error.stack,
      message: `PUBSUB_PASSWORD_RESET_SUCCESSFUL: ${error.message}`,
    });
  }
});

/**
 * Subscribe to user update bvn
 */
Pubsub.on('send_bvn_verify_code', async (message) => {
  try {
    await MailerServices.sendSms(message);
  } catch (error) {
    appLogger.log('error', {
      stack: error.stack,
      message: `PUBSUB_SEND_BVN_VERIFY_CODE: ${error.message}`,
    });
  }
});

/**
 * Subscribe to new agent joined
 */
Pubsub.on('new_agent_approved', async (message) => { //TODO - MAIL
  try {
    // TODO
    // mail user they are now agent
    // explain the benefit
    // wallet upgraded

  } catch (error) {
    appLogger.log('error', {
      stack: error.stack,
      message: `PUBSUB_NEW_AGENT_APPROVED: ${error.message}`,
    });
  }
});

Pubsub.on('new_agent_request', async (message) => { //TODO - MAIL
  try {
    // TODO
    // mail user they applied
    // mail admin too

  } catch (error) {
    appLogger.log('error', {
      stack: error.stack,
      message: `PUBSUB_NEW_AGENT_REQUEST: ${error.message}`,
    });
  }
});

Pubsub.on('agent_disapproved', async (message) => { //TODO - MAIL
  try {
    // TODO
    // mail user they have been agent_disapproved
    // mail admin too

  } catch (error) {
    appLogger.log('error', {
      stack: error.stack,
      message: `PUBSUB_NEW_AGENT_DISAPPROVED: ${error.message}`,
    });
  }
});

export default Pubsub;
