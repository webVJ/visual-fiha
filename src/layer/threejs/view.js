'use strict';
// var assign = require('lodash.assign');
var ScreenLayerView = require('./../view');
var programmableMixin = require('./../../programmable/mixin-view');
var utils = require('./../canvas/canvas-utils');

var THREE = require('three');
window.THREE = window.THREE || THREE;

// require('three/examples/js/loaders/DDSLoader');
// THREE.Loader.Handlers.add( /\.dds$/i, new THREE.DDSLoader() );
require('three/examples/js/loaders/MTLLoader');
require('three/examples/js/loaders/OBJLoader');



function noop() {}

function bindObjectChange(source, destination, keys = ['x', 'y', 'z']) {
  keys.forEach(function(key) {
    source.on('change:' + key, function() {
      destination[key] = source[key];
    });
  });
}

function bindObjectChanges(model, object) {
  if (object.position) bindObjectChange(model.position, object.position);
  if (object.rotation) bindObjectChange(model.rotation, object.rotation);
  if (object.scale) bindObjectChange(model.scale, object.scale);
  if (object.material && object.material.color && model.material && model.material.color) {
    bindObjectChange(model.material.color, object.material.color, ['r', 'g', 'b']);
  }
}

function makeThreeObjectInstance(model) {
  var Constructor = THREE[model.threeClassName];
  if (!Constructor) {
    return;
  }

  var args = (model.signature || []).map(function(name) {
    return model.get(name);
  });
  var object = new Constructor(...args);

  if (!object.isGeometry) {
    bindObjectChanges(model, object);
    object.name = model.name;
    return object;
  }

  var materialOptions = {
    color: 0x00ff00
  };

  var materialClassName = 'MeshLambertMaterial';
  if (model.material) {
    if (model.material.color) {
      var color = model.material.color;
      materialOptions.color = new THREE.Color(color.r, color.g, color.b);
    }
  }

  var material = new THREE[materialClassName](materialOptions);
  var meshObject = new THREE.Mesh(object, material);
  meshObject.name = model.name;
  bindObjectChanges(model, meshObject);
  return meshObject;
}

var State = require('ampersand-state');

var ThreeObject = State.extend({
  session: {
    model: ['state', true, null]
  },

  derived: {
    object: {
      deps: ['model'],
      fn: function() {
        var model = this.model;
        var object = this.scene.getObjectByName(model.name);

        if (object) {
          return;
        }
        return makeThreeObjectInstance(model);
      }
    },
    scene: {
      deps: ['parent'],
      fn: function() {
        return this.parent.scene;
      }
    }
  },

  render: function() {
    // that sucks... but i don't want to duck punch the renderCollection function
    this.el = document.createElement('div');
    this.el.style.display = 'none';

    var object = this.object;
    if (object) this.scene.add(object);
    return this;
  },

  remove: function() {
    var object = this.object;
    if (object) object.remove();
    if (State.prototype.remove) State.prototype.remove.apply(this, arguments);
    return this;
  }
});





// function loaderProgress(what) {
//   return function progress(xhr) {
//     if (xhr.lengthComputable) {
//       console.info('%s %s% loaded', what, (xhr.loaded / xhr.total * 100).toFixed(2));
//     }
//   };
// }
var ThreeLoader = ThreeObject.extend({
  session: {
    loading: ['boolean', true, false],
    loaded: ['any', false, null]
  },

  derived: {
    object: {
      deps: ['loaded'],
      fn: function() {
        return this.loaded;
      }
    },
    manager: {
      deps: ['parent'],
      fn: function() {
        return this.parent.manager;
      }
    }
  },

  addObj: function() {
    var obj = this.object;
    this.scene.add(obj);
    return this;
  },

  initialize: function() {
    ThreeObject.prototype.initialize.apply(this, arguments);
    var view = this;

    view.on('change:object', function() {
      var prev = view.previousAttributes();
      if (prev.object) {
        prev.object.remove();
      }
      var obj = view.object;

      var model = view.model;
      if (model.material) {
        if (model.material.color && obj.material) {
          var color = model.material.color;
          obj.material.color.setRGB(color.r, color.g, color.b);
        }
      }

      view.addObj();
    });

    view.listenToAndRun(view.model, 'change:src change:path', function() {
      if (!view.model.src || view.loading) return;

      view.loading = true;
      view.load(function() {
        view.loading = false;
      }, noop, function() {
        view.loading = false;
      });
    });
  },

  load: function(done = noop, progress = noop, error = noop) {
    console.info('stub load', done, progress, error);
  },

  render: function() {
    // that sucks... but i don't want to duck punch the renderCollection function
    this.el = document.createElement('div');
    this.el.style.display = 'none';

    return this;
  },

  remove: function() {
    ThreeObject.prototype.remove.apply(this, arguments);
    return this;
  }
});


