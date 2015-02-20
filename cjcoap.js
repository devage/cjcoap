var udp = require('./udp');
var resources = require('./resources');
var connections = require('./connections');
var Message = require('./message');

function handle_resource(peer, msg) {

  var resource_uri = msg.uri();
  var r = resources.get(resource_uri);

  if(r) {
    var ret = r.handle[msg.code]();
    if(ret) console.log(ret);
  }
}

module.exports = {

callback_receive: undefined,

init: function(type, recv_func) {

  // resource for test -------------------
  var handle_test_get = function() {
    var buf = new Buffer('testdata');
    return {
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

  handle_resource(peer, msg);

  if(this.callback_receive != undefined)
    this.callback_receive(msg, peer);
}

}
