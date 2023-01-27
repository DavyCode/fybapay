// @flow

/**
 * 
transfer √√√
transferGladePay √√√

transferPrimeAirTime √√√√
transferProvidousPay - todo

verifyTransaction √√√√√ - moved to transactions services
transfer √√√√
resolvePaymentGladePay √√√√
resolvePaymentGladePayTRef
debitAndResolveTRef
resolvePaymentProvidous
resolvePaymentPrimeAirtime
bulkTransfer √√√
bulkTransferToFybapay √√√√
*/


import WalletRepository from '../repository/WalletRepository';
import TransactionRepository from '../repository/TransactionRepository';
import ServiceSwitchRepository from '../repository/ServiceSwitchRepository';
import UserRepository from '../repository/UserRepository';
import BeneficiaryServices from './BeneficiaryServices';
import { BadRequestError, PaymentRequiredError, NotFoundError, InternalServerError, ForbiddenError } from '../utils/errors';
import Pubsub from '../events/fundsEventListener';
import Utility from '../utils';
import enumType from '../enumType';
import API from './api/vendorServices/GLADE/gladeApiServices';
import PRIMEAIRTIME_API from './api/vendorServices/PRIMEAIRTIME/primeairtimeServices';
import RUBIES_API from './api/vendorServices/RUBIES/rubiesServices';
import TransferHelper from '../helpers/TransferHelper';
import CsvHelper from '../helpers/csvParser';
import BankHelper from '../helpers/BankHelper';

import {
  RUBIES_DR_ACCOUNTNAME,
} from '../config/env';


