var udp = require('dgram');
var events = require('events');

var channel = new events.EventEmitter();

module.exports = {

init: function(type, callback_receive) {

  channel.clients = {};

  channel.on('message', function(peer, message) {
    var id = peer.address + ':' + peer.port;
    this.clients[id] = message;
    callback_receive(peer, message);
  });

  if(type == 'client') {
    return udp.createSocket('udp4');
  }
  else if(type == 'server') {
    var socket = udp.createSocket('udp4');

    socket.on('error', function(err) {
      console.log('CoAP/UDP server error:\n' + err.stack);
      socket.close();
    });

    socket.on('listening', function() {
      var addr = socket.address();
      console.log('CoAP/UDP server listening on '
        + addr.address + ':' + addr.port);
    });

    socket.on('message', function(msg, info) {
      console.log('CoAP message received from '
        + info.address + ':' + info.port);
      channel.emit('message', info, msg);
      if(callback_receive)
        callback_receive(msg, info);
    });

    socket.bind(5683);

    return socket;
  }
}

}

