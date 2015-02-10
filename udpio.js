var udp = require('dgram');
var server;
var client;

module.exports = {

init: function() {
  client = dgram.createSocket('udp4');

  server = dgram.createSocket('udp4');

  server.on('error', function(err) {
    console.log('coap/udp server error:\n' + err.stack);
    server.close();
  });

  server.on('message', function(msg, info) {
    // Buffer msg
    // info.address, info.port
  });

  server.on('listening', function() {
    var addr = server.address();
    console.log('coap/udp server listening on '
      addr.address + ':' + addr.port);
  });

  server.bind(5683); // coap
};

}

