import * as _F from './core/main/index';
import * as _u from './core/utils/index';
import * as _c from './core/cookie/index';

const cookie = _c.default;
const utils = _u.default;
const FormGuard = _F.FormGuard;


// Assign to the global object (window in the browser or exports in Node.js)
if (typeof window !== 'undefined') {
  window.FormGuard = FormGuard;
} else if (typeof exports !== 'undefined') {
  exports.cookie = cookie;
  exports.utils = utils;
  exports.FormGuard = FormGuard;
}
  
// export { cookie, utils, FormGuard };