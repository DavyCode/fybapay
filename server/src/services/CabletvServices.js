// @flow

import { BadRequestError, InternalServerError, PaymentRequiredError, NotFoundError, ForbiddenError, NotAcceptableError } from '../utils/errors';
import ServiceSwitchRepository from '../repository/ServiceSwitchRepository';
import enumType, { service } from '../enumType';
import Utility from '../utils';
import VariationHelper from '../helpers/VariationHelper';
import API from './api/vendorServices/AIRVEND/airvendApiServices';
import PRIMEAIRTIME_API from './api/vendorServices/PRIMEAIRTIME/primeairtimeServices';
import VTPASS_API from './api/vendorServices/VTPASS/vtpassServices';
import UserRepository from '../repository/UserRepository';
import CommissionRepository from '../repository/CommissionRepository'
import TransactionRepository from '../repository/TransactionRepository';
import Pubsub from '../events/servicesEventListener';
import WalletRepository from '../repository/WalletRepository';
import CommissionServices from './CommissionServices';
import VariationServices from './VariationServices';

export default {

  /**
   * Cable TV Switch
   * @private
   */
  async vendCableTv(request) {
    const user = await UserRepository.getUserByIdWithWallet(request.user.id);
    if (!user) { throw new NotFoundError('User not found!') };
    
    // user: {}, params: { serviceName: string, amount: number, paymentMadeWith: string, customernumber : number, smartCardNumber: string, mobileNumber: string, customername ?: string, variation_code: string }
    const serviceType = enumType.serviceType.CABLETV;
    const switchService = await ServiceSwitchRepository.findByServiceType(serviceType);
    if (!switchService) { throw new NotFoundError('Invalid service name or type, service not available') };
    
    const charges = switchService.charges;

    switch (switchService.platform) {
      case enumType.platform.AIRVEND:
        return await this.makeAirvendCableTvSubscription(user, serviceType, charges, request.body);
      case enumType.platform.VTPASS:
        return await this.makeVTPassCableTvSubscription(user, serviceType, charges, request.body);
      case enumType.platform.PRIMEAIRTIME:
        return await this.makePrimeAirtimeCableTvSubscription(user, serviceType, switchService, request.body);
      default:
        throw new InternalServerError('Switch service not available, please contact support');
    }
  },

  /**
   * Make Airvend CableTv Subscription
   * @private
   */
  async makeAirvendCableTvSubscription(user: {}, serviceType: string, charges: number, params: { serviceName: string, amount: number, paymentMadeWith: string, customernumber : number, smartCardNumber: string, mobileNumber: string, customername ?: string, variation_code: string }) {
    const { serviceName, amount, paymentMadeWith, customernumber, smartCardNumber, mobileNumber, customername, variation_code } = params;
    
    const totalChargable = parseInt(amount, 10);
    const totalChargablePlusCharges = totalChargable + parseInt(charges, 10);
    
    const resource = VariationHelper.resolveAirvendServices(serviceName, serviceType);
    if (!resource || resource.error) { throw new BadRequestError(resource.error ? resource.error: 'Invalid serviceName or serviceType') };
    const { Service, serviceID, Type, verify, percentageCommission } = resource;
    
    const currentUser = user;
    
    if (verify && !customernumber) { throw new BadRequestError('Customer number required') }
    
    /** NEW LOGIC BEGINS
     * Check to get variation code
     */
    const variationData = await VariationServices.getServiceVariation({ serviceType, serviceName })
    if (!variationData) {
      throw new BadRequestError('Could not retrieve service variations')
    }

    const selectedVariation = await variationData.data.filter((resItem, i) => Object.values(resItem).includes(variation_code));
    if (!selectedVariation || selectedVariation.length < 1) {
      throw new BadRequestError('variation_code not available in variations list');
    }
    /** NEW LOGIC ENDS **/


    const commissionWallet = await CommissionRepository.getCommissionWalletByUserId (currentUser._id);
    if (!commissionWallet) { throw new NotFoundError('Commission wallet not found'); }

    const paymentWasMadeWith = enumType.paymentMethod[paymentMadeWith];
    if (!paymentWasMadeWith) { throw new BadRequestError('Payment method not valid') };
        
    let commission = 0;
    
    /**
     * Set commission base on user role
     */
    if (currentUser.role === enumType.rolesType.AGENT || currentUser.role === enumType.rolesType.SUPERAGENT) {
      commission = totalChargable * Number(percentageCommission) / 100;
    }

    const reference = await Utility.generateTrxReference();

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
        serviceType, 
        amount: totalChargable,
        user: currentUser._id,
        userId: currentUser.userId,
        transactionReference: reference,
        transactionId: Utility.getRandomInteger().toString().substring(1, 11),
        transactionType: enumType.transactionType.SERVICES,
        transactionResource: enumType.serviceType.CABLETV,
        paymentMethod: paymentWasMadeWith,
        wallet: currentUser.wallet._id,
        status: enumType.transactionStatus.INIT,
        serviceId: serviceID,
        serviceName: Service,
        initiatedAt: Date.now(),
        recipientName: customername ? customername : `${currentUser.firstName} ${currentUser.lastName}`,
        recipientAccount: smartCardNumber,
        recipientAddress: '',
        recipientPhone: mobileNumber,
        preWalletBalance: balance,
        platform: enumType.platform.AIRVEND,
        narration: `CableTv Purchase ${selectedVariation[0].name}`,

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

      /**
       * Make purchase
       */
      let vendObject = {
        ref: reference,
        amount: totalChargable,
        customernumber,
        account: smartCardNumber,
        customername: customername ? customername : '',
        invoicePeriod: 1, // todo: invoicePeriod ???
        type: Type
      };
      const vendResponse = await API.vendServices(vendObject);
      transaction.responseBody = JSON.stringify(vendResponse);

      if (vendResponse && vendResponse.confirmationCode === 200) { 
        // transaction.charges = parseInt(charges, 10);
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
        if (currentUser.role === enumType.rolesType.AGENT || currentUser.role === enumType.rolesType.SUPERAGENT) {
          if (commission > 0) {
            await CommissionServices.issueCommission(transaction, currentUser, commission, commissionWallet)
          }
        }

        Pubsub.emit('cabletv_purchase', {transaction: savedTrx, user: currentUser, cablePlan: selectedVariation[0].name});
        return Utility.buildResponse({ data: savedTrx, message: 'Transaction Successful' })
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
        Pubsub.emit('cabletv_purchase_failed', {transaction, currentUser});

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
      throw new BadRequestError('Provide a valid payment method or pay with Wallet')
    }

  },

    /**
   * Make VTpass CableTv Subscription
   * @private
   * @todo - makeVTPassCableTvSubscription
   */
  async makeVTPassCableTvSubscription(user: {}, serviceType: string, charges: number, params: { serviceName: string, amount: number, paymentMadeWith: string, customernumber : number, smartCardNumber: string, mobileNumber: string, customername ?: string, variation_code: string }) {
    const { serviceName, amount, paymentMadeWith, customernumber, smartCardNumber, mobileNumber, customername, variation_code } = params;
    
    const totalChargable = parseInt(amount, 10);
    const totalChargablePlusCharges = totalChargable + parseInt(charges, 10);

    const resource = VariationHelper.resolveVtpassServices(serviceName, serviceType);
    if (!resource || resource.error) { throw new BadRequestError(resource.error ? resource.error: 'Invalid serviceName or serviceType') };
    const { Service, serviceID, sku, verify, Product, percentageCommission } = resource;

    if (Product && !variation_code) { throw new BadRequestError('Variation code required') }

    const currentUser = user;

    /** NEW LOGIC BEGINS
     * Check to get variation code
     */
    const variationData = await VariationServices.getServiceVariation({ serviceType, serviceName })
    if (!variationData) {
      throw new BadRequestError('Could not retrieve service variations')
    }

    const selectedVariation = await variationData.data.filter((resItem, i) => Object.values(resItem).includes(variation_code));
    if (!selectedVariation || selectedVariation.length < 1) {
      throw new BadRequestError('variation_code not available in variations list');
    }
    /** NEW LOGIC ENDS **/
    

    const commissionWallet = await CommissionRepository.getCommissionWalletByUserId (currentUser._id);
    if (!commissionWallet) { throw new NotFoundError('Commission wallet not found'); }

    const paymentWasMadeWith = enumType.paymentMethod[paymentMadeWith];
    if (!paymentWasMadeWith) { throw new BadRequestError('Payment method not valid') };
    
    let commission = 0;
    
    /**
     * Set commission base on user role
     */
    if (currentUser.role === enumType.rolesType.AGENT || currentUser.role === enumType.rolesType.SUPERAGENT) {
      commission = totalChargable * Number(percentageCommission) / 100;
    }

    const reference = await Utility.generateTrxReference();

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
        serviceType, 
        amount: totalChargable,
        user: currentUser._id,
        userId: currentUser.userId,
        transactionReference: reference,
        transactionId: Utility.getRandomInteger().toString().substring(1, 11),
        transactionType: enumType.transactionType.SERVICES,
        transactionResource: enumType.serviceType.CABLETV,
        paymentMethod: paymentWasMadeWith,
        wallet: currentUser.wallet._id,
        status: enumType.transactionStatus.INIT,
        serviceId: serviceID,
        serviceName: Service,
        initiatedAt: Date.now(),
        recipientName: customername ? customername : `${currentUser.firstName} ${currentUser.lastName}`,
        recipientAccount: smartCardNumber,
        recipientAddress: '',
        recipientPhone: mobileNumber,
        preWalletBalance: balance,
        platform: enumType.platform.VTPASS,
        narration: `CableTv Purchase ${selectedVariation[0].name}`,
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
        billersCode: smartCardNumber,
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
        const savedTrx = await TransactionRepository.TransactionSave(transaction);
        
        /**
         * issue commission
         */
        // TODO - issue commission to agents only
        if (currentUser.role === enumType.rolesType.AGENT || currentUser.role === enumType.rolesType.SUPERAGENT) {
          if (commission > 0) {
            await CommissionServices.issueCommission(transaction, currentUser, commission, commissionWallet)
          }
        }

        Pubsub.emit('cabletv_purchase', { transaction: savedTrx, user: currentUser, cablePlan: selectedVariation[0].name });
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
        Pubsub.emit('cabletv_purchase_failed', { transaction, currentUser });

        throw new InternalServerError('Transaction failed, try after some time');
      }

      if (requestResult) {
        if (requestResult.code === '000' || requestResult.code === '099') {
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
      throw new BadRequestError('Provide a valid payment method or pay with Wallet')
    }
  },

  /**
   * Make PrimeAirtime CableTv Subscription
   * @private
   */
  async makePrimeAirtimeCableTvSubscription(user: {}, serviceType: string, switchService: {}, params: { serviceName: string, amount: number, paymentMadeWith: string, customernumber : number, smartCardNumber: string, mobileNumber: string, customername ?: string, variation_code: string }) {
    const charges = switchService.charges;
    const { serviceName, amount, paymentMadeWith, customernumber, smartCardNumber, mobileNumber, customername, variation_code } = params;
    
    const totalChargable = parseInt(amount, 10);
    const totalChargablePlusCharges = totalChargable + parseInt(charges, 10);
    
    const resource = VariationHelper.resolvePrimeairtimeServices(serviceName, serviceType);
    if (!resource || resource.error) { throw new BadRequestError(resource.error ? resource.error: 'Invalid serviceName or serviceType') };
    const { Service, serviceID, sku, verify, Product, percentageCommission } = resource;
    
    if (Product && !variation_code) { throw new BadRequestError('Variation code required') }

    const currentUser = user;
    
    /** NEW LOGIC BEGINS
     * Check to get variation code
     */
    const variationData = await VariationServices.getServiceVariation({ serviceType, serviceName })
    if (!variationData) {
      throw new BadRequestError('Could not retrieve service variations')
    }

    const selectedVariation = await variationData.data.filter((resItem, i) => Object.values(resItem).includes(variation_code));
    if (!selectedVariation || selectedVariation.length < 1) {
      throw new BadRequestError('variation_code not available in variations list');
    }
    /** NEW LOGIC ENDS **/
    

    const commissionWallet = await CommissionRepository.getCommissionWalletByUserId (currentUser._id);
    if (!commissionWallet) { throw new NotFoundError('Commission wallet not found'); }

    const paymentWasMadeWith = enumType.paymentMethod[paymentMadeWith];
    if (!paymentWasMadeWith) { throw new BadRequestError('Payment method not valid') };
    
    let commission = 0;
    
    /**
     * Set commission base on user role
     */
    if (currentUser.role === enumType.rolesType.AGENT || currentUser.role === enumType.rolesType.SUPERAGENT) {
      commission = totalChargable * Number(percentageCommission) / 100;
    }

    const reference = await Utility.generateTrxReference();

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
        serviceType, 
        amount: totalChargable,
        user: currentUser._id,
        userId: currentUser.userId,
        transactionReference: reference,
        transactionId: Utility.getRandomInteger().toString().substring(1, 11),
        transactionType: enumType.transactionType.SERVICES,
        transactionResource: enumType.serviceType.CABLETV,
        paymentMethod: paymentWasMadeWith,
        wallet: currentUser.wallet._id,
        status: enumType.transactionStatus.INIT,
        serviceId: serviceID,
        serviceName: Service,
        initiatedAt: Date.now(),
        recipientName: customername ? customername : `${currentUser.firstName} ${currentUser.lastName}`,
        recipientAccount: smartCardNumber,
        recipientAddress: '',
        recipientPhone: mobileNumber,
        preWalletBalance: balance,
        platform: enumType.platform.PRIMEAIRTIME,
        narration: `CableTv Purchase ${selectedVariation[0].name}`,

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

      /**
       * Make Purchase
       */
      let requestData = {
        meter: smartCardNumber,
        prepaid: false,
        customer_reference: reference,
      }
      
      const requestResult = await PRIMEAIRTIME_API.topupPrimeairtimeMultichoice(requestData, 'serviceID', sku, variation_code, switchService.platformToken);
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
         */
        // TODO - issue commission to agents only
        if (currentUser.role === enumType.rolesType.AGENT || currentUser.role === enumType.rolesType.SUPERAGENT) {
          if (commission > 0) {
            await CommissionServices.issueCommission(transaction, currentUser, commission, commissionWallet)
          }
        }

        Pubsub.emit('cabletv_purchase', { transaction: savedTrx, user: currentUser, cablePlan: selectedVariation[0].name });
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
        transaction.postWalletBalance = transaction.preWalletBalance
        transaction.meta.updatedAt = Date.now();
        await TransactionRepository.TransactionSave(transaction);
        Pubsub.emit('cabletv_purchase_failed', { transaction, currentUser });
        
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
      throw new BadRequestError('Provide a valid payment method or pay with Wallet')
    }


  },

  /**
   * Verify Smart Card Number Switch
   * @param {string} serviceName
   * @param {string} smartCardNumber
   * @private
   */
  async verifySmartCardNumber(params: { serviceName: string, smartCardNumber: string }) {
    const serviceType = enumType.serviceType.CABLETV;
    const switchService = await ServiceSwitchRepository.findByServiceType(serviceType);
    if (!switchService) { throw new NotFoundError('Invalid service name or type, service not available') };

    switch (switchService.platform) {
      case enumType.platform.AIRVEND:
        return await this.verifySmartCardNumberAirvend(params, serviceType);
      case enumType.platform.VTPASS:
        return await this.verifySmartCardNumberVTPass(params, serviceType);
      case enumType.platform.PRIMEAIRTIME:
        return await this.verifySmartCardNumberPrimeAirtime(params, serviceType, switchService);
      default:
        throw new InternalServerError('Switch service not available, please contact support');
    }
  },

  /**
   * Verify Smart Card Number Airvend
   * @param {string} serviceName
   * @param {string} smartCardNumber
   * @private
   */
  async verifySmartCardNumberAirvend(params: { serviceName: string, smartCardNumber: string }, serviceType: string) {
    const { serviceName, smartCardNumber } = params;
    const resource = VariationHelper.resolveAirvendServices(serviceName, serviceType);
    if (!resource || resource.error) { throw new BadRequestError(resource.error ? resource.error: 'Invalid serviceName or serviceType') };
    const { Type, verify } = resource;
    if (!verify) { throw new BadRequestError('Service is not verifyable') };
    const result = await API.verifyAirvendService({ type: Type, account: smartCardNumber });
    if (!result) { throw new InternalServerError('Could not verify try again later') };
    
    const { customernumber, name, accountstatus, account } = result.details.message;
    if (!customernumber && name.length < 1 || name == ' ') { throw new BadRequestError('Wrong smart card number supplied') };
    
    return Utility.buildResponse({ data: {
        name: String(name),
        account: String(account),
        customernumber: String(customernumber),
        accountstatus: accountstatus ? String(accountstatus) : 'OPEN',
      } 
    });
  },

  /**
   * Verify SmartCard NumberVTPass
   * @private
   * @todo - verifySmartCardNumberVTPass
   */
  async verifySmartCardNumberVTPass(params: { serviceName: string, smartCardNumber: string }, serviceType: string) {
    const { serviceName, smartCardNumber } = params;
    const resource = VariationHelper.resolveVtpassServices(serviceName, serviceType);
    if (!resource || resource.error) { throw new BadRequestError(resource.error ? resource.error: 'Invalid serviceName or serviceType') };
    if (!resource.verify) { throw new BadRequestError('Service is not verifyable') };

    const result = await VTPASS_API.vtpassVerifyAccount({ billersCode: smartCardNumber, serviceID: resource.sku});
    if (!result) { throw new InternalServerError('Could not verify try again later') };
    if (result.code !== '000' || result.content.error) {
      let err = result.content && result.content.error ? result.content.error : 'Check number supplied or try again';
      throw new BadRequestError(err);
    }
    
    return Utility.buildResponse({ data: { 
        name: result.content.Customer_Name ? String(result.content.Customer_Name) : '',
        account: String(smartCardNumber),
        customernumber: result.content.Customer_Number ? String(result.content.Customer_Number) : String(smartCardNumber),
        accountstatus: result.content.Status ? String(result.content.Status) : 'OPEN,'
      }
    });
    // startimes
    // content: {
    //   Customer_Name: 'EVANG AZEMOH DAVID',
    //   Balance: 671.31,
    //   Smartcard_Number: '01831554590'
    // }

    // dstv
    // Customer_Name: 'IFEOMA ONWUKA  ',
    // Status: 'OPEN',
    // Due_Date: '2020-08-19T00:00:00+01:00',
    // Customer_Number: 253313590

  },

  /**
   * Verify SmartCard Number PrimeAirtime
   * @private
   * @todo - verifySmartCardNumberPrimeAirtime
   */
  async verifySmartCardNumberPrimeAirtime(params: { serviceName: string, smartCardNumber: string }, serviceType: string, switchService: {}) {
    const { serviceName, smartCardNumber } = params;
    const resource = VariationHelper.resolvePrimeairtimeServices(serviceName, serviceType);
    if (!resource || resource.error) { throw new BadRequestError(resource.error ? resource.error: 'Invalid serviceName or serviceType') };
    if (!resource.verify) { throw new BadRequestError('Service is not verifyable') };
    
    const result = await PRIMEAIRTIME_API.verifyPrimeairtimeService({ meter: smartCardNumber }, { 
      productId: resource.sku, 
      product: 'dstv', 
      platformToken: switchService.platformToken 
    });
    
    if (!result) { throw new InternalServerError('Could not verify try again later') };
    if (result.status !== 200) {
      if (result.status === 400) { throw new BadRequestError(result.message) };
      let message = result.message ? result.message : 'Something went wrong'
      throw new InternalServerError(message);
    }
    const { name, address, number } = result.data;
    return Utility.buildResponse({ data: {
        name: String(name),
        // address:,
        account: String(smartCardNumber),
        customernumber: String(number),
        accountstatus: 'OPEN',
      } 
    });
  },
}