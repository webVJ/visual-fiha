'use strict';
/**
 * compileFunction(name, prologue, [arg1, arg2, ...] body)
 */
module.exports = function compileFunction(...args) {
  var name = args.shift();
  var prologue = args.shift();
  var body = 'var navigator, top, self, window, global, document, module, exports;\n' +
              prologue +
              '\nreturn (function(){\n' + args.pop() + '\n}).apply(null, arguments)';
  var fn;

  console.time('compileFunction ' + name);
  try {
    fn = new Function(...args, body);// jshint ignore:line
    if (typeof fn !== 'function') throw new Error('Function compilation error, returned not function');
  }
  catch (e) {
    console.log('%c compilation error: %s', 'color:red', e.message);
    fn = e;
  }
  console.timeEnd('compileFunction ' + name);
  return fn;
};