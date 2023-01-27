import userController from '../controllers/user.controller';
import agentController from '../controllers/agent.controller';
import {
  LoginValidator,
  ValidatePhone,
  newProfileValidator,
  resetPasswordValidator,
  verifyBankValidator,
  verifyBvnValidator,
  bvnCodeValidator,
  phoneTokenValidator,
  updateProfileValidator,
  agentOnboardingValidator,
  ConfirmPinValidator,
  changePassValidator,
} from '../validations/inputValidator';
import ensureAuth from '../middleware/ensureAuth';
import { limitRouteRequest, limitPaymentRequest } from '../middleware/rateLimiter';
import { API_BASE_URI } from '../config/env';
import formatPhone from '../utils/formatPhone';


export default (router) => {
  /**
   * @swagger
   * /users/onboarding:
   *   post:
   *     tags:
   *       - Users
   *     name: Register
   *     summary: Register a new user
   *     consumes:
   *       - application/json
   *     produces:
   *       - application/json
   *     parameters:
   *       - in: body
   *         name: phone
   *         description: Register new user
   *         schema:
   *           type: object
   *           properties:
   *             phone:
   *               type: string
   *               example: 08066773344
   *           required:
   *             - phone
   *     responses:
   *       '403':
   *         description: FORBIDDEN
   *         schema:
   *           type: object
   *           properties:
   *             status:
   *                type: string
   *                example: failure
   *             message:
   *                type: string
   *                example: User exist please login instead
   *       '406':
   *         description: NOT ACCEPTABLE
   *         schema:
   *           type: object
   *           properties:
   *             status:
   *                type: string
   *                example: failure
   *             message:
   *                type: string
   *                example: Wait after 10 mins to request new verification pin
   *       '200':
   *         description: OK
   *         schema:
   *           type: object
   *           properties:
   *             status:
   *                type: string
   *                example: success
   *             message:
   *                type: string
   *                example: Otp sent
   */
  router.post(`${API_BASE_URI}/users/get_phone_otp`, ValidatePhone, formatPhone, userController.authOtpVerify);

  /**
   * @swagger
   * /users/authorize:
   *   post:
   *     tags:
   *       - Users
   *     name: Login
   *     summary: Authorize user
   *     consumes:
   *       - application/json
   *     produces:
   *       - application/json
   *     parameters:
   *       - in: body
   *         name: phone and password
   *         description: Generate login token
   *         schema:
   *           type: object
   *           properties:
   *             phone:
   *               type: string
   *               example: 08066773344
   *             password:
   *               type: string
   *               format: password
   *               example: '12345'
   *           required:
   *             - phone
   *             - password
   *     responses:
   *       '404':
   *         description: NOT FOUND
   *         schema:
   *           type: object
   *           properties:
   *             status:
   *                type: string
   *                example: failure
   *             message:
   *                type: string
   *                example: User not found
   *       '400':
   *         description: BAD REQUEST
   *         schema:
   *           type: object
   *           properties:
   *             status:
   *                type: string
   *                example: failure
   *             message:
   *                type: string
   *                example: Login failed, wrong information supplied
   *       '200':
   *         description: OK
   *         schema:
   *           type: object
   *           properties:
   *             status:
   *                type: string
   *                example: success
   *             data:
   *               type: object
   *               properties:
   *                  authorization:
   *                     type: string
   *                     example: 'gsgdsgdsuyigdbcbskcksbjbcsckbs'
   *                  token_type:
   *                     type: string
   *                     example: bearer
   *                  user:
   *                     type: object
   *                     example:
   *                       $ref: '#/definitions/User'
   *                  expiresIn:
   *                     type: string
   *                     example: 3600000
   */
  router.post(`${API_BASE_URI}/users/authorize`, LoginValidator, formatPhone, userController.authenticateUser);

  /**
   * @swagger
   * /users/confirm_phone_otp:
   *   post:
   *     tags:
   *       - Users
   *     name: Verify phone
   *     summary: Verify user phone
   *     consumes:
   *       - application/json
   *     produces:
   *       - application/json
   *     parameters:
   *       - in: body
   *         name: verifyPhoneToken
   *         description: Token to verify a user phone number
   *         schema:
   *           type: object
   *           properties:
   *             verifyPhoneToken:
   *               type: string
   *               example: '77344'
   *           required:
   *             - verifyPhoneToken
   *     responses:
   *       '404':
   *         description: NOT FOUND
   *         schema:
   *           type: object
   *           properties:
   *             status:
   *                type: string
   *                example: failure
   *             message:
   *                type: string
   *                example: Wrong pin supplied
   *       '200':
   *         description: OK
   *         schema:
   *           type: object
   *           properties:
   *             status:
   *                type: string
   *                example: success
   *             message:
   *                type: string
   *                example: Successfully verified account
   *             data:
   *                type: object
   *                example:
   *                  $ref: '#/definitions/User'
   */
  router.post(`${API_BASE_URI}/users/confirm_phone_otp`, phoneTokenValidator, userController.confirmAuthOtpVerify);

  /**
   * @swagger
   * /users/profile:
   *   post:
   *     tags:
   *       - Users
   *     name: Profile creation
   *     summary: Create user profile and reserved account
   *     consumes:
   *       - application/json
   *     produces:
   *       - application/json
   *     parameters:
   *       - in: body
   *         name: User profile object
   *         description: Create user profile
   *         schema:
   *           type: object
   *           properties:
   *             email:
   *               type: string
   *               format: email
   *             firstName:
   *               type: string
   *               example: 'John'
   *             lastName:
   *               type: string
   *               example: 'Doe'
   *             userId:
   *               type: string
   *               example: 'RQ08c47280-0905-11ea-a212-4f46d0790907'
   *             password:
   *               type: string
   *               format: password
   *               example: '12345'
   *             confirmPassword:
   *               type: string
   *               format: password
   *               example: '12345'
   *           required:
   *             - email
   *             - firstName
   *             - lastName
   *             - userId
   *     responses:
   *       '404':
   *         description: NOT FOUND
   *         schema:
   *           type: object
   *           properties:
   *             status:
   *                type: string
   *                example: failure
   *             message:
   *                type: string
   *                example: User not found
   *       '403':
   *         description: FORBIDDEN
   *         schema:
   *           type: object
   *           properties:
   *             status:
   *                type: string
   *                example: failure
   *             message:
   *                type: string
   *                example: User profile already exist
   *       '200':
   *         description: OK
   *         schema:
   *           type: object
   *           properties:
   *             status:
   *                type: string
   *                example: success
   *             message:
   *                type: string
   *                example: User profile created
   *             data:
   *                type: object
   *                example:
   *                  $ref: '#/definitions/User'
   */
  router.post(`${API_BASE_URI}/users/onboarding`,
    limitRouteRequest,
    newProfileValidator,
    formatPhone,
    userController.createNewUserAccount,
  );

  /**
   * @swagger
   * /users/profile:
   *   put:
   *     tags:
   *       - Users
   *     name: Profile update
   *     summary: Update user profile
   *     consumes:
   *       - application/json
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: body
   *         in: body
   *         description: Update user profile
   *         schema:
   *           type: object
   *           properties:
   *             email:
   *               type: string
   *               format: email
   *             firstName:
   *               type: string
   *               example: 'John'
   *             lastName:
   *               type: string
   *               example: 'Doe'
   *             username:
   *               type: string
   *               example: 'Johndoe007'
   *             dateOfBirth:
   *               type: date
   *               example: '2019-12-21'
   *             gender:
   *               type: string
   *               example: 'Male'
   *             address:
   *               type: string
   *               example: 'House No 19, bujumbura'
   *             street:
   *               type: string
   *               example: '441 street'
   *             lga:
   *               type: string
   *               example: 'brundi'
   *             state:
   *               type: string
   *               example: 'Carlifonia'
   *           required:
   *             - email
   *             - firstName
   *             - lastName
   *             - username
   *             - dateOfBirth
   *             - gender
   *             - address
   *             - street
   *             - lga
   *             - state
   *     responses:
   *       '404':
   *         description: NOT FOUND
   *         schema:
   *           type: object
   *           properties:
   *             status:
   *                type: string
   *                example: failure
   *             message:
   *                type: string
   *                example: User not found
   *       '200':
   *         description: OK
   *         schema:
   *           type: object
   *           properties:
   *             status:
   *                type: string
   *                example: success
   *             message:
   *                type: string
   *                example: Successfully updated user data
   *             data:
   *                type: object
   *                example:
   *                  $ref: '#/definitions/User'
   */
  router.put(`${API_BASE_URI}/users/profile`, ensureAuth, updateProfileValidator, userController.updateUserData);

  /**
   * @swagger
   * /users/profile:
   *   get:
   *     tags:
   *       - Users
   *     name: Profile
   *     summary: Fetch user profile
   *     consumes:
   *       - application/json
   *     produces:
   *       - application/json
   *     parameters:
   *       - in: header
   *         name: authorization
   *         description: Bearer authorization
   *         schema:
   *           type: string
   *           format: uuid
   *         required: true
   *     responses:
   *       '404':
   *         description: NOT FOUND
   *         schema:
   *           type: object
   *           properties:
   *             status:
   *                type: string
   *                example: failure
   *             message:
   *                type: string
   *                example: User not found
   *       '200':
   *         description: OK
   *         schema:
   *           type: object
   *           properties:
   *             status:
   *                type: string
   *                example: success
   *             data:
   *                type: object
   *                example:
   *                  $ref: '#/definitions/User'
   */
  router.get(`${API_BASE_URI}/users/profile`, ensureAuth, userController.getUserProfile);

  /**
   * @swagger
   * /users/password_forgot:
   *   post:
   *     tags:
   *       - Users
   *     name: Forgot password
   *     summary: Get reset password pin
   *     consumes:
   *       - application/json
   *     produces:
   *       - application/json
   *     parameters:
   *       - in: body
   *         name: phone
   *         description: Get reset password pin
   *         schema:
   *           type: object
   *           properties:
   *             phone:
   *               type: string
   *               example: 08066773344
   *           required:
   *             - phone
   *     responses:
   *       '404':
   *         description: NOT FOUND
   *         schema:
   *           type: object
   *           properties:
   *             status:
   *                type: string
   *                example: failure
   *             message:
   *                type: string
   *                example: User not found
   *       '406':
   *         description: NOT ACCEPTABLE
   *         schema:
   *           type: object
   *           properties:
   *             status:
   *                type: string
   *                example: failure
   *             message:
   *                type: string
   *                example: Wait for 10 mins to request new verification pin
   *       '200':
   *         description: OK
   *         schema:
   *           type: object
   *           properties:
   *             status:
   *                type: string
   *                example: success
   *             message:
   *                type: string
   *                example: Password reset pin sent
   */
  router.post(`${API_BASE_URI}/users/password_forgot`, ValidatePhone, formatPhone, userController.getResetPasswordPin);

  /**
   * @swagger
   * /users/password_reset:
   *   post:
   *     tags:
   *       - Users
   *     name: Password reset
   *     summary: Reset user password
   *     consumes:
   *       - application/json
   *     produces:
   *       - application/json
   *     parameters:
   *       - in: body
   *         name: password
   *         description: New password
   *         schema:
   *           type: object
   *           properties:
   *             resetPasswordPin:
   *               type: string
   *               example: '77344'
   *             password:
   *               type: string
   *               format: password
   *               example: '12345'
   *           required:
   *             - resetPasswordPin
   *             - password
   *     responses:
   *       '404':
   *         description: NOT FOUND
   *         schema:
   *           type: object
   *           properties:
   *             status:
   *                type: string
   *                example: failure
   *             message:
   *                type: string
   *                example: User not found
   *       '200':
   *         description: OK
   *         schema:
   *           type: object
   *           properties:
   *             status:
   *                type: string
   *                example: success
   *             message:
   *                type: string
   *                example: Password change successfull
   *             data:
   *                type: object
   *                example:
   *                  $ref: '#/definitions/User'
   */
  router.post(`${API_BASE_URI}/users/password_reset`, resetPasswordValidator, userController.resetPassword);

  /**
   * @swagger
   * /users/bank:
   *   put:
   *     tags:
   *       - Users
   *     name: Update bank
   *     summary: Update user bank info
   *     consumes:
   *       - application/json
   *     produces:
   *       - application/json
   *     parameters:
   *       - in: body
   *         name: bankAccountNumber & bankCode
   *         description: Update user bank
   *         schema:
   *           type: object
   *           properties:
   *             bankCode:
   *               type: string
   *               example: '058'
   *             bankAccountNumber:
   *               type: string
   *               example: '021461800'
   *           required:
   *             - bankCode
   *             - bankAccountNumber
   *     responses:
   *       '404':
   *         description: NOT FOUND
   *         schema:
   *           type: object
   *           properties:
   *             status:
   *                type: string
   *                example: failure
   *             message:
   *                type: string
   *                example: Bank does not exist
   *       '400':
   *         description: BAD REQUEST
   *         schema:
   *           type: object
   *           properties:
   *             status:
   *                type: string
   *                example: failure
   *             message:
   *                type: string
   *                example: Could not verify bank account at this 
   *       '200':
   *         description: OK
   *         schema:
   *           type: object
   *           properties:
   *             status:
   *                type: string
   *                example: success
   *             message:
   *                type: string
   *                example: 'Bank update successful'
   *             data:
   *               type: object
   *               properties:
   *                  user:
   *                     type: object
   *                     example:
   *                       $ref: '#/definitions/User'
   */
  router.put(`${API_BASE_URI}/users/bank`, ensureAuth, verifyBankValidator, userController.updateUserBankData);

  /**
   * @swagger
   * /users/bvn:
   *   put:
   *     tags:
   *       - Users
   *     name: Update user bvn
   *     summary: Update user bank verification number
   *     consumes:
   *       - application/json
   *     produces:
   *       - application/json
   *     parameters:
   *       - in: body
   *         name: bvn
   *         description: User issued bank verification number
   *         schema:
   *           type: object
   *           properties:
   *             bvn:
   *               type: string
   *               example: '05891283667'
   *           required:
   *             - bvn
   *     responses:
   *       '404':
   *         description: NOT FOUND
   *         schema:
   *           type: object
   *           properties:
   *             status:
   *                type: string
   *                example: failure
   *             message:
   *                type: string
   *                example: User not found
   *       '406':
   *         description: NOT ACCEPTABLE
   *         schema:
   *           type: object
   *           properties:
   *             status:
   *                type: string
   *                example: failure
   *             message:
   *                type: string
   *                example: User already verified
   *       '403':
   *         description: FORBIDDEN
   *         schema:
   *           type: object
   *           properties:
   *             status:
   *                type: string
   *                example: failure
   *             message:
   *                type: string
   *                example: User wallet do not have enough funds
   *       '400':
   *         description: BAD REQUEST
   *         schema:
   *           type: object
   *           properties:
   *             status:
   *                type: string
   *                example: failure
   *             message:
   *                type: string
   *                example: Could not resolve bvn
   *       '200':
   *         description: OK
   *         schema:
   *           type: object
   *           properties:
   *             status:
   *                type: string
   *                example: success
   *             message:
   *                type: string
   *                example: 'BVN confirmation code sent'
   */
  router.put(`${API_BASE_URI}/users/bvn`, ensureAuth, limitPaymentRequest, verifyBvnValidator, userController.updateUserBvn);

  /**
   * @swagger
   * /users/bvn/confirm:
   *   post:
   *     tags:
   *       - Users
   *     name: Confirm Bvn
   *     summary: Comfirm Bvn via user phone
   *     consumes:
   *       - application/json
   *     produces:
   *       - application/json
   *     parameters:
   *       - in: body
   *         name: bvnVerifyCode
   *         description: Code to verify a user Bvn
   *         schema:
   *           type: object
   *           properties:
   *             bvnVerifyCode:
   *               type: string
   *               example: '7344'
   *           required:
   *             - bvnVerifyCode
   *     responses:
   *       '404':
   *         description: NOT FOUND
   *         schema:
   *           type: object
   *           properties:
   *             status:
   *                type: string
   *                example: failure
   *             message:
   *                type: string
   *                example: Wrong code supplied
   *       '200':
   *         description: OK
   *         schema:
   *           type: object
   *           properties:
   *             status:
   *                type: string
   *                example: success
   *             message:
   *                type: string
   *                example: Successfully verified bvn
   *             data:
   *                type: object
   *                example:
   *                  $ref: '#/definitions/User'
   */
  router.get(`${API_BASE_URI}/users/bvn/confirm`, ensureAuth, userController.confirmBvnVerify);

  /**
   * swagger
   * /users/agent/onboarding:
   *   post:
   *     tags:
   *       - Users
   *     name: Agent onboarding
   *     summary: Onboard new agent
   *     consumes:
   *       - application/json
   *     produces:
   *       - application/json
   *     parameters:
   *       - in: body
   */
  router.put(`${API_BASE_URI}/users/agent/onboarding`, ensureAuth, agentOnboardingValidator, agentController.agentOnboarding);

  /**
   * change user password
   */
  router.post(`${API_BASE_URI}/users/change_user_password`, ensureAuth, changePassValidator, userController.changeUserPassword);
};
