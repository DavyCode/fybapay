// @flow
import status from 'http-status';
import AWS from 'aws-sdk';
import { User } from '../models';
import { BadRequestError, InternalServerError, APIError, NotFoundError, ForbiddenError, NotAcceptableError } from '../utils/errors';
import UploadRepository from '../repository/UploadRepository';
import { buildResponse, genUniqueId } from '../utils';
// import {
//   AWS_ACCESS_KEY_ID,
//   AWS_SECRET_ACCESS_KEY,
//   AWS_BUCKET_REGION,
//   AWS_BUCKET
// } from "../config/env";

const { OK, NOT_ACCEPTABLE } = status;

// const s3 = new AWS.S3({
//   accessKeyId: AWS_ACCESS_KEY_ID,
//   secretAccessKey: AWS_SECRET_ACCESS_KEY,
//   region: AWS_BUCKET_REGION
// });

export default {
  /**
  * GET PRESIGNED URL FOR FILE UPLOAD
  * Aws presigned url gives generates a signed url for the client, with the upload definition
  * @todo : validate category, extension & ContentType to match accepted uploads format
  */
  async getPresignedUrl(id: string, params: { category: string, ext: string, type: string, name: string }) {
    const { category, ext, type, name } = params;
    //:: category/user_id/:id/id.ext {category: "bank_statement"}
    const key = `${id}/${category}/${genUniqueId()}.${ext}`; // 5bda0157c7701a00135ed228/profile_photo/82943170-1e39-11e9-bee0-e349aaf943bd.png

    // const uploadParams = {
    //   Bucket: AWS_BUCKET,
    //   Key: key,
    //   ContentType: type // image/jpeg image/png
    // };

    // const signedUrl = await s3.getSignedUrl("putObject", uploadParams);

    // if (!signedUrl) { throw new NotAcceptableError('Could not generate s3 presigned url, make sure you\'re uploading the right file') }
    // buildResponse({ data: { key, url: signedUrl } });

    return buildResponse({});
  },

  /**
   * Save Upload
   * updateUserUploads 
  */
  async updateUserUploads(request) {
    const { key, category } = request.body;

    const update = { 
      [`${category}`]: key, // profileImage, utilityBill, idCard, 
      'meta.updatedAt': Date.now(),
    };

    const upload = await UploadRepository.insert({ _id: request.user.id }, {
       $set: update,
    }, { new: true, upsert: true });

    return buildResponse({ data: upload, message: 'Upload successful' });
  },

  /**
   * updateUploadsIssues
   * @param {*} request
   * @description - NOT IN USE
   */
  async updateUploadsIssues(params: { key: string, category: string, issueId: string }) {
    const { category, key, issueId } = params
    const update = { 
      [`${params.category}`]: params.key, // receipt, 
      'meta.updatedAt': Date.now(),
    };

    const upload = await UploadRepository.insert({ _id: id }, {
       $set: update
    }, { new: true, upsert: true });

    return upload;
  },
};
