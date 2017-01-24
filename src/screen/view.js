'use strict';
// var View = require('./../controller/control-view');
var View = require('ampersand-view');
var LayerView = require('./../layer/view');
require('./../layer/canvas/view');
require('./../layer/svg/view');
require('./../layer/video/view');
require('./../layer/img/view');



function signature(fn) {
  var args = fn.toString().match('function[^(]*\\(([^)]*)\\)');
  if (!args || !args[1].trim()) { return []; }
  return args[1].split(',').map(function(a){ return a.trim(); });
}

var signatures = {};
function registerCommand(commandName, command) {
  if (arguments.length === 1) {
    if (typeof arguments[0] === 'function') {
      command = arguments[0];
      commandName = command.name;
    }
    else {
      command = commands[arguments[0]];
    }
  }
  else if (typeof command !== 'function') {
    command = commands[commandName];
  }
  signatures[commandName] = signature(command);
}




var commands = {
  bootstrap: function bootstrap(state) {
    this.update(state || {});
  },
  updateLayers: function(layers) {
    layers.forEach(function(obj) {
      var layer = this.model.layers.get(obj.name);
      if (!layer) {
        console.warn('missing layer', obj.name);
      }
      else {
        layer.set(obj);
      }
    }, this);
  }





};

Object.keys(commands).forEach(registerCommand);


var clientMixin = {};
clientMixin.initializeClient = function initializeClient() {
  var channel = new window.BroadcastChannel('spike');
  var follower = this;
  var commandArgs;

  channel.addEventListener('message', function(evt) {
    var commandName = evt.data.command;
    var command = commands[commandName];

    if (typeof command !== 'function') {
      return;
    }

    if (!signatures[commandName]) {
      return;
    }

    // console.info('%cscreen command "%s"', 'color:blue', commandName);

    commandArgs = signatures[commandName].map(function(argName) {
      if (argName === 'timeStamp') return evt.timeStamp;
      return evt.data.payload[argName];
    });

    command.apply(follower, commandArgs);
  }, false);

  channel.postMessage({
    command: 'register',
    payload: {
      id: 'screen' + performance.now()
    }
  });

  this.channel = channel;
};













var ScreenView = View.extend(clientMixin, {
  autoRender: true,

  template: '<div class="screen"></div>',

  session: {
    width: ['number', true, 400],
    height: ['number', true, 300],
    captureMouse: ['boolean', true, false],
    captureDebug: ['boolean', true, false]
  },

  initialize: function () {
    if (!this.model) {
      throw new Error('Missing model option for ScreenView');
    }
    this.initializeClient();
  },

  remove: function() {
    if (this.channel) {
      this.channel.close();
    }
    return View.prototype.remove.apply(this, arguments);
  },

  resize: function () {
    if (!this.el) { return this; }
    this.el.style.position = 'fixed';
    this.el.top = 0;
    this.el.left = 0;
    this.el.style.width = '100%';
    this.el.style.height = '100%';
    if (!this.el || !this.el.parentNode) {
      return this;
    }
    this.width = this.el.parentNode.clientWidth;
    this.height = this.el.parentNode.clientHeight;
    return this._resizeLayers();
  },

  _resizeLayers: function() {
    if (!this.layersView || !this.layersView.views) { return this; }
    var w = this.width;
    var h = this.height;

    this.layersView.views.forEach(function(view) {
      view.width = w;
      view.height = h;
    });
    return this;
  },

  render: function() {
    if (!this.el) {
      this.renderWithTemplate();
    }

    if (!this.layersView) {
      this.layersView = this.renderCollection(this.model.layers, function(opts) {
        var type = opts.model.getType();
        var ScreenLayerConstructor = LayerView.types[type] || LayerView;
        return new ScreenLayerConstructor(opts);
      }, this.el, {parent: this});
      this._updateLayers();
    }

    if (!this._ar) {
      this._animate();
    }

    return this.resize();
  },

  update: function(options) {
    if (!this.layersView) {
      return this.render().update(options);
    }

    this.model.set(options);

    function findLayer(name) {
      return function(lo) {
        return lo.name === name;
      };
    }

    var triggerChange;
    var collection = this.model.layers;
    if (options.layers) {
      options.layers.forEach(function(layer) {
        triggerChange = true;
        var state = collection.get(layer.name);
        if (state) {
          state.set(layer, {
            silent: true
          });
        }
        else {
          collection.add(layer, {
            silent: true
          });
        }
      });

      collection.forEach(function(layer) {
        var found = options.layers.find(findLayer(layer.name));
        if (!found) {
          triggerChange = true;
          collection.remove(layer, {
            silent: true
          });
        }
      });

      if (triggerChange) {
        this.trigger('change:layers', collection);
      }
    }

    return this;
  },

  _ar: null,
  _animate: function(timestamp) {
    this.model.frametime = timestamp || 0;
    this._updateLayers();
    this._ar = window.requestAnimationFrame(this._animate.bind(this));
  },

  _updateLayers: function() {
    this.layersView.views.forEach(function(subview) {
      subview.update();
    });
  }
});
module.exports = ScreenView;