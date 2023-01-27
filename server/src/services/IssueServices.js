// @flow

/**
 * Call Utils server to send mails and sms
 */

import axios from 'axios';
import { UTIL_SERVER } from '../config/env';
import { InternalServerError, NotFoundError, BadRequestError } from '../utils/errors';
import Pubsub from '../events/issueEventListener';
import UserRepository from '../repository/UserRepository';
import IssueRepository from '../repository/IssueRepository';
import Utility from '../utils';
import enumType from '../enumType';


export default {
  /**
   * createIssue
   * @param {*} request
   */
  async createIssue(request) {
    const user = await UserRepository.getUserById(request.user.id);
    if (!user) { throw new NotFoundError('User not found'); }

    const { category, key, issueCategory, message } = request.body;

    let currentIssueCategory;
    if (issueCategory === enumType.issueCategory.OTHER_ISSUE) {
      currentIssueCategory = enumType.issueCategory.OTHER_ISSUE;
    } else if (issueCategory === enumType.issueCategory.POS_ISSUE) {
      currentIssueCategory = enumType.issueCategory.POS_ISSUE;
    } else {
      throw new BadRequestError('Provide a valid issue category');
    }

    const newIssue = await IssueRepository.createIssue({
      message,
      user,
      receipt: key ? key : '',
      issueCategory: currentIssueCategory,
      issueReferenceId: `FBISS${Utility.getRandomInteger().toString().substring(1, 7)}`,
    });

    Pubsub.emit('new_issue', { newIssue, user });
    return Utility.buildResponse({ message: "Message sent, relax we'll attend to you shortly" });
  },

  /**
   * getUserIssues
   * @param {*} request
   */
  async getUserIssues(request) {
    const user = await UserRepository.getUserById(request.user.id);
    if (!user) { throw new NotFoundError('User not found'); }

    const issues = await IssueRepository.getUserIssues(user._id, request.query);
    if (!issues.data) { throw new NotFoundError('Issues not found'); }
    return Utility.buildResponse({ ...issues });
  },

  /**
   * getAllIssuesAndFilter
   * @param {object} request
   */
  async getAllIssuesAndFilter(request) {
    const user = await UserRepository.getUserById(request.user.id);
    if (!user) { throw new NotFoundError('User not found'); }

    const issues = await IssueRepository.getAllIssues(request.query);
    if (!issues.data) { throw new NotFoundError('Issues not found'); }
    return Utility.buildResponse({ ...issues });
  },

  /**
   * closeIssue
   * @param {object} request
   */
  async closeIssue(request) {
    const user = await UserRepository.getUserById(request.user.id);
    if (!user) { throw new NotFoundError('User not found'); }

    let issue = await IssueRepository.getIssueById(request.body.issueId);
    if (!issue) { throw new NotFoundError('Issue not found'); }

    issue.status = enumType.issueStatus.CLOSED;
    issue.attendendToBy = user;
    issue.meta.updatedAt = Date.now();

    issue = await IssueRepository.issueSave(issue);
    return Utility.buildResponse({ data: issue, message: 'Issue closed' });
  },
};
