// export * from './users'
import mongoose from 'mongoose';
import User from './users.model';
import AgentCounter from './agentCounter.model';
import Transaction from './transactions.model';
import Wallet from './wallet.model';
import ServiceSwitch from './switchService.model';
import LayerTwoSwitch from './layerTwoSwitch.model';
import ServiceSwitchLog from './switchServiceLog.model';
import PaymentNotification from './paymentNotification.model';
import CommissionWallet from './CommissionWallet.model';
import CommissionHistory from './commissionHistory.model';
import AuthOtpVerify from './authOtpVerify.model';
import CacheBvn from './cacheBvn.model';
import Platform from './platforms.model';
import Issues from './issues.model';
import Referral from './referral.model';
import Beneficiary from './beneficiary.model';
import PaymentSecret from './paymentSecret.model';
import AppUpdate from './appUpdate.model';
import Message from './messages.model';
import BroadcastReadReceipt from './broadcastReadReceipt.model';
import PosNotification from './posNotification.model';
import PosTerminal from './posTerminal.model';
// import Aggregator from './aggregator.model';
import AgentRequest from './agentRequest.model';
import AggregatorCounter from './aggregatorCounter.model';
import AggregatorEOD from './aggregatorEOD.model';


const validMongooseObjectId = (id: string) => mongoose.Types.ObjectId.isValid(id); 
const MongooseObjectId = mongoose.Types.ObjectId;

export {
  User,
  AgentCounter,
  Transaction,
  Wallet,
  ServiceSwitch,
  LayerTwoSwitch,
  ServiceSwitchLog,
  PaymentNotification,
  CommissionWallet,
  CommissionHistory,
  AuthOtpVerify,
  CacheBvn,
  Platform,
  Issues,
  Referral,
  Beneficiary,
  PaymentSecret,
  AppUpdate,
  Message,
  BroadcastReadReceipt,
  PosNotification,
  PosTerminal,
  // Aggregator,
  AgentRequest,
  AggregatorCounter,
  AggregatorEOD,

  validMongooseObjectId,
  MongooseObjectId,
};
