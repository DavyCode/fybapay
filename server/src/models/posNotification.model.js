import mongoose from 'mongoose';

/**
 * POS Terminal Model
 */

const posNotificationSchema = new mongoose.Schema(
  {
    amount: { type: Number },
    currency: { type: String },
    customerName: { type: String },
    paymentDate: { type: Date },
    retrievalReferenceNumber: { type: String },
    statusCode: { type: String },
    statusDescription: { type: String },
    transactionReference: { type: String },
    type: { type: String },
    reverse: { type: Boolean },
    settle: { type: Boolean },
    terminalId: { type: String },
    notificationBody: { type: String },
    transaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
    },

    transactionId: { type: Number },
    reference: { type: String },

    meta: {
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
    },
  },
  { usePushEach: true },
);

posNotificationSchema.methods.toJSON = function() {
  const obj = this.toObject();

  delete obj.__v;
  return obj;
};

posNotificationSchema.index(
  { '$**': 'text' },
);

export default mongoose.model('PosNotification', posNotificationSchema);
