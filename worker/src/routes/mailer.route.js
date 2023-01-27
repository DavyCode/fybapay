import { WORKER_API_BASE_URI } from '../config/env';

import { enquiryValidator, mailValidator } from '../validations/inputValidator';
import MailerController from '../controllers/mailer.controller';

export default (router) => {
  router.post(`${WORKER_API_BASE_URI}/send/mail`, mailValidator, MailerController.sendMail);
  router.post(`${WORKER_API_BASE_URI}/send/sms`, MailerController.sendSms);
  router.post(`${WORKER_API_BASE_URI}/enquiry`, enquiryValidator, MailerController.enquiry);
  router.post(`${WORKER_API_BASE_URI}/send/sms/vendor`, MailerController.sendVendorSms);
  // router.post(`${WORKER_API_BASE_URI}/send/otp_token`, enquiryValidator, MailerController.);
};
