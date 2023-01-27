import axios from 'axios';
import {
  BULK_SMS_NG_URL,
  BULK_SMS_USERNAME,
  BULK_SMS_PASS,
  BULK_SMS_SENDER,
} from '../config/env';

const SMS_NG_URL = `${BULK_SMS_NG_URL}/?username=${BULK_SMS_USERNAME}&password=${BULK_SMS_PASS}&sender=${BULK_SMS_SENDER}`;

export default ({ message, phone }) => {
  const encodedMessage = encodeURIComponent(message);
  const encodedNumbers = encodeURIComponent(phone);

  const requestUrl = `${SMS_NG_URL}&message=${encodedMessage}&mobiles=${encodedNumbers}`;

  return new Promise((resolve, reject) => {
    const option = {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      url: `${requestUrl}`,
    };

    axios(option)
      .then((response) => {
        resolve(response);
      })
      .catch((ex) => {
        console.log({ BulkSendNg: ex });
        reject(ex);
      });
  });
};
