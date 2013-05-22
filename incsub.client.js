/*

Incremental Subscription - Client-Side

________________________________________________________________________________
We store subsets in a fifo queue

If the max length is reached then subsets are closed and popped from the
queue.

We check if the popping subscription is amongst the:
"high priority" (current +/- read aheads)

If 1+2 x (nr of read aheads) is > than (the limit of allowed subsets in memory)
then we throw an error?

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

	// Subscription arguments
	self._args = [];

	// Carry for updating subscription
	self.oldSubsets = [];

	// Current subsets
	self.subsets = [];

	// index order
	self.indexOrder = [];

	self._readyCounter = 0;

	self._onReadyCallback = function() {
		// We count the number of ready subscriptions
		self._readyCounter++;

		// We expect an initialCount before its ready
		var initialCount = (2 * self.ahead) + 1;

		// Are the subscriptions ready	
		if (self._readyCounter == initialCount ) {

			// if oldSubsets then destroy when initial subscriptions are ready
			self.destroyOld();

			// TODO: We could trigger an onReady event ourselfs?
		}
	};

	self.query = function() {
		var skip = self.getOffset(self.getCurrent())*self.perSubset;
		return { skip: skip, limit: self.perSubset };
	};

	// Add subscription and keep track of the latest used subsets deleting the
	// older subsets
	self.addSubset = function(index) {
		if (index < 0)
			return;
		// subset to add, can be existing or a new
		var subset = {};

		// Check if subscription allready found
		for (var i = 0; i < self.subsets.length; i++)
			if (self.subsets[i].index == index) {
				// We remember this, and removes it from array
				subset = self.subsets.splice(i, 1)[0];

				// We got what we came for
				break;
			}

		// Check if limit of maxSubsets is reached
		if (self.subsets.length === self.maxSubsets) {
			// pop first subset
			subset = self.subsets.shift();
		}

		// If the subscription different then we discard it and make a new
		if (subset.index !== index) {
			// Stop subscription
			if (subset.subscription !== undefined) {
				subset.subscription.stop();
				var offset = self.getOffset(subset.index);
				self.indexOrder.splice(offset, 1);
			}

			// Add this index to arguments
			self._args[1] = index;

			// Init new subset
			subset = { index: index, subscription: Meteor.subscribe.apply(window, self._args) };

			// Add to index order
			self.indexOrder.push(index);
		}
		// Add subscription to the top
		self.subsets.push(subset);
	};

	self.getSubset = function(index) {
		// Set current to index
		self.current = index;

		// load current
		self.addSubset(self.current);
		// load ahead front
		Meteor.setTimeout(function() {
			for (var i = 0; i < self.ahead; i++)
				self.addSubset(self.current + i + 1);

			// load ahead back
			for (var i = 0; i < self.ahead; i++)
				self.addSubset(self.current - i - 1);
		}, 10);
	};

	self._currentDeps = new Deps.Dependency();

	self.getCurrent = function() {
		// Depend on change
		self._currentDeps.depend();

		// Return value
		return self.current;
	};

	self.setCurrent = function(index) {
		if (index !== self.current) {
			// Set new index
			self.getSubset(index);

			// Update deps
			self._currentDeps.changed();
		}
	};

	// Calculate data offset in minimongo
	self.getOffset = function(index) {
		//return self.indexOrder.indexOf(index);
		for (var i = 0; i < self.indexOrder.length; i++)
			if (self.indexOrder[i] == index) {
				return i;
			}
		return 0;
	};

	self.destroy = function() {
		var len = self.subsets.length;
		for (var i = 0; i < len; i++)
			self.subsets.pop().subscription.stop();

		// Reset index order
		self.indexOrder = [];
	};

	self.destroyOld = function() {
		var len = self.oldSubsets.length;
		for (var i = 0; i < len; i++)
			self.oldSubsets.pop().subscription.stop();
	};

	self.subscribe = function(/* arguments */) {
		// Check if allready initialized
		if (self.subsets.length > 0) {
			// If the subscription is allready found then we assume that we are in an
			// autorun - so we fire up the new subscription then shutting down the
			// old one - this way we keep as many docs in memory instead of reloading?

			// Do empty oldSubsets first
			self.destroyOld();

			// Save current subsets until the new subsets are loaded
			self.oldSubsets = self.subsets;

			// Create new subsets
			self.subsets = [];

			// Reset index order
			self.indexOrder = [];

		}

		// Reset the ready counter
		self._readyCounter = 0;

		// Set the new arguments
		self._args = Array.prototype.slice.call(arguments);

		// Add index as second argument
		self._args.unshift(self._current);

		// Add name as first argument
		self._args.unshift(self._name);

		// Add the onReady callback as last argument
		self._args.push(self._onReadyCallback);

		// Initialize the new subscription, reset index
		self.getSubset(self._current);
	};

	return self;
};
