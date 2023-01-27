// @flow

import Pubsub from '../events';
import CommissionServices from '../services/CommissionServices';
import AppConstant from '../constant';
import CommissionRepository from '../repository/CommissionRepository';
import TransactionRepository from '../repository/TransactionRepository';
import { appLogger } from '../setup/logging';
import enumType from '../enumType';
import MailerServices from '../services/MailerServices';
import { formatNumber } from '../utils/formatPhone';

// import { sendSms } from '../utils/Sms';

/**
 * Subscribe to new_terminal_created
 */
Pubsub.on('new_terminal_created', async (message) => {
});

/**
 * Subscribe to terminal_update
 */
Pubsub.on('terminal_updated', async (message) => {
});

/**
 * Subscribe to terminal_deleted
 */
Pubsub.on('terminal_deleted', async (message) => {
  console.log({ message });
});

/**
 * Subscribe to admin_assign_terminal_agent
 */
Pubsub.on('admin_assign_terminal_agent', async (message) => {
});

/**
 * Subscribe to admin_detach_terminal_agent
 */
Pubsub.on('admin_detach_terminal_agent', async (message) => {
});

/**
 * Subscribe to admin_detach_terminal_aggregator
 */
Pubsub.on('admin_detach_terminal_aggregator', async (message) => {
});

/**
 * Subscribe to admin_assign_terminal_aggregator
 */
Pubsub.on('admin_assign_terminal_aggregator', async (message) => {});

/**
 * aggregator_unblock_pos
 */
Pubsub.on('admin_unblock_pos', async ({ terminal, agent, aggregator }) => {
  /**
   * @todo - MAIL ADMIN
   */
  try {
  } catch (error) {
    console.log(error.message);
  }
});

Pubsub.on('admin_block_pos', async ({ terminal, agent, aggregator }) => {
  /**
   * @todo - MAIL ADMIN
   */
  try {
  } catch (error) {
    console.log(error.message);
  }
});

/**
 * issue_aggregator_pos_commission
 */
Pubsub.on('issue_aggregator_pos_commission', async ({
  transaction,
  posTerminal,
  commission,
}) => {
  try {
    const commissionWallet = await CommissionRepository.getCommissionWalletByUserId(posTerminal.aggregator._id);
    if (commissionWallet) {
      // transaction, user, commission, commissionWallet
      await CommissionServices
        .issueCommission(transaction, posTerminal.aggregator, commission, commissionWallet);
      /**
       * @todo - MAIL ADMIN
       */
      transaction.aggregatorUserId = posTerminal.aggregator._id;
      transaction.meta.updatedAt = Date.now();
      await TransactionRepository.TransactionSave(transaction);
    }
  } catch (error) {
    appLogger.log('error', {
      stack: error.stack,
      message: `PUBSUB_issue_aggregator_pos_commission: ${error.message}`,
    });
  }
});

/**
 * new_pos_notification
 */
Pubsub.on('new_pos_notification', async ({ transaction, notification, posTerminal }) => {
  try {
    if (posTerminal.user.phone) {
      await MailerServices.sendVendorSms({
        phone: posTerminal.user.phone,
        message: `Fybapay: POS Payment Notification. Amount: NGN${transaction.amount}. Date: ${new Date(transaction.paidAt).toLocaleString()}. TransactionID: ${transaction.transactionId}`,
      });
    }

    if (posTerminal.user.email) {
      await MailerServices.sendMail({
        email: posTerminal.user.email,
        firstName: posTerminal.user.firstName,
        templateName: enumType.emailTemplates.NEW_POS_NOTIFICATION,
        amount: transaction.amount,
        date: new Date(transaction.paidAt).toLocaleString(),
        transactionId: transaction.transactionId,
        terminal: posTerminal.terminalId,
        // charges
      });
    }
    else {
      // TODO : send ADMIN MAIL ONLY
    }
  } catch (error) {
    appLogger.log('error', {
      stack: error.stack,
      message: `PUBSUB_new_pos_notification: ${error.message}`,
    });
  }
});


export default Pubsub;
