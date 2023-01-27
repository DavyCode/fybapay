// @flow

import { Message, BroadcastReadReceipt, validMongooseObjectId } from '../models';
import enumType from '../enumType';

export default {
  /**
   * findOne
   * @param {*} query 
   */
  async findOne(query: {}) {
    return await Message.findOne(query);
  },

  /**
   * getUserMessages
   * @param {*} query 
   */
  async getUserDirectMessages(userId: string, query: {
    skip?: number,
    limit?: number,
    messageReadOnWhichDevice?: string,
    isRead?: boolean,
    isReadAt?: string,
    platformType?: string,
    messageToken?: string,
    messageType?: string,
    messageTitle?: string,
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

    let searchParams = { 
      ...query,
      messageCategory: enumType.messageCategory.DIRECT,
    };

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
    if (query.isReadAt) {
      searchParams['isReadAt'] = {
        $gte: new Date(new Date(query.isReadAt).setHours('00', '00', '00')),
        $lt: new Date(new Date(query.isReadAt).setHours(23, 59, 59))
      }
    }

    delete searchParams.skip;
    delete searchParams.limit;
    delete searchParams.date;
    delete searchParams.endDate;
    delete searchParams.startDate;

    const data = await Message.find({
      ...searchParams,
      messageBelongsTo: userId,
      approveForViewing: true,
    })
    .skip(paginate.skip)
    .limit(paginate.limit)
    .sort({'meta.createdAt': -1})

    const totalDocumentCount = await Message.countDocuments({
      ...searchParams,
      messageBelongsTo: userId,
      approveForViewing: true,
    })

    return Promise.resolve({ data: data, totalDocumentCount, skip: paginate.skip, limit: paginate.limit, queryWith: query });  
  },

  /**
   * getUserBroadcastMessages
   * @param {*} userId 
   * @param {*} query 
   */
  async getUserBroadcastMessages(userId: string, query: {
    skip?: number,
    limit?: number,
    messageReadOnWhichDevice?: string,
    isRead?: boolean,
    isReadAt?: string,
    platformType?: string,
    messageToken?: string,
    messageType?: string,
    messageTitle?: string,
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

    let searchParams = { 
      ...query,
      messageCategory: 'broadcast',
    };

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
    if (query.isReadAt) {
      searchParams['isReadAt'] = {
        $gte: new Date(new Date(query.isReadAt).setHours('00', '00', '00')),
        $lt: new Date(new Date(query.isReadAt).setHours(23, 59, 59))
      }
    }

    delete searchParams.skip;
    delete searchParams.limit;
    delete searchParams.date;
    delete searchParams.endDate;
    delete searchParams.startDate;

    const data = await Message.find({
      ...searchParams,
      // messageBelongsTo: userId,
      approveForViewing: true,
    })
    .skip(paginate.skip)
    .limit(paginate.limit)
    .sort({'meta.createdAt': -1})

    const finalList = [];
    for (let i = 0; i < data.length; i++) {
      const currentMessage = data[i];
      const readReceipt = await BroadcastReadReceipt.findOne({
        user: userId,
        message: currentMessage._id 
      });
      
      if (readReceipt) {
        finalList.push({
          messageToken: currentMessage.messageToken,
          actionLink: currentMessage.actionLink,
          includeImageUrl: currentMessage.includeImageUrl,
          messageTitle: currentMessage.messageTitle,
          messageBody: currentMessage.messageBody,
          approveForViewing: currentMessage.approveForViewing,
          platformType: currentMessage.platformType,
          messageType: currentMessage.messageType,
          messageCategory: currentMessage.messageCategory,
          messageBelongsTo: currentMessage.messageBelongsTo,
          meta: currentMessage.meta,
          isRead: readReceipt.isRead,
          isReadAt: readReceipt.isReadAt,
          messageReadOnWhichDevice: readReceipt.messageReadOnWhichDevice,
        })
      }
      else {
        finalList.push(currentMessage);
      }
    }

    const totalDocumentCount = await Message.countDocuments({
      ...searchParams,
      // messageBelongsTo: userId,
      approveForViewing: true,
    })

    return Promise.resolve({ data: finalList, totalDocumentCount, skip: paginate.skip, limit: paginate.limit, queryWith: query });
  },

  /**
   * getAllMessages
   * @param {*} query 
   */
  async getAllMessages(query: {
    skip?: number,
    limit?: number,
    messageReadOnWhichDevice?: string,
    isRead?: boolean,
    isReadAt?: string,
    platformType?: string,
    messageToken?: string,
    messageType?: string,
    messageCategory?: string,
    messageBelongsTo?: string, // userId
    messageTitle?: string,
    date?: string,
    startDate?: string,
    endDate?: string,
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
    if (query.isReadAt) {
      searchParams['isReadAt'] = {
        $gte: new Date(new Date(query.isReadAt).setHours('00', '00', '00')),
        $lt: new Date(new Date(query.isReadAt).setHours(23, 59, 59))
      }
    }

    delete searchParams.skip;
    delete searchParams.limit;
    delete searchParams.date;
    delete searchParams.endDate;
    delete searchParams.startDate;

    const data = await Message.find({
      ...searchParams,
    })
    .skip(paginate.skip)
    .limit(paginate.limit)
    .sort({'meta.createdAt': -1})

    const totalDocumentCount = await Message.countDocuments({
      ...searchParams,
    })

    return Promise.resolve({ data: data, totalDocumentCount, skip: paginate.skip, limit: paginate.limit, queryWith: query });  
  },

  /**
   * createMessage
   * @param {*} params 
   */
  async createMessage(params: { messageBelongsTo: string }) {
    if (params.messageBelongsTo && !validMongooseObjectId(params.messageBelongsTo)) { return Promise.resolve(false) }
    return await Message.create(params);
  },

  /**
   * MessageInsert
   * @param {*} query 
   * @param {*} update 
   * @param {*} option 
   */
  async MessageInsert(query: {}, update: {}, option: { new: boolean, upsert: boolean }) {
    return await Message.findOneAndUpdate(query, update, option);
  },

  /**
   * findById
   * @param {string} id 
   */
  async findById(id: string) {
    if (!validMongooseObjectId(id)) { return Promise.resolve(false) }
    return await Message.findById(id)
  },

  /**
   * deleteMessage
   * @param {string} id 
   */
  async deleteMessage(id: string) {
    if (!validMongooseObjectId(id)) { return Promise.resolve(false) }
    return await Message.findByIdAndDelete({ _id: id });
  },

  /**
   * saveMessage
   * @param {*} messageInstance 
   */
  async saveMessage(messageInstance: Message) {
    return await messageInstance.save();
  },

  /**
   * createBroadcastReadReceipt
   * @param {*} params 
   */
  async createBroadcastReadReceipt(params: {}) {
    return await BroadcastReadReceipt.create(params);
  },

  /**
   * findOneBroadcastReadReceipt
   * @param {*} query 
   */
  async findOneBroadcastReadReceipt(query: {}) {
    return await BroadcastReadReceipt.findOne(query);
  },
};