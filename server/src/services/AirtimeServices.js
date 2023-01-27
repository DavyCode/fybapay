// @flow

import { BadRequestError, ForbiddenError, PaymentRequiredError, NotFoundError, InternalServerError } from '../utils/errors';
import ServiceSwitchRepository from '../repository/ServiceSwitchRepository';
import enumType from '../enumType';
import VariationHelper from '../helpers/VariationHelper';
import UserRepository from '../repository/UserRepository';
import TransactionRepository from '../repository/TransactionRepository';
import CommissionRepository from '../repository/CommissionRepository';
import Utility from '../utils';
import AIRVEND_API from './api/vendorServices/AIRVEND/airvendApiServices';
import PRIMEAIRTIME_API from './api/vendorServices/PRIMEAIRTIME/primeairtimeServices';
import VTPASS_API from './api/vendorServices/VTPASS/vtpassServices';
import Pubsub from '../events/servicesEventListener';
import CommissionServices from './CommissionServices';
import WalletRepository from '../repository/WalletRepository';
import VariationServices from './VariationServices';

export default {
  /**
   * Airtime Top Up Switch
   * @public
   */
  async airtimeTopUp(request): Promise<any> {
    const user = await UserRepository.getUserByIdWithWallet(request.user.id);
    if (!user) { throw new NotFoundError('User not found!') };
    
    const serviceType = enumType.serviceType.AIRTIME
    const switchService = await ServiceSwitchRepository.findByServiceType(serviceType);
    if (!switchService) { throw new NotFoundError('Invalid service name or type, service not available') };

    const { mobileNumber, serviceName, amount, paymentMadeWith } = request.body;

    if (parseInt(amount, 10) <= 0) {
      throw new BadRequestError('Amount must be greater than 0');
    }

    switch (switchService.platform) {
      case enumType.platform.AIRVEND:
        return await this.makeAirvendSubscription(user, serviceType, request.body, switchService);
      case enumType.platform.VTPASS:
        return await this.makeVTPassSubscription(user, serviceType, request.body, switchService);
      case enumType.platform.PRIMEAIRTIME:
        return await this.makePrimeAirtimeSubscription(user, serviceType, request.body, switchService);
      case enumType.platform.RUBIES:
        return await this.makeRubiesSubscription(user, serviceType, request.body, switchService);
      default:
        throw new InternalServerError('Switch service not available, please contact support');
    }
  },

  /**
  * Make Airvend Subscription
  * @private
  */
  async makeAirvendSubscription(user: {}, serviceType: string, params: { mobileNumber: string, serviceName: string, amount: number, paymentMadeWith: string }, switchService: {}): Promise<any>  {
    const { mobileNumber, serviceName, amount, paymentMadeWith } = params;
    
    const resource = VariationHelper.resolveAirvendServices(serviceName, serviceType);
    if (!resource || resource.error) { throw new BadRequestError(resource.error ? resource.error: 'Invalid serviceName or serviceType') };
    const { Service, serviceID, Type, NetworkID, percentageCommission } = resource;
    
    const currentUser = user;
    
    const commissionWallet = await CommissionRepository.getCommissionWalletByUserId(currentUser._id);
    if (!commissionWallet) { throw new NotFoundError('Commission wallet not found'); }
    
    const totalChargable = parseInt(amount, 10)
    const { charges } = switchService;
    const totalChargablePlusCharges = totalChargable + parseInt(charges, 10);

    const paymentWasMadeWith = enumType.paymentMethod[paymentMadeWith];
    if (!paymentWasMadeWith) { throw new BadRequestError('Payment method not valid') }
    
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
        transactionResource: enumType.serviceType.AIRTIME,
        paymentMethod: paymentWasMadeWith,
        wallet: currentUser.wallet._id,
        status: enumType.transactionStatus.INIT,
        serviceId: serviceID,
        serviceName: Service,
        initiatedAt: Date.now(),
        recipientName: `${currentUser.firstName} ${currentUser.lastName}`,
        recipientAccount: mobileNumber,
        recipientPhone: mobileNumber,
        preWalletBalance: balance,
        platform: enumType.platform.AIRVEND,
        narration: 'Airtime Purchase',
        
        commission,
        charges: parseInt(charges, 10), // Number(charges),

        commissionWallet, // todo - add commissionWallet to transactions
        totalPayable: totalChargable, // TODO - NEW
      });

      /**
       * Charge User wallet first before beginning any transactions
       */
      let userWalletBal = (currentUser.wallet.balance - (totalChargable + parseInt(charges, 10)))
      
      const chargeUserWallet = await WalletRepository.insertWallet({ _id: currentUser.wallet._id }, {
        balance: userWalletBal,
        'meta.updatedAt': Date.now(),
      }, { new: true, upsert: false });

      if (!chargeUserWallet) {
        throw new NotFoundError('Could not charge user wallet')
      }

      let vendObject =  { amount: totalChargable, ref: reference, account: mobileNumber, networkid: NetworkID, type: Type };
      const vendResponse = await AIRVEND_API.vendServices(vendObject);
      transaction.responseBody = JSON.stringify(vendResponse);

      if (vendResponse && vendResponse.confirmationCode === 200) {

        transaction.client_transactionReference = vendResponse.details ? String(vendResponse.details.TransactionID) : '';
        transaction.status = enumType.transactionStatus.SUCCESSFUL;
        transaction.client_statusCode = String(vendResponse.confirmationCode);
        transaction.postWalletBalance = userWalletBal;
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

        Pubsub.emit('airtime_purchase', { transaction, user: currentUser });
        return Utility.buildResponse({ data: transaction, message: 'Transaction Successful' });
      }



      // todo - endpoint to call verify on airvend transactions
      // else if (vendResponse.error && vendResponse.error.code && vendResponse.error.code === 'ECONNABORTED') {
      //   /**
      //    * Trx not confirmed put on pending
      //    */
      //   // todo - set trx to pending send 200
      //   transaction.status = enumType.transactionStatus.PENDING;
      //   transaction.client_statusCode = vendResponse.status;
      //   transaction.message = 'Transaction pending';
      //   transaction.paidAt = Date.now();
      //   transaction.meta.updatedAt = Date.now();
      //   await TransactionRepository.TransactionSave(transaction);
        
      //   return Utility.buildResponse({ data: transaction, message: 'Transaction Processed' });
      // }
      else { // TODO: review result with live vend api
        /**
         * Transaction failed return user charge to wallet
         */
        userWalletBal = currentUser.wallet.balance;
      
        await WalletRepository.insertWallet({ _id: currentUser.wallet._id }, {
          balance: userWalletBal,
          'meta.updatedAt': Date.now(),
        }, { new: false, upsert: false });

        transaction.status = enumType.transactionStatus.FAILED;
        transaction.message = vendResponse.message;
        transaction.commission = 0;
        transaction.charges = 0;
        transaction.client_statusCode = vendResponse.confirmationCode;
        transaction.postWalletBalance = transaction.preWalletBalance;
        transaction.meta.updatedAt = Date.now();
        await TransactionRepository.TransactionSave(transaction);
        Pubsub.emit('airtime_purchase_failed', {transaction, currentUser});
        
        let errorMessage = vendResponse.message ? vendResponse.message : 'Service not available at the moment';
        if (vendResponse.confirmationCode === 402) {
          return Utility.buildFailedResponse({ message: errorMessage });
        }
        throw new InternalServerError(`${errorMessage}`)
      }

    }
    else if (paymentWasMadeWith === enumType.paymentMethod.CARD) {
      /**
       * @todo - Handle card transactions
       * Charge user added card or allow them pay with card and save card details
       * @todo - Version 2 
       */
      throw new BadRequestError('Card not integrated')
    }
    else if (paymentWasMadeWith === enumType.paymentMethod.SMS) {
      /**
       * @todo - Handle SMS transactions
       * User pay with sms and regiseter trx
       * @todo - Version 2 
       */
      throw new BadRequestError('Sms not integrated')
    } // todo - Add other payment method in between - App version 2
    else {
      throw new BadRequestError('Provide a valid payment method')
    }
  },

  /**
  * Make VTPASS Subscription
  * @private
  */
  async makeVTPassSubscription(user: {}, serviceType: string, params: { mobileNumber: string, serviceName: string, amount: number, paymentMadeWith: string }, switchService: {}): Promise<any>  {
    const { mobileNumber, serviceName, amount, paymentMadeWith } = params;
    
    const resource = VariationHelper.resolveVtpassServices(serviceName, serviceType);
    if (!resource || resource.error) { throw new BadRequestError(resource.error ? resource.error: 'Invalid serviceName or serviceType') };
    const { Service, serviceID, sku, percentageCommission } = resource;
    
    const currentUser = user;
    
    const commissionWallet = await CommissionRepository.getCommissionWalletByUserId(currentUser._id);
    if (!commissionWallet) { throw new NotFoundError('Commission wallet not found'); }

    const totalChargable = parseInt(amount, 10)
    const { charges } = switchService;
    const totalChargablePlusCharges = totalChargable + parseInt(charges, 10);
    
    const paymentWasMadeWith = enumType.paymentMethod[paymentMadeWith];
    if (!paymentWasMadeWith) { throw new BadRequestError('Payment method not valid'); }
    
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
        throw new NotFoundError('Could not retrieve daily transaction amount');
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
        transactionResource: enumType.serviceType.AIRTIME,
        paymentMethod: paymentWasMadeWith,
        wallet: currentUser.wallet._id,
        status: enumType.transactionStatus.INIT,
        serviceId: serviceID,
        serviceName: Service,
        initiatedAt: Date.now(),
        recipientName: `${currentUser.firstName} ${currentUser.lastName}`,
        recipientAccount: mobileNumber,
        recipientPhone: mobileNumber,
        preWalletBalance: balance,
        platform: enumType.platform.VTPASS,
        narration: 'Airtime Purchase',

        commission,
        charges: parseInt(charges, 10),

        commissionWallet, // todo - add commissionWallet to transactions
        totalPayable: totalChargable, // TODO - NEW
      });

      /**
       * Charge User wallet first before begining any transactions
       */
      let userWalletBal = (currentUser.wallet.balance - (totalChargable + parseInt(charges, 10)))

      const chargeUserWallet = await WalletRepository.insertWallet({ _id: currentUser.wallet._id }, {
        balance: userWalletBal,
        'meta.updatedAt': Date.now(),
      }, { new: true, upsert: false });
      
      if (!chargeUserWallet) {
        throw new NotFoundError('Could not charge user wallet')
      }

      let requestData = {
        request_id: transaction.transactionId,
        serviceID: sku,
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

        Pubsub.emit('airtime_purchase', { transaction, user: currentUser });
        return Utility.buildResponse({ data: transaction, message: 'Transaction Successful' });
      }

      if (requestResult && requestResult.code === '016') {
        // todo - failed
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
        Pubsub.emit('airtime_purchase_failed', { transaction, currentUser });
        
        throw new InternalServerError('Transaction failed, try after some time');
      }

      if (requestResult) {
        if (requestResult.code === '000' || requestResult.code === '099') {
          /**
           * Trx confirmed to be pending
           */
          // todo - set trx to pending send 200
          // transaction.client_transactionReference = requestResult.content.transactions.transactionId;
          transaction.status = enumType.transactionStatus.PENDING;
          transaction.client_statusCode = String(requestResult.code);
          // transaction.postWalletBalance = userWalletBal; // todo - cron
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
      // transaction.client_transactionReference = requestResult.content.transactions.transactionId;
      transaction.status = enumType.transactionStatus.PENDING;
      transaction.client_statusCode = String(requestResult.code);
      // transaction.postWalletBalance = userWalletBal; // todo - cron
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
      throw new BadRequestError('Card not integrated')
    }
    else if (paymentWasMadeWith === enumType.paymentMethod.SMS) {
      /**
       * @todo - Handle SMS transactions
       * User pay with sms and regiseter trx
       * @todo - Version 2 
       */
      throw new BadRequestError('Sms not integrated')
    } // todo - Add other payment method in between - App version 2
    else {
      throw new BadRequestError('Provide a valid payment method')
    }

  },

  /**
  * Make PrimeAirtime Subscription
  * @private
  */
  async makePrimeAirtimeSubscription(user: {}, serviceType: string, params: { mobileNumber: string, serviceName: string, amount: number, paymentMadeWith: string }, switchService: {}): Promise<any>  {
    const { mobileNumber, serviceName, amount, paymentMadeWith } = params;
  
    const resource = VariationHelper.resolvePrimeairtimeServices(serviceName, serviceType);
    if (!resource || resource.error) { throw new BadRequestError(resource.error ? resource.error: 'Invalid serviceName or serviceType') };
    const { Service, serviceID, sku, percentageCommission } = resource;
    
    const currentUser = user;
    
    const commissionWallet = await CommissionRepository.getCommissionWalletByUserId(currentUser._id);
    if (!commissionWallet) { throw new NotFoundError('Commission wallet not found'); }

    const totalChargable = parseInt(amount, 10)
    const { charges } = switchService;
    const totalChargablePlusCharges = totalChargable + parseInt(charges, 10);
    
    const paymentWasMadeWith = enumType.paymentMethod[paymentMadeWith];
    if (!paymentWasMadeWith) { throw new BadRequestError('Payment method not valid') }
    
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
        throw new NotFoundError('Could not retrieve daily transaction amount');
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
        transactionResource: enumType.serviceType.AIRTIME,
        paymentMethod: paymentWasMadeWith,
        wallet: currentUser.wallet._id,
        status: enumType.transactionStatus.INIT,
        serviceId: serviceID,
        serviceName: Service,
        initiatedAt: Date.now(),
        recipientName: `${currentUser.firstName} ${currentUser.lastName}`,
        recipientAccount: mobileNumber,
        recipientPhone: mobileNumber,
        preWalletBalance: balance,
        platform: enumType.platform.PRIMEAIRTIME,
        narration: 'Airtime Purchase',

        commission,
        charges: parseInt(charges, 10),

        commissionWallet, // todo - add commissionWallet to transactions
        totalPayable: totalChargable, // TODO - NEW
      });

      /**
       * Charge User wallet first before begining any transactions
       */
      let userWalletBal = (currentUser.wallet.balance - (totalChargable + parseInt(charges, 10)))

      const chargeUserWallet = await WalletRepository.insertWallet({ _id: currentUser.wallet._id }, {
        balance: userWalletBal,
        'meta.updatedAt': Date.now(),
      }, { new: true, upsert: false });
      
      if (!chargeUserWallet) {
        throw new NotFoundError('Could not charge user wallet')
      }

      /**
       * Make purchase
       */
      let requestData = {
        product_id: sku, 
        denomination: totalChargable, 
        send_sms: false, 
        sms_text: "", 
        customer_reference: reference,
      };

      const requestResult = await PRIMEAIRTIME_API.purchaseAirtimePrimeService(requestData, mobileNumber, switchService.platformToken);
      transaction.responseBody = JSON.stringify(requestResult);
            
      if (requestResult && requestResult.status === 200 || requestResult.status === 201) {
        
        transaction.client_transactionReference = requestResult.reference;
        transaction.status = enumType.transactionStatus.SUCCESSFUL;
        transaction.client_statusCode = String(requestResult.status);
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

        Pubsub.emit('airtime_purchase', { transaction, user: currentUser });
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
        transaction.client_statusCode = requestResult.status;
        transaction.postWalletBalance = transaction.preWalletBalance;
        transaction.meta.updatedAt = Date.now();
        await TransactionRepository.TransactionSave(transaction);
        Pubsub.emit('airtime_purchase_failed', { transaction, currentUser });
        
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
      throw new BadRequestError('Card not integrated')
    }
    else if (paymentWasMadeWith === enumType.paymentMethod.SMS) {
      /**
       * @todo - Handle SMS transactions
       * User pay with sms and regiseter trx
       * @todo - Version 2 
       */
      throw new BadRequestError('Sms not integrated')
    } // todo - Add other payment method in between - App version 2
    else {
      throw new BadRequestError('Provide a valid payment method')
    }
  },
  
  /**
   * makeRubiesSubscription
   * @private
   */
  async makeRubiesSubscription(user: {}, serviceType: string, params: { mobileNumber: string, serviceName: string, amount: number, paymentMadeWith: string }, switchService: {}): Promise<any>  {
    const { mobileNumber, serviceName, amount, paymentMadeWith } = params;




    
  },

  /**
   * verifyPrimeArtimeTransactions
   * @private
   * @description - MOVED TO Schedular
   */
  
  /**
   * verifyVtpassTransactions
   * @private
   * @description - MOVED TO Schedular
   */
};