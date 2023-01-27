// @flow

/**
 * TODO Create pos terminal
  Delete a terminal
  Update pos terminal
  Get pos terminals
  /Assign terminal to another agent
  View transactions for a particular terminal
  Update user wallet transaction limit
 */


import { BadRequestError, PaymentRequiredError, NotFoundError, InternalServerError, UnauthorizedError, ForbiddenError} from '../utils/errors';
import enumType from '../enumType';
import Utility from '../utils';
import Pubsub from '../events/POSTerminalEventlistener';
import UserRepository from '../repository/UserRepository';
import POSTerminalRepository from '../repository/POSTerminalRepository';
import POSNotificationRepository from '../repository/POSNotificationRepository';
import WalletRepository from '../repository/WalletRepository';
import TransactionRepository from '../repository/TransactionRepository';
import CommissionRepository from '../repository/CommissionRepository';
import { formatNumber } from '../utils/formatPhone';
import AppConstant from '../constant';
import { 
  ITEX_POS_KEY,
  RUBIES_POS_KEY,
} from '../config/env';

export default {

  /******************************
   * ADMIN OPS
   ************************************/

  /**
   * createTerminal
   * @param {*} request
   */
  async createTerminal(request) {
    const admin = await UserRepository.getUserById(request.user.id);
    if (!admin) {
      throw new UnauthorizedError('Appropriate privilege required, user not found');
    }
    const { terminalId, partner, serialNumber, address, lga, state, agentPhone, aggregatorPhone } = request.body;

    const terminalExist = await POSTerminalRepository.findOnePOS({ terminalId });
    if (terminalExist) { throw new ForbiddenError('Terminal already exist'); }

    let agent;
    if (agentPhone) {
      agent = await UserRepository.findOne({ phone: formatNumber(agentPhone) });

      if (!agent) { throw new NotFoundError('Agent not found'); }

      /**
        * @todo - CHECK USER ROLE
        */
      if (agent.role !== enumType.rolesType.AGENT) {
        throw new ForbiddenError('You can only assign Terminals to Approved Agents');
      }
    }

    let aggregator;
    if (aggregatorPhone) {
      aggregator = await UserRepository.findOne({ phone: formatNumber(aggregatorPhone) });

      if (!aggregator) { throw new NotFoundError('Aggregator not found'); }

      /**
       * @todo - CHECK USER ROLE
       */
      if (aggregator.role !== enumType.rolesType.SUPERAGENT) {
        throw new ForbiddenError('You can only assign Terminals to Approved Aggregators');
      }
    }

    let newTerminal = await POSTerminalRepository.createPOSTerminal({
      user: admin,
      userId: admin.userId,
      phone: admin.phone,
      name: `${admin.firstName.toUpperCase()} ${admin.lastName.toUpperCase()}`,
      terminalId,
      serialNumber,
      partner,
      address,
      lga,
      state,
      assignedToAggregator: false,
      assignedToAgent: false,
    });

    if (!newTerminal) { throw new InternalServerError('Something went wrong, could not create terminal'); }

    if (agent) {
      newTerminal.user = agent;
      newTerminal.userId = agent.userId;
      newTerminal.phone = agent.phone;
      newTerminal.name = `${agent.firstName.toUpperCase()} ${agent.lastName.toUpperCase()}`;
      newTerminal.assignedToAgent = true;
      newTerminal.assignedToAgentOn = Date.now();
      newTerminal.assignedToAgentBy = admin;
    }

    if (aggregator) {
      newTerminal.aggregator = aggregator;
      newTerminal.assignedToAggregator = true;
      newTerminal.assignedToAggregatorOn = Date.now();
      newTerminal.assignedToAggregatorBy = admin;
    }

    if (agent || aggregator) {
      newTerminal = await POSTerminalRepository.savePOSTerminal(newTerminal);
    }

    Pubsub.emit('new_terminal_created', { terminal: newTerminal, agent, aggregator, admin });

    return Utility.buildResponse({ data: newTerminal, message: 'Terminal created' });
  },

  /**
   * updateTerminal
   * @param {*} request
   */
  async updateTerminal(request) {
    const admin = await UserRepository.getUserById(request.user.id);
    if (!admin) {
      throw new UnauthorizedError('Appropriate privilege required, user not found');
    }

    // state,
    // lga,
    // address,
    // serialNumber,
    // terminalId,
    // partner,
    // transactionLimit,

    const terminal = await POSTerminalRepository.insertPOSTerminal({ terminalId: request.body.terminalId }, {
      ...request.body,
      'meta.updateAt': Date.now(),
    }, { new: true, upsert: false });

    if (!terminal) { throw new NotFoundError('Terminal not found, update terminated'); }

    Pubsub.emit('terminal_updated', { terminal });

    return Utility.buildResponse({ data: terminal, message: 'Terminal updated' });
  },

  /**
   * "Delete a terminal"
   * deleteTerminal
   * @param {*} request
   */
  // TODO : should a terminal with POS notification be deleted??
  async deleteTerminal(request) {
    const admin = await UserRepository.getUserById(request.user.id);
    if (!admin) {
      throw new UnauthorizedError('Appropriate privilege required, user not found');
    }
    const { terminalId } = request.body;
    const terminal = await POSTerminalRepository.findOneAndDeleteTerminal({ terminalId });

    if (!terminal) { throw new NotFoundError('Terminal not found!'); }

    Pubsub.emit('terminal_deleted', { terminal });
    return Utility.buildResponse({ data: terminal, message: 'Terminal deleted' });
  },

  /**
   * assignTerminalToAgent
   * @param {*} request
   */
  async adminAssignTerminalToAgent(request) {
    const admin = await UserRepository.getUserById(request.user.id);
    if (!admin) {
      throw new UnauthorizedError('Appropriate privilege required, user not found');
    }

    const { phone, terminalId, address, lga, state } = request.body;
    const agent = await UserRepository.findOne({ phone: formatNumber(phone) });
    if (!agent) { throw new NotFoundError('Agent not found'); }

    /**
     * @todo - CHECK USER ROLE
     */
    if (agent.role !== enumType.rolesType.AGENT) {
      throw new ForbiddenError('You can only assign Terminals to Approved Agents');
    }

    let terminal = await POSTerminalRepository.findOnePOS({ terminalId });
    if (!terminal) { throw new NotFoundError('Terminal not found'); }

    terminal.user = agent;
    terminal.userId = agent.userId;
    terminal.phone = agent.phone;
    terminal.name = `${agent.firstName.toUpperCase()} ${agent.lastName.toUpperCase()}`;
    terminal.address = address;
    terminal.lga = lga;
    terminal.state = state;
    terminal.assignedToAgent = true;
    terminal.assignedToAgentOn = Date.now();
    terminal.assignedToAgentBy = admin;

    terminal.detachedFromAgentBy = null;
    terminal.detachedFromAgentOn = null;

    terminal.meta.updateAt = Date.now();

    terminal = await POSTerminalRepository.savePOSTerminal(terminal);

    Pubsub.emit('admin_assign_terminal_agent', { terminal, admin, agent });

    return Utility.buildResponse({ message: `Terminal ${terminalId} assigned to Agent ${terminal.name}` });
  },

  /**
   * adminRemoveAgentFromTerminal
   * @param {*} request
   * @description - Provide phone of agent to remove
   */
  async adminRemoveAgentFromTerminal(request) {
    const admin = await UserRepository.getUserById(request.user.id);
    if (!admin) {
      throw new UnauthorizedError('Appropriate privilege required, user not found');
    }

    const { phone, terminalId } = request.body;
    const formatedNumber = formatNumber(phone);

    let terminal = await POSTerminalRepository.findOnePOS({ terminalId });
    if (!terminal) { throw new NotFoundError('Terminal not found'); }

    const agent = await UserRepository.findOne({ phone: formatedNumber });
    if (!agent) { throw new NotFoundError('Agent not found'); }

    // Phone must match terminal phone
    if (terminal.phone !== agent.phone) {
      throw new BadRequestError(`Agent phone ${phone} not tied to terminal ${terminalId}`);
    }

    terminal.user = admin;
    terminal.userId = admin.userId;
    terminal.phone = admin.phone;
    terminal.name = `${admin.firstName.toUpperCase()} ${admin.lastName.toUpperCase()}`;
    // terminal.address = admin.address ? admin.address : ''; // TODO - which address should this be changed to
    terminal.assignedToAgent = false;
    terminal.detachedFromAgentBy = admin;
    terminal.detachedFromAgentOn = Date.now();

    terminal.assignedToAgentOn = null;
    terminal.assignedToAgentBy = null;

    terminal.meta.updateAt = Date.now();

    terminal = await POSTerminalRepository.savePOSTerminal(terminal);

    Pubsub.emit('admin_detach_terminal_agent', { terminal, admin, agent });

    return Utility.buildResponse({ message: `Terminal ${terminalId} detached from Agent ${agent.firstName}` });
  },

  /**
   * adminAssignTerminalToAggregator
   * @param {*} request
   */
  async adminAssignTerminalToAggregator(request) {
    const admin = await UserRepository.getUserById(request.user.id);
    if (!admin) {
      throw new UnauthorizedError('Appropriate privilege required, user not found');
    }

    const { phone, terminalId } = request.body;
    const aggregator = await UserRepository.findOne({ phone: formatNumber(phone) });
    if (!aggregator) { throw new NotFoundError('Aggregator not found'); }

    /**
     * @todo - CHECK USER ROLE
     */
    if (aggregator.role !== enumType.rolesType.SUPERAGENT) {
      throw new ForbiddenError('You can only assign Terminals to Approved Aggregators');
    }

    let terminal = await POSTerminalRepository.findOnePOS({ terminalId });
    if (!terminal) { throw new NotFoundError('Terminal not found'); }

    terminal.aggregator = aggregator;
    terminal.assignedToAggregator = true;
    terminal.assignedToAggregatorOn = Date.now();
    terminal.assignedToAggregatorBy = admin;

    terminal.detachedFromAggregatorBy = null;
    terminal.detachedFromAggregatorOn = null;

    terminal.meta.updateAt = Date.now();

    terminal = await POSTerminalRepository.savePOSTerminal(terminal);

    Pubsub.emit('admin_assign_terminal_aggregator', { terminal, admin, aggregator });

    return Utility.buildResponse({ message: `Terminal ${terminalId} assigned to aggregator ${aggregator.firstName} ${aggregator.lastName}` });
  },

  /**
   * adminRemoveAggregatorFromTerminal
   * @param {*} request
   */
  async adminRemoveAggregatorFromTerminal(request) {
    const admin = await UserRepository.getUserById(request.user.id);
    if (!admin) {
      throw new UnauthorizedError('Appropriate privilege required, user not found');
    }

    const { phone, terminalId } = request.body;
    const formatedNumber = formatNumber(phone);

    let terminal = await POSTerminalRepository.findOnePOS({ terminalId });
    if (!terminal) { throw new NotFoundError('Terminal not found'); }

    const aggregator = await UserRepository.findOne({ phone: formatedNumber });
    if (!aggregator) { throw new NotFoundError('Aggregator not found'); }

    if (!terminal.aggregator) {
      throw new BadRequestError('Terminal not assigned to aggregator');
    }
    if (aggregator._id.toString() !== terminal.aggregator._id.toString()) {
      throw new BadRequestError(`Aggregator not tied to terminal ${terminalId}`);
    }

    terminal.aggregator = null;
    terminal.assignedToAggregator = false;
    terminal.detachedFromAggregatorBy = admin;
    terminal.detachedFromAggregatorOn = Date.now();

    terminal.assignedToAggregatorOn = null;
    terminal.assignedToAggregatorBy = null;

    terminal.meta.updateAt = Date.now();

    terminal = await POSTerminalRepository.savePOSTerminal(terminal);

    Pubsub.emit('admin_detach_terminal_aggregator', { terminal, admin, aggregator });

    return Utility.buildResponse({ message: `Terminal ${terminalId} detached from aggregator ${aggregator.firstName} ${aggregator.lastName}` });
  },

  /**
   * "Get pos terminals"
   * getAllTerminals
   * @param {*} request
   * @todo - ADMIN
   * @description - ADMIN
   * @public
   */
  async getTerminalsAndFilter(request) {
    const admin = await UserRepository.getUserById(request.user.id);
    if (!admin) {
      throw new UnauthorizedError('Appropriate privilege required, user not found');
    }

    const terminals = await POSTerminalRepository.getTerminalsAndFilter(request.query);

    if (!terminals.data) { throw new NotFoundError('Terminals not found'); }

    return Utility.buildResponse({ ...terminals });
  },

  /**
   * adminBlockPOS
   */
  async adminBlockPOS(request) {
    const { terminalId } = request.body;

    const terminal = await POSTerminalRepository.findOnePOS({ terminalId });
    if (!terminal) { throw new NotFoundError('Terminal not found'); }

    let agent;
    if (terminal.user) {
      agent = await UserRepository.getUserById(terminal.user._id);
    }
    let aggregator;
    if (terminal.aggregator) {
      aggregator = await UserRepository.getUserById(terminal.aggregator._id);
    }

    terminal.blocked = true;
    terminal.transactionLimit = 1;
    terminal.meta.updatedAt = Date.now();

    await POSTerminalRepository.savePOSTerminal(terminal);

    Pubsub.emit('admin_block_pos', { terminal, agent, aggregator });

    return Utility.buildResponse({ message: `Terminal ${terminalId} blocked` });
  },

  /**
   * adminUnblockPOS
   */
  async adminUnblockPOS(request) {
    const { terminalId } = request.body;

    const terminal = await POSTerminalRepository.findOnePOS({ terminalId });
    if (!terminal) { throw new NotFoundError('Terminal not found'); }

    let agent;
    if (terminal.user) {
      agent = await UserRepository.getUserById(terminal.user._id);
    }
    let aggregator;
    if (terminal.aggregator) {
      aggregator = await UserRepository.getUserById(terminal.aggregator._id);
    }

    terminal.blocked = false;
    terminal.transactionLimit = AppConstant.POS_TERMINAL_TRANSACTION_LIMIT;
    terminal.meta.updatedAt = Date.now();

    await POSTerminalRepository.savePOSTerminal(terminal);

    Pubsub.emit('admin_unblock_pos', { terminal, agent, aggregator });

    return Utility.buildResponse({ message: `Terminal ${terminalId} unblocked` });
  },

  /**
   * TODO - not useful
   * "View transactions for a particular terminal"
   * getTransactionsByTerminal
   * @param {*} request
   * @description - admin
   */
  // async getTransactionsByTerminalAndFilter(request) {
  //   const { terminalId } = request.query; // todo - validate query

  //   if (!terminalId) { throw new BadRequestError('Provide a Terminal ID in query'); }

  //   const terminal = await POSTerminalRepository.findOnePOS({ terminalId });
  //   if (!terminal) { throw new NotFoundError('Terminal not found'); }

  //   /**
  //    * get terminal user and get all trx of Type POS
  //    * @todo - why not attach terminal ID to trx directly ?
  //    */
  //   // select trx where user ID === pos_terminal user ID, where the trx type is POS
  //   const transactions = await TransactionRepository
  //     .getUserTransactionsAndByTypeAndORStatus(terminal.user._id, request.query);

  //   if (!transactions.data) { throw new NotFoundError('Transactions not found'); }
  //   return Utility.buildResponse({ ...transactions });
  // },

  /**
   * getAgentInfoByTerminalId
   * @param {object} request
   */
  // TODO -
  // async getAgentInfoByTerminalId(request) {
  //   const { terminalId } = request.query; // todo - validate query

  //   if (!terminalId) { throw new BadRequestError('Provide a Terminal ID in query'); }

  //   const terminal = await POSTerminalRepository.findOnePOS({ terminalId });
  //   if (!terminal) { throw new NotFoundError('Terminal not found'); }
  // },

  /**
   * getAllPosNotification
   * @param {*} request
   */
  async getAllPosNotificationAndFilter(request) {
    const admin = await UserRepository.getUserById(request.user.id);
    if (!admin) {
      throw new UnauthorizedError('Appropriate privilege required, user not found');
    }

    const posNotification = await POSNotificationRepository.getAllPosNotificationAndFilter(request.query);

    if (!posNotification.data) { throw new NotFoundError('Pos notifications not found'); }

    return Utility.buildResponse({ ...posNotification });
  },

  /**
   * 
   * @param {Number} amount 
   */
  async posCharges(amount: number) {
    let charges = 0;
    let stampDuty = 0

    if ((amount >= 10000) && (amount <= 20000)) {
      charges = 30; // PLACE STAMP DUTY
    }

    if (amount < 100000) {
      let a = amount * 0.7;
      let b = a / 100;
      charges += b
    } 
    else if (amount < 200000) {
      let x = amount * 0.65;
      let y = x / 100;
      charges += y;
    }
    else {
      charges = 1300;
    }

    return {
      charges,
      stampDuty,
    };
  },

  /**
   * getTerminalConcessionCharge
   * @param {Number} amount 
   * @param {String} terminalConcessionCharge 
   */
  async getTerminalConcessionCharge(amount: number, terminalConcessionCharge: string) {
    let charges = 0;

    if ((amount >= 10000) && (amount <= 20000)) {
      charges = 30; // PLACE STAMP DUTY
    }

    if (amount < 200000) {
      let x = amount * Number(terminalConcessionCharge);
      let y = x / 100;
      charges += y;
    }
    else {
      charges = 1300;
    }

    return charges;
  },

  /**
   * getTerminalConcessionCharge
   * @param {Number} amount 
   */
  // TODO - NOT IN USE
  async getTerminalConcessionChargeOld(amount: number, terminalConcessionCharge: string) {
    let charges = 0;

    if (amount >= 10000) {
      charges = 50; // PLACE STAMP DUTY
    }

    if (amount < 200000) {
      charges += (amount * Number(terminalConcessionCharge)) / 100;
    }
    else {
      charges = 1300;
    }

    return charges;
  },

  /**
   * getPosCharges
   * get POS charges
   * @param {object} request
   * @description - request object
   */
  // TODO - NOT IN USE
  async getPosCharges(request) {
    const { amount } = request.query;
    if (!amount) { throw new BadRequestError('Amount Required'); }
    const posAmount = amount ? amount : 0;
    const { charges, stampDuty } = await this.posCharges(posAmount);

    let stampDutyApply = false;
    if (stampDuty && stampDuty >  0) {
      stampDutyApply = true
    }
    return Utility.buildResponse({ data: { 
      amount: posAmount,
      charges: Math.floor(charges),
      stampDuty,
      stampDutyApply,
    } });
  },

  /**
   * posNotificationItex
   * @param {*} request
   * @public
   */
  async posNotificationItex(request) {
    const {
      MTI,
      amount,
      terminalId,
      responseCode,
      responseDescription,
      PAN,
      RRN,
      STAN,
      authCode,
      transactionTime,
      reversal,
      merchantId,
      merchantName,
      merchantAddress,
      rrn,
    } = request.body;

    // ENSURE AUTHORIZATION HERE
    if (request.headerKey !== ITEX_POS_KEY) {
      throw new UnauthorizedError('Invalid Authorization!');
    }

    if (responseCode !== '00') {
      Utility.buildResponse({ message: 'Ignored' });
    }

    const posTerminal = await POSTerminalRepository.findOnePOS({ terminalId });
    if (!posTerminal) {
      throw new NotFoundError('Terminal not found');
    }

    if (posTerminal.blocked) {
      throw new NotFoundError('Terminal blocked');
    }

    // Dont exceed limit
    if (amount > posTerminal.transactionLimit) {
      throw new BadRequestError('Transaction limit exceeded');
    }

    /**
     * Don't duplicate transactions
     * @desc - check if transaction exist in POS notifications
     */
    const transactionExist = await POSNotificationRepository.findOne({ retrievalReferenceNumber: RRN });
    if (transactionExist) {
      throw new BadRequestError('Duplicate retrievalReferenceNumber RRN');
    }

    if (!posTerminal.user) {
      throw new BadRequestError('User not attached to terminal');
    }

    const wallet = await WalletRepository.getWalletByUserId(posTerminal.user._id);
    if (!wallet) {
      throw new BadRequestError('Wallet not attached to terminal');
    }

    const reference = await Utility.generateTrxReference();

    let { charges, stampDuty } = await this.posCharges(amount);
    
    // SET RATE FOR CHARGE BASE ON TERMINAL terminalConcessionCharge
    if (posTerminal.terminalConcessionCharge && posTerminal.terminalConcessionCharge > 0) {
      charges = await this.getTerminalConcessionCharge(amount, posTerminal.terminalConcessionCharge)
    }

    charges = Math.floor(charges); // Floor to remove extra fraction

    const transaction = await TransactionRepository.TransactionCreate({
      narration: 'POS Purchase',
      serviceType: enumType.serviceType.POS,
      amount,
      user: posTerminal.user._id,
      userId: posTerminal.user.userId,
      transactionReference: reference,
      transactionId: Utility.getRandomInteger().toString().substring(1, 11),
      transactionType: enumType.transactionType.POS,
      transactionResource: enumType.serviceType.POS,
      paymentMethod: enumType.paymentMethod.POS,
      wallet,
      status: enumType.transactionStatus.SUCCESSFUL,
      serviceId: enumType.service.POS_WITHDRAWAL,
      serviceName: 'POS_WITHDRAWAL',
      initiatedAt: Date.now(),
      // senderName: '',
      // senderAccount: '',
      // senderAddress: '',
      // senderPhone: '',
      // senderId: user._id,
      recipientName: 'PAYFRONTIER LTD', // merchantName
      recipientAccount: 'Purchase',
      // recipientAddress: '',
      // recipientPhone,
      // recipientId: user._id,
      preWalletBalance: wallet.balance, // TODO,
      // postWalletBalance
      platform: enumType.platform.ITEX,
      commission: 0,
      charges,
      responseBody: JSON.stringify(request.body),
      client_transactionReference: RRN,
      client_statusCode: responseCode,
      message: responseDescription,
      paidAt: new Date(transactionTime),

      stampDuty,
      terminalId,
      totalPayable: amount,

      aggregatorUserId: posTerminal.aggregator ? posTerminal.aggregator : null,
    });

    /**
     * credit User wallet
     */
    const userWalletBal = (wallet.balance + (amount - parseInt(charges, 10)));

    await WalletRepository.insertWallet({ _id: wallet._id }, {
      balance: userWalletBal,
      'meta.updatedAt': Date.now(),
    }, { new: true, upsert: false });

    transaction.postWalletBalance = userWalletBal;
    await TransactionRepository.TransactionSave(transaction);

    /**
     * Save POS notification
     */
    await this.savePOSNotificationItex(request, transaction);

    // TODO - DONT GIVE COMMISSION TO AGG AT THIS STAGE FOR SETTLEMENT ISSUE
    // TODO - EOD SETTLEMENT TO GET DAILY VOLUME BY AGG
    // if (posTerminal.assignedToAggregator) {
    //   if (posTerminal.aggregator && posTerminal.issueAggregatorCommission === true) {
      
    //     const aggregatorCommission = (AppConstant.POS_AGGREGATOR_COMMISSION_PERCENT * amount) / 100;
    //     if (Math.round(aggregatorCommission) > 0) {
    //       Pubsub.emit('issue_aggregator_pos_commission', {
    //         transaction,
    //         posTerminal,
    //         commission: aggregatorCommission,
    //       });
    //     }
    //   }
    // }
    Pubsub.emit('new_pos_notification', { transaction, notification: request.body, posTerminal })

    return Utility.buildResponse({ data: request.body, message: 'Acknowledged' });
  },

  /**
   * posChargeRubies
   * @param {Number} amount
   * @todo - RUBIES DETERMINE CHARGE
   */
  async posChargeRubies(amount: number) {
    let charges = 0;
    let stampDuty = 0

    if ((amount > 0) && (amount <= 5500)) {
      charges = 35;
      
    } else if ((amount > 5500) && (amount < 10000)) {
      charges = 60;
      
    } else if ((amount >= 10000) && (amount < 20000)) {
        charges = 120;
        
    } else if ((amount >= 20000) && (amount < 100000)) {
        charges = 200;
        
    // } else if ((amount >= 100000) && (amount <= 250000)) {
    } else if ((amount >= 100000) && (amount <= 200000)) {
      charges = 500;
      
    } else {
      charges = 1000;
    }
    
    return {
      charges,
      stampDuty,
    };
  },
  /**
   * posNotificationRubies
   * @param {*} request
   * @public
   */
  async posNotificationRubies(request) {
    const {
      TransactionReference,
      CreditAccount,
      PaymentDate,
      Reference,
      Fee,
      Amount,
      STAN,
      StatusCode,
      TransactionID,
      Type,
      StatusDescription,
      Currency,
      RetrievalReferenceNumber,
      TerminalID,
      CustomerName,
    } = request.body;

      // ENSURE AUTHORIZATION HERE
      if (request.headerKey !== RUBIES_POS_KEY) {
        throw new UnauthorizedError('Invalid Authorization!');
      }

      if (StatusCode !== 'SUCCESS') {
        Utility.buildResponse({ message: 'Ignored' });
      }

      const posTerminal = await POSTerminalRepository.findOnePOS({ terminalId: TerminalID });
      if (!posTerminal) {
        throw new NotFoundError('Terminal not found');
      }
  
      if (posTerminal.blocked) {
        throw new NotFoundError('Terminal blocked');
      }
  
      const amount = Number(Amount);

      // Dont exceed limit
      if (amount > posTerminal.transactionLimit) {
        throw new BadRequestError('Transaction limit exceeded');
      }

      /**
       * Don't duplicate transactions
       * @desc - check if transaction exist in POS notifications
       */
      // TODO - RUBIES RRN ISNT UNIQUE, USE Reference
      
      // const transactionExist = await POSNotificationRepository.findOne({ retrievalReferenceNumber: RetrievalReferenceNumber });
      // if (transactionExist) {
      //   throw new BadRequestError('Duplicate RetrievalReferenceNumber');
      // }
      
      const transactionExist = await POSNotificationRepository.findOne({ transactionReference: TransactionReference });
      if (transactionExist) {
        throw new BadRequestError('Duplicate TransactionReference');
      }
      

      if (!posTerminal.user) {
        throw new BadRequestError('User not attached to terminal');
      }

      const wallet = await WalletRepository.getWalletByUserId(posTerminal.user._id);
      if (!wallet) {
        throw new BadRequestError('Wallet not attached to terminal');
      }

      const reference = await Utility.generateTrxReference();


      // TODO - RUBIES CHARGE STRUCTURE DIFFERENT
      let { charges, stampDuty } = await this.posChargeRubies(amount);
      
      // SET RATE FOR CHARGE BASE ON TERMINAL terminalConcessionCharge
      // if (posTerminal.terminalConcessionCharge) {
      //   charges = await this.getTerminalConcessionCharge(amount, posTerminal.terminalConcessionCharge)
      // }

      charges = Math.floor(charges); // Floor to remove extra fraction

      const transaction = await TransactionRepository.TransactionCreate({
        narration: 'POS Purchase',
        serviceType: enumType.serviceType.POS,
        amount,
        user: posTerminal.user._id,
        userId: posTerminal.user.userId,
        transactionReference: reference,
        transactionId: Utility.getRandomInteger().toString().substring(1, 11),
        transactionType: enumType.transactionType.POS,
        transactionResource: enumType.serviceType.POS,
        paymentMethod: enumType.paymentMethod.POS,
        wallet,
        status: enumType.transactionStatus.SUCCESSFUL,
        serviceId: enumType.service.POS_WITHDRAWAL,
        serviceName: 'POS_WITHDRAWAL',
        initiatedAt: Date.now(),
        // senderName: '',
        // senderAccount: '',
        // senderAddress: '',
        // senderPhone: '',
        // senderId: user._id,
        recipientName: 'PAYFRONTIER LTD', // merchantName
        recipientAccount: 'Purchase',
        // recipientAddress: '',
        // recipientPhone,
        // recipientId: user._id,
        preWalletBalance: wallet.balance, // TODO,
        // postWalletBalance
        platform: enumType.platform.RUBIES,
        commission: 0,
        charges,
        responseBody: JSON.stringify(request.body),
        client_transactionReference: TransactionReference,
        client_statusCode: StatusCode,
        message: StatusDescription,
        paidAt: new Date(PaymentDate),
  
        stampDuty,
        terminalId: TerminalID,
        totalPayable: amount,
  
        aggregatorUserId: posTerminal.aggregator ? posTerminal.aggregator : null,
      });
      
       /**
       * credit User wallet
       */
      const userWalletBal = (wallet.balance + (amount - parseInt(charges, 10)));

      await WalletRepository.insertWallet({ _id: wallet._id }, {
        balance: userWalletBal,
        'meta.updatedAt': Date.now(),
      }, { new: true, upsert: false });

      transaction.postWalletBalance = userWalletBal;
      await TransactionRepository.TransactionSave(transaction);

      /**
       * Save POS notification
       */
      await this.savePOSNotificationRubies(request, transaction);

      // TODO - DONT GIVE COMMISSION TO AGG AT THIS STAGE FOR SETTLEMENT ISSUE
      // TODO - EOD SETTLEMENT TO GET DAILY VOLUME BY AGG

      Pubsub.emit('new_pos_notification', { transaction, notification: request.body, posTerminal })

      return Utility.buildResponse({ data: request.body, message: 'Acknowledged' });
  },

  /**
   * posNotificationaccelerex
   * @param {*} request
   */
  async posNotificationAccelerex(request) {},

  /**
   * posNotificationOpay
   * @param {*} request
   */
  async posNotificationOpay(request) {},

  /**
   * savePOSNotificationItex
   * @param {*} request
   */
  async savePOSNotificationItex(request, transaction) {
    const {
      MTI,
      amount,
      terminalId,
      responseCode,
      responseDescription,
      PAN,
      RRN,
      STAN,
      authCode,
      transactionTime,
      reversal,
      merchantId,
      merchantName,
      merchantAddress,
      rrn,
    } = request.body;

    const transactionExist = await POSNotificationRepository.findOne({ retrievalReferenceNumber: RRN });
    if (!transactionExist) {
      // Save the notification and we'll handle the rest from there
      await POSNotificationRepository.createPOSNotification({
        amount,
        currency: 'NGN',
        customerName: merchantName,
        paymentDate: transactionTime,
        // reference: '',
        retrievalReferenceNumber: RRN,
        statusCode: responseCode,
        statusDescription: responseDescription,
        transactionReference: '',
        type: 'Purchase',
        reverse: false,
        settle: true,
        // transactionNumber,
        terminalId,
        transaction,
        notificationBody: JSON.stringify(request.body),
      });
    }
  },

  /**
   * savePOSNotificationRubies
   * @param {*} request 
   * @param {*} transaction 
   */
  async savePOSNotificationRubies(request, transaction) {
    const {
      TransactionReference,
      CreditAccount,
      PaymentDate,
      Reference,
      Fee,
      Amount,
      STAN,
      StatusCode,
      TransactionID,
      Type,
      StatusDescription,
      Currency,
      RetrievalReferenceNumber,
      TerminalID,
      CustomerName,
    } = request.body;


    const transactionExist = await POSNotificationRepository.findOne({ 
      // retrievalReferenceNumber: RetrievalReferenceNumber,
      transactionReference: TransactionReference
    });
    if (!transactionExist) {
      await POSNotificationRepository.createPOSNotification({
        amount: Number(Amount),
        currency: Currency,
        customerName: CustomerName ? CustomerName : 'PAYFRONTIER LTD',
        paymentDate: new Date(PaymentDate),
        reference: Reference,
        retrievalReferenceNumber: RetrievalReferenceNumber,
        statusCode: StatusCode,
        statusDescription: StatusDescription,
        transactionReference: TransactionReference,
        type: Type ? Type : 'Purchase',
        reverse: false,
        settle: true,
        transactionId: Number(TransactionID),
        terminalId: TerminalID,
        transaction,
        notificationBody: JSON.stringify(request.body),
      });
    }

  },
};

