import adminController from '../controllers/admin.controller';
import beneficiaryController from '../controllers/beneficiary.controller';
import TransactionController from '../controllers/transaction.controller';
import WalletController from '../controllers/wallet.controller';
import CommissionController from '../controllers/commission.controller';
import appUpdateController from '../controllers/appUpdate.controller';
import userController from '../controllers/user.controller';
import messageController from '../controllers/message.controller';
import agentController from '../controllers/agent.controller';
import posTerminalController from '../controllers/posTerminal.controller';
import issueController from '../controllers/issue.controller';
import aggregatorController from '../controllers/aggregator.controller';
import posNotificationController from '../controllers/posNotification.controller';

import ensureAdmin from '../middleware/ensureAdmin';
import ensureSuperAdmin from '../middleware/ensureSuperAdmin';
import ensureSupport from '../middleware/ensureSupport'
import grantAccess from '../middleware/grantAccess';

import {
  createSwitchValidator,
  switchServiceValidator,
  refundWalletValidator,
  updateUserBankValidator,
  userIdValidator,
  walletLimitValidator,
  userRoleValidator,
  updateUserProfileValidator,
  createAppUpdateValidator, updateAppUpdateValidator,
  createDirectMessageValidator,
  createBroadcastMessageValidator,
  updateMessageValidator,
  deleteMessageValidator,
  messageApproveForViewingValidator,
  attendToIssueValidator,

  agentRequestIdValidator,
  createTerminalValidator,
  updateTerminalValidator,
  terminalIdValidator,
  assignTerminalToAgentValidator,
  removeAgentFromTerminalValidator,

  adminAssignTerminalToAggregatorValidator,
  adminRemoveAggregatorFromTerminalValidator,

} from '../validations/inputValidator';

import { API_BASE_URI } from '../config/env';

