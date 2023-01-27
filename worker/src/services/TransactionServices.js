// @flow

import { BadRequestError, PaymentRequiredError, NotFoundError, InternalServerError } from '../utils/errors';
import enumType from '../enumType';
import VariationHelper from '../helpers/VariationHelper';
import UserRepository from '../repository/UserRepository';
import TransactionRepository from '../repository/TransactionRepository';
import CommissionRepository from '../repository/CommissionRepository';
import Utility from '../utils';
import AIRVEND_API from './api/vendorServices/AIRVEND/airvendApiServices';
import PRIMEAIRTIME_API from './api/vendorServices/PRIMEAIRTIME/primeairtimeServices';
import VTPASS_API from './api/vendorServices/VTPASS/vtpassServices';
import Pubsub_Fund from '../events/fundsEventListener';
import Pubsub_Scheduler from '../events/schedularEventListener';
import CommissionServices from './CommissionServices';
import WalletRepository from '../repository/WalletRepository';
import VariationServices from './VariationServices';
import GLADE_API from './api/vendorServices/GLADE/gladeApiServices';
import RUBIES_API from './api/vendorServices/RUBIES/rubiesServices';


export default {

  /**
   * verifyPrimeArtimeTransactions
   * @private
   * @description - Schedular
   */
  async verifyPrimeArtimeTransactions() {
    console.log(':::::::::::::: CRON JOB START :::::::::: verifyPrimeArtimeTransactionsJob');

    const transactions = await TransactionRepository.findPendingAndInitTransactions(enumType.platform.PRIMEAIRTIME);
    if (!transactions || transactions.length < 1) {
      console.log('No pending primeairtime transactions at this time');
      return;
    }

    // get platform token here
    const platformToken = await VariationServices.getPlatformToken(enumType.platform.PRIMEAIRTIME);

    for (let i = 0; i < transactions.length; i++) {
      const transaction = transactions[i];

      const resolveResponse = await PRIMEAIRTIME_API.verifyPrimeairtimeTransaction(transaction.transactionReference, platformToken);
      const responseBody = JSON.stringify(resolveResponse.data);
      transaction.responseBody = responseBody;

      if (resolveResponse.status === 200) {
        const result = resolveResponse.data;

        if (result.success === true || result.code === 'RECHARGE_COMPLETE') {
          // transaction.responseBody = resolveResponse.client_apiresponse;
          transaction.status = enumType.transactionStatus.SUCCESSFUL;
          transaction.message = 'Transaction successful';
          transaction.postWalletBalance = transaction.preWalletBalance - (transaction.amount + transaction.charges);
          transaction.paidAt = Date.now();
          transaction.meta.updatedAt = Date.now();
          const savedTrx = await TransactionRepository.TransactionSave(transaction);

          /**
           * issue commission if transaction has commission
           */
          if (transaction.commission > 0) {
            const commissionWallet = await CommissionRepository.getCommissionWalletByUserId(transaction.user._id);

            await CommissionServices.issueCommission(transaction, transaction.user, transaction.commission, commissionWallet);
          }

          // Pubsub_Fund.emit('verify_primeArtime_transactions', { transaction: savedTrx, user: transaction.user });
          Pubsub_Fund.emit('success_verify_transactions', { transaction: savedTrx, user: transaction.user });
        }

        if (result.success === false || result.code === 'RECHARGE_FAILED') {
          const returnAmount = transaction.amount + transaction.charges;

          // transaction.responseBody = JSON.stringify(resolveResponse.data);
          transaction.status = enumType.transactionStatus.FAILED;
          transaction.message = 'Transaction failed';
          transaction.commission = 0;
          transaction.charges = 0;
          transaction.meta.updatedAt = Date.now();
          transaction.postWalletBalance = transaction.preWalletBalance;
          await TransactionRepository.TransactionSave(transaction);

          const wallet = await WalletRepository.getWalletById(transaction.wallet);
          wallet.balance += returnAmount;
          wallet.meta.updatedAt = Date.now();
          await WalletRepository.saveWallet(wallet);

          Pubsub_Fund.emit('verify_primeArtime_transactions_failed', { transaction });
        }

        // else {
        //   // transaction.status = enumType.transactionStatus.PENDING;
        //   // transaction.commission = 0;
        //   transaction.message = resolveResponse.message;
        //   transaction.meta.updatedAt = Date.now();
        //   await TransactionRepository.TransactionSave(transaction);

        //   console.log('Transaction not yet fulfilled');
        // }
      }

      if (resolveResponse.status === 404) {
        /**
         * AT this point we might have charged the user wallet
         * might be right to return the money
         */
        const returnAmount = transaction.amount + transaction.charges;

        // transaction.responseBody = JSON.stringify(resolveResponse);
        transaction.status = enumType.transactionStatus.FAILED;
        transaction.message = resolveResponse.message;
        transaction.commission = 0;
        transaction.charges = 0;
        transaction.postWalletBalance = transaction.preWalletBalance;
        transaction.meta.updatedAt = Date.now();
        await TransactionRepository.TransactionSave(transaction);

        const wallet = await WalletRepository.getWalletById(transaction.wallet);

        wallet.balance += returnAmount;
        wallet.meta.updatedAt = Date.now();
        await WalletRepository.saveWallet(wallet);

        Pubsub_Fund.emit('verify_primeArtime_transactions_failed', { transaction });
      }
    }

    console.log(':::::::::: CRON JOB END :::::::::: verifyPrimeArtimeTransactionsJob');
    Pubsub_Scheduler.emit('verify_PrimeArtime_Transactions_Job', { data: transactions });
  },

  /**
   * verifyVtpassTransactions
   */
  async verifyVtpassTransactions() {
    console.log('::::::::: CRON JOB START :::::::::: verifyVtpassTransactionsJob');

    const transactions = await TransactionRepository.findPendingAndInitTransactions(enumType.platform.VTPASS);

    if (!transactions || transactions.length < 1) {
      console.log('No pending VTPASS transactions at this time');
      return;
    }

    for (let i = 0; i < transactions.length; i++) {
      const transaction = transactions[i];

      const resolveResponse = await VTPASS_API.vtpassVerifyTransaction({ request_id: transaction.transactionId });

      transaction.responseBody = JSON.stringify(resolveResponse);

      if (resolveResponse && resolveResponse.code === '000' && resolveResponse.content.transactions.status === 'delivered') {
        transaction.client_transactionReference = resolveResponse.content.transactions.transactionId;
        transaction.status = enumType.transactionStatus.SUCCESSFUL;
        transaction.client_statusCode = String(resolveResponse.code);
        transaction.postWalletBalance = transaction.preWalletBalance - (transaction.amount + transaction.charges);
        transaction.message = 'Transaction successful';
        transaction.paidAt = Date.now();
        transaction.meta.updatedAt = Date.now();
        const savedTrx = await TransactionRepository.TransactionSave(transaction);

        /**
         * issue commission
         */
        if (transaction.commission > 0) {
          const commissionWallet = await CommissionRepository.getCommissionWalletByUserId(transaction.user._id);

          await CommissionServices.issueCommission(transaction, transaction.user, transaction.commission, commissionWallet);
        }

        // Pubsub.emit('verify_vtpass_transactions', { transaction, user: transaction.user });
        Pubsub_Fund.emit('success_verify_transactions', { transaction: savedTrx, user: transaction.user });
      }
      /**
       * 099
       * TRANSACTION IS PROCESSING
       * Transaction is currently precessing.
       * In such situation, you should requery using your requestID to ascertain the current status of the transaction.
       */
      else if (resolveResponse.code === '000' || resolveResponse.code === '099') {
        console.log('Transaction not yet fulfilled');
      }
      /**
       * INVALID REQUEST ID
       * This is returned for a requery operation.
       * This RequestID was not used on our platform.
       */
      else if (resolveResponse && resolveResponse.code === '015') {
        const returnAmount = transaction.amount + transaction.charges;

        transaction.responseBody = JSON.stringify(resolveResponse);
        transaction.status = enumType.transactionStatus.FAILED;
        transaction.message = 'Transaction not found';
        transaction.commission = 0;
        transaction.charges = 0;
        transaction.postWalletBalance = transaction.preWalletBalance;
        transaction.meta.updatedAt = Date.now();
        await TransactionRepository.TransactionSave(transaction);

        /**
         * Return wallet charges
         */
        const wallet = await WalletRepository.getWalletById(transaction.wallet);

        wallet.balance += returnAmount;
        wallet.meta.updatedAt = Date.now();
        await WalletRepository.saveWallet(wallet);

        Pubsub_Fund.emit('verify_vtpass_transactions_failed', { transaction });
      }
      else if (!resolveResponse) {
        console.log('Something went wrong');
      }
      /**
       * TRANSACTION FAILED
       */
      else {
        const returnAmount = transaction.amount + transaction.charges;

        transaction.responseBody = JSON.stringify(resolveResponse);
        transaction.status = enumType.transactionStatus.FAILED;
        transaction.message = 'Transaction failed';
        transaction.commission = 0;
        transaction.charges = 0;
        transaction.meta.updatedAt = Date.now();
        transaction.postWalletBalance = transaction.preWalletBalance;
        await TransactionRepository.TransactionSave(transaction);

        const wallet = await WalletRepository.getWalletById(transaction.wallet);
        wallet.balance += returnAmount;
        wallet.meta.updatedAt = Date.now();
        await WalletRepository.saveWallet(wallet);

        Pubsub_Fund.emit('verify_vtpass_transactions_failed', { transaction });
      }
    }
    console.log(':::::::::::::: CRON JOB END :::::::::: verifyVtpassTransactionsJob');
    Pubsub_Scheduler.emit('verify_Vtpass_Transactions_Job', { data: transactions });
  },


  /**
   * Resolve GladePay Transfer Transactions
   * @private
   * @description - Run on schedular
   */
  async resolveGladePayTransactions() {
    console.log(':::::::::::::: CRON JOB START :::::::::: resolveGladePayTransactionsJob');

    const transactions = await TransactionRepository.findByStatusAndPlatform(enumType.transactionStatus.PENDING, enumType.platform.GLADEPAY);
    if (!transactions || transactions.length < 1) {
      console.log('No pending Gladepay transactions at this time');
      return;
    }

    for (let i = 0; i < transactions.length; i++) {
      const transaction = transactions[i];
      const resolveResponse = await GLADE_API.gladePayDisburse({ action: 'verify', txnRef: transaction.transactionReference });

      if (resolveResponse.status === 200 && resolveResponse.txnStatus != null && resolveResponse.txnStatus === 'successful') {
        transaction.status = enumType.transactionStatus.SUCCESSFUL;
        transaction.message = 'Transaction successful';
        transaction.postWalletBalance = transaction.preWalletBalance - (transaction.amount + transaction.charges);
        transaction.meta.updatedAt = Date.now();
        const savedTrx = await TransactionRepository.TransactionSave(transaction);

        // const user = await UserRepository.getUserById(transaction.user);

        // Pubsub_Fund.emit('fund_transfer', { transaction: savedTrx, user });
        Pubsub_Fund.emit('success_verify_transactions', { transaction: savedTrx, user: transaction.user });
      }
      else if (resolveResponse.status === 200 && resolveResponse.txnStatus != null && resolveResponse.txnStatus === 'pending') {
        transaction.status = enumType.transactionStatus.PENDING;
        transaction.message = 'Transaction pending';
        transaction.meta.updatedAt = Date.now();
        await TransactionRepository.TransactionSave(transaction);
      }
      else if (resolveResponse.status === 200 && resolveResponse.txnStatus != null && resolveResponse.txnStatus === 'failed') {
        const wallet = await WalletRepository.getWalletById(transaction.wallet);

        transaction.status = enumType.transactionStatus.FAILED;
        transaction.message = 'Transaction failed';
        transaction.charges = 0;
        transaction.commission = 0;
        transaction.postWalletBalance = transaction.preWalletBalance;
        transaction.meta.updatedAt = Date.now();
        await TransactionRepository.TransactionSave(transaction);

        wallet.balance += (transaction.amount + transaction.charges);
        wallet.meta.updatedAt = Date.now();
        await WalletRepository.saveWallet(wallet);

        Pubsub_Fund.emit('verify_gladepay_transactions_failed', { transaction });
      }
    }

    console.log(':::::::::::::: CRON JOB END :::::::::: resolveGladePayTransactionsJob');
    Pubsub_Scheduler.emit('resolve_GladePay_Transactions_Job', { data: transactions });
  },

  /**
   * Resolve GladePay Withdraw Transactions
   * @private
   * @description - Run on schedular
   * @todo - schedular
   */
  async resolveGladePayWithdrawTransactions() {
    console.log(':::::::::::::: CRON JOB START :::::::::: resolveGladePayWithdrawTransactionsJob');

    const transactions = await TransactionRepository.findByServiceTypeAndStatusAndPlatform(enumType.serviceType.WITHDRAW, enumType.transactionStatus.PENDING, enumType.platform.GLADEPAY);
    if (!transactions || transactions.length < 1) {
      console.log('No pending Gladepay withdrawal transactions at this time');
      return;
    }

    for (let i = 0; i < transactions.length; i++) {
      const resolveResponse = await GLADE_API.gladePayDisburse({ action: 'verify', txnRef: transactions[i].transactionReference });

      if (resolveResponse.status === 200 && resolveResponse.txnStatus != null && resolveResponse.txnStatus === 'successful') {
        transactions[i].status = enumType.transactionStatus.SUCCESSFUL;
        transactions[i].message = 'Transaction successful';
        transactions[i].postWalletBalance = transactions[i].preWalletBalance - (transactions[i].amount + transactions[i].charges);
        transactions[i].meta.updatedAt = Date.now();
        const savedTrx = await TransactionRepository.TransactionSave(transactions[i]);

        // const user = await UserRepository.getUserById(transactions[i].user);

        // Pubsub.emit('wallet_withdraw', { transaction: savedTrx, user });
        Pubsub_Fund.emit('success_verify_transactions', { transaction: savedTrx, user: transactions[i].user });
      }
      else if (resolveResponse.status === 200 && resolveResponse.txnStatus != null && resolveResponse.txnStatus === 'pending') {
        transactions[i].status = enumType.transactionStatus.PENDING;
        transactions[i].message = 'Transaction pending';
        transactions[i].meta.updatedAt = Date.now();
        await TransactionRepository.TransactionSave(transactions[i]);
      }
      else if (resolveResponse.status === 200 && resolveResponse.txnStatus != null && resolveResponse.txnStatus === 'failed') {
        const wallet = await WalletRepository.getWalletById(transactions[i].wallet);

        transactions[i].status = enumType.transactionStatus.FAILED;
        transactions[i].message = 'Transaction failed';
        transactions[i].charges = 0;
        transactions[i].commission = 0;
        transactions[i].postWalletBalance = transactions[i].preWalletBalance;
        transactions[i].meta.updatedAt = Date.now();
        await TransactionRepository.TransactionSave(transactions[i]);

        wallet.balance += (transactions[i].amount + transactions[i].charges);
        wallet.meta.updatedAt = Date.now();
        await WalletRepository.saveWallet(wallet);
      }
    }

    console.log(':::::::::::::: CRON JOB END :::::::::: resolveGladePayWithdrawTransactionsJob');
    Pubsub_Scheduler.emit('resolve_GladePay_WithdrawTransactions_Job', { data: transactions });
  },

  /**
   * resolveRubiesTransactions
   * @description - Run schedular verify Rubies Bank transactions
   * @public
   */
  async resolveRubiesTransactions() {
    console.log(':::::::::::::: CRON JOB START :::::::::: resolveRubiesTransactions');

    const transactions = await TransactionRepository.findPendingAndInitTransactions(enumType.platform.RUBIES);

    if (!transactions || transactions.length < 1) {
      console.log('No pending rubies transactions at this time');
      return;
    }

    for (let i = 0; i < transactions.length; i++) {
      const transaction = transactions[i];

      const resolveResponse = await RUBIES_API.verifyRubiesTransactions({ reference: transaction.transactionReference });

      transaction.responseBody = JSON.stringify(resolveResponse);

      // SUCCESS
      if (resolveResponse && resolveResponse.responsecode === '00' && resolveResponse.transactionstatus === 'Success') {

        transaction.status = enumType.transactionStatus.SUCCESSFUL;
        transaction.message = 'Transaction successful';
        transaction.postWalletBalance = transaction.preWalletBalance - (transaction.amount + transaction.charges);
        transaction.paidAt = Date.now();
        transaction.meta.updatedAt = Date.now();
        const savedTrx = await TransactionRepository.TransactionSave(transaction);

        /**
         * issue commission if transaction has commission
         */
        if (transaction.commission > 0) {
          const commissionWallet = await CommissionRepository.getCommissionWalletByUserId(transaction.user._id);

          await CommissionServices.issueCommission(transaction, transaction.user, transaction.commission, commissionWallet);
        }

        Pubsub_Fund.emit('success_verify_transactions', { transaction: savedTrx, user: transaction.user });
      }
      // PENDING
      /**
       * https://developer.rubiesbank.io/?version=latest#intro
       */
      else if (
        resolveResponse.responsecode === '81' || resolveResponse.responsecode === '-1' ||
        resolveResponse.responsecode === '34' || resolveResponse.responsecode === '01' ||
        resolveResponse.responsecode === '96' || resolveResponse.responsecode === '999'
      ) {
        console.log('Transaction Pending');
      }
      else {
        // FAILED TRANSACTIONS
        const returnAmount = transaction.amount + transaction.charges;

        transaction.status = enumType.transactionStatus.FAILED;
        transaction.message = 'Transaction failed';
        transaction.commission = 0;
        transaction.charges = 0;
        transaction.meta.updatedAt = Date.now();
        transaction.postWalletBalance = transaction.preWalletBalance;
        await TransactionRepository.TransactionSave(transaction);

        const wallet = await WalletRepository.getWalletById(transaction.wallet);
        wallet.balance += returnAmount;
        wallet.meta.updatedAt = Date.now();
        await WalletRepository.saveWallet(wallet);
      }
    }

    console.log(':::::::::: CRON JOB END :::::::::: resolveRubiesTransactions');
    Pubsub_Scheduler.emit('resolveRubiesTransactions', { data: transactions });
  },
};
