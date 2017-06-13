'use strict';

var resolve = require('./../utils/resolve');
var State = require('ampersand-state');
var Collection = require('ampersand-collection');
var compileFunction = require('./../utils/compile-function');

var prologue = `
const frametime = this.clock.frametime;
const bpm = this.clock.bpm;
const beatnum = this.clock.beatnum;
const beatprct = this.clock.beatprct;
const beatlength = this.clock.beatlength;

const audioRange = this.audio.bufferLength || 128;

const bufferLength = function() { return audioRange; };

const vol = function vol(x) {
  var arr = (this.audio.timeDomain || []);
  if (x === 'min') return arr.reduce((a, b) => Math.min(a, b), 1000);
  if (x === 'max') return arr.reduce((a, b) => Math.max(a, b), 0);
  if (typeof x === 'undefined') return arr.reduce((a, b) => a + b, 0) / arr.length;
  return arr[x] || 0;
};
const frq = function frq(x) {
  var arr = (this.audio.frequency || []);
  if (x === 'min') return arr.reduce((a, b) => Math.min(a, b), 1000);
  if (x === 'max') return arr.reduce((a, b) => Math.max(a, b), 0);
  if (typeof x === 'undefined') return arr.reduce((a, b) => a + b, 0) / arr.length;
  return arr[x] || 0;
};
`;


var MappingEmitter = State.extend({
  idAttribute: 'name',

  props: {
    targets: ['array', true, function() { return []; }],
    transformFunction: ['string', true, 'return val;'],
    source: ['string', false, ''],
    name: ['string', true, null]
  },

  lastValue: null,

  derived: {
    fn: {
      deps: ['transformFunction'],
      fn: function() {
        return compileFunction(this.name, prologue, 'val', 'prev', 'store', this.transformFunction);
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


  lastValues: function() {
    return this.map(function(model) {
      return {
        lastValue: model.lastValue,
        name: model.name
      };
    });
  },


  resolve: function(path) {
    return resolve(path, this.context);
  },

  process: function(mappings, value) {
    mappings.forEach(function(mapping) {
      mapping.lastValue = value;
      mapping.store = mapping.store || {};
      mapping.targets.forEach(function(target) {
        var store = mapping.store[target] = mapping.store[target] || {};
        var parts = target.split('.');
        var targetParameter = parts.pop();
        var targetStatePath = parts.join('.');
        var state;
        try {
          state = this.resolve(targetStatePath);
        }
        catch(e) {
          console.info('%cmapping process resolve error: %s', 'color:red', e.message);
        }
        if (!state) return;

        var mappedValue;
        try {
          mappedValue = mapping.fn.call(this.context, value, state.get(targetParameter), store);
        }
        catch (e) {
          mappedValue = e;
        }

        if (mappedValue instanceof Error) {
          console.info('%cmapping process computation error: %s', 'color:red', mappedValue.message);
          return;
        }

        if (state.type === 'boolean') mappedValue = mappedValue === 'false' || mappedValue === '0' ? false : !!mappedValue;
        if (state.type === 'string') mappedValue = (mappedValue || '').toString();
        if (state.type === 'number') mappedValue = Number(mappedValue || 0);

        try {
          state.set(targetParameter, mappedValue);
        }
        catch (e) {
          console.info('%cmapping process assignement error: %s', 'color:red', e.message);
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
