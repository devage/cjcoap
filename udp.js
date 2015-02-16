var udp = require('dgram');

module.exports = {

init: function(type, callback_receive) {
  if(type == 'client') {
    return udp.createSocket('udp4');
  }
  else if(type == 'server') {
    var s = udp.createSocket('udp4');

    s.on('error', function(err) {
      console.log('CoAP/UDP server error:\n' + err.stack);
      s.close();
    });

    s.on('listening', function() {
      var addr = s.address();
      console.log('CoAP/UDP server listening on '
        + addr.address + ':' + addr.port);
    });

    s.on('message', function(msg, info) {
      console.log('CoAP message received from '
        + info.address + ':' + info.port);
      if(callback_receive)
        callback_receive(msg, info);
    });

    s.bind(5683);

    return s;
  }
}

}

