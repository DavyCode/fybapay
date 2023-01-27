// @flow

import { BadRequestError, InternalServerError, PaymentRequiredError, NotFoundError, ForbiddenError, NotAcceptableError } from '../utils/errors';
import ServiceSwitchRepository from '../repository/ServiceSwitchRepository';
import enumType, { service } from '../enumType';
import Utility from '../utils';
import VariationHelper from '../helpers/VariationHelper';
import API from './api/vendorServices/AIRVEND/airvendApiServices';
import PRIMEAIRTIME_API from './api/vendorServices/PRIMEAIRTIME/primeairtimeServices';
import VTPASS_API from './api/vendorServices/VTPASS/vtpassServices'
import CommissionRepository from '../repository/CommissionRepository'
import UserRepository from '../repository/UserRepository';
import TransactionRepository from '../repository/TransactionRepository';
import Pubsub from '../events/servicesEventListener';
import CommissionServices from './CommissionServices';
import WalletRepository from '../repository/WalletRepository';

export default {
  /**
   * Data Top Up Switch
   * @private
   */
  async dataTopUp(request) {
    const user = await UserRepository.getUserByIdWithWallet(request.user.id);
    if (!user) { throw new NotFoundError('User not found!') };
    
    const serviceType = enumType.serviceType.DATA;
    const switchService = await ServiceSwitchRepository.findByServiceType(serviceType);
    if (!switchService) { throw new NotFoundError('Invalid service name or type, service not available') };

    switch (switchService.platform) {
      case enumType.platform.AIRVEND:
        return await this.makeAirvendSubscription(user, serviceType, switchService, request.body);
      case enumType.platform.VTPASS:
        return await this.makeVTPassSubscription(user, serviceType, switchService, request.body);
      case enumType.platform.PRIMEAIRTIME:
        return await this.makePrimeAirtimeSubscription(user, serviceType, switchService, request.body);
      default:
        throw new InternalServerError('Switch service not available, please contact support');
    }
  },

  /**
   * Make Airvend Subscription
   * @private
   */
  async makeAirvendSubscription(user: {}, serviceType: string, switchService: {}, params: { mobileNumber: string, serviceName: string, amount: number, paymentMadeWith: string, variation_code: string, customernumber? : number }) {
    const { mobileNumber, serviceName, amount, paymentMadeWith, variation_code, customernumber } = params;
    
    const resource = VariationHelper.resolveAirvendServices(serviceName, serviceType);
    if (!resource || resource.error) { throw new BadRequestError(resource.error ? resource.error: 'Invalid serviceName or serviceType') };
    
    const { Service, serviceID, Type, verify, NetworkID, percentageCommission } = resource;
    
    const currentUser = user;
    
    if (verify && !customernumber) { throw new BadRequestError('Customer number required') }
    
    const commissionWallet = await CommissionRepository.getCommissionWalletByUserId (currentUser._id);
    if (!commissionWallet) { throw new NotFoundError('Commission wallet not found'); }
    
    const paymentWasMadeWith = enumType.paymentMethod[paymentMadeWith];
    if (!paymentWasMadeWith) { throw new BadRequestError('Payment method not valid') };
    
    const totalChargable = parseInt(amount, 10);
    const charges = switchService.charges;
    const totalChargablePlusCharges = totalChargable + parseInt(charges, 10);

    let commission = 0;
    
    /**
     * Set commission base on user role
     */
    if (currentUser.role === enumType.rolesType.AGENT || currentUser.role === enumType.rolesType.SUPERAGENT) {
      commission = totalChargable * Number(percentageCommission) / 100;
    }

    let reference = await Utility.generateTrxReference();

    if (paymentWasMadeWith === enumType.paymentMethod.WALLET) {
      
      const balance = currentUser.wallet.balance ? currentUser.wallet.balance : 0;
      
      if (balance <= 0) {
        throw new BadRequestError('Failure. Wallet balance less than 1');
      }
      
      // don't pay VAS more than wallet LIMIT
      if (totalChargable > currentUser.wallet.limit) {
        throw new BadRequestError(`Failure. Amount exceeds limit ${currentUser.wallet.limit}`);
      }

      if (balance < totalChargablePlusCharges) { 
        throw new PaymentRequiredError('Failure. Insufficient balance');
      }

      /**
       * Non BVN users have a daily transaction limit of 1000
       * sum both wallet daily total trx and service daily trx
       */
      const todayTransactionAmount = await TransactionRepository.sumTransactionAmountByUserIdAndFilter(currentUser._id, { date: new Date(), status: enumType.transactionStatus.SUCCESSFUL });

      if (!todayTransactionAmount) {
        throw new NotFoundError('Failure. Could not retrieve daily transaction amount');
      }

      /**
       * check total amount exist is array
       */
      if (todayTransactionAmount.length > 0) {
        if (todayTransactionAmount[0].total) {
  
          if (currentUser.wallet.limit === enumType.walletDailyLimit.KYC_ONE) {
            if (Number(todayTransactionAmount[0].total) >= Number(currentUser.wallet.limit)) {
              throw new ForbiddenError('Failure. non-verified BVN users daily transaction limit exceeded!')
            }
          }
  
          /**
           * Check daily trx amount Against Wallet Limit
           */
          if (Number(todayTransactionAmount[0].total) > Number(currentUser.wallet.limit)) {
            throw new ForbiddenError('Failure. Daily transaction limit of ${currentUser.wallet.limit} exceeded!')
          }
        }
      }

      const transaction = await TransactionRepository.TransactionCreate({
        amount: totalChargable,
        serviceType, 
        user: currentUser._id,
        userId: currentUser.userId,
        transactionReference: reference,
        transactionId: Utility.getRandomInteger().toString().substring(1, 11),
        transactionType: enumType.transactionType.SERVICES,
        transactionResource: enumType.serviceType.DATA,
        paymentMethod: paymentWasMadeWith,
        wallet: currentUser.wallet._id,
        status: enumType.transactionStatus.INIT,
        serviceId: serviceID,
        serviceName: Service,
        initiatedAt: Date.now(),
        recipientName: `${currentUser.firstName} ${currentUser.lastName}`,
        recipientAccount: '',
        recipientPhone: mobileNumber,
        recipientAddress: '',
        preWalletBalance: balance,
        platform: enumType.platform.AIRVEND,
        narration: 'Data Purchase',

        commission,
        charges: parseInt(charges, 10), // todo - cron

        commissionWallet, // todo - add commissionWallet to transactions
        totalPayable: totalChargable, // TODO - NEW
      });

      /**
       * Charge User wallet first before begining any transactions
       */
      let userWalletBal = (currentUser.wallet.balance - (totalChargable + parseInt(charges, 10)));

      const chargeUserWallet = await WalletRepository.insertWallet({ _id: currentUser.wallet._id}, {
        balance: userWalletBal,
        'meta.updatedAt': Date.now(),
      }, { new: true, upsert: false });
      
      if (!chargeUserWallet) {
        throw new NotFoundError('Could not charge user wallet')
      }

      let vendObject =  { amount: totalChargable, ref: reference, account: mobileNumber, networkid: NetworkID, type: Type, customernumber: customernumber ? customernumber : '' };
      const vendResponse = await API.vendServices(vendObject);
      transaction.responseBody = JSON.stringify(vendResponse);

      if (vendResponse && vendResponse.confirmationCode === 200) {

        transaction.client_transactionReference = vendResponse.details ? String(vendResponse.details.TransactionID) : '';
        transaction.status = enumType.transactionStatus.SUCCESSFUL;
        transaction.client_statusCode = String(vendResponse.confirmationCode);
        // transaction.commission = commission;
        transaction.postWalletBalance = userWalletBal;
        transaction.message = 'Transaction successful';
        transaction.paidAt = Date.now();
        transaction.meta.updatedAt = Date.now();
        const savedTrx = await TransactionRepository.TransactionSave(transaction);

        /**
         * issue commission
         * @todo
         */
        // TODO - issue commission to agents only
        if (currentUser.role === enumType.rolesType.AGENT || currentUser.role === enumType.rolesType.SUPERAGENT) {
          if (commission > 0) {
            await CommissionServices.issueCommission(transaction, currentUser, commission, commissionWallet)
          }
        }

        Pubsub.emit('data_purchase', { transaction: savedTrx, user: currentUser, variation: variation_code });
        return Utility.buildResponse({ data: savedTrx, message: 'Transaction Successful' });
      }
      else { // TODO: review result with live vend api
        /**
         * Transaction failed return user amount and charges to wallet
         */
        userWalletBal = currentUser.wallet.balance;
      
        await WalletRepository.insertWallet({ _id: currentUser.wallet._id }, {
          balance: userWalletBal,
          'meta.updatedAt': Date.now(),
        }, { new: false, upsert: false });

        transaction.status = enumType.transactionStatus.FAILED;
        transaction.message = 'Transaction Failed';
        transaction.commission = 0;
        transaction.charges = 0;
        transaction.client_statusCode = vendResponse.confirmationCode;
        transaction.postWalletBalance = transaction.preWalletBalance;
        transaction.meta.updatedAt = Date.now();
        await TransactionRepository.TransactionSave(transaction);
        
        Pubsub.emit('data_purchase_failed', {transaction, currentUser});

        let errorMessage = vendResponse.message ? vendResponse.message : 'Service not available at the moment';
        if (vendResponse.confirmationCode === 402) {
          return Utility.buildFailedResponse({ message: errorMessage });
        }
        throw new InternalServerError(`${errorMessage}`);
      }

    }
    else if (paymentWasMadeWith === enumType.paymentMethod.CARD) {
      /**
       * @todo - Handle card transactions
       * Charge user added card or allow them pay with card and save card details
       * @todo - Version 2 
       */
    }
    else if (paymentWasMadeWith === enumType.paymentMethod.SMS) {
      /**
       * @todo - Handle SMS transactions
       * User pay with sms and regiseter trx
       * @todo - Version 2 
       */
    } // todo - Add other payment method in between - App version 2
    else {
      throw new BadRequestError('Provide a valid payment method')
    }
    
  },

  /**
   * Make VTpass Subscription
   * @private
   */
  async makeVTPassSubscription(user: {}, serviceType: string, switchService: {}, params: { mobileNumber: string, serviceName: string, amount: number, paymentMadeWith: string, variation_code: string, customernumber? : number }) {
    const { mobileNumber, serviceName, amount, paymentMadeWith, variation_code, customernumber } = params;
    
    /**
     * No SPECTRANET_PIN on VTPASS
     */
    if (serviceName === 'SPECTRANET_PIN') {
      throw new InternalServerError('Service not available at this time');
    }

    const resource = VariationHelper.resolveVtpassServices(serviceName, serviceType);
    if (!resource || resource.error) { throw new BadRequestError(resource.error ? resource.error: 'Invalid serviceName or serviceType') };
    const { Service, serviceID, sku, Product, percentageCommission } = resource;
    
    if (Product && !variation_code) { throw new BadRequestError('Variation code required'); }
    
    const currentUser = user;
    
    const commissionWallet = await CommissionRepository.getCommissionWalletByUserId(currentUser._id);
    if (!commissionWallet) { throw new NotFoundError('Commission wallet not found'); }
    
    const paymentWasMadeWith = enumType.paymentMethod[paymentMadeWith];
    if (!paymentWasMadeWith) { throw new BadRequestError('Payment method not valid') };
    
    const totalChargable = parseInt(amount, 10);
    const charges = switchService.charges;
    const totalChargablePlusCharges = totalChargable + parseInt(charges, 10);
    
    let commission = 0;
    
    /**
     * Set commission base on user role
     */
    if (currentUser.role === enumType.rolesType.AGENT || currentUser.role === enumType.rolesType.SUPERAGENT) {
      commission = totalChargable * Number(percentageCommission) / 100;
    }

    let reference = await Utility.generateTrxReference();

    if (paymentWasMadeWith === enumType.paymentMethod.WALLET) {
      const balance = currentUser.wallet.balance ? currentUser.wallet.balance : 0;
      
      if (balance <= 0) {
        throw new BadRequestError('Failure. Wallet balance less than 1');
      }
      
      // don't pay VAS more than wallet LIMIT
      if (totalChargable > currentUser.wallet.limit) {
        throw new BadRequestError(`Failure. Amount exceeds limit ${currentUser.wallet.limit}`);
      }

      if (balance < totalChargablePlusCharges) { 
        throw new PaymentRequiredError('Failure. Insufficient balance');
      }

      /**
       * Non BVN users have a daily transaction limit of 1000
       * sum both wallet daily total trx and service daily trx
       */
      const todayTransactionAmount = await TransactionRepository.sumTransactionAmountByUserIdAndFilter(currentUser._id, { date: new Date(), status: enumType.transactionStatus.SUCCESSFUL });

      if (!todayTransactionAmount) {
        throw new NotFoundError('Failure. Could not retrieve daily transaction amount');
      }

      /**
       * check total amount exist is array
       */
      if (todayTransactionAmount.length > 0) {
        if (todayTransactionAmount[0].total) {
  
          if (currentUser.wallet.limit === enumType.walletDailyLimit.KYC_ONE) {
            if (Number(todayTransactionAmount[0].total) >= Number(currentUser.wallet.limit)) {
              throw new ForbiddenError('Failure. non-verified BVN users daily transaction limit exceeded!')
            }
          }
  
          /**
           * Check daily trx amount Against Wallet Limit
           */
          if (Number(todayTransactionAmount[0].total) > Number(currentUser.wallet.limit)) {
            throw new ForbiddenError('Failure. Daily transaction limit of ${currentUser.wallet.limit} exceeded!')
          }
        }
      }

      const transaction = await TransactionRepository.TransactionCreate({
        amount: totalChargable,
        serviceType, 
        user: currentUser._id,
        userId: currentUser.userId,
        transactionReference: reference,
        transactionId: Utility.getRandomInteger().toString().substring(1, 11),
        transactionType: enumType.transactionType.SERVICES,
        transactionResource: enumType.serviceType.DATA,
        paymentMethod: paymentWasMadeWith,
        wallet: currentUser.wallet._id,
        status: enumType.transactionStatus.INIT,
        serviceId: serviceID,
        serviceName: Service,
        initiatedAt: Date.now(),
        recipientName: `${currentUser.firstName} ${currentUser.lastName}`,
        recipientAccount: '',
        recipientPhone: mobileNumber,
        recipientAddress: '',
        preWalletBalance: balance,
        platform: enumType.platform.VTPASS,
        narration: 'Data Purchase',

        commission,
        charges: parseInt(charges, 10), // todo - cron

        commissionWallet, // todo - add commissionWallet to transactions
        totalPayable: totalChargable, // TODO - NEW
      });

      /**
       * Charge User wallet first before begining any transactions
       */
      let userWalletBal = (currentUser.wallet.balance - (totalChargable + parseInt(charges, 10)));

      const chargeUserWallet = await WalletRepository.insertWallet({ _id: currentUser.wallet._id}, {
        balance: userWalletBal,
        'meta.updatedAt': Date.now(),
      }, { new: true, upsert: false });
      
      if (!chargeUserWallet) {
        throw new NotFoundError('Could not charge user wallet')
      }

      let requestData = {
        request_id: transaction.transactionId,
        serviceID: sku,
        billersCode: mobileNumber,
        variation_code,
        amount,
        phone: mobileNumber,
      }

      const requestResult = await VTPASS_API.vtpassPay(requestData);
      transaction.responseBody = JSON.stringify(requestResult);
      
      if (requestResult && requestResult.code === '000' && requestResult.content.transactions.status === 'delivered') {
        transaction.client_transactionReference = requestResult.content.transactions.transactionId;
        transaction.status = enumType.transactionStatus.SUCCESSFUL;
        transaction.client_statusCode = String(requestResult.code);
        transaction.postWalletBalance = userWalletBal; // todo - cron
        transaction.message = 'Transaction successful';
        transaction.paidAt = Date.now();
        transaction.meta.updatedAt = Date.now();
        await TransactionRepository.TransactionSave(transaction);
        
        /**
         * issue commission
         */
         // TODO - issue commission to agents only
        if (currentUser.role === enumType.rolesType.AGENT || currentUser.role === enumType.rolesType.SUPERAGENT) {
          if (commission > 0) {
            await CommissionServices.issueCommission(transaction, currentUser, commission, commissionWallet)
          }
        }

        Pubsub.emit('data_purchase', { transaction, user: currentUser, variation: variation_code });
        return Utility.buildResponse({ data: transaction, message: 'Transaction Successful' });
      }

      if (requestResult && requestResult.code === '016') {
        /**
         * Transaction failed return user charge to wallet
         */
        userWalletBal = currentUser.wallet.balance;
      
        await WalletRepository.insertWallet({ _id: currentUser.wallet._id }, {
          balance: userWalletBal,
          'meta.updatedAt': Date.now(),
        }, { new: false, upsert: false });

        transaction.status = enumType.transactionStatus.FAILED;
        transaction.message = 'Transaction Failed';
        transaction.commission = 0;
        transaction.charges = 0;
        transaction.client_statusCode = requestResult.code;
        transaction.postWalletBalance = transaction.preWalletBalance;
        transaction.meta.updatedAt = Date.now();
        await TransactionRepository.TransactionSave(transaction);
        Pubsub.emit('data_purchase_failed', { transaction, currentUser });
        
        throw new InternalServerError('Transaction failed, try after some time');
      }

      if (requestResult && requestResult.code === '099') {
        // TODO - FIX
      }

      if (requestResult) {
        if (requestResult.code === '000' || requestResult.code === '099') {
          /**
           * Trx confirmed to be pending
           */
          // todo - set trx to pending send 200
          transaction.status = enumType.transactionStatus.PENDING;
          transaction.client_statusCode = String(requestResult.code);
          transaction.message = 'Transaction pending';
          transaction.paidAt = Date.now();
          transaction.meta.updatedAt = Date.now();
          await TransactionRepository.TransactionSave(transaction);
          
          return Utility.buildResponse({ data: transaction, message: 'Transaction Processed' });
        }
      }
      /**
       * Trx not confirmed put on pending
       */
      // todo - set trx to pending send 200
      transaction.status = enumType.transactionStatus.PENDING;
      transaction.client_statusCode = String(requestResult.code);
      transaction.message = 'Transaction pending';
      transaction.paidAt = Date.now();
      transaction.meta.updatedAt = Date.now();
      await TransactionRepository.TransactionSave(transaction);
      
      return Utility.buildResponse({ data: transaction, message: 'Transaction Processed' });
      
    }
    else if (paymentWasMadeWith === enumType.paymentMethod.CARD) {
      /**
       * @todo - Handle card transactions
       * Charge user added card or allow them pay with card and save card details
       * @todo - Version 2 
       */
      throw new BadRequestError('Card not integrated');
    }
    else if (paymentWasMadeWith === enumType.paymentMethod.SMS) {
      /**
       * @todo - Handle SMS transactions
       * User pay with sms and regiseter trx
       * @todo - Version 2 
       */
      throw new BadRequestError('Sms not integrated');
    } // todo - Add other payment method in between - App version 2
    else {
      throw new BadRequestError('Provide a valid payment method')
    }

  },

  /**
   * Make PrimeAirtime Subscription
   * @private
   */
  async makePrimeAirtimeSubscription(user: {}, serviceType: string, switchService: {}, params: { mobileNumber: string, serviceName: string, amount: number, paymentMadeWith: string, variation_code: string, customernumber? : number }) {
    const { mobileNumber, serviceName, amount, paymentMadeWith, variation_code, customernumber } = params;
    
    const resource = VariationHelper.resolvePrimeairtimeServices(serviceName, serviceType);
    if (!resource || resource.error) { throw new BadRequestError(resource.error ? resource.error: 'Invalid serviceName or serviceType') };
    const { Service, serviceID, sku, Product, percentageCommission } = resource;
    
    if (Product && !variation_code) { throw new BadRequestError('Variation code required') }
    
    if (serviceName === 'SPECTRANET_PIN' || serviceName === 'SMILE_BUNDLE' || serviceName === 'SMILE_TOP') {
      if (!variation_code) { throw new BadRequestError('Variation code required') }
    }

    const currentUser = user;
    
    const commissionWallet = await CommissionRepository.getCommissionWalletByUserId(currentUser._id);
    if (!commissionWallet) { throw new NotFoundError('Commission wallet not found'); }
    
    const paymentWasMadeWith = enumType.paymentMethod[paymentMadeWith];
    if (!paymentWasMadeWith) { throw new BadRequestError('Payment method not valid') };
    
    const totalChargable = parseInt(amount, 10);
    const charges = switchService.charges;
    const totalChargablePlusCharges = totalChargable + parseInt(charges, 10);

    let commission = 0;
    
    /**
     * Set commission base on user role
     */
    if (currentUser.role === enumType.rolesType.AGENT || currentUser.role === enumType.rolesType.SUPERAGENT) {
      commission = totalChargable * Number(percentageCommission) / 100;
    }

    let reference = await Utility.generateTrxReference();

    if (paymentWasMadeWith === enumType.paymentMethod.WALLET) {
      const balance = currentUser.wallet.balance ? currentUser.wallet.balance : 0;
      
      if (balance <= 0) {
        throw new BadRequestError('Failure. Wallet balance less than 1');
      }
      
      // don't pay VAS more than wallet LIMIT
      if (totalChargable > currentUser.wallet.limit) {
        throw new BadRequestError(`Failure. Amount exceeds limit ${currentUser.wallet.limit}`);
      }

      if (balance < totalChargablePlusCharges) { 
        throw new PaymentRequiredError('Failure. Insufficient balance');
      }

      /**
       * Non BVN users have a daily transaction limit of 1000
       * sum both wallet daily total trx and service daily trx
       */
      const todayTransactionAmount = await TransactionRepository.sumTransactionAmountByUserIdAndFilter(currentUser._id, { date: new Date(), status: enumType.transactionStatus.SUCCESSFUL });

      if (!todayTransactionAmount) {
        throw new NotFoundError('Failure. Could not retrieve daily transaction amount');
      }

      /**
       * check total amount exist is array
       */
      if (todayTransactionAmount.length > 0) {
        if (todayTransactionAmount[0].total) {
  
          if (currentUser.wallet.limit === enumType.walletDailyLimit.KYC_ONE) {
            if (Number(todayTransactionAmount[0].total) >= Number(currentUser.wallet.limit)) {
              throw new ForbiddenError('Failure. non-verified BVN users daily transaction limit exceeded!')
            }
          }
  
          /**
           * Check daily trx amount Against Wallet Limit
           */
          if (Number(todayTransactionAmount[0].total) > Number(currentUser.wallet.limit)) {
            throw new ForbiddenError('Failure. Daily transaction limit of ${currentUser.wallet.limit} exceeded!')
          }
        }
      }
      
      const transaction = await TransactionRepository.TransactionCreate({
        amount: totalChargable,
        serviceType, 
        user: currentUser._id,
        userId: currentUser.userId,
        transactionReference: reference,
        transactionId: Utility.getRandomInteger().toString().substring(1, 11),
        transactionType: enumType.transactionType.SERVICES,
        transactionResource: enumType.serviceType.DATA,
        paymentMethod: paymentWasMadeWith,
        wallet: currentUser.wallet._id,
        status: enumType.transactionStatus.INIT,
        serviceId: serviceID,
        serviceName: Service,
        initiatedAt: Date.now(),
        recipientName: `${currentUser.firstName} ${currentUser.lastName}`,
        recipientAccount: '',
        recipientPhone: mobileNumber,
        recipientAddress: '',
        preWalletBalance: balance,
        platform: enumType.platform.PRIMEAIRTIME,
        narration: 'Data Purchase',

        commission,
        charges: parseInt(charges, 10), // todo - cron

        commissionWallet, // todo - add commissionWallet to transactions
        totalPayable: totalChargable, // TODO - NEW
      });

      /**
       * Charge User wallet first before begining any transactions
       */
      let userWalletBal = (currentUser.wallet.balance - (totalChargable + parseInt(charges, 10)));

      const chargeUserWallet = await WalletRepository.insertWallet({ _id: currentUser.wallet._id}, {
        balance: userWalletBal,
        'meta.updatedAt': Date.now(),
      }, { new: true, upsert: false });
      
      if (!chargeUserWallet) {
        throw new NotFoundError('Could not charge user wallet')
      }

      let requestResult;

      // handle spectranet/smile bundle/smile topup
      if (serviceName === 'SPECTRANET_PIN' || serviceName === 'SMILE_BUNDLE' || serviceName === 'SMILE_TOP') {
        /**
         * Make Purchase
         */
        let requestData = {
          meter: mobileNumber,
          prepaid: false,
          customer_reference: reference,
        }

        requestResult = await PRIMEAIRTIME_API.topupPrimeairtimeMultichoice(requestData, serviceID, sku, variation_code, switchService.platformToken);
      }
      
      if (!requestResult) {
        /**
         * Make purchase
         */
        let requestData = {
          product_id: variation_code, // variation Code 
          denomination: totalChargable, 
          send_sms: false, 
          sms_text: "", 
          customer_reference: reference,
        };

        requestResult = await PRIMEAIRTIME_API.topupPrimeairtimeData(requestData, mobileNumber, switchService.platformToken);
      }
      
      transaction.responseBody = JSON.stringify(requestResult);
       
      if (requestResult && requestResult.status === 200 || requestResult.status === 201) {
        transaction.client_transactionReference = requestResult.reference;
        transaction.status = enumType.transactionStatus.SUCCESSFUL;
        transaction.client_statusCode = String(requestResult.status);
        transaction.postWalletBalance = userWalletBal; // todo - cron
        transaction.message = 'Transaction successful';
        transaction.paidAt = Date.now();
        transaction.meta.updatedAt = Date.now();
        const savedTrx = await TransactionRepository.TransactionSave(transaction);

        /**
         * issue commission
         * @todo
         */
        // TODO - issue commission to agents only
        if (currentUser.role === enumType.rolesType.AGENT || currentUser.role === enumType.rolesType.SUPERAGENT) {
          if (commission > 0) {
            await CommissionServices.issueCommission(transaction, currentUser, commission, commissionWallet)
          }
        }

        Pubsub.emit('data_purchase', { transaction: savedTrx, user: currentUser, variation: variation_code });
        
        return Utility.buildResponse({ data: savedTrx, message: 'Transaction Successful' });
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
        userWalletBal = currentUser.wallet.balance;
      
        await WalletRepository.insertWallet({ _id: currentUser.wallet._id }, {
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

        Pubsub.emit('data_purchase_failed', { transaction, currentUser });
        
        let errorMessage = requestResult.message ? requestResult.message : 'Service not available at the moment';
        if (requestResult.status === 402) {
          return Utility.buildFailedResponse({ message: errorMessage });
        }
        throw new InternalServerError(`${errorMessage}`);
      }

    }
    else if (paymentWasMadeWith === enumType.paymentMethod.CARD) {
      /**
       * @todo - Handle card transactions
       * Charge user added card or allow them pay with card and save card details
       * @todo - Version 2 
       */
      throw new BadRequestError('Card not integrated');
    }
    else if (paymentWasMadeWith === enumType.paymentMethod.SMS) {
      /**
       * @todo - Handle SMS transactions
       * User pay with sms and regiseter trx
       * @todo - Version 2 
       */
      throw new BadRequestError('Sms not integrated');
    } // todo - Add other payment method in between - App version 2
    else {
      throw new BadRequestError('Provide a valid payment method')
    }

  },

  /**
   * Verify Mobile Data Number
   * @private
   */
  //TODO - DOESNT REALLY WORK PROPERLY, CONSIDER REMOVING
  async verifyMobileDataNumber(params: { serviceName: string, mobileNumber: string }) {
    const serviceType = enumType.serviceType.DATA;
    const switchService = await ServiceSwitchRepository.findByServiceType(serviceType);
    if (!switchService) { throw new NotFoundError('Invalid service name or type, service not available') };

    switch (switchService.platform) {
      case enumType.platform.AIRVEND:
        return await this.makeAirvendVerifyMobileNumber(params, serviceType);
      case enumType.platform.VTPASS:
        return await this.makeVTPassVerifyMobileNumber(params, serviceType);
      case enumType.platform.PRIMEAIRTIME:
        return await this.makePrimeAirtimeVerifyMobileNumber(switchService, params, serviceType);
      default:
        throw new InternalServerError('Switch service not available, please contact support');
    }
  },

  /**
   * Make Airvend Verify Mobile Number
   * @private
   */
  async makeAirvendVerifyMobileNumber(params: { serviceName: string, mobileNumber: string }, serviceType: string) {
    const { serviceName, mobileNumber } = params;
    const resource = VariationHelper.resolveAirvendServices(serviceName, serviceType);
    if (!resource || resource.error) { throw new BadRequestError(resource.error ? resource.error: 'Invalid serviceName or serviceType') };
    const { Type, verify } = resource;
    if (!verify) { throw new BadRequestError('Service is not verifyable') };
    const result = await API.verifyAirvendService({ type: Type, account: mobileNumber });
    if (!result) { throw new InternalServerError('Could not verify try again later') }
    const { customernumber } = result.details.message;
    if (!customernumber) { throw new BadRequestError('Wrong number supplied') };
    return Utility.buildResponse({ data: result.details.message });
  },

  /**
   * Make VTPass Verify Mobile Number
   * @private
   */
  async makeVTPassVerifyMobileNumber(params: { serviceName: string, mobileNumber: string }, serviceType: string) {
    const { serviceName, mobileNumber } = params;
    /**
     * No SPECTRANET_PIN on VTPASS
     */
    // if (serviceName === 'SPECTRANET_PIN') {
    //   throw new InternalServerError('Service not available at this time');
    // }
    const resource = VariationHelper.resolveVtpassServices(serviceName, serviceType);
    if (!resource || resource.error) { throw new BadRequestError(resource.error ? resource.error: 'Invalid serviceName or serviceType') };
    if (!resource.verify) { throw new BadRequestError('Service is not verifyable') };

    const result = await VTPASS_API.vtpassVerifyAccount({ billersCode: mobileNumber, serviceID: resource.sku });
    if (!result) { throw new InternalServerError('Could not verify try again later') };
    if (result.code !== '000' || result.content.error) {
      let err = result.content && result.content.error ? result.content.error : 'Check number supplied or try again';
      throw new BadRequestError(err);
    }

    return Utility.buildResponse({ data: { 
        name: result.content.Customer_Name ? result.content.Customer_Name : '',
        account: result.content.Customer_District ? result.content.Customer_District : '',
        customernumber: result.content.Customer_District ? result.content.Customer_District : '',
      }
    });
  },

  /**
   * Make Prime Airtime Verify Mobile Number
   * @private
   */
  // TODO - NO VERIFY FOR PRIME DATA/INTERNET
  async makePrimeAirtimeVerifyMobileNumber(switchService: {}, params: { serviceName: string, mobileNumber: string }, serviceType: string) {
    const { serviceName, mobileNumber } = params;
    const resource = VariationHelper.resolvePrimeairtimeServices(serviceName, serviceType);
    if (!resource || resource.error) { throw new BadRequestError(resource.error ? resource.error: 'Invalid serviceName or serviceType') };
    if (!resource.verify) { throw new BadRequestError('Service is not verifyable') };

    const result = await PRIMEAIRTIME_API.verifyPrimeairtimeService({ meter: mobileNumber }, { productId: resource.sku, product: 'internet', platformToken: switchService.platformToken });
    
    if (!result) { throw new InternalServerError('Could not verify try again later') };
    if (result.status !== 200) {
      if (result.status === 400) { throw new BadRequestError(result.message) };
      let message = result.message ? result.message : 'Something went wrong'
      throw new InternalServerError(message);
    }
    return Utility.buildResponse({ data: { ...result.data } });
  },
  
};
