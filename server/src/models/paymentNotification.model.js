import mongoose from 'mongoose';

/**
 * Payment Notification Model
 */

const paymentNotificationSchema = new mongoose.Schema(
  {
    accountReference: { type: String },
    amountPaid: { type: Number },
    paidOn: { type: String },
    paymentDescription: { type: String },
    paymentReference: { type: String },
    paymentStatus: { type: String },
    totalPayable: { type: Number },
    transactionHash: { type: String },
    transactionReference: { type: String },
    notificationBody: { type: String },
    paymentMethod: { type: String },
    meta: {
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
    },
  },
  { usePushEach: true },
);

paymentNotificationSchema.index(
  { '$**': 'text' },
);

export default mongoose.model('PaymentNotification', paymentNotificationSchema);
