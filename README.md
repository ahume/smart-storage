SmartStorage
============

This is a light wrapper around HTML5 localStorage. It doesn't attempt to polyfill older browsers, so any application using it needs to make sure that that is handled gracefully.

As well as the normal get/set/remove methods, it also contains other potentially useful ways of manipulating the store, including setting (faux) expiry times. Many of these operations are inspired by Redis commands. A full list of current methods is below as well a simple example to get started.

It also uses SJCL to optionally allow for storing encrypted data in the store.

Examples
--------

    var store = new SmartStorage("my_store");

    // Store string
    store.set("key", "value");
    store.get("key");
    >> "value"

### Encrypt

To encrypt data for storage, send a password string as a second argument to SmartStorage.

    var enc_store = new SmartStorage("my_enc_store", "secret_password");

This particular branch uses Workers to do the encryption, which means all calls to storage are asynchronous, and might look like:

    enc_store.set("key", "value", null, function(value) {
        // Do something with value
    })
    enc_store.get("key", function(value) {
        // Do something with value
    })


### Expiry

Store object/hash with expiry time of 2 minutes.

    store.set("my_object", {"key1": "value1", "key2": "value2"}, 120 * 1000); // Expires in 120*1000 = 2 minutes.
    store.get("my_object").key2;
    >> "value2"

    store.set("my_int", 10);
    store.incr("my_int");
    >> 11
    store.incr("my_int");
    >> 12

Methods of SmartStorage
-----------------------

* `set(key, val, [expiry])` - Set key to the value. Optional expiry time in milliseconds. Overrides anything that is already set.

* `get(key)` - Get value for passed in key. Returns null if it doesn't exist.

* `remove(key)` - Removes an entry from the current store.

* `append(val)` - If key exists and is a string, this appends the value to the end of that string, and returns the new length of the string. If key does not exist it creates it, similar to set().

* `incr([val])` - Increments the stored value by optional passed in val, or 1. If it does not exist or is of the wrong type the value is set to 0 before incrementing. Returns the value of the key after the increment.

* `decr([val])` - Decrements the stored value by optional passed in value, or 1. If it does not exist or is of the wrong type the value is set to 0 before decrementing. Returns the value of the key after the decrement.

* `rename(key, newkey)` - Renames key to newkey. Throws an error if key and newkey are the same, or if key does not exist. Overwrites existing newkey.

* `setnx(key, value)` - Set key to value only if no value exists for that key.

* `getset(key, value)` - Sets key to value and returns the old value stored in key.

* `multiSet({key: value, key: value, ... }, [expiry])` - Set multiple keys to values in the current store. Overrides anything that is already set. Optional expiry time in milliseconds.

* `clear()` - Remove all keys from the current store.

* `count()` - Return the number of keys in the current store.

* `expire(key, time)` - Set expiry time on a key. Returns true if the key existed and expiry has been applied, false if not.

* `persist(key)` - Remove expiry time on a key. Returns true if the key existed and expiry has been cancelled, false if not.

* `push(key, value)` - Push a value on to an array. If no existing array then create it. Returns the length of the array after push.

* `pop(key)` - Pop a value from the end of an array. Returns the length of the array after push.

* `unshift(key, value)` - Add a value on to the beginning of an array. If no existing array then create it. Returns the length of the array after unshift.

* `shift(key)` - Remove a value from the beginning of an array. Returns the length of the array after shift.

Security
--------

Data stored in local storage mechanisms is stored on users' machines in plain text without an explicit expiry time. It's a good idea to be constantly aware of this fact when choosing what type of data to store in localStorage.

The JavaScript encryption gives *some* level of security, but no assurance. Ensure you use different hashed keys for different users, and don't expose the keys outside of a user's logged in session.

More
----
- Atomicity of certain operations? eg. incr, append
