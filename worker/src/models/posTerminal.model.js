import mongoose from 'mongoose';
import { getObjectValues } from '../utils';
import { platform } from '../enumType';
import AppConstant from '../constant';
import uniqueValidator from 'mongoose-unique-validator';

/**
 * POS Terminal Model
 */

const posTerminalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    userId: { type: String }, // 'RQ08c47280-0905-11ea-a212-4f46d0790907'
    state: { type: String },
    lga: { type: String },
    address: { type: String },
    name: { type: String },
    phone: { type: String },
    serialNumber: { type: String },
    terminalId: {
      type: String,
      unique: true,
      index: true,
      trim: true,
      required: true, // new
    },
    partner: {
      type: String,
      enum: [...getObjectValues(platform)],
    },
    transactionLimit: { //All POS transaction limit should always be 500k unless changed. Independent from agent wallet limit
      type: Number,
      default: AppConstant.POS_TERMINAL_TRANSACTION_LIMIT,
    },
    dailyPosTransactionAmount: { type: Number, default: 0 }, // TODO - makes no sense // amount Per day of trx
    dailyPosTransactionDate: { type: Date }, // TODO - makes no sense

    aggregator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    assignedToAggregator: { type: Boolean, default: false },
    assignedToAggregatorOn: { type: Date },
    assignedToAggregatorBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    detachedFromAggregatorBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    detachedFromAggregatorOn: { type: Date },

    assignedToAgent: { type: Boolean, default: false },
    assignedToAgentOn: { type: Date },
    assignedToAgentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    detachedFromAgentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    detachedFromAgentOn: { type: Date },

    blocked: { type: Boolean, default: false },
    issueAggregatorCommission: { type: Boolean, default: false }, // TODO - NEW
    terminalConcessionCharge: { type: String, default: '0.7' }, // TODO - NEW

    aggregatorConcessionCharge: { type: String, default: '0' }, 
    meta: {
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
    },
  },
  { usePushEach: true },
);

posTerminalSchema.plugin(uniqueValidator, { message: '{PATH} already exists!' });

posTerminalSchema.methods.toJSON = function() {
  const obj = this.toObject();

  delete obj.__v;
  return obj;
};

posTerminalSchema.index(
  { '$**': 'text' },
);

export default mongoose.model('PosTerminal', posTerminalSchema);
