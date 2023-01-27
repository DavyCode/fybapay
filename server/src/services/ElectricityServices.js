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
import TransactionRepository from '../repository/TransactionRepository';
import CommissionRepository from '../repository/CommissionRepository';
import Pubsub from '../events/servicesEventListener';
import Charges from '../constant/charges';
import CommissionServices from './CommissionServices'
import WalletRepository from '../repository/WalletRepository';

export default {
  /**
   * Electricity Switch
   * @private
   */
  async vendElectricity(request) {
    const user = await UserRepository.getUserByIdWithWallet(request.user.id);
    if (!user) { throw new NotFoundError('User not found!') };
  
    const serviceType = enumType.serviceType.ELECTRICITY;
    
    const switchService = await ServiceSwitchRepository.findByServiceType(serviceType);
    if (!switchService) { throw new NotFoundError('Invalid service name or type, service not available') };
    if (switchService.platform === enumType.platform.AIRVEND) {
      if (!request.body.customernumber) { throw new BadRequestError(`customernumber is required for current platform ${enumType.platform.AIRVEND}`)}
    }
    const charges = switchService.charges;

    switch (switchService.platform) {
      case enumType.platform.AIRVEND:
        return await this.makeAirvendElectricitySubscription(user, serviceType, charges, request.body);
      case enumType.platform.VTPASS:
        return await this.makeVTPassElectricitySubscription(user, serviceType, switchService, request.body);
      case enumType.platform.PRIMEAIRTIME:
        return await this.makePrimeAirtimeElectricitySubscription(user, serviceType, switchService, request.body);
      default:
        throw new InternalServerError('Switch service not available, please contact support');
    }
  },

  /**
   * Make Airvend Electricity Subscription
   * @private
   */
  async makeAirvendElectricitySubscription(user: {}, serviceType: string, charges: number, params: { serviceName: string, amount: number, paymentMadeWith: string, customernumber : number, meterNumber: string, mobileNumber: string, customername?: string, customeraddress?: ?string }) {
    const { serviceName, amount, paymentMadeWith, customernumber, meterNumber, mobileNumber, customername, customeraddress } = params;
    
    const totalChargable = parseInt(amount, 10);
    const totalChargablePlusCharges = totalChargable + parseInt(charges, 10);
    
    const resource = VariationHelper.resolveAirvendServices(serviceName, serviceType);
    
    if (!resource || resource.error) { throw new BadRequestError(resource.error ? resource.error: 'Invalid serviceName or serviceType') };
    
    const { Service, serviceID, Type, verify, percentageCommission } = resource;
    
    if (verify && !customernumber) { throw new BadRequestError('Customer number required') }
    
    const currentUser = user;
    
    const commissionWallet = await CommissionRepository.getCommissionWalletByUserId(currentUser._id);
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
        serviceType, 
        amount: totalChargable,
        user: currentUser._id,
        userId: currentUser.userId,
        transactionReference: reference,
        transactionId: Utility.getRandomInteger().toString().substring(1, 11),
        transactionType: enumType.transactionType.SERVICES,
        transactionResource: enumType.serviceType.ELECTRICITY,
        paymentMethod: paymentWasMadeWith,
        wallet: currentUser.wallet._id,
        status: enumType.transactionStatus.INIT,
        serviceId: serviceID,
        serviceName: Service,
        initiatedAt: Date.now(),
        recipientName: customername ? customername : `${currentUser.firstName} ${currentUser.lastName}`,
        recipientAccount: meterNumber,
        recipientAddress: customeraddress? customeraddress: '',
        recipientPhone: mobileNumber,
        preWalletBalance: balance,
        platform: enumType.platform.AIRVEND,
        narration: '',

        commission,
        charges: parseInt(charges, 10), // todo: cron

        commissionWallet, // todo - add commissionWallet to transactions
        totalPayable: totalChargable, // TODO - NEW
      });

      /**
       * Charge User wallet first before beginning any transactions
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
       * Purchase service
       */
      let vendObject =  { 
        ref: reference, 
        amount: totalChargable, 
        account: meterNumber,
        customernumber,
        type: Type, 
        customerphone: mobileNumber,
      };

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

        Pubsub.emit('electricity_purchase', {transaction: savedTrx, currentUser});
        
        return Utility.buildResponse({ data: { 
            account: meterNumber, 
            name: customername? customername: '', 
            creditToken: vendResponse.details.creditToken.creditToken, 
            transaction: savedTrx 
          }, 
          message: 'Transaction Successful' 
        });
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
        Pubsub.emit('electricity_purchase_failed', { transaction, currentUser });
        
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
   * Make VTpass Electricity Subscription
   * @private
   * @todo - makeVTPassElectricitySubscription
   */
  async makeVTPassElectricitySubscription(user: {}, serviceType: string, switchService: {}, params: { serviceName: string, amount: number, paymentMadeWith: string, customernumber?: string, meterNumber: string, mobileNumber: string, customername?: string, customeraddress?: ?string }) {
    const { serviceName, amount, paymentMadeWith, customernumber, meterNumber, mobileNumber, customername, customeraddress } = params;
    const charges = switchService.charges;

    const totalChargable = parseInt(amount, 10);
    const totalChargablePlusCharges = totalChargable + parseInt(charges, 10);
    
    const resource = VariationHelper.resolveVtpassServices(serviceName, serviceType);
    if (!resource || resource.error) { throw new BadRequestError(resource.error ? resource.error: 'Invalid serviceName or serviceType') };
    const { Service, serviceID, sku, percentageCommission } = resource;
    
    const currentUser = user;
    
    const commissionWallet = await CommissionRepository.getCommissionWalletByUserId(currentUser._id);
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
        serviceType, 
        amount: totalChargable,
        user: currentUser._id,
        userId: currentUser.userId,
        transactionReference: reference,
        transactionId: Utility.getRandomInteger().toString().substring(1, 11),
        transactionType: enumType.transactionType.SERVICES,
        transactionResource: enumType.serviceType.ELECTRICITY,
        paymentMethod: paymentWasMadeWith,
        wallet: currentUser.wallet._id,
        status: enumType.transactionStatus.INIT,
        serviceId: serviceID,
        serviceName: Service,
        initiatedAt: Date.now(),
        recipientName: customername ? customername : `${currentUser.firstName} ${currentUser.lastName}`,
        recipientAccount: meterNumber,
        recipientAddress: customeraddress? customeraddress: '',
        recipientPhone: mobileNumber,
        preWalletBalance: balance,
        platform: enumType.platform.VTPASS,
        narration: 'Electricity Purchase',

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
        billersCode: meterNumber,
        variation_code: resource.serviceType,
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
        
        transaction.token = requestResult.Token ?
          requestResult.Token : requestResult.token ? requestResult.token : ''; // TODO - ADD token to all VENDOR TRX BODY
        
        transaction.recipientAddress = requestResult.Address ?
          requestResult.Address : customeraddress ? customeraddress: '';
        
        transaction.recipientName = requestResult.Name ? 
          requestResult.Name : customername ? customername : '';
        
        transaction.paidAt = Date.now();
        transaction.meta.updatedAt = Date.now();

        await TransactionRepository.TransactionSave(transaction);
        
        /**
         * issue commission
         * issue commission to agents only
         */
        if (currentUser.role === enumType.rolesType.AGENT || currentUser.role === enumType.rolesType.SUPERAGENT) {
          if (commission > 0) {
            await CommissionServices.issueCommission(transaction, currentUser, commission, commissionWallet)
          }
        }

        Pubsub.emit('electricity_purchase_vtpass', { 
          transaction,
          currentUser,
          requestResult,
          mobileNumber,

          meterNo: meterNumber,
          customer: requestResult.Name ? 
            requestResult.Name : customername ? customername : `${currentUser.firstName} ${currentUser.lastName}`,
          serviceName,
        });
        
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
        Pubsub.emit('electricity_purchase_failed', { transaction, currentUser });

        throw new InternalServerError('Service not available at the moment');
      }

      if (requestResult) {  // TODO - ATTEND TO PENDING TRANSACTIONS ON SCHEDULER
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
   * Make PrimeAirtime Electricity Subscription
   * @private
   * @todo - makePrimeAirtimeElectricitySubscription
   */
  async makePrimeAirtimeElectricitySubscription(user: {}, serviceType: string, switchService: {}, params: { serviceName: string, amount: number, paymentMadeWith: string, customernumber?: string, meterNumber: string, mobileNumber: string, customername?: string, customeraddress?: ?string }) {
    const charges = switchService.charges;
    const { serviceName, amount, paymentMadeWith, customernumber, meterNumber, mobileNumber, customername, customeraddress } = params;
    
    const totalChargable = parseInt(amount, 10);
    const totalChargablePlusCharges = totalChargable + parseInt(charges, 10);
    
    const resource = VariationHelper.resolvePrimeairtimeServices(serviceName, serviceType);
    if (!resource || resource.error) { throw new BadRequestError(resource.error ? resource.error: 'Invalid serviceName or serviceType') };
    const { Service, serviceID, sku, percentageCommission } = resource;
    
    const currentUser = user;
    
    const commissionWallet = await CommissionRepository.getCommissionWalletByUserId(currentUser._id);
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
        serviceType, 
        amount: totalChargable,
        user: currentUser._id,
        userId: currentUser.userId,
        transactionReference: reference,
        transactionId: Utility.getRandomInteger().toString().substring(1, 11),
        transactionType: enumType.transactionType.SERVICES,
        transactionResource: enumType.serviceType.ELECTRICITY,
        paymentMethod: paymentWasMadeWith,
        wallet: currentUser.wallet._id,
        status: enumType.transactionStatus.INIT,
        serviceId: serviceID,
        serviceName: Service,
        initiatedAt: Date.now(),
        recipientName: customername ? customername : `${currentUser.firstName} ${currentUser.lastName}`,
        recipientAccount: meterNumber,
        recipientAddress: customeraddress? customeraddress: '',
        recipientPhone: mobileNumber,
        preWalletBalance: balance,
        platform: enumType.platform.PRIMEAIRTIME,
        narration: '',

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
      let requestData = {
        customer_reference: reference, // todo - confirm
        meter: meterNumber,
        prepaid: resource.serviceType === 'prepaid' ? true : false,
        denomination: totalChargable,
        product_id: sku
      };

      const requestResult = await PRIMEAIRTIME_API.topupPrimeairtimeElectricity(requestData, switchService.platformToken);
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

        Pubsub.emit('electricity_purchase', { transaction: savedTrx, currentUser });
        
        return Utility.buildResponse({ data: { 
            account: meterNumber, 
            name: customername? customername: '', 
            creditToken: "", // todo: send electricity token
            transaction: savedTrx 
          }, 
          message: 'Transaction Successful' 
        });
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
        transaction.client_statusCode = requestResult.status;
        transaction.postWalletBalance = transaction.preWalletBalance;
        transaction.meta.updatedAt = Date.now();
        await TransactionRepository.TransactionSave(transaction);
        Pubsub.emit('electricity_purchase_failed', { transaction, currentUser });
        
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
   * Verify User Meter Number Switch
   * @param {string} serviceName
   * @param {string} meterNumber
   * @private
   */
  async verifyUserMeter(params: { serviceName: string, meterNumber: string }) {
    const serviceType = enumType.serviceType.ELECTRICITY;
    const switchService = await ServiceSwitchRepository.findByServiceType(serviceType);
    if (!switchService) { throw new NotFoundError('Invalid service name or type, service not available') };

    switch (switchService.platform) {
      case enumType.platform.AIRVEND:
        return await this.verifyUserMeterAirvend(params, serviceType);
      case enumType.platform.VTPASS:
        return await this.verifyUserMeterVTPass(params, serviceType);
      case enumType.platform.PRIMEAIRTIME:
        return await this.verifyUserMeterPrimeAirtime(params, serviceType, switchService);
      default:
        throw new InternalServerError('Switch service not available, please contact support');
    }
  },

  /**
   * Verify User Meter Number Airvend
   * @param {string} serviceName
   * @param {string} meterNumber
   * @private
   */
  async verifyUserMeterAirvend(params: { serviceName: string, meterNumber: string }, serviceType: string) {
    const { serviceName, meterNumber } = params;
    const resource = VariationHelper.resolveAirvendServices(serviceName, serviceType);
    if (!resource || resource.error) { throw new BadRequestError(resource.error ? resource.error: 'Invalid serviceName or serviceType') };
    if (!resource.verify) { throw new BadRequestError('Service is not verifyable') };
    const result = await API.verifyAirvendService({ type: resource.Type, account: meterNumber });
    if (!result) { throw new InternalServerError('Could not verify try again later') };
    // const { customernumber } = result.details.message;
    // if (!customernumber) { throw new BadRequestError('Wrong meter number supplied') };
    // return Utility.buildResponse({ data: result.details.message });

    const { customernumber, name, address, account, } = result.details.message; 
    if (!customernumber && name.length < 1 || name == ' ') { throw new NotFoundError('Wrong smart card number supplied') };
    
    return Utility.buildResponse({ data: {
        name,
        account,
        customernumber,
        address,
      } 
    });
  },

  /**
   * Verify User Meter Number VTPass
   * @private
   * @todo - verifyUserMeterVTPass
   */
  async verifyUserMeterVTPass(params: { serviceName: string, meterNumber: string }, serviceType: string) {
    const { serviceName, meterNumber } = params;
    const resource = VariationHelper.resolveVtpassServices(serviceName, serviceType);
    if (!resource || resource.error) { throw new BadRequestError(resource.error ? resource.error: 'Invalid serviceName or serviceType') };
    if (!resource.verify) { throw new BadRequestError('Service is not verifyable') };
    
    const result = await VTPASS_API.vtpassVerifyAccount({ billersCode: meterNumber, type: resource.serviceType, serviceID: resource.sku });

    if (!result) { throw new InternalServerError('Could not verify try again later') };
    if (result.code !== '000' || result.content.error) {
      let err = result.content && result.content.error ? result.content.error : 'Check number supplied or try again';
      throw new NotFoundError(err);
    }

    return Utility.buildResponse({ data: {
        name: result.content.Customer_Name ? result.content.Customer_Name : '',
        address: result.content.Address,
        account: meterNumber,
        customernumber: meterNumber,
      } 
    });
  },

  /**
   * Verify User Meter Number PrimeAirtime
   * @private
   */
  async verifyUserMeterPrimeAirtime(params: { serviceName: string, meterNumber: string }, serviceType: string, switchService: {}) {
    const { serviceName, meterNumber } = params;
    const resource = VariationHelper.resolvePrimeairtimeServices(serviceName, serviceType);
    if (!resource || resource.error) { throw new BadRequestError(resource.error ? resource.error: 'Invalid serviceName or serviceType') };
    if (!resource.verify) { throw new BadRequestError('Service is not verifyable') };
    
    const result = await PRIMEAIRTIME_API.verifyPrimeairtimeService({ meter: meterNumber }, { productId: resource.sku, product: 'electricity', platformToken: switchService.platformToken });
    if (!result) { throw new InternalServerError('Could not verify try again later') };
    if (result.status !== 200) {
      if (result.status === 400) { throw new NotFoundError(result.message) };
      let message = result.message ? result.message : 'Something went wrong'
      throw new InternalServerError(message);
    }
    const { name, address, number } = result.data;
    return Utility.buildResponse({ data: {
        name,
        address,
        account: number,
        customernumber: number,
      } 
    });
  },
  
};

//TODO - VT
// {
//   "code": "000",
//   "content": {
//       "transactions": {
//           "status": "delivered",
//           "product_name": "PHED - Port Harcourt Electric",
//           "unique_element": "0124001453826",
//           "unit_price": 1000,
//           "quantity": 1,
//           "service_verification": null,
//           "channel": "api",
//           "commission": 20,
//           "total_amount": 980,
//           "discount": null,
//           "type": "Electricity Bill",
//           "email": "pdaswift3009@gmail.com",
//           "phone": "08132078657",
//           "name": null,
//           "convinience_fee": 0,
//           "amount": 1000,
//           "platform": "api",
//           "method": "api",
//           "transactionId": "16043996961579156237202428"
//       }
//   },
//   "response_description": "TRANSACTION SUCCESSFUL",
//   "requestId": "0357061992",
//   "amount": "1000.00",
//   "transaction_date": {
//       "date": "2020-11-03 11:34:56.000000",
//       "timezone_type": 3,
//       "timezone": "Africa/Lagos"
//   },
//   "purchased_code": "Token : 65840954730860503623",
//   "customerName": "HENRY  AMADI",
//   "address": "8 RUKPAKULUSI ",
//   "meterNumber": "0124001453826",
//   "customerNumber": "0124001453826",
//   "token": "65840954730860503623",
//   "tokenAmount": "1000",
//   "tokenValue": "930.23",
//   "tariff": "30.23",
//   "businessCenter": null,
//   "exchangeReference": "031120205741389",
//   "units": "30.8",
//   "energyAmt": "930.23",
//   "vat": "69.77",
//   "arrears": null,
//   "revenueLoss": null
// }
// {
//   "code":"000",
//   "content":{
//     "transactions":{
//       "status":"delivered",
//       "product_name":
//       "Ikeja Electric Payment - PHCN",
//       "unique_element":"1010101010101",
//       "unit_price":1000,
//       "quantity":1,
//       "service_verification":null,
//       "channel":"api",
//       "commission":15,
//       "total_amount":985,
//       "discount":null,
//       "type":"Electricity Bill",
//       "email":"pdaswift3009@gmail.com",
//       "phone":"08132078657",
//       "name":null,
//       "convinience_fee":0,
//       "amount":1000,
//       "platform":"wallet",
//       "method":"api",
//       "transactionId":"1604193115285"
//     }
//   },
//   "response_description":"TRANSACTION SUCCESSFUL",
//   "requestId":"6983708201",
//   "amount":"1000.00",
//   "transaction_date":{
//     "date":"2020-11-01 02:11:55.000000",
//     "timezone_type":3,
//     "timezone":"Africa/Lagos"
//   },
//   "purchased_code":"",
//   "utilityName":null,
//   "exchangeReference":null,
//   "balance":null
// }

// {
//   requestResult: {
//     code: '000',
//     content: { transactions: [Object] },
//     response_description: 'TRANSACTION SUCCESSFUL',
//     requestId: '5820261668',
//     amount: '500.00',
//     transaction_date: {
//       date: '2020-11-04 01:04:21.000000',
//       timezone_type: 3,
//       timezone: 'Africa/Lagos'
//     },
//     purchased_code: 'Token : 40364652026905256691',
//     token: '40364652026905256691',
//     exchangeReference: '4780534156977207',
//     resetToken: null,
//     units: '500 kWh',
//     fixChargeAmount: null,
//     tariff: 'StubTariff',
//     taxAmount: null
//   }
// }