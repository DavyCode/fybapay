// @flow

import { Aggregator, AggregatorEOD, validMongooseObjectId } from '../models';

export default {
  /**
   * findById
   * @param {*} id
   */
  // async findById(id: string) {
  //   return await Aggregator.findById(id);
  // },

  /**
   * findAggregatorEODByDate
   * @param {String} aggregatorId 
   * @param {String} eodDate 
   */
  async findAggregatorEODByDate(aggregatorId: string, eodDate: string ) {
    if (!validMongooseObjectId(aggregatorId)) { return Promise.resolve(false) }
    return await AggregatorEOD.find({
      aggregator: aggregatorId,
      eodDate,
    })
  },

  /**
   * getAggregatorEODAndFilter
   * @param {Object} query 
   */
  async getAggregatorEODAndFilter(query? :{
    skip?: number,
    limit?: number,
    date?: string,
    startDate?: string,
    endDate?: string,

    aggregatorId?: string,
    eodDate?: string,
    cleared?: boolean,
    aggregatorConcessionChargeApplied?: string,
    payoutDate?: string,
  }) {
    let paginate = { skip: 0, limit: 10 };
    if (query && query.skip && query.limit) {
      paginate.skip = Number(query.skip);
      paginate.limit = Number(query.limit);
    }

    if (query.aggregatorId) {
      if (!validMongooseObjectId(query.aggregatorId)) { return Promise.resolve(false) }
    }

  }

};
