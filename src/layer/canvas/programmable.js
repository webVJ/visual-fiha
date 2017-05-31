'use strict';
var layerPrologue = require('./../function-prologue');

module.exports = {
  setup: false,
  update: {
    prologue: layerPrologue,
    argNames: [
      'ctx',

      'utils',
      'grid',
      'distribute',
      'repeat',
      'log',
      'txt',
      'writeThings',
      'plot',
      'plotPush',
      'dot',
      'circle',
      'polygone',
      'line',
      'cacheContext',
      'restoreContexts',

      'loadImage',
      'loadVideo'
    ]
  }
};