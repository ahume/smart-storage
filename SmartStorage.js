function SmartStorage(dbname) {
    if (SmartStorage.browserIsSupported()) {
        this.dbname = dbname;
    }
}

SmartStorage.prototype.setItemForDb = function(key, value) {
    /* Stash a key/value in the browser store, prefixed with the dbname.
    */
    localStorage[this.dbname + '_' + key] = JSON.stringify(value);
}

SmartStorage.prototype.getItemForDb = function(key) {
    /* Get a value from the browser store, based on dbname and key.    
    */
    var prefixed_key = this.dbname + '_' + key;
    return localStorage[prefixed_key] && JSON.parse(localStorage[prefixed_key]);
}

SmartStorage.prototype.removeItemForDb = function(key) {
    localStorage.removeItem(this.dbname + '_' + key);
}

SmartStorage.prototype.set = function(key, value) {
    if (arguments.length < 2) {
        throw "SmartStorage error: set() requires 2 arguments."
    }
    if (SmartStorage.typeOf(value) === "function") {
        throw "SmartStorage error: Can't store function reference."
    }
    this.setItemForDb(key, value);
}

SmartStorage.prototype.get = function(key) {
    if (arguments.length < 1) {
        throw "SmartStorage error: get() requires 1 argument."
    }
    return this.getItemForDb(key);
}

SmartStorage.prototype.append = function(key, value) {
    var existing_value = this.getItemForDb(key);
    if (existing_value) {
        value = existing_value + value;
    }
    this.setItemForDb(key, value);
    return value.length;
}

SmartStorage.prototype.incr = function(key) {
    var new_value;
    var old_value = this.getItemForDb(key);
    try {
        new_value = parseInt(old_value) + 1;
    } catch(e) {
        new_value = 0;
    }
    this.setItemForDb(key, new_value);
    return new_value;
}

SmartStorage.prototype.rename = function(key, newkey) {
    this.setItemForDb(newkey, this.getItemForDb(key));
    this.removeItemForDb(key);
}

SmartStorage.prototype.strlen = function(key) {
    
}







SmartStorage.browserIsSupported = function() {
    try {
        return 'localStorage' in window && window['localStorage'] !== null;
    } catch (e) { return false; }
}
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
SmartStorage.stringifyValue = function(value) {
    if (SmartStorage.typeOf(value) == 'function') {
        throw "SmartStorage error: You cannot store a function reference";
    }
    
    return JSON.stringify(value);
}
SmartStorage.parseValue = function(value) {
    return JSON.parse(value);
}
SmartStorage.translateTypedString = function(typed_value) {
    var value = typed_value.split("__")[1];
    return typed_value && JSON.parse(value);
    
}