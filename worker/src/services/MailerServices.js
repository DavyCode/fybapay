
/**
 * Send sms & mails services
 */

import axios from 'axios';
import { BadRequestError, InternalServerError, APIError, NotFoundError, ForbiddenError, NotAcceptableError } from '../utils/errors';
import Utility from '../utils';
import enumType from '../enumType';
import Mailer from '../Mailer/Mailer';
import MailerAws from '../Mailer/MailerAws';
import BulkSendNg from '../Mailer/BulkSendNg';
import Termii from '../Mailer/Termii';
import SmartSmsSolution from '../Mailer/SmartSmsSolution';
import EnquiryRepository from '../repository/EnquiryRepository';
import ServiceSwitchRepository from '../repository/ServiceSwitchRepository';

export default {
  /**
   * sendMail
   * @param {Object} request
   */
  async sendMail(request) {
    // await Mailer(request.body);
    await MailerAws(request.body);
    return Utility.buildResponse({ message: 'Mail Successful' });
  },

  /**
   * sendMailInternal
   * @param {Object} data
   */
  async sendMailInternal(data) {
    // await Mailer(request.body);
    await MailerAws(data);
  },

  /**
   * sendVendorSms
   * @param {*} request 
   */
  async sendVendorSms(request) {
    let platform = enumType.platform.SMARTSOLUTIONS;

    switch (platform) {
      case enumType.platform.BULKSMSNIGERIA:
        return await this.sendViaBulkSendNg(request.body);
      case enumType.platform.SMARTSOLUTIONS:
        return await this.sendViaSmartSolutions(request.body);
      case enumType.platform.TERMII:
        return await this.sendViaTermii(request.body);
      default:
        throw new InternalServerError('Platform not found');
    }
  },

  /**
   * sendSms
   * @param {object} request
   */
  async sendSms(request) {
    const serviceType = enumType.serviceType.SMS;
    const switchService = await ServiceSwitchRepository.findByServiceType(serviceType);
    if (!switchService) { throw new NotFoundError('Invalid service name or type, service not available') };

    switch (switchService.platform) {
      case enumType.platform.BULKSMSNIGERIA:
        return await this.sendViaBulkSendNg(request.body);
      case enumType.platform.SMARTSOLUTIONS:
        return await this.sendViaSmartSolutions(request.body);
      case enumType.platform.TERMII:
        return await this.sendViaTermii(request.body);
      default:
        throw new InternalServerError('Switch service not available, please contact support');
    }
  },
  
  /**
   * sendViaTermii
   * @param {*} request 
   */
  async sendViaTermii(params: {}) {
    await Termii.sendSmsMessageWithTermii(params);
    return Utility.buildResponse({ message: 'Sms Successful' });
  },

  /**
   * sendViaBulkSendNg
   * @param {*} params 
   */
  async sendViaBulkSendNg(params: {}) {
    await BulkSendNg(params);
    return Utility.buildResponse({ message: 'Sms Successful' });
  },

  /**
   * sendViaSmartSolutions
   * @param {*} params 
   */
  async sendViaSmartSolutions(params: {}) {
    await SmartSmsSolution(params);
    return Utility.buildResponse({ message: 'Sms Successful' });
  },

  /**
   * Save new enquiry
   * @param {*} request
   */
  async enquiry(request) {
    await EnquiryRepository.enquiryCreate(request.body);
    return Utility.buildResponse({ message: 'Your enquiry has been submitted, we will revert to you shortly' }); 
  },

  /**
   * sendVendorSmsInternal
   * @param {Object} data 
   */
  async sendVendorSmsInternal(data) {
    let platform = enumType.platform.SMARTSOLUTIONS;

    switch (platform) {
      case enumType.platform.BULKSMSNIGERIA:
        return await this.sendViaBulkSendNg(data);
      case enumType.platform.SMARTSOLUTIONS:
        return await this.sendViaSmartSolutions(data);
      case enumType.platform.TERMII:
        return await this.sendViaTermii(data);
      default:
        throw new InternalServerError('Platform not found');
    }
  },

  /**
   * sendWhatsapp
   * @param {*} request 
   */
  async sendOtpTokenWhatsapp(request) {},

  /**
   * sendTermii
   * @param {*} request 
   */
  async sendOtpTokenTermii(request) {},
};
