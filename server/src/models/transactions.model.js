import mongoose from 'mongoose';
import { serviceType, paymentMethod, service, transactionStatus, transactionType, platform } from '../enumType';
import { getObjectValues, getObjectKeys } from '../utils';

/**
 * Transaction model
 */
const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    wallet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wallet',
    },
    userId: { type: String },
    amount: { type: Number },

    status: {
      type: String,
      enum: [...getObjectValues(transactionStatus)],
    },
    serviceType: {
      type: String,
      enum: [...getObjectValues(serviceType)],
    },
    serviceId: {
      type: String,
      enum: [...getObjectValues(service)],
    },
    serviceName: {
      type: String,
      enum: [...getObjectKeys(service)],
    },
    transactionReference: { type: String },
    client_transactionReference: { type: String }, // √√√
    client_paymentReference: { type: String },
    client_statusCode: { type: String }, // √√√
    transactionId: { type: String },
    transactionType: {
      type: String,
      enum: [...getObjectValues(transactionType)], // type of trx
    },
    paymentMethod: {
      type: String,
      // enum: [...getObjectValues(paymentMethod)]
    }, // allow other methods
    narration: { type: String },
    message: { type: String },
    initiatedAt: { type: Date, default: Date.now },
    paidAt: { type: Date },
    stampDuty: { type: Number, default: 0 }, // stamp duty fee of N50 on every transaction worth N1000 or more
    charges: { type: Number, default: 0 }, // trx charges
    recipientName: { type: String }, // √√√
    recipientAccount: { type: String }, // √√√
    recipientPhone: { type: String }, // √√√
    recipientAddress: { type: String },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    senderName: { type: String },
    senderAccount: { type: String }, // √√√
    senderPhone: { type: String }, // √√√
    senderAddress: { type: String },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    preWalletBalance: { type: Number }, // √√√
    postWalletBalance: { type: Number }, // √√√
    commission: { type: Number, default: 0 },
    platform: { type: String, enum: [...getObjectValues(platform)] }, // todo: enum
    responseBody: { type: String },

    // todo new
    // todo - use populate on trx repository
    commissionWallet: { // NOT REQUIRED
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CommissionWallet',
    },
    destinationTransactionRefunded: { // NOT REQUIRED
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
    },
    sourceTransactionRefunded: { // NOT REQUIRED
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
    },
    isTransactionRefunded: { type: Boolean, default: false },
    isRefundedTransaction: { type: Boolean, default: false },
    refundedCharges: { type: Number, default: 0 },

    aggregatorUserId: { // TODO - new
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    terminalId: { type: String }, // TODO - new
    totalPayable: { type: Number },

    token: { type: String }, // TODO for electricity

    meta: {
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
    },
  },
  { usePushEach: true },
);

transactionSchema.methods.toJSON = function() {
  var obj = this.toObject();

  delete obj.__v;
  return obj;
};

transactionSchema.index(
  { '$**': 'text' },
);

export default mongoose.model('Transaction', transactionSchema);
