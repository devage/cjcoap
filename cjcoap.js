const coap_types = [ "EMPTY", "CON", "NON", "ACK", "RST" ];
const coap_methods = [ "GET", "POST", "PUT", "DELETE" ];

var util = require('util');
var peers = [];

function parse_coapcode(octet)
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

function parse_coapoption(msg, pkt, i, last_type)
{
  var opt = {};

  opt.type = (pkt[i] & 0xf0)>>>4;
  opt.len = pkt[i] & 0x0f;
  i++;

  if(opt.type > 12)
    opt.type += pkt[i];
  opt.type += last_type;
  i++;

  if(opt.len > 12)
    opt.len += pkt[i];
  i++;

  var val = new Buffer(pkt.slice(i, opt.len));
  opt.value = val;
  msg.options.push(opt);
  i += opt.value.length;
  return i;
}

function coap_parser(packet)
{
  var msg = {};
  var octet;
  var len = packet.length;

  octet = packet[0];

  msg.ver = (octet & 0xc0) >>> 6;
  msg.type = coap_types[(octet&0x30)>>4];
  msg.code = parse_coapcode(packet.readUInt8(1));
  msg.mid = packet.readUInt16BE(2);
  console.log('#1: '+packet);
  msg.token = new Buffer(packet.slice(4, octet&0x0f));
  console.log('#2: '+packet);

  // options & payload
  msg.options = [];
  var i = msg.token.length + 4;
  var last_type = 0;

  while(i < len) {
    if(packet[i] != 0xff) { // option(s)
      i = parse_coapoption(msg, packet, i, last_type);
      last_type = msg.options[msg.options.length-1].type;
    }
    else { // payload
      i++;
      var p_len = len - i;
      msg.payload = new Buffer(packet.slice(i, p_len));
      i += p_len;
    }
  }

  return msg;
}

module.exports = {

recv: function(packet, peer) {
  var len = packet.length;

  if(len < 4) {
    console.log('cjcoap.recv: Invalid len of CoAP msg: ' + len);
    return;
  }

  var msg = coap_parser(packet);
  console.log(msg);
  console.log('tkl: '+msg.token.length);

  var i;
  for(i = 0; i < msg.options.length; i++)
    console.log('len of option #'+(i+1)+': '+msg.options[i].length);
}

}
