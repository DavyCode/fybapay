// @flow

import axios from 'axios';
import { UTIL_SERVER } from '../config/env';
import { InternalServerError } from '../utils/errors';
import Pubsub from '../events/systemLogListener';

export default {
  
  /**
   * verifyTermiiOtpToken
   * @param {*} messageObject
   */
  async verifyTermiiOtpToken(messageObject) {
    const option = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      url: `${UTIL_SERVER}/send/mail`,
      data: JSON.stringify(messageObject),
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
   * sendTermiiOtpToken
   * @param {*} messageObject
   */
  async sendTermiiOtpToken(messageObject) {
    const option = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      url: `${UTIL_SERVER}/send/otp_token`,
      data: JSON.stringify(messageObject),
    };

    return new Promise((resolve, reject) => {
      axios(option)
      .then((response) => {
        resolve(response);
      }).catch((ex) => {
        reject(ex);
      });
    });
  },

  async sendUserOtpToken(request) {},
  async verifyUserOtpToken(request) {},
};
