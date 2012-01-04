/**
* @preserve MIT Licensed - https://raw.github.com/ahume/smart-storage/master/LICENSE
* Copyright (c) 2010 Andy Hume (http://andyhume.net, andyhume@gmail.com)
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
        throw "SmartStorage error: You should catch this and deal with browsers that don't support localStorage.";
    }
}

/**
* Stash a key/value in the browser store, prefixed with the dbname.
* @private
* @param {String} key The post db prefix key to store the value against.
* @param value The value to store
* @param optional expiry time in milliseconds.
*/
SmartStorage.prototype._setItemForDb = function(key, value, time, callback) {
    var original_value = value;
    value = JSON.stringify(value);
    if (time) {
        value = ((new Date()).getTime() + time) + "--cache--" + value;
    }
    
    // If we're encrypting, then the rest happens in the callback.
    var me = this;
    if (SmartStorage.typeOf(this.password) === 'string') {
        var worker = SmartStorage.WorkerPool.getWorker();
        worker.onmessage = function(e) {
            localStorage.setItem(me.dbname + '_' + key, e.data);
            callback(original_value);
            SmartStorage.WorkerPool.releaseWorker(worker);
        }
        worker.postMessage({"set": true, "password": this.password, "value": value });

        return;
    }
    
    // Otherwise just set and return values synchronously.
    return localStorage.setItem(this.dbname + '_' + key, value);
}

