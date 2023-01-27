import emailTemplates from './emailTemplates.enum';
import walletDailyLimit from './walletDailyLimit.enum';
import rolesType from './rolesType.enum';
import walletMaxBalance from './walletMaxBalance.enum';
import serviceType from './serviceType.enum';
import services from './services.enum';
import platform from './platform.enum';
import kycLevel from './kyclevel.enum';
import transactionStatus from './transactionStatus.enum';
import signupSource from './signupSource.enum';
/**
 * Holds enumerable values
 */

exports.emailTemplates = emailTemplates;
exports.walletDailyLimit = walletDailyLimit;
exports.walletMaxBalance = walletMaxBalance;
exports.rolesType = rolesType;
exports.serviceType = serviceType;
exports.service = services;
exports.platform = platform;
exports.kycLevel = kycLevel;
exports.transactionStatus = transactionStatus;
exports.signupSource = signupSource;

/**
 * Role ID
 */
exports.rolesId = {
  USER: '1',
  AGENT: '212',
  SUPERAGENT: '355',
  SUPPORT: '483',
  ADMIN: '578',
  SUPERADMIN: '689',
};

/**
 * Transaction Type
 */
exports.transactionType = { // this should say if its a wallet/regular trx
  WALLET: 'Wallet',
  POS: 'POS', // classified under services
  SERVICES: 'Services',
  W2W_TRANSFER: 'W2W',
};


/**
 * Transaction Type
 */
exports.paymentMethod = {
  BANK: 'Bank Transfer',
  CARD: 'Card',
  WALLET: 'Wallet',
  COMMISSION_WALLET: 'Commission Wallet',
  POS: 'Pos',
  SMS: 'Sms Channel',
  DIRECT_CREDIT: 'Direct Credit',
  ACCOUNT_TRANSFER: 'Account Transfer',
  COMMISSION_TRANSFER: 'Commission Transfer',
};

exports.contacts = {
  SUPPORT: '+2348128112690',
  ADMIN: '+2348132078657',
};

exports.transferType = {
  W2W_TRANSFER: 'WalletToWallet',
  WALLET_TRANSFER: 'WalletTransfer',
  FUND_TRANSFER: 'FundTransfer', // todo - new
};

exports.charges = {
  AIRTIME: 0,
  DATA: 0,
  CABLETV: 50,
  ELECTRICITY: 50,
  TRANSFER: 30,
  BULK_TRANSFER: 40,
  WITHDRAW: 30,
  POS: 0,
  FUND: 0,
  WAEC: 100,
  JAMB: 100,
  REFUND: 0,
  NULL: 0,


  BVN: 20, // TODO - NEW
};

exports.issueCategory = {
  POS_ISSUE: 'POS_ISSUE',
  OTHER_ISSUE: 'OTHER_ISSUE',
};

exports.issueStatus = {
  OPEN: 'OPEN',
  CLOSED: 'CLOSED',
};

exports.appType = {
  ANDROID: 'ANDROID',
  IOS: 'IOS',
  WEB: 'WEB',
  USSD: 'USSD',
  SMS: 'SMS',
  POS: 'POS',
};

exports.appPlatforms = {
  WEB: 'WEB',
  MOBILE: 'MOBILE',
  POS: 'POS',
};

exports.messageType = {
  NEWS: 'news',
  NOTIFICATION: 'notification',
  MESSAGE: 'message',
};

exports.messageCategory = {
  BROADCAST: 'broadcast',
  DIRECT: 'direct',
};
