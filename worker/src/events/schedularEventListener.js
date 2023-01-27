// @flow

import Pubsub from '../events'
// import { sendSms } from '../utils/Sms';

/**
 * Subscribe to get_PrimeAirtime_TokenJob
 */
Pubsub.on('get_PrimeAirtime_TokenJob', async (message) => {
  console.log('Pursue get_PrimeAirtime_TokenJob: starting to log get_PrimeAirtime_TokenJob...');

  console.log('NOTIFY ADMIN get_PrimeAirtime_TokenJob RAN', '...........');

  console.log('Pubsub get_PrimeAirtime_TokenJob ran...');
});


/**
 * resolve_GladePay_WithdrawTransactions_Job
 */
Pubsub.on('resolve_GladePay_WithdrawTransactions_Job', async (message) => {
  console.log('Pursue resolve_GladePay_WithdrawTransactions_Job: starting to log resolve_GladePay_WithdrawTransactions_Job...');
  
  console.log('NOTIFY ADMIN resolve_GladePay_WithdrawTransactions_Job RAN', '...........')

  console.log('Pubsub resolve_GladePay_WithdrawTransactions_Job ran...');
});


/**
 * resolve_GladePay_Transactions_Job
 */
Pubsub.on('resolve_GladePay_Transactions_Job', async (message) => {
  console.log('Pursue resolve_GladePay_Transactions_Job: starting to log resolve_GladePay_Transactions_Job...');

  console.log('NOTIFY ADMIN resolve_GladePay_Transactions_Job RAN')

  console.log('Pubsub resolve_GladePay_Transactions_Job ran...');
});

/**
 * verify_PrimeArtime_Transactions_Job
 */
Pubsub.on('verify_PrimeArtime_Transactions_Job', async (message) => {
  console.log('Pursue verify_PrimeArtime_Transactions_Job: starting to log verify_PrimeArtime_Transactions_Job...');

  console.log('NOTIFY ADMIN verify_PrimeArtime_Transactions_Job RAN', { message: message.length }, '...........')

  console.log('Pubsub verify_PrimeArtime_Transactions_Job ran...');
});

/**
 * verify_Vtpass_Transactions_Job
 */
Pubsub.on('verify_Vtpass_Transactions_Job', async (message) => {
  console.log('Pursue verify_Vtpass_Transactions_Job: starting to log verify_Vtpass_Transactions_Job...');

  console.log('NOTIFY ADMIN verify_Vtpass_Transactions_Job RAN');

  console.log('Pubsub verify_Vtpass_Transactions_Job ran...');
});

export default Pubsub;
