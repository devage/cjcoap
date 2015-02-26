var udp = require('./udp');
var events = require('events');
var resources = require('./resources');
var connections = require('./connections');
var Message = require('./message');
var cli_socket, svr_socket;
var netif;

function recvPacket(packet, peer) {

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

  //if(this.callback_receive != undefined)
  //  this.callback_receive(msg, peer);

  var ret_msg = handle_resource(peer, msg);

  console.log('response: '+ret_msg.toString());

  var ret_pkt = ret_msg.packetize();
  svr_socket.send(ret_pkt, 0, ret_pkt.length, peer.port, peer.address,
      function(err) {
        if(err) console.log('error occurs: '+err);
      });
}


function handle_resource(peer, msg) {

  var resource_uri = msg.uri();
  var r = resources.get(resource_uri);

  if(r) {
    // TODO: r.handle[msg.code]()
    //    -> default_handler()    : handle ETag, valid time
    //    -> handle_test_get()    : user-defined function
    var ret = r.handle[msg.code]();
    if(ret) {
      // XXX
      msg.type = 'ACK';
      msg.code = ret.code;
      msg.options = [];
      if(ret.data) {
        msg.payload = ret.data;

        var o = {};
        var v = new Buffer(1);
        o.type = 'Content-Format';
        if(ret.encoding.search('text') != -1)
          v.writeUInt8(0, 0);
        else if(ret.encoding.search('link-format') != -1)
          v.writeUInt8(40, 0);
        else if(ret.encoding.search('xml') != -1)
          v.writeUInt8(41, 0);
        else if(ret.encoding.search('octet-stream') != -1)
          v.writeUInt8(42, 0);
        else if(ret.encoding.search('exi') != -1)
          v.writeUInt8(47, 0);
        else if(ret.encoding.search('json') != -1)
          v.writeUInt8(50, 0);

        o.value = new Buffer(v);
        msg.options.push(o);
      }
    }
  }

  return msg;
}


module.exports = {

callback_receive: undefined,

init: function(type, recv_func) {

  // resource for test -------------------
  var handle_test_get = function() {
    var buf = new Buffer('testdata');
    return {
      code: '2.04',
      encoding: 'text/plain;charset=utf-8',
      data: buf
    };
  };

  var r = {
    uri: '/test',
    handle: []
  };
  r.handle['GET'] = handle_test_get;

  resources.push(r);
  // resource for test -------------------

  if(recv_func)
    callback_receive = recv_func;

  var ret = udp.init(type, this.recv);
  netif = ret.event;
  svr_socket = ret.socket;

  netif.on('message', function(peer, message) {
    recvPacket(message, peer);
  });
}

}
