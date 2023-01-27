import mongoose from 'mongoose';

/**
 * POS Terminal Model
 */

const aggregatorEODSchema = new mongoose.Schema(
  {
    aggregator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    transactions: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
    }],
    cleared: { type: Boolean, default: false },
    aggregatorConcessionChargeApplied: { type: String, default: '0' },
    totalEarning: { type: Number, default: 0 },
    totalPayable: { type: Number, default: 0 },
    payoutAmount: { type: Number, default: 0 },
    outstandingBalance: { type: Number, default: 0 },
    payoutDate: { type: Date },
    eodDate: { type: String },
    meta: {
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
    },
  },
  { usePushEach: true },
);

aggregatorEODSchema.methods.toJSON = function() {
  const obj = this.toObject();

  delete obj.__v;
  return obj;
};

aggregatorEODSchema.index(
  { '$**': 'text' },
);

export default mongoose.model('AggregatorEOD', aggregatorEODSchema);
