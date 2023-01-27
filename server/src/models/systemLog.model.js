
import mongoose from 'mongoose';

const systemLogSchema = new mongoose.Schema(
  {
    event: { type: String },
    entity: { type: String },
    payload: { type: String },
    startedAt: { type: Date },
    origin: { type: String },
    meta: {
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
    },
  },
  { usePushEach: true },
);

export default mongoose.model('SystemLog', systemLogSchema);
