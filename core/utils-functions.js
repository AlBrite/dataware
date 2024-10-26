'use strict';
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
// Object.defineProperty(exports, "__esModule", { value: true });
// utils is a library of generic helper functions non-specific to axios
var toString = Object.prototype.toString;
var getPrototypeOf = Object.getPrototypeOf;
var kindOf = (function (cache) { return function (thing) {
    var str = toString.call(thing);
    return cache[str] || (cache[str] = str.slice(8, -1).toLowerCase());
}; })(Object.create(null));
var kindOfTest = function (type) {
    type = type.toLowerCase();
    return function (thing) { return kindOf(thing) === type; };
};
var typeOfTest = function (type) { return function (thing) { return typeof thing === type; }; };
/**
 * Determine if a value is an Array
 *
 * @param {Object} val The value to test
 *
 * @returns {boolean} True if value is an Array, otherwise false
 */
var isArray = Array.isArray;
/**
 * Determine if a value is undefined
 *
 * @param {*} val The value to test
 *
 * @returns {boolean} True if the value is undefined, otherwise false
 */
var isUndefined = typeOfTest('undefined');
/**
 * Determine if a value is a Buffer
 *
 * @param {*} val The value to test
 *
 * @returns {boolean} True if value is a Buffer, otherwise false
 */
function isBuffer(val) {
    return val !== null && !isUndefined(val) && val.constructor !== null && !isUndefined(val.constructor)
        && isFunction(val.constructor.isBuffer) && val.constructor.isBuffer(val);
}
/**
 * Determine if a value is an ArrayBuffer
 *
 * @param {*} val The value to test
 *
 * @returns {boolean} True if value is an ArrayBuffer, otherwise false
 */
var isArrayBuffer = kindOfTest('ArrayBuffer');
/**
 * Determine if a value is a view on an ArrayBuffer
 *
 * @param {*} val The value to test
 *
 * @returns {boolean} True if value is a view on an ArrayBuffer, otherwise false
 */
function isArrayBufferView(val) {
    var result;
    if ((typeof ArrayBuffer !== 'undefined') && (ArrayBuffer.isView)) {
        result = ArrayBuffer.isView(val);
    }
    else {
        result = (val) && (val.buffer) && (isArrayBuffer(val.buffer));
    }
    return result;
}
/**
 * Determine if a value is a String
 *
 * @param {*} val The value to test
 *
 * @returns {boolean} True if value is a String, otherwise false
 */
var isString = typeOfTest('string');
/**
 * Determine if a value is a Function
 *
 * @param {*} val The value to test
 * @returns {boolean} True if value is a Function, otherwise false
 */
var isFunction = typeOfTest('function');
/**
 * Determine if a value is a Number
 *
 * @param {*} val The value to test
 *
 * @returns {boolean} True if value is a Number, otherwise false
 */
var isNumber = typeOfTest('number');
/**
 * Determine if a value is an Object
 *
 * @param {*} thing The value to test
 *
 * @returns {boolean} True if value is an Object, otherwise false
 */
var isObject = function (thing) { return thing !== null && typeof thing === 'object'; };
/**
 * Determine if a value is a Boolean
 *
 * @param {*} thing The value to test
 * @returns {boolean} True if value is a Boolean, otherwise false
 */
var isBoolean = function (thing) { return thing === true || thing === false; };
/**
 * Determine if a value is a plain Object
 *
 * @param {*} val The value to test
 *
 * @returns {boolean} True if value is a plain Object, otherwise false
 */
var isPlainObject = function (val) {
    if (kindOf(val) !== 'object') {
        return false;
    }
    var prototype = getPrototypeOf(val);
    return (prototype === null || prototype === Object.prototype || Object.getPrototypeOf(prototype) === null) && !(Symbol.toStringTag in val) && !(Symbol.iterator in val);
};
/**
 * Determine if a value is a Date
 *
 * @param {*} val The value to test
 *
 * @returns {boolean} True if value is a Date, otherwise false
 */
var isDate = kindOfTest('Date');
/**
 * Determine if a value is a File
 *
 * @param {*} val The value to test
 *
 * @returns {boolean} True if value is a File, otherwise false
 */
var isFile = kindOfTest('File');
/**
 * Determine if a value is a Blob
 *
 * @param {*} val The value to test
 *
 * @returns {boolean} True if value is a Blob, otherwise false
 */
var isBlob = kindOfTest('Blob');
/**
 * Determine if a value is a FileList
 *
 * @param {*} val The value to test
 *
 * @returns {boolean} True if value is a File, otherwise false
 */
var isFileList = kindOfTest('FileList');
/**
 * Determine if a value is a Stream
 *
 * @param {*} val The value to test
 *
 * @returns {boolean} True if value is a Stream, otherwise false
 */
