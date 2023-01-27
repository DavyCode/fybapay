/**
 * Call Utils server to send mails and sms
 */

import axios from 'axios';
import { UTIL_SERVER, WORKER_API_BASE_URI } from '../config/env';
import { InternalServerError } from '../utils/errors';
import Pubsub from '../events/systemLogListener';


export default {
  /**
   * sendMail
   * @param {object} mailObject
   */
  async sendMail(mailObject) {
    const option = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      url: `${UTIL_SERVER}${WORKER_API_BASE_URI}/send/mail`,
      data: JSON.stringify(mailObject),
    };

    return new Promise((resolve, reject) => {
      axios(option).then((response) => {
        resolve(response);
      }).catch((ex) => {
        reject(ex);
      });
    });
  },

  /**
   * sendSms
   * @param {object} smsObject
   */
  async sendSms(smsObject) {
    const option = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      url: `${UTIL_SERVER}${WORKER_API_BASE_URI}/send/sms`,
      data: JSON.stringify(smsObject),
    };

    return new Promise((resolve, reject) => {
      axios(option).then((response) => {
        resolve(response);
      }).catch((ex) => {
        reject(ex);
      });
    });
  },

  /**
   * sendVendorSms
   * @param {object} smsObject
   */
  async sendVendorSms(smsObject) {
    const option = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      url: `${UTIL_SERVER}${WORKER_API_BASE_URI}/send/sms/vendor`,
      data: JSON.stringify(smsObject),
    };

    return new Promise((resolve, reject) => {
      axios(option).then((response) => {
        resolve(response);
      }).catch((ex) => {
        reject(ex);
      });
    });
  },
};
