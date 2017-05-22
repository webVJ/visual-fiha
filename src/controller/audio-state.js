'use strict';

var State = require('ampersand-state');
var AudioState = State.extend({
  props: {
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
  },

  derived: {
    context: {
      deps: [],
      fn: function() {
        return new window.AudioContext();
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