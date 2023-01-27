import axios from 'axios';
import FormData from 'form-data';
import {
  VTPASS_URL,
  VTPASS_USERNAME,
  VTPASS_PASSWORD, } from '../../../../config/env';
import { InternalServerError } from '../../../../utils/errors';

export default {
  /**
   * vtpassVerifyTransaction
   * @param {*} requestData
   */
  async vtpassVerifyTransaction(requestData) {
    try {
      const formData = new FormData();
      const data = requestData;

      Object.keys(data).forEach((key) => {
        formData.append(key, data[key]);
      });

      const formHeaders = formData.getHeaders();

      // const options = {
      //   method: 'POST',
      //   headers: { ...formHeaders },
      //   auth: { username: VTPASS_USERNAME, password: VTPASS_PASSWORD },
      //   data: formData,
      //   url: `${VTPASS_URL}/requery`,
      // };
      const optionsb = {
        method: 'POST',
        // headers: { ...formHeaders },
        headers: { 'content-type': 'application/json' },
        auth: { username: VTPASS_USERNAME, password: VTPASS_PASSWORD },
        data: JSON.stringify(requestData),
        url: `${VTPASS_URL}/requery`,
      };

      return new Promise((resolve, reject) => {
        axios(optionsb)
          .then((response) => {
            resolve(response.data);
          })
          .catch((error) => {
            // console.log({ error: error });
            resolve(false);
          });
      });
    } catch (error) {
      throw new InternalServerError(error.message);
    }
  },
};
