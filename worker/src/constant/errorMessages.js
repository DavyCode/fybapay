export const signupErrors = {
  undefinedFirstName: 'First Name is required',
  undefinedLastName: 'Last Name is required',
  invalidFirstName: 'Input first name with only alphabets',
};

export const signupVerifyErrors = {
  notFound: 'No pending verification found'
};

export const authorizationErrors = {
  undefinedToken:
    'Please make sure your request has an authorization header',
  invalidToken: 'Authorization Denied.'
};

export const paymentError = {
  insufficientBalance: 'Insufficient balance',
  insufficientCommissionBalance: 'Insufficient commission wallet balance',
  paymentRequired: 'Payment required'
}

export const walletError = {
  walletNotFound: 'Wallet not found'
}