function applyTransformations(model, object) {
  var s = model.scale;
  var r = model.rotation;
  var p = model.position;
  object.scale.set(s.x, s.y, s.z);
  object.rotation.set(r.x, r.y, r.z);
  object.position.set(p.x, p.y, p.z);
}

ThreeLoader.types = {};
ThreeLoader.types.scene = ThreeLoader.extend({
  load: function(done, progress = noop, error = noop) {
    var view = this;
    var model = this.model;
    console.trace('%s Scene loader', model.name);

    var loader = new THREE.ObjectLoader();

    function loaded(object) {
      console.info(model.name +' object', object);
      if (!object) return;
      view.loaded = object;
      // applyTransformations(model, object);
      done();
    }

    loader.load(model.path + model.src, loaded, function(...args) {
      console.log('%s loading progress', model.name, ...args);
    }, function(...args) {
      console.warn('%c%s loading error', 'color:red', model.name, ...args);
      error(...args);
    });
  }
});




ThreeLoader.types.json = ThreeLoader.extend({
  load: function(done, progress = noop, error = noop) {
    console.info('JSON loader');
    var view = this;
    var model = this.model;

    var loader = new THREE.JSONLoader();

    function loaded(object) {
      console.info(model.name +' object', object);
      if (!object) return;
      object.name = model.name;
      view.loaded = object;
      applyTransformations(model, object);
      done();
    }

    loader.load(model.path + model.src, loaded, progress, function(...args) {
      console.warn('%c%s loading error', 'color:red', model.name, ...args);
      error(...args);
    });
  }
});




ThreeLoader.types.obj = ThreeLoader.extend({
  load: function(done, progress = noop, error = noop) {
    var view = this;
    var model = this.model;

    var loader = new THREE.OBJLoader();
    loader.setPath(model.path);

    function loaded(object) {
      object.name = model.name;
      view.loaded = object;
      applyTransformations(model, object);
      done();
    }

    loader.load(model.src, loaded, progress, error);
  }
});



ThreeLoader.types.objmtl = ThreeLoader.extend({
  derived: {
    object: {
      deps: ['loaded'],
      fn: function() {
        return this.loaded ? this.loaded.object : false;
      }
    }
  },

  addObj: function() {
    var obj = this.object;
    this.scene.add(obj);
    return this;
  },

  load: function(done, progress = noop, error = noop) {
    var view = this;
    var model = this.model;

    var objLoader = new THREE.OBJLoader();
    objLoader.setPath(model.path);

    function objLoaded(object) {
      object.name = model.name;
      view.set('loaded', {object: object, materials: view.loaded.materials}, {silent: false, trigger: true});
      applyTransformations(model, object);
      done();
    }

    var mtlLoader = new THREE.MTLLoader();
    mtlLoader.setPath(model.path);

    function mtlLoaded(materials) {
      materials.preload();
      objLoader.setMaterials(materials);
      view.set('loaded', {materials: materials, object: null}, {silent: true});
      objLoader.load(model.src, objLoaded, progress, error);
    }

    mtlLoader.load(model.mtl, mtlLoaded, progress, error);
  }
});










