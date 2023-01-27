import axios from 'axios';
import {
  RUBIES_LIVE_SK,
  RUBIES_LIVE_URL,
  RUBIES_DR_ACCOUNTNAME,
} from '../../../../config/env';
import { InternalServerError } from '../../../../utils/errors';
import { appLogger } from '../../../../setup/logging';

axios.defaults.timeout = 60 * 1000;

export default {
  async verifyBankViaRubies(bankAccount, bankCode) {
    try {
      const options = {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          Authorization: RUBIES_LIVE_SK,
        },
        data: JSON.stringify({ accountnumber: bankAccount, bankcode: bankCode }),
        url: `${RUBIES_LIVE_URL}/nameenquiry`,
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
      appLogger.log('error', {
        stack: error.stack,
        message: `API_SERVICE_VERIFY_BANK_RUBIES: ${error.message}`,
      });

      throw new InternalServerError(error.message);
    }
  },

  /**
   * transferViaRubies
   * @param {Object} requestData - transfer request data
   */
  async transferViaRubies(requestData) {
    try {
      const options = {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          Authorization: RUBIES_LIVE_SK,
        },
        data: JSON.stringify(requestData),
        url: `${RUBIES_LIVE_URL}/fundtransfer`,
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
      appLogger.log('error', {
        stack: error.stack,
        message: `API_SERVICE_TRANSFER_RUBIES: ${error.message}`,
      });

      throw new InternalServerError(error.message);
    }
  },

  /**
   * resolveBvn
   * @param {*} bvn
   * @param {*} reference
   * @public
   */
  async resolveBvn(bvn: string, reference: string) {
    try {
      const options = {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          Authorization: RUBIES_LIVE_SK,
        },
        data: JSON.stringify({ bvn, reference }),
        url: `${RUBIES_LIVE_URL}/verifybvn`,
      };

      return new Promise((resolve, reject) => {
        axios(options)
          .then((response) => {
            resolve(response.data);
          })
          .catch((error) => {
            if (error.code === 'ETIMEDOUT') { 
              resolve({ 
                error: error.message,
                statusCode: 500
              });
              return
            }

            if (error.response && error.response.status == 400) {
              resolve({
                error: error.response.data ?  error.response.data.responsemessage : 'Please ensure BVN is correct', // 'Your balance is not enough to fulfill this request' // "Unable to retrieve details for BVN provided. Are you sure you entered the correct BVN?",
                statusCode: 400
              })
              return
            }

            resolve({
              error: 'Something went wrong. Contact Support', //'Could not verify BVN at this time',
              statusCode: 500
            })
          });
      });
    } catch (error) {
      appLogger.log('error', {
        stack: error.stack,
        message: `API_SERVICE_VERIFY_BVN_RUBIES: ${error.message}`,
      });

      throw new InternalServerError(error.message);
    }
  }
};


// resolve(
//   {
//     reference: '000085383FYBA|0ce19|2020|11|23|15',
//     responsedatetime: '2020-11-23 14:17:55.609',
//     responsecode: '-10',
//     responsemessage: 'PAYMENT REFERENCE HAS BEEN USED 000085383FYBA',
//     draccount: '3648121665',
//     craccount: '200400000022'
//   }
// )


// BVN SUCCESSFUL
// {
//   "responsedatetime": "2020-11-22 15:30:46.217",
//   "firstName": "RAMATU OKE",
//   "lastName": "SIYAKA.",
//   "responsecode": "00",
//   "phoneNumber": "08166337402",
//   "data": {
//       "firstName": "RAMATU OKE",
//       "lastName": "SIYAKA.",
//       "gender": "Female",
//       "dateOfBirth": "01-Feb-1992",
//       "middleName": "",
//       "bvn": "22384831689"
//   },
//   "base64Image": "/9j/4AAQSkZJRgABAgAAAQABAAD/

//   "responsemessage": "successful",
//   "bvn": "22384831689"
// }


// data: {
//   transactionstatus: 'Success',
//   responsecode: '00',
//   amount: 50,
//   nibssresponsemessage: 'Approved or completed successfully',
//   responsemessage: 'Success',
//   requestdatetime: '2020-11-13 12:43:33.027',
//   draccount: '3648121665',
//   sessionid: '090175201113124333111341565501',
//   craccount: '1002073062',
//   reference: 'FYBA|242ba|2020|11|13|13',
//   tcode: 'F02',
//   responsedatetime: '2020-11-13 12:43:35.813',
//   nibsscode: '00',
//   balance: '66.2500',
//   narration: 'Payment test',
//   customerid: '000085383',
//   craccountname: 'Azemoh David Paul',
//   bankname: 'Heritage Bank',
//   draccountname: 'PAYFRONTIER INTEGRATED SERVICES LIMITED',
//   bankcode: '000020',
//   username: '000085383'
// }

// INSUFFICIENT BAL
// data: {
//   transactionstatus: 'AccountDebitFailed',
//   responsecode: '32',
//   amount: 5000,
//   nibssresponsemessage: 'Error Processing Request (No Response) ',
//   responsemessage: 'AccountDebitFailed',
//   requestdatetime: '2020-11-13 12:51:27.954',
//   draccount: '3648121665',
//   sessionid: '090175201113125128111399553170',
//   craccount: '1002073062',
//   reference: 'FYBA|8ee9f|2020|11|13|13',
//   tcode: 'F02',
//   responsedatetime: '2020-11-13 12:51:29.673',
//   balance: '66.2500',
//   narration: 'Payment test',
//   customerid: '000085383',
//   craccountname: 'Azemoh David Paul',
//   bankname: 'Heritage Bank',
//   draccountname: 'PAYFRONTIER INTEGRATED SERVICES LIMITED',
//   bankcode: '000020',
//   username: '000085383'
// }

// BAD ACCT NUMBER
// data: {
//   transactionstatus: 'AccountNameValidationFailed',
//   responsecode: '36',
//   amount: 5000,
//   nibssresponsemessage: 'Invalid Account ',
//   responsemessage: 'AccountNameValidationFailed',
//   requestdatetime: '2020-11-13 12:54:29.405',
//   draccount: '3648121665',
//   sessionid: '090175201113125429111396766498',
//   craccount: '10020730AB',
//   reference: 'FYBA|1e730|2020|11|13|13',
//   tcode: 'F02',
//   responsedatetime: '2020-11-13 12:54:31.074',
//   nibsscode: '07',
//   narration: 'Payment test',
//   customerid: '000085383',
//   craccountname: 'Azemoh David Paul',
//   bankname: 'Heritage Bank',
//   draccountname: 'PAYFRONTIER INTEGRATED SERVICES LIMITED',
//   bankcode: '000020',
//   username: '000085383'
// }