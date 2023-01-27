// using SendGrid's v3 Node.js Library
// https://github.com/sendgrid/sendgrid-nodejs

import sgMail from '@sendgrid/mail';
import Email from 'email-templates';
import path from 'path';
import Promise from 'bluebird';
import previewEmail from 'preview-email';
import { SENDGRIDAPIKEY, MAILER_FROM_OPTION } from '../config/env';

sgMail.setApiKey(SENDGRIDAPIKEY);

export default (mailObject) => {
  const { email, templateName } = mailObject;
  
  return new Promise((resolve, reject) => {
    loadTemplate(templateName, mailObject).then((result) => {
      const { subject, html, text } = result;

      const msg = {
        to: email,
        from: `${MAILER_FROM_OPTION}`, // TODO : switch this email base on the template name
        subject,
        text,
        html,
      };

      sgMail.send(msg, (err, res) => {
        if (err) {
          console.log({ ERRRRRROR: JSON.stringify(err.response.body) });
          console.log('ERROR using sendgrid', err.message, err);
          return reject(err);
        } else {
          console.log('IT worked');
          return resolve(res);
        }
      });
    })
      .catch((e) => {
        console.log('Couldnt load email template', e.message);
      });

      
  });
};

const loadTemplate = (templateName, context) => {
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
};
