// @flow

import Pubsub from '../events'
// import { sendSms } from '../utils/Sms';

/**
 * Subscribe to Transfer from wallet event
 */
Pubsub.on('wallet_transfer', async function(message) {
  /**
   * @todo - MAIL SENDER
   * @todo - MAIL RECEIVER
   * @todo - MAIL ADMIN
   * @todo - If amount is greater than N500 sms receiver
   */
});

/**
 * Subscribe to Transfer from wallet event
 */
Pubsub.on('wallet_transfer_failed_insufficient_bal', async function(message) {
  /**
   * @todo - MAIL ADMIN
   */
});

/**
 * Subscribe to Transfer from wallet event
 */
Pubsub.on('wallet_transfer_failed', async function(message) {
  /**
   * @todo - MAIL ADMIN
   */
});

/**
 * Subscribe to Bulk Transfer from wallet to wallet
 */
Pubsub.on('wallet_to_wallet_bulk_transfer', async function(message) {
  /**
   * @todo - MAIL SENDER
   * @todo - MAIL RECEIVER
   * @todo - MAIL ADMIN
   * @todo - If amount is greater than N500 sms receiver
   */
});

/**
 * Subscribe to Bulk Transfer from wallet to wallet
 */
Pubsub.on('wallet_to_wallet_bulk_transfer_failed', async function(message) {
  /**
   * @todo - MAIL ADMIN
   */
});

/**
 * Subscribe to Bulk Transfer to bank failed insufficient fund
 */
Pubsub.on('wallet_bulk_transfer_bank_failed_insufficient_bal', async function(message) {
  /**
   * @todo - MAIL ADMIN
   */
});

/**
 * Subscribe to Bulk Transfer to bank failed
 */
Pubsub.on('wallet_bulk_transfer_bank_failed', async function(message) {
  /**
   * @todo - MAIL ADMIN
   */
});

export default Pubsub;
