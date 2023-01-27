// @flow

/**
 * Issue Database Operations
 */

import { Issues, validMongooseObjectId } from '../models';
import Utility from '../utils';

export default {
  /**
  * Insert issue
  * @private
  */
  async otpIssueInsert(query: {}, update: {}, option: { new: boolean, upsert: boolean }) {
    return await Issues.findOneAndUpdate(query, update, option);
  },

  /**
  * Get an issue by ID
  * @private
  */
  async getIssueById(id: string) {
    if (!validMongooseObjectId(id)) { return Promise.resolve(false) }
    return await Issues.findById(id).populate('user attendendToBy');
  },

  /**
   * findOne
   * @param {*} query 
   */
  async findOne(query: {} = {}) {
    return await Issues.findOne(query).populate('user attendendToBy');
  },

  /**
   * createIssue
   * @param {*} params 
   */
  async createIssue(params: {}) {
    return await Issues.create(params);
  },

  /**
   * issueSave
   * @param {*} issueInstance 
   */
  async issueSave(issueInstance: Issues) {
    return await issueInstance.save();
  }, 

  /**
   * get All Issues
   * @param {*} query 
   */
  async getAllIssues(query?: {
    skip?: number,
    limit?: number, 
    date?: string,
    startDate?: string,
    endDate?: string,
    issueCategory?: string,
    status?: string,
    issueReferenceId?: string,
  }) {
    let paginate = { skip: 0, limit: 10 };
    if (query && query.skip && query.limit) {
      paginate.skip = Number(query.skip);
      paginate.limit = Number(query.limit);
    }

    let searchParams = { ...query }

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

    const data = await Issues.find({
      ...searchParams,
    })
    .skip(paginate.skip)
    .limit(paginate.limit)
    .sort({'meta.createdAt': -1})
    .populate('user attendendToBy');

    const totalDocumentCount = await Issues.countDocuments({
      ...searchParams,
    })

    return Promise.resolve({ data: data, totalDocumentCount, skip: paginate.skip, limit: paginate.limit, queryWith: query });
  },

  /**
   * getUserIssues
   * @param {*} userId 
   * @param {*} query 
   */
  async getUserIssues(userId: string, query?: {
    skip?: number,
    limit?: number, 
    date?: string,
    startDate?: string,
    endDate?: string,
    issueCategory?: string,
    status?: string,
    issueReferenceId?: string,
  }) {
    let paginate = { skip: 0, limit: 10 };
    if (query && query.skip && query.limit) {
      paginate.skip = Number(query.skip);
      paginate.limit = Number(query.limit);
    }
    if (!validMongooseObjectId(userId)) { return Promise.resolve(false) }
    
    let searchParams = { ...query }

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

    const data = await Issues.find({
      ...searchParams,
      user: userId,
    })
    .skip(paginate.skip)
    .limit(paginate.limit)
    .sort({'meta.createdAt': -1})
    // .populate('user', 'firstName lastName _id')
    .populate('attendendToBy', 'firstName lastName');

    const totalDocumentCount = await Issues.countDocuments({
      ...searchParams,
      user: userId,
    })

    return Promise.resolve({ data: data, totalDocumentCount, skip: paginate.skip, limit: paginate.limit, queryWith: query });
  }
};
