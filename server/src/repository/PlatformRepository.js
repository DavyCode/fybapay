// @flow

/**
 * Platforms Database Operations
 */

import { Platform } from '../models';
import Utility from '../utils';

export default {
  /**
  * findByPlatform
  * @private
  */
  async findByPlatform(platform: string) {
    return await Platform.findOne({ platform });
  },

  /**
   * otpUserInsert
   * @param {*} query 
   * @param {*} update 
   * @param {*} option
   * @private
   */
  async platformInsert(query: {}, update: {}, option: { new: boolean, upsert: boolean }) {
    return await Platform.findOneAndUpdate(query, update, option);
  },

};