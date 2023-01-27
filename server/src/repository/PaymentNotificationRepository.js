// @flow

import { PaymentNotification } from '../models';

export default {
  /**
   * Save Payment Notification
   * @param {} PaymentInstance 
   */
  async savePaymentNotification(PaymentInstance: PaymentNotification) {
    return await PaymentInstance.save();
  },

  /**
  * Create Transaction
  * @private
  */
  async createPaymentNotification(params: {}) {
    return await PaymentNotification.create(params);
  },

  /**
   * findOnePaymentNotification
   * @param {object} query 
   */
  async findOnePaymentNotification(query: {}) {
    return await PaymentNotification.findOne(query);
  },

  /**
   * getAllPaymentNotificationsAndFilter
   * @param {*} query 
   */
  async getAllPaymentNotificationsAndFilter(query: {
    skip?: number,
    limit?: number,
    date?: string,
    startDate?: string,
    endDate?: string,

    // accountReference?: string,
    amountPaid?: number,
    paidOn?: string,
    paymentDescription?: string,
    paymentReference?: string,
    paymentStatus?: string,
    totalPayable?: number,
    transactionHash?: string,
    transactionReference?: string,
    paymentMethod?: string,
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

    const data = await PaymentNotification.find({
      ...searchParams,
    })
    .skip(paginate.skip)
    .limit(paginate.limit)
    .sort({'meta.createdAt': -1})

    const totalDocumentCount = await PaymentNotification.countDocuments({
      ...searchParams,
    })

    return Promise.resolve({ data: data, totalDocumentCount, skip: paginate.skip, limit: paginate.limit, queryWith: query });
  },
};
