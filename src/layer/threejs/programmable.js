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
      'scene',
      'getLoaderViewByName',
      'utils'
    ]
  }
};