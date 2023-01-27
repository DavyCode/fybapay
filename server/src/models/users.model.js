import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { rolesType, kycType, signupSource } from '../enumType';
import { getObjectValues } from '../utils';
import uniqueValidator from 'mongoose-unique-validator';

/**
 * User model
 */

/**
 * swagger
 * definitions:
 *   User:
 *     type: object
 *     properties:
 *       _id:
 *         type: string
 *       first_name:
 *         type: string
 *       last_name:
 *         type: string
 *       email:
 *         type: string
 *       username:
 *         type: string
 *       role:
 *         type: string
 *       password_hash:
 *         type: string
 *         format: password
 *       verifyToken:
 *         type: string
 *       resetPasswordToken:
 *         type: string
 *       resetPasswordExpires:
 *         type: string
 *         format: date-time
 *       meta:
 *         type: object
 *         properties:
 *           created_at:
 *             type: string
 *             format: date-time
 *           updated_at:
 *             type: string
 *             format: date-time
 */

const userSchema = new mongoose.Schema(
  {
    profileImage: { type: String, default: 'https://res.cloudinary.com/davycode/image/upload/v1590239023/avatar.png', trim: true },
    utilityBill: {
      type: String,
      trim: true,
      // default: 'https://res.cloudinary.com/davycode/image/upload/v1590239023/avatar.png' 
    },
    idCard: {
      type: String,
      trim: true,
      // default: 'https://res.cloudinary.com/davycode/image/upload/v1590239023/avatar.png' 
    },
    companyCertificate: {
      type: String,
      trim: true,
      // default: 'https://res.cloudinary.com/davycode/image/upload/v1590239023/avatar.png' 
    },

    agentApproved: { type: Boolean, default: false },
    agentOnboardingDate: { type: Date },
    // agentApprovalDate: { type: Date },
    agentId: { type: String }, // 'RQ1567053943772', // todo - display on app
    businessName: { type: String, trim: true },
    businessState: { type: String, trim: true },
    businessAddress: { type: String, trim: true },
    businessLga: { type: String, trim: true },
    businessCity: { type: String, trim: true },
    role: {
      type: String,
      default: 'user',
      enum: [...getObjectValues(rolesType)],
    },
    Kyc: {
      type: String,
      enum: [...getObjectValues(kycType)],
    },
    address: { type: String, trim: true },
    street: { type: String, trim: true },
    lga: { type: String, trim: true },
    state: { type: String, trim: true },
    userId: { type: String }, // 'RQ08c47280-0905-11ea-a212-4f46d0790907'
    username: { type: String, default: 'Enter Username', trim: true },
    firstName: { type: String, default: '', trim: true },
    lastName: { type: String, default: '', trim: true },
    email: {
      type: String,
      // unique: true,
      lowercase: true,
      //   // required: true,
      trim: true,
      match: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
    },
    dateOfBirth: {
      type: String,
      trim: true,
      // match: /^\d{1,2}\/\d{1,2}\/\d{4}$/
    }, // '14-10-1990'
    gender: { type: String },
    phone: {
      type: String,
      unique: true,
      index: true,
      trim: true,
      required: true, // new
    },
    active: { type: Boolean, default: true }, // ?
    verified: { type: Boolean, default: true }, // verified user
    resetPasswordPin: { type: String },
    resetPasswordTimer: { type: Date }, // time before another pin request
    passwordHash: { type: String },
    verifyPhoneToken: { type: String },
    verifyPhoneTimer: { type: Date }, // timer for phone verification
    transactionPin: { type: String },
    transactionSecret: { type: String }, // secret word
    isBVN_verified: { type: Boolean, default: false },
    BVN_verificationCode: { type: String, trim: true },
    bank: {
      bankAccountNumber: { type: String, trim: true },
      bankAccountName: { type: String, trim: true },
      bankName: { type: String, trim: true },
      bankCode: { type: String, trim: true },
      bvn: {
        type: String,
        trim: true,
      },
      bvnVerified: { type: Boolean, default: false },
    },
    card: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Card',
    }],
    wallet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wallet',
    },
    commissionWallet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CommissionWallet',
    },
    beneficiary: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Beneficiary',
    }],

    lock: { type: Boolean, default: false },

    // TODO - new
    referral_code: { type: String, trim: true, lowercase: true },
    referralRecord: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Referral',
    },
    howDidYouHearAboutUs: {
      type: String,
      default: 'Other',
      enum: [...getObjectValues(signupSource)],
    },


    aggregatorId: { type: String, trim: true },
    aggregatorOnboardingDate: {
      type: Date,
    },

    // aggregator: { // @desc - User's aggregator
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: 'User',
    // },
    // dateAssignedToAggregator: { // @desc - User's aggregator
    //   type: Date,
    // },

    meta: {
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
    },
  },
  { usePushEach: true },
);

