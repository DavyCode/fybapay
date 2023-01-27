import mongoose from 'mongoose';

/**
 * POS Terminal Model
 */

const aggregatorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    /**
     * TODO We cannot store trx records here
     */
    // transactions: [{
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: 'Transaction',
    // }],
    // agents: [{
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: 'User',
    // }],
    aggregatorNumber: { type: String }, // FBAGG1289373
    meta: {
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
    },
  },
  { usePushEach: true },
);

aggregatorSchema.methods.toJSON = function() {
  const obj = this.toObject();

  delete obj.__v;
  return obj;
};

aggregatorSchema.index(
  { '$**': 'text' },
);

export default mongoose.model('Aggregator', aggregatorSchema);
