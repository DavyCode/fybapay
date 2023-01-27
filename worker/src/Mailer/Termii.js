import axios from 'axios';
import { TERMI_BASE_URL, TERMI_API_KEY } from '../config/env';

export default {
  /**
   * sendSmsMessageWithTermii
   */
  async sendSmsMessageWithTermii({ message, phone }) {
    const payload = {
      to: phone,
      from: 'N-Alert', // 'OTPAlert',
      sms: message,
      type: 'plain',
      channel: 'dnd',
      api_key: TERMI_API_KEY,
    };

    const options = {
      method: 'POST',
      url: `${TERMI_BASE_URL}/sms/send`,
      data: payload,
    };

    // return new Promise((resolve, reject) => {
    //   axios(options)
    //     .then((response) => { resolve(response); })
    //     .catch((error) => { resolve(); });
    // });
    return new Promise((resolve, reject) => {
      axios(options)
        .then((response) => {
          // console.log({ response });
          resolve(response);
        })
        .catch((error) => {
          // console.log({ error: error.response.data });
          resolve();
        });
    });
  },

  /**
   * sendOtpToken
   */
  // async sendOtpToken() {
  //   return new Promise((resolve, reject) => {
  //     const option = {
  //       method: 'POST',
  //       headers: {
  //         'content-type': 'application/json',
  //       },
  //       url: `${TERMI_BASE_URL}`,
  //     };

  //     axios(option)
  //       .then((response) => {
  //         resolve(response);
  //       })
  //       .catch((ex) => {
  //         console.log({ BulkSendNg: ex });
  //         reject(ex);
  //       });
  //   });
  // },
  // async verifyOtpToken() {
  //   return new Promise((resolve, reject) => {
  //     const option = {
  //       method: 'POST',
  //       headers: {
  //         'content-type': 'application/json',
  //       },
  //       url: `${TERMI_BASE_URL}`,
  //     };

  //     axios(option)
  //       .then((response) => {
  //         resolve(response);
  //       })
  //       .catch((ex) => {
  //         console.log({ BulkSendNg: ex });
  //         reject(ex);
  //       });
  //   });
  // },
};
