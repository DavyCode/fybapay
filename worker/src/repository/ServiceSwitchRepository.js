// @flow

/**
 * Switch Database Operations
 */

import { ServiceSwitch, ServiceSwitchLog } from '../models';
import Utility from '../utils';

export default {
  /**
  * Find Service By Id
  * @private
  */
  async findByServiceType(serviceType: string) {
    return await ServiceSwitch.findOne({ serviceType });
  },

  /**
  * Find Switch Service By Platform
  * @private
  */
  async findByServiceTypeOrPlatform (query?: {
    skip?: number, 
    limit?: number, 
    serviceType?: String,
    platform?: string,
    date?: string,
    startDate?: string,
    endDate?: string,
    search?: string,
    chargesApply?: boolean,
  }) {
    let paginate = { skip: 0, limit: 10 }
    if (query && query.skip && query.limit) {
      paginate.skip = Number(query.skip);
      paginate.limit = Number(query.limit);
    }

    if (query && query.search) {
      const regex = new RegExp(Utility.escapeRegex(query.search), 'gi');
      const data = await ServiceSwitch.find(
        { $text: { $search: regex } },
        { score: { $meta: "textScore" } }
      )
      .sort( { 'meta.createdAt': -1, score: { $meta: "textScore" } } )
      .skip(paginate.skip)
      .limit(paginate.limit)

      const totalDocumentCount = await ServiceSwitch.countDocuments({
        $text: { $search: regex },
      });
      
      return Promise.resolve({ data: data, totalDocumentCount, skip: paginate.skip, limit: paginate.limit, queryWith: query });
    }
    
    let filterParams = { ...query };

    if (query.date) {
      filterParams['meta.createdAt'] = {
        $gte: new Date(new Date(query.date).setHours('00', '00', '00')),
        $lt: new Date(new Date(query.date).setHours(23, 59, 59))
      }
    }
    if (query.startDate && query.endDate) {
      filterParams['meta.createdAt'] = {
        $gte: new Date(new Date(query.startDate).setHours('00', '00', '00')),
        $lt: new Date(new Date(query.endDate).setHours(23, 59, 59))
      }
    }

    delete filterParams.skip;
    delete filterParams.limit;
    delete filterParams.date;
    delete filterParams.endDate;
    delete filterParams.startDate;

    const data = await ServiceSwitch
    .find({ ...filterParams })
    .skip(paginate.skip)
    .limit(paginate.limit)
    .sort({'meta.createdAt': -1})
  
    const totalDocumentCount = await ServiceSwitch.countDocuments({
      ...filterParams,
    });

    return Promise.resolve({ data: data, totalDocumentCount, skip: paginate.skip, limit: paginate.limit, queryWith: query });
  },

  /**
  * Get all Switch Service
  * @private
  */
  async getAllServices() {
    return await ServiceSwitch.find({});
  },

  /**
  * Insert Switch Service
  * @private
  */
  async insertService(query: {}, update: {}, option: { new: boolean, upsert: boolean }) {
    return await ServiceSwitch.findOneAndUpdate(query, update, option);
  },

  /**
   * insertManyService
   * @param {*} query 
   * @param {*} update 
   * @param {*} option 
   * @private
   */
  async insertManyService(query: {}, update: {}, option: { new: boolean, upsert: boolean }) {
    return await ServiceSwitch.updateMany(query, update, option);
  },

  /**
   * getPlatformToken
   * @param {*} platform 
   * @private
   */
  // async getPlatformToken(platform: string) {
  //   return await ServiceSwitch.findOne({ platform });
  // },

  /**
  * Create switch service log
  * @private
  */
  async createSwitchLog(params: {}) {
    return await ServiceSwitchLog.create(params);
  },

  /**
  * Create switch service
  * @private
  */
  async createSwitchService(params: { serviceType: string }) {
    return await ServiceSwitch.create(params);
  },

  /**
   * getSwitchServiceLogs
   * @private
   */
  async getSwitchServiceLogs(query? : {
    skip?: number,
    limit?: number,
    serviceType?: String,
    platform?: string,
    date?: string,
    startDate?: string,
    endDate?: string,
    search?: string,
  }) {
    let paginate = { skip: 0, limit: 10 }
    if (query && query.skip && query.limit) {
      paginate.skip = Number(query.skip);
      paginate.limit = Number(query.limit);
    }

    if (query.search) {
      const regex = new RegExp(Utility.escapeRegex(query.search), 'gi');
      const data = await ServiceSwitchLog.find(
        { $text: { $search: regex } },
        { score: { $meta: "textScore" } }
      )
      .sort( { 'meta.createdAt': -1, score: { $meta: "textScore" } } )
      .skip(paginate.skip)
      .limit(paginate.limit)
      .populate('user', 'role firstName lastName _id email')
      .populate('switchService');
      
      const totalDocumentCount = await ServiceSwitchLog.countDocuments({
        $text: { $search: regex },
      });
      
      return Promise.resolve({ data: data, totalDocumentCount, skip: paginate.skip, limit: paginate.limit, queryWith: query });
    }
    

    let filterParams = { ...query };
    
    if (query.date) {
      filterParams['meta.createdAt'] = {
        $gte: new Date(new Date(query.date).setHours('00', '00', '00')),
        $lt: new Date(new Date(query.date).setHours(23, 59, 59))
      }
    }
    if (query.startDate && query.endDate) {
      filterParams['meta.createdAt'] = {
        $gte: new Date(new Date(query.startDate).setHours('00', '00', '00')),
        $lt: new Date(new Date(query.endDate).setHours(23, 59, 59))
      }
    }

    delete filterParams.skip;
    delete filterParams.limit;
    delete filterParams.date;
    delete filterParams.endDate;
    delete filterParams.startDate;

    const data = await ServiceSwitchLog
      .find({ ...filterParams })
      .skip(paginate.skip)
      .limit(paginate.limit)
      .sort({'meta.createdAt': -1})
      .populate('user', 'role firstName lastName _id email')
      .populate('switchService');

    const totalDocumentCount = await ServiceSwitchLog.countDocuments({
      ...filterParams,
    });

    return Promise.resolve({ data, totalDocumentCount, skip: paginate.skip, limit: paginate.limit, queryWith: query });
  },

  /**
   * Count documents
   * @private
   */
  async getDocumentCount() {
    return await ServiceSwitchLog.estimatedDocumentCount()
  },
}