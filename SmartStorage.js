/*
MIT Licensed.
Copyright (c) 2010 Andy Hume (http://andyhume.net, andyhume@gmail.com).
 
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

/**
* SmartStorage
* @constructor
*/
function SmartStorage(dbname, password) {
    if (SmartStorage.browserIsSupported()) {
        this.dbname = dbname;
        this.password = password || null;
    } else {
        throw "SmartStorage error: You should catch this and deal with browsers that don't support localStorage."
    }
}

/**
* Stash a key/value in the browser store, prefixed with the dbname.
* @private
* @param {String} key The post db prefix key to store the value against.
* @param value The value to store
* @param optional expiry time in milliseconds.
*/
SmartStorage.prototype._setItemForDb = function(key, value, time) {
    value = JSON.stringify(value);
    if (time) {
        value = ((new Date()).getTime() + time) + "--cache--" + value;
    }
    if (SmartStorage.typeOf(this.password) === 'string') {
        value = sjcl.encrypt(this.password, value);
    }
    return localStorage.setItem(this.dbname + '_' + key, value);
}

/**
* Get a value from the browser store, based on dbname and key.
* @private
* @param {String} key The key to lookup.
* @returns The requested value.
*/
SmartStorage.prototype._getItemForDb = function(key) {
    var prefixed_key = this.dbname + '_' + key;
    var value = localStorage.getItem(prefixed_key);
    if (value && value.indexOf('--cache--') > -1) {
        // If the expiry time has passed then return null.
        var time_and_value = value.split("--cache--");
        if ( ((new Date()).getTime()) > time_and_value[0] ) {
            value = null;
        } else {
            value = time_and_value[1];
        }
    }
    if (SmartStorage.typeOf(this.password) === 'string') {
        value = sjcl.decrypt(this.password, value);
    }
    return JSON.parse(value);
}

/**
* Remove a value from the browser store, based on dbname and key.
* @private
* @param {String} key The key to remove.
*/
SmartStorage.prototype._removeItemForDb = function(key) {
    return localStorage.removeItem(this.dbname + '_' + key);
}

/**
* Set key to the value. Overrides anything that is already set.
* @param {String} key The key to store the value against.
* @param value The value to store.
* @param optional expiry time in milliseconds.
*/
SmartStorage.prototype.set = function(key, value, time) {
    if (arguments.length < 2) {
        throw "SmartStorage error: set() requires at least 2 arguments."
    }
    if (SmartStorage.typeOf(value) === "function") {
        throw "SmartStorage error: Can't store function reference."
    }
    return this._setItemForDb(key, value, time);
}

/**
* Get value for passed in key.
* @param {String} key The key to lookup.
* @returns The requested value or null if it doesn't exist.
*/
SmartStorage.prototype.get = function(key) {
    if (arguments.length < 1) {
        throw "SmartStorage error: get() requires 1 argument."
    }
    return this._getItemForDb(key);
}

/**
* Removes an entry from the browser store.
* @param {String} key The key to remove.
*/
SmartStorage.prototype.remove = function(key) {
    if (arguments.length < 1) {
        throw "SmartStorage error: remove() requires 1 argument."
    }
    return this._removeItemForDb(key);
}

/**
* If key exists and is a string, this appends the value to the end of that string.
* If key does not exist it creates it, similar to set().
* @param {String} key The key to store the value against.
* @param value The value to store
* @returns The new length of the string.
*/
SmartStorage.prototype.append = function(key, value) {
    if (arguments.length < 2) {
        throw "SmartStorage error: set() requires 2 arguments."
    }
    var existing_value = this._getItemForDb(key);
    if (existing_value !== null && SmartStorage.typeOf(existing_value) !== 'string') {
        throw "SmartStorage error: Can only append() to a string."
    }
    if (existing_value) {
        value = existing_value + value;
    }
    this._setItemForDb(key, value);
    return value.length;
}

/**
* Increments the stored value by the passed in value. If it does not
* exist or is of the wrong type the value is set to 0 before incrementing.
* @param {String} key The key to store the value against.
* @param {int} increment The number to increment by.
* @returns The value of the key after the increment.
*/
SmartStorage.prototype.incr = function(key, increment) {
    if (!increment) { // TODO: Deal better with unexpected increment values.
        increment = 1;
    }
    var old_value = this._getItemForDb(key);
    if (SmartStorage.typeOf(old_value) !== 'number') {
        old_value = 0;
    }
    var new_value = old_value + increment;
    this._setItemForDb(key, new_value);
    return new_value;
}

/**
* Decrements the stored value by 1. If it does not exist or is of the
* wrong type the value is set to 0 before decrementing.
* @param {String} key The key to decrement.
* @returns The value of the key after the decrement.
*/
SmartStorage.prototype.decr = function(key, increment) {
    if (!increment) { // TODO: Deal better with unexpected increment values.
        increment = 1;
    }
    increment = -increment;
    return this.incr(key, increment);
}

/**
* Renames key to newkey. Throws an error if key and newkey are the
* same, or if key does not exist. Overwrites existing newkey.
* @param {String} key The key to rename.
* @param {String} newkey The new key name.
*/
SmartStorage.prototype.rename = function(key, newkey) {
    if (key === newkey) {
        throw "SmartStorage error: Cannot rename key to itself."
    }
    var value = this._getItemForDb(key);
    if (value === null) {
        throw "SmartStorage error: Cannot rename non-existant key."
    }
    this._setItemForDb(newkey, this._getItemForDb(key));
    this._removeItemForDb(key);
}

