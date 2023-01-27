// /**
//  * Fund wallet Log
//  * Holds log of ops notification received for a wallet
//  */

// import mongoose from 'mongoose';

// const growthSchema = new mongoose.Schema(
//   {
//     wallet: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'Wallet',
//     },
//     meta: {
//       createdAt: { type: Date, default: Date.now },
//       updatedAt: { type: Date, default: Date.now },
//     },
//   },
//   { usePushEach: true })

// export default mongoose.model('Growth', growthSchema);
