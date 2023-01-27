// @flow

import { BadRequestError, InternalServerError, APIError, NotFoundError, ForbiddenError, NotAcceptableError } from '../utils/errors';
import Utility from '../utils';
import UserRepository from '../repository/UserRepository';
import MessageRepository from '../repository/MessageRepository';
import enumType from '../enumType';

export default {
  /**
   * getUserDirectMessages
   * @param {*} request
   */
  async getUserDirectMessages(request) { // message & notification
    const user = await UserRepository.getUserById(request.user.id);
    if (!user) { throw new NotFoundError('User not found'); }
    const messages = await MessageRepository.getUserDirectMessages(user._id, request.query);
    if (!messages.data) { throw new NotFoundError('User messages not found'); }
    return Utility.buildResponse({ ...messages });
  },

  /**
   * getUserBroadcastMessages
   * @param {*} request
   */
  async getUserBroadcastMessages(request) {
    const user = await UserRepository.getUserById(request.user.id);
    if (!user) { throw new NotFoundError('User not found'); }
    const messages = await MessageRepository.getUserBroadcastMessages(request.user.id, request.query);
    if (!messages.data) { throw new NotFoundError('User messages not found'); }
    return Utility.buildResponse({ ...messages });
  },

  /**
   * readReceiptWebhook
   * @param {*} request
   */
  async readReceiptWebhook(request) {
    const { messageReadOnWhichDevice, messageId } = request.body;
    const user = await UserRepository.getUserById(request.user.id);
    if (!user) { throw new NotFoundError('User not found'); }
    const message = await MessageRepository.findById(messageId);
    if (!message) { throw new NotFoundError('Message not found'); }

    if (!message.approveForViewing) { throw new ForbiddenError('Message is not approved for viewing yet'); }
    if (!Object.values(enumType.appType).includes(messageReadOnWhichDevice)) {
      throw new BadRequestError(`${messageReadOnWhichDevice} is not an allowed device`);
    }

    /**
     * Direct message sent to a single user
     */
    if (message.messageCategory === enumType.messageCategory.DIRECT) {
      if (message.messageBelongsTo.toString() !== request.user.id.toString()) { throw new ForbiddenError('Message does not belong to user'); }
      message.isRead = true;
      message.isReadAt = Date.now();
      message.messageReadOnWhichDevice = messageReadOnWhichDevice;
      message['meta.updatedAt'] = Date.now();
      await MessageRepository.saveMessage(message);
    }

    /**
     * Broadcast message sent to multiple users
     */
    if (message.messageCategory === enumType.messageCategory.BROADCAST) {
      const receiptExist = await MessageRepository.findOneBroadcastReadReceipt({
        user: request.user.id,
        message: message._id,
        isRead: true,
      });

      if (receiptExist) { throw new ForbiddenError('Read receipt previously acknowledged'); }

      await MessageRepository.createBroadcastReadReceipt({
        message,
        messageToken: message.messageToken,
        user: request.user.id,
        messageReadOnWhichDevice,
        isRead: true,
        isReadAt: Date.now(),
      });
    }

    return Utility.buildResponse({ message: 'Read receipt acknowledged' });
  },

  /**
   * getAllMessages
   * @param {*} request
   * @description - ADMIN SERVICE
   */
  async getAllMessages(request) { // admin get all message
    const messages = await MessageRepository.getAllMessages(request.query);
    if (!messages.data) { throw new NotFoundError('Messages not found'); }
    return Utility.buildResponse({ ...messages });
  },

  /**
   * createDirectMessage
   * @param {*} request
   */
  async createDirectMessage(request) { // message & notification
    // const { platformType, messageType, messageTitle, messageBody, messageBelongsTo } = request.body;
    const user = await UserRepository.getUserById(request.body.messageBelongsTo);
    if (!user) { throw new NotFoundError('User message belongs to was not found'); }

    const messageToken = Utility.genUniqueId(); // generate token

    const newMessage = await MessageRepository.createMessage({
      messageToken,
      messageCategory: enumType.messageCategory.DIRECT,
      ...request.body,
    });

    if (!newMessage) { throw new InternalServerError('Something went wrong'); }
    return Utility.buildResponse({ data: newMessage, message: 'New message created' });
  },

  /**
   * createBroadcastMessage
   * @param {*} request
   */
  async createBroadcastMessage(request) { // NEWS
    const messageToken = Utility.genUniqueId(); // generate token
    const newMessage = await MessageRepository.createMessage({
      messageToken,
      messageCategory: enumType.messageCategory.BROADCAST,
      ...request.body,
    });

    if (!newMessage) { throw new InternalServerError('Something went wrong'); }
    return Utility.buildResponse({ data: newMessage, message: 'New message created' });
  },

  /**
   * updateMessage
   * @param {*} request
   */
  async updateMessage(request) {
    if (request.body && request.body.messageBelongsTo) {
      const user = await UserRepository.getUserById(request.body.messageBelongsTo);
      if (!user) { throw new NotFoundError('User message belongs to was not found'); }
    }

    const message = await MessageRepository.MessageInsert({ _id: request.body.messageId }, {
      ...request.body,
      'meta.updatedAt': Date.now(),
    }, { new: true, upsert: false });

    if (!message) { throw new NotFoundError('Message not found'); }

    return Utility.buildResponse({ data: message, message: 'Message updated successfully' });
  },

  /**
   * deleteMessage
   * @param {*} request
   */
  async deleteMessage(request) {
    const message = await MessageRepository.deleteMessage(request.body.messageId);
    if (!message) { throw new NotFoundError('Message not found'); }
    return Utility.buildResponse({ data: message, message: 'Message deleted' });
  },

  /**
   * approveViewing
   * @param {*} request
   */
  async messageApproveForViewing(request) { // update message
    const message = await MessageRepository.findById(request.body.messageId);
    if (!message) { throw new NotFoundError('Message not found'); }

    message.approveForViewing = !message.approveForViewing;
    message['meta.updatedAt'] = Date.now();
    const savedMessage = await MessageRepository.saveMessage(message);
    return Utility.buildResponse({ data: savedMessage, message: `Message approved for viewing ${savedMessage.approveForViewing}` });
  },

  /**
   * getMessagesEnum
   * @param {*} request
   */
  async getMessagesEnum(request) {
    return Utility.buildResponse({
      data: {
        messageType: [...Utility.getObjectValues(enumType.messageType)],
        messageCategory: [...Utility.getObjectValues(enumType.messageCategory)],
      },
    });
  },
};
