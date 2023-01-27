import axios from 'axios';
import { PRIME_AIRTIME_PASSWORD, PRIME_AIRTIME_USERNAME, PRIME_AIRTIME_URL } from '../../../../config/env';
import { InternalServerError } from '../../../../utils/errors';

export default {
  /**
   * Get primeairtime token
   * @public
   */
  async authorizePrimeairtime() {
    try {
      const credentials = {
        username: PRIME_AIRTIME_USERNAME,
        password: PRIME_AIRTIME_PASSWORD,
      };

      const options = {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        data: JSON.stringify(credentials),
        url: `${PRIME_AIRTIME_URL}/auth`,
      };
      return new Promise((resolve, reject) => {
        axios(options)
          .then((response) => {
            resolve(response.data);
          })
          .catch((error) => {
            resolve(false);
          });
      });
    } catch (error) {
      throw new InternalServerError(error.message);
    }
  },

  /**
   * purchasePrimeService
   * @param {*} requestData
   * @public
   */
  async purchasePrimeService(requestData, mobileNumber, platformToken) {
    try {
      const options = {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'Authorization': `Bearer ${platformToken}`
        },
        data: JSON.stringify(requestData),
        url: `${PRIME_AIRTIME_URL}/topup/exec/${mobileNumber}`,
      };
      return new Promise((resolve, reject) => {
        axios(options)
          .then((response) => {
            resolve(response.data);
          })
          .catch((ex) => {
            if (ex.status === 402) { // todo: log admin low balance
              resolve({
                message: 'Service unreachable, please contact support',
                error: ex.response.data || {},
                status: 402,
              });
            } else {
              resolve({
                message: 'Service unreachable, please try again',
                error: ex.response ? ex.response.data : ex,
                status: 500,
              });
            }
            // resolve(false);
          });
      });
    } catch (error) {
      throw new InternalServerError(error.message);
    }
  },

  /**
   * verifyPrimeairtimeTransaction
   * @param {*} transactionRef
   */
  async verifyPrimeairtimeTransaction(transactionRef, platformToken) {
    try {
      const options = {
        method: 'GET',
        headers: {
          'content-type': 'application/json',
          Authorization: `Bearer ${platformToken}`,
        },
        url: `${PRIME_AIRTIME_URL}/topup/log/byref/${transactionRef}`,
      };
      return new Promise((resolve, reject) => {
        axios(options)
          .then((response) => {
            resolve(response);
          })
          .catch((ex) => {
            if (ex.response) {
              if (ex.response.status === 404) {
                resolve({
                  message: 'Transaction not found',
                  error: ex.response.data || {},
                  status: 404,
                });
              }
            }

            resolve({ // todo: log error
              message: 'Service unreachable, please try again',
              error: ex.response ? ex.response.data : ex,
              status: 500,
            });
          });
      });
    } catch (error) {
      throw new InternalServerError(error.message);
    }
  },

};
