'use strict';
var layerPrologue = require('./../function-prologue');
module.exports = {
  setup: false,
  update: {
    prologue: layerPrologue,// + canvasPrologue,
    argNames: [
      'frametime',
      'bpm',
      'beatnum',
      'beatprct',
      'beatlength',
      'latency',
      'fps',

      'bufferLength',
      'vol',
      'frq',

      'param',

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
      'restoreContexts'
    ]
  }
};