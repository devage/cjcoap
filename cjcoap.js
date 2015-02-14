var Message = require('./message');
var peers = [];

module.exports = {

recv: function(packet, peer) {
  var len = packet.length;
  var msg = new Message();

  if(len < 4) {
    console.log('cjcoap.recv: Invalid len of CoAP msg: ' + len);
    return;
  }

  msg.parse(packet);
  console.log(msg.toString());
  var pkt_test = msg.packetize();
  console.log(pkt_test);
}

}
