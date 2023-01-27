// @flow

import { Request, Response, NextFunction } from 'express';
import UploadService from '../services/UploadService'

export default {
  /**
  * GET AWS S3 PRESIGNED URL FOR FILE UPLOADs
  * Client tells server it needs to upload a file to S3.
  * includes file name, category (idCard, utilityBill, cac, profileImage)
  * file ext and file type
  */
  async getPresignedUrl(request: Request, response: Response, next: NextFunction) {
    const result = await UploadService.getPresignedUrl(request.user.id, request.body)
    return response.status(result.statusCode).send(result)
  },

  /**
  * Save Uploads
  * updateUserUploads
  */
  async updateUserUploads(request: Request, response: Response, next: NextFunction) {
    const result = await UploadService.updateUserUploads(request);
    return response.status(result.statusCode).send(result)
  },

  /**
  * @todo - Upload file to s3 moved to client
  */
  async uploadFile(request: Request, response: Response, next: NextFunction) {}
    
}