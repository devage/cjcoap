const coap_types[] = { "EMPTY", "CON", "NON", "ACK", "RST" };
const coap_methods[] = { "GET", "POST", "PUT", "DELETE" };

var util = require('util');
var peers = [];

function get_coapcode(octet)
{
  var class_ = (octet & 0xe0) >>> 5;
  var detail = octet & 0x1f;
  var ret = "";

  if(class_ == 0x00)
    ret = coap_types[detail];
  else
    ret = util.format('%d.%02d', class_, detail);

  return ret;
}

module.exports = {

recv: function(packet, peer) {
  var len = packet.length;

  if(len < 4) {
    console.log('cjcoap.recv: insufficient received packet: ' + len);
    return;
  }

  var msg = coap_parser(packet);
};

coap_parser: function(packet) {
  var msg = {};
  var octet;
  var len = packet.length;

  octet = packet[0];

  msg.ver = (octet & 0xc0) >>> 6;
  msg.type = coap_types[(octet&0x30)>>4];
  msg.code = get_coapcode(packet.readUInt8(1));
  msg.mid = packet.readUInt16BE(2);

  msg.tkl = (octet & 0x0f);
  if(msg.tkl == 0)
    msg.token = [];
  else
    msg.token = new UInt8Array(packet.slice(4, msg.tkl)); // or Buffer?

  // options & payload
  var i = msg.tkl + 4;

  while(i < len) {
    if(packet[i] != 0xff) { // option(s)
      // TODO: add option codes
    }
    else { // payload
      var p_len = len - (i+1);
      if(p_len > 0)
        msg.payload = new UInt8Array(packet.slice(i+1, p_len)); // or Buffer?
      i += (p_len + 1);
    }
  }

  return msg;
};

}

