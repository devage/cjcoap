var udp = require('dgram');
var coap = require('./cjcoap');
var server;
var client;

module.exports = {

init: function() {
  client = udp.createSocket('udp4');

  server = udp.createSocket('udp4');

  server.on('error', function(err) {
    console.log('coap/udp server error:\n' + err.stack);
    server.close();
  });

  server.on('message', function(msg, info) {
    coap.recv(msg, info);
  });

  server.on('listening', function() {
    var addr = server.address();
    console.log('coap/udp server listening on '
      + addr.address + ':' + addr.port);
  });

  server.bind(5683); // coap
}

}

