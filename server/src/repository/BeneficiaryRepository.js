// @flow

import { validMongooseObjectId, Referral, Beneficiary } from '../models';

export default {
  /**
   * findById
   * @param {*} id 
   */
  async findById(id: string) {
    if (!validMongooseObjectId(id)) { return Promise.resolve(false) }
    return await Beneficiary.findById(id);
  },

  /**
   * getUserBeneficiary
   * @param {*} userId 
   * @param {*} query 
   */
  async getUserBeneficiary(userId: string, query?: {
    skip?: number,
    limit?: number, 
    date?: string,
    startDate?: string,
    endDate?: string,
    accountNumber?: string,
    accountName?: string,
    bankCode?: string,
    bankName?: string,
    transactionType?: string,
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

    const data = await Beneficiary.find({
      user: userId,
      ...searchParams,
    })
    .skip(paginate.skip)
    .limit(paginate.limit)
    .sort({'meta.createdAt': -1})

    const totalDocumentCount = await Beneficiary.countDocuments({
      user: userId,
      ...searchParams,
    })

    return Promise.resolve({ data: data, totalDocumentCount, skip: paginate.skip, limit: paginate.limit, queryWith: query });  
  },

  /**
   * get Beneficiaries
   * @param {*} query 
   */
  async getAllBeneficiaries(query?: {
    skip?: number,
    limit?: number, 
    date?: string,
    startDate?: string,
    endDate?: string,
    accountNumber?: string,
    accountName?: string,
    bankCode?: string,
    bankName?: string,
    transactionType?: string,
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

    const data = await Beneficiary.find({
      ...searchParams,
    })
    .skip(paginate.skip)
    .limit(paginate.limit)
    .sort({'meta.createdAt': -1})

    const totalDocumentCount = await Beneficiary.countDocuments({
      ...searchParams,
    })

    return Promise.resolve({ data: data, totalDocumentCount, skip: paginate.skip, limit: paginate.limit, queryWith: query });  
  },

  /**
   * beneficiaryCreate
   */
  async beneficiaryCreate(params: Beneficiary) {
    return await Beneficiary.create(params);
  },

  /**
   * userBeneficiary
   * @param {string} userId 
   * @param {string} transactionType 
   */
  async userBeneficiary(userId: string, transactionType: string, accountNumber: string) {
    return await Beneficiary.findOne({
      user: userId,
      transactionType,
      accountNumber,
    });
  } 
}