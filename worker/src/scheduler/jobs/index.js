//@ flow

import SayHello from './sayHello'

export default ({ agendaClient }) => {

  agendaClient.define('say-hello', 
    { priority: 'high', concurrency: 10 },
    new SayHello().handler, // reference to the handler, but not executing it! 
  )
  

  // agenda.define('some long running job', async job => {
  //   const data = await doSomelengthyTask();
  //   await formatThatData(data);
  //   await sendThatData(data);
  // });
  
  agendaClient.start();
}