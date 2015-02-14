var util = require('util');

const coap_types = [ "CON", "NON", "ACK", "RST" ];
const coap_methods = [ "EMPTY", "GET", "POST", "PUT", "DELETE" ];
const coap_options = {
  '1': 'If-Match',
  '3': 'Uri-Host',
  '4': 'ETag',
  '5': 'If-None-Match',
  '7': 'Uri-Port',
  '8': 'Location-Path',
  '11': 'Uri-Path',
  '12': 'Content-Format',
  '14': 'Max-Age',
  '15': 'Uri-Query',
  '17': 'Accept',
  '20': 'Location-Query',
  '35': 'Proxy-Uri',
  '39': 'Proxy-Scheme',
  '60': 'Size1'
};

function CoapMessage()
{
  if(!(this instanceof CoapMessage))
    return new CoapMessage();

  var ver, type, code, mid, token, payload, options;

  this.options = [];
}

module.exports = CoapMessage;

CoapMessage.prototype.get_codestring = function(code) {
  var class_ = (code & 0xe0) >>> 5;
  var detail = code & 0x1f;
  var ret = "";

  if(class_ == 0x00)
    ret = coap_methods[detail];
  else
    ret = util.format('%d.%02d', class_, detail);

  return ret;
};

CoapMessage.prototype.parse_option = function(buf, i, last_type) {
  var type = (buf[i] & 0xf0)>>>4;
  var len = buf[i] & 0x0f;
  i++;

  if(type == 13) type = buf[i++] + 13;
  else if(type == 14) {
    type = buf.readUInt16BE(i) + 269;
    i += 2;
  }

  if(len == 13) len = buf[i++] + 13;
  else if(type == 14) {
    type = buf.readUInt16BE(i) + 269;
    i += 2;
  }

  var opt = {};
  opt.type = type + last_type;
  opt.value = new Buffer(buf.slice(i, i+len));
  this.options.push(opt);

  return (i + opt.value.length);
};

CoapMessage.prototype.parse = function(packet) {
  var octet = packet[0];
  var len = packet.length;

  this.ver = (octet & 0xc0) >>> 6;
  this.type = (octet & 0x30) >> 4;
  this.code = packet.readUInt8(1);
  this.mid = packet.readUInt16BE(2);
  this.token = new Buffer(packet.slice(4, 4+(octet&0x0f)));

  // options & payload
  var i = this.token.length + 4;
  var last_type = 0;

  while(i < len) {
    if(packet[i] != 0xff) { // option(s)
      i = this.parse_option(packet, i, last_type);
      last_type = this.options[this.options.length-1].type;
    }
    else { // payload
      i++;
      var p_len = len - i;
      this.payload = new Buffer(packet.slice(i, i+p_len));
      i += p_len;
    }
  }
}

CoapMessage.prototype.packetize_option = function(opt, last_type) {
  var buf = new Buffer(1500);
  var i = 0, octet = 0;
  var type = opt.type - last_type;
  var len = opt.value.length;

  if(type < 13) {
    octet |= (type << 4);
    type = 0;
  }
  else if(type < 269) {
    octet |= (13 << 4);
    type -= 13;
  }
  else {
    octet |= (14 << 4);
    type -= 269;
  }

  if(len < 13) {
    octet |= (len & 0x0f);
    len = 0;
  }
  else if(len < 269) {
    octet |= (13 & 0x0f);
    len -= 13;
  }
  else {
    octet |= (14 & 0x0f);
    len -= 269;
  }

  buf.writeUInt8(octet, i++);

  if(type > 12 && type < 256)
    buf.writeUInt8(type, i++);
  else if(type > 255) {
    buf.writeUInt16BE(type, i);
    i += 2;
  }

  if(len > 12 && len < 256)
    buf.writeUInt8(len, i++);
  else if(len > 255) {
    buf.writeUInt16BE(len, i);
    i += 2;
  }

  opt.value.copy(buf, i);
  i += opt.value.length;

  return new Buffer(buf.slice(0, i));
}

CoapMessage.prototype.packetize = function() {
  var buf = new Buffer(1500);
  var i = 0, last_type = 0;
  var octet = (this.ver << 6) | (this.type << 4);

  if(this.token != undefined)
    octet |= (this.token.length & 0x0f);

  buf.writeUInt8(octet, i++);
  buf.writeUInt8(this.code, i++);
  buf.writeUInt16BE(this.mid, i);
  i += 2;
  this.token.copy(buf, i);
  i += this.token.length;

  // option
  for(var j in this.options) {
    var o = this.packetize_option(this.options[j], last_type);
    o.copy(buf, i);
    i += o.length;
    last_type = this.options[j].type;
  }

  if(this.payload != undefined) {
    buf.writeUInt8(0xff, i++);
    this.payload.copy(buf, i);
    i += this.payload.length;
  }

  return new Buffer(buf.slice(0, i));
}

CoapMessage.prototype.toString = function() {
  if(this.ver == undefined)
    return '(undefined)';

  var obj = {
    'ver': this.ver,
    'type': coap_types[this.type],
    'code': this.get_codestring(this.code),
    'mid': this.mid.toString(16),
    'options': []
  };

  if(this.token != undefined)
    obj['token'] = this.token.toString('hex');

  for(var i in this.options) {
    obj['options'].push({
      'type': coap_options[this.options[i].type],
      'len': this.options[i].value.length,
      'val': this.options[i].value.toString('hex')
    });
  }

  if(this.payload != undefined)
    obj['payload'] = this.payload.toString('hex');

  return JSON.stringify(obj);
}
