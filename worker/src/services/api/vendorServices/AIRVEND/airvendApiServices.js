import axios from 'axios';
import {
  VEND_HASH,
  VEND_HOST,
  VEND_PASSWORD,
  VEND_USERNAME,
} from '../../../../config/env';
import { InternalServerError } from '../../../../utils/errors';
import Pubsub from '../../../../events/systemLogListener';

export default {
  /**
   * Vend service
   * @param {object} vendObject
   */
  async vendServices (vendObject) {
    try {
      return new Promise((resolve, reject) => {
        const option = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            username: VEND_USERNAME,
            password: VEND_PASSWORD,
            hash: VEND_HASH,
          },
          url: `${VEND_HOST}/secured/seamless/vend/`,
          data: JSON.stringify({ details: vendObject }),
        };
  
        axios(option)
          .then((response) => {
            resolve(response.data);
          })
          .catch((ex) => {
            let apiError = ex.response ? ex.response.data : false;
            let code = apiError ? ex.response.data.confirmationCode : false;
            if (apiError) {
              if (ex.status === 402 || code && code === 402) { // todo - notify admin balance is low
                resolve({
                  message: ex.response ? ex.response.data.details.message : 'Service unreachable, please contact support',
                  error: ex.response.data,
                  confirmationCode: 402,
                });
              }
              else {
                resolve({
                  message: 'Service unreachable, please try again',
                  error: ex.response ? ex.response.data: ex,
                  confirmationCode: code ? code: 500
                });
              }
            }
            else {
              resolve({ 
                message: ex.message || 'Service unreachable, please try again',
                error: ex,
                confirmationCode: code ? code : 500,
              });
            }
          });
      });
    } catch (error) {
      throw new InternalServerError(error.message);
    }
  },

  /**
   * Verify user service account
   * @param {object} vendObject
   */
  async verifyAirvendService (vendObject) {
    try {
      return new Promise((resolve, reject) => {
        const option = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            username: VEND_USERNAME,
            password: VEND_PASSWORD,
            hash: VEND_HASH,
          },
          url: `${VEND_HOST}/secured/seamless/verify/`,
          data: JSON.stringify({ details: vendObject }),
        };
  
        axios(option)
          .then((response) => {
            resolve(response.data);
          })
          .catch((ex) => {
            // todo - log API error
            console.log({ ex: ex.response.data, exx: ex });
            const error = new Error('Could not verify, check account or try again later');
            reject(error);
          });
      });
    } catch (error) {
      throw new InternalServerError(error.message);
    }
  },

  /**
   * Get Airvend Variation
   * @param {object} params
   * @private
   */
  async getAirvendVariation (params) {
    try {
      const option = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          username: VEND_USERNAME,
          password: VEND_PASSWORD,
          hash: VEND_HASH,
        },
        url: `${VEND_HOST}/secured/seamless/products/`,
        data: JSON.stringify(params),
      };
      return new Promise((resolve, reject) => {
        axios(option)
          .then((response) => {
            resolve(response.data);
          })
          .catch((ex) => {
            let apiErrorMessage = ex.response ? ex.response.data.details.message : ex.message
            let error = new InternalServerError('Could not retrieve variation, try again later or contact support');
            Pubsub.emit('api_error', {ex, apiErrorMessage, systemError: error, source: 'getAirvendVariation', service: 'AIRVEND'});
            reject(error);
          });
      });
    } catch (error) {
      throw new InternalServerError(error.message);
    }
  },

};
