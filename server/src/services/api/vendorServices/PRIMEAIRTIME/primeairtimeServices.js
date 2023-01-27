import axios from 'axios';
import { PRIME_AIRTIME_PASSWORD, PRIME_AIRTIME_USERNAME, PRIME_AIRTIME_URL } from '../../../../config/env';
import { InternalServerError } from '../../../../utils/errors';
import { appLogger } from '../../../../setup/logging';

axios.defaults.timeout = 60 * 1000;

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
      appLogger.log('error', {
        stack: error.stack,
        message: `API_SERVICE_PRIMEAIRTIME_AUTHORIZE: ${error.message}`,
      });
      throw new InternalServerError(error.message);
    }
  },

  /**
   * purchasePrimeService
   * @param {*} requestData
   * @public
   */
  async purchaseAirtimePrimeService(requestData, mobileNumber, platformToken) {
    try {
      const options = {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          Authorization: `Bearer ${platformToken}`,
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
                error: ex,
                status: 402,
              });
            } else {
              resolve({
                message: 'Service unreachable, please try again',
                error: ex,
                status: 500,
              });
            }
          });
      });
    } catch (error) {
      appLogger.log('error', {
        stack: error.stack,
        message: `API_SERVICE_PRIMEAIRTIME_purchaseAirtimePrimeService: ${error.message}`,
      });
      throw new InternalServerError(error.message);
    }
  },

  /**
   * verifyPrimeairtimeTransaction
   * @param {*} transactionRef
   * @description - resolve transaction
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
            if (ex.response.status === 404 || ex.response.status === 400) {
              resolve({
                message: 'Transaction not found',
                error: ex,
                status: 400,
              });
            }
  
            resolve({ // todo: log error
              message: 'Service unreachable, please try again',
              error: ex,
              status: 500,
            });
          });
      });
    } catch (error) {
      appLogger.log('error', {
        stack: error.stack,
        message: `API_SERVICE_PRIMEAIRTIME_VERIFY_TRANSACTION: ${error.message}`,
      });
      throw new InternalServerError(error.message);
    }
  },

  /**
   * verifyPrimeairtimeService
   * @param {*} verifyObject
   * @description - validate smart card/meter number
   */
  async verifyPrimeairtimeService(account, verifyObject) {
    try {
      return new Promise((resolve, reject) => {
        const option = {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            Authorization: `Bearer ${verifyObject.platformToken}`,
          },
          data: JSON.stringify(account),
          url: `${PRIME_AIRTIME_URL}/billpay/${verifyObject.product}/${verifyObject.productId}/validate`,
        };

        axios(option)
          .then((response) => {
            resolve(response);
          })
          .catch((ex) => { // todo - log API error
            if (ex.response.status === 404 || ex.response.status === 400) {
              resolve({
                message: 'Not Found: Wrong card number supplied',
                error: ex,
                status: 400,
              });
            }
  
            resolve({
              message: 'Service unreachable, please try again',
              error: ex,
              status: 500,
            });
          });
      });
    } catch (error) {
      appLogger.log('error', {
        stack: error.stack,
        message: `API_SERVICE_PRIMEAIRTIME_VERIFY_SERVICES: ${error.message}`,
      });
      throw new InternalServerError(error.message);
    }
  },

  /**
   * topupPrimeairtimeElectricity
   * @param {*} requestData
   * @param {*} platformToken
   */
  async topupPrimeairtimeElectricity(requestData, platformToken) {
    try {
      const options = {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          Authorization: `Bearer ${platformToken}`,
        },
        data: JSON.stringify(requestData),
        url: `${PRIME_AIRTIME_URL}/billpay/electricity/${requestData.meter}`,
      };
      return new Promise((resolve, reject) => {
        axios(options)
          .then((response) => {
            resolve(response.data);
          })
          .catch((ex) => { // todo - log to admin that token primeairtime failed  
            if (ex.status === 402) { // todo: log admin low balance
              resolve({
                message: 'Service unreachable, please contact support',
                error: ex,
                status: 402,
              });
            } else {
              resolve({
                message: 'Service unreachable, please try again',
                error: ex,
                status: 500,
              });
            }
          });
      });
    } catch (error) {
      appLogger.log('error', {
        stack: error.stack,
        message: `API_SERVICE_PRIMEAIRTIME_TOPUP_ELECTRICITY: ${error.message}`,
      });
      throw new InternalServerError(error.message);
    }
  },

  /**
   * topupPrimeairtimeData
   * @param {*} requestData
   * @param {*} mobileNumber
   * @param {*} platformToken
   */
  async topupPrimeairtimeData(requestData, mobileNumber, platformToken) {
    try {
      const options = {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          Authorization: `Bearer ${platformToken}`,
        },
        data: JSON.stringify(requestData),
        url: `${PRIME_AIRTIME_URL}/datatopup/exec/${mobileNumber}`,
      };

      return new Promise((resolve, reject) => {
        axios(options)
          .then((response) => {
            resolve(response.data);
          })
          .catch((ex) => { // todo - log to admin that token primeairtime failed  
            if (ex.status === 402) { // todo: log admin low balance
              resolve({
                message: 'Service unreachable, please contact support',
                error: ex,
                status: 402,
              });
            } else {
              resolve({
                message: 'Service unreachable, please try again',
                error: ex,
                status: 500,
              });
            }
            // resolve(false);
          });
      });
    } catch (error) {
      appLogger.log('error', {
        stack: error.stack,
        message: `API_SERVICE_PRIMEAIRTIME_TOPUP_DATA: ${error.message}`,
      });
      throw new InternalServerError(error.message);
    }
  },

  /**
   * topup Primeairtime Multichoice
   * @param {object} requestData
   * @param {string} service
   * @param {string} sku
   * @param {string} variation_code
   * @param {string} platformToken
   */
  // api/billpay/dstv/BPD-NGCA-AQA/FTAE36
  async topupPrimeairtimeMultichoice(requestData, service, sku, variation_code, platformToken) {
    try {
      let url = variation_code && variation_code.length > 2 ? `${PRIME_AIRTIME_URL}/billpay/${service}/${sku}/${variation_code}` : `${PRIME_AIRTIME_URL}/billpay/${service}/${sku}`;
      const options = {
        method: 'POST',
        // timeout: 100,
        headers: {
          'content-type': 'application/json',
          Authorization: `Bearer ${platformToken}`,
        },
        data: JSON.stringify(requestData),
        url,
      };

      return new Promise((resolve, reject) => {
        axios(options)
          .then((response) => {
            resolve(response.data);
          })
          .catch((ex) => { // todo - log to admin that token primeairtime failed  
            if (ex.status === 402) { // todo: log admin low balance
              resolve({
                message: 'Service unreachable, please contact support',
                error: ex,
                status: 402,
              });
            } else {
              resolve({
                message: 'Service unreachable, please try again',
                error: ex,
                status: 500,
              });
            }
          });
      });
    } catch (error) {
      appLogger.log('error', {
        stack: error.stack,
        message: `API_SERVICE_PRIMEAIRTIME_TOPUP_MULTICHOICE: ${error.message}`,
      });
      throw new InternalServerError(error.message);
    }
  },

  /**
   * get Primeairtime Data Variation
   * @param {*} platformToken
   * @param {*} msisdn
   */
  async getPrimeairtimeDataVariation(platformToken, msisdn) {
    try {
      const options = {
        method: 'GET',
        headers: {
          'content-type': 'application/json',
          Authorization: `Bearer ${platformToken}`,
        },
        url: `${PRIME_AIRTIME_URL}/datatopup/info/${msisdn}`,
      };
      return new Promise((resolve, reject) => {
        axios(options)
          .then((response) => {
            resolve(response.data);
          })
          .catch((ex) => { // todo - log to admin that token primeairtime failed
            console.log({ error: ex });
            resolve(false);
          });
      });
    } catch (error) {
      appLogger.log('error', {
        stack: error.stack,
        message: `API_SERVICE_PRIMEAIRTIME_VARIATION: ${error.message}`,
      });
      throw new InternalServerError(error.message);
    }
  },

  /**
   * get Primeairtime Multichoice Variation
   * @param {*} service
   * @param {*} sku
   * @param {*} platformToken
   */
  async getPrimeairtimeMultichoiceVariation(service, sku, platformToken) {
    try {
      const options = {
        method: 'GET',
        headers: {
          'content-type': 'application/json',
          Authorization: `Bearer ${platformToken}`,
        },
        url: `${PRIME_AIRTIME_URL}/billpay/${service}/${sku}`,
      };

      return new Promise((resolve, reject) => {
        axios(options)
          .then((response) => {
            resolve(response.data);
          })
          .catch((ex) => { // todo - log to admin that token primeairtime failed
            resolve(false);
          });
      });
    } catch (error) {
      appLogger.log('error', {
        stack: error.stack,
        message: `API_SERVICE_PRIMEAIRTIME_MULTICHOICE_VARIATION: ${error.message}`,
      });
      throw new InternalServerError(error.message);
    }
  },

  /**
   * transferWithPrimeAirtime
   * @param {string} sortCode
   * @param {string} accountNumber
   * @param {object} requestData
   * @param {string} platformToken
   */
  // /ft/transfer/000013/0214614720
  async transferWithPrimeAirtime(sortCode, accountNumber, requestData, platformToken) {
    try {
      const options = {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          Authorization: `Bearer ${platformToken}`,
        },
        data: JSON.stringify(requestData),
        url: `${PRIME_AIRTIME_URL}/ft/transfer/${sortCode}/${accountNumber}`,
      };

      return new Promise((resolve, reject) => {
        axios(options)
          .then((response) => {
            resolve(response.data);
          })
          .catch((ex) => { // todo - log to admin that token primeairtime failed
            if (ex.status === 402) { // todo: log admin low balance
              resolve({
                message: 'Service unreachable, please contact support',
                error: ex,
                status: 402,
              });
            } else {
              resolve({
                message: 'Service unreachable, please try again',
                error: ex,
                status: 500,
              });
            }
          });
      });
    } catch (error) {
      appLogger.log('error', {
        stack: error.stack,
        message: `API_SERVICE_PRIMEAIRTIME_TRANSFER: ${error.message}`,
      });
      throw new InternalServerError(error.message);
    }
  },

  /**
   * verifyBankPrimeAirtime
   * @param {*} sortCode 
   * @param {*} accountNumber 
   * @param {*} requestData 
   * @param {*} platformToken 
   */
  // {{url}}/ft/lookup/100002/3285592477
  // {
  //   "target_accountNumber": "3285592477",
  //   "target_accountName": "Anthony Dibie",
  //   "target_bankCode": "100002",
  //   "target_bankName": "Paga",
  //   "transaction_fee": "20.00",
  //   "transaction_currency": "NGN",
  //   "destination_currency": "NGN",
  //   "rate": 1
  // }
  async verifyBankPrimeAirtime({ sortCode, accountNumber, platformToken }) {
    try {
      const options = {
        method: 'GET',
        headers: {
          'content-type': 'application/json',
          Authorization: `Bearer ${platformToken}`,
        },
        url: `${PRIME_AIRTIME_URL}/ft/lookup/${sortCode}/${accountNumber}`,
      };

      return new Promise((resolve, reject) => {
        axios(options)
          .then((response) => {
            resolve(response.data);
          })
          .catch((ex) => {
            // console.log({ ex: ex.response.data });
            if (ex.status === 404) { // todo: log admin low balance
              resolve({
                message: 'Bank details not found, check account number',
                error: ex,
                status: 404,
              });
            } else {
              resolve({
                message: 'Service unreachable, please try again',
                error: ex,
                status: 500,
              });
            }
          });
      });
    } catch (error) {
      throw new InternalServerError(error.message);
    }
  },
};



