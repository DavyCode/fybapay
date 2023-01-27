import mongoose from 'mongoose';
import { mobileAppType } from '../enumType';
import { getObjectValues } from '../utils';
import uniqueValidator from 'mongoose-unique-validator';

/**
 * App update Model
 */

const appUpdateSchema = new mongoose.Schema(
  {
    appType: {
      type: String,
      enum: [...getObjectValues(mobileAppType)],
      unique: true,
      index: true,
      trim: true,
    },
    releaseDate: { type: Date },
    versionId: { type: String }, // unique ID
    versionNumber: { type: String }, // release number
    platformType: { type: String },
    redirectUrl: { type: String },
    viewingAllowed: { type: Boolean, default: true },
    links: [{
      type: String
    }],
    images: [{
      type: String
    }],
    meta: {
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
    },
  },
  { usePushEach: true },
);

appUpdateSchema.plugin(uniqueValidator, { message: '{PATH} already exists!' });

export default mongoose.model('AppUpdate', appUpdateSchema);
