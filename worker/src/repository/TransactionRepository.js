// @flow

/**
 * Transaction Database Operations
 */

import _ from 'lodash';
import { Transaction, validMongooseObjectId } from '../models';
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

    const data = await Transaction.find({
      user: userId,
      ...filterParams,
    })
    .skip(paginate.skip)
    .limit(paginate.limit)
    .sort({'meta.createdAt': -1})
    .populate('user', 'firstName lastName _id email')
    .populate('sourceTransactionRefunded destinationTransactionRefunded commissionWallet');
    
    const totalDocumentCount = await Transaction.countDocuments({ 
      user: userId,
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
    transactionType?: string,
    status?: string,
    serviceType?: string,
    date?: string,
    startDate?: string,
    endDate?: string,
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
  }) {
    let paginate = { skip: 0, limit: 10 };
    if (query && query.skip && query.limit) {
      paginate.skip = Number(query.skip);
      paginate.limit = Number(query.limit);
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

    delete filterParams.skip;
    delete filterParams.limit;
    delete filterParams.date;
    delete filterParams.endDate;
    delete filterParams.startDate;

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

  /**
   * Find Transaction By Type And Status And Platform
   * @private
   */
  async findByServiceTypeAndStatusAndPlatform(serviceType: string, transactionStatus: string, platform: string) {
    return await Transaction.find({ 
      serviceType, 
      status: transactionStatus, 
      platform
    })
    .populate('user sourceTransactionRefunded destinationTransactionRefunded commissionWallet');
    // .populate('user', 'firstName lastName email _id')
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
    .populate('user sourceTransactionRefunded destinationTransactionRefunded commissionWallet');
    // .populate('user', 'firstName lastName email _id')
  },

  /**
   * findPendingAndInitTransactions
   * @param {*} platform 
   */
  async findPendingAndInitTransactions(platform: string) {
    return await Transaction.find({ 
      status: { $in: [ `${enumType.transactionStatus.PENDING}`, `${enumType.transactionStatus.INIT}` ] },
      platform 
    })
    .populate('user sourceTransactionRefunded destinationTransactionRefunded commissionWallet');
    // .populate('user', 'firstName lastName email _id')
  },

  /**
   * Find By Transaction Number
   * @private
   */
  async findByTransactionReference(transactionReference: string) { // todo - wire up
    return await Transaction.findOne({ transactionReference })
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

};