// '{
//   "_id": "5f614986e6880958e95da675",
//   "updatedAt": "2020-09-15T23:08:54.769Z",
//   "createdAt": "2020-09-15T23:08:54.769Z",
//   "exec_agent": "axios/0.19.2",
//   "exec_ip": "35.180.213.142",
//   "exec_by": "5e53e5bee0114179b6160846",
//   "test": false,
//   "operator_reference": "6d3fb700-f7a8-11ea-904f-a787f3ca612d",
//   "client_apireqbody": "{\\"amount\\":3000,\\"customer_reference\\":\\"FYBA|e1ff0|2020|9|16|00\\"}",
//   "app_host": "gra13",
//   "type": "ft",
//   "channel": "api",
//   "operator_name": "Bank Transfer",
//   "country": "Nigeria",
//   "customer_reference": "5e53e2e7885f503e0865c49c#FYBA|e1ff0|2020|9|16|00",
//   "paid_currency": "NGN",
//   "paid_amount": 3020,
//   "topup_currency": "NGN",
//   "topup_amount": 3000,
//   "target": "000013/0595231730",
//   "txkey": "2091608540139103",
//   "state": "init",
//   "wh_com": 20,
//   "re_com": 0,
//   "ag_com": 20,
//   "wholesaler": "586d78cfb77466275ba0bd2d",
//   "account": "5e53e2e7885f503e0865c49c",
//   "product_id": "FT-OUB-000013",
//   "__v": 0,
//   "custom_details": [],
//   "related_transactions": [
//       "5f614986e6880958e95da674"
//   ],
//   "time": "2020-09-15T23:08:54.768Z"
// }'


