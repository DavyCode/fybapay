import axios from 'axios';
import FormData from 'form-data';
import {
  VTPASS_URL,
  VTPASS_USERNAME,
  VTPASS_PASSWORD, } from '../../../../config/env';
import { InternalServerError } from '../../../../utils/errors';

axios.defaults.timeout = 50 * 1000;

export default {
  /**
   * Vtpass Verify Account
   * @param {*} requestData 
   */
  async vtpassVerifyAccount(requestData) {
    try {
      const formData = new FormData();
      const data = requestData;
  
      Object.keys(data).forEach((key) => {
        formData.append(key, data[key]);
      });
  
      const formHeaders = formData.getHeaders();
      
      const options = {
        method: 'POST',
        headers: { ...formHeaders },
        auth: { username: VTPASS_USERNAME, password: VTPASS_PASSWORD },
        data: formData,
        url: `${VTPASS_URL}/merchant-verify`,
      };
  
      return new Promise((resolve, reject) => {
        axios(options)
          .then((response) => {
            // console.log({ response: response.data });
            resolve(response.data);
          })
          .catch((error) => {
            console.log({ error });
            resolve(false);
          });
      });
    } catch (error) {
      throw new InternalServerError(error.message);
    }
  },

  /**
   * Vtpass Variation
   * @param {string} serviceID 
   */
  async vtpassVariation(serviceID: string) {
    try {
      const options = {
        method: 'GET',
        // headers: { ...formHeaders },
        auth: { username: VTPASS_USERNAME, password: VTPASS_PASSWORD },
        // data: formData,
        url: `${VTPASS_URL}/service-variations?serviceID=${serviceID}`,
      };
  
      return new Promise((resolve, reject) => {
        axios(options)
          .then((response) => {
            // console.log({ response: response.data });
            resolve(response.data);
          })
          .catch((error) => {
            console.log({ error });
            resolve(false);
          });
      });
    } catch (error) {
      throw new InternalServerError(error.message);
    }
  },

  /**
   * vtpassPay
   * @param {*} requestData
   */
  async vtpassPay(requestData) {
    try {
      const formData = new FormData();
      const data = requestData;
  
      Object.keys(data).forEach((key) => {
        formData.append(key, data[key]);
      });
  
      const formHeaders = formData.getHeaders();
  
      const options = {
        method: 'POST',
        headers: { ...formHeaders },
        auth: { username: VTPASS_USERNAME, password: VTPASS_PASSWORD },
        data: formData,
        url: `${VTPASS_URL}/pay`,
      };
  
      return new Promise((resolve, reject) => {
        axios(options)
          .then((response) => {
            // console.log({ response: response.data });
            resolve(response.data);
          })
          .catch((error) => {
            console.log({ error });
            resolve(false);
          });
      });
    } catch (error) {
      throw new InternalServerError(error.message);
    }
  },
};
