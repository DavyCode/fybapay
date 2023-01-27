// @flow

/**
 * Transaction Database Operations
 */

import _ from 'lodash';
import { Transaction, CommissionHistory, validMongooseObjectId, MongooseObjectId } from '../models';
import enumType from '../enumType';
import Utility from '../utils';

export default {
  
  /**
  * Get A Transaction by ID
  * @private
  */
  async getTransactionById(id: string) {
    if (!validMongooseObjectId(id)) { return Promise.resolve(false) }
    return await Transaction.findById(id);
  },
  
  /**
  * Find One Transaction
  * @private
  */
  async findOne(query: {}) {
    return await Transaction
      .findOne(query)
      .populate('user', 'firstName lastName email _id')
      .populate('sourceTransactionRefunded destinationTransactionRefunded commissionWallet');  
  },

  /**
  * Create Transaction
  * @private
  */
  async TransactionCreate(params: {}) {
    return await Transaction.create(params);
  },
  
  /**
  * Insert Transaction
  * @private
  */
  async TransactionInsert(query: {}, update: {}, option: { new: boolean, upsert: boolean }) {
    return await Transaction.findOneAndUpdate(query, update, option);
  },

  /**
  * Insert Many transaction
  * @private
  */
  async TransactionInsertMany(arrayInstances) {
    return await Transaction.insertMany(arrayInstances);
  },

  /**
  * Save Transaction
  * @private
  */
  async TransactionSave(TransactionInstance: Transaction) {
    return await TransactionInstance.save();
  }, 

  /**
   * TransactionInstance
   * @private
   */
  async TransactionInstance() {
    return await new Transaction();
  },

  /**
   * Get Transaction By Service Type
   * @private
   */
  async getTransactionByServiceType () {},

  /**
   * Get User Transactions And By Type And OR Status
   * @private
   */
  async getUserTransactionsAndByTypeAndORStatus(userId: string, query?: { // todo - exclude search
    skip?: number,
    limit?: number,
    transactionType?: string,
    status?: string,
    serviceType?: string,
    date?: string,
    startDate?: string,
    endDate?: string,

    amount?: number,
    serviceId?: string,
    serviceName?: string,
    transactionReference?: string,
    transactionId?: string,
    paymentMethod?: string,

    terminalId?: string,

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

    if (query.transactionType) {
      if (query.transactionType.toLowerCase() === enumType.transactionType.SERVICES.toLowerCase()) {
        filterParams.transactionType = {
          $in: [ enumType.transactionType.SERVICES, enumType.transactionType.POS ],
        }
      }

      if (query.transactionType.toLowerCase() === enumType.transactionType.WALLET.toLowerCase()) {
        filterParams.transactionType = {
          $in: [ enumType.transactionType.WALLET, enumType.transactionType.W2W_TRANSFER ],
        }
      }
    }
    
    delete filterParams.skip;
    delete filterParams.limit;
    delete filterParams.date;
    delete filterParams.endDate;
    delete filterParams.startDate;

    const data = await Transaction.find({
      user: MongooseObjectId(userId),
      ...filterParams,
    })
    .skip(paginate.skip)
    .limit(paginate.limit)
    .sort({'meta.createdAt': -1})
    .populate('user', 'firstName lastName _id email')
    .populate('sourceTransactionRefunded destinationTransactionRefunded commissionWallet');
    
    const totalDocumentCount = await Transaction.countDocuments({ 
      user: MongooseObjectId(userId),
      ...filterParams,
    });

    return Promise.resolve({ data, totalDocumentCount, skip: paginate.skip, limit: paginate.limit, queryWith: query });
  },


  /**
  * Get All Transactions And By Type And OR Status
  * @description - call get Wallet and Services transactions
  * @private
  */
  async getAllTransactionsAndByTypeAndORStatus(query?: {
    skip?: number,
    limit?: number,
    date?: string,
    startDate?: string,
    endDate?: string,

    transactionType?: string,
    status?: string,
    serviceType?: string,
    search?: string,

    userId?: string,
    amount?: number,
    serviceId?: string,
    serviceName?: string,
    transactionReference?: string,
    client_transactionReference?: string,
    client_paymentReference?: string,
    transactionId?: string,
    paymentMethod?: string,
    platform?: string,
    isTransactionRefunded?: boolean,
    isRefundedTransaction?: boolean,

    aggregatorUserId?: string,
    terminalId?: string,

  }) {
    let paginate = { skip: 0, limit: 10 };
    if (query && query.skip && query.limit) {
      paginate.skip = Number(query.skip);
      paginate.limit = Number(query.limit);
    }

    if (query.userId) {
      if (!validMongooseObjectId(query.userId)) { return Promise.resolve(false) }
    }
    if (query.aggregatorUserId) {
      if (!validMongooseObjectId(query.aggregatorUserId)) { return Promise.resolve(false) }
    }

    if (query.search) {
      const regex = new RegExp(Utility.escapeRegex(query.search), 'gi'); // regex: /"\\"pam\ man\\""/gi
      const data = await Transaction.find(
        { $text: { $search: regex } },
        { score: { $meta: "textScore" } }
      )
      .sort( { 'meta.createdAt': -1, score: { $meta: "textScore" } } )
      .skip(paginate.skip)
      .limit(paginate.limit)
      .populate('user', 'firstName lastName _id email')
      .populate('sourceTransactionRefunded destinationTransactionRefunded commissionWallet');  

      const totalDocumentCount = await Transaction.countDocuments({
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

    if (filterParams.userId) {
      filterParams.user = query.userId;
    } 

    delete filterParams.skip;
    delete filterParams.limit;
    delete filterParams.date;
    delete filterParams.endDate;
    delete filterParams.startDate;
    delete filterParams.userId

    const data = await Transaction.find({
      ...filterParams,
    })
    .skip(paginate.skip)
    .limit(paginate.limit)
    .sort({'meta.createdAt': -1})
    .populate('user', 'firstName lastName _id email')
    .populate('sourceTransactionRefunded destinationTransactionRefunded commissionWallet');
    
    const totalDocumentCount = await Transaction.countDocuments({ 
      ...filterParams,
    });

    return Promise.resolve({ data, totalDocumentCount, skip: paginate.skip, limit: paginate.limit, queryWith: query });
  },
  // .populate('user', '-passwordHash -resetPasswordTimer -resetPasswordPin -bank -BVN_verificationCode')
  // .populate('sourceTransactionRefunded destinationTransactionRefunded commissionWallet');

  
  async findUserTransactionByDateServiceTypePlatformAndStatus(userId: string, query?: {
    date: string,
    status: string,
    serviceType: string,
    platform: string,
  }) {

    if (!validMongooseObjectId(userId)) { return Promise.resolve(false) }

    let filterParams = { ...query };

    if (query.date) {
      filterParams['meta.createdAt'] = {
        $gte: new Date(new Date(query.date).setHours('00', '00', '00')),
        $lt: new Date(new Date(query.date).setHours(23, 59, 59))
      }
    }

    delete filterParams.date

    return await Transaction.find({
      user: MongooseObjectId(userId),
      ...filterParams,
    })
  },

  /**
   * Find Transaction By Type And Status And Platform
   * @public
   */
  async findByServiceTypeAndStatusAndPlatform(serviceType: string, transactionStatus: string, platform: string) {
    return await Transaction.find({ 
      serviceType, 
      status: transactionStatus, 
      platform
    })
    .populate('user', 'firstName lastName email _id')
    .populate('sourceTransactionRefunded destinationTransactionRefunded commissionWallet');
  },

  /**
   * findByStatusAndPlatform
   * @param {*} transactionStatus 
   * @param {*} platform 
   * @private
   */
  async findByStatusAndPlatform(transactionStatus: string, platform: string) {
    return await Transaction.find({ 
      status: transactionStatus, 
      platform 
    })
    .populate('user', 'firstName lastName email _id')
    .populate('sourceTransactionRefunded destinationTransactionRefunded commissionWallet');
  },

  /**
   * findPendingAndInitTransactions
   * @param {String} platform 
   */
  async findPendingAndInitTransactions(platform: string) {
    return await Transaction.find({ 
      status: { $in: [ enumType.transactionStatus.PENDING, enumType.transactionStatus.INIT ] },
      platform 
    })
    .populate('user sourceTransactionRefunded destinationTransactionRefunded commissionWallet');
    // .populate('user', 'firstName lastName email _id')
  },

  /**
   * Find By Transaction Number
   * @param {String} transactionReference
   * @public
   */
  async findByTransactionReference(transactionReference: string) { // todo - wire up
    return await Transaction.findOne({ transactionReference })
      .populate('user', 'firstName lastName email _id')
      .populate('sourceTransactionRefunded destinationTransactionRefunded commissionWallet');
  },

  /**
   * findByTransactionId
   * @param {String} transactionId 
   */
  async findByTransactionId(transactionId: string) {
    return await Transaction.findOne({ transactionId })
      .populate('user', 'firstName lastName email _id')
      .populate('sourceTransactionRefunded destinationTransactionRefunded commissionWallet');
  },

  /**
   * Get User Total Transactions Count By Type
   * @private
   */
  async getUserTotalTransactionsCountByType(userId: string, transactionType: string) {
    if (!validMongooseObjectId(userId)) { return Promise.resolve(false) }
    const list = await Transaction.find({ user: userId, transactionType });
    return Promise.resolve(list.length);
  },

  /**
   * Get User Total Transactions Count
   * @private
   */
  async getUserTotalTransactionsCount(userId: string) {
    if (!validMongooseObjectId(userId)) { return Promise.resolve(false) }
    const list = await Transaction.find({ user: userId });
    return Promise.resolve(list.length); 
  },

  /**
   * Get All Transaction Total Count
   * @private
   */
  async getTotalTransactionCountByType(transactionType: string) {
    const list = await Transaction.find({ transactionType });
    return Promise.resolve(list.length);
  },

  /**
  * Get Transaction Total Count
  * @private
  */
  async getTransactionTotalCount() {
    return await Transaction.estimatedDocumentCount();
  },

  /**
   * getUserBeneficiariesByTransactionType
   * @private
   */
  async getUserBeneficiariesOrByTransactionType(userId: string, query: { skip?: number, limit?: number, transactionType?: string }) {
    let paginate = { skip: 0, limit: 10 };
    if (query && query.skip && query.limit) {
      paginate.skip = Number(query.skip);
      paginate.limit = Number(query.limit);
    }

    if (!validMongooseObjectId(userId)) { return Promise.resolve(false) }

    let filterParams = { ...query };

    delete filterParams.skip;
    delete filterParams.limit;

    const data = await Transaction.find({
      user: userId, 
      serviceType: { $in: [ enumType.serviceType.TRANSFER, enumType.serviceType.BULK_TRANSFER, enumType.serviceType.WITHDRAW ] },
      ...filterParams,
    })
    .skip(paginate.skip)
    .limit(paginate.limit)
    .sort({'meta.createdAt': -1})

    const totalDocumentCount = await Transaction.countDocuments({
      user: userId, 
      serviceType: { $in: [ enumType.serviceType.TRANSFER, enumType.serviceType.BULK_TRANSFER, enumType.serviceType.WITHDRAW ] },
      ...filterParams,
    });

    const beneficiaries = [];
    for (let i = 0; i < data.length; i++) {
      let { recipientName, recipientAccount, recipientPhone } = data[i];
      beneficiaries.push({ recipientName, recipientAccount, recipientPhone })
    }
    const non_dup_data = _.uniqBy(beneficiaries, 'recipientAccount'); 

    return Promise.resolve({ data: non_dup_data, totalDocumentCount, skip: paginate.skip, limit: paginate.limit, queryWith: query });
  },
  
  /**
   * getUserTransactionsByTransactionTypeOfPosTerminal
   * @param {*} userId 
   * @param {*} query 
   */
  async getAggregatorTransactionsTypeOfPosTerminalAndFilter(userId: string, query?: {
    skip?: number,
    limit?: number,
    date?: string,
    startDate?: string,
    endDate?: string,

    // transactionType?: string,
    status?: string,
    // serviceType?: string,

    amount?: number,
    // serviceId?: string,
    // serviceName?: string,
    transactionReference?: string,
    transactionId?: string,
    // paymentMethod?: string,

    terminalId?: string,
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
    delete filterParams.transactionType;

    const data = await Transaction.find({
      aggregatorUserId: MongooseObjectId(userId),
      transactionType: enumType.transactionType.POS,
      ...filterParams,
    })
    .skip(paginate.skip)
    .limit(paginate.limit)
    .sort({'meta.createdAt': -1})
    .populate('user', 'firstName lastName _id email')
    // .populate('sourceTransactionRefunded destinationTransactionRefunded commissionWallet');
    
    const totalDocumentCount = await Transaction.countDocuments({ 
      aggregatorUserId: MongooseObjectId(userId),
      transactionType: enumType.transactionType.POS,
      ...filterParams,
    });

    return Promise.resolve({ data, totalDocumentCount, skip: paginate.skip, limit: paginate.limit, queryWith: query });
  },

  /**
   * sum Daily Transaction Amount
   * @param {*} query 
   */
  /**
   * sumTransactionAmount
   * sumTransactionAmountByStatusAndDate
   * sumTransactionAmountByStatus
   * sumTransactionAmountByTypeAndDate
   * 
   * sumDailyTransactionAmountAndFilter
   */
  async sumTransactionAmountAndFilter(query?: {
    date?: string,
    startDate?: string,
    endDate?: string,

    transactionType?: string,
    status?: string,
    serviceType?: string,

    userId?: string,
    amount?: number,
    serviceId?: string,
    serviceName?: string,
    paymentMethod?: string,
    platform?: string,
    isTransactionRefunded?: boolean,
    isRefundedTransaction?: boolean,

    aggregatorUserId?: string,
    terminalId?: string,
  }) {

    let filterParams = { ...query };

    if (query.userId) {
      if (!validMongooseObjectId(query.userId)) { return Promise.resolve(false) }
    }
    if (query.aggregatorUserId) {
      if (!validMongooseObjectId(query.aggregatorUserId)) { return Promise.resolve(false) }
    }

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

    if (filterParams.userId) {
      filterParams.user = MongooseObjectId(query.userId);
    }

    if (filterParams.aggregatorUserId) {
      filterParams.aggregatorUserId = MongooseObjectId(query.aggregatorUserId);
    }

    delete filterParams.date;
    delete filterParams.endDate;
    delete filterParams.startDate;
    delete filterParams.userId

    return await Transaction.aggregate(
      [
        {
          $match: { 
            // user: MongooseObjectId(userId),
            ...filterParams,
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]
    )
  },

  // sumCharges
  // sumTransactions
  // sumGladePayTransactionsAbove
  // sumGladePayTransactionsBelow
  
  
  /**
   * sumTransactionAmountByUserId
   * sumTransactionAmountByUserIdAndStatus
   * @param {*} userId 
   * @param {*} query 
   */
  async sumTransactionAmountByUserIdAndFilter(userId: string, query?: {
    date?: string,
    startDate?: string,
    endDate?: string,
    transactionType?: string,
    status?: string,
    serviceType?: string,

    amount?: number,
    serviceId?: string,
    serviceName?: string,
    // transactionReference?: string,
    // transactionId?: string,
    paymentMethod?: string,

    terminalId?: string,
  }) {

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

    delete filterParams.date;
    delete filterParams.endDate;
    delete filterParams.startDate;

    return await Transaction.aggregate(
      [
        {
          $match: { 
            user: MongooseObjectId(userId),
            ...filterParams,
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]
    )
  },
  
  /**
   * sumTransactionAmountByAggregatorUserId
   * @param {String} userId 
   */
  async sumTransactionAmountByAggregatorUserId(userId: string) {
    return await Transaction.aggregate(
      [
        {
          $match: { 
            transactionType: enumType.transactionType.POS,
            aggregatorUserId: MongooseObjectId(userId),
            status: enumType.transactionStatus.SUCCESSFUL,
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]
    )
  },
  // sumTransactionByAggregatorUserId
  // countByAggregatorUserId

  /**
   * countAggregatorPosTransactions
   * @param {String} userId 
   */
  async countAggregatorPosTransactions(userId: string) {
    if (!validMongooseObjectId(userId)) { return Promise.resolve(false) }
    return await Transaction.countDocuments({
      status: enumType.transactionStatus.SUCCESSFUL,
      transactionType: enumType.transactionType.POS,
      aggregatorUserId: MongooseObjectId(userId),
    });
  },

  // findByAggregatorUserId
  // sumTransactionByAggregatorUserIdForMonth
  // sumCommissionAmountByAggregatorUserId

  /**
   * sumCommissionAmountByAggregatorUserId
   * @param {String} userId 
   */
  async sumCommissionAmountByAggregatorUserId(userId: string) {
    if (!validMongooseObjectId(userId)) { return Promise.resolve(false); }
    
    let commissionSum = 0;
    // find all transaction of type POS and agg 
    const transactions = await Transaction.find({
      transactionType: enumType.transactionType.POS,
      aggregatorUserId: MongooseObjectId(userId),
      status: enumType.transactionStatus.SUCCESSFUL,
    })

    if (!transactions || transactions.length < 1) { return Promise.resolve(commissionSum); }

    let transactionsIdList = [];

    for (let i = 0; i < transactions.length; i++) {
      transactionsIdList.push(MongooseObjectId(transactions[i]._id));

      // const commissionTrx = await CommissionHistory.findOne({ 
      //   transaction: MongooseObjectId(transactions[i]._id),
      // });

      // if (commissionTrx) {
      //   commissionSum += commissionTrx.commission;
      // }
    }

    // for each trx get commission history that match trx ID
    const commissionTrx = await CommissionHistory.find({ 
      transaction: { $in: transactionsIdList },
    });

    if (!commissionTrx || commissionTrx.length < 1) { return Promise.resolve(commissionSum); }

    for (let a = 0; a < commissionTrx.length; a++) {
      commissionSum += Number(commissionTrx[a].commission);
    }

    return Promise.resolve(commissionSum);
  },
  // countTransactionAmountByStatusAndDate
  // countTransactionAmountByTypeAndDate
  // findCommissionsGreaterThanZero
  // findByTerminalId
  // previousDayTransaction
  // todayTransaction
  // findPendingRubiesTransactions

};