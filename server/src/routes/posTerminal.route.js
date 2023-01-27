import ItexPosController from '../controllers/ItexPosController';
import RubiesPosController from '../controllers/RubiesPosController';
import posTerminalController from '../controllers/posTerminal.controller';
import ensureAuth from '../middleware/ensureAuth';
import ensureHeaderKey from '../middleware/ensureHeaderKey'
import { itexPosNotificationValidator, rubiesPosNotificationValidator } from '../validations/inputValidator';
import grantAccess from '../middleware/grantAccess';
import { API_BASE_URI } from '../config/env';

export default (router) => {
  router.post(`${API_BASE_URI}/pos/itex/terminal_notification`, ensureHeaderKey, itexPosNotificationValidator, ItexPosController.posNotificationItex);
  router.get(`${API_BASE_URI}/pos/charges`, posTerminalController.getPosCharges);

  router.post(`${API_BASE_URI}/pos/rubies/terminal_notification`, ensureHeaderKey, rubiesPosNotificationValidator, RubiesPosController.posNotificationRubies);
};
