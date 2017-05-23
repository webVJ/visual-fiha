'use strict';
var View = require('./control-view');
var AudioMonitor = require('./audio-monitor-view');

/*
:sout=#http{mux=raw,dst=:8080/stream} :sout-keep
:sout=#http{dst=:8080/stream} :sout-keep
*/

function makeLog(name) {
  return function(...args){console.info('audio event %s', name, ...args);};
}
var AudioSource = View.extend({
  autoRender: true,

  // need to investigate min/max value for decibels:
  // https://webaudio.github.io/web-audio-api/#widl-AnalyserNode-maxDecibels
  template: `
    <div class="column rows audio-source">
      <div class="row columns">
        <div class="column">
          <label>Source</label>
          <input type="text" placeholder="https://example.com/stream" name="stream" />
        </div>
      </div>

      <div class="row columns">
        <div class="column audio-monitor"></div>

        <div class="column rows audio-controls">
          <div class="row">
            <label>MinDb</label>
            <input type="range" name="minDecibels" min="-200" max="-11" step="1" />
          </div>

          <div class="row">
            <label>MaxDb</label>
            <input type="range" name="maxDecibels" min="-70" max="120" step="1" />
          </div>

          <div class="row">
            <label>Smoothing</label>
            <input type="range" name="smoothingTimeConstant" min="0" max="1" step="0.01" />
          </div>

          <div class="row">
            <label>FftSize</label>
            <select type="number" name="fftSize" value="32" step="2">
              <option value="32">32</option>
              <option value="64">64</option>
              <option value="128">128</option>
              <option value="256">256</option>
              <option value="1024">1024</option>
              <option value="2048">2048</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  `,

  initialize: function() {
    this.on('change:model.context change:model.analyser', this.connectAudioSource);
    this._bindAudioEvents().connectAudioSource();
  },


  _bindAudioEvents: function() {
    this._unbindAudioEvents();
    var fns = this._audioEvents;

    Object.keys(this.audioEvents).forEach(function(name) {
      fns[name] = this.audioEvents[name].bind(this);
    }, this);

    Object.keys(fns).forEach(function(name) {
      this.model.audioElement.addEventListener(name, fns[name], false);
    }, this);
    return this;
  },

  _unbindAudioEvents: function() {
    var fns = this._audioEvents || {};
    Object.keys(fns).forEach(function(name) {
      this.model.audioElement.removeEventListener(name, fns[name], false);
    }, this);
    this._audioEvents = {};
    return this;
  },


  _handleAudioEvent: function(evt) {
    console.info('%caudio %s event', 'color:lightblue', evt.type, this);
    // var fn = this.audioEvents[evt.type];
    // fn.call(this, evt);
  },

  audioEvents: {
    'play': makeLog('play'),
    // 'playing': makeLog('playing'),
    'ended': makeLog('ended'),
    error: function() {
      var error = this.model.audioElement.error;
      console.error('audio error (%s):', [
        'aborted',
        'network',
        'decode',
        'not supported'
      ][error.code - 1]);
    },
    // 'loadeddata': makeLog('loadeddata'),
    'loadstart': makeLog('loadstart'),
    'pause': makeLog('pause'),
    // 'progress': makeLog('progress'),
    // 'seeked': makeLog('seeked'),
    // 'seeking': makeLog('seeking'),
    // 'durationchange': makeLog('durationchange'),
    canplay: function() {
      this.model.audioElement.play();
    },
    // 'canplaythrough': makeLog('canplaythrough'),
  },


  bindings: {
    'model.stream': {
      selector: '[name="stream"]',
      type: 'value'
    },
    'model.minDecibels': {
      selector: '[name="minDecibels"]',
      type: 'value'
    },
    'model.maxDecibels': {
      selector: '[name="maxDecibels"]',
      type: 'value'
    },
    'model.smoothingTimeConstant': {
      selector: '[name="smoothingTimeConstant"]',
      type: 'value'
    },
    'model.fftSize': {
      selector: '[name="fftSize"]',
      type: 'value'
    }
  },

  session: {
    color: 'string'
  },

  subviews: {
    monitor: {
      waitFor: 'el',
      selector: '.audio-monitor',
      prepareView: function(el) {
        var view = new AudioMonitor({
          color: this.color,
          model: this.model,
          parent: this
        });
        el.appendChild(view.el);
        return view;
      }
    }
  },


  events: {
    'change .audio-source [name]': '_changeAudioParams'
  },

  _connectMicrophone: function() {
    var view = this;
    var capture = {
      audio: true
    };

    function success(stream) {
      var source = view.model.context.createMediaStreamSource(stream);
      source.connect(view.model.analyser);
    }
    function error(err) {
      console.warn(err);
    }

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia(capture).then(success).catch(error);
    }
    else if (navigator.getUserMedia) {
      navigator.getUserMedia(capture, success, error);
    }
    return this;
  },

  connectAudioSource: function() {
    console.info('connect to', this.model.stream ? this.model.stream : 'microphone');
    if (!this.model.stream) {
      return this._connectMicrophone();
    }
    var analyser = this.model.analyser;
    var context = this.model.context;
    var gainNode = context.createGain();
    var source = context.createMediaElementSource(this.model.audioElement);
    source.connect(gainNode);
    source.connect(analyser);
    gainNode.connect(context.destination);
    return this;
  },

  _changeAudioParams: function(evt) {
    var name = evt.target.name;
    if (name === 'stream') {
      this.model.set('stream', evt.target.value);
    }
    else {
      var value = Number(evt.target.value);
      if (this.model.get(name) !== value) this.model.set(name, value);
    }
  },

  update: function() {
    if (!this.monitor) return;
    this.monitor.update();
  },

  remove: function() {
    View.prototype.remove.apply(this._unbindAudioEvents(), arguments);
  }
});
module.exports = AudioSource;