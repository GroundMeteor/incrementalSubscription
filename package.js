Package.describe({
  summary: "Incremental subscription for Meteor"
});

Package.on_use(function(api) {

  api.add_files([
  				'incsub.client.js'], 'client');
  
  api.add_files([
  				'incsub.server.js'], 'server');
  
  api.add_files([
          'incsub.common.js'], [ 'client', 'server' ]);

});