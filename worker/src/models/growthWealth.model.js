import mongoose from 'mongoose';


const growthSchema = new mongoose.Schema(
  {
    meta: {
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
    },
  },
  { usePushEach: true },
);


export default mongoose.model('Growth', growthSchema);