var isStream = function (val) { return isObject(val) && isFunction(val.pipe); };
/**
 * Determine if a value is a FormData
 *
 * @param {*} thing The value to test
 *
 * @returns {boolean} True if value is an FormData, otherwise false
 */
var isFormData = function (thing) {
    var kind;
    return thing && ((typeof FormData === 'function' && thing instanceof FormData) || (isFunction(thing.append) && ((kind = kindOf(thing)) === 'formdata' ||
        // detect form-data instance
        (kind === 'object' && isFunction(thing.toString) && thing.toString() === '[object FormData]'))));
};
/**
 * Determine if a value is a URLSearchParams object
 *
 * @param {*} val The value to test
 *
 * @returns {boolean} True if value is a URLSearchParams object, otherwise false
 */
var isURLSearchParams = kindOfTest('URLSearchParams');
var _a = ['ReadableStream', 'Request', 'Response', 'Headers'].map(kindOfTest), isReadableStream = _a[0], isRequest = _a[1], isResponse = _a[2], isHeaders = _a[3];
/**
 * Trim excess whitespace off the beginning and end of a string
 *
 * @param {String} str The String to trim
 *
 * @returns {String} The String freed of excess whitespace
 */
var trim = function (str) { return str.trim ?
    str.trim() : str.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, ''); };
/**
 * Iterate over an Array or an Object invoking a function for each item.
 *
 * If `obj` is an Array callback will be called passing
 * the value, index, and complete array for each item.
 *
 * If 'obj' is an Object callback will be called passing
 * the value, key, and complete object for each property.
 *
 * @param {Object|Array} obj The object to iterate
 * @param {Function} fn The callback to invoke for each item
 *
 * @param {Boolean} [allOwnKeys = false]
 * @returns {any}
 */
function forEach(obj, fn, _a) {
    var _b = _a === void 0 ? {} : _a, _c = _b.allOwnKeys, allOwnKeys = _c === void 0 ? false : _c;
    // Don't bother if no value provided
    if (obj === null || typeof obj === 'undefined') {
        return;
    }
    var i;
    var l;
    // Force an array if not already something iterable
    if (typeof obj !== 'object') {
        /*eslint no-param-reassign:0*/
        obj = [obj];
    }
    if (isArray(obj)) {
        // Iterate over array values
        for (i = 0, l = obj.length; i < l; i++) {
            fn.call(null, obj[i], i, obj);
        }
    }
    else {
        // Iterate over object keys
        var keys = allOwnKeys ? Object.getOwnPropertyNames(obj) : Object.keys(obj);
        var len = keys.length;
        var key = void 0;
        for (i = 0; i < len; i++) {
            key = keys[i];
            fn.call(null, obj[key], key, obj);
        }
    }
}
function findKey(obj, key) {
    key = key.toLowerCase();
    var keys = Object.keys(obj);
    var i = keys.length;
    var _key;
    while (i-- > 0) {
        _key = keys[i];
        if (key === _key.toLowerCase()) {
            return _key;
        }
    }
    return null;
}
var _global = (function () {
    /*eslint no-undef:0*/
    if (typeof globalThis !== "undefined")
        return globalThis;
    return typeof self !== "undefined" ? self : (typeof window !== 'undefined' ? window : global);
})();
var isContextDefined = function (context) { return !isUndefined(context) && context !== _global; };
/**
 * Accepts varargs expecting each argument to be an object, then
 * immutably merges the properties of each object and returns result.
 *
 * When multiple objects contain the same key the later object in
 * the arguments list will take precedence.
 *
 * Example:
 *
 * ```js
 * var result = merge({foo: 123}, {foo: 456});
 * console.log(result.foo); // outputs 456
 * ```
 *
 * @param {Object} obj1 Object to merge
 *
 * @returns {Object} Result of all merge properties
 */
function merge( /* obj1, obj2, obj3, ... */) {
    var caseless = (isContextDefined(this) && this || {}).caseless;
    var result = {};
    var assignValue = function (val, key) {
        var targetKey = caseless && findKey(result, key) || key;
        if (isPlainObject(result[targetKey]) && isPlainObject(val)) {
            result[targetKey] = merge(result[targetKey], val);
        }
        else if (isPlainObject(val)) {
            result[targetKey] = merge({}, val);
        }
        else if (isArray(val)) {
            result[targetKey] = val.slice();
        }
        else {
            result[targetKey] = val;
        }
    };
    for (var i = 0, l = arguments.length; i < l; i++) {
        arguments[i] && forEach(arguments[i], assignValue);
    }
    return result;
}
/**
 * Extends object a by mutably adding to it the properties of object b.
 *
 * @param {Object} a The object to be extended
 * @param {Object} b The object to copy properties from
 * @param {Object} thisArg The object to bind function to
 *
 * @param {Boolean} [allOwnKeys]
 * @returns {Object} The resulting value of object a
 */
