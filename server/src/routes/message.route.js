import messageController from '../controllers/message.controller';
import ensureAuth from '../middleware/ensureAuth';
import { readReceiptWebhookMessageValidator } from '../validations/inputValidator';
import { API_BASE_URI } from '../config/env';

export default (router) => {
  router.get(`${API_BASE_URI}/messages/direct`, ensureAuth, messageController.getUserDirectMessages);
  router.get(`${API_BASE_URI}/messages/broadcast`, ensureAuth, messageController.getUserBroadcastMessages);
  router.post(`${API_BASE_URI}/messages/webhook/read`, ensureAuth, readReceiptWebhookMessageValidator, messageController.readReceiptWebhook);
  router.get(`${API_BASE_URI}/messages/category`, messageController.getMessagesEnum);
};
