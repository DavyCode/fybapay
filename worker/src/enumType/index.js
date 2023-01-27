import emailTemplates from './emailTemplates';
import walletDailyLimit from './walletDailyLimit';
import rolesType from './rolesType';
import walletMaxBalance from './walletMaxBalance';
import serviceType from './serviceType';
import services from './services';
/**
 * Holds enumerable values
 */

exports.emailTemplates = emailTemplates;
exports.walletDailyLimit = walletDailyLimit;
exports.walletMaxBalance = walletMaxBalance;
exports.rolesType = rolesType;
exports.serviceType = serviceType;
exports.service = services;
/**
 * Kyc levels
 */
exports.kycLevel = {
  KYC_ONE: 'KYC_ONE',
  KYC_TWO: 'KYC_TWO',
  KYC_THREE: 'KYC_THREE',
  KYC_FOUR: 'KYC_FOUR',
  KYC_FIVE: 'KYC_FIVE',
};



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
 * signupSource
 */
exports.signupSource = {
  OTHER: 'Other',
  FACEBOOK: 'Facebook',
  TWITTER: 'Twitter',
  INSTAGRAM: 'Instagram',
  FRIENDS: 'Friends',
  FAMILY: 'Family',
  GOOGLE: 'Google',
  GOOGLE_PLAYSTORE: 'Google Playstore',
  APPLE_APPSTORE: 'Apple Appstore',
  ONLINE_BLOG: 'Online Blog',
  NEWSPAPER: 'Newspaper',
  EVENT: 'Event',
};

/**
 * Service Platforms
 */
exports.platform = {
  FYBAPAY: 'FYBAPAY',
  AIRVEND: 'AIRVEND',
  GLADEPAY: 'GLADEPAY',
  VTPASS: 'VTPASS',
  CARBON: 'CARBON',
  MONIFY: 'MONIFY',
  ACCELEREX: 'ACCELEREX',
  IRECHARGE: 'IRECHARGE',
  PROVIDOUS: 'PROVIDOUS',
  PRIMEAIRTIME: 'PRIMEAIRTIME',
  BULKSMSNIGERIA: 'BULKSMSNIGERIA',
  ESTORESMS: 'ESTORESMS',
  SMARTSOLUTIONS: 'SMARTSOLUTIONS',
  MULTITEXTER: 'MULTITEXTER',
  OPAY: 'OPAY',
  RUBIES: 'RUBIES',
  ITEX: 'ITEX',
  TERMII: 'TERMII',

  // GLADEPAY,
  // VTPASS, AIRVEND, CARBON, MONIFY, TMONI, ACCELEREX, IRECHARGE, PROVIDOUS, PRIMEAIRTIME, 
  // FLUTTERWAVE, RUBIES,
  // OPAY, 
  // ETOP, WALLETS, ITEX, 
  // GTB, 
  // UBA, 
  // PROVIDUSBANK, STERLINGBANK1, STERLINGBANK2, 
  // UNITYBANK, 
  // UNIONBANK, 
  // FCMB, 
  // STANBIC

};

/**
 * Transaction Status
 */
exports.transactionStatus = {
  SUCCESSFUL: 'Successful',
  INIT: 'Init',
  PENDING: 'Pending',
  FAILED: 'Failed',
  REFUND: 'Refund',
  // CANCELLED: 'Cancelled',
  NULL: 'Null',
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
  CABLETV: 100,
  ELECTRICITY: 100,
  TRANSFER: 40,
  BULK_TRANSFER: 40,
  WITHDRAW: 40,
  POS: 30,
  FUND: 0,
  WAEC: 100,
  JAMB: 100,
  REFUND: 0,
  NULL: 0,
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
