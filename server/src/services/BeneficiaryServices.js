// @flow

import BeneficiaryRepository from '../repository/BeneficiaryRepository';
import UserRepository from '../repository/UserRepository';
import { BadRequestError, InternalServerError, APIError, NotFoundError, ForbiddenError, NotAcceptableError } from '../utils/errors';
import Utility from '../utils';

export default {
  /**
   * findBeneficiaryById
   * @param {*} request
   */
  async findBeneficiaryById(request) {
    const beneficiary = await BeneficiaryRepository.findById(request.query.beneficiaryId);
    if (!beneficiary) { throw new NotFoundError('Beneficiary not found'); }
    return Utility.buildResponse({ data: beneficiary });
  },

  /**
   * getUserBeneficiary
   * @param {*} request
   */
  async getUserBeneficiary(request) {
    const user = await UserRepository.getUserById(request.user.id);
    if (!user) { throw new NotFoundError('User not found'); }
    const beneficiaries = await BeneficiaryRepository.getUserBeneficiary(request.user.id, request.query);
    if (!beneficiaries.data) { throw new NotFoundError('Beneficiaries not found'); }
    return Utility.buildResponse({ ...beneficiaries });
  },

  /**
   * getAllBeneficiaries
   * @param {*} request
   */
  async getAllBeneficiaries(request) {
    const beneficiaries = await BeneficiaryRepository.getAllBeneficiaries(request.query);
    if (!beneficiaries.data) { throw new NotFoundError('Beneficiaries not found'); }
    return Utility.buildResponse({ ...beneficiaries });
  },

  /**
   * createNewBeneficiary
   * @param {object} beneficiary
   */
  async createNewBeneficiary(beneficiary) {
    const beneficiaryExist = await BeneficiaryRepository.userBeneficiary(beneficiary.user, beneficiary.transactionType, beneficiary.accountNumber);
    if (!beneficiaryExist) {
      await BeneficiaryRepository.beneficiaryCreate({ ...beneficiary });
    }
  },
};
