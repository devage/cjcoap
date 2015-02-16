var udp = require('./udp');
var Message = require('./message');
var peers = [];

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

  msg.parse(packet);

  if(this.callback_receive != undefined)
    this.callback_receive(msg, peer);
}

}
