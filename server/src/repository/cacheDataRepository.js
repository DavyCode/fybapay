// @flow

import { validMongooseObjectId, CacheBvn } from '../models';

export default {
  /**
   * Commission instance
   * @private
   */
  async cacheBvn(params, user) {
    return await CacheBvn.create({ ...params, user })
  },

  /**
   * getCachedBvnResponse
   * @private
   */
  async getCachedBvnResponse(userId: string) {
    return await CacheBvn.findOne({ user: userId })
  },

  /**
   * findOneCacheBvn
   */
  async findOneCacheBvn(query: {}) {
    return await CacheBvn.findOne(query);
  },

  /**
   * insertCachedBvn
   * @private
   */
  async insertCachedBvn(query: {}, update: {}, option: { new: boolean, upsert: boolean }) {
    return await CacheBvn.findOneAndUpdate(query, update, option);
  },

  /**
   * saveCacheData
   * @param {CacheBvn} cacheBvnInstance 
   */
  async saveCacheData(cacheBvnInstance: CacheBvn) {
    return await cacheBvnInstance.save();
  },

  /**
   * getAllCachedBvn
   * @param {*} query 
   */
  async getAllCachedBvn(query?: {
    skip?: number,
    limit?: number,
    date?: string,
    startDate?: string,
    endDate?: string,

    bvn?: string,
    first_name?: string,
    last_name?: string,
    dob?: string,
    formatted_dob?: string,
    mobile?: string,
    verified?: boolean,
  }) {
    let paginate = { skip: 0, limit: 10 };
    if (query && query.skip && query.limit) {
      paginate.skip = Number(query.skip);
      paginate.limit = Number(query.limit);
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

    const data = await CacheBvn.find({ 
      ...filterParams,
    })
    .skip(paginate.skip)
    .limit(paginate.limit)
    .sort({'meta.createdAt': -1})
    .populate('user', 'firstName lastName _id email')

    const totalDocumentCount = await CacheBvn.countDocuments({ 
      ...filterParams,
    });

    return Promise.resolve({ data, totalDocumentCount, skip: paginate.skip, limit: paginate.limit, queryWith: query });
  }
};
