// @flow

import axios from 'axios';
import { PAYSTACK_SECRET_KEY, PAYSTACK_API_URL } from '../../config/env';
import { InternalServerError, BadRequestError } from '../../utils/errors'

export default {
  async verifyBankDetails(bankAccountNumber: string, bankCode: string) {
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
  },
  
  /**
   * resolveBvn
   * @public
   */
  async resolveBvn(bvn: string) {
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
          console.log({ response: response.data });
          resolve(response.data.data);
        })
        .catch(error => {
          console.log({error})
          if (error.code === 'ETIMEDOUT') { 
            // throw new InternalServerError('Something went wrong, try later')
            resolve({ error: error.message, statusCode: 500 });
          }
          if (error.response && error.response.status == 400) {
            resolve({
              error: 'Wrong bvn supplied',
              statusCode: 400
            })
            return
          }
          resolve({
            error: 'Something went wrong', //'Could not verify bank account at this time',
            statusCode: 500
          })
          // reject(error);
          /**
           * @todo - notify admin
           */
        });
    });
  }
  
}

// export const getCardBankIdentificationNumber = async bin => {
//   return await axios.get(`${PAYSTACK_API_URL}/decision/bin/${bin}`);
// };