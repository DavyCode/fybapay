// @flow
import { BadRequestError, InternalServerError, APIError, NotFoundError, ForbiddenError, NotAcceptableError } from '../utils/errors';
import ServiceSwitchRepository from '../repository/ServiceSwitchRepository';
import UserRepository from '../repository/UserRepository';
import TransactionRepository from '../repository/TransactionRepository';
import enumType, { service } from '../enumType';
import VariationHelper from '../helpers/VariationHelper';
import ServicesHelper from '../helpers/ServicesHelper';
import Utility from '../utils';
import API_AIRVEND from './api/vendorServices/AIRVEND/airvendApiServices';
import API_PAYSTACK from '../services/api/paystackServices';
import API_PRIMEAIRTIME from '../services/api/vendorServices/PRIMEAIRTIME/primeairtimeServices';
import API_RUBIES from '../services/api/vendorServices/RUBIES/rubiesServices';
import VTPASS_API from './api/vendorServices/VTPASS/vtpassServices';
import banks from '../utils/banks';
import rubiesBankList from '../utils/rubiesBankList';
import primeBanks from '../utils/primeBanks';
import PlatformRepository from '../repository/PlatformRepository';
import BankHelper from '../helpers/BankHelper';

export default {
  /**
  * Get Approved Payment Methods
  * @private
  */
  async getApprovedPaymentMethods() {
    const paymentMethods = await ServicesHelper.getApprovedPaymentMethods()
    return Utility.buildResponse({ data: paymentMethods});
  },

  /**
   * Get Available Service Platforms
   * @private
   */
  async getAvailableServicePlatforms() {
    const platforms = await ServicesHelper.getAvailableServicePlatforms();
    return Utility.buildResponse({ data: platforms });
  },

  /**
   * getAvailableServiceTypes
   * @private
   */
  async getAvailableServiceTypes() {
    const serviceTypes = await ServicesHelper.getAvailableServiceTypes();
    return Utility.buildResponse({ data: serviceTypes });
  },

  /**
  * Get Service Variation
  * @private
  */
  async getServiceVariation(params: { serviceType: string, serviceName: string }) {
    const { serviceType, serviceName } = params;
    const switchService = await ServiceSwitchRepository.findByServiceType(serviceType);
    if (!switchService) { throw new NotFoundError('Invalid service name or type, service not available') };

    switch (switchService.platform) {
      case enumType.platform.AIRVEND:
        return await this.getAirvendVariation(serviceName, serviceType);
      case enumType.platform.VTPASS:
        return await this.getVTPassVariation(serviceName, serviceType);
      case enumType.platform.PRIMEAIRTIME:
        return await this.getPrimeAirtimeVariation(serviceName, serviceType, switchService);
      default:
        throw new InternalServerError('Switch service not available, please contact support');
    }
  },

  /**
  * Get Airvend Variation
  * @private
  */
  async getAirvendVariation(serviceName: string, serviceType: string) {
    const resource = VariationHelper.resolveAirvendServices(serviceName, serviceType);
    if (!resource || resource.error) { throw new BadRequestError(resource.error? resource.error: 'Invalid serviceName or serviceType') };
    if (!resource.Product) { throw new BadRequestError('No variation for service. Not available try later') };

    let variationPayload = {
      details: {
        ref: '',
        type: resource.Type,
        networkid: resource.NetworkID,
        account: ''
      }
    };
    
    const response = await API_AIRVEND.getAirvendVariation(variationPayload);
    if (!response) { throw new InternalServerError('Service not available at this time. Try later')}
    const airvendVariationResponse = response.details.message;
    const formatedVariation = await VariationHelper.formatVariation(airvendVariationResponse, enumType.platform.AIRVEND, serviceType)
    return Utility.buildResponse({ data: formatedVariation, message: 'Successful'})
  },

  /**
   * Get VTPass Variation
   * @param {*} serviceName 
   * @param {*} serviceType
   * @private 
   */
  async getVTPassVariation(serviceName: string, serviceType: string) {
    const resource = VariationHelper.resolveVtpassServices(serviceName, serviceType);
    if (!resource || resource.error) { throw new BadRequestError(resource.error? resource.error: 'Invalid serviceName or serviceType') };
    if (!resource.Product) { throw new BadRequestError('No variation for service. Not available try later') };

    const response = await VTPASS_API.vtpassVariation(resource.sku);

    if (!response) { throw new InternalServerError('Service not available at this time. Try later')}
    if (response.response_description !== '000' || response.content.error) {
      let err = response.content && response.content.error ? response.content.error : 'Could not retrieve variation try again';
      throw new NotFoundError(err);
    }
    
    const formatedVariation = await VariationHelper.formatVariation(response.content.varations, enumType.platform.VTPASS, serviceType)
    
    return Utility.buildResponse({ data: formatedVariation, message: 'Successful' });
  },

  /**
  * get PrimeAirtime Variation
  * @private
  */
  async getPrimeAirtimeVariation(serviceName: string, serviceType: string, switchService: {}) {
    const resource = VariationHelper.resolvePrimeairtimeServices(serviceName, serviceType);
    let err = resource.error ? resource.error : 'Invalid serviceName or serviceType';
    
    if (!resource || resource.error) { throw new BadRequestError(err) };
    if (!resource.Product) { throw new BadRequestError('No variation for service. Not available try later') };

    // console.log({ resource })
    if (serviceType === enumType.serviceType.CABLETV) {
      const result = await API_PRIMEAIRTIME.getPrimeairtimeMultichoiceVariation('dstv', resource.sku, switchService.platformToken);
      if (!result) { throw new InternalServerError('Service not available at this time. Try later'); }
      
      const formatedVariation = await VariationHelper.formatVariation(result.products, enumType.platform.PRIMEAIRTIME, serviceType);
      return Utility.buildResponse({ data: formatedVariation, message: 'Successful'})
    }

    if (serviceType === enumType.serviceType.DATA) {
      let result;
      
      if (serviceName === 'SPECTRANET_PIN' || serviceName === 'SMILE_BUNDLE') {
        result = await API_PRIMEAIRTIME.getPrimeairtimeMultichoiceVariation('internet', resource.sku, switchService.platformToken);
      }
      if (!result) {
        result = await API_PRIMEAIRTIME.getPrimeairtimeDataVariation(switchService.platformToken, resource.msisdn)
      }
      if (!result) {
        throw new InternalServerError('Service not available at this time. Try later');
      }
      
      const formatedVariation = await VariationHelper.formatVariation(result.products, enumType.platform.PRIMEAIRTIME, serviceType, serviceName);
      
      return Utility.buildResponse({ data: formatedVariation, message: 'Successful' });
    }

    if (serviceType === enumType.serviceType.JAMB) {
      return Utility.buildResponse({ data: [], message: 'Variation not setup yet'})
    }
    if (serviceType === enumType.serviceType.WAEC) {
      return Utility.buildResponse({ data: [], message: 'Variation not setup yet'})
    }

    throw new BadRequestError('Unknown Service Type')
  },

  /**
  * Get Available Service Resource
  * @private
  */
  async getAvailableServiceResource() {
    const availableServices = ServicesHelper.getAvailableServiceResource();
    if (!availableServices || availableServices.length < 1) { throw new InternalServerError('Services could not be retrieved at this time') };
    return Utility.buildResponse({ data: availableServices });
  },

    /**
   * Get All Service Charges
   * @private
   */
  // TODO - DEPRECATED
  async getAllServiceCharges() {
    const services = await ServiceSwitchRepository.getAllServices();
    if (!services) { throw new NotFoundError('Services not found') };

    const serviceList = [];
    services.forEach(service => {
      const { serviceType, charges, chargesApply } = service;
      serviceList.push({ serviceType, charges, chargesApply })
    });
    return Utility.buildResponse({ data: serviceList })
  },

    /**
   * Get One Charge
   * @param {string} serviceType 
   */
  // TODO - DEPRECATED
  async getOneCharge(request: any) {
    const service = await ServiceSwitchRepository.findByServiceTypeOrPlatform(request.query);
    if (!service.data || service.data.length < 1) { throw new NotFoundError('Service not found') };

    const { serviceType, charges, chargesApply } = service.data[0];
    return Utility.buildResponse({ data: { serviceType, charges, chargesApply } });
  },

  /**
   * getAllUserServiceCharges
   * @param {*} request
   * @desc - returns charges for all available services
   * @desc - returns user daily allowed transaction amount
   */
  async getAllServiceChargesByUser(request) {
    const user = await UserRepository.getUserByIdWithWallet(request.user.id);
    if (!user) { throw new NotFoundError('User not found'); }

    const services = await ServiceSwitchRepository.getAllServices();
    if (!services) { throw new NotFoundError('Services not found') };

    let userDailyAllowedTransaction = user.wallet.limit;
    // userDailyAvailableTransaction
    const todayTransactionAmount = await TransactionRepository.sumTransactionAmountByUserIdAndFilter(user._id, { date: new Date(), status: enumType.transactionStatus.SUCCESSFUL });

    if (!todayTransactionAmount) {
      throw new NotFoundError('Failure. Could not retrieve daily transaction amount');
    }

    /**
     * check total amount exist is array
     */
    if (todayTransactionAmount.length > 0) {
      if (todayTransactionAmount[0].total) {
        let amount = user.wallet.limit - todayTransactionAmount[0].total;

        if (amount < 1) {
          userDailyAllowedTransaction = 0
        }
        else {
          userDailyAllowedTransaction = amount;
        }
      }
    }

    const serviceList = [];
    services.forEach(service => {
      const { serviceType, charges, chargesApply } = service;
      serviceList.push({ serviceType, charges, chargesApply })
    });

    return Utility.buildResponse({ 
      data: serviceList, 
      userDailyAllowedTransaction: parseInt(userDailyAllowedTransaction, 10),
    });
  },

  /**
   * getOneChargeByUser
   * @param {*} request 
   * @public
   */
  async getOneChargeByUser(request: any) {
    const user = await UserRepository.getUserByIdWithWallet(request.user.id);
    if (!user) { throw new NotFoundError('User not found'); }

    const service = await ServiceSwitchRepository.findByServiceTypeOrPlatform(request.query);
    
    if (!service.data || service.data.length < 1) { 
      throw new NotFoundError('Service not found')
    };

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

    if (userDailyAllowedTransaction < 1) {
      throw new ForbiddenError('Failure. Daily transaction limit exceeded');
    }

    const { serviceType, charges, chargesApply } = service.data[0];
    return Utility.buildResponse({ 
      data: { 
        serviceType,
        charges,
        chargesApply,
      }, 
      userDailyAllowedTransaction: parseInt(userDailyAllowedTransaction, 10),
    });
  },

  /**
   * getPrimeAirtimeToken
   * @param {*} request
   * @private
   * @description - SCHEDULER
   * @todo - SCHEDULAR
   */
  async getPrimeAirtimeToken() {
    const result = await API_PRIMEAIRTIME.authorizePrimeairtime();

    if (result) {
      await ServiceSwitchRepository.insertManyService({ platform: enumType.platform.PRIMEAIRTIME }, {
        platformToken: result.token,
        'meta.updatedAt': Date.now(),
      }, { new: false, upsert: false });

      await PlatformRepository.platformInsert({ platform: enumType.platform.PRIMEAIRTIME }, {
        platformToken: result.token,
        'meta.updatedAt': Date.now(),
      }, { new: false, upsert: false })
    }
  },

  /**
   * getPlatformToken
   * @param {*} platform
   * @private 
   */
  async getPlatformToken(platform: string) {
    const service = await PlatformRepository.findByPlatform(platform)

    if (service) {
      return service.platformToken;
    }

    return false;
  },
  
  /**
   * get listed banks
   * @private
   */
  // TODO - DEPRECATED
  async getListedBanks() {
    return Utility.buildResponse({ data: banks })
  },

  /**
   * formatBankJson
   * @param {Array} bankJson
   * @private
   */
  async formatBankJson(bankJson: array, platform: string) {
    let sortedList = [];

    if (platform === enumType.platform.GLADEPAY) {
      return bankJson;
    }
    else if (platform === enumType.platform.PRIMEAIRTIME) {
      return bankJson;
      // for (let i = 0; i < bankJson.length; i++) {
      //   console.log({ i: bankJson[i] })

      //   sortedList.push({
      //     [bankJson[i].sortCode]: bankJson[i].name,
      //     bankName: bankJson[i].name,
      //     bankCode: bankJson[i].sortCode,
      //     sortCode: bankJson[i].sortCode,
      //   })
      // }
      // return sortedList;
    }
    else if (platform === enumType.platform.RUBIES) {
      return bankJson;
      // for (let i = 0; i < bankJson.length; i++) {
      //   sortedList.push({
      //     [bankJson[i].bankcode]: bankJson[i].bankname,
      //     bankName: bankJson[i].bankname,
      //     bankCode: bankJson[i].bankcode,
      //     sortCode: bankJson[i].bankcode,
      //   })
      // }
      // return sortedList
    }
    else {
      return
    }
  },

    /**
   * getListedBanksV2
   * @param {*} request 
   * @public
   */
  async getListedBanksForTransferV2(request) {
    /**
     * Get all the banks associated to TRANSFER
     */
    const serviceType = enumType.serviceType.TRANSFER;
    const switchService = await ServiceSwitchRepository.findByServiceType(serviceType);
    if (!switchService) { throw new NotFoundError('Invalid service name or type, service not available'); }

    switch (switchService.platform) {
      case enumType.platform.GLADEPAY:
        return await this.listedBanksForGladePay();
      case enumType.platform.PRIMEAIRTIME:
        return await this.listedBanksForPrimeAirtime();
      case enumType.platform.RUBIES:
        return await this.listedBanksForRubies();
      // case enumType.platform.PROVIDOUS:
      //   return await this.transferProvidousPay(user, request.body, switchService);
      default:
        throw new InternalServerError('Switch service not available, please contact support');
    }
  },

  /**
   * listedBanksForGladePay
   */
  async listedBanksForGladePay() {
    const formatedList = await this.formatBankJson(banks, enumType.platform.GLADEPAY);
    
    if (!formatedList) {
      throw new InternalServerError('Could not retrieve bank list');
    }
    return Utility.buildResponse({ data: formatedList });
  },

  /**
   * listedBanksForRubies
   */
  async listedBanksForRubies() {
    const formatedList = await this.formatBankJson(rubiesBankList, enumType.platform.RUBIES);
    
    if (!formatedList) {
      throw new InternalServerError('Could not retrieve bank list');
    }
    return Utility.buildResponse({ data: formatedList });
  },

  /**
   * listedBanksForPrimeAirtime
   */
  async listedBanksForPrimeAirtime() {
    const formatedList = await this.formatBankJson(primeBanks, enumType.platform.PRIMEAIRTIME);
    
    if (!formatedList) {
      throw new InternalServerError('Could not retrieve bank list');
    }
    return Utility.buildResponse({ data: formatedList });
  },

  /**
   * verifyBankAccount
   * @param {*} request
   * @public
   */
  async verifyBankAccount(request) {
    const { bankCode, bankAccount } = request.body;

    const bankDetails = await API_PAYSTACK.verifyBankDetails(bankAccount, bankCode);

    if (bankDetails.error && bankDetails.statusCode === 422) {
      throw new BadRequestError(bankDetails.error);
    }
    if (bankDetails.error) {
      throw new InternalServerError('Could not verify bank account at this time');
    }

    return Utility.buildResponse({ message: 'Bank details verified', data: bankDetails });
  },

  /**
   * verifyBankAccountForTransfersV2
   * @param {*} request 
   */
  async verifyBankAccountForTransfersV2(request) {
    const serviceType = enumType.serviceType.TRANSFER;
    const switchService = await ServiceSwitchRepository.findByServiceType(serviceType);
    if (!switchService) { throw new NotFoundError('Invalid service name or type, service not available'); }

    switch (switchService.platform) {
      case enumType.platform.GLADEPAY:
        return await this.verifyBankForGladePay(request);
      case enumType.platform.PRIMEAIRTIME:
        return await this.verifyBankForPrimeAirTime(request, switchService);
      case enumType.platform.RUBIES:
        return await this.verifyBankForRubies(request);
      // case enumType.platform.PROVIDOUS:
      //   return await this.transferProvidousPay();
      default:
        throw new InternalServerError('Switch service not available, please contact support');
    }
  },

  /**
   * verifyBankForGladePay
   * @param {*} request 
   */
  async verifyBankForGladePay(request) {
    const { bankCode, bankAccount } = request.body;

    const bankDetails = await API_PAYSTACK.verifyBankDetails(bankAccount, bankCode);

    if (bankDetails.error && bankDetails.statusCode === 422) {
      throw new BadRequestError(bankDetails.error);
    }
    if (bankDetails.error) {
      throw new InternalServerError('Could not verify bank account at this time');
    }

    return Utility.buildResponse({ 
      message: 'Bank details verified',
      data: {
        account_number: bankDetails.account_number,
        account_name: bankDetails.account_name,
        bank_name: "N/A",
        bank_code: bankCode,
        bank_id: bankDetails.bank_id ? bankDetails.bank_id : 1,
      }
    });
  },
  
  /**
   * verifyBankForPrimeAirTime
   * @param {*} request 
   */
  async verifyBankForPrimeAirTime(request, switchService) {
    const { bankCode, bankAccount } = request.body;

    /**
     * Check prime, and also check main list
     */
    const bank = await BankHelper.getprimeAirtimeBankByBankCode(bankCode);
    if (!bank) { throw new NotFoundError(`Bank with bank code: ${bankCode} not found`); }

    const bankDetails = await API_PRIMEAIRTIME.verifyBankPrimeAirtime({
      accountNumber: bankAccount,
      sortCode: bank.sortCode,
      platformToken: switchService.platformToken
    });

    if (bankDetails.error && bankDetails.status === 404) {
      throw new BadRequestError(bankDetails.error);
    }

    if (bankDetails.error) {
      throw new InternalServerError('Could not verify bank account at this time');
    }

    return Utility.buildResponse({ 
      message: 'Bank details verified',
      data: {
        account_number: bankDetails.target_accountNumber,
        account_name: bankDetails.target_accountName ? bankDetails.target_accountName : 'N/A', 
        bank_name: bankDetails.target_bankName ? bankDetails.target_bankName : 'N/A',
        bank_code: bankDetails.target_bankCode ? bankDetails.target_bankCode : bankCode,
        bank_id: Number(bankCode),
      },
    });
  },

  /**
   * verifyBankForRubies
   * @param {*} request 
   */
  async verifyBankForRubies(request) {
    const { bankCode, bankAccount } = request.body;

    /**
     * Check prime, and also check main list
     */
    const bank = await BankHelper.getRubiesBankByBankCode(bankCode);
    if (!bank) { throw new NotFoundError(`Bank with bank code: ${bankCode} not found`); }

    const bankDetails = await API_RUBIES.verifyBankViaRubies(bankAccount, bank.sortCode);

    if (!bankDetails) {
      throw new BadRequestError('Could not retrieve bank details, check account number');
    }

    return Utility.buildResponse({ 
      message: 'Bank details verified',
      data: {
        account_number: bankDetails.accountnumber,
        account_name: bankDetails.accountname ? bankDetails.accountname : 'N/A' ,
        bank_name: "N/A",
        bank_code: bankDetails.bankcode,
        bank_id: Number(bankCode),
      },
    });
  },
};


  //   "data": {
  //     "account_number": "0214614720",
  //     "account_name": "AZEMOH PAUL DAVID",
  //     "bank_id": 9
  // },

  // PRIME
    // "data": {
    //   "target_accountNumber": "0214614720",
    //   "target_accountName": "AZEMOH PAUL DAVID",
    //   "target_bankCode": "000013",
    //   "target_bankName": "GTBank Plc",
    //   "transaction_fee": "20.00",
    //   "transaction_currency": "NGN",
    //   "destination_currency": "NGN",
    //   "rate": 1
    // },

    // RUBIES
  //   {
  //     "responsedatetime": "2020-11-18 00:33:08.787",
  //     "responsecode": "00",
  //     "accountnumber": "1019966984",
  //     "accountname": "PAUL DAVID AZEMOH",
  //     "kyc": "3",
  //     "responsemessage": "success",
  //     "sessionid": "090175201118123307111880708378",
  //     "bvn": "N/A",
  //     "bankcode": "000008"
  // }

  // PAYSTACK
    // "data": {
    //   "account_number": "0214614720",
    //   "account_name": "AZEMOH PAUL DAVID",
    //   "bank_id": 9,
    //   "bank_name": "",
    //   "bank_code": "058"
    // },
