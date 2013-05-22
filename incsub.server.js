/*

Incremental Subscription - Server-Side

 */

Incremental = function(name, options) {
	var self = this;

	// The default current subset
	self._current = (options && options.current !== undefined)?options.current: 1;

	// The current subset
	self.current = self._current;

	// Number of subsets to read in front + back
	self.ahead = (options && options.ahead !== undefined)?options.ahead: 0;

	// Maximum allowed subsets in memory
	self.maxSubsets = (options && options.maxSubsets !== undefined)?options.maxSubsets: 0;

	// Show per subset
	self.perSubset = (options && options.perSubset !== undefined)?options.perSubset: 0;

	// Subscription name
	self._name = name;

	self.query = function(index) {
		var skip = (index - 1) * self.perSubset;
        if (skip < 0)
			throw new Meteor.Error('negative skip?');

		return { skip: skip, limit: self.perSubset };
	};

	self.publish = function(name, func) {

	};

	return self;
};