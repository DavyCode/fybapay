// @flow

/**
 * Issue Database Operations
 */

import { AgentRequest, validMongooseObjectId } from '../models';
import Utility from '../utils';

export default {

  /**
   * getAllRequestAndSearch
   * @param {*} query 
   */
  async getAllAgentRequestAndSearch(query?: {
    skip?: number,
    limit?: number,
    date?: string,
    startDate?: string,
    endDate?: string,
    agentApproved?: boolean,
    agentApprovalDate?: string,
    agentId?: string,
    businessName?: string,
    businessLga?: string,
    businessCity?: string,
    prevRole?: string,
    search?: string,
  }) {
    let paginate = { skip: 0, limit: 10 }
    if (query && query.skip && query.limit) {
      paginate.skip = Number(query.skip);
      paginate.limit = Number(query.limit);
    }

    if (query.search) {
      const regex = new RegExp(Utility.escapeRegex(query.search), 'gi'); // regex: /"\\"pam\ man\\""/gi
      const data = await AgentRequest.find(
        { $text: { $search: regex } },
        { score: { $meta: "textScore" } }
      )
      .sort( { 'meta.createdAt': -1, score: { $meta: "textScore" } } )
      .skip(paginate.skip)
      .limit(paginate.limit)
      .populate('user', '-passwordHash')
      .populate('agentApprovedBy', 'firstName lastName phone role');

      const totalDocumentCount = await AgentRequest.countDocuments({
        $text: { $search: regex },
      });
      
      return Promise.resolve({ data: data, totalDocumentCount, skip: paginate.skip, limit: paginate.limit, queryWith: query });
    }

    let filterParams = { ...query };

    if (filterParams.agentApprovalDate) {
      filterParams['agentOnboardingDate'] = {
        $gte: new Date(new Date(query.agentApprovalDate).setHours('00', '00', '00')),
        $lt: new Date(new Date(query.agentApprovalDate).setHours(23, 59, 59))
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
    delete filterParams.search;
    delete filterParams.agentApprovalDate;

    const data = await AgentRequest
      .find({ ...filterParams })
      .skip(paginate.skip)
      .limit(paginate.limit)
      .sort({ 'meta.createdAt': -1 })
      .populate('user', '-passwordHash')
      .populate('agentApprovedBy', 'firstName lastName phone role');
    
    const totalDocumentCount = await AgentRequest.countDocuments({
      ...filterParams,
    });

    return Promise.resolve({ data: data, totalDocumentCount, skip: paginate.skip, limit: paginate.limit, queryWith: query });
  },
  
  async insert() {},

  /**
   * findById
   * @param {*} id 
   */
  async findById(id: string) {
    if (!validMongooseObjectId(id)) { return Promise.resolve(false) }
    return await AgentRequest.findById(id)
      .populate('user', '-passwordHash')
      .populate('agentApprovedBy', 'firstName lastName phone role');
  },

  /**
   * agentRequestCreate
   * @param {*} params 
   */
  async agentRequestCreate(params: {}) {
    return await AgentRequest.create(params);
  },

  /**
   * findOne agent request
   * @param {*} query 
   */
  async findOne(query: {}) {
    return await AgentRequest.findOne(query);
  },

  /**
   * save agent request instance
   * saveAgentRequest
   * @param {AgentRequest} agentInstance 
   */
  async saveAgentRequest(agentInstance: AgentRequest) {
    return await agentInstance.save();
  },
  
};