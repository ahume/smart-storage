/*
Copyright (c) 2010 Andy Hume (http://andyhume.net, andyhume@gmail.com)
 
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
function SmartStorage(dbname) {
    if (SmartStorage.browserIsSupported()) {
        this.dbname = dbname;
    } else {
        throw "SmartStorage error: You should catch this and deal with browsers that don't support localStorage."
    }
}

/**
* Stash a key/value in the browser store, prefixed with the dbname.
* @private
* @param {String} key The post db prefix key to store the value against.
* @param value The value to store
*/
SmartStorage.prototype._setItemForDb = function(key, value) {
    return localStorage.setItem(this.dbname + '_' + key, JSON.stringify(value));
}

/**
* Get a value from the browser store, based on dbname and key.
* @private
* @param {String} key The key to lookup.
* @returns The requested value.
*/
SmartStorage.prototype._getItemForDb = function(key) {
    var prefixed_key = this.dbname + '_' + key;
    // Use getItem so it returns null in Safari (not undefined).
    return localStorage.getItem(prefixed_key) && JSON.parse(localStorage[prefixed_key]);
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
* @param value The value to store
*/
SmartStorage.prototype.set = function(key, value) {
    if (arguments.length < 2) {
        throw "SmartStorage error: set() requires 2 arguments."
    }
    if (SmartStorage.typeOf(value) === "function") {
        throw "SmartStorage error: Can't store function reference."
    }
    return this._setItemForDb(key, value);
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
    if (existing_value != null && SmartStorage.typeOf(existing_value) !== 'string') {
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
SmartStorage.prototype.incrby = function(key, increment) {
    var old_value = this._getItemForDb(key);
    if (SmartStorage.typeOf(old_value) !== 'number') {
        old_value = 0;
    }
    var new_value = old_value + increment;
    this._setItemForDb(key, new_value);
    return new_value;
}

/**
* Increments the stored value by one. If it does not exist or is
* of the wrong type the value is set to 0 before incrementing.
* @param {String} key The key to store the value against.
* @returns The value of the key after the increment.
*/
SmartStorage.prototype.incr = function(key) {
    return this.incrby(key, 1);
}

/**
* Decrements the stored value by the passed in value. If it does
* not exist or is of the wrong type the value is set to 0 before
* decrementing.
* @param {String} key The key to decrement.
* @param {int} decrement The number to decrement by.
* @returns The value of the key after the decrement.
*/
SmartStorage.prototype.decrby = function(key, decrement) {
    return this.incrby(key, -decrement);
}

/**
* Decrements the stored value by 1. If it does not exist or is of the
* wrong type the value is set to 0 before decrementing.
* @param {String} key The key to decrement.
* @returns The value of the key after the decrement.
*/
SmartStorage.prototype.decr = function(key) {
    return this.incrby(key, -1);
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
    if (!value) {
        throw "SmartStorage error: Cannot rename non-existant key."
    }
    this._setItemForDb(newkey, this._getItemForDb(key));
    this._removeItemForDb(key);
}



/**
* @returns {Boolean} Does the browser have localStorage support?
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