// {
//   "_id": "5f6249f13e2db6747d0a8f2a",
//   "updatedAt": "2020-09-16T17:23:04.654Z",
//   "createdAt": "2020-09-16T17:22:57.676Z",
//   "exec_agent": "axios/0.19.2",
//   "exec_ip": "35.180.213.142",
//   "exec_by": "5e53e5bee0114179b6160846",
//   "test": false,
//   "operator_reference": "43786db0-f841-11ea-9420-5fc250fb9ba0",
//   "client_apireqbody": "{\"amount\":50,\"customer_reference\":\"FYBA|6db5c|2020|9|16|18\"}",
//   "app_host": "gra17",
//   "type": "ft",
//   "channel": "api",
//   "operator_name": "GTBank Plc",
//   "country": "Nigeria",
//   "customer_reference": "5e53e2e7885f503e0865c49c#FYBA|6db5c|2020|9|16|18",
//   "paid_currency": "NGN",
//   "paid_amount": 70,
//   "topup_currency": "NGN",
//   "topup_amount": 50,
//   "target": "000013/0214614720",
//   "txkey": "209161822560177485",
//   "state": "fin",
//   "wh_com": 20,
//   "re_com": 0,
//   "ag_com": 20,
//   "wholesaler": "586d78cfb77466275ba0bd2d",
//   "account": "5e53e2e7885f503e0865c49c",
//   "product_id": "FT-OUB-000013",
//   "__v": 1,


