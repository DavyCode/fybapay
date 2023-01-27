import ensureSuperAgent from '../middleware/ensureSuperAgent';
import { API_BASE_URI } from '../config/env';
import {
  aggregatorAssignTerminalToAgentValidator,
  aggregatorRemoveAgentFromTerminalValidator,
  terminalIdValidator,
} from '../validations/inputValidator';
import aggregatorController from '../controllers/aggregator.controller';

export default (router) => {
  router.get(`${API_BASE_URI}/aggregator/terminals`, ensureSuperAgent, aggregatorController.getAggregatorTerminals);
  router.post(`${API_BASE_URI}/aggregator/terminals/assign`, ensureSuperAgent, aggregatorAssignTerminalToAgentValidator, aggregatorController.aggregatorAssignTerminalToAgent);
  router.post(`${API_BASE_URI}/aggregator/terminals/detach`, ensureSuperAgent, aggregatorRemoveAgentFromTerminalValidator, aggregatorController.aggregatorRemoveAgentFromTerminal);
  router.put(`${API_BASE_URI}/aggregator/terminals/block`, ensureSuperAgent, terminalIdValidator, aggregatorController.aggregatorBlockPOS);
  router.put(`${API_BASE_URI}/aggregator/terminals/unblock`, ensureSuperAgent, terminalIdValidator, aggregatorController.aggregatorUnblockPOS);
  router.get(`${API_BASE_URI}/aggregator/terminals/transactions`, ensureSuperAgent, aggregatorController.getAggregatorTerminalTransactionsAndFilter);
  router.get(`${API_BASE_URI}/aggregator/insight`, ensureSuperAgent, aggregatorController.getAggregatorDashboardInsight);
};