var extend = function (a, b, thisArg, _a) {
    var _b = _a === void 0 ? {} : _a, allOwnKeys = _b.allOwnKeys;
    forEach(b, function (val, key) {
        if (thisArg && isFunction(val)) {
            a[key] = bind(val, thisArg);
        }
        else {
            a[key] = val;
        }
    }, { allOwnKeys: allOwnKeys });
    return a;
};
/**
 * Inherit the prototype methods from one constructor into another
 * @param {function} constructor
 * @param {function} superConstructor
 * @param {object} [props]
 * @param {object} [descriptors]
 *
 * @returns {void}
 */
var inherits = function (constructor, superConstructor, props, descriptors) {
    constructor.prototype = Object.create(superConstructor.prototype, descriptors);
    constructor.prototype.constructor = constructor;
    Object.defineProperty(constructor, 'super', {
        value: superConstructor.prototype
    });
    props && Object.assign(constructor.prototype, props);
};
/**
 * Returns new array from array like object or null if failed
 *
 * @param {*} [thing]
 *
 * @returns {?Array}
 */
var toArray = function (thing) {
    if (!thing)
        return null;
    if (isArray(thing))
        return thing;
    var i = thing.length;
    if (!isNumber(i))
        return null;
    var arr = new Array(i);
    while (i-- > 0) {
        arr[i] = thing[i];
    }
    return arr;
};
/**
 * Checking if the Uint8Array exists and if it does, it returns a function that checks if the
 * thing passed in is an instance of Uint8Array
 *
 * @param {TypedArray}
 *
 * @returns {Array}
 */
// eslint-disable-next-line func-names
var isTypedArray = (function (TypedArray) {
    // eslint-disable-next-line func-names
    return function (thing) {
        return TypedArray && thing instanceof TypedArray;
    };
})(typeof Uint8Array !== 'undefined' && getPrototypeOf(Uint8Array));
/**
 * For each entry in the object, call the function with the key and value.
 *
 * @param {Object<any, any>} obj - The object to iterate over.
 * @param {Function} fn - The function to call for each entry.
 *
 * @returns {void}
 */
var forEachEntry = function (obj, fn) {
    var generator = obj && obj[Symbol.iterator];
    var iterator = generator.call(obj);
    var result;
    while ((result = iterator.next()) && !result.done) {
        var pair = result.value;
        fn.call(obj, pair[0], pair[1]);
    }
};
/* Checking if the kindOfTest function returns true when passed an HTMLFormElement. */
var isHTMLForm = kindOfTest('HTMLFormElement');
var toCamelCase = function (str) {
    return str.toLowerCase().replace(/[-_\s]([a-z\d])(\w*)/g, function replacer(m, p1, p2) {
        return p1.toUpperCase() + p2;
    });
};
/* Creating a function that will check if an object has a property. */
var hasOwnProperty = (function (_a) {
    var hasOwnProperty = _a.hasOwnProperty;
    return function (obj, prop) { return hasOwnProperty.call(obj, prop); };
})(Object.prototype);
/**
 * Determine if a value is a RegExp object
 *
 * @param {*} val The value to test
 *
 * @returns {boolean} True if value is a RegExp object, otherwise false
 */
var isRegExp = kindOfTest('RegExp');
var reduceDescriptors = function (obj, reducer) {
    var descriptors = Object.getOwnPropertyDescriptors(obj);
    var reducedDescriptors = {};
    forEach(descriptors, function (descriptor, name) {
        var ret;
        if ((ret = reducer(descriptor, name, obj)) !== false) {
            reducedDescriptors[name] = ret || descriptor;
        }
    });
    Object.defineProperties(obj, reducedDescriptors);
};
/**
 * Makes all methods read-only
 * @param {Object} obj
 */
