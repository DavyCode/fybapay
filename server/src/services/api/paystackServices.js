// @flow

import axios from 'axios';
import { PAYSTACK_SECRET_KEY, PAYSTACK_API_URL } from '../../config/env';
import { InternalServerError, BadRequestError } from '../../utils/errors'

axios.defaults.timeout = 60 * 1000;

export default {
  /**
   * verifyBankDetails
   * @param {string} bankAccountNumber 
   * @param {string} bankCode 
   */
  async verifyBankDetails(bankAccountNumber: string, bankCode: string) {
    try {
      const options = {
        method: 'GET',
        headers: { 
          'content-type': 'application/json',
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`
        },
        url: `${PAYSTACK_API_URL}/bank/resolve?account_number=${bankAccountNumber}&bank_code=${bankCode}`
      };
  
      return new Promise((resolve, reject) => {
        axios(options)
          .then(response => {
            resolve(response.data.data);
          })
          .catch(error => {
            if (error.response.status == 422) {
              resolve({
                error: 'Wrong bank account supplied',
                statusCode: 422
              })
            }
            resolve({
              error: error.message,
              statusCode: 500
            })
          });
      });
    } catch (error) {
      throw new InternalServerError(error.message);
    }
  },
  
  /**
   * resolveBvn
   * @public
   */
  async resolveBvn(bvn: string) {    
    try {
      const options = {
        method: 'GET',
        headers: { 
          'content-type': 'application/json',
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`
        },
        url: `${PAYSTACK_API_URL}/bank/resolve_bvn/${bvn}`
      };

      return new Promise((resolve, reject) => {
        axios(options)
          .then(response => {
            resolve(response.data.data);
          })
          .catch(error => {
            if (error.code === 'ETIMEDOUT') { 
              resolve({ 
                error: error.message,
                statusCode: 500
              });
              return
            }

            if (error.response && error.response.status == 400) {
              let msg = 'Your balance is not enough to fulfill this request'
              
              if (error.response.data && error.response.data.message === msg) {
                resolve({
                  error: 'Balance Issue. Something went wrong, please contact support',
                  statusCode: 400
                })
              }

              resolve({
                error: error.response.data ?  error.response.data.message : 'Something went wrong', // 'Your balance is not enough to fulfill this request' // "Unable to retrieve details for BVN provided. Are you sure you entered the correct BVN?",
                statusCode: 400
              })
              return
            }

            resolve({
              error: 'Something went wrong', //'Could not verify bank account at this time',
              statusCode: 500
            })
            // TODO - MAIL ADMIN
            /**
             * @todo - notify admin
             */
          });
      });
    } catch (error) {
      throw new InternalServerError(error.message);
    }
  },
  
};

// {
//   BVN: '22384831689',
//   serviceType: 'BVN',
//   resolvedBvn: {
//     first_name: 'RAMATU OKE',
//     last_name: 'SIYAKA',
//     dob: '01-Feb-92',
//     formatted_dob: '1992-02-01',
//     mobile: '08166337402',
//     bvn: '22384831689'
//   }
// }

// export const getCardBankIdentificationNumber = async bin => {
//   return await axios.get(`${PAYSTACK_API_URL}/decision/bin/${bin}`);
// };