// // @flow

// import Agendash from 'agendash';
// import Agenda from 'agenda'
// import ensureSuperAdmin from '../middleware/ensureSuperAdmin';
// import { NODE_ENV, DBURL, LOGS_DBURL } from '../config/env';

// const auth = NODE_ENV === 'production' ? 
//   ensureSuperAdmin : 
//   (request, response, next) => {
//     next();
//   };

// export default (app) => {
//   const agenda = new Agenda({
//     db: { 
//       address: DBURL, 
//       collection: 'jobs'
//     },
//     maxConcurrency: 20,
//     processEvery: '3 seconds',
//   })

//   app.use('/dash', 
//     auth, 
//     Agendash(agenda, {
//       title: 'Fybapay',
//       middleware: 'express'
//   }));
// };

