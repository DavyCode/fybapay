import mongoose from 'mongoose';


const cacheBvnSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    // userRegisteredPhone: { type: String, trim: true },
    bvn: { type: String, trim: true },
    first_name: { type: String, trim: true },
    last_name: { type: String, trim: true },
    dob: { type: String, trim: true },
    formatted_dob: { type: String, trim: true },
    mobile: { type: String, trim: true },
    bvnRequestCount: { type: Number, default: 1 },
    bvnRequestTimer: { type: Date },
    verified: { type: Boolean, default: false },
    meta: {
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
    },
  },
  { usePushEach: true },
);

cacheBvnSchema.index(
  { '$**': 'text' },
);

export default mongoose.model('CacheBvn', cacheBvnSchema);

// resolvedBvn: {
//   status: true,
//   message: 'BVN resolved',
//   data: {
//     first_name: 'PAUL',
//     last_name: 'AZEMOH',
//     dob: '19-Oct-90',
//     formatted_dob: '1990-10-19',
//     mobile: '08132078657',
//     bvn: '22247907593'
//   },
//   meta: { calls_this_month: 1, free_calls_left: 9 }
// }