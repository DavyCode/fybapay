// @flow

import { validMongooseObjectId, AppUpdate } from '../models';

export default {
  /**
   * findById
   * @param {*} id 
   */
  async findById(id: string) {
    if (!validMongooseObjectId(id)) { return Promise.resolve(false) }
    return await AppUpdate.findById(id);
  },

  /**
   * getAllAppUpdates
   * @param {*} query 
   */
  async getAllAppUpdates(query?: {
    skip?: number,
    limit?: number,
    appType?: string,
    versionNumber?: string,
    versionId?: string,
    platformType?: string,
    releaseDate?: string,
  }) {
    let paginate = { skip: 0, limit: 10 }
    if (query && query.skip && query.limit) {
      paginate.skip = Number(query.skip);
      paginate.limit = Number(query.limit);
    }

    let filterParams = { ...query };

    if (query.releaseDate) {
      filterParams['releaseDate'] = {
        $gte: new Date(new Date(query.releaseDate).setHours('00', '00', '00')),
        $lt: new Date(new Date(query.releaseDate).setHours(23, 59, 59))
      }
    }

    delete filterParams.skip;
    delete filterParams.limit;

    const data = await AppUpdate
      .find({ ...filterParams })
      .skip(paginate.skip)
      .limit(paginate.limit)
      .sort({ 'meta.createdAt': -1 })
  
    const totalDocumentCount = await AppUpdate.countDocuments({
      ...filterParams,
    });

    return Promise.resolve({ data: data, totalDocumentCount, skip: paginate.skip, limit: paginate.limit, queryWith: query });
  },

  /**
   * appUpdateCreate
   * @param {*} params 
   */
  async appUpdateCreate(params: {}) {
    return await AppUpdate.create(params);
  },

  /**
   * findOne
   * @param {*} query 
   */
  async findOne(query: {}) {
    return await AppUpdate.findOne(query)
  },

  /**
   * appUpdateInsert
   * @param {*} query 
   * @param {*} update 
   * @param {*} option 
   */
  async appUpdateInsert(query: {}, update: {}, option: { new: boolean, upsert: boolean }) {
    return await AppUpdate.findByIdAndUpdate(query, update, option);
  },

};