//   "api_transactionid": "000023200916182257005012309065",
// //   "client_apiresponse": "{\"status\":201,\"message\":\"Operation Successful, Transfer completed, Reference : 43786db0-f841-11ea-9420-5fc250fb9ba0\",\"code\":\"RECHARGE_COMPLETE\",\"reference\":\"43786db0-f841-11ea-9420-5fc250fb9ba0\",\"reference_url\":\"https://clients.primeairtime.com/api/topup/log/byref/43786db0-f841-11ea-9420-5fc250fb9ba0\",\"paid_amount\":70,\"paid_currency\":\"NGN\",\"topup_amount\":50,\"topup_currency\":\"NGN\",\"target\":\"000013/0214614720\",\"product_id\":\"FT-OUB-000013\",\"time\":\"2020-09-16T17:23:04.635Z\",\"country\":\"Nigeria\",\"api_transactionid\":\"000023200916182257005012309065\",\"completed_in\":7738,\"success\":true,\"operator_name\":\"GTBank Plc\",\"customer_reference\":\"FYBA|6db5c|2020|9|16|18\",\"custom_details\":{\"accountName\":\"AZEMOH PAUL DAVID\",\"accountNumber\":\"0214614720\",\"bankName\":\"GTBank Plc\",\"bankCode\":\"000013\",\"reference\":\"000023200916182257005012309065\",\"amount\":50,\"currency\":\"NGN\",\"fee_amount\":20,\"fee_currency\":\"NGN\",\"narration\":\"Rubeetech Global Entreprise Limited\"}}",
//   "code": "RECHARGE_COMPLETE",
//   "completed_in": 7738,
//   "message": "Operation Successful, Transfer completed, Reference : 43786db0-f841-11ea-9420-5fc250fb9ba0",
//   "success": true,


//   "custom_details": [
//       {
//           "narration": "Rubeetech Global Entreprise Limited",
//           "fee_currency": "NGN",
//           "fee_amount": 20,
//           "currency": "NGN",
//           "amount": 50,
//           "reference": "000023200916182257005012309065",
//           "bankCode": "000013",
//           "bankName": "GTBank Plc",
//           "accountNumber": "0214614720",
//           "accountName": "AZEMOH PAUL DAVID"
//       }
//   ],
//   "related_transactions": [
//       "5f6249f13e2db6747d0a8f29"
//   ],
//   "time": "2020-09-16T17:22:57.674Z"
// }