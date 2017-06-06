var layerPrologue = require('./../function-prologue');
var threePrologue = `

const camera = this.camera;
const cameras = this.cameras;
const materials = this.materials;
const geometries = this.geometries;
const loaders = this.loaders;
const scene = this.scene;

const loaderObject = function loaderObject(name, loaded) {
  loaded = loaded || noop;
  var view = loaders.views.find(v => v.model.name === name);
  if (!view) return false;

  if (view.object) return loaded(view.object);

  function objectChange() {
    if (view.object) return loaded(view.object);

    view.once('change:object', objectChange);
  }

  view.once('change:object', objectChange);

  return view.object;
};
`;
module.exports = {
  setup: {
    prologue: layerPrologue + threePrologue,
    argNames: [
    ]
  },
  update: {
    prologue: layerPrologue + threePrologue,
    argNames: [
      'utils'
    ]
  }
};