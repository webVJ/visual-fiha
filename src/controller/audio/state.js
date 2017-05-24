'use strict';
var State = require('ampersand-state');

var AudioState = State.extend({
  props: {
    stream: ['string', false, 'http://46.163.116.101:9000/stream-low'],
    // stream: ['string', false, ''],
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
      this.audioElement.src = this.stream || '';
    });

    if (this.stream) this.audioElement.src = this.stream;
  },

  _bindAudioEvents: function() {
    var state = this;
    state._unbindAudioEvents();
    var fns = state._audioEvents;

    Object.keys(state.audioEvents).forEach(function(name) {
      fns[name] = function(evt) {
        console.info('event', name, evt.type);
        state.trigger('audio:' + name, evt);
        state.audioEvents[name].call(state, evt);
      };
    });

    Object.keys(fns).forEach(function(name) {
      state.audioElement.addEventListener(name, fns[name], false);
    });
    return state;
  },

  _unbindAudioEvents: function() {
    var fns = this._audioEvents || {};
    Object.keys(fns).forEach(function(name) {
      this.audioElement.removeEventListener(name, fns[name], false);
    }, this);
    this._audioEvents = {};
    return this;
  },

  audioEvents: {
    error: function() {
      var error = this.audioElement.error;
      console.error('audio error (%s):', [
        'aborted',
        'network',
        'decode',
        'not supported'
      ][error.code - 1]);
    },
    canplay: function() {
      this.audioElement.play();
    }
  },

  derived: {
    audioElement: {
      deps: [],
      fn: function() {
        var id = 'vf-audio-stream';
        var el = document.getElementById(id);
        if (!el) {
          el = document.createElement('audio');
          el.id = id;
          el.style.display = 'none';
          el.crossOrigin = 'anonymous';
          document.body.appendChild(el);
        }
        return el;
      }
    },
    context: {
      deps: [],
      fn: function() {
        return new window.AudioContext();
      }
    },
    audioSource: {
      deps: ['audioElement', 'context'],
      fn: function() {
        return this.context.createMediaElementSource(this.audioElement);
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