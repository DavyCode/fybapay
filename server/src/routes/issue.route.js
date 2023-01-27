import issueController from '../controllers/issue.controller';
import ensureAuth from '../middleware/ensureAuth';
import grantAccess from '../middleware/grantAccess';
import { createIssuesValidator } from '../validations/inputValidator';
import { API_BASE_URI } from '../config/env';

export default (router) => {
  router.post(`${API_BASE_URI}/issues`, ensureAuth, createIssuesValidator, grantAccess('createOwn', 'Issues'), issueController.createIssue);
  router.get(`${API_BASE_URI}/issues`, ensureAuth, grantAccess('readOwn', 'Issues'), issueController.getUserIssues);
};
