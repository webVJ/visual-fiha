'use strict';

var resolve = require('./../utils/resolve');
var State = require('ampersand-state');
var Collection = require('ampersand-collection');


function compileTransformFunction(fn) {
  fn = fn || function(val) { return val; };
  var compiled;

  var str = `compiled = (function() {
  // override some stuff that should not be used
  var navigator, window, global, document, module, exports;

  return function(val, oldVal) {
    var result;
    try {
      result = (${ fn.toString() })(val, oldVal);
    }
    catch(e) {
      result = e;
    }
    return result;
  };
})();`;
  try {
    eval(str);// jshint ignore:line
  }
  catch (e) {
    compiled = function(val) { return val; };
  }
  return compiled;
}

var MappingEmitter = State.extend({
  idAttribute: 'name',

  props: {
    targets: ['array', true, function() { return []; }],
    transformFunction: ['string', true, 'function(val){return val;}'],
    source: ['string', false, ''],
    name: ['string', true, null]
  },

  derived: {
    fn: {
      deps: ['transformFunction'],
      fn: function() {
        return compileTransformFunction(this.transformFunction);
      }
    },
    sourceState: {
      deps: ['source'],
      fn: function() {
        if (this.source.indexOf('midi:') === 0) return;
        var sourcePath = this.source.split('.');
        sourcePath.pop();
        sourcePath = sourcePath.join('.');
        return this.collection.resolve(sourcePath);
      }
    },
    sourceParameter: {
      deps: ['source'],
      fn: function() {
        if (this.source.indexOf('midi:') === 0) return;
        var sourcePath = this.source.split('.');
        return sourcePath.pop();
      }
    }
  },

  hasTarget: function(targetPath) {
    return this.targets.indexOf(targetPath) > -1;
  }
});

var Mappings = Collection.extend({
  model: MappingEmitter,

  initialize: function(models, options) {
    if (!options.context) throw new Error('Missing context option for Mappings');
    var readonly;
    if (typeof options.readonly === 'undefined') {
      readonly = this.readonly = typeof DedicatedWorkerGlobalScope === 'undefined';
    }
    else {
      readonly = this.readonly = options.readonly;
    }

    this.on('reset', function(collection, info) {
      this.unbindMappings(info.previousModels).bindMappings(collection.models);
    });
    this.on('remove', function(model) {
      this.unbindMappings([model]);
    });
    this.on('add', function(model) {
      this.bindMappings([model]);
    });

    this.context = options.context;
  },


  bindMappings: function(mappings) {
    if (this.readonly) return this;

    (mappings || []).forEach(function(mapping) {
      if (!mapping.sourceState || !mapping.sourceParameter) return;
      this.listenTo(mapping.sourceState, 'change:' + mapping.sourceParameter, function(source, value) {
        this.process([mapping], value);
      });
    }, this);

    return this;
  },

  unbindMappings: function(mappings) {
    if (this.readonly) return this;

    (mappings || []).forEach(function(mapping) {
      if (!mapping.sourceState || !mapping.sourceParameter) return;
      this.stopListening(mapping.sourceState, 'change:' + mapping.sourceParameter);
    }, this);

    return this;
  },


  findMappingsBySource: function(path) {
    return this.models.filter(function(mapping) {
      return mapping.source === path;
    });
  },

  findMappingByTarget: function(path) {
    return this.models.find(function(mapping) {
      return mapping.hasTarget(path);
    });
  },





  resolve: function(path) {
    return resolve(path, this.context);
  },

  process: function(mappings, value) {
    mappings.forEach(function(mapping) {
      mapping.targets.forEach(function(target) {
        var parts = target.split('.');
        var targetParameter = parts.pop();
        var targetStatePath = parts.join('.');
        var state;
        try {
          state = this.resolve(targetStatePath);
        }
        catch(e) {
          console.info('mapping process error: %s', e.message);
        }
        if (!state) return;

        var finalValue = mapping.fn(value, state.get(targetParameter));
        if (finalValue instanceof Error) {
          console.info('mapping process error: %s', finalValue.message);
          return;
        }

        if (state.type === 'boolean') finalValue = finalValue === 'false' ? false : !!finalValue;
        if (state.type === 'string') finalValue = (finalValue || '').toString();
        if (state.type === 'number') finalValue = Number(finalValue || 0);
        try {
          state.set(targetParameter, finalValue);
        }
        catch (e) {
          console.info('mapping process error: %s', e.message);
        }
      }, this);
    }, this);

    return this;
  },

  processMIDI: function(deviceName, property, value) {
    var sources = this.findMappingsBySource('midi:' + deviceName + '.' + property);
    if (!sources || !sources.length) return this;
    return this.process(sources, value);
  }
});

module.exports = Mappings;