/**
* Get a value from the browser store, based on dbname and key.
* @private
* @param {String} key The key to lookup.
* @returns The requested value.
*/
SmartStorage.prototype._getItemForDb = function(key, callback) {
    var prefixed_key = this.dbname + '_' + key;
    var value = localStorage.getItem(prefixed_key);

    // If we're decrypting, then the rest happens in the callback.
    if (SmartStorage.typeOf(this.password) === 'string') {
        if (value === null) {
            callback(value);
            return;
        }
        var worker = SmartStorage.WorkerPool.getWorker();
        worker.onmessage = function(e) {
            value = SmartStorage.getCachableValue(e.data);
            callback( JSON.parse(value) );
            SmartStorage.WorkerPool.releaseWorker(worker);
        }
        worker.postMessage({"password": this.password, "value": value });
        return;
    }
    
    // Otherwise just return values synchronously.
    value = value && SmartStorage.getCachableValue(value);
        
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
* A straight rename, does not impact encryption or expiry, so can be fully synchronous.
* @private
* @param {String} key The key to remove.
*/
SmartStorage.prototype._renameKey = function(key, newkey) {
    var prefixed_key = this.dbname + '_' + key;
    var prefixed_new_key = this.dbname + '_' + newkey;
    
    var value = localStorage.getItem(prefixed_key);
    if (value === null) {
        throw "SmartStorage error: Cannot rename non-existant key.";
    }

    localStorage.setItem(prefixed_new_key, localStorage.getItem(prefixed_key));
    localStorage.removeItem(prefixed_key);
}

/**
* Set key to the value. Overrides anything that is already set.
* @param {String} key The key to store the value against.
* @param value The value to store.
* @param optional expiry time in milliseconds.
*/
SmartStorage.prototype.set = function(key, value, time, callback) {
    if (arguments.length < 2) {
        throw "SmartStorage error: set() requires at least 2 arguments.";
    }
    if (SmartStorage.typeOf(value) === "function") {
        throw "SmartStorage error: Can't store function reference.";
    }
    return this._setItemForDb(key, value, time, callback);
}

/**
* Set multiple keys/values. Overrides anything that is already set.
* @param {object} data Object of key/value pairs to store.
* @param optional expiry time in milliseconds.
*/
SmartStorage.prototype.multiSet = function(data, time, callback) {
    if (arguments.length < 1) {
        throw "SmartStorage error: multiSet() requires at least 1 arguments.";
    }
    var count = added = 0;
    if (Object.keys) {
        var count = Object.keys(data).length
    } else {
        for (k in data) if (data.hasOwnProperty(k)) count++;
    }
    for (var key in data) {
        if (data.hasOwnProperty(key)) {
            if (this.password) {
                this._setItemForDb(key, data[key], time, function(v) {
                    added++;
                    if (added === count) {
                        callback();
                    }
                });
                continue; // Restart the loop if we're asynchronous.
            }
            this._setItemForDb(key, data[key], time);
        }
    }
    return;
}

/**
* Get value for passed in key.
* @param {String} key The key to lookup.
* @returns The requested value or null if it doesn't exist.
*/
SmartStorage.prototype.get = function(key, callback) {
    if (arguments.length < 1) {
        throw "SmartStorage error: get() requires 1 argument.";
    }
    return this._getItemForDb(key, callback);
}

/**
* Removes an entry from the browser store.
* @param {String} key The key to remove.
*/
SmartStorage.prototype.remove = function(key) {
    if (arguments.length < 1) {
        throw "SmartStorage error: remove() requires 1 argument.";
    }
    return this._removeItemForDb(key);
}

/**
* Removes all entries from the db.
* @param {String} key The key to remove.
*/
SmartStorage.prototype.clear = function() {
    for (var key in localStorage) {
        if (key.indexOf(this.dbname) === 0) { // dbname is always index 0.
            localStorage.removeItem(key);
        }
    }
}

/**
* Get the number of kays in the db.
* @returns The number of keys
*/
SmartStorage.prototype.count = function() {
    var n = 0;
    for (var key in localStorage) {
        if (key.indexOf(this.dbname) === 0) { // dbname is always index 0.
            n++
        }
    }
    return n;
}

/**
* If key exists and is a string, this appends the value to the end of that string.
* If key does not exist it creates it, similar to set().
* @param {String} key The key to store the value against.
* @param value The value to store
* @returns The new length of the string.
*/
SmartStorage.prototype.append = function(key, value, callback) {
    if (arguments.length < 2) {
        throw "SmartStorage error: append() requires at least 2 arguments.";
    }
    
    function doAppend(existing_value) {
        if (existing_value !== null && SmartStorage.typeOf(existing_value) !== 'string') {
            throw "SmartStorage error: Can only append() to a string.";
        }
        return (existing_value || "") + value;
    }
    
    if (this.password) {
        var me = this;
        this._getItemForDb(key, function(v) {
            value = doAppend(v);
            me._setItemForDb(key, value, null, function(v) {
                callback(v.length);
            });
        });
    } else {
        var existing_value = this._getItemForDb(key);
        value = doAppend(existing_value);
        this._setItemForDb(key, value);
        return value.length;
    }
}

/**
* Increments the stored value by the passed in value. If it does not
* exist or is of the wrong type the value is set to 0 before incrementing.
* @param {String} key The key to store the value against.
* @param {int} increment The number to increment by.
* @returns The value of the key after the increment.
*/
SmartStorage.prototype.incr = function(key, increment, callback) {
    if (!increment) { // TODO: Deal better with unexpected increment values.
        increment = 1;
    }
    
    function doIncr(existing_value) {
        if (SmartStorage.typeOf(existing_value) !== 'number') {
            existing_value = 0;
        }
        return existing_value + increment;
    }
    
    var new_value,
        me = this;
    if (this.password) {
        this._getItemForDb(key, function(v) {
            new_value = doIncr(v);
            me._setItemForDb(key, new_value, null, function(v) {
                callback(new_value);
            });
        });
    } else {
        var existing_value = this._getItemForDb(key);
        new_value = doIncr(existing_value);
        this._setItemForDb(key, new_value);
        return new_value;
    }
}

/**
* Decrements the stored value by 1. If it does not exist or is of the
* wrong type the value is set to 0 before decrementing.
* @param {String} key The key to decrement.
* @returns The value of the key after the decrement.
*/
SmartStorage.prototype.decr = function(key, increment, callback) {
    if (!increment) { // TODO: Deal better with unexpected increment values.
        increment = 1;
    }
    increment = -increment;
    return this.incr(key, increment, callback);
}

/**
* Renames key to newkey. Throws an error if key and newkey are the
* same, or if key does not exist. Overwrites existing newkey.
* @param {String} key The key to rename.
* @param {String} newkey The new key name.
*/
SmartStorage.prototype.rename = function(key, newkey) {
    if (key === newkey) {
        throw "SmartStorage error: Cannot rename key to itself.";
    }

    this._renameKey(key, newkey);
}

/**
* Set key to value if no key is set there.
* @param {String} key The key.
* @param value The value to set.
* @returns true if the key was set, false if not.
*/
SmartStorage.prototype.setnx = function(key, value, callback) {

    if (this.password) {
        var me = this;
        this._getItemForDb(key, function(v) {
            if (v === null) {
                me.set(key, value, null, function(v) {
                    callback(true);
                });
            } else {
                callback(false);
            }
        });
        return;
    }

    if (this._getItemForDb(key) === null) {
        this.set(key, value);
        return true;
    }
    return false;
}

/**
* Set key to value and return old key
* @param {String} key The key.
* @param value The value to set.
* @returns The previously set value.
*/
SmartStorage.prototype.getset = function(key, value, callback) {
    if (this.password) {
        var me = this;
        this._getItemForDb(key, function(v) {
            me.set(key, value, null, function() {
                callback(v);
            });
        });
        return;
    }
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
SmartStorage.prototype.expire = function(key, time, callback) {
    if (this.password) {
        var me = this;
        this._getItemForDb(key, function(v) {
            if (v !== null) {
                me.set(key, value, time, function() {
                    callback(true);
                });
            } 
            callback(false);
        });
        return;
    }
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
SmartStorage.prototype.persist = function(key, callback) {
    if (this.password) {
        var me = this;
        this._getItemForDb(key, function(v) {
            if (v !== null) {
                me.set(key, v, null, function() {
                    callback(true);
                });
            }
            callback(false);
        });
        return;
    }
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
SmartStorage.prototype.push = function(key, value, callback) {

    function doPush(existing_value, value) {
        if (existing_value === null) {
            existing_value = [];
        } else 
        if (SmartStorage.typeOf(existing_value) !== 'array') {
            throw "SmartStorage error: Value must be an array to push a value on it."
        }
        existing_value.push(value);
        return existing_value;
    }

    if (this.password) {
        var me = this;
        this._getItemForDb(key, function(v) {
            var new_value = doPush(v, value);
            me.set(key, new_value, null, function(v) {
                callback(v.length);
            });
        });
        return;
    }

    var existing_value = this._getItemForDb(key);
    var new_value = doPush(existing_value, value);
    this.set(key, new_value);
    return new_value.length;
}

/**
* Pop a value from the end of an array.
* @param {String} key The key of the array.
* @returns the length of the array after push.
*/
SmartStorage.prototype.pop = function(key, callback) {

    function doPop(val) {
        if (val === null) {
            throw "SmartStorage error: Cannot pop from non-existant key."
        }
        if (SmartStorage.typeOf(val) !== 'array') {
            throw "SmartStorage error: Value must be an array to pop a value from it."
        }
        return val.pop();
    }

    if (this.password) {
        var me = this;
        this._getItemForDb(key, function(v) {
            var popped_val = doPop(v);
            me.set(key, v, null, function() {
                callback(popped_val);
            });
        });
        return;
    }

    var val = this._getItemForDb(key);
    var popped_val = doPop(val);
    this.set(key, val);
    return popped_val;
}

/**
* Add a value on to the beginning of an array. If no existing array then create it.
* @param {String} key The key of the array.
* @param value The value to prepend to the array
* @returns the length of the array after unshift.
*/
SmartStorage.prototype.unshift = function(key, value, callback) {

    function doUnshift(existing_value, value) {
        if (existing_value === null) {
            existing_value = [];
        } else 
        if (SmartStorage.typeOf(existing_value) !== 'array') {
            throw "SmartStorage error: Value must be an array to unshift a value on it."
        }
        existing_value.unshift(value);
        return existing_value;
    }

    if (this.password) {
        var me = this;
        this._getItemForDb(key, function(v) {
            var new_value = doUnshift(v, value);
            me.set(key, new_value, null, function(v) {
                callback(v.length);
            });
        });
        return;
    }

    var existing_value = this._getItemForDb(key);
    var new_value = doUnshift(existing_value, value);
    this.set(key, new_value);
    return new_value.length;
}

/**
* Remove a value from the beginning of an array.
* @param {String} key The key of the array.
* @returns the length of the array after shift.
*/
SmartStorage.prototype.shift = function(key, callback) {

    function doShift(val) {
        if (val === null) {
            throw "SmartStorage error: Cannot pop from non-existant key."
        }
        if (SmartStorage.typeOf(val) !== 'array') {
            throw "SmartStorage error: Value must be an array to pop a value from it."
        }
        return val.shift();
    }

    if (this.password) {
        var me = this;
        this._getItemForDb(key, function(v) {
            var popped_val = doShift(v);
            me.set(key, v, null, function() {
                callback(popped_val);
            });
        });
        return;
    }

    var val = this._getItemForDb(key);
    var shift_val = doShift(val);
    this.set(key, val);
    return shift_val;
}

SmartStorage.getCachableValue = function(value) {
    if (value.indexOf('--cache--') > -1) {
        // If the expiry time has passed then return null.
        var time_and_value = value.split("--cache--");
        if ( ((new Date()).getTime()) > time_and_value[0] ) {
            value = null;
        } else {
            value = time_and_value[1];
        }
    }
    return value;
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

SmartStorage.WorkerPool = (function getWorker() {
    var pool = [],
        workers = [];

    return {
        getWorker: function() {
            var w;
            if (pool.length > 0) {
                w = pool.pop();
            } else {
                w = new Worker("../sjcl.js");
            }
            return w;
        },
        releaseWorker: function(w) {
            pool.push(w);
        },
        pool: pool
    }
})();