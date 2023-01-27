import mongoose from 'mongoose';

const AgentCounterSchema = new mongoose.Schema({
  count: Number,
  counter: {
    unique: true,
    type: String,
    required: true,
  },
  meta: {
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
});

export default mongoose.model('AgentCounter', AgentCounterSchema);
