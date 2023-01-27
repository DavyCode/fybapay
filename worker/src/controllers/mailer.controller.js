// @flow

import { Request, Response, NextFunction } from 'express';
import MailerServices from '../services/MailerServices';


export default {
  /**
   * sendMail
   * @param {*} request
   * @param {*} response
   * @param {*} next
   */
  async sendMail(request, response, next) {
    const result = await MailerServices.sendMail(request);
    return response.status(result.statusCode).send(result);
  },

  /**
   * sendSms
   * @param {*} request
   * @param {*} response
   * @param {*} next
   */
  async sendSms(request, response, next) {
    const result = await MailerServices.sendSms(request);
    return response.status(result.statusCode).send(result);
  },

  /**
   * sendVendorSms
   * @param {*} request
   * @param {*} response
   * @param {*} next
   */
  async sendVendorSms(request, response, next) {
    const result = await MailerServices.sendVendorSms(request);
    return response.status(result.statusCode).send(result);
  },

  /**
   * enquiry
   * @param {*} request
   * @param {*} response
   * @param {*} next
   */
  async enquiry(request, response, next) {
    const result = await MailerServices.enquiry(request);
    return response.status(result.statusCode).send(result);
  },
}