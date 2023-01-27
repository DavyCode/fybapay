// @flow

/**
 * User Database Operations
 */

import { User, Wallet, AuthOtpVerify, validMongooseObjectId } from '../models';
import Utility from '../utils';
import { formatNumber } from '../utils/formatPhone';

export default {
  /**
   * Get Auth Otp Verify user
   * @private
   */
  async getAuthOtpVerifyUser(query: {}) {
    return await AuthOtpVerify.findOne(query);
  },

  /**
   * getAuthOtpUsers
   * @param {*} query 
   */
  async getAuthOtpUsers(query?: {
    skip?: number,
    limit?: number,
    phone?: string,
    date?: string,
    startDate?: string,
    endDate?: string,
  }) {
    let paginate = { skip: 0, limit: 10 };
    if (query && query.skip && query.limit) {
      paginate.skip = Number(query.skip);
      paginate.limit = Number(query.limit);
    }

    let searchParams = { ...query }

    if (query && query.phone) {
      searchParams['phone'] = formatNumber(query.phone);
    }

    if (query.date) {
      searchParams['meta.createdAt'] = {
        $gte: new Date(new Date(query.date).setHours('00', '00', '00')),
        $lt: new Date(new Date(query.date).setHours(23, 59, 59))
      }
    }
    if (query.startDate && query.endDate) {
      searchParams['meta.createdAt'] = {
        $gte: new Date(new Date(query.startDate).setHours('00', '00', '00')),
        $lt: new Date(new Date(query.endDate).setHours(23, 59, 59))
      }
    }

    delete searchParams.skip;
    delete searchParams.limit;
    delete searchParams.date;
    delete searchParams.endDate;
    delete searchParams.startDate;

    const data = await AuthOtpVerify.find({
      ...searchParams,
    })
    .skip(paginate.skip)
    .limit(paginate.limit)
    .sort({'meta.updatedAt': -1}) // sort By latest, update not created

    const totalDocumentCount = await AuthOtpVerify.countDocuments({
      ...searchParams,
    })

    return Promise.resolve({ data: data, totalDocumentCount, skip: paginate.skip, limit: paginate.limit, queryWith: query });  
  },

  /**
   * Create user for otp verify
   * @private
   */
  async createUserForOtpVerify(params: {}) {
    return await AuthOtpVerify.create(params);
  },

  /**
  * Insert OTP User
  * @private
  */
  async otpUserInsert(query: {}, update: {}, option: { new: boolean, upsert: boolean }) {
    return await AuthOtpVerify.findOneAndUpdate(query, update, option);
  },

  /**
  * Get A user by ID
  * @private
  */
  async getUserById(id: string) {
    if (!validMongooseObjectId(id)) { return Promise.resolve(false) }
    return await User.findById(id).populate('wallet commissionWallet')
  },

  /**
    * Get A user by ID with wallet
    * @private
    */
  async getUserByIdWithWallet(id: string) {
    if (!validMongooseObjectId(id)) { return Promise.resolve(false) }
    return await User.findById(id).populate('wallet commissionWallet')
  },

  /**
  * Get user wallet
  * @private
  */
  async getUserWallet(id: string) {
    if (!validMongooseObjectId(id)) { return Promise.resolve(false) }
    return await Wallet.findById(id).populate('wallet commissionWallet')
  },

  /**
  * Insert User
  * @private
  */
  async walletInsert(query: {}, update: {}, option: { new: boolean, upsert: boolean }) {
    return await Wallet.findOneAndUpdate(query, update, option).populate('wallet commissionWallet');
  },

  /**
  * Get All User
  * @private
  */
  async getAllUsers(query?: {
    skip?: number,
    limit?: number,
    role?: string,
    date?: string,
    startDate?: string,
    endDate?: string,
    verified?: string,
    isBVN_verified?: string,
    active?: string,
    lock?: string,
    Kyc?: string,
    agentApproved?: string,
    state?: string,
    userId?: string,
    agentId?: string,
    email?: string,
    lga?: string,
    businessState?: string,
    businessLga?: string,
    businessCity?: string,
    gender?: string,
    search?: string,
  }) {
    let paginate = { skip: 0, limit: 10 }
    if (query && query.skip && query.limit) {
      paginate.skip = Number(query.skip);
      paginate.limit = Number(query.limit);
    }

    if (query.search) {
      const regex = new RegExp(Utility.escapeRegex(query.search), 'gi'); // regex: /"\\"pam\ man\\""/gi
      const data = await User.find(
        { $text: { $search: regex } },
        { score: { $meta: "textScore" } }
      )
      .sort( { 'meta.createdAt': -1, score: { $meta: "textScore" } } )
      .skip(paginate.skip)
      .limit(paginate.limit)
      .populate('wallet', '-monifyAccountReference -monifyReservetionReference')
      .populate('commissionWallet');

      const totalDocumentCount = await User.countDocuments({
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
    delete filterParams.search;
    const data = await User
      .find({ ...filterParams })
      .skip(paginate.skip)
      .limit(paginate.limit)
      .sort({ 'meta.createdAt': -1 })
      .populate('wallet', '-monifyAccountReference -monifyReservetionReference')
      .populate('commissionWallet');
    
    const totalDocumentCount = await User.countDocuments({
      ...filterParams,
    });

    return Promise.resolve({ data: data, totalDocumentCount, skip: paginate.skip, limit: paginate.limit, queryWith: query });
  },

  /**
  * Get User Total Count
  * @private
  */
  async getUserTotalCount() {
    return await User.estimatedDocumentCount();
  },

  /**
  * Find One User
  * @private
  */
  async findOne(query: {}) {
    return await User
      .findOne(query)
      .populate('wallet', '-monifyAccountReference -monifyReservetionReference')
      .populate('commissionWallet');
  },

  /**
   * Find One With Wallet
   * @private
   */
  async findOneWithWallet(query: {} = {}) {
    return await User.findOne(query)
      .populate('wallet commissionWallet')
  },

  /**
  * Create User
  * @private
  */
  async userCreate(params: {}) {
    return await User.create(params);
  },
  
  /**
  * Insert User
  * @private
  */
  async userInsert(query: {}, update: {}, option: { new: boolean, upsert: boolean }) {
    return await User.findOneAndUpdate(query, update, option).populate('wallet commissionWallet');
  },

  /**
  * Save User Instance
  * @private
  */
  async userSave(userInstance: User) {
    return await userInstance.save();
  }, 

};