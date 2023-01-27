'use strict';
var forever = require('forever');
var child = new (forever.Monitor)('./dist/bin/www.js', {
  //options : options
});

//These events not required, but I like to hear about it.
child.on("exit", function() {
  console.log('./dist/bin/www.js has exited!');
});
child.on("restart", function() {
  console.log('./dist/bin/www.js has restarted.');
} );
child.on('watch:restart', function(info) {
  console.error('Restarting script because ' + info.file + ' changed');
});

//These lines actually kicks things off
child.start();
forever.startServer( child );

//You can catch other signals too
process.on( 'SIGINT', function() {
  console.log( "\nGracefully shutting down \'node forever\' from SIGINT (Ctrl-C)" );
  // some other closing procedures go here
  process.exit();
} );

process.on( 'exit', function() {
  console.log( 'About to exit \'node forever\' process.' );
} );

//Sometimes it helps...
process.on( 'uncaughtException', function( err ) {
  console.log( 'Caught exception in \'node forever\': ' + err );
} );




// var forever = require('forever-monitor');

// var child = new(forever.Monitor)('./dist/bin/www.js', {
//     max: 3,
//     silent: true,
//     options: []
// });

// child.on('exit', function() {
//     console.log('app.js has exited after 3 restarts');
// });

// child.start();