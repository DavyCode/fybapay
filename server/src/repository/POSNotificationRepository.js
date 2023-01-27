// @flow

import { PosNotification, validMongooseObjectId } from '../models';
import Utility from '../utils';

export default {
  /**
   * createReferral
   * @param {*} params
   */
  async createPOSNotification(params: PosNotification) {
    return await PosNotification.create(params);
  },

    /**
   * getAllPosNotificationAndFilter
   * @param {*} query 
   */
  async getAllPosNotificationAndFilter(query?: {
    skip?: number,
    limit?: number,
    date?: string,
    startDate?: string,
    endDate?: string,

    amount?: number,
    currency?: string,
    customerName?: string,
    paymentDate?: string,
    reference?: string,
    retrievalReferenceNumber?: string,
    statusCode?: string,
    statusDescription?: string,
    transactionReference?: string,
    type?: string,
    reverse?: boolean,
    settle?: boolean,
    transactionNumber?: number,
    terminalId?: string,
    // notificationBody?: string,
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

    const data = await PosNotification.find({
      ...filterParams,
    })
    .skip(paginate.skip)
    .limit(paginate.limit)
    .sort({'meta.createdAt': -1})

    const totalDocumentCount = await PosNotification.countDocuments({ 
      ...filterParams,
    });

    return Promise.resolve({ data, totalDocumentCount, skip: paginate.skip, limit: paginate.limit, queryWith: query });
  },

  /**
   * findOne
   * @param {Object} query 
   */
  async findOne(query: {}) {
    return await PosNotification.findOne(query);
  }

};
