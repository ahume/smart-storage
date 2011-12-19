describe ("EncryptedSmartStorage", function() {

    var a = b = undefined,
        fn = function() {};

    beforeEach(function() {
        // Kill any previous, and create two new storage objects.
        localStorage.clear();
        a = new SmartStorage("testdb1", "password");
    });

    it("should return the correct value", function() {
        var result = null;
        a.set("val1", "testval1", null, function(v){ result = v});

        waitsFor(function() {
            return (result !== null);
        }, "set function never returned a value", 1000);

        runs(function() {
            a.get("val1", function(v){ result = v; });
        });

        waitsFor(function() {
            return (result !== null);
        }, "get function never returned value", 1000);

        runs(function() {
            expect(result).toEqual("testval1");
        });
    });

    describe("Append function", function() {
        it("should be able to append a string to a string and return new length", function() {
            var result = null;
            a.set("val1", "Hello", null, function(v){ result = v});

            waitsFor(function() {
                return (result !== null);
            }, "set function never returned a value", 1000);

            runs(function() {
                result = null;
                a.append("val1", " World", function(v){ result = v});
            });

            waitsFor(function() {
                return (result !== null);
            }, "append function never returned value", 1000);

            runs(function() {
                expect(result).toEqual(11);
            });

            runs(function() {
                result = null;
                a.get("val1", function(v){ result = v; });
            });

            waitsFor(function() {
                return (result !== null);
            }, "get function never returned value", 1000);

            runs(function() {
                expect(result).toEqual("Hello World");
            });
        });
    });

    it("should allow for values to be incremented", function() {
        var result = null;
        a.set("key1", 5, null, function(v) { result = v });

        waitsFor(function() {
            return (result !== null);
        }, "set function never returned a value", 1000);

        runs(function() {
            result = null;
            a.incr("key1", null, function(v) { result = v });
        });

        waitsFor(function() {
            return (result !== null);
        }, "incr function never returned value", 1000);

        runs(function() {
            expect(result).toEqual(6);
            result = null;
            a.get("key1", function(v) { result = v });
        });

        waitsFor(function() {
            return (result !== null);
        }, "incr function never returned value", 1000);

        runs(function() {
            expect(result).toEqual(6);
        });
    });

    it("should allow for values to be decremented", function() {
        var result = null;
        a.set("key1", 5, null, function(v) { result = v });

        waitsFor(function() {
            return (result !== null);
        }, "set function never returned a value", 1000);

        runs(function() {
            result = null;
            a.decr("key1", null, function(v) { result = v });
        });

        waitsFor(function() {
            return (result !== null);
        }, "decr function never returned value", 1000);

        runs(function() {
            expect(result).toEqual(4);
            result = null;
            a.get("key1", function(v) { result = v });
        });

        waitsFor(function() {
            return (result !== null);
        }, "get function never returned value", 1000);

        runs(function() {
            expect(result).toEqual(4);
        });
    });

    it("should be able to rename keys", function() {
        var result = null;
        a.set("key1", "value", null, function(v) { result = v });

        waitsFor(function() {
            return (result !== null);
        }, "set function never returned value", 1000);

        runs(function() {
            a.rename("key1", "key2");
            result = null;
            a.get("key2", function(v) { result = v });
        });

        waitsFor(function() {
            return (result !== null);
        }, "get function never returned value", 1000);

        runs(function() {
            expect(result).toEqual("value");
            result = "test val" // Because we're expecting null.
            a.get("key1", function(v) { result = v });
        });

        waitsFor(function() {
            return (result === null);
        }, "get2 function never returned value", 1000);

        runs(function() {
            expect(result).toBeNull();
        });
    });

    it("should be able to get the length of a string value", function() {
        var result = null;
        a.set("key1", "value", null, function(v) { result = v });

        waitsFor(function() {
            return (result !== null);
        }, "set function never returned value", 1000);

        runs(function() {
            expect(result).toEqual("value");
            result = null;
            a.strlength("key1", function(v) { result = v });
        });

        waitsFor(function() {
            return (result !== null);
        }, "set function never returned value", 1000);

        runs(function() {
            expect(result).toEqual(5);
        });
    });

    it("should be able to push a value on to an array", function() {
        var result = null;
        a.set("key1", [1,2,3,4,5], null, function(v) { result = v });

        waitsFor(function() {
            return (result !== null);
        }, "set function never returned value", 1000);

        runs(function() {
            result = null;
            a.push("key1", "value1", function(v) { result = v });
        });

        waitsFor(function() {
            return (result !== null);
        }, "push function never returned value", 1000);

        runs(function() {
            expect(result).toEqual(6); // Returns the length of the array
            result = null;
            a.get("key1", function(v) { result = v });
        });

        waitsFor(function() {
            return (result !== null);
        }, "get function never returned value", 1000);

        runs(function() {
            expect(result[5]).toEqual("value1");
        });
    });

    it("should be able to unshift a value on to an array", function() {
        
        var result = null;
        a.set("key1", [1,2,3,4,5], null, function(v) { result = v });

        waitsFor(function() {
            return (result !== null);
        }, "set function never returned value", 1000);

        runs(function() {
            result = null;
            a.unshift("key1", "value1", function(v) { result = v });
        });

        waitsFor(function() {
            return (result !== null);
        }, "unshift function never returned value", 1000);

        runs(function() {
            expect(result).toEqual(6); // Returns the length of the array
            result = null;
            a.get("key1", function(v) { result = v });
        });

        waitsFor(function() {
            return (result !== null);
        }, "get function never returned value", 1000);

        runs(function() {
            expect(result[0]).toEqual("value1");
        });
    });

    it("should be able to pop a value from an array", function() {

        var result = null;
        a.set("key1", [1,2,3,4,5], null, function(v) { result = v });

        waitsFor(function() {
            return (result !== null);
        }, "set function never returned value", 1000);

        runs(function() {
            result = null;
            a.pop("key1", function(v) { result = v });
        });

        waitsFor(function() {
            return (result !== null);
        }, "pop function never returned value", 1000);

        runs(function() {
            expect(result).toEqual(5);
            result = null;
            a.get("key1", function(v) { result = v });
        });

        waitsFor(function() {
            return (result !== null);
        }, "get function never returned value", 1000);

        runs(function() {
            expect(result).toEqual([1,2,3,4]);
        });
    });

    it("should be able to shift a value from an array", function() {
        var result = null;
        a.set("key1", [1,2,3,4,5], null, function(v) { result = v });

        waitsFor(function() {
            return (result !== null);
        }, "set function never returned value", 1000);

        runs(function() {
            result = null;
            a.shift("key1", function(v) { result = v });
        });

        waitsFor(function() {
            return (result !== null);
        }, "shift function never returned value", 1000);

        runs(function() {
            expect(result).toEqual(1);
            result = null;
            a.get("key1", function(v) { result = v });
        });

        waitsFor(function() {
            return (result !== null);
        }, "get function never returned value", 1000);

        runs(function() {
            expect(result).toEqual([2,3,4,5]);
        });
    });

    describe("setnx function", function() {
        it("should return false if key already exists", function() {
            var result = null;
            a.setnx("key1", "value1", function(v) { result = v });

            waitsFor(function() {
                return (result !== null);
            }, "setnx function never returned value", 1000);

            runs(function() {
                expect(result).toBeTruthy();
                result = null;
                a.setnx("key1", "value2", function(v) { result = v });
            });

            waitsFor(function() {
                return (result !== null);
            }, "setnx function never returned value", 1000);

            runs(function() {
                expect(result).toBeFalsy();
                result = null;
                a.get("key1", function(v) { result = v });
            });

            waitsFor(function() {
                return (result !== null);
            }, "get function never returned value", 1000);

            runs(function() {
                expect(result).toEqual("value1");
            });
        });
    });


});