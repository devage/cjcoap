var list_connections = [];


module.exports = {

push: function(info, msg) {

  var key = info.address + ':' + info.port;

  if(list_connections[key] == undefined) {
    list_connections[key] = msg;
  }
  else {
    // TBD
  }

  console.log('list_connections['+key+']: '+msg.toString());
  return;
}

}
