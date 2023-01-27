
import Email from 'email-templates';
import path from 'path';
import Promise from 'bluebird';
import previewEmail from 'preview-email';
import AWS from 'aws-sdk';
import {
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_BUCKET_REGION,
  AWS_SES_CONFIG_SET,
  MAILER_FROM_OPTION,

  LOGS_MAIL,
} from '../config/env';

AWS.config.update({
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
  region: AWS_BUCKET_REGION,
});

const ses = new AWS.SES(
  // { apiVersion: '2010-12-01' }
);

// https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/ses-examples-sending-email.html
// https://docs.aws.amazon.com/ses/latest/DeveloperGuide/examples-send-using-sdk.html
export default (mailObject) => {
  try {
    const { email, templateName } = mailObject;

    return new Promise((resolve, reject) => {
      loadTemplate(templateName, mailObject).then((result) => {
        const { subject, html, text } = result;

        const params = {
          Destination: {
            ToAddresses: [email], // Email address/addresses that you want to send your email
            CcAddresses: [
              LOGS_MAIL,
              /* more items */
            ],
          },
          ConfigurationSetName: AWS_SES_CONFIG_SET,
          Message: {
            Body: {
              Html: {
                // HTML Format of the email
                Charset: 'UTF-8',
                Data: html,
              },
              Text: {
                Charset: 'UTF-8',
                Data: text,
              },
            },
            Subject: {
              Charset: 'UTF-8',
              Data: subject,
            },
          },
          Source: MAILER_FROM_OPTION,
          ReplyToAddresses: [/* more items */],
        };

        try {
          const sendEmail = ses.sendEmail(params).promise();
          sendEmail
            .then((data) => {
              console.log('email submitted to SES');
              return resolve(data);
            })
            .catch((error) => {
              console.log('message did not deliver', error);
              return reject(error);
            });
        } catch (error) {
          console.log('could not deliver message', error);
          return reject(error);
        }
      });
    });
  } catch (error) {
    console.log('MAILER_AWS', error.message);
  }
};

const loadTemplate = (templateName, context) => {
  try {
    const dir = path.resolve(__dirname, '../../email-templates', templateName);
    const email = new Email({
      views: {
        options: {
          extension: 'ejs', // <---- HERE template engine
        },
      },
    });
    return new Promise((resolve, reject) => {
      email
        .renderAll(dir, {
          // name: context.name,
          // link: context.link,
          ...context,
        })
        .then((template) => {
          previewEmail(template).then(console.log).catch(console.error); //preview email in browser, comment in production
          resolve(template);
        })
        .catch((err) => {
          console.log(err.message);
          reject(err);
        });
    });
  } catch (error) {
    console.log('ERROR_loadTemplate', error.message);
  }
};
