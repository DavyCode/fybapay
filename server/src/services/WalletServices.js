/**
 * Wallet Services 
 * get user wallet + √√√√√
 * getWalletHistories √√√√+ 
 * getWalletHistoryByUser + √√√√√√
 * getWalletTransactionsByStatus + √√
 * getWalletTransactionsByType + √√
 *  transferWalletToWallet √√√
 * verifyFYBAPAYPhoneToAccountNumber + √√√
 * withdrawFromWallet + √√√
 * withdrawFromWalletGladePay + v√√√
 * withdrawFromWalletPrimeAirTime *
 * withdrawFromWalletToGrowWealth  *
 * refund √√√
 * withdrawCharges √√√√
 * resolveGladePayWithdrawTransactions √√√√
 * 
 * viewWalletTransactionInsight
 * viewWalletTransactionRange
 * viewWalletTransactionUser 
 * viewWalletTransactionByUserAndTypeAndStatusAndDate
 * viewWalletTransactionSearch
 * viewWalletTransactionByTypeAndStatusAndDate
 * viewUserTransactionFilter 
 */

// @flow

import WalletRepository from '../repository/WalletRepository';
import TransactionRepository from '../repository/TransactionRepository';
import ServiceSwitchRepository from '../repository/ServiceSwitchRepository';
import PaymentNotificationRepository from '../repository/PaymentNotificationRepository';
import UserRepository from '../repository/UserRepository';
import BeneficiaryServices from './BeneficiaryServices';
import CommissionRepository from '../repository/CommissionRepository';
import { BadRequestError, PaymentRequiredError, NotFoundError, ForbiddenError, InternalServerError, UnauthorizedError } from '../utils/errors';
import Pubsub from '../events/walletEventListener';
import Utility from '../utils';
import enumType from '../enumType';
import API_GLADE from './api/vendorServices/GLADE/gladeApiServices';
import API_MONIFY from './api/vendorServices/MONIFY/monifyApiServices'
import API_PAYSTACK from '../services/api/paystackServices';
import PRIMEAIRTIME_API from './api/vendorServices/PRIMEAIRTIME/primeairtimeServices';
import BankHelper from '../helpers/BankHelper';
import { formatNumber }  from '../utils/formatPhone';
import AppConstant from '../constant'
import { RUBIES_DR_ACCOUNTNAME } from '../config/env';
import RUBIES_API from './api/vendorServices/RUBIES/rubiesServices';



