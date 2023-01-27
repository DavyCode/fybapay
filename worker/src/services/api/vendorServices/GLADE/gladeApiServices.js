import axios from 'axios';
import { GLADE_ENDPOINT, GLADE_MERCHANT_ID, GLADE_MERCHANT_KEY } from '../../../../config/env';
import { InternalServerError } from '../../../../utils/errors';
import Pubsub from '../../../../events/systemLogListener';


/**
 * Money Transfer
 * In order to transfer the money, you must have a funded wallet which funds will be deducted from to disburse to any account of your choice.
 * Endpoint: https://demo.api.gladepay.com/disburse
 * 
 */

  // {
  //   "status": 200,
  //   "txnStatus": "successful",
  //   "txnRef": "GP|FD|79620068|20200224M",
  //   "message": "Transaction Successful"
  // }

export default {

  /**
   * Glade Pay Disburse
   * @param {} withdrawObject
   */
  async gladePayDisburse(withdrawObject) {
    try {
      const option = {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          mid: GLADE_MERCHANT_ID,
          key: GLADE_MERCHANT_KEY,
        },
        url: `${GLADE_ENDPOINT}/disburse`,
        data: JSON.stringify(withdrawObject),
      };

      return new Promise((resolve, reject) => {
        axios(option)
          .then((response) => {
            resolve(response.data);
          })
          .catch((ex) => {
            let apiErrorMessage = ex.response ? ex.response.data : ex.message
            let error = new InternalServerError('Could not disburse gladePay, try again later or contact support');
            Pubsub.emit('api_error', { ex, apiErrorMessage, systemError: error, source: 'gladePayDisburse', service: 'GLADEPAY'});
  
            if (ex.status === 301) {
              resolve({
                message: 'Failed, please contact support',
                error: ex,
                status: 301,
              });
            }
            else {
              resolve({
                message: ex.message || 'Failed, please try again',
                error: ex,
                status: 400,
              });
            }
          });
      });
    } catch (error) {
      throw new InternalServerError(error.message);
    }
  },

  /**
   * Bulk transfers
   */
  // {
  //   "action":"transfer",
  //   "type": "bulk",
  //   "data": [
  //     {
  //         "amount": "100",
  //         "bankcode":"058", 
  //         "accountnumber":"0040000008",
  //         "sender_name": "John Doe",
  //         "narration": "",
  //         "orderRef": "TX00001"
  //     },{
  //         "amount": "100",
  //         "bankcode":"058", 
  //         "accountnumber":"0040000009",
  //         "sender_name": "John Doe",
  //         "narration": "",
  //         "orderRef": "TX00002"
  //     }
  //   ]
  // }

  // NOTE - After bulk transfers you will need to re-query the order reference of each order to verify the status of the transaction.
  async gladePayDisburseBulk() {
  },

  /**
   * The transaction can be verified by passing the payload with the order reference of the transfer
   * Note - txnStatus determines the status of the transaction if it is successful, failed, pending or processing
   */

  // {
  //   "action":"verify",
  //   "txnRef":{"TX00002" the client trx ref not glade}
  // }
  
  // Response
  // {
  //   "status": 200,
  //   "txnStatus": "successful",
  //   "message": "Transfer Successful"
  // }

  // async gladePayResolvePaymentStatus(verifyObject) {
  //   const option = {
  //     method: 'PUT',
  //     headers: {
  //       'Content-Type': 'application/json',
  //       mid: GLADE_MERCHANT_ID,
  //       key: GLADE_MERCHANT_KEY
  //     },
  //     url: `${GLADE_ENDPOINT}/disburse`,
  //     data: JSON.stringify(verifyObject)
  //   };

  //   return new Promise((resolve, reject) => {  
  //     axios(option)
  //       .then(response => { resolve(response.data) })
  //       .catch(ex => {
  //         console.log({ex})
  //         let apiErrorMessage = ex.response ? ex.response.data : ex.message
  //         let error = new InternalServerError('Could not disburse gladePay, try again later or contact support');
  //         Pubsub.emit('api_error', {ex, apiErrorMessage, systemError: error, source: 'gladePayDisburse', service: 'GLADEPAY'});

  //         if (ex.status === 301) {
  //           resolve({
  //             message: 'Failed, please contact support',
  //             error: ex,
  //             confirmationCode:  301
  //           })
  //         }
  //         else {
  //           resolve({ 
  //             message: ex.message || 'Failed, please try again',
  //             error: ex,
  //             confirmationCode: 400
  //           })
  //         }
  //       });
  //   });
  // },

  /**
   *  WebHooks
   * When a transaction is completed a POST HTTP request is sent to the URL that has been setup on the dashboard as a JSON request.
   * Valid events are raised with a header gladepay-hash which is essentially an MD5 hash of the event payload and the merchant key. $hash = hash('sha512', $payload.$key); A sample response from the webhook
   */

  // {
  //   "status": 200,
  //   "txnStatus": "successful",
  //   "txnRef": "GPP99318721920190628Q",
  //   "chargedAmount": "63.00",
  //   "paymentMethod": "card",
  //   "endpoint": "stage"
  // }
  async gladePayWebhook() {}
};
