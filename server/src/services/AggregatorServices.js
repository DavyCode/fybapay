// @flow

/**
 * @todo
 * get /aggregator/dashboard/{aggregatorUserId}/page/{page}  - Get dashboard insight
 * put /aggregator/assign/{userId}  - Make user aggregator - DONE
 * get users with role of aggregator - DONE
 * get /aggregator/terminals/{aggregatorUserId} - Get POS Terminals by Aggregator ?
 * getAllTerminals
 *
 * post /aggregator/assign/terminal - Aggregator assigns a POS Terminal to an Agent
 * get /aggregator/terminals/assigned/{aggregatorUserId} - Get POS Terminals assinged by Aggregator
 * get /aggregator/terminals/notassigned/{aggregatorUserId} - Get POS Terminals not yet assigned by Aggregator
 *
 * put /aggregator/block/{terminalId} - Block a POS Terminal
 * put /aggregator/unblock/{terminalId} - Unblock a POS Terminal
 *
 * get /aggregator/transaction/details/{transactionNumber} - View a particular transaction by Transaction Number
 * get /aggregator/transaction/{aggregatorUserId}/page/{page} - View all transactions by aggregatorUserId
 */


import { BadRequestError, PaymentRequiredError, NotFoundError, InternalServerError, UnauthorizedError, ForbiddenError } from '../utils/errors';
import enumType from '../enumType';
import Utility from '../utils';
import Pubsub from '../events/aggregatorEventlistener';
import UserRepository from '../repository/UserRepository';
import POSTerminalRepository from '../repository/POSTerminalRepository';
import WalletRepository from '../repository/WalletRepository';
import TransactionRepository from '../repository/TransactionRepository';
import { generateAggregatorId } from '../utils/aggregatorCounter';
import AppConstant from '../constant';

// CREATE TERMINAL
// {
//   "address": "string",
//   "aggregatorUserId": "string",
//   "name": "string",
//   "phone": "string",
//   "serialNumber": "string",
//   "terminalId": "string",
//   "partner": "string",
//   "userId": "string"
// }