/**
* Get the length of a string in the store.
* @param {String} key The key.
* @returns Length of string, or 0 if key not set.
*/
SmartStorage.prototype.strlength = function(key) {
    var value = this._getItemForDb(key);
    if (SmartStorage.typeOf(value) !== 'string') {
        if (value === null) {
            value = "";
        } else {
            throw "SmartStorage error: Value must be a string to test its length."
        }
        
    }
    return value.length;
}

/**
* Set key to value if no key is set there.
* @param {String} key The key.
* @param value The value to set.
* @returns true if the key was set, false if not.
*/
SmartStorage.prototype.setnx = function(key, value) {
    if (this._getItemForDb(key) === null) {
        this.set(key, value);
        return true;
    }
    return false;
}

/**
* Set key to value if no key is set there.
* @param {String} key The key.
* @param value The value to set.
* @returns true if the key was set, false if not.
*/
SmartStorage.prototype.getset = function(key, value) {
    var old_value = this._getItemForDb(key);
    this.set(key, value);
    return old_value;
}

/**
* Set expiry time on a key.
* @param {String} key The key.
* @param time The time to live in milliseconds.
* @returns true if the key existed and expiry has been applied, false if not.
*/
SmartStorage.prototype.expire = function(key, time) {
    var value = this._getItemForDb(key);
    if (value !== null) {
        this.set(key, value, time);
        return true;
    }
    return false;
}

/**
* Remove expiry time on a key.
* @param {String} key The key.
* @returns true if the key existed and expiry has been cancelled, false if not.
*/
SmartStorage.prototype.persist = function(key) {
    var value = this._getItemForDb(key);
    if (value !== null) {
        this.set(key, value);
        return true;
    }
    return false;
}

/**
* Push a value on to an array. If no existing array then create it.
* @param {String} key The key of the array.
* @param value The value to push on to the array
* @returns the length of the array after push.
*/
SmartStorage.prototype.push = function(key, value) {
    var val = this._getItemForDb(key);
    if (val === null) {
        val = [];
    } else 
    if (SmartStorage.typeOf(val) !== 'array') {
        throw "SmartStorage error: Value must be an array to push a value on it."
    }
    val.push(value);
    this.set(key, val);
    return val.length
}

/**
* Pop a value from the end of an array.
* @param {String} key The key of the array.
* @returns the length of the array after push.
*/
SmartStorage.prototype.pop = function(key) {
    var val = this._getItemForDb(key);
    if (val === null) {
        throw "SmartStorage error: Cannot pop from non-existant key."
    }
    if (SmartStorage.typeOf(val) !== 'array') {
        throw "SmartStorage error: Value must be an array to pop a value from it."
    }
    var popped_val = val.pop();
    this.set(key, val);
    return popped_val;
}

/**
* Add a value on to the beginning of an array. If no existing array then create it.
* @param {String} key The key of the array.
* @param value The value to prepend to the array
* @returns the length of the array after unshift.
*/
SmartStorage.prototype.unshift = function(key, value) {
    var val = this._getItemForDb(key);
    if (val === null) {
        val = [];
    } else 
    if (SmartStorage.typeOf(val) !== 'array') {
        throw "SmartStorage error: Value must be an array to prepend a value to it."
    }
    val.unshift(value);
    this.set(key, val);
    return val.length
}

/**
* Remove a value from the beginning of an array.
* @param {String} key The key of the array.
* @returns the length of the array after shift.
*/
SmartStorage.prototype.shift = function(key) {
    var val = this._getItemForDb(key);
    if (val === null) {
        throw "SmartStorage error: Cannot pop from non-existant key."
    }
    if (SmartStorage.typeOf(val) !== 'array') {
        throw "SmartStorage error: Value must be an array to pop a value from it."
    }
    var shift_val = val.shift();
    this.set(key, val);
    return shift_val;
}


/**
* @returns {Boolean} Does the browser have localStorage API?
*/
SmartStorage.browserIsSupported = function() {
    try {
        return 'localStorage' in window && window['localStorage'] !== null;
    } catch (e) { return false; }
}
/**
* More robust typeof function. With thanks to Mr Crockford.
* @returns The type of value passed in.
*/
SmartStorage.typeOf = function(value) {
    var s = typeof value;
    if (s === 'object') {
        if (value) {
            if (value instanceof Array) {
                s = 'array';
            } else
            if (value instanceof String) {
                s = 'string';
            }
        } else {
            s = 'null';
        }
    }
    return s;
}

function SmartSecureStorage(dbname, password) {
    SmartStorage.call(this, dbname);
    this.password = password;
}

SmartSecureStorage.prototype = new SmartStorage

SmartSecureStorage.prototype._setItemForDb = function(key, value, time) {
    var enc_value = sjcl.encrypt(this.password, value);
    return SmartStorage.prototype.set.call(this, key, enc_value, time);
}

SmartSecureStorage.prototype._getItemForDb = function(key) {
    var enc_value = SmartStorage.prototype.get.call(this, key);
    return sjcl.decrypt(this.password, enc_value);
}