export default (router) => {
  /**
   * Switch
   */
  router.get(`${API_BASE_URI}/rbq-admin/switch-service`, ensureAdmin, grantAccess('readAny', 'ServiceSwitch'), adminController.getAllServices);
  router.post(`${API_BASE_URI}/rbq-admin/switch-service`, ensureSuperAdmin, createSwitchValidator, grantAccess('createAny', 'ServiceSwitch'), adminController.createSwitchServices);
  router.put(`${API_BASE_URI}/rbq-admin/switch-service`, ensureAdmin, switchServiceValidator, grantAccess('updateAny', 'ServiceSwitch'), adminController.updateServiceChargeAndPlatform);
  router.get(`${API_BASE_URI}/rbq-admin/switch-service/logs`, ensureAdmin, grantAccess('readAny', 'ServiceSwitchLog'), adminController.getSwitchServiceLogs);

  // router.put(`${API_BASE_URI}/rbq-admin/switch-service/charges`, updateServiceChargeValidator, ensureAdmin, grantAccess('updateAny', 'ServiceSwitch'), adminController.updateServiceCharge);

  /**
   * Transactions
   */
  router.get(`${API_BASE_URI}/rbq-admin/transactions`, ensureSupport, grantAccess('readAny', 'Transaction'), TransactionController.getAllTransactionsAndByType);

  /**
   * Users
   */
  router.get(`${API_BASE_URI}/rbq-admin/user/newSignups`, ensureSupport, grantAccess('readAny', 'User'), adminController.getAuthOtpUsers);
  router.get(`${API_BASE_URI}/rbq-admin/users`, ensureSupport, grantAccess('readAny', 'User'), adminController.getAllUsers);
  router.get(`${API_BASE_URI}/rbq-admin/users/role`, ensureSupport, grantAccess('readAny', 'User'), adminController.getAllUsers);
  router.put(`${API_BASE_URI}/rbq-admin/users/profile`, ensureAdmin, updateUserProfileValidator, grantAccess('updateAny', 'User'), adminController.updateUserProfileData);
  router.put(`${API_BASE_URI}/rbq-admin/users/bank`, ensureAdmin, updateUserBankValidator, grantAccess('updateAny', 'User'), adminController.updateUserBankData);
  router.put(`${API_BASE_URI}/rbq-admin/users/lock`, ensureAdmin, userIdValidator, grantAccess('updateAny', 'User'), adminController.lockUserAccount);
  router.put(`${API_BASE_URI}/rbq-admin/users/unlock`, ensureAdmin, userIdValidator, grantAccess('updateAny', 'User'), adminController.unlockUserAccount);
  router.put(`${API_BASE_URI}/rbq-admin/users/role`, ensureSuperAdmin, userRoleValidator, grantAccess('updateAny', 'User'), adminController.assignUserRole);

  /**
   * Wallets
   */
  router.post(`${API_BASE_URI}/rbq-admin/wallet/refund`, ensureAdmin, refundWalletValidator, grantAccess('updateAny', 'Wallet'), adminController.refundWallet);
  router.put(`${API_BASE_URI}/rbq-admin/wallet/limit`, ensureAdmin, walletLimitValidator, grantAccess('updateAny', 'Wallet'), adminController.updateUserWalletLimit);

  /**
   * Commissions
   */
  router.get(`${API_BASE_URI}/rbq-admin/commissions/history`, ensureSupport, grantAccess('readAny', 'CommissionHistory'), CommissionController.getCommissionHistory);

  /**
    * Beneficiary
    */
  router.get(`${API_BASE_URI}/rbq-admin/transactions/beneficiaries`, ensureSupport, grantAccess('readAny', 'Beneficiary'), beneficiaryController.getAllBeneficiaries);

  /**
    * App update
    */
  router.get(`${API_BASE_URI}/rbq-admin/appVersion`, ensureAdmin, grantAccess('readAny', 'AppUpdate'), appUpdateController.getAllAppUpdates);
  router.post(`${API_BASE_URI}/rbq-admin/appVersion/mobile`, ensureSuperAdmin, grantAccess('createAny', 'AppUpdate'), createAppUpdateValidator, appUpdateController.createAppUpdate);
  router.put(`${API_BASE_URI}/rbq-admin/appVersion/mobile`, ensureSuperAdmin, grantAccess('updateAny', 'AppUpdate'), updateAppUpdateValidator, appUpdateController.updateAppUpdate);

  /**
   * Messages
   */
  router.get(`${API_BASE_URI}/rbq-admin/messages`, ensureSupport, grantAccess('readAny', 'Message'), messageController.getAllMessages);
  router.post(`${API_BASE_URI}/rbq-admin/messages/direct`, ensureAdmin, grantAccess('createAny', 'Message'), createDirectMessageValidator, messageController.createDirectMessage);
  router.post(`${API_BASE_URI}/rbq-admin/messages/broadcast`, ensureAdmin, grantAccess('createAny', 'Message'), createBroadcastMessageValidator, messageController.createBroadcastMessage);
  router.put(`${API_BASE_URI}/rbq-admin/messages`, ensureAdmin, grantAccess('updateAny', 'Message'), updateMessageValidator, messageController.updateMessage);
  // router.delete(`${API_BASE_URI}/rbq-admin/messages`, ensureAdmin, grantAccess('deleteAny', 'Message'), deleteMessageValidator, messageController.deleteMessage);
  router.put(`${API_BASE_URI}/rbq-admin/messages/viewing/approve`, ensureAdmin, grantAccess('updateAny', 'Message'), messageApproveForViewingValidator, messageController.messageApproveForViewing);

  /**
   * Agents
   */
  router.get(`${API_BASE_URI}/rbq-admin/agents/requests`, ensureSupport, grantAccess('readAny', 'AgentRequest'), agentController.getAllAgentRequestAndSearch);
  router.put(`${API_BASE_URI}/rbq-admin/agents/approve`, ensureAdmin, agentRequestIdValidator, grantAccess('updateAny', 'AgentRequest'), agentController.approveAgent);
  router.put(`${API_BASE_URI}/rbq-admin/agents/disapprove`, ensureAdmin, agentRequestIdValidator, grantAccess('updateAny', 'AgentRequest'), agentController.disapproveAgent);

  /**
   * POS TERMINAL
   */
  router.post(`${API_BASE_URI}/rbq-admin/pos/terminal`, ensureSuperAdmin, createTerminalValidator, grantAccess('createAny', 'PosTerminal'), posTerminalController.createTerminal);
  router.put(`${API_BASE_URI}/rbq-admin/pos/terminal`, ensureAdmin, updateTerminalValidator, grantAccess('updateAny', 'PosTerminal'), posTerminalController.updateTerminal);
  router.get(`${API_BASE_URI}/rbq-admin/pos/terminal`, ensureSupport, grantAccess('readAny', 'PosTerminal'), posTerminalController.getTerminalsAndFilter);
  router.delete(`${API_BASE_URI}/rbq-admin/pos/terminal`, ensureSuperAdmin, terminalIdValidator, grantAccess('deleteAny', 'PosTerminal'), posTerminalController.deleteTerminal);

  router.put(`${API_BASE_URI}/rbq-admin/pos/terminal/agent/assign`, ensureAdmin, assignTerminalToAgentValidator, grantAccess('updateAny', 'PosTerminal'), posTerminalController.adminAssignTerminalToAgent);
  router.put(`${API_BASE_URI}/rbq-admin/pos/terminal/agent/detach`, ensureAdmin, removeAgentFromTerminalValidator, grantAccess('updateAny', 'PosTerminal'), posTerminalController.adminRemoveAgentFromTerminal);

  router.put(`${API_BASE_URI}/rbq-admin/pos/terminal/aggregator/assign`, ensureAdmin, adminAssignTerminalToAggregatorValidator, grantAccess('updateAny', 'PosTerminal'), posTerminalController.adminAssignTerminalToAggregator);
  router.put(`${API_BASE_URI}/rbq-admin/pos/terminal/aggregator/detach`, ensureAdmin, adminRemoveAggregatorFromTerminalValidator, grantAccess('updateAny', 'PosTerminal'), posTerminalController.adminRemoveAggregatorFromTerminal);

  router.put(`${API_BASE_URI}/rbq-admin/pos/terminal/block`, ensureAdmin, terminalIdValidator, grantAccess('updateAny', 'PosTerminal'), posTerminalController.adminBlockPOS);
  router.put(`${API_BASE_URI}/rbq-admin/pos/terminal/unblock`, ensureAdmin, terminalIdValidator, grantAccess('updateAny', 'PosTerminal'), posTerminalController.adminUnblockPOS);

  /**
   * POS NOTIFICATION
   */
  router.get(`${API_BASE_URI}/rbq-admin/pos/notifications`, ensureSupport, grantAccess('readAny', 'PosNotification'), posNotificationController.getAllPosNotificationAndFilter);

  /**
   * ISSUES
   */
  router.get(`${API_BASE_URI}/rbq-admin/issues`, ensureSupport, grantAccess('readAny', 'Issues'), issueController.getAllIssuesAndFilter);
  router.put(`${API_BASE_URI}/rbq-admin/issues/attend`, ensureSupport, attendToIssueValidator, grantAccess('updateAny', 'Issues'), issueController.closeIssue);

  /**
   * USER BVN
   */
  router.get(`${API_BASE_URI}/rbq-admin/bvn/cache`, ensureSupport, grantAccess('readAny', 'CacheBvn'), adminController.getAllCacheBvn);

  /**
   * PAYMENT NOTIFICATION
   */
  router.get(`${API_BASE_URI}/rbq-admin/wallets/notifications`, ensureSupport, grantAccess('readAny', 'PaymentNotification'), WalletController.getAllPaymentNotificationsAndFilter);

  /**
   * AGGREGATOR
   */
  router.put(`${API_BASE_URI}/rbq-admin/aggregator/role/assign`, ensureAdmin, userIdValidator, grantAccess('updateAny', 'User'), aggregatorController.adminMakeUserAggregator);
};
