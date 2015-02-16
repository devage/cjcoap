var coap = require('./cjcoap');

coap.init('server', function(msg, peer) {
  console.log('from: ' + peer.address + ':' + peer.port);
  console.log('message: ' + msg.toString());
});

