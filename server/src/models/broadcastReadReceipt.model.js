import mongoose from 'mongoose';
import { appType, appPlatforms, messageCategory, messageType } from '../enumType';
import { getObjectValues } from '../utils';

/**
 * Broadcast ReadReceipt Model
 */

const broadcastReadReceiptSchema = new mongoose.Schema(
  {
    messageToken: { type: String }, // bk3RNwTe3H0:CI2k_HHwgIpoDKCIZvvDMExUdFQ3P1
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    message: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
    messageReadOnWhichDevice: {
      type: String,
      enum: [...getObjectValues(appType)], // ios android web
      default: 'NULL',
    },
    isRead: { type: Boolean, default: false },
    isReadAt: { type: Date },
    meta: {
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
    },
  },
  { usePushEach: true },
);

broadcastReadReceiptSchema.methods.toJSON = function() {
  const obj = this.toObject();

  delete obj.__v;
  return obj;
};

export default mongoose.model('BroadcastReadReceipt', broadcastReadReceiptSchema);
