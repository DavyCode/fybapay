// @flow

import { PosTerminal, validMongooseObjectId } from '../models';
import Utility from '../utils';
import { formatNumber } from '../utils/formatPhone';

export default {
  /**
   * createReferral
   * @param {*} params
   */
  async createPOSTerminal(params: PosTerminal) {
    return await PosTerminal.create(params);
  },

  /**
   * countAggregatorTotalTerminals
   * @param {String} userId 
   */
  async countAggregatorTotalTerminals(userId: string) {
    if (!validMongooseObjectId(userId)) { return Promise.resolve(false) }
    return await PosTerminal.countDocuments({ 
      aggregator: userId,
    });
  },

  /**
   * countTotalTerminals
   */
  async countTotalTerminals() {
    return await PosTerminal.countDocuments();
  },

  /**
   * getAggregatorTerminalsAndFilter
   * @param {*} userId 
   * @param {*} query 
   */
  async getAggregatorTerminalsAndFilter(aggregatorId: string, query?: {
    skip?: number,
    limit?: number,
    date?: string,
    startDate?: string,
    endDate?: string,
    userId?: string,

    state?: string,
    lga?: string,

    address?: string,
    name?: string,
    phone?: string,
    serialNumber?: string,
    terminalId?: string,
    partner?: string,
    transactionLimit?: number,
    dailyPosTransactionAmount?: number,
    dailyPosTransactionDate?: string,
    posTerminal_Id?: string,

    assignedToAgent?: boolean,
    assignedToAgentOn?: string,

    detachedFromAgentOn?: string,

    blocked?: boolean,
  }) {
    let paginate = { skip: 0, limit: 10 };
    if (query && query.skip && query.limit) {
      paginate.skip = Number(query.skip);
      paginate.limit = Number(query.limit);
    }

    if (!validMongooseObjectId(aggregatorId)) { return Promise.resolve(false) }
    
    if (query.userId) {
      if (!validMongooseObjectId(query.userId)) { return Promise.resolve(false) }
    }
    if (query.posTerminal_Id) {
      if (!validMongooseObjectId(query.posTerminal_Id)) { return Promise.resolve(false) }
    }

    let filterParams = { ...query };

    if (query && query.phone) {
      filterParams['phone'] = formatNumber(query.phone);
    }

    if (filterParams.posTerminal_Id) {
      filterParams._id = query.posTerminal_Id;
    }
    if (filterParams.userId) {
      filterParams.user = query.userId;
    }

    if (filterParams.assignedToAgentOn) {
      filterParams['assignedToAgentOn'] = {
        $gte: new Date(new Date(query.assignedToAgentOn).setHours('00', '00', '00')),
        $lt: new Date(new Date(query.assignedToAgentOn).setHours(23, 59, 59))
      }
    }
    if (filterParams.detachedFromAgentOn) {
      filterParams['detachedFromAgentOn'] = {
        $gte: new Date(new Date(query.detachedFromAgentOn).setHours('00', '00', '00')),
        $lt: new Date(new Date(query.detachedFromAgentOn).setHours(23, 59, 59))
      }
    }

    if (filterParams.dailyPosTransactionDate) {
      filterParams['dailyPosTransactionDate'] = {
        $gte: new Date(new Date(query.dailyPosTransactionDate).setHours('00', '00', '00')),
        $lt: new Date(new Date(query.dailyPosTransactionDate).setHours(23, 59, 59))
      }
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

    delete filterParams.skip;
    delete filterParams.limit;
    delete filterParams.date;
    delete filterParams.endDate;
    delete filterParams.startDate;
    delete filterParams.posTerminal_Id;
    delete filterParams.userId;

    const data = await PosTerminal.find({
      aggregator: aggregatorId,
      ...filterParams,
    })
    .skip(paginate.skip)
    .limit(paginate.limit)
    .sort({'meta.createdAt': -1})
    .populate('user', 'firstName lastName _id email phone')
    .populate('aggregator', 'firstName lastName _id email phone');
    
    const totalDocumentCount = await PosTerminal.countDocuments({ 
      aggregator: aggregatorId,
      ...filterParams,
    });

    return Promise.resolve({ data, totalDocumentCount, skip: paginate.skip, limit: paginate.limit, queryWith: query });
  },

  /**
   * getTerminalsAndFilter
   * @param {*} query 
   */
  async getTerminalsAndFilter(query?: {
    skip?: number,
    limit?: number,
    date?: string,
    startDate?: string,
    endDate?: string,
    userId?: string,

    state?: string,
    lga?: string,

    address?: string,
    name?: string,
    phone?: string,
    serialNumber?: string,
    terminalId?: string,
    partner?: string,
    transactionLimit?: number,
    dailyPosTransactionAmount?: number,
    dailyPosTransactionDate?: string,

    aggregatorUserId?: string,
    posTerminal_Id?: string,

    assignedToAggregator?: boolean,
    assignedToAggregatorOn?: string,
    assignedToAggregatorBy_userId?: string,
    detachedFromAggregatorBy_userId?: string,
    detachedFromAggregatorOn?: string,

    assignedToAgent?: boolean,
    assignedToAgentOn?: string,
    assignedToAgentBy_userId?: string,
    detachedFromAgentBy_userId?: string,
    detachedFromAgentOn?: string,

    blocked?: boolean,
  }) {
    let paginate = { skip: 0, limit: 10 };
    if (query && query.skip && query.limit) {
      paginate.skip = Number(query.skip);
      paginate.limit = Number(query.limit);
    }

    if (query.aggregatorUserId) {
      if (!validMongooseObjectId(query.aggregatorUserId)) { return Promise.resolve(false) }
    }
    if (query.userId) {
      if (!validMongooseObjectId(query.userId)) { return Promise.resolve(false) }
    }
    if (query.posTerminal_Id) {
      if (!validMongooseObjectId(query.posTerminal_Id)) { return Promise.resolve(false) }
    }
    if (query.assignedToAggregatorBy_userId) {
      if (!validMongooseObjectId(query.assignedToAggregatorBy_userId)) { return Promise.resolve(false) }
    }
    if (query.detachedFromAggregatorBy_userId) {
      if (!validMongooseObjectId(query.detachedFromAggregatorBy_userId)) { return Promise.resolve(false) }
    }
    if (query.assignedToAgentBy_userId) {
      if (!validMongooseObjectId(query.assignedToAgentBy_userId)) { return Promise.resolve(false) }
    }
    if (query.detachedFromAgentBy_userId) {
      if (!validMongooseObjectId(query.detachedFromAgentBy_userId)) { return Promise.resolve(false) }
    }


    let filterParams = { ...query };
    
    if (query && query.phone) {
      filterParams['phone'] = formatNumber(query.phone);
    }

    if (filterParams.posTerminal_Id) {
      filterParams._id = query.posTerminal_Id;
    }
    if (filterParams.userId) {
      filterParams.user = query.userId;
    }
    if (filterParams.aggregatorUserId) {
      filterParams.aggregator = query.aggregatorUserId;
    }
    if (filterParams.assignedToAggregatorBy_userId) {
      filterParams.assignedToAggregatorBy = query.assignedToAggregatorBy_userId;
    }
    if (filterParams.detachedFromAggregatorBy_userId) {
      filterParams.detachedFromAggregatorBy = query.detachedFromAggregatorBy_userId;
    }
    if (filterParams.assignedToAgentBy_userId) {
      filterParams.assignedToAgentBy = query.assignedToAgentBy_userId;
    }
    if (filterParams.detachedFromAgentBy_userId) {
      filterParams.detachedFromAgentBy = query.detachedFromAgentBy_userId;
    }

    if (filterParams.assignedToAggregatorOn) {
      filterParams['assignedToAggregatorOn'] = {
        $gte: new Date(new Date(query.assignedToAggregatorOn).setHours('00', '00', '00')),
        $lt: new Date(new Date(query.assignedToAggregatorOn).setHours(23, 59, 59))
      }
    }
    if (filterParams.detachedFromAggregatorOn) {
      filterParams['detachedFromAggregatorOn'] = {
        $gte: new Date(new Date(query.detachedFromAggregatorOn).setHours('00', '00', '00')),
        $lt: new Date(new Date(query.detachedFromAggregatorOn).setHours(23, 59, 59))
      }
    }
    if (filterParams.assignedToAgentOn) {
      filterParams['assignedToAgentOn'] = {
        $gte: new Date(new Date(query.assignedToAgentOn).setHours('00', '00', '00')),
        $lt: new Date(new Date(query.assignedToAgentOn).setHours(23, 59, 59))
      }
    }
    if (filterParams.detachedFromAgentOn) {
      filterParams['detachedFromAgentOn'] = {
        $gte: new Date(new Date(query.detachedFromAgentOn).setHours('00', '00', '00')),
        $lt: new Date(new Date(query.detachedFromAgentOn).setHours(23, 59, 59))
      }
    }

    if (filterParams.dailyPosTransactionDate) {
      filterParams['dailyPosTransactionDate'] = {
        $gte: new Date(new Date(query.dailyPosTransactionDate).setHours('00', '00', '00')),
        $lt: new Date(new Date(query.dailyPosTransactionDate).setHours(23, 59, 59))
      }
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

    delete filterParams.skip;
    delete filterParams.limit;
    delete filterParams.date;
    delete filterParams.endDate;
    delete filterParams.startDate;
    delete filterParams.posTerminal_Id;
    delete filterParams.aggregatorUserId;
    delete filterParams.assignedToAggregatorBy_userId;
    delete filterParams.detachedFromAggregatorBy_userId;
    delete filterParams.assignedToAgentBy_userId;
    delete filterParams.detachedFromAgentBy_userId;
    delete filterParams.userId;

    const data = await PosTerminal.find({
      ...filterParams,
    })
    .skip(paginate.skip)
    .limit(paginate.limit)
    .sort({'meta.createdAt': -1})
    .populate('user', 'firstName lastName _id email phone')
    .populate('aggregator', 'firstName lastName _id email phone');
    
    const totalDocumentCount = await PosTerminal.countDocuments({ 
      ...filterParams,
    });

    return Promise.resolve({ data, totalDocumentCount, skip: paginate.skip, limit: paginate.limit, queryWith: query });
  },

  /**
   * findOnePOS
   * @param {*} query 
   */
  async findOnePOS(query: {}) {
    return await PosTerminal.findOne(query)
      .populate('user', 'firstName lastName email phone userId wallet _id')
      .populate('aggregator', 'firstName lastName email phone userId wallet _id')
  },

  /**
   * savePOSTerminal
   * @param {*} posTerminalInstance 
   */
  async savePOSTerminal(posTerminalInstance: PosTerminal) {
    return await posTerminalInstance.save();  
  },

  /**
   * findTerminalById
   * @param {*} id 
   */
  async findPOSTerminalById(id: string) {
    if (!validMongooseObjectId(id)) { return Promise.resolve(false) }
    return await PosTerminal.findById(id);
  },

  /**
   * insertPOSTerminal
   * @param {*} query 
   * @param {*} update 
   * @param {*} option 
   */
  async insertPOSTerminal(query: {}, update: {}, option: { new: boolean, upsert: boolean }) {
    return await PosTerminal.findOneAndUpdate(query, update, option);
  },

  /**
   * findOneAndDeleteTerminal
   * @param {*} query 
   */
  async findOneAndDeleteTerminal(query: {}) {
    // return await PosTerminal.findOneAndDelete(query);
    return await PosTerminal.deleteOne(query)
  },

  /**
   * findByIdAndDeleteTerminal
   * @param {*} terminal_id 
   */
  async findByIdAndDeleteTerminal(terminal_id: string) {
    if (!validMongooseObjectId(terminal_id)) { return Promise.resolve(false) }
    return await PosTerminal.findByIdAndDelete(terminal_id);
  },
};