var programmable = require('./programmable');
module.exports = ScreenLayerView.types.threejs = ScreenLayerView.extend(programmableMixin(programmable,
{
  template: function() {
    return '<div class="layer-threejs" id="' + this.model.getId() + '" view-id="' + this.cid + '"></div>';
  },

  initialize: function() {
    var view = this;
    ScreenLayerView.prototype.initialize.apply(view, arguments);

    view.on('change:width change:height', view.resize);

    view.on('change:model.setupFunction', function() {
      console.info('reboot threejs %s', view.model.getId());
      view._cleanupScene()._renderScene();
    });
  },

  resize: function() {
    if (!this.renderer || !this.camera) return this;
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
    return this;
  },

  derived: {
    manager: {
      deps: [],
      fn: function() {
        return new THREE.LoadingManager();
      }
    },
    scene: {
      deps: [],
      fn: function() {
        return new THREE.Scene();
      }
    },
    renderer: {
      deps: ['el'],
      fn: function() {
        if (!this.el) return;
        var renderer = new THREE.WebGLRenderer({alpha: true});
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(this.width, this.height);
        renderer.setClearColor(0x000000, 0);
        return renderer;
      }
    },
    camera: {
      deps: ['scene', 'model.currentCamera', 'model.cameras'],
      fn: function() {
        if (!this.scene) return;
        var model = this.model;
        var info = model.currentCamera ?
                    model.cameras.get(model.currentCamera) :
                    model.cameras.at(0);

        if (!info) {
          info = {
            name: 'defaultCamera',
            fov: 45,
            near: 1,
            far: 2000,
            position: {
              x: 45,
              y: 45,
              z: 45
            },
            lookAt: {
              x: 0,
              y: 0,
              z: 0
            }
          };
        }

        var camera = this.scene.getObjectByName(info.name);
        if (!camera) {
          camera = new THREE.PerspectiveCamera(info.fov, this.width / this.height, info.near, info.far);
          camera.name = info.name;
        }
        else {
          camera.fov = info.fov;
          camera.aspect = this.width / this.height;
          camera.near = info.near;
          camera.far = info.far;
        }

        camera.lookAt(info.lookAt.x, info.lookAt.y, info.lookAt.z);

        return camera;
      }
    }
  },

  _cleanupScene: function() {
    var scene = this.scene;

    function empty(elem) {
      if (elem) {
        while (elem.lastChild) elem.removeChild(elem.lastChild);
      }
    }

    [
      'geometries',
      'cameras',
      'lights'
    ].forEach(function(collectionName) {
      if (this[collectionName]) this[collectionName].remove();
      this[collectionName] = null;
    }, this);

    cancelAnimationFrame(scene.id);// Stop the animation
    this.renderer.domElement.addEventListener('dblclick', null, false); //remove listener to render
    scene.scene = null;
    scene.projector = null;
    scene.camera = null;
    scene.controls = null;
    empty(scene.modelContainer);

    try {
      this.el.removeChild(this.renderer.domElement);
    } catch(up) {}

    delete this._cache.renderer;
    delete this._cache.camera;
    delete this._cache.scene;

    return this;
  },

  _renderScene: function() {
    var layer = this;

    layer.el.appendChild(layer.renderer.domElement);

    [
      'geometries',
      'cameras',
      'lights'
    ].forEach(function(collectionName) {
      layer[collectionName] = layer[collectionName] || layer.renderCollection(layer.model[collectionName], function(options) {
        return new ThreeObject({model: options.model}, {parent: layer});
      });
    });

    layer.loaders = layer.loaders || layer.renderCollection(layer.model.loaders, function(options) {
      var Constructor = ThreeLoader.types[options.model.type] || ThreeLoader;
      return new Constructor({model: options.model}, {parent: layer});
    });

    layer.callSetup(function() {
      console.info(layer.model.name +' all done!');
    }, {
      getLoaderViewByName: function(name) {
        return layer.loaders.views.find(v => v.model.name === name);
      }
    });

    return layer;
  },

  render: function() {
    ScreenLayerView.prototype.render.apply(this, arguments);

    this._renderScene();

    this.update();
    return this;
  },

  update: function() {
    if (!this.camera) return;
    var layer = this;

    layer.callUpdate({
      scene: layer.scene,

      utils: utils,

      getLoaderViewByName: function(name) {
        return layer.loaders.views.find(v => v.model.name === name);
      }
    });

    this.renderer.render(this.scene, this.camera);
  },

  remove: function() {
    this._cleanupScene();
    ScreenLayerView.prototype.remove.apply(this, arguments);
  }
}));