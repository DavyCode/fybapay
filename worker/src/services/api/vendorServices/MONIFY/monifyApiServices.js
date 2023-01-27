import axios from 'axios';
import { MONNIFY_API_KEY, MONNIFY_BASE_URL, MONNIFY_CLIENT_SECRET_KEY } from '../../../../config/env';
import { InternalServerError } from '../../../../utils/errors';

export default {
  /**
   * Verify Transaction
   * @param {string} transactionReference
   */
  async verifyMonifyTransaction(transactionReference) {
    try {
      const options = {
        method: 'GET',
        headers: { 'content-type': 'application/json' },
        auth: { username: MONNIFY_API_KEY, password: MONNIFY_CLIENT_SECRET_KEY },
        url: `${MONNIFY_BASE_URL}/merchant/transactions/query?transactionReference=${transactionReference}`,
      };

      return new Promise((resolve, reject) => {
        axios(options)
          .then((response) => {
            console.log({ response: response.data });
            resolve(response.data);
          })
          .catch((error) => {
            // console.log({ error });
            console.log({ error: error.response.data });
            // reject(error.response.data.responseMessage);
            resolve(false);
          });
      });
    } catch (error) {
      throw new InternalServerError(error.message);
    }
  },

  /**
   * Get Monify Access Token
   * @public
   */
  async getMonifyAccessToken() {
    try {
      const options = {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        auth: { username: MONNIFY_API_KEY, password: MONNIFY_CLIENT_SECRET_KEY },
        url: `${MONNIFY_BASE_URL}/auth/login`,
      };

      return new Promise((resolve, reject) => {
        axios(options)
          .then((response) => { resolve(response.data); })
          .catch((error) => {
            console.log({ error: error.response.data });
            reject(error.response.data.responseMessage);
          });
      });
    } catch (error) {
      throw new InternalServerError(error.message);
    }
  },

  /**
   * Create reserved account
   * @param {*} accountObject
   * @param {string} accessToken
   */
  async createReservedAccount(accountObject, accessToken) {
    try {
      return new Promise((resolve, reject) => {
        const option = {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          data: JSON.stringify(accountObject),
          url: `${MONNIFY_BASE_URL}/bank-transfer/reserved-accounts`,
        };
  
        axios(option)
          .then((response) => {
            resolve(response.data);
          })
          .catch((ex) => {
            console.log({ ex });
            reject(ex);
          });
      });
    } catch (error) {
      throw new InternalServerError(error.message);
    }
  },

};
