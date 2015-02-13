var Coap_msg = require('./coap_msg');
var peers = [];

module.exports = {

recv: function(packet, peer) {
  var len = packet.length;
  var msg = new Coap_msg();

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
