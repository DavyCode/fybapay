// @flow

import Joi from 'joi';

const fileValidator = async (request: any, response: any, next: any) => {
  let allowedSizeLimit = 50 * 1024;
  
  const schema = Joi.object().keys({
    file: Joi.any(),
  })

  try {
    await schema.validateAsync(request.body);
    
    if (request.files.file.size >= allowedSizeLimit) {
      return response
        .status(400)
        .json({ status: 'error', message: 'File size too large, add entries bellow 700' });
    }
  
    if (request.files.file.mimetype !== 'text/csv') {
      return response
        .status(400)
        .json({ status: 'error', message: 'File format not allowed' });
    }
    return next();
  }
  catch (err) {
    return response
      .status(400)
      .json({ status: 'error', message: `${err.details[0].message}. Provide \"file\" as key name` });
  }
};

export {
  fileValidator
}