export default {

  /**
   * Transfer Switch
   * @param {} request
   */
  async fundTransfer(request): Promise<any> {
    const user = await UserRepository.getUserById(request.user.id);
    if (!user) { throw new BadRequestError('User not found'); }

    const serviceType = enumType.serviceType.TRANSFER;
    const switchService = await ServiceSwitchRepository.findByServiceType(serviceType);
    if (!switchService) { throw new NotFoundError('Invalid service name or type, service not available'); }

    if (request.body.saveBeneficiary === true || request.body.saveBeneficiary === 'true') {
      await BeneficiaryServices.createNewBeneficiary({
        user,
        userId: user.userId,
        phoneNumber: request.body.phone ? request.body.phone : "",
        transactionType: enumType.transactionType.SERVICES,
        ...request.body,
      })
    }

    switch (switchService.platform) {
      case enumType.platform.GLADEPAY:
        return await this.transferGladePay(user, request.body, switchService);
      case enumType.platform.PRIMEAIRTIME:
        return await this.transferPrimeAirTime(user, request.body, switchService);
      case enumType.platform.PROVIDOUS:
        return await this.transferProvidousPay(user, request.body, switchService);
      case enumType.platform.RUBIES:
        return await this.transferRubies(user, request.body, switchService);
      default:
        throw new InternalServerError('Switch service not available, please contact support');
    }
  },

  /**
   * Transfer Via GladePay
   * @private
   */
  async transferGladePay(user, params, switchService): Promise<any> {
    const { amount, accountNumber, accountName, bankCode, phone, paymentMadeWith, bankName, narration } = params;
    
    const transferAmount = Number(amount);
    
    // const { charges } = switchService;
    const charges = await this.computeTransferCharges(amount, switchService.charges);

    const paymentWasMadeWith = enumType.paymentMethod[paymentMadeWith];
    if (!paymentWasMadeWith) { throw new BadRequestError('Payment method not valid'); }
    
    const reference = await Utility.generateTrxReference();
    
    if (paymentWasMadeWith === enumType.paymentMethod.WALLET) {
      const wallet = await WalletRepository.getWalletByUserId(user._id);
      if (!wallet) { throw new NotFoundError('Wallet not found'); }
      
      /**
       * Prevent same wallet transaction
       */
      if (accountNumber === wallet.accountNumber) { 
        throw new ForbiddenError('Failure. Same wallet transfer not allowed');
      }

      const walletBalance = wallet.balance ? wallet.balance : 0;
      
      if (walletBalance <= 0) {
        throw new BadRequestError('Failure. Wallet balance less than 1');
      }

      if (transferAmount > wallet.limit) { 
        throw new BadRequestError(`Failure. Transfer a maximum of ₦${wallet.limit}`);
      }
      
      if (walletBalance < (transferAmount + charges)) { 
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

      const transaction = await TransactionRepository.TransactionCreate({
        narration: narration ? narration : '',
        serviceType: enumType.serviceType.TRANSFER,
        amount: transferAmount,
        user: user._id,
        userId: user.userId,
        transactionReference: reference,
        transactionId: Utility.getRandomInteger().toString().substring(1, 11),
        transactionType: enumType.transactionType.SERVICES,
        transactionResource: enumType.serviceType.TRANSFER,
        paymentMethod: enumType.paymentMethod.WALLET,
        wallet: wallet._id,
        status: enumType.transactionStatus.INIT,
        serviceId: enumType.service.FUND_TRANSFER,
        serviceName: 'FUND_TRANSFER',
        initiatedAt: Date.now(),
        senderName: wallet.accountName,
        senderAccount: wallet.accountNumber,
        senderAddress: '',
        senderPhone: user.phone,
        senderId: user._id,
        recipientName: `${accountName} (${bankName})`,
        recipientAccount: accountNumber,
        recipientAddress: '',
        recipientPhone: phone ? phone : user.phone, // not required
        recipientId: user._id,
        preWalletBalance: walletBalance,
        platform: enumType.platform.GLADEPAY,
        commission: 0,

        charges: parseInt(charges, 10),

        totalPayable: transferAmount, // TODO - NEW
      });

      /**
       * Charge User wallet first before begining any transactions
       */
      let userWalletBal = (wallet.balance - (transferAmount + parseInt(charges, 10)));

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
      const transferObject = {
        narration: narration ? narration : '',
        action: 'transfer',
        amount: transferAmount,
        bankcode: bankCode,
        accountnumber: accountNumber,
        sender_name: `${user.firstName} ${user.lastName}`,
        orderRef: reference,
      };
      const transferResponse = await API.gladePayDisburse(transferObject);
      transaction.responseBody = JSON.stringify(transferResponse);

      if (transferResponse.status === 200) {
        transaction.status = enumType.transactionStatus.PENDING;
        transaction.client_transactionReference = transferResponse.txnRef ? transferResponse.txnRef : '';
        transaction.client_statusCode = String(transferResponse.status);
        transaction.message = 'Transaction pending';
        transaction.paidAt = Date.now();
        transaction.meta.updatedAt = Date.now();
        await TransactionRepository.TransactionSave(transaction);

        /**
         * @todo - move Pubsub to transaction verify on successful
         * Pubsub.emit('wallet_transfer', { transaction: savedTrx, user });
         */
        return Utility.buildResponse({ data: transaction, message: 'Transaction Successful' });
      } else if (transferResponse.status === 301) {
        /**
         * Transaction failed return user amount and charges to wallet
         */
        userWalletBal = wallet.balance;
      
        await WalletRepository.insertWallet({ _id: wallet._id }, {
          balance: userWalletBal,
          'meta.updatedAt': Date.now(),
        }, { new: false, upsert: false });

        transaction.status = enumType.transactionStatus.FAILED;
        transaction.message = transferResponse.message;
        transaction.commission = 0;
        transaction.charges = 0;
        transaction.client_statusCode = transferResponse.confirmationCode;
        transaction.postWalletBalance = transaction.preWalletBalance;
        transaction.meta.updatedAt = Date.now();
        await TransactionRepository.TransactionSave(transaction);
        Pubsub.emit('wallet_transfer_failed_insufficient_bal', { transaction, user }); // TODO: notify admin vendor balance low

        throw new InternalServerError('Transaction failed please contact support');
        // return Utility.buildFailedResponse({ message: 'Transaction failed please contact support' });
      } else {
        /**
         * Transaction failed return user amount and charges to wallet
         */
        userWalletBal = wallet.balance;
      
        await WalletRepository.insertWallet({ _id: wallet._id }, {
          balance: userWalletBal,
          'meta.updatedAt': Date.now(),
        }, { new: false, upsert: false });

        transaction.status = enumType.transactionStatus.FAILED;
        transaction.message = transferResponse.message;
        transaction.client_statusCode = transferResponse.confirmationCode;
        transaction.postWalletBalance = transaction.preWalletBalance;
        transaction.commission = 0;
        transaction.charges = 0;
        transaction.meta.updatedAt = Date.now();
        await TransactionRepository.TransactionSave(transaction);
        Pubsub.emit('wallet_transfer_failed', { transaction, user });

        throw new InternalServerError('Transaction failed');
        // return Utility.buildFailedResponse({ data: transaction, message: 'Transaction failed' });
      }
    } else if (paymentWasMadeWith === enumType.paymentMethod.CARD) {
      /**
       * @todo - Handle card transactions
       * Charge user added card or allow them pay with card and save card details
       * @todo - Version 2
       */
      throw new BadRequestError('Card not integrated');
    } else if (paymentWasMadeWith === enumType.paymentMethod.SMS) {
      /**
       * @todo - Handle SMS transactions
       * User pay with sms and regiseter trx
       * @todo - Version 2
       */
      throw new BadRequestError('Sms not integrated')
    } else { // todo - Add other payment method in between - App version 2
      throw new BadRequestError('Provide a valid payment method or pay with Wallet');
    }
  },

  /**
   * transferPrimeAirTime
   * @param {object} user 
   * @param {object} params 
   * @param {object} switchService
   * @public 
   */
  async transferPrimeAirTime(user, params, switchService): Promise<any> {
    const { amount, accountNumber, accountName, bankCode, phone, paymentMadeWith, bankName, narration } = params;
    
    const transferAmount = Number(amount);
    
    // const { charges } = switchService;
    const charges = await this.computeTransferCharges(amount, switchService.charges);

    // TODO - Verify bank code across app
    /**
     * Check prime, and also check main list
     */
    const bank = await BankHelper.getprimeAirtimeBankByBankCode(bankCode);
    if (!bank) { throw new NotFoundError(`Bank with bank code: ${bankCode} not found`); }

    const paymentWasMadeWith = enumType.paymentMethod[paymentMadeWith];
    if (!paymentWasMadeWith) { throw new BadRequestError('Payment method not valid'); }
    
    const reference = await Utility.generateTrxReference();
    
    if (paymentWasMadeWith === enumType.paymentMethod.WALLET) {
      const wallet = await WalletRepository.getWalletByUserId(user._id);
      if (!wallet) { throw new NotFoundError('Wallet not found'); }
      
      /**
       * Prevent same wallet transaction
       */
      if (accountNumber === wallet.accountNumber) { 
        throw new ForbiddenError('Failure. Same wallet transfer not allowed');
      }

      const walletBalance = wallet.balance ? wallet.balance : 0;
      
      if (walletBalance <= 0) {
        throw new BadRequestError('Failure. Wallet balance less than 1');
      }

      if (transferAmount > wallet.limit) { 
        throw new BadRequestError(`Failure. Transfer a maximum of ₦${wallet.limit}`);
      }
      
      if (walletBalance < (transferAmount + charges)) { 
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

      const transaction = await TransactionRepository.TransactionCreate({
        narration: narration ? narration : '',
        serviceType: enumType.serviceType.TRANSFER,
        amount: transferAmount,
        user: user._id,
        userId: user.userId,
        transactionReference: reference,
        transactionId: Utility.getRandomInteger().toString().substring(1, 11),
        transactionType: enumType.transactionType.SERVICES,
        transactionResource: enumType.serviceType.TRANSFER,
        paymentMethod: enumType.paymentMethod.WALLET,
        wallet: wallet._id,
        status: enumType.transactionStatus.INIT,
        serviceId: enumType.service.FUND_TRANSFER,
        serviceName: 'FUND_TRANSFER',
        initiatedAt: Date.now(),
        senderName: wallet.accountName,
        senderAccount: wallet.accountNumber,
        senderAddress: '',
        senderPhone: user.phone,
        senderId: user._id,
        recipientName: `${accountName} (${bankName})`,
        recipientAccount: accountNumber,
        recipientAddress: '',
        recipientPhone: phone ? phone : user.phone,
        recipientId: user._id,
        preWalletBalance: walletBalance,
        platform: enumType.platform.PRIMEAIRTIME,
        commission: 0,
        
        charges: parseInt(charges, 10), // todo

        totalPayable: transferAmount, // TODO - NEW
      });

      /**
       * Charge User wallet first before begining any transactions
       */
      let userWalletBal = (wallet.balance - (transferAmount + parseInt(charges, 10)));

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
        amount: transferAmount,
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

        Pubsub.emit('wallet_transfer_failed', { transaction, user });
        
        let errorMessage = requestResult.message ? requestResult.message : 'Service not available at the moment';
        if (requestResult.status === 402) {
          return Utility.buildFailedResponse({ message: errorMessage });
        }
        throw new InternalServerError(`${errorMessage}`);
      }
    } else if (paymentWasMadeWith === enumType.paymentMethod.CARD) {
      /**
       * @todo - Handle card transactions
       * Charge user added card or allow them pay with card and save card details
       * @todo - Version 2
       */
      throw new BadRequestError('Card not integrated');
    } else if (paymentWasMadeWith === enumType.paymentMethod.SMS) {
      /**
       * @todo - Handle SMS transactions
       * User pay with sms and regiseter trx
       * @todo - Version 2
       */
      throw new BadRequestError('Sms not integrated')
    } else { // todo - Add other payment method in between - App version 2
      throw new BadRequestError('Provide a valid payment method or pay with Wallet');
    }

  },
  
  /**
   * transferRubies
   * @param {*} request 
   */
  async transferRubies(user, params, switchService) {
    const { amount, accountNumber, accountName, bankCode, phone, paymentMadeWith, bankName, narration } = params;

    const transferAmount = Number(amount);
    
    // const { charges } = switchService;
    const charges = await this.computeTransferCharges(amount, switchService.charges);

    /**
     * Check prime, and also check main list
     */
    const bank = await BankHelper.getRubiesBankByBankCode(bankCode);
    if (!bank) { throw new NotFoundError(`Bank with bank code: ${bankCode} not found`); }

    const paymentWasMadeWith = enumType.paymentMethod[paymentMadeWith];
    if (!paymentWasMadeWith) { throw new BadRequestError('Payment method not valid'); }
    
    const reference = await Utility.generateTrxReference();
    
    if (paymentWasMadeWith === enumType.paymentMethod.WALLET) {
      const wallet = await WalletRepository.getWalletByUserId(user._id);
      if (!wallet) { throw new NotFoundError('Wallet not found'); }
      
      /**
       * Prevent same wallet transaction
       */
      if (accountNumber === wallet.accountNumber) { 
        throw new ForbiddenError('Failure. Same wallet transfer not allowed');
      }

      const walletBalance = wallet.balance ? wallet.balance : 0;
      
      if (walletBalance <= 0) {
        throw new BadRequestError('Failure. Wallet balance less than 1');
      }

      if (transferAmount > wallet.limit) { 
        throw new BadRequestError(`Failure. Transfer a maximum of ₦${wallet.limit}`);
      }
      
      if (walletBalance < (transferAmount + charges)) { 
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

      const transaction = await TransactionRepository.TransactionCreate({
        narration: narration ? narration : '',
        serviceType: enumType.serviceType.TRANSFER,
        amount: transferAmount,
        user,
        userId: user.userId,
        transactionReference: reference,
        transactionId: Utility.getRandomInteger().toString().substring(1, 11),
        transactionType: enumType.transactionType.SERVICES,
        transactionResource: enumType.serviceType.TRANSFER,
        paymentMethod: enumType.paymentMethod.WALLET,
        wallet,
        status: enumType.transactionStatus.INIT,
        serviceId: enumType.service.FUND_TRANSFER,
        serviceName: 'FUND_TRANSFER',
        initiatedAt: Date.now(),
        senderName: wallet.accountName,
        senderAccount: wallet.accountNumber,
        senderAddress: '',
        senderPhone: user.phone,
        senderId: user,
        recipientName: `${accountName} (${bankName})`,
        recipientAccount: accountNumber,
        recipientAddress: '',
        recipientPhone: phone ? phone : user.phone,
        // recipientId: user._id,
        preWalletBalance: walletBalance,
        platform: enumType.platform.RUBIES,
        commission: 0,
        
        charges: parseInt(charges, 10), // todo

        totalPayable: transferAmount, // TODO - NEW
      });

      /**
       * Charge User wallet first before beginning any transactions
       */
      let userWalletBal = (wallet.balance - (transferAmount + parseInt(charges, 10)));

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
        amount: transferAmount,
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

    } else if (paymentWasMadeWith === enumType.paymentMethod.CARD) {
      /**
       * @todo - Handle card transactions
       * Charge user added card or allow them pay with card and save card details
       * @todo - Version 2
       */
      throw new BadRequestError('Card not integrated');
    } else if (paymentWasMadeWith === enumType.paymentMethod.SMS) {
      /**
       * @todo - Handle SMS transactions
       * User pay with sms and regiseter trx
       * @todo - Version 2
       */
      throw new BadRequestError('Sms not integrated')
    } else { // todo - Add other payment method in between - App version 2
      throw new BadRequestError('Provide a valid payment method or pay with Wallet');
    }
  },
  
  /**
   * transferProvidousPay
   * @param {*} request 
   */
  async transferProvidousPay(request) {
    throw new InternalServerError('Server Error, contact support immediately');
  },

  /**
   * Get all wallet funded transactions on monnify
   * @private
   * @todo - 
   * Endpoint GET: https://sandbox.monnify.com/api/v1/transactions/search?
   * https://docs.teamapt.com/display/MON/Get+All+Transactions
   */
  async getWalletFundedMonifyDepositsAndSearch() {},

  /**
   * Get Transfer Charges
   * @param {} request
   */
  async getTransferCharges(request): Promise<any> {
    const amount = Number(request.query.amount);
    const user = await UserRepository.getUserByIdWithWallet(request.user.id);
    if (!user) { throw new NotFoundError('User not found'); }

    const serviceType = enumType.serviceType.TRANSFER;
    const switchService = await ServiceSwitchRepository.findByServiceType(serviceType);
    
    if (!switchService) { 
      throw new NotFoundError('Invalid service name or type, service not available');
    }

    if (amount > user.wallet.limit) {
      return Utility.buildFailedResponse({ message: `Transfer limit ₦${user.wallet.limit}` });
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

    const charges = await this.computeTransferCharges(amount, switchService.charges);

    return Utility.buildResponse({
      message: `Transfer charge of ₦${charges}`,
      charges,
      userDailyAllowedTransaction: parseInt(userDailyAllowedTransaction, 10),
    });
  },

  /**
   * computeTransferCharges
   * @param {Number} amount 
   * @param {Number} switchServiceCharge
   * @private
   */
  async computeTransferCharges(amount: number, switchServiceCharge: number) {
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
   * Resolve GladePay Transfer Transactions
   * @description - Run on schedular
   */

  // async resolveGladeAsyncHelper(transactionReference: string) {},
  /**
   * Resolve GladePay Transaction By TransactionRef
   * @description - Call service to resolve transaction Failed/Pending on glade
   * @todo - not sure why we need this
   */
  async resolveGladePayTransactionByTransactionRef(transactionReference: string) {
    const transaction = await TransactionRepository.findByTransactionReference(transactionReference);
    if (!transaction || transaction.length < 1) {
      console.log('No pending Gladepay transaction at this time');
      return;
    }

    const resolveResponse = await API.gladePayDisburse({ action: 'verify', txnRef: transaction.transactionReference });
    if (resolveResponse.status === 200 && resolveResponse.txnStatus != null && resolveResponse.txnStatus === 'successful') {
      transaction.status = enumType.transactionStatus.SUCCESSFUL;
      transaction.meta.updatedAt = Date.now();
    }

    // todo - incomplete
    // todo - incomplete
    // todo - incomplete
    // todo - incomplete
  },

  /**
   * Debit And Resolve TransactionRef
   * @todo -
   */
  async debitAndResolveTransactionRef() {},

  /**
   * Resolve Payment Providous
   * @todo - 
   */
  async resolvePaymentProvidous() {},

  /**
   * Resolve Payment PrimeAirtime
   * @todo -
   */
  async resolvePaymentPrimeAirtime() {},

  /**
   * Bulk Transfer
   * @private
   */
  // TODO - REQUIRE UPDATE
  async bulkFundTransfer(request) {
    const user = await UserRepository.getUserByIdWithWallet(request.user.id);
    if (!user) { throw new NotFoundError('User not found') }
    /**
     * process csv and return array of transactions list
     */
    const transferList = await CsvHelper.parseBulkFundTransferCsv(request.files.file);
    if (transferList.length < 1) { throw new BadRequestError('Csv entries empty') };
    /**
     * Ensure the file data from csv matches the expected template
     * validate csv headers and input
     */
    const csvValidation = await CsvHelper.validateFundTransferCsvInputs(transferList);
    if (!csvValidation.isValid) {
      return Utility.buildBadRequestResponse({ ...csvValidation })
    }
    
    const serviceType = enumType.serviceType.BULK_TRANSFER;
    const switchService = await ServiceSwitchRepository.findByServiceType(serviceType);
    if (!switchService) { throw new NotFoundError('Invalid service name or type, service not available') };

    let totalTransferAmount = TransferHelper.getTotalAmount(transferList);
    if (user.wallet.balance < (totalTransferAmount + switchService.charges)) { throw new PaymentRequiredError('Insufficient balance') };
    if (totalTransferAmount > user.wallet.limit) { throw new BadRequestError(`Transfer a maximum of ₦${user.wallet.limit}`) };
    
    switch (switchService.platform) {
      case enumType.platform.GLADEPAY:
        return await this.bulkFundTransferGladePay(switchService, user, transferList);
      case enumType.platform.PRIMEAIRTIME:
        return await this.bulkFundTransferPrimeAirTime(switchService, user, transferList);
      case enumType.platform.PROVIDOUS:
        return await this.bulkFundTransferProvidous(switchService, user, transferList);
      default:
        throw new InternalServerError('Switch service not available, please contact support');
    }
  },
  
  /**
   * Bulk Fund transfer with GladePay
   * @param {} request
   * @private
   * @todo - REVIEW ENDPOINT
   */
  // TODO - REQUIRE UPDATE
  async bulkFundTransferGladePay(switchService, user, transferList) {
    const transactions = [];
    const gladePayTransferRequests = [];
    const charges = switchService.charges;
    let senderWallet = await WalletRepository.getWalletByUserId(user.id);
    let senderWalletBalance = user.wallet ? user.wallet.balance : 0; // use wallet on user, since we cant be sure wallet exist here
    const totalTransferAmount = TransferHelper.getTotalAmount(transferList);
    let totalCharges = charges

    for (let i = 0; i < transferList.length; i++) {
      let reference = await Utility.generateTrxReference();
      let { Account_Number, Account_Name, Amount, Narration, Bank_Name, Bank_Code } = transferList[i];
      let transferAmount = Number(Amount);

      let transaction = await TransactionRepository.TransactionInstance();
      transaction.serviceType = enumType.serviceType.TRANSFER;
      transaction.amount = transferAmount;
      transaction.user = user._id;
      transaction.userId = user.userId;
      transaction.transactionReference = reference;
      transaction.transactionId = Utility.getRandomInteger().toString().substring(1, 11);
      transaction.transactionType = enumType.transactionType.SERVICES;
      transaction.transactionResource = enumType.serviceType.TRANSFER;
      transaction.paymentMethod = enumType.paymentMethod.WALLET;
      transaction.wallet = senderWallet._id;
      transaction.status = enumType.transactionStatus.PENDING;
      transaction.serviceId = enumType.service.FUND_TRANSFER;
      transaction.serviceName = 'FUND_TRANSFER';
      transaction.initiatedAt = Date.now();
      transaction.senderName = senderWallet.accountName;
      transaction.senderAccount = senderWallet.accountNumber;
      transaction.senderAddress = '';
      transaction.senderPhone = user.phone;
      transaction.senderId = user._id;
      transaction.recipientName = Account_Name;
      transaction.recipientAccount = Account_Number;
      transaction.recipientAddress = '';
      transaction.recipientPhone = '';
      // transaction.recipientId = receiver._id;
      transaction.preWalletBalance = senderWalletBalance;
      transaction.narration = Narration;
      transaction.platform = enumType.platform.GLADEPAY;
      
      transactions.push(transaction);

      gladePayTransferRequests.push({
        amount: transferAmount,
        bankcode: Bank_Code, 
        accountnumber: Account_Number,
        sender_name: Account_Name,
        narration: Narration,
        orderRef: reference
      })
    }

    const bulkTransferResponse = await API.gladePayDisburse({
      action: 'transfer',
      type: 'bulk',
      data: gladePayTransferRequests
    });

    for (let i = 0; i < transactions.length; i++) {
      transactions[i].responseBody = JSON.stringify(bulkTransferResponse);
    }

    if (bulkTransferResponse.status === 200) {
      let userWalletBal = (senderWallet.balance - (totalTransferAmount + parseInt(totalCharges, 10)));
      for (let i = 0; i < transactions.length; i++) {
        transactions[i].client_transactionReference = bulkTransferResponse.txnRef ? bulkTransferResponse.txnRef:  '';
        transactions[i].client_statusCode = String(bulkTransferResponse.status);
        transactions[i].charges = charges;
        transactions[i].postWalletBalance = userWalletBal;
        transactions[i].message = bulkTransferResponse.message ? bulkTransferResponse.message : 'Withdrawal pending';
        transactions[i].meta.updatedAt = Date.now();
        transactions[i].paidAt = Date.now();
        
        totalCharges += charges;
      }

      await WalletRepository.insertWallet({ _id: senderWallet._id}, {
        balance: userWalletBal,
        'meta.updatedAt': Date.now(),
      }, { new: false, upsert: false });
      
      const savedTrx = await TransactionRepository.TransactionInsertMany(transactions);

      /**
       * @todo - move Pubsub to transaction verify on successful
       * Pubsub.emit('wallet_transfer', { transaction: savedTrx, user });
       */
      return Utility.buildResponse({ data: savedTrx, message: 'Transaction Successful'});
    } 
    else if (bulkTransferResponse.status === 301) {
      for (let i = 0; i < transactions.length; i++) {
        transactions[i].status = enumType.transactionStatus.FAILED;
        transactions[i].message = bulkTransferResponse.message;
        transactions[i].client_statusCode = bulkTransferResponse.confirmationCode
        transactions[i].meta.updatedAt = Date.now();
      }
      await TransactionRepository.TransactionSave(transaction);
      Pubsub.emit('wallet_bulk_transfer_bank_failed_insufficient_bal', {transaction, user});
      
      // throw new InternalServerError('Transaction failed please contact support');
      return Utility.buildFailedResponse({ message: 'Transaction failed please contact support' });
    }
    else {
      for (let i = 0; i < transactions.length; i++) {
        transactions[i].status = enumType.transactionStatus.FAILED;
        transactions[i].message = bulkTransferResponse.message;
        transactions[i].client_statusCode = bulkTransferResponse.confirmationCode
        transactions[i].meta.updatedAt = Date.now();
      }
      await TransactionRepository.TransactionSave(transaction);
      Pubsub.emit('wallet_bulk_transfer_bank_failed', {transaction, user});
      
      // throw new InternalServerError('Transaction failed');
      return Utility.buildFailedResponse({ message: 'Transaction failed' });
    }
  },

  /**
   * Bulk Fund transfer with PrimeAirTime
   * @param {} request 
   * @private
   */
  async bulkFundTransferPrimeAirTime(request) {},

  /**
   * Bulk Fund transfer with Providous
   * @param {} request 
   * @private
   */
  async bulkFundTransferProvidous(request) {},

  /**
   * Bulk Transfer Wallet to Wallet
   * @private 
   */
  // TODO - REQUIRE UPDATE
  async bulkTransferWalletToWallet(request) {
    const user = await UserRepository.getUserByIdWithWallet(request.user.id);
    if (!user) { throw new NotFoundError('User not found') }
    /**
     * process csv and return array of transactions list
     */
    const transferList = await CsvHelper.parseBulkFundTransferCsv(request.files.file); // todo -parse csv
    if (transferList.length < 1) { throw new BadRequestError('Csv entries empty') };
    /**
     * Ensure the file data from csv matches the expected template
     * validate csv headers and input
     */

    const csvValidation = await CsvHelper.validateW2WCsvInputs(transferList);
    if (!csvValidation.isValid) {
      return Utility.buildBadRequestResponse({ ...csvValidation })
    }

    const fulfilledTransactionList = [];
    const unfulfilledTransactionList = [];
    let totalTransferAmount = TransferHelper.getTotalAmount(transferList);
    if (user.wallet.balance < totalTransferAmount) { throw new PaymentRequiredError('Insufficient balance'); }
    if (totalTransferAmount > user.wallet.limit) { throw new BadRequestError(`Transfer a maximum of ₦${user.wallet.limit}`) };
    
    for (let i = 0; i < transferList.length; i++) {
      let { Account_Number, Account_Name, Amount, Narration } = transferList[i];
      let transferAmount = Number(Amount);

      let senderWallet = await WalletRepository.getWalletByUserId(user.id);
      let senderWalletBalance = user.wallet ? user.wallet.balance : 0; // use wallet on user, since we cant be sure wallet exist here
      let receiverWallet = await WalletRepository.findByAccountNumberAndPopulate(Account_Number);      
      let receiverWalletBalance = receiverWallet ? receiverWallet.balance : 0;
      
      let receiver, failureMessage;
      if (receiverWallet) {
        receiver = await UserRepository.getUserById(receiverWallet.user._id);
      }
      if (!receiver) {
        failureMessage = 'Invalid account number'
      }

      if (!senderWallet) {
        failureMessage += ', Sending user wallet not found'
      }

      let reference = await Utility.generateTrxReference();

      let senderTransaction = await TransactionRepository.TransactionInstance();
      senderTransaction.serviceType = enumType.serviceType.TRANSFER;
      senderTransaction.amount = transferAmount;
      senderTransaction.user = user._id;
      senderTransaction.userId = user.userId;
      senderTransaction.transactionReference = reference;
      senderTransaction.transactionId = Utility.getRandomInteger().toString().substring(1, 11);
      senderTransaction.transactionType = enumType.transactionType.SERVICES;
      senderTransaction.transactionResource = enumType.serviceType.TRANSFER;
      senderTransaction.paymentMethod = enumType.paymentMethod.WALLET;
      if (senderWallet) {
        senderTransaction.wallet = senderWallet._id;
      }
      senderTransaction.serviceId = enumType.service.WALLET_TRANSFER;
      senderTransaction.serviceName = 'WALLET_TRANSFER';
      senderTransaction.initiatedAt = Date.now();
      senderTransaction.senderName = senderWallet ? senderWallet.accountName : '';
      senderTransaction.senderAccount = senderWallet ? senderWallet.accountNumber : '';
      senderTransaction.senderAddress = '';
      senderTransaction.senderPhone = user.phone;
      senderTransaction.senderId = user._id;
      senderTransaction.recipientName = receiverWallet ? receiverWallet.accountName : Account_Name;
      senderTransaction.recipientAccount = receiverWallet ? receiverWallet.accountNumber : Account_Number;
      senderTransaction.recipientAddress = '';
      senderTransaction.recipientPhone = receiver ? receiver.phone : '';
      if (receiver) {
        senderTransaction.recipientId = receiver._id;
      }
      senderTransaction.preWalletBalance = senderWalletBalance;
      senderTransaction.narration = Narration;
      senderTransaction.platform = enumType.platform.FYBAPAY;      
      
      if (senderWallet && receiverWallet) {
        senderWallet.balance -= transferAmount;
        senderWallet.meta.updatedAt = Date.now();
        let newSenderWallet = await WalletRepository.saveWallet(senderWallet);

        senderTransaction.status = enumType.transactionStatus.SUCCESSFUL,
        senderTransaction.postWalletBalance = newSenderWallet.balance;
        senderTransaction.message = 'Transaction successful';
        senderTransaction.paidAt = Date.now(); 
        let savedSenderTransaction = await TransactionRepository.TransactionSave(senderTransaction);
    
        /**
         * receiver transaction
         */
        const receiverTransaction = await TransactionRepository.TransactionInstance();
        receiverTransaction.serviceType = enumType.serviceType.FUND;
        receiverTransaction.amount = transferAmount;
        receiverTransaction.user = receiver._id;
        receiverTransaction.userId = receiver.userId;
        receiverTransaction.transactionReference = reference;
        receiverTransaction.transactionId = Utility.getRandomInteger().toString().substring(1, 11);
        receiverTransaction.transactionType = enumType.transactionType.WALLET;
        receiverTransaction.transactionResource = enumType.serviceType.FUND;
        receiverTransaction.paymentMethod = enumType.paymentMethod.WALLET;
        receiverTransaction.wallet = receiverWallet._id;
        receiverTransaction.status = enumType.transactionStatus.SUCCESSFUL;
        receiverTransaction.serviceId = enumType.service.WALLET_TOPUP;
        receiverTransaction.serviceName = 'WALLET_TOPUP';
        receiverTransaction.initiatedAt = Date.now();
        receiverTransaction.senderName = senderWallet.accountName;
        receiverTransaction.senderAccount = senderWallet.accountNumber;
        receiverTransaction.senderAddress = '';
        receiverTransaction.senderPhone = user.phone;
        receiverTransaction.senderId = user._id;
        receiverTransaction.recipientName = receiverWallet.accountName;
        receiverTransaction.recipientAccount = receiverWallet.accountNumber;
        receiverTransaction.recipientAddress = '';
        receiverTransaction.recipientPhone = receiver.phone;
        receiverTransaction.recipientId = receiver._id;
        receiverTransaction.preWalletBalance = receiverWalletBalance;
        receiverTransaction.narration = Narration;
        receiverTransaction.platform = enumType.platform.FYBAPAY;

        receiverWallet.balance += transferAmount;
        receiverWallet.meta.updatedAt = Date.now();
        let newReceiverWallet = await WalletRepository.saveWallet(receiverWallet);
        receiverTransaction.postWalletBalance = newReceiverWallet.balance;
        receiverTransaction.message = 'Transaction successful';
        receiverTransaction.paidAt = Date.now(); 
        let savedReceiverTransaction = await TransactionRepository.TransactionSave(receiverTransaction);

        fulfilledTransactionList.push(savedSenderTransaction)
        Pubsub.emit('wallet_to_wallet_bulk_transfer', { sender: {senderWalletTransaction: savedSenderTransaction, senderWallet, user }, receiver: { receiverWalletTransaction: savedReceiverTransaction, receiverWallet, user: receiver} });
      }
      else {
        senderTransaction.status = enumType.transactionStatus.FAILED;
        senderTransaction.message = failureMessage ? failureMessage: 'Failed transaction';
        let savedFailedTransaction = await TransactionRepository.TransactionSave(senderTransaction);

        unfulfilledTransactionList.push(savedFailedTransaction);
        Pubsub.emit('wallet_to_wallet_bulk_transfer_failed', { senderTransaction, user });
      }
    }

    return Utility.buildResponse({ data: { fulfilledTransactionList, unfulfilledTransactionList }})
  },

  /**
   * get Bulk Transfer Template
   * @private
   * @description - process cvs template for bulk transfers
   */
  // TODO - REQUIRE UPDATE
  async getBulkFundTransferTemplate(request) {
    let file = ''
    if (!request.query.transferType) { throw new BadRequestError('Provide transfer type query'); }
    if (request.query.transferType === enumType.transferType.W2W_TRANSFER) {
      file = await CsvHelper.getBulkWalletToWalletTemplate();
    }
    if (request.query.transferType === enumType.transferType.WALLET_TRANSFER) {
      file = await CsvHelper.getBulkWalletTransferTemplate()
    }

    return Utility.buildResponse({ data: file });
  },

  /**
   * Bulk Transfer Charges
   * @todo - 
   */
  // TODO - REQUIRE UPDATE
  async bulkTransferCharges(request): Promise<any>  {
    const user = await UserRepository.getUserByIdWithWallet(request.user.id);
    if (!user) { throw new NotFoundError('User not found'); }

    const serviceType = enumType.serviceType.BULK_TRANSFER;
    const switchService = await ServiceSwitchRepository.findByServiceType(serviceType);
    if (!switchService) { throw new NotFoundError('Invalid service name or type, service not available'); }

    return Utility.buildResponse({ message: `* Bulk transfer charge of ₦${switchService.charges}` });
  },


};
