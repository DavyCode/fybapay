// @flow
import { BadRequestError, InternalServerError, APIError, NotFoundError, ForbiddenError, NotAcceptableError } from '../utils/errors';
import ServiceSwitchRepository from '../repository/ServiceSwitchRepository';
import enumType, { service } from '../enumType';
import VariationHelper from '../helpers/VariationHelper';
import ServicesHelper from '../helpers/ServicesHelper';
import Utility from '../utils';
import API_AIRVEND from './api/vendorServices/AIRVEND/airvendApiServices';
import API_PAYSTACK from '../services/api/paystackServices';
import API_PRIMEAIRTIME from '../services/api/vendorServices/PRIMEAIRTIME/primeairtimeServices'
import banks from '../utils/banks';
import PlatformRepository from '../repository/PlatformRepository';
import Pubsub from '../events/schedularEventListener';

export default {
  
  /**
   * getPrimeAirtimeToken
   * @param {*} request
   * @private
   * @description - SCHEDULER
   * @todo - SCHEDULAR
   */
  async getPrimeAirtimeToken() {
    console.log(':::::::::::::: CRON JOB START:::::::::: getPrimeAirtimeTokenJob');

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

    console.log(':::::::::::::: CRON JOB END :::::::::: getPrimeAirtimeTokenJob');
    Pubsub.emit('get_PrimeAirtime_TokenJob', { data: result })
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
  
}