userSchema.plugin(uniqueValidator, { message: '{PATH} already exists!' });

userSchema.virtual('password').set(function(val) {
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(val, salt);
  this.passwordHash = hash;
});

userSchema.methods.comparePassword = function(candidatePassword) {
  return bcrypt.compareSync(candidatePassword, this.passwordHash);
};

userSchema.methods.toJSON = function() {
  const obj = this.toObject();

  delete obj.passwordHash;
  delete obj.resetPasswordTimer;
  delete obj.resetPasswordPin;
  delete obj.verifyPhoneToken;
  delete obj.verifyPhoneTimer;
  delete obj.transactionPin;
  delete obj.transactionSecret;
  delete obj.__v;
  return obj;
};

// userSchema.plugin(mongoosePaginate);

userSchema.index(
  { '$**': 'text' },
);

export default mongoose.model('User', userSchema);


// userSchema.getIndexes();
// userSchema.index(
//   { firstName: 'text', lastName: 'text' },
//   { weights: { firstName: 5, lastName: 3 } },
// );

// userSchema.index(
//   {
//     content: 'text',
//     keywords: 'text',
//     about: 'text'
//   },
//   {
//     weights: {
//       content: 10,
//       keywords: 5
//     },
//     name: "TextIndex"
//   }
// );


/**
 * =================================
 */
// {
//   $text:
//     {
//       $search: <string>,
//       $language: <string>,
//       $caseSensitive: <boolean>,
//       $diacriticSensitive: <boolean>
//     }
// }

// db.myColl.createIndex(
//   { score: 1, price: 1, category: 1 },
//   { collation: { locale: "fr" } } )


// db.reviews.createIndex(
//   {
//     subject: "text",
//     comments: "text"
//   }
// )

// Phrases

// To match on a phrase, as opposed to individual terms, enclose the phrase in escaped double quotes (\"), as in:
// "\"ssl certificate\""

// If the $search string includes a phrase and individual terms, text search will only match the documents that include the phrase.

// For example, passed a $search string:

// "\"ssl certificate\" authority key"
// The $text operator searches for the phrase "ssl certificate".

// Negations

// Prefixing a word with a hyphen-minus (-) negates a word:


// Stop Words

// The $text operator ignores language-specific stop words, such as the and and in English.

// Stemmed Words

// For case insensitive and diacritic insensitive text searches, the $text operator matches on the complete stemmed word. So if a document field contains the word blueberry, a search on the term blue will not match. However, blueberry or blueberries will match.


// Wildcard Text Indexes
// With a wildcard text index, MongoDB indexes every field that contains string data for each document in the collection.
// Such an index can be useful with highly unstructured data if it is unclear which fields to include in the text index or for ad-hoc querying.
// db.collection.createIndex( { "$**": "text" } )

// db.user.find(
//   { author: "xyz", $text: { $search: "paul james" } },
//   { score: { $meta: "textScore" } }
// ).sort( { date: 1, score: { $meta: "textScore" } } )


// db.user.find(
//   { $text: { $search: "paul" } },
//   { score: { $meta: "textScore" } }
// ).sort( { score: { $meta: "textScore" } } ).limit(2)
