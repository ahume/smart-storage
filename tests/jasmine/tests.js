describe("SmartStorage", function() {

    var a = b = undefined;

    beforeEach(function() {
        // Kill any previous, and create two new storage objects.
        localStorage.clear();
        a = new SmartStorage("testdb1");
        b = new SmartStorage("testdb2");
    });

    it("should create two distinct storage objects", function() {
        a.set("val1", "testval1");
        b.set("val1", "testval2");
        expect(a.get("val1")).toEqual("testval1");
        expect(b.get("val1")).toEqual("testval2");
    });

    it("should store and return true/false values", function() {
        a.set("my_true", true);
        a.set("my_false", false);
        expect(a.get("my_true")).toBeTruthy();
        expect(a.get("my_false")).toBeFalsy();
    });

    it("should store and return string values", function() {
        a.set("val1", "testval1");
        a.set("val2", (new String("testval2")));
        expect(a.get("val1")).toEqual("testval1");
        expect(a.get("val2")).toEqual("testval2");
    });

    it("should store and return arrays", function() {
        my_array = [1,2,3,4,5];
        a.set("my_array", my_array);
        expect(a.get("my_array")[3]).toEqual(my_array[3]);
    });

    it("should store and return object/hash types", function() {
        my_object = {
            "key1": "value1",
            "key2": "value2",
            "key3": [1,2,3,4,5]
        };
        a.set("my_object", my_object);
        expect(a.get("my_object").key1).toEqual(my_object.key1);
        expect(a.get("my_object").key2).toEqual(my_object.key2);
        expect(a.get("my_object").key3[3]).toEqual(my_object.key3[3]);
    });

    it("should store and return nullness", function() {
        a.set("my_null", null);
        expect(a.get("my_null")).toBeNull();
    });

    it("should store and return integers", function() {
        a.set("my_int", 1);
        expect(a.get("my_int")).toEqual(1);
    });

    it("should remove stored values", function() {
        a.set("key", "value");
        a.remove("key");
        expect(a.get("key")).toBeNull();
    });

    it("should throw an error if attempting to store a function reference", function() {
        var fn = function() { return false; };
        expect(function() {a.set("my_func", fn)}).toThrow();
    });

    describe("MultiSet function", function() {
        it("should allow setting multiple keys at once", function() {
            a.multiSet({"key1":"value1", "key2":"value2"});
            expect(a.get("key1")).toEqual("value1");
            expect(a.get("key2")).toEqual("value2");
        })
    });

    describe("Clear function", function() {
        it("show clear a given database", function() {
            a.set("key1", "value1");
            a.set("key2", "value2");
            a.set("key3", "value3");
            a.set("key4", "value4");
            b.set("key1", "value1");
            b.set("key2", "value2");
            b.set("key3", "value3");
            b.set("key4", "value4");

            a.clear();

            expect(a.get("key1")).toBeNull();
            expect(b.get("key1")).toEqual("value1");
        })
    });

    describe("Count function", function() {
        it("gives current number of keys in db", function() {
            a.set("key1", "value1");
            b.set("key1", "value1");
            a.set("key2", "value2");
            expect(a.count()).toEqual(2);
            a.set("key3", "value3");
            expect(a.count()).toEqual(3);
            a.remove("key3");
            expect(a.count()).toEqual(2);
        })
    });

    describe("Append function", function() {

        it("should be able to append a string to a string", function() {
            a.set("my_append", "Hello");
            expect(a.get("my_append")).toEqual("Hello");
            a.append("my_append", " World");
            expect(a.get("my_append")).toEqual("Hello World");
        });

        it("should be able to create a new value when attempting to append to null", function() {
            a.append("my_append", "Hello");
            expect(a.get("my_append")).toEqual("Hello");
        });

        it("should return length of new string from append method", function() {
            a.set("my_append", "Hello");
            expect(a.append("my_append", " World")).toEqual(11);
            expect(a.append("my_append", " Again")).toEqual(17);
            expect(a.get("my_append")).toEqual("Hello World Again");
        });

        it("should throw an error if attempting to append to a non-string type", function() {
            my_object = {"an": "object"};
            a.set("my_append", my_object);
            expect(function() {a.append("my_append", " World")}).toThrow();
        });
    });

    describe("Increment function", function() {

        it("should allow for integers to be incremented", function() {
            a.set("my_incr", 7);
            expect(a.get("my_incr")).toEqual(7);
            a.incr("my_incr");
            expect(a.get("my_incr")).toEqual(8);
            a.incr("my_incr", 3);
            expect(a.get("my_incr")).toEqual(11);
        });

        it("should be able to get an incremented value", function() {
            a.set("my_incr", 1);
            expect(a.incr("my_incr")).toEqual(2);
            expect(a.get("my_incr")).toEqual(2);
        });

        it("should be able to increment a floating point value", function() {
            a.set("my_incr", 1.5);
            a.incr("my_incr");
            expect(a.get("my_incr")).toEqual(2.5);
        });

        it("should be able to increment an incorrect type. Really?", function() {
            a.set("my_incr", "bad string");
            a.incr("my_incr");
            expect(a.get("my_incr")).toEqual(1);
        });
        
        it("should be able to increment a null value", function() {
            a.incr("my_incr");
            expect(a.get("my_incr")).toEqual(1);
        });
    });

    describe("Decrement function", function() {
        
        it("should allow for integers to be decremented", function() {
            a.set("my_incr", 7);
            expect(a.get("my_incr")).toEqual(7);
            a.decr("my_incr");
            expect(a.get("my_incr")).toEqual(6);
            a.decr("my_incr", 3);
            expect(a.get("my_incr")).toEqual(3);
        });

        it("should allow for various random things. Huh?", function() {
            a.set("adh", 0);
            expect(a.decr("adh")).toEqual(-1);
            expect(a.decr("adh", 3)).toEqual(-4);
            expect(a.incr("adh", 10)).toEqual(6);
            expect(a.incr("adh")).toEqual(7);
        })
    });

    describe("Rename function", function() {
        
        it("should be able to rename keys", function() {
            a.set("key1", "value");
            a.rename("key1", "key2");
            expect(a.get("key2")).toEqual("value");
            expect(a.get("key1")).toBeNull();
        });

        it("should thow an error when renaming to the same key value", function() {
            a.set("key1", "value1");
            expect(function() { a.rename("key1", "key1"); }).toThrow();
        });

        it("should thow an error when renaming a non-existant key", function() {
            a.set("key1", "value1");
            expect(function() { a.rename("key2", "key1"); }).toThrow();
        });

    });

    describe("push functions", function() {

        it("should allow for values to be pushed on arrays", function() {
            a.set("key1", [1,2,3,4,5]);
            a.push("key1", "value1");
            expect(a.get("key1")).toEqual([1,2,3,4,5,"value1"]);
        });

        it("should allow for creating array on a new key", function() {
            a.push("key1", "value1");
            expect(a.get("key1")[0]).toEqual("value1");
        });

        it("should throw an error if pushing on to a non array type", function() {
            a.set("key1", "a string");
            expect(function(){ a.push("key1", "value1"); }).toThrow();
        });

    });

    describe("pop functions", function() {

        it("should pop values off an array", function() {
            a.set("key1", [1,2,3,4,5]);
            expect(a.pop("key1")).toEqual(5);
            expect(a.get("key1")).toEqual([1,2,3,4]);
        });

        it("should throw an error if trying to pop from non-existant key", function() {
            expect(function() { a.pop("key1"); }).toThrow();
        });

        it("should throw an error if trying to pop from non array type", function() {
            a.set("key1", "a string");
            expect(function() { a.pop("key1"); }).toThrow();
        });

    });

    describe("unshift functions", function() {

        it("should allow for values to be unshifted on arrays", function() {
            a.set("key1", [1,2,3,4,5]);
            a.unshift("key1", "value1");
            expect(a.get("key1")).toEqual(["value1",1,2,3,4,5]);
        });

        it("should allow for creating array on a new key", function() {
            a.unshift("key1", "value1");
            expect(a.get("key1")[0]).toEqual("value1");
        });

        it("should throw an error if unshifting on to a non array type", function() {
            a.set("key1", "a string");
            expect(function(){ a.unshift("key1", "value1"); }).toThrow();
        });

    });
    
    describe("shift functions", function() {

        it("should shift values off an array", function() {
            a.set("key1", [1,2,3,4,5]);
            expect(a.shift("key1")).toEqual(1);
            expect(a.get("key1")).toEqual([2,3,4,5]);
        });

        it("should throw an error if trying to shift from non-existant key", function() {
            expect(function() { a.shift("key1"); }).toThrow();
        });

        it("should throw an error if trying to shift from non array type", function() {
            a.set("key1", "a string");
            expect(function() { a.shift("key1"); }).toThrow();
        });

    });

    describe("setnx function", function() {
        it("should return false if key already exists", function() {
            expect(a.setnx("key1", "value1")).toBeTruthy();
            expect(a.get("key1")).toEqual("value1");
            expect(a.setnx("key1", "value2")).toBeFalsy();
            expect(a.get("key1")).toEqual("value1");
        });
    });

    describe("getset function", function() {
        it("should return old value when setting new", function() {
            expect(a.getset("key1", "value1")).toBeNull();
            expect(a.getset("key1", "value2")).toEqual("value1");
            expect(a.get("key1")).toEqual("value2");
        })
    });

    describe("expiry functions", function() {
        // Asynchronous tests start here:
        it("should lose expired values after the correct time", function() {
            a.set("key1", "value1", 500);
            expect(a.get("key1")).toEqual("value1");

            waits(1000);

            runs(function() {
                expect(a.get("key1")).toBeNull();
            });
        });

        it("should lose expired values after the correct time when set using expire method", function() {
            a.set("key1", "value1");
            a.expire("key1", 500);
            expect(a.get("key1")).toEqual("value1");

            waits(1000);

            runs(function() {
                expect(a.get("key1")).toBeNull();
            });
        });

        it("should persist values that were once set to expire", function() {
            a.set("key1", "value1");
            a.expire("key1", 500);

            waits(300);

            runs(function() {
                a.persist("key1");
            });

            waits(500);

            runs(function() {
                expect(a.get("key1")).toEqual("value1");
            });

        });
    });
});