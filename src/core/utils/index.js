'use strict';


// utils is a library of generic helper functions non-specific to axios

const {toString} = Object.prototype;
const {getPrototypeOf} = Object;

const kindOf = (cache => thing => {
    const str = toString.call(thing);
    return cache[str] || (cache[str] = str.slice(8, -1).toLowerCase());
})(Object.create(null));

const kindOfTest = (type) => {
  type = type.toLowerCase();
  return (thing) => kindOf(thing) === type
}



const typeOfTest = type => (thing, falseValue = false) => typeof thing === type ? true : falseValue;

/**
 * Determine if a value is an Array
 *
 * @param {Object} val The value to test
 *
 * @returns {boolean} True if value is an Array, otherwise false
 */
const {isArray} = Array;

/**
 * Determine if a value is undefined
 *
 * @param {*} val The value to test
 *
 * @returns {boolean} True if the value is undefined, otherwise false
 */
const isUndefined = typeOfTest('undefined');

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
const isArrayBuffer = kindOfTest('ArrayBuffer');


/**
 * Determine if a value is a view on an ArrayBuffer
 *
 * @param {*} val The value to test
 *
 * @returns {boolean} True if value is a view on an ArrayBuffer, otherwise false
 */
function isArrayBufferView(val) {
  let result;
  if ((typeof ArrayBuffer !== 'undefined') && (ArrayBuffer.isView)) {
    result = ArrayBuffer.isView(val);
  } else {
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
const isString = typeOfTest('string');

/**
 * Determine if a value is a Function
 *
 * @param {*} val The value to test
 * @returns {boolean} True if value is a Function, otherwise false
 */
const isFunction = typeOfTest('function');

/**
 * Determine if a value is a Number
 *
 * @param {*} val The value to test
 *
 * @returns {boolean} True if value is a Number, otherwise false
 */
const isNumber = typeOfTest('number');

/**
 * Determine if a value is an Object
 *
 * @param {*} thing The value to test
 *
 * @returns {boolean} True if value is an Object, otherwise false
 */
const isObject = (thing, falseValue = false) => thing !== null && typeof thing === 'object' ? true : falseValue;

/**
 * Determine if a value is a Boolean
 *
 * @param {*} thing The value to test
 * @returns {boolean} True if value is a Boolean, otherwise false
 */
const isBoolean = thing => thing === true || thing === false;

/**
 * Determine if a value is a plain Object
 *
 * @param {*} val The value to test
 *
 * @returns {boolean} True if value is a plain Object, otherwise false
 */
const isPlainObject = (val, returnValue = false) => {
  if (kindOf(val) !== 'object') {
    return returnValue;
  }

  const prototype = getPrototypeOf(val);
  const m = (prototype === null || prototype === Object.prototype || Object.getPrototypeOf(prototype) === null) && !(Symbol.toStringTag in val) && !(Symbol.iterator in val);
  return m ? m : returnValue;
}

const castType = (type) => {
  const parsers = {
    object: isPlainObject,
    string: isString,
    boolean: isBoolean,
    number: isNumber,
    array: isArray,
    function: isFunction,
  };
  const defaults = {
    object: {},
    string: '',
    boolean: false,
    number: 0,
    function: () => {},
    array: []
  }
  let _parser = parsers.string;
  let _cast = defaults.string;

  if (parsers[type]) {
    _parser = parsers[type]
    _cast = defaults[type];
  }
   
  return (thing, cast) => {
    if (_parser(thing)) {
      return thing;
    }
    return cast||_cast;
  }
};
const castNumber = castType('number');
const castObject = castType('object');
const castString = castType('string');
const castArray = castType('array');
const castBoolean = castType('boolean');
const castFunction = castType('function');

/**
 * Determine if a value is a Date
 *
 * @param {*} val The value to test
 *
 * @returns {boolean} True if value is a Date, otherwise false
 */
const isDate = kindOfTest('Date');

/**
 * Determine if a value is a File
 *
 * @param {*} val The value to test
 *
 * @returns {boolean} True if value is a File, otherwise false
 */
const isFile = kindOfTest('File');

/**
 * Determine if a value is a Blob
 *
 * @param {*} val The value to test
 *
 * @returns {boolean} True if value is a Blob, otherwise false
 */
const isBlob = kindOfTest('Blob');

/**
 * Determine if a value is a FileList
 *
 * @param {*} val The value to test
 *
 * @returns {boolean} True if value is a File, otherwise false
 */
const isFileList = kindOfTest('FileList');

/**
 * Determine if a value is a Stream
 *
 * @param {*} val The value to test
 *
 * @returns {boolean} True if value is a Stream, otherwise false
 */
const isStream = (val) => isObject(val) && isFunction(val.pipe);

/**
 * Determine if a value is a FormData
 *
 * @param {*} thing The value to test
 *
 * @returns {boolean} True if value is an FormData, otherwise false
 */
const isFormData = (thing) => {
  let kind;
  return thing && (
    (typeof FormData === 'function' && thing instanceof FormData) || (
      isFunction(thing.append) && (
        (kind = kindOf(thing)) === 'formdata' ||
        // detect form-data instance
        (kind === 'object' && isFunction(thing.toString) && thing.toString() === '[object FormData]')
      )
    )
  )
}

/**
 * Determine if a value is a URLSearchParams object
 *
 * @param {*} val The value to test
 *
 * @returns {boolean} True if value is a URLSearchParams object, otherwise false
 */
const isURLSearchParams = kindOfTest('URLSearchParams');

const [isReadableStream, isRequest, isResponse, isHeaders] = ['ReadableStream', 'Request', 'Response', 'Headers'].map(kindOfTest);

/**
 * Trim excess whitespace off the beginning and end of a string
 *
 * @param {String} str The String to trim
 *
 * @returns {String} The String freed of excess whitespace
 */
const trim = (str) => str.trim ?
  str.trim() : str.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');

const recursiveTrim = (str) => {
  if (isString(str)) return trim(str);

  if (isArray(str)) {
    let newArray = [];
    for(var i = 0; i < str.length; i++) {
      newArray.push(isString(str[i]) ? trim(str[i]) : recursiveTrim(str[i]));
    }
    return newArray;
  }
  else if (isPlainObject(str)) {
    return Object.fromEntries(
      Object.entries(str).map(([key, value]) => [
        key,
        recursiveTrim(value)
      ])
    );
  }
  return str;
}

/**
 * Extend List
 */
const enList = (list, extension) => {
  for (var _len2 = list.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
    args[_key2] = list[_key2];
  }
  if (isUndefined(extension)) {
    return args;
  }
  else if (!isArray(extension)) {
      extension = [extension];
  }

  const aLength = args.length;
  const eLength = extension.length;
  if (aLength >= eLength || eLength === 0) return args;

  return extension.map((ext, i) => i + 1 > aLength ? ext : args[i])

};

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
function forEach(obj, fn, {allOwnKeys = false} = {}) {
  // Don't bother if no value provided
  if (obj === null || typeof obj === 'undefined') {
    return;
  }

  let i;
  let l;

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
  } else {
    // Iterate over object keys
    const keys = allOwnKeys ? Object.getOwnPropertyNames(obj) : Object.keys(obj);
    const len = keys.length;
    let key;

    for (i = 0; i < len; i++) {
      key = keys[i];
      fn.call(null, obj[key], key, obj);
    }
  }
}

function findKey(obj, key) {
  key = key.toLowerCase();
  const keys = Object.keys(obj);
  let i = keys.length;
  let _key;
  while (i-- > 0) {
    _key = keys[i];
    if (key === _key.toLowerCase()) {
      return _key;
    }
  }
  return null;
}

const _global = (() => {
  /*eslint no-undef:0*/
  if (typeof globalThis !== "undefined") return globalThis;
  return typeof self !== "undefined" ? self : (typeof window !== 'undefined' ? window : global)
})();

const isContextDefined = (context) => !isUndefined(context) && context !== _global;

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
function merge(/* obj1, obj2, obj3, ... */) {
  const {caseless} = isContextDefined(this) && this || {};
  const result = {};
  const assignValue = (val, key) => {
    const targetKey = caseless && findKey(result, key) || key;
    if (isPlainObject(result[targetKey]) && isPlainObject(val)) {
      result[targetKey] = merge(result[targetKey], val);
    } else if (isPlainObject(val)) {
      result[targetKey] = merge({}, val);
    } else if (isArray(val)) {
      result[targetKey] = val.slice();
    } else {
      result[targetKey] = val;
    }
  }

  for (let i = 0, l = arguments.length; i < l; i++) {
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
const extend = (a, b, thisArg, {allOwnKeys}= {}) => {
  forEach(b, (val, key) => {
    if (thisArg && isFunction(val)) {
      a[key] = bind(val, thisArg);
    } else {
      a[key] = val;
    }
  }, {allOwnKeys});
  return a;
}


/**
 * Inherit the prototype methods from one constructor into another
 * @param {function} constructor
 * @param {function} superConstructor
 * @param {object} [props]
 * @param {object} [descriptors]
 *
 * @returns {void}
 */
const inherits = (constructor, superConstructor, props, descriptors) => {
  constructor.prototype = Object.create(superConstructor.prototype, descriptors);
  constructor.prototype.constructor = constructor;
  Object.defineProperty(constructor, 'super', {
    value: superConstructor.prototype
  });
  props && Object.assign(constructor.prototype, props);
}



/**
 * Returns new array from array like object or null if failed
 *
 * @param {*} [thing]
 *
 * @returns {?Array}
 */
const toArray = (thing) => {
  if (!thing) return null;
  if (isArray(thing)) return thing;
  let i = thing.length;
  if (!isNumber(i)) return null;
  const arr = new Array(i);
  while (i-- > 0) {
    arr[i] = thing[i];
  }
  return arr;
}

/**
 * Checking if the Uint8Array exists and if it does, it returns a function that checks if the
 * thing passed in is an instance of Uint8Array
 *
 * @param {TypedArray}
 *
 * @returns {Array}
 */
// eslint-disable-next-line func-names
const isTypedArray = (TypedArray => {
  // eslint-disable-next-line func-names
  return thing => {
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
const forEachEntry = (obj, fn) => {
  const generator = obj && obj[Symbol.iterator];

  const iterator = generator.call(obj);

  let result;

  while ((result = iterator.next()) && !result.done) {
    const pair = result.value;
    fn.call(obj, pair[0], pair[1]);
  }
}



/* Checking if the kindOfTest function returns true when passed an HTMLFormElement. */
const isHTMLForm = kindOfTest('HTMLFormElement');

const toCamelCase = str => {
  return str.toLowerCase().replace(/[-_\s]([a-z\d])(\w*)/g,
    function replacer(m, p1, p2) {
      return p1.toUpperCase() + p2;
    }
  );
};

/* Creating a function that will check if an object has a property. */
const hasOwnProperty = (({hasOwnProperty}) => (obj, prop) => hasOwnProperty.call(obj, prop))(Object.prototype);

/**
 * Determine if a value is a RegExp object
 *
 * @param {*} val The value to test
 *
 * @returns {boolean} True if value is a RegExp object, otherwise false
 */
const isRegExp = kindOfTest('RegExp');

const reduceDescriptors = (obj, reducer) => {
  const descriptors = Object.getOwnPropertyDescriptors(obj);
  const reducedDescriptors = {};

  forEach(descriptors, (descriptor, name) => {
    let ret;
    if ((ret = reducer(descriptor, name, obj)) !== false) {
      reducedDescriptors[name] = ret || descriptor;
    }
  });

  Object.defineProperties(obj, reducedDescriptors);
}

/**
 * Makes all methods read-only
 * @param {Object} obj
 */

const freezeMethods = (obj) => {
  reduceDescriptors(obj, (descriptor, name) => {
    // skip restricted props in strict mode
    if (isFunction(obj) && ['arguments', 'caller', 'callee'].indexOf(name) !== -1) {
      return false;
    }

    const value = obj[name];

    if (!isFunction(value)) return;

    descriptor.enumerable = false;

    if ('writable' in descriptor) {
      descriptor.writable = false;
      return;
    }

    if (!descriptor.set) {
      descriptor.set = () => {
        throw Error('Can not rewrite read-only method \'' + name + '\'');
      };
    }
  });
}


const isAsyncFn = kindOfTest('AsyncFunction');

const isThenable = (thing) =>
  thing && (isObject(thing) || isFunction(thing)) && isFunction(thing.then) && isFunction(thing.catch);




const parallel = async (...tasks) => {
  await Promise.all(tasks.map((task) => task()));
}

const series = async (...tasks) => {
    for (const task of tasks) {
        await task();
    }
}

const race = async (tasks) => {
  return await Promise.race(tasks);
}

const delay =  (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
}



const join = (array, glue, finalGlue = '') => {
    if (finalGlue === '') {
      return array.join(glue);
    }

    if (array.length === 0) {
        return '';
    }

    if (array.length === 1) {
        return array[0];
    }

    const finalItem = array.pop();

    return array.join(glue) + finalGlue + finalItem;
}

const format_date = (strdate, format, type = "datetime") => {
  
  const placeholders = {
      date: "yyyy-mm-dd",
      datetime: "yyyy-mm-dd H:i:s",
      time: "H:i:s a",
  };
  const matchers = /(yyyy|mm|dd|h|i|s|a)/gi;
  
  const placeholder = placeholders[type] || placeholders.datetime;
  if (!isString(format)) {
      format = placeholder;
  }

  const date = isDate(strdate) ? strdate : new Date(strdate);

  const padZero = (n) => (n < 10 ? `0${n}` : n);

  const yyyy = date.getFullYear();
  if (isNaN(yyyy)) {
    return null;
  }
  const mm = padZero(date.getMonth() + 1);
  const i = padZero(date.getMinutes() || 0);
  const dd = padZero(date.getDate());
  const hours = date.getHours();
  let a = "am";
  let A = "AM";
  let h = hours;

  if (h > 12) {
      h -= 12;
      a = "pm";
      A = "PM";
  }
  h = padZero(h);
  const H = padZero(hours);
  const s = padZero(date.getSeconds() || 0);
  const pattern = /([a-zA-Z]+)/g;
  const [MM, S, YYYY, DD, I] = [mm, s, yyyy, dd, i];

  const dateObj = { yyyy, YYYY, mm, MM, s, S, h, H, a, A, dd, DD, i, I };
  
  return format.replace(matchers, $1 => dateObj[$1] || $1);

}


const retry = async (fn, options = {}) => {
  if (isPlainObject(options)) {
      options = {};
  }
  options = {
      limit: 3,
      retryIF: () => true,
      timeout: 1000,
      maxTimeout: 8000,
      delay: false,
      ...options
  };
  options.timeout = options.timeout || 0;
  let lastError;
  for (let i = 0; i < options.limit; i++) {
      const nextDelay = Math.min(options.timeout * Math.pow(2, i), options.maxTimeout);
      try {
          return await fn({counter: i + 1, next:nextDelay});
      } catch (error) {
          lastError = error;
          if (!options.retryIF(error)) {
              throw error;
          }
          if (i < options.limit - 1) {
              const delay = options.delay ? 1 : 0;
              
              await new Promise((resolve) => setTimeout(resolve, nextDelay * delay));
          }
      }
  }
  throw lastError;
};

const combineArrayToObject =  (keys, values = [], defaultValue) => {
  if (!isArray(keys) || !isArray(values)) return [];

  return keys.reduce((acc, key, i) => {
      acc[key] = !isUndefined(values[i]) ? values[i] : defaultValue;
      return acc;
  }, {});
}



const isNumeric = (thing) => {
  if (!isNumber(thing)) {
    if (!isString(thing) || !/^[-]?\d*(\.\d+)?$/.test(thing)) {
      return false;
    }
    thing = parseFloat(thing);
  }
  return isNaN(thing) ? false : thing;
}

const isInteger = (thing) => {
  thing = isNumeric(thing);
  if (thing && thing % 1 === 0) {
    return thing;
  }
  return false;
};

const isDecimal = (thing) => (isNumeric(thing) && !isInteger(thing)) || (isString(thing) && /^[-]?\d*(\.\d+)?$/.test(thing));



const objectGet = (obj) => {
  let data = obj;
  for (var i = 1; i < arguments.length; i++) {
    if (isPlainObject(data)) {
      data = data[arguments[i]];
    } else {
      return;
    }
  }
  return data;
};





const isLength = (value) => isNumber(value) && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;

const len = value => {
  if (isArray(value) || isString(value)) return value.length;

  if (isPlainObject(value)) {
    return Object.keys(value).length;
  }

  return 0;
};

const isArrayLike = (value) => value != null && isLength(value.length) && !isFunction(value);
const isObjectMethod = (name)=> typeof Object === 'function' ? typeof Object[name] === 'function' : false;


const zip =  (keys, values, defaultValue) => {
  try {
  if (typeof values === 'undefined') {
      return Object.fromEntries(keys);
  }
if (!Array.isArray(keys) || !Array.isArray(values)) return [];


return keys.reduce((acc, key, i) => {
    if (isString(key)) {
      acc[key] = values[i] !== undefined ? values[i] : defaultValue;
    }
  
    else if (isArray(key) && key.length > 0) {
      acc[key[0]] = key.length > 1 ? key[1] : undefined;
    }
    return acc;
}, {});
  } catch(e){return [];}
}




const interval = (fnc, options) => {
  let intervalId;
  let time = Date.now();

  if (typeof options === 'number') {
      options = { delay: options };
  }
  else if (typeof options !== 'object' || options === null) {
      options = {};
  }
  options = { delay: 5000, ...options}
  
  
  return (...args) => {
      const context = this;
      intervalId && clearInterval(intervalId);
   
      intervalId = setInterval(() => {
      args = [Date.now() - time].concat(args);

          fnc.apply(context, args);
      }, options.delay);

      return intervalId;

  };

}

const poll = (fnc, delay = 60000) => {
  interval(fnc, delay)();
}

const memorize = (fn, cacheKey) => {
  const cache = {};
  return (...args) => {
      const key = cacheKey || JSON.stringify(args);
      if (cache[key]) {
          return cache[key];
      }
      const result = fn(...args);
      cache[key] = result;
      return result;
  };
};
//freezeMethods
const throttle = (fn, delay) => {
  let lastCall = 0;
  return (...args) => {
      const now = new Date().getTime();
      if (now - lastCall < delay) {
          return;
      }
      lastCall = now;
      return fn(...args);
  };
};



const normalize = memorize(data => {
  if (isPlainObject(data)) {
    return Object.fromEntries(
      Object.entries(data)
        .map(([key, value]) => [key, normalize(value)])
    )
  }
  else if (isArray(data)) {
    return data.map(item => normalize(item))
  }
  else if (isString(data)) {
    try {
      const parsed = JSON.parse(trim(data));

      return normalize(parsed);

    } catch(e) {}
  }
  return data;
});

// const isEmpty = (data) => {
//   const matcher = [
//       isUndefined(data),
//       data === null,
//       isString(data) && trim(data) === "",
//       isArray(data) && data.length === 0,
//       isPlainObject(data) && data && Object.keys(data).length === 0,
//   ];

//   return matcher.some((item) => item);
// };


const isSet = value => {
  if (isArray(value)) return !!value.length;

  if (value === undefined || value === null) {
    return false;
  }
  if (isString(value)) {
    return !!trim(value).length;
  }

  if (value === false) {
    return true;
  }

  if (value instanceof Date) {
    return !isNaN(value.getTime());
  }

  if (typeof value === 'object') {
    for (let _ in value) return true;

    return false;
  }

  return !!String(value).length;
};

const isEmpty = value => !isSet(value);



const generateUUID = (format = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx') => format.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
});

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;


const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') {
      return obj;
  }
  if (Array.isArray(obj)) {
      return obj.map(item => deepClone(item));
  }
  const clone = {};
  for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
          clone[key] = deepClone(obj[key]);
      }
  }
  return clone;
};


const isEmail = (str) => (
  isString(str) && 
  /^(?:[A-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9]{2,}(?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/i.test(str)
);

const isUuid = (str) => (
  isString(str) &&
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str)
);

const isUrl = (str) => (
  isString(str) &&
  /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u00a1-\uffff][a-z0-9\u00a1-\uffff_-]{0,62})?[a-z0-9\u00a1-\uffff]\.)+(?:[a-z\u00a1-\uffff]{2,}\.?))(?::\d{2,5})?(?:[/?#]\S*)?$/i.test(str)
);

const isIpAddress = (str) => (
  isString(str) &&
  /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(str)
);

const isObj = (obj, ifNotReturn = {}) => {
  if (!isPlainObject(obj)) {
    return ifNotReturn;
  }
  return obj;
}

const wrap = (value) => {
  if (isArray(value)) {
    return value;
  }
  if (isUndefined(value)) {
    return [];
  }
  else if (isString(value)) {
    return [value];
  }
  try {
    return Array.from(value);
  } catch(e) {}
};

class Observer {
    constructor() {
    this.callbacks = [];
    }

    /**
    Register a callback to be eecuted when the observed value changes.
    @params {Function} callback
    */
    watch(predictive, callback) {
      this.callbacks.push([callback, predictive]);
    }

    /**
     * Notify all registered callbacks of a value change.
     * @param {*} newValue
     * @param {*} oldValue
    */
    notify(newValue, oldValue) {
      console.log({newValue, oldValue})
      this.callbacks.forEach((callback) => callback[0](newValue, oldValue));
    }


  /**
   * Create a proxied object to observe changes
   * @param {*} initialValue
   * @returns {Proxy}
   */

  createProxy(initialValue) {
      return new Proxy({value:initialValue}, {
        set: (target, property, newValue) => {
          const oldValue = target.value;
          target.value = newValue;
          
          this.notify(newValue, oldValue);
          return true;
        },
      });
  }
}
const observer = new Observer();

const reactive = (initials) => {
    return observer.createProxy(initials);
}

const watch = (predictive, callback) => {
  observer.watch(predictive, callback);
}

// *********************

export default {
  isObj,
  deepClone,
  memorize,
  throttle,
  isObjectMethod,
  generateUUID,
  randomInt,
  interval,
  poll,
  observer,
  reactive,
  watch,
  zip,
  isLength,
  isArrayLike,
  objectGet,
  join,
  isNumeric,
  isInteger,
  combineArrayToObject,
  race,
  parallel,
  series,
  retry,
  delay,
  isArray,
  isArrayBuffer,
  isBuffer,
  isFormData,
  isArrayBufferView,
  isString,
  isNumber,
  isBoolean,
  isObject,
  isPlainObject,
  isReadableStream,
  isRequest,
  isResponse,
  isHeaders,
  isUndefined,
  isDate,
  isFile,
  isBlob,
  isRegExp,
  isFunction,
  isStream,
  isURLSearchParams,
  isTypedArray,
  isFileList,
  forEach,
  merge,
  extend,
  trim,
  inherits,
  kindOf,
  kindOfTest,
  toArray,
  forEachEntry,
  isHTMLForm,
  hasOwnProperty,
  hasOwnProp: hasOwnProperty, // an alias to avoid ESLint no-prototype-builtins detection
  reduceDescriptors,
  freezeMethods,
  toCamelCase,
  findKey,
  global: _global,
  isContextDefined,
  isAsyncFn,
  isThenable,
  isEmpty,
  isSet,
  isDecimal,
  isEmail,
  isUuid,
  isUrl,
  isIpAddress,
  
  castNumber,
  castString,
  castObject,
  castArray,
  castBoolean,
  castFunction,
  enList,
  

  normalize,
  wrap,
  format_date
};