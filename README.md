#Incremental Subscriptions
* In short it preloads subsets / pages of data (read ahead)
* It filters old subsets out managing memory and subscriptions (maxSubsets)
* Its custom how many documents there should be in a subset (documents perSubset)
* Its possible to jump in subsets use setCurrent()

Bug: when going out of data bounds (in the example its above 100 documents) the offset algoritme fails for now

```js
var testSubsets = new Incremental('test', {
  current: 0,
  ahead: 5,
  perSubset: 2,
  maxSubsets: 15
});

// Subscription should be able to be run from within autorun eg. for filtering or search
testSubsets.subscribe('this is just a param');

Template.hello.subset = function () {
    return data.find({}, testSubsets.query());
};

```

On the server:
```js
  Meteor.publish('test', function(index, text) {
    return cursor = data.find({}, testSubsets.query(index));
    //return cursor.skip((index-1)*nPerPage).limit(nPerPage); // Not supported yet?
  });
```