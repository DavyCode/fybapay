// @flow

/**
 * Schedules Task
 * @todo - resolveGladePayWithdrawTransactions  [walletServices.resolveGladePayWithdrawTransactions]
 */
// getPrimeAirtimeToken // in variation service
// resolveGladePayWithdrawTransactions // in walletServices
// resolveGladePayTransactions // TransactionServices
// verifyPrimeArtimeTransactions

import { CronJob } from 'cron';
import VariationServices from '../services/VariationServices';
import TransactionServices from '../services/TransactionServices';

/**
 * getPrimeAirtimeTokenJob
 * @private
 */
const getPrimeAirtimeTokenJob = async () => {
  // 11:10 daily
  const task = new CronJob('10 23 * * *', await VariationServices.getPrimeAirtimeToken, {
    scheduled: false,
  });

  task.start();
};

/**
 * resolveGladePayWithdrawTransactionsJob
 * @private
 */
const resolveGladePayWithdrawTransactionsJob = async () => {
  // Every 6 mins
  const task = new CronJob('*/1 * * * *', await TransactionServices.resolveGladePayWithdrawTransactions, {
    scheduled: false,
  });

  task.start();
};

/**
 * resolveGladePayTransactionsJob
 * private
 */
const resolveGladePayTransactionsJob = async () => {
  // Every 5 mins
  const task = new CronJob('*/1 * * * *', await TransactionServices.resolveGladePayTransactions, {
    scheduled: false,
  });

  task.start();
};

/**
 * verifyPrimeArtimeTransactionsJob
 * @private
 */
const verifyPrimeArtimeTransactionsJob = async () => {
  // Every 3 mins
  const task = new CronJob('*/1 * * * *', await TransactionServices.verifyPrimeArtimeTransactions, {
    scheduled: false,
  });

  task.start();
};

const verifyVtpassTransactionsJob = async () => {
  // Every 2 mins
  const task = new CronJob('*/2 * * * *', await TransactionServices.verifyVtpassTransactions, {
    scheduled: false,
  });

  task.start();
};

const verifyRubiesTransactionsJob = async () => {
  // Every 1 mins
  const task = new CronJob('* * * * *', await TransactionServices.resolveRubiesTransactions, {
    scheduled: false,
  });

  task.start();
};

export default async () => {
  await getPrimeAirtimeTokenJob();
  await resolveGladePayWithdrawTransactionsJob();
  await resolveGladePayTransactionsJob();
  await verifyPrimeArtimeTransactionsJob();
  await verifyVtpassTransactionsJob();
  await verifyRubiesTransactionsJob();
};


// run 2:15pm on the first of every month -- 15 14 1 * *
// run five minutes after midnight, every day -- 5 0 * * *
// run at 10 pm on weekdays, annoy Joe 0 22 * * 1-5

// scheduler
// scheduleFor30sec() {
//   terminalService.settlement();
//   transferService.resolvePaymentPrimeAirtime();
//   transferService.resolvePaymentGladePay();
//   transferService.resolvePaymentOptimus();
//   transferService.resolvePaymentProvidous();
//   walletService.resolveGladePayWithdrawTransactions();
//   walletService.resolveOptimusPayWithdrawTransactions();
// }

/**
 * How about if you run an entirely separate app ( lets say cron ) that will be responsible for handling Cron jobs. 
 * This way you can separate the concerns. If you need to pass message/task from your main app to cron app, 
 * then you can use Rabbitmq for messaging system.
 */


/**
 * There are many ways to implement this. You could run a separate instance for cron jobs. You could run cron jobs only on master.
 * I just wrote a small module for node, cronivo, it uses laterJs and redis to allow a cron job to be executed only once even in cluster or multi process. Only the first available instance will execute the job. Any of the instances may execute the job, but only one.
 */
