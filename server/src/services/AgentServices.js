// @flow

import { BadRequestError, PaymentRequiredError, NotFoundError, InternalServerError, ForbiddenError, NotAcceptableError, UnauthorizedError } from '../utils/errors';
import enumType from '../enumType';
import Utility from '../utils';
import Pubsub from '../events/userEventListeners';
import AgentRepository from '../repository/AgentRepository';
import UserRepository from '../repository/UserRepository';
import { generateAgentId } from '../utils/agentCounter';
import WalletRepository from '../repository/WalletRepository';

export default {
  /**
   * get all and search agent request
   * approve agent request
   */

  /**
  * getAllRequestAndSearch
  * @param {*} request
  */
  async getAllAgentRequestAndSearch(request) {
    const agentRequest = await AgentRepository.getAllAgentRequestAndSearch(request.query);
    if (!agentRequest.data) { throw new NotFoundError('Request not found') };
    return Utility.buildResponse({ ...agentRequest }); 
  },

  /**
   * approveAgent
   * @param {*} request
   */
  async approveAgent(request) {
    const admin = await UserRepository.getUserById(request.user.id);
    if (!admin) {
      throw new UnauthorizedError('Appropriate privilege required');
    }

    const agentRequest = await AgentRepository.findById(request.body.agentRequestId);
    if (!agentRequest) {
      throw new NotFoundError('Agent request not found');
    }

    if (!agentRequest.user.phone) { throw new NotFoundError('Something went wrong, user phone not found'); }
    const agentId = await generateAgentId(agentRequest.user.phone);

    if (agentRequest.user.agentApproved) {
      throw new BadRequestError('Agent request already approved');
    }

    const newAgent = await UserRepository.userInsert({ _id: agentRequest.user._id }, {
      agentId,
      Kyc: enumType.kycLevel.KYC_THREE,
      role: enumType.rolesType.AGENT,
      agentApproved: true,
      agentOnboardingDate: Date.now(),
      'meta.updatedAt': Date.now(),
    }, { new: true, upsert: false });

    await WalletRepository.insertWallet({ _id: agentRequest.user.wallet }, {
      limit: enumType.walletDailyLimit.KYC_THREE,
      'meta.updatedAt': Date.now(),
    }, { new: false, upsert: false });

    agentRequest.agentOnboardingDate = Date.now();
    agentRequest.agentApproved = true;
    agentRequest.agentId = agentId;
    agentRequest.agentApprovedBy = admin;
    agentRequest.meta.updatedAt = Date.now();
    await AgentRepository.saveAgentRequest(agentRequest);

    Pubsub.emit('new_agent_approved', newAgent);

    return Utility.buildResponse({ data: newAgent, message: 'Agent approved' });
  },

  /**
   * delistAgent
   * @param {*} request
   */
  async disapproveAgent(request) {
    const admin = await UserRepository.getUserById(request.user.id);
    if (!admin) {
      throw new UnauthorizedError('Appropriate privilege required');
    }

    const agentRequest = await AgentRepository.findById(request.body.agentRequestId);
    if (!agentRequest) {
      throw new NotFoundError('Agent request not found');
    }

    if (agentRequest.user.agentApproved !== true) {
      throw new BadRequestError('User is not an agent');
    }

    const newAgent = await UserRepository.userInsert({ _id: agentRequest.user._id }, {
      Kyc: enumType.kycLevel.KYC_TWO,
      role: enumType.rolesType.USER,
      agentApproved: false,
      // agentOnboardingDate: Date.now(),
      'meta.updatedAt': Date.now(),
    }, { new: true, upsert: false });

    await WalletRepository.insertWallet({ _id: agentRequest.user.wallet }, {
      limit: enumType.walletDailyLimit.KYC_TWO,
      'meta.updatedAt': Date.now()
    }, {new: false, upsert: false });

    agentRequest.agentApproved = false;
    agentRequest.meta.updatedAt = Date.now();
    await AgentRepository.saveAgentRequest(agentRequest);

    Pubsub.emit('agent_disapproved', newAgent);
    return Utility.buildResponse({ data: newAgent, message: 'Agent disapproved' });
  },

  /**
   * New agent request
   * @param {*} request
   */
  async newAgentRequest(request) {
    const { id } = request.user;
    const params = request.body;

    const user = await UserRepository.getUserById(request.user.id);
    if (!user) { throw new NotFoundError('User not found'); }
    if (user.agentApproved || user.role === 'agent' || user.role === 'superAgent') {
      throw new ForbiddenError('Agent already on-boarded, upgrade Kyc to upgrade account');
    }

    /**
     * Ensure user have been BVN verified
     */
    if (!user.isBVN_verified || !user.bank.bvn) {
      throw new ForbiddenError('Verify BVN to proceed');
    }

    /**
     * we need IDCARD
     */
    if (!user.idCard) {
      throw new BadRequestError('A valid Identity is required');
    }

    /**
     * check if user have existing request
     */
    const requestExist = await AgentRepository.findOne({ user: id });
    if (requestExist) { throw new NotAcceptableError('Pending request exist, contact support for assistance'); }

    const newAgent = await UserRepository.userInsert({ _id: id }, {
      ...params,
      'meta.updatedAt': Date.now(),
    }, { new: true, upsert: false });

    await AgentRepository.agentRequestCreate({
      ...params,
      user,
      idCard: user.idCard,
      prevRole: user.role,
    });

    Pubsub.emit('new_agent_request', newAgent);

    return Utility.buildResponse({ data: newAgent, message: 'Agent application received' });
  },
};
