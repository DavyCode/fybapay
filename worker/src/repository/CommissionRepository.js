// @flow

import { CommissionWallet, CommissionHistory, validMongooseObjectId } from '../models';

export default {
  /**
   * Commission instance
   * @private
   */
  async commissionInstance() {
    return await new CommissionWallet();
  },

  /**
   * Save commission
   * @param {CommissionWallet} commissionInstance 
   * @private
   */
  async saveCommission(commissionInstance: CommissionWallet) {
    return await commissionInstance.save();
  },
  
  /**
   * Create commission wallet
   * @private
   */
  async createCommission(params: CommissionWallet) {
    return await CommissionWallet.create(params);
  },

  /**
   * Insert commission wallet
   * @private
   */
  async insertCommissionWallet(query, update, option: { new: boolean, upsert: boolean }) {
    return await CommissionWallet.findOneAndUpdate(query, update, option)
  },

  /**
   * Get commission wallet by Commission Wallet Id
   * @private
   */
  async getCommissionWalletById(id: string) {
    if (!validMongooseObjectId(id)) { return Promise.resolve(false) }
    return await CommissionWallet.findById({ _id: id });
  },

  /**
   * Get commission wallet by user Id
   * @private
   */
  async getCommissionWalletByUserId(id: string) {
    if (!validMongooseObjectId(id)) { return Promise.resolve(false) }
    return await CommissionWallet.findOne({ user: id });
  },

  /**
   * Find commission wallet by id or user
   * @private
   */
  async findCommissionWalletByIdOrUser(query : { userId?: string, commissionWalletId?: string }) {
    if (query && query.commissionWalletId) {
      if (!validMongooseObjectId(query.commissionWalletId)) { return Promise.resolve(false) }
    }
    if (query && query.userId) {
      if (!validMongooseObjectId(query.userId)) { return Promise.resolve(false) }
    }
    return await CommissionWallet.findOne({
      $or: [
        { 'user': query.userId },
        { '_id': query.commissionWalletId }
      ]
    })
  },

  /**
   * Commission history instance
   * @private
   */
  async commissionHistoryInstance() {
    return await new CommissionHistory();
  },

  /**
   * Save commission history
   * @private
   */
  async saveCommissionHistory(commissionHistoryInstance: CommissionHistory) {
    return await commissionHistoryInstance.save();
  },

  /**
   * Create commission history
   * @param {CommissionHistory} params 
   */
  async createCommissionHistory(params: CommissionHistory) {
    return await CommissionHistory.create(params);
  },

  /**
   * Get Commission History By history Id
   * @private
   */
  async getCommissionHistoryById(query: { CommissionHistoryId: string }) {
    if (!validMongooseObjectId(query.CommissionHistoryId)) { return Promise.resolve(false) }
    return await CommissionHistory.findById({ 
      _id: query.CommissionHistoryId 
    })
    .populate('user', 'firstName lastName _id email')
    .populate('wallet', '-monifyAccountReference -monifyReservetionReference')
    .populate('commissionWallet, transaction');
  },

  /**
   * Get Commission History By user Id
   * @private
   */
  async getCommissionHistoryByUser(userId: string, query?: { // todo - exclude search
    skip?: number, 
    limit?: number,
    date?: string,
    startDate?: string,
    endDate?: string,
    userId?: string,
  }) {
    let paginate = { skip: 0, limit: 10 };
    if (query && query.skip && query.limit) {
      paginate.skip = Number(query.skip);
      paginate.limit = Number(query.limit);
    }

    if (!validMongooseObjectId(userId)) { return Promise.resolve(false) }
    
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

    const data = await CommissionHistory
      .find({ user: userId, ...filterParams, })
      .skip(paginate.skip)
      .limit(paginate.limit)
      .sort({'meta.createdAt': -1})
      .populate('user', 'firstName lastName _id email')
      .populate('wallet', '-monifyAccountReference -monifyReservetionReference')
      .populate('commissionWallet, transaction');

    const totalDocumentCount = await CommissionHistory.countDocuments({ 
      user: userId,
      ...filterParams, 
    });

    return Promise.resolve({ data, totalDocumentCount, skip: paginate.skip, limit: paginate.limit, queryWith: query });
  },

  /**
  * Get Total Commission History Count 
  * @private
  */
  async getTotalCommissionHistoryCount() {
    return await CommissionHistory.estimatedDocumentCount();
  },

  /**
   * Get all commission histories
   * @private
   * @description - Admin
   */
  async getCommissionHistory(query?: { // todo - exclude search
    skip?: number,
    limit?: number,
    date?: string,
    startDate?: string,
    endDate?: string,
    userId?: string,
    // todo - add search maybe
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

    const data = await CommissionHistory.find({ 
      ...filterParams,
    })
    .skip(paginate.skip)
    .limit(paginate.limit)
    .sort({'meta.createdAt': -1})
    .populate('user', 'firstName lastName _id email')
    .populate('wallet', '-monifyAccountReference -monifyReservetionReference')
    .populate('commissionWallet, transaction');

    const totalDocumentCount = await CommissionHistory.countDocuments({ 
      ...filterParams,
    });

    return Promise.resolve({ data, totalDocumentCount, skip: paginate.skip, limit: paginate.limit, queryWith: query });
  },

  /**
   * Get commission history By commission wallet Id
   * @private
   */
  async getCommissionHistoryByUserOrCommissionWalletId(query: {
    commissionWalletId?: string,
    userId? : string,
    skip?: number,
    limit?: number,
    date?: string,
    startDate?: string,
    endDate?: string,
  }) {
    let paginate = { skip: 0, limit: 10 };
    if (query && query.skip && query.limit) {
      paginate.skip = Number(query.skip);
      paginate.limit = Number(query.limit);
    }

    if (!query || !query.commissionWalletId && !query.userId) { return Promise.resolve(false) }

    if (query && query.commissionWalletId) {
      if (!validMongooseObjectId(query.commissionWalletId)) { return Promise.resolve(false) }
    }
    if (query && query.userId) {
      if (!validMongooseObjectId(query.userId)) { return Promise.resolve(false) }
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
    delete filterParams.commissionWalletId;
    delete filterParams.userId;

    const totalDocumentCount = await CommissionHistory.countDocuments({
      $or: [
        { 'commissionWallet': query.commissionWalletId },
        { 'user': query.userId }
      ],
      ...filterParams,
    })

    const data = await CommissionHistory.find({
      $or: [
        { 'commissionWallet': query.commissionWalletId },
        { 'user': query.userId }
      ],
      ...filterParams,
    })
    .skip(paginate.skip)
    .limit(paginate.limit)
    .sort({'meta.createdAt': -1})
    .populate('user', 'firstName lastName _id email')
    .populate('wallet', '-monifyAccountReference -monifyReservetionReference')
    .populate('commissionWallet, transaction');

    return Promise.resolve({ data, totalDocumentCount, skip: paginate.skip, limit: paginate.limit, queryWith: query });
  },
  
};
