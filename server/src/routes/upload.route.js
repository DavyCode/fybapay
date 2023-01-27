import uploadController from '../controllers/uploads.controller';
import ensureAuth from '../middleware/ensureAuth';
import { uploadGetPresignedUrlValidator, uploadUpdateValidator } from '../validations/inputValidator';
import { API_BASE_URI } from '../config/env';

export default (router) => {
  router.post(`${API_BASE_URI}/uploads/getPresignedUrl`, ensureAuth, uploadGetPresignedUrlValidator, uploadController.getPresignedUrl);
  router.put(`${API_BASE_URI}/uploads/update`, ensureAuth, uploadUpdateValidator, uploadController.updateUserUploads);
};