// ASSIGN TERMINAL
// {
//   "accountNumber": "string", // for agent wallet..to chek if user wallet
//   "address": "string",
//   "aggregatorUserId": "string",
//   "name": "string",
//   "phone": "string",
//   "serialNumber": "string",
//   "terminalId": "string"
// }
export default {

  /**
   *  * get /aggregator/dashboard/{aggregatorUserId}/page/{page}  - Get dashboard insight
   * getDashboardInsight
   * @private
   */
  async getAggregatorDashboardInsight(request) {
    const user = await UserRepository.getUserById(request.user.id);
    if (!user) { throw new NotFoundError('User not found'); }

    const countTotalTerminals = await POSTerminalRepository.countAggregatorTotalTerminals(request.user.id);

    const transactionCount = await TransactionRepository.countAggregatorPosTransactions(request.user.id);

    const sumTotalTransactions = await TransactionRepository.sumTransactionAmountByAggregatorUserId(request.user.id);
    
    let transactionSum = 0;
    if (sumTotalTransactions.length > 0) {
      transactionSum =  Number(sumTotalTransactions[0].total);
    }

    const sumTotalCommissions = await TransactionRepository.sumCommissionAmountByAggregatorUserId(request.user.id);

    return Utility.buildResponse({ 
      data: { 
        countTotalTerminals: countTotalTerminals ? countTotalTerminals : 0,
        transactionCount: transactionCount ? transactionCount : 0,
        sumTotalTransactions: transactionSum,
        sumTotalCommissions: sumTotalCommissions ? sumTotalCommissions : 0,
      }
    });
  },

  /**
   * createAggregatorEOD
   * @param {*} request 
   * @desc - ADMIN create EOD for aggregator by date
   * @desc - finds all aggregators transactions and create an EOD for a particular day
   */
  async generateAggregatorEOD(request) {
    const user = await UserRepository.getUserById(request.user.id);
    if (!user) {
      throw new NotFoundError('User not found');
    } 

    if (user.role !== enumType.rolesType.SUPERADMIN) {
      throw new UnauthorizedError('Access required');
    }

    /**
     * TODO CREATE EOD BY ADMIN
     * eodDate
     * aggregator ID
     * dont create EOD for already cleared EOD
     * 
     */

    // check if EOD exist and its cleared
    // const eod = await 
    // get transactions that belong to an agg for a particular


    // const transactions = await TransactionRepository.find
  },

  /**
   * getAggregatorEODAndFilter
   * @param {*} request
   * @desc - Gets aggregator EOD...for 7 days, and filter by date
   */
  async getAggregatorEODAndFilter(request) {
    // terminal aggregatorConcession needed

    const user = await UserRepository.getUserById(request.user.id);
    if (!user) {
      throw new NotFoundError('User not found');
    } 

    if (user.role !== enumType.rolesType.SUPERAGENT) {
      throw new UnauthorizedError('Aggregator Access required');
    }

    // get all successful transactions with agg ID tied to it 




  },

  /**
   * getAggregatorAgents
   * @param {*} request 
   */
  async getAggregatorAgents(request) {

  },

  /*************************************
   * ADMIN OPS START
   ****************************************/
  /**
   *  * put /aggregator/assign/{userId}  - Make user aggregator
   * makeUserAggregator
   * @todo - ADMIN OPS
   * @private
   */
  async adminMakeUserAggregator(request) {
    const admin = await UserRepository.getUserById(request.user.id);
    if (!admin) {
      throw new UnauthorizedError('Appropriate privilege required');
    }

    const user = await UserRepository.getUserById(request.body.userId);
    if (!user) { throw new NotFoundError('User not found'); }

    if (user.role === enumType.rolesType.SUPERAGENT) {
      throw new ForbiddenError('Aggregator already on-boarded, upgrade Kyc to upgrade account');
    }

    /**
     * Ensure user have been BVN verified
     */
    if (!user.isBVN_verified || !user.bank.bvn) {
      throw new ForbiddenError('Verify BVN to proceed');
    }

    const aggregatorId = await generateAggregatorId(user.phone);

    user.role = enumType.rolesType.SUPERAGENT;
    user.aggregatorOnboardingDate = Date.now();
    user.aggregatorId = aggregatorId;
    user.meta.updatedAt = Date.now();

    const aggregator = await UserRepository.userSave(user);

    Pubsub.emit('admin_assigned_new_aggregator', { user, admin });

    return Utility.buildResponse({ data: aggregator, message: 'Aggregator Approved'})
  },

  /**
   * TODO get all aggregators
   * @todo - get users with role aggregator
   * @todo - ADMIN
   * @description - ADMIN
   */

  /*********************************
   * ADMIN OPS END
   ****************************************/

  /**
   * * get /aggregator/terminals/{aggregatorUserId} - Get POS Terminals assigned to Aggregator
   * getTerminals
   * @private
  */
  async getAggregatorTerminals(request) {
    const user = await UserRepository.getUserById(request.user.id);
    if (!user) { throw new NotFoundError('User not found'); }

    const aggregatorTerminals = await POSTerminalRepository.getAggregatorTerminalsAndFilter(user.id, request.query);
    if (!aggregatorTerminals.data) { throw new NotFoundError('Terminals not found'); }

    return Utility.buildResponse({ ...aggregatorTerminals });
  },

  /**
   * * POST /aggregator/assign/terminal - Aggregator assigns a POS Terminal to an Agent
   * assignTerminalToAgent
   * @description - Overwrite terminal details set when creating terminal
   * @description - ADMIN issues terminals to AGG...AGG assign terminals to agents
   * @todo - how do we prevent terminal ID displace and miss-use by agg //todo
   */
  async aggregatorAssignTerminalToAgent(request) {
    const { accountNumber, terminalId, address, lga, state } = request.body;

    const aggregator = await UserRepository.getUserById(request.user.id);
    if (!aggregator) { throw new NotFoundError('Aggregator User not found'); }

    const terminal = await POSTerminalRepository.findOnePOS({ terminalId });
    if (!terminal) { throw new NotFoundError('Terminal not found'); }

    /**
     * @desc - AGGREGATOR SHOULD ONLY ASSIGN TERMINAL GIVEN TO THEM
     */
    if (aggregator._id.toString() !== terminal.aggregator._id.toString()) {
      throw new BadRequestError(`Aggregator not tied to terminal ${terminalId}`);
    }

    const wallet = await WalletRepository.findByAccountNumber(accountNumber);
    if (!wallet) { throw new NotFoundError('Account number not found'); }

    const agent = await UserRepository.findOneWithWallet({ wallet: wallet._id });
    if (!agent) { throw new NotFoundError('User with the account number not found'); }

    /**
     * @desc - CHECK AGENT ROLE
     */
    if (agent.role !== enumType.rolesType.AGENT) {
      throw new ForbiddenError('You can only assign Terminals to Approved Agents');
    }

    // terminal.aggregator = aggregator;
    // terminal.serialNumber = serialNumber; // this should be set by admin
    // terminal.terminalId = terminalId; // this should be set by admin
    terminal.user = agent;
    terminal.userId = agent.userId;
    terminal.phone = agent.phone;
    terminal.name = `${agent.firstName.toUpperCase()} ${agent.lastName.toUpperCase()}`;
    terminal.address = address;
    terminal.lga = lga;
    terminal.state = state;
    terminal.assignedToAgent = true;
    terminal.transactionLimit = AppConstant.POS_TERMINAL_TRANSACTION_LIMIT;
    terminal.assignedToAgentOn = Date.now();
    terminal.assignedToAgentBy = aggregator;
    
    terminal.detachedFromAgentBy = null;
    terminal.detachedFromAgentOn = null;
    
    terminal.meta.updatedAt = Date.now();

    await POSTerminalRepository.savePOSTerminal(terminal);

    /**
     * Before assigning aggregator to an agent
     * We need to ensure the agent is not tied to another aggregator
     */
    // agent.aggregator = aggregator;
    // agent.dateAssignedToAggregator = Date.now();
    // agent.meta.updatedAt = Date.now();
    // await UserRepository.userSave(agent);

    Pubsub.emit('aggregator_assign_terminal_to_agent', { terminal, agent, aggregator });
    
    return Utility.buildResponse({ message: 'Terminal assigned to agent' });
  },

  /**
   * aggregatorRemoveAgentFromTerminal
   * @param {*} request
   * @todo - maybe we should not leave terminal without an agent 
   */
  async aggregatorRemoveAgentFromTerminal(request) {
    const { accountNumber, terminalId } = request.body;

    const aggregator = await UserRepository.getUserById(request.user.id);
    if (!aggregator) { throw new NotFoundError('Aggregator User not found'); }

    let terminal = await POSTerminalRepository.findOnePOS({ terminalId });
    if (!terminal) { throw new NotFoundError('Terminal not found'); }

    /**
     * @desc - AGGREGATOR SHOULD ONLY OPERATE TERMINAL GIVEN TO THEM
     */
    if (aggregator._id.toString() !== terminal.aggregator._id.toString()) {
      throw new BadRequestError(`Aggregator not tied to terminal ${terminalId}`);
    }

    const wallet = await WalletRepository.findByAccountNumber(accountNumber);
    if (!wallet) { throw new NotFoundError('Account number not found'); }

    const agent = await UserRepository.findOneWithWallet({ wallet: wallet._id });
    if (!agent) { throw new NotFoundError('User with the account number not found'); }

    /**
     * @desc - agent must match agent on the terminal
     */
    if (agent._id.toString() !== terminal.user._id.toString()) {
      throw new BadRequestError(`Agent not tied to this terminal ${terminalId}`);
    }

    terminal.assignedToAgent = false;
    terminal.detachedFromAgentBy = aggregator;
    terminal.detachedFromAgentOn = Date.now();
    /**
     * TODO - factor in setting terminal transaction Limit
     * terminal Notification will still goto old agent - we should lock it here
     */
    terminal.transactionLimit = 1;
    terminal.assignedToAgentOn = null;
    // terminal.assignedToAgentBy = aggregator;
    terminal.meta.updateAt = Date.now();

    await POSTerminalRepository.savePOSTerminal(terminal);
    
    Pubsub.emit('aggregator_removed_terminal_from_agent', { terminal, agent, aggregator });
    return Utility.buildResponse({ message: `Terminal ${terminalId} detached from Agent ${terminal.name}` });
  },

  /**
   * DONE
   * TODO getAggregatorUnassignedTerminals
   *  * get /aggregator/terminals/notassigned/{aggregatorUserId} - Get POS Terminals not yet assigned by Aggregator
   * @desc - // aggregator - Get Terminals assigned/unassigned to agents ? GET agg terminals filter - assignedToAgent === false/true
   */

  /**
   * DONE
   * TODO getAggregatorAssignedTerminals
   * @desc - // aggregator - Get Terminals assigned/unassigned to agents ? GET agg terminals filter - assignedToAgent === false/true
   */

  /**
   * * put /aggregator/block/{terminalId} - Block a POS Terminal
   * blockPOS
   */
  async aggregatorBlockPOS(request) {
    const { terminalId } = request.body;

    const aggregator = await UserRepository.getUserById(request.user.id);
    if (!aggregator) { throw new NotFoundError('User not found'); }

    const terminal = await POSTerminalRepository.findOnePOS({ terminalId });
    if (!terminal) { throw new NotFoundError('Terminal not found'); }

    /**
     * @desc - AGGREGATOR SHOULD ONLY ASSIGN TERMINAL GIVEN TO THEM
     */
    if (aggregator._id.toString() !== terminal.aggregator._id.toString()) {
      throw new BadRequestError(`Aggregator not tied to terminal ${terminalId}`);
    }
    let agent;
    if (terminal.user) {
      agent = await UserRepository.getUserById(terminal.user._id);
    }

    terminal.blocked = true;
    terminal.transactionLimit = 1;
    terminal.meta.updatedAt = Date.now();

    await POSTerminalRepository.savePOSTerminal(terminal);

    Pubsub.emit('aggregator_block_pos', { terminal, aggregator, agent });
    
    return Utility.buildResponse({ message: `Terminal ${terminalId} blocked` });
  },

  /**
   * * put /aggregator/unblock/{terminalId} - Unblock a POS Terminal
   * unblockPOS
   */
  async aggregatorUnblockPOS(request) {
    const { terminalId } = request.body;

    const aggregator = await UserRepository.getUserById(request.user.id);
    if (!aggregator) { throw new NotFoundError('Aggregator User not found'); }

    const terminal = await POSTerminalRepository.findOnePOS({ terminalId });
    if (!terminal) { throw new NotFoundError('Terminal not found'); }

    /**
     * @desc - AGGREGATOR SHOULD ONLY ASSIGN TERMINAL GIVEN TO THEM
     */
    if (aggregator._id.toString() !== terminal.aggregator._id.toString()) {
      throw new BadRequestError(`Aggregator not tied to terminal ${terminalId}`);
    }

    let agent;
    if (terminal.user) {
      agent = await UserRepository.getUserById(terminal.user._id);
    }

    terminal.blocked = false;
    terminal.transactionLimit = AppConstant.POS_TERMINAL_TRANSACTION_LIMIT;
    terminal.meta.updatedAt = Date.now();

    await POSTerminalRepository.savePOSTerminal(terminal);

    Pubsub.emit('aggregator_unblock_pos', { terminal, aggregator, agent });
    
    return Utility.buildResponse({ message: `Terminal ${terminalId} unblocked` });
  },

  /**
   * TODO getTransactionByReference
   * get /aggregator/transaction/details/{transactionNumber} - View a particular transaction by Transaction REFERENCE
   * @desc - GET all transactions and filter ? transactionReference === 1234ref
   */

  /**
   * get /aggregator/transaction/{aggregatorUserId}/page/{page} - View all transactions by aggregatorUserId
   * getAggregatorTerminalTransactionsAndFilter
   */
  async getAggregatorTerminalTransactionsAndFilter(request) {
    const aggregator = await UserRepository.getUserById(request.user.id);
    if (!aggregator) { throw new NotFoundError('Aggregator User not found'); }

    // if (aggregator.role !== enumType.rolesType.SUPERAGENT) {
    //   throw new UnauthorizedError('You cannot view these resource, aggregator access required');
    // }

    const transactions = await TransactionRepository.getAggregatorTransactionsTypeOfPosTerminalAndFilter(aggregator._id, request.query);

    if (!transactions.data) { throw new NotFoundError('Transactions not found'); }
    return Utility.buildResponse({ ...transactions });
  },
};

