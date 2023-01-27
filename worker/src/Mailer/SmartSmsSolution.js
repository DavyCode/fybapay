import axios from 'axios';
import { SMART_SMS_TOKEN, SMART_SMS_URL } from '../config/env';

const baseurl = SMART_SMS_URL;

export default ({ message, phone }) => {
  const payload = {
    'sender': 'Fybapay',
    'to': phone,
    'message': message,
    'type': '0',
    'routing': '2',
    'token': SMART_SMS_TOKEN,
    'schedule': '',
  };

  return new Promise((resolve, reject) => {
    const option = {
      method: 'POST',
      // headers: {
      //   'content-type': 'application/json'
      // },
      url: `${baseurl}`,
      data: payload,
      params: payload,
    };

    axios(option)
      .then((response) => {
        resolve(response);
      })
      .catch((ex) => {
        console.log({ ex });
        reject(ex);
      });
  });
};
