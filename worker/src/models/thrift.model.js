import mongoose from 'mongoose';

const thriftSchema = new mongoose.Schema(
  {
    meta: {
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
    },
  },
  { usePushEach: true },
);

export default mongoose.model('Thrift', thriftSchema);
