var config = {
  current: 0,
  ahead: 5,
  perSubset: 2,
  maxSubsets: 15
};

var pointer = new Incremental('test', config);

data = new Meteor.Collection('list');

if (Meteor.isClient) {

  pointer.subscribe('this is just a parametre');

  Template.hello.config = function () {
    return config;
  };

  Template.hello.subsetCount = function () {
    return data.find({}).count();
  };

  Template.hello.currentsubset = function () {
    return pointer.getCurrent();
  };

  Template.hello.currentoffset = function () {
    return pointer.getOffset(pointer.getCurrent());
  };

  Template.hello.alldata = function () {
    return data.find({});
  };

  Template.hello.subset = function () {
    return data.find({}, pointer.query());
  };


  Template.hello.events({
    'click .prev' : function () {
      var i = pointer.getCurrent()-1;
      if (i < 0)
        i = 0;
      pointer.setCurrent(i);
    },
    'click .next' : function () {
      var i = pointer.getCurrent()+1;
      pointer.setCurrent(i);
    },
    'click .goto' : function (e, temp) {      
      var i = +temp.find('.nr').value;
      pointer.setCurrent(i);
    }
  });

}

if (Meteor.isServer) {

  Meteor.publish('test', function(index, text) {
    return cursor = data.find({}, pointer.query(index));
    //return cursor.skip((index-1)*nPerPage).limit(nPerPage); // Not supported yet?
  });


  Meteor.startup(function () {

    // Make sure we got some data to work with...
    if (data.find({}).count() === 0) {
      // No data, create some
      console.log('Creating data');
      for (var i = 0; i < 100; i++) {
        data.insert({ name: 'item' + i, text: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.' });
      }
    }

  });
}
