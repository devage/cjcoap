var udp = require('./udp');
var connections = require('./connections');
var Message = require('./message');

module.exports = {

callback_receive: undefined,

init: function(type, recv_func) {

  if(recv_func)
    callback_receive = recv_func;

  return udp.init(type, this.recv);
},

recv: function(packet, peer) {
  var msg = new Message();

  if(packet.length < 4) {
    console.log('cjcoap.recv: Invalid CoAP msg -- '
        + packet.length + 'bytes');
    return;
  }

  try {
    msg.parse(packet);
  }
  catch(e) {
    console.log(e.message);
    return;
  }

  connections.push(peer, msg);

  if(this.callback_receive != undefined)
    this.callback_receive(msg, peer);
}

}