// RUBIES
  // {
  //     "TransactionReference": "1228480/2HIG0106_000000000033_000033_16-Oct-2020",
  //     "CreditAccount": "0000000008",
  //     "PaymentDate": "16-Oct-2020",
  //     "Reference": "1228480/2HIG0106_000000000033_000033_16-Oct-2020",
  //     "Fee": "25.0",
  //     "Amount": "10.0000",
  //     "STAN": "000033",
  //     "StatusCode": "SUCCESS",
  //     "TransactionID": "1228480",
  //     "Type": "Purchase",
  //     "StatusDescription": "Approved or completed successfully",
  //     "Currency": "NGN",
  //     "RetrievalReferenceNumber": "000000000033",
  //     "TerminalID": "2HIG0106",
  //     "CustomerName": "506124****8770"
  //   }
    
// {
//   "MTI":"0200",
//   "amount":750000,
//   "terminalId":"3020UH25",
//   "responseCode":"00",
//   "responseDescription": "Approved",
//   "PAN":"437762XXXXXX8921",
//   "RRN":"123456789547",
//   "STAN":"070246",
//   "authCode":"447098",
//   "transactionTime":"2020-08-19T08:06:24.716Z",
//   "reversal":false,
//   "merchantId":"FBP579036356841",
//   "merchantName":"PAYFRONTIER LIMITED",
//   "merchantAddress":"ABUJA",
//   "rrn":"600653739367"
// }

// {
//   "amount":2000.0,
//   "currency":"NGN",
//   "type":"Purchase",
//   "transactionReference":"2070AL30-92908858326098-202026397",
//   "maskedPAN":"506100*********6271",
//   "cardScheme":"Verve",
//   "customerName":"me/Faith"
//   "statusCode":"00",
//   "retrievalReferenceNumber":"92908858326098",
//   "statusDescription":"Approved",
//   "paymentDate":"2019-08-10",
//   "additionalInformation":[],
//   "cardExpiry":"02/20",
//   "additionalProperties":{
//     "STAN":"12345",
//     "MerchantId":"2058LA015975330"
//     }
// }

