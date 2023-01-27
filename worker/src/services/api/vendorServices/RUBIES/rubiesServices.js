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
            console.log({ 
              error
            });
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
   * verifyRubiesTransactions
   * @param {Object} requestData 
   */
  async verifyRubiesTransactions(requestData) {
    try {
      const options = {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          Authorization: RUBIES_LIVE_SK,
        },
        data: JSON.stringify(requestData),
        url: `${RUBIES_LIVE_URL}/transactionquery`,
      };

      return new Promise((resolve, reject) => {
        axios(options)
          .then((response) => {
            resolve(response.data);
          })
          .catch((error) => {
            console.log({ 
              error
            });
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
  }
}

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