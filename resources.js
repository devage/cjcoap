var list_resources = [];


module.exports = {

push: function(resource) {

  if(list_resources[resource.uri] != undefined) {
    // TBD
    console.log('duplicate resource for '+resource.uri);
  }
  else {
    list_resources[resource.uri] = resource;
    console.log('new resource for '+resource.uri+' is added');
  }

  return;
},


get: function(uri) {
  return list_resources[uri];
}

}
