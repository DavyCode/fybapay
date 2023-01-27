// @flow
import { Referral, validMongooseObjectId } from '../models';
import Utility from '../utils';

export default {
  /**
   * createReferral
   * @param {*} params 
   */
  async createReferral(params) {
    return await Referral.create(params);
  },

  /**
   * findOne
   * @param {*} query 
   */
  async findOne(query: {}) {
    return await Referral.findOne(query);
  },

  /**
   * referralSave
   * @param {Referral} referralInstance 
   */
  async referralSave(referralInstance: Referral) {
    return await referralInstance.save();
  },

  /**
   * findById
   */
  async findById(id: string) {
    if (!validMongooseObjectId(id)) { return Promise.resolve(false); } 
    return await Referral.findById(id);
  },

  /**
   * findByUserId
   * @param {*} query 
   */
  async findByUserId(query: {}) {
    return await Referral.findOne(query);
  }
  
};
