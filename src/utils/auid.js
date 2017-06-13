'use strict';
// almost unique id
module.exports = function auid() {
  return parseInt((Math.random() + '.' + performance.now()).replace(/\./g, ''), 10);
};