var layerPrologue = require('./../function-prologue');
module.exports = {
  setup: {
    prologue: layerPrologue,
    argNames: [
      'getLoaderViewByName'
    ]
  },
  update: {
    prologue: layerPrologue,
    argNames: [
      'frametime',
      'bpm',
      'beatnum',
      'beatprct',
      'beatlength',

      'bufferLength',
      'vol',
      'frq',

      'param',
      'scene',
      'getLoaderViewByName',
      'utils'
    ]
  }
};