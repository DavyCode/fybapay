import mongoose from 'mongoose';
import { appType, appPlatforms, messageCategory, messageType } from '../enumType';
import { getObjectValues } from '../utils';

/**
 * App message Model
 */

const messageSchema = new mongoose.Schema(
  {
    isRead: { type: Boolean, default: false },
    isReadAt: { type: Date },
    messageToken: { type: String, trim: true }, // bk3RNwTe3H0:CI2k_HHwgIpoDKCIZvvDMExUdFQ3P1
    actionLink: { type: String, default: '' },
    includeImageUrl: { type: String, default: '' },
    messageTitle: { type: String, trim: true },
    messageBody: { type: String, trim: true },
    approveForViewing: { type: Boolean, default: false },
    messageReadOnWhichDevice: {
      type: String,
      enum: [...getObjectValues(appType)], // ios android web
    },
    platformType: {
      type: String,
      enum: [...getObjectValues(appPlatforms)], // mobile web
    }, // MOBILE, WEB
    messageType: {
      type: String,
      enum: [...getObjectValues(messageType)], // news, Notification, message
    },
    messageCategory: {
      type: String,
      enum: [...getObjectValues(messageCategory)], // broadcast, direct,
    },
    messageBelongsTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    meta: {
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
    },
  },
  { usePushEach: true },
);

messageSchema.methods.toJSON = function() {
  const obj = this.toObject();

  delete obj.broadcastReadList;
  delete obj.__v;
  return obj;
};


export default mongoose.model('Message', messageSchema);

// broadcast >> news
// message >> Notification

// direct  >>> Notification + message
// broadcast >>> news


// get messages for a user
// get all messages without user or of broadcast type

// notifications
// broadcast >>> GENERAL
// direct/personal



// token":"bk3RNwTe3H0:CI2k_HHwgIpoDKCIZvvDMExUdFQ3P1...",
// "notification":{
//   "title":"Portugal vs. Denmark",
//   "body":"great match!"
// },



// message.notification.title
// message.notification.body
// message.data

// {
//   "message":{
//      "token":"bk3RNwTe3H0:CI2k_HHwgIpoDKCIZvvDMExUdFQ3P1...",
//      "notification":{
//        "title":"Match update",
//        "body":"Arsenal goal in added time, score is now 3-0"
//      },
//      "android":{
//        "ttl":"86400s",
//        "notification"{
//          "click_action":"OPEN_ACTIVITY_1"
//        }
//      },
//      "apns": {
//        "headers": {
//          "apns-priority": "5",
//        },
//        "payload": {
//          "aps": {
//            "category": "NEW_MESSAGE_CATEGORY"
//          }
//        }
//      },
//      "webpush":{
//        "headers":{
//          "TTL":"86400"
//        }
//      }
//    }
//  }


//  priority
//  Normal priority. 
//  High priority. 

//  {
//   "message":{
//     "topic":"subscriber-updates",
//     "notification":{
//       "body" : "This week's edition is now available.",
//       "title" : "NewsMagazine.com",
//     },
//     "data" : {
//       "volume" : "3.21.15",
//       "contents" : "http://www.news-magazine.com/world-week/21659772"
//     },
//     "android":{
//       "priority":"normal"
//     },
//     "apns":{
//       "headers":{
//         "apns-priority":"5"
//       }
//     },
//     "webpush": {
//       "headers": {
//         "Urgency": "high"
//       }
//     }
//   }
// }


// Lifetime of a message
// target {
//   web
//   mobile
//   sms
//   ussd

// }