// get agg
// find all terminals they own
// get all users on terminal they own
// fetch each user POS trx
// get transactions of transactionType === POS

// OR

// get transactions of transactionType === POS
// and aggregatorUserId = 123


// ADMIN
// adminMakeUserAggregator √√

// admin - Get assigned/unassigned Terminals to aggregator ? GET terminals filter - assignedToAggregator === false/true
// admin - Get assigned/unassigned Terminals to agent ? GET terminals filter - assignedToAgent === false/true

// admin - Get Aggregator POS Terminals ? GET terminals filter - aggregatorUserId
// admin - Get Aggregator POS Terminals assigned/unassigned to agent ? GET terminals filter - aggregatorUserId && assignedToAgent === false/true

// admin - Get agent POS Terminal ? GET terminals filter - UserId

// admin - Block POS Terminal
// admin - unBlock POS Terminal


// AGG
// getAggregatorDashboardInsight ??
// getAggregatorTerminals √√
// aggregatorAssignTerminalToAgent √√
// getAggregatorUnassignedTerminals √√
// getAggregatorAssignedTerminals √√
// aggregatorBlockPOS
// aggregatorUnblockPOS
// getTransactionByReference √√
// getAggregatorTerminalTransactions

// aggregator - Get dashboard insight
// aggregator - Get POS Terminals ? GET agg terminals filter
// aggregator - Get Terminals assigned/unassigned to agents ? GET agg terminals filter - assignedToAgent === false/true
// aggregator - Get agent POS Terminals ? GET agg terminals filter - UserId
// aggregator - Block POS Terminal
// aggregator - unBlock POS Terminal
// aggregator - GET transaction by reference