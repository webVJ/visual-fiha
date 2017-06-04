'use strict';
var State = require('ampersand-state');

var el = new Audio(); // singelton audio element interface
el.crossOrigin = 'anonymous';

var AudioState = State.extend({
  props: {
    // stream: ['string', false, 'http://46.163.116.101:9000/stream-low'],
    stream: ['string', false, ''],
    fftSize: ['number', true, 256],
    maxDecibels: ['number', true, -10],
    minDecibels: ['number', true, -90],
    smoothingTimeConstant: ['number', true, 0.85]
  },

  initialize: function() {
    [
      'minDecibels',
      'maxDecibels',
      'smoothingTimeConstant',
      'fftSize'
    ].forEach(function(name) {
      this.on('change:' + name, function() {
        try {
          this.analyser[name] = this.get(name);
        }
        catch (e) {
          console.info('%caudio state analyser error: %s', 'color: red', e.message);
        }
      });
    }, this);

    this._bindAudioEvents();
    this.on('change:stream', function() {
      el.src = this.stream || '';
    });

    if (this.stream) el.src = this.stream;
  },

  _bindAudioEvents: function() {
    var state = this;
    state._unbindAudioEvents();
    var fns = state._audioEvents;

    Object.keys(state.audioEvents).forEach(function(name) {
      fns[name] = function(evt) {
        // console.info('event', name, evt.type);
        state.trigger('audio:' + name, evt);
        state.audioEvents[name].call(state, evt);
      };
    });

    Object.keys(fns).forEach(function(name) {
      el.addEventListener(name, fns[name], false);
    });
    return state;
  },

  _unbindAudioEvents: function() {
    var fns = this._audioEvents || {};
    Object.keys(fns).forEach(function(name) {
      el.removeEventListener(name, fns[name], false);
    }, this);
    this._audioEvents = {};
    return this;
  },

  audioEvents: {
    error: function() {
      var error = el.error;
      console.error('audio error "%s" (%s)', [
        'aborted',
        'network',
        'decode',
        'not supported'
      ][error.code - 1], error.code);
    },
    canplay: function() {
      el.play();
    }
  },

  derived: {
    context: {
      deps: [],
      fn: function() {
        return new window.AudioContext();
      }
    },
    audioSource: {
      deps: ['context'],
      fn: function() {
        return this.context.createMediaElementSource(el);
      }
    },
    analyser: {
      deps: ['context'],
      fn: function() {
        var analyser = this.context.createAnalyser();
        try {
          analyser.minDecibels = this.minDecibels;
          analyser.maxDecibels = this.maxDecibels;
          analyser.smoothingTimeConstant = this.smoothingTimeConstant;
          analyser.fftSize = this.fftSize;
        }
        catch (e) {
          console.info('%caudio state analyser error: %s', 'color: red', e.message);
        }
        return analyser;
      }
    },
    frequencyArray: {
      deps: ['analyser', 'fftSize'],
      fn: function () {
        return new window.Uint8Array(this.analyser.frequencyBinCount);
      }
    },
    timeDomainArray: {
      deps: ['analyser', 'fftSize'],
      fn: function () {
        return new window.Uint8Array(this.analyser.frequencyBinCount);
      }
    }
  }
});


module.exports = AudioState;