export default {
  /**
   * Get User Wallet
   * @param {} user 
   * @public
   */
  async getUserWallet(request: any) {
    const wallet = await WalletRepository.getWalletByUserId(request.user.id);
    if (!wallet) { throw new NotFoundError('User wallet not found') };
    return Utility.buildResponse({ data: wallet })
  },

  /**
   * Get All Wallet History
   * /transactions?serviceType=Wallet
   */

  /**
   * Get Wallet Transactions By User By Type And By OR Status
   * ALL
   * TYPE
   * STATUS
   * @private
   */
  async getUserWalletTransactions(request: any) {
    const transactions = await TransactionRepository.getUserTransactionsAndByTypeAndORStatus(request.user.id, {...request.query, transactionType: enumType.transactionType.WALLET });
    if (!transactions.data) { throw new NotFoundError('Transactions not found') };
    return Utility.buildResponse({ ...transactions })
  },

  /**
   * Transfer Wallet To Wallet
   * @param {} request 
   */
  async transferWalletToWallet(request: any) {
    const { accountNumber, amount, narration, saveBeneficiary } = request.body;
    const user = await UserRepository.getUserById(request.user.id);
    if (!user) { throw new NotFoundError('User not found'); }
    
    const senderWallet = await WalletRepository.getWalletByUserId(user._id);
    if (!senderWallet) { throw new BadRequestError('User wallet not found') };
    
    // FIND BY PHONE NUMBER
    // const receiverWallet = await WalletRepository.findByAccountNumber(accountNumber);
    const formatedPhone = formatNumber(accountNumber);
    const receiver = await UserRepository.findOne({ phone: formatedPhone })
    if (!receiver) { throw new NotFoundError('User with phone number not found') };

    const receiverWallet = receiver.wallet;// await WalletRepository.findByAccountNumber(accountNumber);
    // if (!receiverWallet) { throw new NotFoundError('Invalid account') };
    
    const receiverDetails = await UserRepository.findOne({ wallet: receiverWallet._id })
    if (!receiverDetails) { throw new NotFoundError('Receiving user not found'); }
    
    if (receiverWallet.accountNumber === senderWallet.accountNumber) { throw new ForbiddenError('Same wallet transfer not allowed'); }
    
    const transferAmount = parseInt(amount, 10);
    
    const senderWalletBalance = senderWallet.balance ? senderWallet.balance : 0;
    const receiverWalletBalance = receiverWallet.balance ? receiverWallet.balance : 0;
    
    if (senderWalletBalance <= 0) {
      throw new BadRequestError('Failure. Wallet balance less than 1');
    }

    if (transferAmount > senderWallet.limit) {
      throw new BadRequestError(`Failure. Amount exceeds limit ${senderWallet.limit}`);
    }

    if (senderWalletBalance < transferAmount) { 
      throw new PaymentRequiredError('Failure. Insufficient balance');
    }
    
    /**
     * Non BVN users have a daily transaction limit of 1000
     * sum both wallet daily total trx and service daily trx
     */
    const todayTransactionAmount = await TransactionRepository.sumTransactionAmountByUserIdAndFilter(user._id, { date: new Date(), status: enumType.transactionStatus.SUCCESSFUL });

    if (!todayTransactionAmount) {
      throw new NotFoundError('Failure. Could not retrieve daily transaction amount');
    }

    if (todayTransactionAmount.length > 0) {
      if (todayTransactionAmount[0].total) {

        if (senderWallet.limit === enumType.walletDailyLimit.KYC_ONE) {
          if (Number(todayTransactionAmount[0].total) >= Number(senderWallet.limit)) {
            throw new ForbiddenError('Denied. non-verified BVN users daily transaction limit exceeded!')
          }
        }

        /**
         * Check daily trx amount Against Wallet Limit
         */
        if (Number(todayTransactionAmount[0].total) > Number(senderWallet.limit)) {
          throw new ForbiddenError(`Denied. Daily transaction limit of ${senderWallet.limit} exceeded!`);
        }
      }
    }
    
    const reference = await Utility.generateTrxReference();

    const senderWalletTransaction = await TransactionRepository.TransactionCreate({
      serviceType: enumType.serviceType.TRANSFER, 
      amount: transferAmount,
      user: user._id,
      userId: user.userId,
      transactionReference: reference,
      transactionId: Utility.getRandomInteger().toString().substring(1, 11),
      transactionType: enumType.transactionType.WALLET,
      transactionResource: enumType.serviceType.TRANSFER,
      paymentMethod: enumType.paymentMethod.WALLET,
      wallet: senderWallet._id,
      status: enumType.transactionStatus.SUCCESSFUL,
      serviceId: enumType.service.WALLET_TRANSFER,
      serviceName: 'WALLET_TRANSFER',
      initiatedAt: Date.now(),
      senderName: senderWallet.accountName,
      senderAccount: senderWallet.accountNumber,
      senderAddress: '',
      senderPhone: user.phone,
      senderId: user._id,
      recipientName: receiverWallet.accountName,
      recipientAccount: receiverWallet.accountNumber,
      recipientAddress: '',
      recipientPhone: receiver.phone,
      recipientId: receiver._id,
      preWalletBalance: senderWalletBalance,
      platform: enumType.platform.FYBAPAY,
      narration: narration ? narration : '',
    });

    const receiverWalletTransaction = await TransactionRepository.TransactionCreate({
      serviceType: enumType.serviceType.FUND, 
      amount: transferAmount,
      user: receiver._id,
      userId: receiver.userId, 
      transactionReference: reference,
      transactionId: Utility.getRandomInteger().toString().substring(1, 11),
      transactionType: enumType.transactionType.WALLET,
      transactionResource: enumType.serviceType.FUND,
      paymentMethod: enumType.paymentMethod.WALLET,
      wallet: receiverWallet._id,
      status: enumType.transactionStatus.SUCCESSFUL,
      serviceId: enumType.service.WALLET_TOPUP,
      serviceName: 'WALLET_TOPUP',
      initiatedAt: Date.now(),
      senderName: senderWallet.accountName,
      senderAccount: senderWallet.accountNumber,
      senderAddress: '',
      senderPhone: user.phone,
      senderId: user._id,
      recipientName: receiverWallet.accountName,
      recipientAccount: receiverWallet.accountNumber,
      recipientAddress: '',
      recipientPhone: receiver.phone,
      recipientId: receiver._id,
      preWalletBalance: receiverWalletBalance,
      platform: enumType.platform.FYBAPAY,
      narration: narration ? narration : '',
    });

    senderWallet.balance -= transferAmount;
    senderWallet.meta.updatedAt = Date.now();
    const newSenderWallet = await WalletRepository.saveWallet(senderWallet);
    senderWalletTransaction.postWalletBalance = newSenderWallet.balance;
    senderWalletTransaction.message = 'Transaction successful';
    senderWalletTransaction.paidAt = Date.now(); 
    const savedSenderWalletTransaction = await TransactionRepository.TransactionSave(senderWalletTransaction);

    receiverWallet.balance += transferAmount;
    receiverWallet.meta.updatedAt = Date.now();
    const newReceiverWallet = await WalletRepository.saveWallet(receiverWallet);
    receiverWalletTransaction.postWalletBalance = newReceiverWallet.balance;
    receiverWalletTransaction.message = 'Transaction successful';
    receiverWalletTransaction.paidAt = Date.now(); 
    const savedReceiverWalletTransaction = await TransactionRepository.TransactionSave(receiverWalletTransaction);

    Pubsub.emit('wallet_to_wallet_transfer', { 
      senderWalletTransaction: savedSenderWalletTransaction,
      sender: user,
      receiverWalletTransaction: savedReceiverWalletTransaction,
      receiver,
    });

    /**
     * Save beneficiary
     */
    if (request.body.saveBeneficiary === true || request.body.saveBeneficiary === 'true') {
      await BeneficiaryServices.createNewBeneficiary({
        user,
        userId: user.userId,
        transactionType: enumType.transactionType.W2W_TRANSFER,
        accountNumber: request.body.accountNumber,
        accountName: receiverWallet.accountName,
        bankName: receiverWallet.bankName,
        bankCode: receiverWallet.bankCode,
        phoneNumber: receiver.phone,
      })
    }

    return Utility.buildResponse({ data: senderWalletTransaction, message: 'Transaction successful' });
  },
  
  /**
   * Resolve Wallet Phone To AccountNumber
   * @param {} request 
   */
  async resolveWalletPhoneToAccountNumber(request: any) {
    const user = await UserRepository.findOneWithWallet({ phone: request.body.phone });
    if (!user) { throw new NotFoundError('Invalid account') };
    const { accountNumber, accountName, bankName,  bankCode } = user.wallet;
    return Utility.buildResponse({ data: { accountNumber, accountName, bankName,  bankCode } });
  },
  
  /**
   * Verify Wallet AccountNumber
   * @param {} request 
   */
  async verifyWalletAccountNumber(request: any) {
    const wallet = await WalletRepository.findByAccountNumber(request.body.accountNumber);
    if (!wallet) { throw new NotFoundError('Invalid account') };
    const { accountNumber, accountName, bankName,  bankCode } = wallet;
    return Utility.buildResponse({ data: { accountNumber, accountName, bankName,  bankCode } });
  },

  /**
   * Withdraw From Wallet Switch
   * @private
   */
  async withdrawFromWallet(request: any) {
    const user = await UserRepository.getUserById(request.user.id);
    if (!user) { throw new BadRequestError('User not found') };
    
    const serviceType = enumType.serviceType.WITHDRAW;
    const switchService = await ServiceSwitchRepository.findByServiceType(serviceType);
    if (!switchService) { throw new NotFoundError('Invalid service name or type, service not available') };
    
    if (request.body.saveBeneficiary === true || request.body.saveBeneficiary === 'true') {
      await BeneficiaryServices.createNewBeneficiary({
        user,
        userId: user.userId,
        phoneNumber: request.body.phone ? request.body.phone : "",
        transactionType: enumType.transactionType.WALLET,
        ...request.body,
      })
    }

    const wallet = await WalletRepository.getWalletByUserId(user._id);
    if(!wallet) { throw new NotFoundError('Wallet not found') };
    
    if (request.body.accountNumber === wallet.accountNumber) { throw new ForbiddenError('Same wallet transfer not allowed'); }

    switch (switchService.platform) {
      case enumType.platform.GLADEPAY:
        return await this.withdrawFromWalletGladePay(user, wallet, switchService, request.body);
      case enumType.platform.PRIMEAIRTIME:
        return await this.withdrawFromWalletPrimeAirTime(user, wallet, switchService,  request.body);
      case enumType.platform.PROVIDOUS:
        return await this.withdrawFromWalletProvidous(user, wallet, switchService, request.body);
      case enumType.platform.RUBIES:
        return await this.withdrawFromWalletRubies(user, wallet, switchService, request.body);  
      default:
        throw new InternalServerError('Switch service not available, please contact support');
    }
  },
  
  /**
   * Withdraw From Wallet Using GladePay
   * @private
   */
  async withdrawFromWalletGladePay(user: {}, wallet: {}, switchService: {}, params: { amount: number, accountNumber: string, accountName: string, bankName: string, bankCode: string, narration: string, phone: string }) {
    const { amount, accountNumber, accountName, bankName, bankCode, narration, phone } = params;

    /**
     * todo - Resolve bank code here or create a verify bank endpoint
    */
    // const bankDetails = await API_PAYSTACK.verifyBankDetails(accountNumber, bankCode);
    // if (bankDetails.error && bankDetails.statusCode === 422) { throw new BadRequestError(bankDetails.error); }
    // if (bankDetails.error) { throw new InternalServerError('Could not verify bank account at this time'); } // TODO - replicate this across funds transfer

    const withdrawAmount = Number(amount);
    
    // const { charges } = switchService;
    const charges = await this.computeWithdrawCharges(withdrawAmount, switchService.charges);

    let walletBalance = wallet.balance ? wallet.balance : 0;
    
    if (walletBalance <= 0) {
      throw new BadRequestError('Failure. Wallet balance less than 1');
    }

    if (withdrawAmount > wallet.limit) { 
      throw new BadRequestError(`Failure. Withdraw a maximum of ₦${wallet.limit}`);
    }
    
    if (walletBalance < (withdrawAmount + charges)) { 
      throw new PaymentRequiredError('Failure. Insufficient balance');
    }

    /**
     * Non BVN users have a daily transaction limit of 1000
     * sum both wallet daily total trx and service daily trx
     */
    const todayTransactionAmount = await TransactionRepository.sumTransactionAmountByUserIdAndFilter(user._id, { date: new Date(), status: enumType.transactionStatus.SUCCESSFUL });

    if (!todayTransactionAmount) {
      throw new NotFoundError('Failure. Could not retrieve daily transaction amount');
    }

    if (todayTransactionAmount.length > 0) {
      if (todayTransactionAmount[0].total) {

        if (wallet.limit === enumType.walletDailyLimit.KYC_ONE) {
          if (Number(todayTransactionAmount[0].total) >= Number(wallet.limit)) {
            throw new ForbiddenError('Failure. non-verified BVN users daily transaction limit exceeded!')
          }
        }

        /**
         * Check daily trx amount Against Wallet Limit
         */
        if (Number(todayTransactionAmount[0].total) > Number(wallet.limit)) {
          throw new ForbiddenError(`Failure. Daily transaction limit of ${wallet.limit} exceeded!`);
        }
      }
    }

    const reference = await Utility.generateTrxReference();

    const transaction = await TransactionRepository.TransactionCreate({
      narration: narration ? narration : '',
      serviceType: enumType.serviceType.WITHDRAW, 
      amount: withdrawAmount,
      user: user.id,
      userId: user.userId,
      transactionReference: reference,
      transactionId: Utility.getRandomInteger().toString().substring(1, 11),
      transactionType: enumType.transactionType.WALLET,
      transactionResource: enumType.serviceType.WITHDRAW,
      paymentMethod: enumType.paymentMethod.WALLET,
      wallet: wallet._id,
      status: enumType.transactionStatus.INIT,
      serviceId: enumType.service.WALLET_CASHOUT,
      serviceName: 'WALLET_CASHOUT',
      initiatedAt: Date.now(),
      senderName: wallet.accountName,
      senderAccount: wallet.accountNumber,
      senderAddress: '',
      senderPhone: user.phone,
      senderId: user.id,
      recipientName: `${accountName} (${bankName})`,
      recipientAccount: accountNumber,
      recipientAddress: '',
      recipientPhone: phone ? phone : user.phone, // todo - not required
      recipientId: user.id,
      preWalletBalance: walletBalance,
      platform: enumType.platform.GLADEPAY,
      charges: parseInt(charges, 10),
    });

    /**
     * Charge User wallet first before begining any transactions
     */
    let userWalletBal = (wallet.balance - (withdrawAmount + parseInt(charges, 10)));

    const chargeUserWallet = await WalletRepository.insertWallet({ _id: wallet._id }, {
      balance: userWalletBal,
      'meta.updatedAt': Date.now(),
    }, { new: true, upsert: false });

    if (!chargeUserWallet) {
      throw new NotFoundError('Could not charge user wallet')
    }

    /**
     * Make withdraw
     */
    const withdrawObject = {
      narration: narration ? narration : 'Trf Fybapay',
      action: 'transfer',
      amount: withdrawAmount,
      bankcode: bankCode, 
      accountnumber: accountNumber,
      sender_name: `${user.firstName} ${user.lastName}`,
      orderRef: reference
    };

    const withdrawResponse = await API_GLADE.gladePayDisburse(withdrawObject);
    transaction.responseBody = JSON.stringify(withdrawResponse);

    if (withdrawResponse.status === 200) {
      transaction.status = enumType.transactionStatus.PENDING;
      transaction.client_transactionReference = withdrawResponse.txnRef ? withdrawResponse.txnRef:  '';
      transaction.client_statusCode = String(withdrawResponse.status);
      transaction.message = withdrawResponse.message ? withdrawResponse.message : 'Withdrawal pending';
      transaction.paidAt = Date.now();
      transaction.meta.updatedAt = Date.now();
      await TransactionRepository.TransactionSave(transaction);

      /**
       * @todo - move Pubsub to transaction verify on successful
       * Pubsub.emit('wallet_withdraw', { transaction: savedTrx, user });
       */
      return Utility.buildResponse({ data: transaction, message: 'Transaction Successful'});
    } 
    else if (withdrawResponse.status === 301) {
      /**
       * Transaction failed return user amount and charges to wallet
       */
      userWalletBal = wallet.balance;
    
      await WalletRepository.insertWallet({ _id: wallet._id }, {
        balance: userWalletBal,
        'meta.updatedAt': Date.now(),
      }, { new: false, upsert: false });

      transaction.status = enumType.transactionStatus.FAILED;
      transaction.message = withdrawResponse.message;
      transaction.client_statusCode = withdrawResponse.confirmationCode;
      transaction.commission = 0;
      transaction.charges = 0;
      transaction.postWalletBalance = transaction.preWalletBalance;
      transaction.meta.updatedAt = Date.now();
      await TransactionRepository.TransactionSave(transaction);
      Pubsub.emit('wallet_withdraw_failed_insufficient_bal', { transaction, user });
      
      throw new InternalServerError('Transaction failed please contact support');
      // return Utility.buildFailedResponse({ data: transaction, message: 'Transaction failed please contact support' });
    }
    else {
      /**
       * Transaction failed return user amount and charges to wallet
       */
      userWalletBal = wallet.balance;
    
      await WalletRepository.insertWallet({ _id: wallet._id }, {
        balance: userWalletBal,
        'meta.updatedAt': Date.now(),
      }, { new: false, upsert: false });

      transaction.status = enumType.transactionStatus.FAILED;
      transaction.message = withdrawResponse.message;
      transaction.client_statusCode = withdrawResponse.confirmationCode;
      transaction.postWalletBalance = transaction.preWalletBalance;
      transaction.commission = 0;
      transaction.charges = 0;
      transaction.meta.updatedAt = Date.now();
      await TransactionRepository.TransactionSave(transaction);
      Pubsub.emit('wallet_withdraw_failed', { transaction, user });
      
      throw new InternalServerError('Transaction failed');
      // return Utility.buildFailedResponse({ data: transaction, message: 'Transaction failed' });
    }
    
  },
  
  /**
   * Resolve GladePay Withdraw Transactions
   * @private
   * @description - Run on schedular
   * @todo - schedular
   */
  async resolveGladePayWithdrawTransactions() {
    const transactions = await TransactionRepository
      .findByServiceTypeAndStatusAndPlatform(enumType.serviceType.WITHDRAW, enumType.transactionStatus.PENDING, enumType.platform.GLADEPAY);
    if (!transactions || transactions.length < 1) {
      console.log('No pending Gladepay withdrawal transactions at this time');
      return;
    }

    for (let i = 0; i < transactions.length; i++) {
      const resolveResponse = await API_GLADE.gladePayDisburse({ action: 'verify', txnRef: transactions[i].transactionReference });
      
      if (resolveResponse.status === 200 && resolveResponse.txnStatus != null && resolveResponse.txnStatus === 'successful') {
        const user = await UserRepository.getUserById(transactions[i].user);
        transactions[i].status = enumType.transactionStatus.SUCCESSFUL;
        transactions[i].meta.updatedAt = Date.now();
        const savedTrx = await TransactionRepository.TransactionSave(transactions[i]);

        Pubsub.emit('wallet_withdraw', { transaction: savedTrx, user });
      }
      else if (resolveResponse.status === 200 && resolveResponse.txnStatus != null && resolveResponse.txnStatus === 'pending') {
        transactions[i].status = enumType.transactionStatus.PENDING;
        transactions[i].meta.updatedAt = Date.now();
        await TransactionRepository.TransactionSave(transactions[i]);
      }
      else if (resolveResponse.status === 200 && resolveResponse.txnStatus != null && resolveResponse.txnStatus === 'failed') {
        const wallet = await WalletRepository.getWalletById(transactions[i].wallet);

        transactions[i].status = enumType.transactionStatus.FAILED;
        transactions[i].meta.updatedAt = Date.now();
        transactions[i].postWalletBalance = transactions[i].preWalletBalance;
        await TransactionRepository.TransactionSave(transactions[i]);

        wallet.balance += (transactions[i].amount + transactions[i].charges);
        wallet.meta.updatedAt = Date.now();
        await WalletRepository.saveWallet(wallet);
      }
    }
  },

  /**
   * withdraw From Wallet PrimeAirTime
   * @param {*} user 
   * @param {*} params 
   * @param {*} switchService
   * @private 
   */
  async withdrawFromWalletPrimeAirTime(user: {}, wallet: {}, switchService: {}, params: { amount: number, accountNumber: string, accountName: string, bankName: string, bankCode: string, narration: string, phone: string }) {
    const { amount, accountNumber, accountName, bankName, bankCode, narration, phone } = params;
    
    const bank = await BankHelper.getprimeAirtimeBankByBankCode(bankCode);
    if (!bank) { throw new NotFoundError(`Bank with bank code: ${bankCode} not found`); }
    
    const withdrawAmount = Number(amount);
    
    // const { charges } = switchService;
    const charges = await this.computeWithdrawCharges(withdrawAmount, switchService.charges);


    let walletBalance = wallet.balance ? wallet.balance : 0;
    
    if (walletBalance <= 0) {
      throw new BadRequestError('Failure. Wallet balance less than 1');
    }

    if (withdrawAmount > wallet.limit) { 
      throw new BadRequestError(`Failure. Withdraw a maximum of ₦${wallet.limit}`);
    };
    
    if (walletBalance < (withdrawAmount + charges)) { 
      throw new PaymentRequiredError('Failure. Insufficient balance');
    };

    /**
     * Non BVN users have a daily transaction limit of 1000
     * sum both wallet daily total trx and service daily trx
     */
    const todayTransactionAmount = await TransactionRepository.sumTransactionAmountByUserIdAndFilter(user._id, { date: new Date(), status: enumType.transactionStatus.SUCCESSFUL });

    if (!todayTransactionAmount) {
      throw new NotFoundError('Failure. Could not retrieve daily transaction amount');
    }

    if (todayTransactionAmount.length > 0) {
      if (todayTransactionAmount[0].total) {

        if (wallet.limit === enumType.walletDailyLimit.KYC_ONE) {
          if (Number(todayTransactionAmount[0].total) >= Number(wallet.limit)) {
            throw new ForbiddenError('Failure. non-verified BVN users daily transaction limit exceeded!')
          }
        }

        /**
         * Check daily trx amount Against Wallet Limit
         */
        if (Number(todayTransactionAmount[0].total) > Number(wallet.limit)) {
          throw new ForbiddenError(`Failure. Daily transaction limit of ${wallet.limit} exceeded!`);
        }
      }
    }

    const reference = await Utility.generateTrxReference();

    const transaction = await TransactionRepository.TransactionCreate({
      narration: narration ? narration : '',
      serviceType: enumType.serviceType.WITHDRAW, 
      amount: withdrawAmount,
      user: user.id,
      userId: user.userId,
      transactionReference: reference,
      transactionId: Utility.getRandomInteger().toString().substring(1, 11),
      transactionType: enumType.transactionType.WALLET,
      transactionResource: enumType.serviceType.WITHDRAW,
      paymentMethod: enumType.paymentMethod.WALLET,
      wallet: wallet._id,
      status: enumType.transactionStatus.INIT,
      serviceId: enumType.service.WALLET_CASHOUT,
      serviceName: 'WALLET_CASHOUT',
      initiatedAt: Date.now(),
      senderName: wallet.accountName,
      senderAccount: wallet.accountNumber,
      senderAddress: '',
      senderPhone: user.phone,
      senderId: user.id,
      recipientName: `${accountName} (${bankName})`,
      recipientAccount: accountNumber,
      recipientAddress: '',
      recipientPhone: phone ? phone : user.phone, // todo - not required
      recipientId: user.id,
      preWalletBalance: walletBalance,
      platform: enumType.platform.PRIMEAIRTIME,
      charges: parseInt(charges, 10),
    });

    /**
     * Charge User wallet first before begining any transactions
     */
    let userWalletBal = (wallet.balance - (withdrawAmount + parseInt(charges, 10)));

    const chargeUserWallet = await WalletRepository.insertWallet({ _id: wallet._id}, {
      balance: userWalletBal,
      'meta.updatedAt': Date.now(),
    }, { new: true, upsert: false });

    if (!chargeUserWallet) {
      throw new NotFoundError('Could not charge user wallet')
    }

    /**
     * Make Transfer
     */
    const requestData = {
      amount: withdrawAmount,
      customer_reference: reference,
    }

    const requestResult = await PRIMEAIRTIME_API.transferWithPrimeAirtime(bank.sortCode, accountNumber, requestData, switchService.platformToken);
    transaction.responseBody = JSON.stringify(requestResult);

    if (requestResult && requestResult.status === 200 || requestResult.status === 201) {
      transaction.status = enumType.transactionStatus.PENDING;
      transaction.client_transactionReference = requestResult.reference;
      transaction.client_statusCode = String(requestResult.status);
      transaction.message = 'Transaction pending';
      transaction.paidAt = Date.now();
      transaction.meta.updatedAt = Date.now();
      await TransactionRepository.TransactionSave(transaction);

      /**
       * @todo - move Pubsub to transaction verify on successful
       * Pubsub.emit('wallet_transfer', { transaction, user });
       */
      return Utility.buildResponse({ data: transaction, message: 'Transaction Successful' });
    }
    else if (requestResult.error && requestResult.error.code && requestResult.error.code === 'ECONNABORTED') {
      /**
       * Trx not confirmed put on pending
       */
      // todo - set trx to pending send 200
      transaction.status = enumType.transactionStatus.PENDING;
      transaction.client_statusCode = String(requestResult.status);
      transaction.message = 'Transaction pending';
      transaction.paidAt = Date.now();
      transaction.meta.updatedAt = Date.now();
      await TransactionRepository.TransactionSave(transaction);
      
      return Utility.buildResponse({ data: transaction, message: 'Transaction Processed' });
    }
    else {
      /**
       * Transaction failed return user amount and charges to wallet
       */
      userWalletBal = wallet.balance;
    
      await WalletRepository.insertWallet({ _id: wallet._id }, {
        balance: userWalletBal,
        'meta.updatedAt': Date.now(),
      }, { new: false, upsert: false });

      transaction.status = enumType.transactionStatus.FAILED;
      transaction.message = 'Transaction Failed';
      transaction.commission = 0;
      transaction.charges = 0;
      transaction.client_statusCode = requestResult.status
      transaction.postWalletBalance = transaction.preWalletBalance;
      transaction.meta.updatedAt = Date.now();
      await TransactionRepository.TransactionSave(transaction);

      Pubsub.emit('wallet_withdraw_failed', { transaction, user });
      
      let errorMessage = requestResult.message ? requestResult.message : 'Service not available at the moment';
      if (requestResult.status === 402) {
        return Utility.buildFailedResponse({ message: errorMessage });
      }
      throw new InternalServerError(`${errorMessage}`);
    }
  },
  
  /**
   * withdrawFromWalletProvidous
   * @todo - integrate payment with providous
   */
  async withdrawFromWalletProvidous(request) {
    throw new InternalServerError('Server Error, contact support immediately');
  },

  /**
   * withdrawFromWalletRubies
   * @param {Object} user 
   * @param {Object} wallet 
   * @param {Object} switchService 
   * @param {Object} params 
   */
  async withdrawFromWalletRubies(user: {}, wallet: {}, switchService: {}, params: { amount: number, accountNumber: string, accountName: string, bankName: string, bankCode: string, narration: string, phone: string }) {
    const { amount, accountNumber, accountName, bankName, bankCode, narration, phone } = params;

    /**
     * Check prime, and also check main list
     */
    const bank = await BankHelper.getRubiesBankByBankCode(bankCode);

    if (!bank) { throw new NotFoundError(`Bank with bank code: ${bankCode} not found`); }
    
    const withdrawAmount = Number(amount);
    
    // const { charges } = switchService;
    const charges = await this.computeWithdrawCharges(withdrawAmount, switchService.charges);

    let walletBalance = wallet.balance ? wallet.balance : 0;
    
    if (walletBalance <= 0) {
      throw new BadRequestError('Failure. Wallet balance less than 1');
    }

    if (withdrawAmount > wallet.limit) { 
      throw new BadRequestError(`Failure. Withdraw a maximum of ₦${wallet.limit}`);
    };
    
    if (walletBalance < (withdrawAmount + charges)) { 
      throw new PaymentRequiredError('Failure. Insufficient balance');
    };

        /**
     * Non BVN users have a daily transaction limit of 1000
     * sum both wallet daily total trx and service daily trx
     */
    const todayTransactionAmount = await TransactionRepository.sumTransactionAmountByUserIdAndFilter(user._id, { date: new Date(), status: enumType.transactionStatus.SUCCESSFUL });

    if (!todayTransactionAmount) {
      throw new NotFoundError('Failure. Could not retrieve daily transaction amount');
    }

    if (todayTransactionAmount.length > 0) {
      if (todayTransactionAmount[0].total) {

        if (wallet.limit === enumType.walletDailyLimit.KYC_ONE) {
          if (Number(todayTransactionAmount[0].total) >= Number(wallet.limit)) {
            throw new ForbiddenError('Failure. non-verified BVN users daily transaction limit exceeded!')
          }
        }

        /**
         * Check daily trx amount Against Wallet Limit
         */
        if (Number(todayTransactionAmount[0].total) > Number(wallet.limit)) {
          throw new ForbiddenError(`Failure. Daily transaction limit of ${wallet.limit} exceeded!`);
        }
      }
    }

    const reference = await Utility.generateTrxReference();

    const transaction = await TransactionRepository.TransactionCreate({
      narration: narration ? narration : '',
      serviceType: enumType.serviceType.WITHDRAW, 
      amount: withdrawAmount,
      user,
      userId: user.userId,
      transactionReference: reference,
      transactionId: Utility.getRandomInteger().toString().substring(1, 11),
      transactionType: enumType.transactionType.WALLET,
      transactionResource: enumType.serviceType.WITHDRAW,
      paymentMethod: enumType.paymentMethod.WALLET,
      wallet,
      status: enumType.transactionStatus.INIT,
      serviceId: enumType.service.WALLET_CASHOUT,
      serviceName: 'WALLET_CASHOUT',
      initiatedAt: Date.now(),
      senderName: wallet.accountName,
      senderAccount: wallet.accountNumber,
      senderAddress: '',
      senderPhone: user.phone,
      senderId: user.id,
      recipientName: `${accountName} (${bankName})`,
      recipientAccount: accountNumber,
      recipientAddress: '',
      recipientPhone: phone ? phone : user.phone, // todo - not required
      recipientId: user,
      preWalletBalance: walletBalance,
      platform: enumType.platform.RUBIES,
      charges: parseInt(charges, 10),
    });

    /**
     * Charge User wallet first before begining any transactions
     */
    let userWalletBal = (wallet.balance - (withdrawAmount + parseInt(charges, 10)));

    const chargeUserWallet = await WalletRepository.insertWallet({ _id: wallet._id}, {
      balance: userWalletBal,
      'meta.updatedAt': Date.now(),
    }, { new: true, upsert: false });

    if (!chargeUserWallet) {
      throw new NotFoundError('Could not charge user wallet')
    }


    /**
     * Make Transfer
     */
    const requestData = {
      reference,
      amount: withdrawAmount,
      narration: narration ? narration : 'Trf Fybapay',
      craccountname: accountName,
      bankname: bankName, 
      draccountname: RUBIES_DR_ACCOUNTNAME,
      craccount: accountNumber,
      bankcode: bank.sortCode,
    }
    
    const requestResult = await RUBIES_API.transferViaRubies(requestData);
    transaction.responseBody = JSON.stringify(requestResult);

    if (requestResult && requestResult.responsecode === '00' && requestResult.transactionstatus === 'Success') {
      transaction.status = enumType.transactionStatus.PENDING;
      transaction.client_transactionReference = requestResult.sessionid;
      transaction.client_statusCode = String(requestResult.responsecode);
      transaction.message = 'Transaction pending';
      transaction.paidAt = Date.now();
      transaction.meta.updatedAt = Date.now();
      await TransactionRepository.TransactionSave(transaction);

      /**
       * @todo - move Pubsub to transaction verify on successful
       * Pubsub.emit('wallet_transfer', { transaction, user });
       */
      return Utility.buildResponse({ data: transaction, message: 'Transaction Successful' });
    }
    else if (requestResult.responsecode === '33' || requestResult.responsecode === '14') { // Transaction Failed
      console.log({
        FAILED: requestResult.responsecode
      })
      /**
       * Transaction failed return user amount and charges to wallet
       */
      userWalletBal = wallet.balance;

      await WalletRepository.insertWallet({ _id: wallet._id }, {
        balance: userWalletBal,
        'meta.updatedAt': Date.now(),
      }, { new: false, upsert: false });

      transaction.status = enumType.transactionStatus.FAILED;
      transaction.message = requestResult.responsemessage ? requestResult.responsemessage : 'Transaction Failed';
      transaction.commission = 0;
      transaction.charges = 0;
      transaction.client_statusCode = requestResult.responsecode
      transaction.postWalletBalance = transaction.preWalletBalance;
      transaction.meta.updatedAt = Date.now();
      await TransactionRepository.TransactionSave(transaction);

      Pubsub.emit('wallet_transfer_failed', { transaction, user });
    
      throw new InternalServerError('Transaction failed');
    } 
    else {
      console.log({
        PUTONPENDING: requestResult.responsecode
      })
      /**
       * Trx not confirmed put on pending
       */
      transaction.status = enumType.transactionStatus.PENDING;
      transaction.client_statusCode = String(requestResult.responsecode);
      transaction.message = 'Transaction pending';
      transaction.paidAt = Date.now();
      transaction.meta.updatedAt = Date.now();
      await TransactionRepository.TransactionSave(transaction);
      
      return Utility.buildResponse({ data: transaction, message: 'Transaction Processed' });
    }

  },


  async withdrawFromWalletToGrowWealth() {},

  /**
   * Get Wallet Withdrawal Charges
   * @private
   */
  async getWalletWithdrawCharges(request) {
    const amount = Number(request.query.amount);
    const user = await UserRepository.getUserByIdWithWallet(request.user.id);
    if (!user) { throw new NotFoundError('User not found') };

    const serviceType = enumType.serviceType.WITHDRAW;
    const switchService = await ServiceSwitchRepository.findByServiceType(serviceType);
    if (!switchService) { 
      throw new NotFoundError('Invalid service name or type, service not available');
    }
    
    if (amount > user.wallet.limit) {
      throw new BadRequestError(`Withdrawal limit ₦${user.wallet.limit}`)
    }

    let userDailyAllowedTransaction = Number(user.wallet.limit);
    
    // user Daily Available Transaction
    const todayTransactionAmount = await TransactionRepository.sumTransactionAmountByUserIdAndFilter(user._id, { date: new Date(), status: enumType.transactionStatus.SUCCESSFUL });

    if (!todayTransactionAmount) {
      throw new NotFoundError('Failure. Could not retrieve daily transaction amount');
    }

    /**
     * check total amount exist is array
     */
    if (todayTransactionAmount.length > 0) {
      if (todayTransactionAmount[0].total) {
        let amount = Number(user.wallet.limit) - todayTransactionAmount[0].total;

        if (amount < 1) {
          userDailyAllowedTransaction = 0
        }
        else {
          userDailyAllowedTransaction = amount;
        }
      }
    }

    // return error if amount exceeds user daily allowed transaction
    if (userDailyAllowedTransaction < 1) {
      throw new ForbiddenError('Failure. Daily transaction limit exceeded');
    }
    
    const charges = await this.computeWithdrawCharges(amount, switchService.charges);

    return Utility.buildResponse({ 
      message: `Withdrawal charge of ₦${charges}`,
      charges,
      userDailyAllowedTransaction: parseInt(userDailyAllowedTransaction, 10),
    });
  },

  /**
   * computeWithdrawCharges
   * @param {Number} amount 
   * @param {Number} switchServiceCharge
   * @private
   */
  async computeWithdrawCharges(amount: number, switchServiceCharge: number) {
    let charges = switchServiceCharge;

    if (amount < 200000) {
      charges = switchServiceCharge; 
    }
    else if ((amount >= 200000) && (amount < 300000)) {
      charges = 50;
    }
    else {
      charges = 100;
    }

    return charges;
  },

  /** 
   * Refund 
   * @private
   * @description - user is refunded by an admin
   */
  async refundWallet(request) {
    const { transactionReference, narration } = request.body;
    const adminUser = await UserRepository.getUserById(request.user.id);
    if (!adminUser ) { throw new NotFoundError('Privilege user not found') };
    // if (adminUser.role !== enumType.rolesType.ADMIN || adminUser.role !== enumType.rolesType.SUPERADMIN) { throw new UnauthorizedError('Access Denied'); }
    if (adminUser.role !== enumType.rolesType.SUPERADMIN) { throw new UnauthorizedError('Access Denied'); }

    const transaction = await TransactionRepository.findByTransactionReference(transactionReference);
    if (!transaction) { throw new NotFoundError('Transaction not found'); }
    if (transaction.status !== enumType.transactionStatus.FAILED) { throw new ForbiddenError('Refund only failed transactions'); }
    if (transaction.isTransactionRefunded || transaction.status === enumType.transactionStatus.REFUND) { throw new ForbiddenError('Transaction already refunded'); }
    
    const user = await UserRepository.getUserById(transaction.user._id);
    if (!user) { throw new NotFoundError('User not found') }

    const receiverWallet = await WalletRepository.getWalletByUserId(user._id);
    if (!receiverWallet) { throw new NotFoundError('User wallet not found') };
    
    let commissionWallet;
    if (transaction.commission && transaction.commission > 0) {
      commissionWallet = await CommissionRepository.getCommissionWalletByUserId(user._id);
      if (!commissionWallet) { throw new NotFoundError('Commission wallet not found'); }
    }
    const reference = await Utility.generateTrxReference();

    const totalTransactionAmountUsed = transaction.amount + transaction.charges

    /**
     * create refund trx
     */
    const refundTransaction = await TransactionRepository.TransactionCreate({
      narration: narration ? narration : '',
      serviceType: transaction.serviceType, // enumType.serviceType.REFUND , 
      amount: transaction.amount,
      user: user._id,
      userId: user.userId,
      transactionReference: reference,
      transactionId: Utility.getRandomInteger().toString().substring(1, 11),
      transactionType: transaction.transactionType, //  enumType.transactionType.WALLET,
      transactionResource: transaction.transactionResource, // enumType.serviceType.REFUND,
      paymentMethod: enumType.paymentMethod.DIRECT_CREDIT,
      wallet: transaction.wallet,
      status: enumType.transactionStatus.REFUND,
      
      serviceId: enumType.service.WALLET_REFUND,
      serviceName: 'WALLET_REFUND',
      
      recipientName: receiverWallet.accountName,
      recipientAccount: receiverWallet.accountNumber,
      recipientAddress: '',
      recipientPhone: user.phone,
      recipientId: user._id,
      
      senderName: `${enumType.platform.FYBAPAY}/Admin`,
      senderAccount: enumType.platform.FYBAPAY,
      senderAddress: enumType.platform.FYBAPAY,
      senderPhone: enumType.contacts.SUPPORT,
      senderId: adminUser.id,
      
      initiatedAt: Date.now(),
      platform: enumType.platform.FYBAPAY,
      message: 'Refund Successful - RVSR',
      paidAt:  Date.now(),
      preWalletBalance: receiverWallet.balance,
      postWalletBalance: receiverWallet.balance + totalTransactionAmountUsed,
      isRefundedTransaction: true,
      sourceTransactionRefunded: transaction,
      refundedCharges: transaction.charges,
    });

    /**
     * refund money to user wallet
     */
    receiverWallet.balance += totalTransactionAmountUsed;
    receiverWallet.meta.updatedAt = Date.now();
    const updatedWallet = await WalletRepository.saveWallet(receiverWallet);
    
    /**
     * update origin trx
     */
    await TransactionRepository.TransactionInsert({ _id: transaction._id }, {
      isTransactionRefunded: true,
      // status: enumType.transactionStatus.REFUND, FAILED
      destinationTransactionRefunded: refundTransaction,
      'meta.updatedA': Date.now()
    }, { new: true, upsert: false })

    /**
     * @todo - what if u need to subtract from user commission wallet but no cash ?
     * @todo - how do we handle subtracting from empty wallet (negative value)
     * remove commission earned
     * create commission history
     */
    if (commissionWallet && transaction.commission && transaction.commission > 0) {
      commissionWallet.balance -= transaction.commission;
      commissionWallet.meta.updatedAt = Date.now();
      commissionWallet.overallEarnings -= transaction.commission;
      await CommissionRepository.saveCommission(commissionWallet);

      await CommissionRepository.createCommissionHistory({
        commission: 0,
        transaction,
        user: user._id,
        userId: user.userId,
        wallet: receiverWallet._id,
        preCommissionBalance: commissionWallet.balance,
        postCommissionBalance: commissionWallet.balance - transaction.commission,
        commissionWallet
      });
    }
    
    Pubsub.emit('wallet_refund', { sender: adminUser, user, receiverWallet, refundTransaction, transaction });
    return Utility.buildResponse({ 
      data: { destinationTransactionRefunded: refundTransaction, sourceTransactionRefunded: transaction }, 
      message: 'Refund successful' });
  },
  
  async viewUserTransactionFilter() {},
  async viewUserWalletTransaction() {},

  /**
   * Payment Notification Monify Webhook
   * @private
   * @todo - test webhook
   */
  async paymentNotificationMonifyWebhook(request) {

    const { 
      transactionReference,
      totalPayable, 
      paymentReference,
      paymentStatus,
      paymentDescription,
      paidOn,
      amountPaid,
      paymentMethod,
      accountDetails,
      product,
    } = request.body;

    let transaction = await TransactionRepository.findOne({ client_transactionReference: transactionReference });
    if (transaction && paymentStatus === 'PAID') { throw new ForbiddenError('transaction already exist'); };
    if (request.body) {
      await this.saveMonifyPaymentNotification(request);
    }

    if (paymentStatus && paymentStatus === 'PAID') {
      /**
       * when a paid payment is received call verify to ensure transaction originate from monnify
       */
      const result = await API_MONIFY.verifyMonifyTransaction(transactionReference);
      if (!result) { throw new BadRequestError('Invalid transactionReference'); }

      if (result && result.responseBody.paymentStatus === 'PAID') {
        let wallet = await WalletRepository.getWalletByMonifyAccountReference(product.reference);
        if (!wallet) { throw new BadRequestError('Invalid accountReference'); };
        
        const user = await UserRepository.getUserById(wallet.user._id);
        if (!user) { throw new NotFoundError('User not found'); }
        
        const reference = await Utility.generateTrxReference();
  
        const fundAmount = result.responseBody.amount ? result.responseBody.amount : amountPaid;
        
        let charges = await this.computeFundWalletCharge(user.role);
        
        /**
         * @desc - Prevent unverified users from funding less than wallet fund charge
         */
        if ((charges > 0) && (fundAmount <= 50)) {
          throw new BadRequestError('Amount not sufficient to fund account for non verified users');
          // return Utility.buildFailedResponse({ message: 'Received' });
        } 

        /**
         * charges cannot be greater than funded amt
         * */ 
        if (charges > fundAmount) {
          throw new BadRequestError('Amount not sufficient to fund account. Charges greater than Fund amount');
        }
        /**
         * check if user have funded today
         * {serviceType: "FUND", platform: 'MONIFY', status: 'Successful'}
         */
        const fundedWalletTodayAlready = await TransactionRepository.findUserTransactionByDateServiceTypePlatformAndStatus(user._id, {
          serviceType: enumType.serviceType.FUND,
          status: enumType.transactionStatus.SUCCESSFUL,
          platform: enumType.platform.MONIFY,
          date: new Date(),
        });
        
        if (fundedWalletTodayAlready && fundedWalletTodayAlready.length > 0) {
          // TODO -
          // User already funded wallet today....
          // Set charge after first time to 50
          charges = AppConstant.FUND_WALLET_CHARGE_AMOUNT;
        }

        const transaction = await TransactionRepository.TransactionCreate({
          charges,
          narration: paymentDescription,
          serviceType: enumType.serviceType.FUND,
          amount: parseInt(fundAmount, 10),
          user: user._id,
          userId: user.userId,
          transactionReference: reference,
          transactionId: Utility.getRandomInteger().toString().substring(1, 11),
          transactionType: enumType.transactionType.WALLET,
          transactionResource: enumType.serviceType.FUND,
          paymentMethod: enumType.paymentMethod.ACCOUNT_TRANSFER,
          wallet: wallet._id,
          status: enumType.transactionStatus.SUCCESSFUL,
          serviceId: enumType.service.WALLET_TOPUP,
          serviceName: 'WALLET_TOPUP',
          initiatedAt: result.responseBody.createdOn ? result.responseBody.createdOn : Date.now(),
          paidAt: result.responseBody.completedOn ? result.responseBody.completedOn : Date.now(),
          senderName: accountDetails && accountDetails.accountName ? accountDetails.accountName : '',
          senderAccount: accountDetails && accountDetails.accountNumber ? accountDetails.accountNumber : '',
          senderAddress: '',
          senderPhone: user.phone,
          senderId: user.id,
          recipientName: wallet.accountName,
          recipientAccount: wallet.accountNumber,
          recipientAddress: '',
          recipientPhone: user.phone,
          recipientId: user._id,
          preWalletBalance: wallet.balance,
          postWalletBalance: wallet.balance + parseInt(fundAmount, 10),
          platform: enumType.platform.MONIFY,
          message: 'Transaction Successful',
          client_transactionReference: transactionReference ? transactionReference : '',
          client_paymentReference: paymentReference ? paymentReference : '',
          client_statusCode: '0',
          responseBody: JSON.stringify(request.body),
          totalPayable: parseInt(fundAmount, 10),
        });
        
        /**
         * For verified users, Charges = 0
         * Non verified users, Charges = 50 Naira
         * 
         * If both fund wallet with amount > 50
         * Deduct charges
         * 
         * Else
         */

        let userWalletBal = (wallet.balance + (parseInt(fundAmount, 10) - charges));
        wallet = await WalletRepository.insertWallet({ _id: wallet._id }, {
          balance: userWalletBal,
          'meta.updatedAt': Date.now(),
        }, { new: true, upsert: false });

        // if (fundAmount > 50) {
        // }
        // else {
        //   if (charges > 0) {
            // throw new BadRequestError('Amount not sufficient to fund account for non verified users');
        //   }
        //   else {
          //   const userWalletBal = (wallet.balance + (parseInt(fundAmount, 10)));
          //   wallet = await WalletRepository.insertWallet({ _id: wallet._id }, {
          //     balance: userWalletBal,
          //     'meta.updatedAt': Date.now(),
          //   }, { new: true, upsert: false });
        //   }
        // }

        // await this.fundWalletChargeTransaction(wallet, user, fundAmount);
        
        /**
         * Charge wallet funding
         */
        // if (charges > 0 && fundAmount > 50) { // CHARGE FOR DEPOSIT, IF USER DEPOSIT IS GREATER THAN 50 NAIRA
        // }

        Pubsub.emit('wallet_fund', { user, wallet, transaction });
        
        return Utility.buildResponse({ message: 'Received'});
      }
    }

    return Utility.buildFailedResponse({ message: 'Received' });
  },

  /**
   * computeFundWalletCharge
   * @param {String} role
   * @private
   */
  async computeFundWalletCharge(role: string) {
    switch (role) {
      case enumType.rolesType.AGENT:
        return AppConstant.FUND_WALLET_CHARGE_AMOUNT_AGENT;
      case enumType.rolesType.SUPERAGENT:
        return AppConstant.FUND_WALLET_CHARGE_AMOUNT_SUPERAGENT;
      default:
        return AppConstant.FUND_WALLET_CHARGE_AMOUNT;
    }
  },

  /**
   * fundWalletChargeTransaction
   * @param {*} params
   * @private
   */
  async fundWalletChargeTransaction(wallet, user, fundAmount) {
    const reference = await Utility.generateTrxReference();

    let amount = await this.computeFundWalletCharge(user.role);

    if (amount > 0 && fundAmount > 50) { // CHARGE FOR DEPOSIT, IF USER DEPOSIT IS GREATER THAN 50 NAIRA
      const transaction = await TransactionRepository.TransactionCreate({
        narration: 'Fund deposit charge',
        serviceType: enumType.serviceType.FUND, 
        amount,
        user: user._id,
        userId: user.userId,
        transactionReference: reference,
        transactionId: Utility.getRandomInteger().toString().substring(1, 11),
        transactionType: enumType.transactionType.WALLET,
        transactionResource: enumType.serviceType.FUND,
        paymentMethod: enumType.paymentMethod.WALLET,
        wallet,
        status: enumType.transactionStatus.SUCCESSFUL,
        serviceId: enumType.service.FUND_DEPOSIT,
        serviceName: 'FUND_DEPOSIT',
        recipientName: `${enumType.platform.FYBAPAY}`,
        // recipientAccount: enumType.platform.FYBAPAY,
        // recipientAddress: enumType.platform.FYBAPAY,
        // recipientPhone: enumType.contacts.SUPPORT,
        // recipientId: receiver._id,
        // senderName: `${user.firstName} ${user.lastName}`,
        // senderAccount: user.wallet.accountNumber,
        // senderAddress: '',
        // senderPhone: user.phone,
        // senderId: user._id,
        initiatedAt: Date.now(),
        platform: enumType.platform.FYBAPAY,
        message: 'Fund deposit charge',
        paidAt:  Date.now(),
        preWalletBalance: wallet.balance,
        postWalletBalance: wallet.balance - amount,
      });
  
      const userWalletBal = (wallet.balance - parseInt(amount, 10));

      wallet.balance = userWalletBal;
      wallet.meta.updatedAt = Date.now();
      await WalletRepository.saveWallet(wallet);
    }
  },

  /**
   * Verify Monify Payment
   */
  async verifyPaymentMonify(request) {
    const result = await API_MONIFY.verifyMonifyTransaction(request.query.transactionReference);
    if (!result) { throw new BadRequestError('Transaction not found') }
    return Utility.buildResponse({ data: result.responseBody })
  },

  /**
   * verifyMonifyPaymentAndUpdateUserWallet
   * @param {} userId 
   * @param {} paymentNotification 
   * @param {} transactionId 
   */
  async verifyMonifyPaymentAndUpdateUserWallet(userId, paymentNotification, transactionId: string) {
    const result = await API_MONIFY.verifyMonifyTransaction(paymentNotification.transactionReference);

    /**
     * .....
     * @todo 
     */
  },

  /**
   * Save Monify Payment Notification
   * @param {} request 
   */
  async saveMonifyPaymentNotification(request) {
    const { 
      accountReference,
      transactionReference,
      paymentReference,
      transactionHash,
      totalPayable, 
      paymentStatus,
      paymentDescription,
      paidOn,
      amountPaid,
      paymentMethod
    } = request.body;

    // check if payment was saved already, else proceeed
    const transactionExist = await PaymentNotificationRepository.findOnePaymentNotification({ transactionReference });
    if (!transactionExist) {
      await PaymentNotificationRepository.createPaymentNotification({
        accountReference,
        transactionReference,
        paymentReference,
        amountPaid,
        paidOn,
        paymentDescription,
        paymentStatus,
        totalPayable,
        transactionHash,
        paymentMethod,
        notificationBody: JSON.stringify(request.body),
      });
    }

    return;
  },

  /**
   * getAllPaymentNotificationsAndFilter
   * @param {object} request 
   */
  async getAllPaymentNotificationsAndFilter(request) {
    const paymentNotifications = await PaymentNotificationRepository.getAllPaymentNotificationsAndFilter(request.query);
    if (!paymentNotifications.data) { throw new NotFoundError('paymentNotifications not found') };
    return Utility.buildResponse({ ...paymentNotifications });
  },

  /**
   * Charge wallet Bvn charge
   * @private
   */
  async bvnWalletCharge(params: { amount: number, user: {} }) {
    const { amount, user } = params;
    const reference = await Utility.generateTrxReference();

    const transaction = await TransactionRepository.TransactionCreate({
      narration: 'Bvn charge',
      serviceType: enumType.serviceType.BVN, 
      amount,
      user: user._id,
      userId: user.userId,
      transactionReference: reference,
      transactionId: Utility.getRandomInteger().toString().substring(1, 11),
      transactionType: enumType.transactionType.WALLET,
      transactionResource: enumType.serviceType.BVN,
      paymentMethod: enumType.paymentMethod.WALLET,
      wallet: user.wallet._id,
      status: enumType.transactionStatus.SUCCESSFUL,
      serviceId: enumType.service.BVN,
      serviceName: 'BVN',
      recipientName: `${enumType.platform.FYBAPAY}`,
      recipientAccount: enumType.platform.FYBAPAY,
      recipientAddress: enumType.platform.FYBAPAY,
      recipientPhone: enumType.contacts.SUPPORT,
      // recipientId: receiver._id,
      senderName: `${user.firstName} ${user.lastName}`,
      senderAccount: user.wallet.accountNumber,
      senderAddress: '',
      senderPhone: user.phone,
      senderId: user._id,
      initiatedAt: Date.now(),
      platform: enumType.platform.FYBAPAY,
      message: 'Bvn Verification Successful',
      paidAt:  Date.now(),
      preWalletBalance: user.wallet.balance,
      postWalletBalance: user.wallet.balance - amount,
      totalPayable: amount,
    });

    return transaction;
  },

};
