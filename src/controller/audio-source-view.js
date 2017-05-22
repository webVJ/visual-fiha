'use strict';
var View = require('./control-view');
var AudioMonitor = require('./audio-monitor-view');
var AudioSource = View.extend({
  autoRender: true,

  // need to investigate min/max value for decibels:
  // https://webaudio.github.io/web-audio-api/#widl-AnalyserNode-maxDecibels
  template: `
    <div class="column rows audio-source">
      <!-- <audio class="row" src="http://localhost:8080/stream" controls autoplay></audio> -->
      <div class="row columns">
        <div class="column audio-monitor"></div>
        <div class="column audio-controls">
          <label>MinDb: <input type="range" name="minDecibels" min="-200" max="-11" step="1" /></label>
          <label>MaxDb: <input type="range" name="maxDecibels" min="-70" max="120" step="1" /></label>
          <label>Smoothing: <input type="range" name="smoothingTimeConstant" min="0" max="1" step="0.01" /></label>
          <label>FftSize: <select type="number" name="fftSize" value="32" step="2">
            <option value="32">32</option>
            <option value="64">64</option>
            <option value="128">128</option>
            <option value="256">256</option>
            <option value="1024">1024</option>
            <option value="2048">2048</option>
          </select></label>
        </div>
      </div>
    </div>
  `,

  initialize: function() {
    this.listenToAndRun(this, 'change:audio.context change:audio.analyser', this.connectAudioSource);
  },

  bindings: {
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
    this._connectMicrophone();
    return this;
  },

  _changeAudioParams: function(evt) {
    this.model.set(evt.target.name, Number(evt.target.value));
  },

  update: function() {
    if (!this.monitor) return;
    this.monitor.update();
  }
});
module.exports = AudioSource;