var freezeMethods = function (obj) {
    reduceDescriptors(obj, function (descriptor, name) {
        // skip restricted props in strict mode
        if (isFunction(obj) && ['arguments', 'caller', 'callee'].indexOf(name) !== -1) {
            return false;
        }
        var value = obj[name];
        if (!isFunction(value))
            return;
        descriptor.enumerable = false;
        if ('writable' in descriptor) {
            descriptor.writable = false;
            return;
        }
        if (!descriptor.set) {
            descriptor.set = function () {
                throw Error('Can not rewrite read-only method \'' + name + '\'');
            };
        }
    });
};
var isAsyncFn = kindOfTest('AsyncFunction');
var isThenable = function (thing) {
    return thing && (isObject(thing) || isFunction(thing)) && isFunction(thing.then) && isFunction(thing.catch);
};
var isKnownError = kindOfTest('KnownError');
var isValidationError = kindOfTest('ValidationError');
var parallel = function () {
    var tasks = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        tasks[_i] = arguments[_i];
    }
    return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, Promise.all(tasks.map(function (task) { return task(); }))];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
};
var series = function () {
    var tasks = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        tasks[_i] = arguments[_i];
    }
    return __awaiter(void 0, void 0, void 0, function () {
        var _a, tasks_1, task;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _a = 0, tasks_1 = tasks;
                    _b.label = 1;
                case 1:
                    if (!(_a < tasks_1.length)) return [3 /*break*/, 4];
                    task = tasks_1[_a];
                    return [4 /*yield*/, task()];
                case 2:
                    _b.sent();
                    _b.label = 3;
                case 3:
                    _a++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/];
            }
        });
    });
};
var race = function (tasks) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, Promise.race(tasks)];
            case 1: return [2 /*return*/, _a.sent()];
        }
    });
}); };
var delay = function (ms) {
    return new Promise(function (resolve) { return setTimeout(resolve, ms); });
};
var sleep = function (ms) {
    var night = Date.now();
    return function () { return __awaiter(void 0, void 0, void 0, function () {
        var dawn, diff;
        return __generator(this, function (_a) {
            dawn = Date.now();
            diff = dawn - night;
            if (diff < ms) {
                return [2 /*return*/, delay(ms - diff)];
            }
            return [2 /*return*/];
        });
    }); };
};
var join = function (arrays, joiner, lastJoiner) {
    if (joiner === void 0) { joiner = ", "; }
    if (lastJoiner === void 0) { lastJoiner = ", "; }
    if (arrays.length > 1) {
        var part = [arrays.slice(0, arrays.length - 1).join(joiner)];
        part.push(lastJoiner);
        part.push(arrays.slice(arrays.length - 1).join(joiner));
        return part.join("");
    }
    return arrays.join("");
};
var retry = function (fn_1) {
    var args_1 = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args_1[_i - 1] = arguments[_i];
    }
    return __awaiter(void 0, __spreadArray([fn_1], args_1, true), void 0, function (fn, options) {
        var lastError, _loop_1, i, state_1;
        if (options === void 0) { options = {}; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (isPlainObject(options)) {
                        options = {};
                    }
                    options = __assign({ limit: 3, retryIF: function () { return true; }, timeout: 1000, maxTimeout: 8000, delay: false }, options);
                    options.timeout = options.timeout || 0;
                    _loop_1 = function (i) {
                        var nextDelay, _b, error_1, delay_1;
                        return __generator(this, function (_c) {
                            switch (_c.label) {
                                case 0:
                                    nextDelay = Math.min(options.timeout * Math.pow(2, i), options.maxTimeout);
                                    _c.label = 1;
                                case 1:
                                    _c.trys.push([1, 3, , 6]);
                                    _b = {};
                                    return [4 /*yield*/, fn({ counter: i + 1, next: nextDelay })];
                                case 2: return [2 /*return*/, (_b.value = _c.sent(), _b)];
                                case 3:
                                    error_1 = _c.sent();
                                    lastError = error_1;
                                    if (!options.retryIF(error_1)) {
                                        throw error_1;
                                    }
                                    if (!(i < options.limit - 1)) return [3 /*break*/, 5];
                                    delay_1 = options.delay ? 1 : 0;
                                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, nextDelay * delay_1); })];
                                case 4:
                                    _c.sent();
                                    _c.label = 5;
                                case 5: return [3 /*break*/, 6];
                                case 6: return [2 /*return*/];
                            }
                        });
                    };
                    i = 0;
                    _a.label = 1;
                case 1:
                    if (!(i < options.limit)) return [3 /*break*/, 4];
                    return [5 /*yield**/, _loop_1(i)];
                case 2:
                    state_1 = _a.sent();
                    if (typeof state_1 === "object")
                        return [2 /*return*/, state_1.value];
                    _a.label = 3;
                case 3:
                    i++;
                    return [3 /*break*/, 1];
                case 4: throw lastError;
            }
        });
    });
};
var combineArrayToObject = function (keys, values, defaultValue) {
    if (values === void 0) { values = []; }
    if (!isArray(keys) || !isArray(values))
        return [];
    return keys.reduce(function (acc, key, i) {
        acc[key] = !isUndefined(values[i]) ? values[i] : defaultValue;
        return acc;
    }, {});
};
var isNumeric = function (thing) {
    if (!isNumber(thing)) {
        if (!isString(thing) || !/^([0-9]+)(\.([0-9]+))?$/.test(thing)) {
            return false;
        }
        thing = parseFloat(thing);
    }
    return isNaN(thing) ? false : thing;
};
var isInteger = function (thing) {
    thing = isNumeric(thing);
    return thing % 1 === 0 ? thing : false;
};
