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
  }
};
