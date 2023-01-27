import ensureAuth from '../middleware/ensureAuth';
import { API_BASE_URI } from '../config/env';
import { } from '../validations/inputValidator';
import appUpdateController from '../controllers/appUpdate.controller';
import grantAccess from '../middleware/grantAccess';

export default router => {
  router.get(`${API_BASE_URI}/appVersion/mobile/check`, appUpdateController.checkAppUpdate);
  router.get(`${API_BASE_URI}/appVersion/enum`, appUpdateController.getAppPlatformsAndTypes);
};