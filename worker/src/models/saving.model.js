import mongoose from "mongoose";

const Schema = mongoose.Schema;

const savingSchema = new Schema(
  {
    meta: {
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now }
    }
  },
  { usePushEach: true })

export default mongoose.model("Saving", savingSchema);

