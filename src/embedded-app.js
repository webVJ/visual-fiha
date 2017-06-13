'use strict';
require.ensure([
  'lodash.assign',
  'ampersand-state',
  'ampersand-collection'
], function() {
require.ensure([
  'ampersand-view'
], function() {
require.ensure([
  './screen/state',
], function() {
require.ensure([
  './screen/view',
], function() {
// ---------------------------------------------------------------
var State = require('ampersand-state');
var AudioState = require('./controller/audio/state');
var ScreenState = require('./screen/state');
var ScreenView = require('./screen/view');
var ControlsView = require('./embedded/controls');
var LoadedWorker = require('worker-loader?name=worker-build.js!./web-worker.js');

var broadcastId = 'embeddedVfBus';
var bdy = document.body;

var InfoState = State.extend({
  children: {
    audio: AudioState
  },

  session: {
    setupId: 'string',
    author: 'string',
    title: 'string'
  }
});

var EmbeddedRouter = require('ampersand-router').extend({
/*
  initializeBroadcastChannel: function() {
    this.broadcastChannel = new BroadcastChannel(this.broadcastId || 'vfBus');

    this.broadcastChannel.addEventListener('message', this._handleBroadcastMessages.bind(this), {
      capture: false,
      passive: true
    });

    return this;
  },

  leaveBroadcastChannel: function() {
    if (this.broadcastChannel) this.broadcastChannel.close();
    return this;
  },
*/
  initializeWorker: function() {
    this.worker = new LoadedWorker();
    this.worker.postMessage({
      command: 'setMode',
      payload: {mode: 'embedded'}
    });

    // this.worker.postMessage({
    //   command: 'setBroadcastId',
    //   payload: {broadcastId: broadcastId}
    // });

    // this.worker.addEventListener('message', this._handleWorkerMessages.bind(this), {
    //   capture: false,
    //   passive: true
    // });
    return this;
  },

  killWorker: function() {
    var router = this;
    if (router.worker) router.worker.terminate();
    return router;
  },

  initialize: function() {
    this.initializeWorker();
    var info = this.info = new InfoState({}, {
      parent: this
    });

    info.on('change:title', function() {
      document.head.querySelector('title').textContent = info.title + ' || Visual Fiha';
    });

    var screenView = this.screen = new ScreenView({
      channel: this.worker,
      model: new ScreenState({}),
      broadcastId: broadcastId,
      el: document.body.querySelector('.screen'),
      width: bdy.clientWidth,
      height: bdy.clientHeight
    });
    screenView.render();
    // this.listenTo(this.screen.model, 'all', function(evtName) {
    //   if(evtName.indexOf('app:') === 0) console.info('triggered %s', evtName);
    // });

    function resize() {
      screenView.resize(bdy);
    }

    window.addEventListener('resize', require('lodash.debounce')(resize, 100));
    setTimeout(resize, 1500);

    // -------------------------------

    this.controls = new ControlsView({
      model: info,
      el: document.querySelector('.vf-embedded-controls'),
      parent: this
    });

    // ----u---------------------------

    this._animate();

    this.history.start({
      root: location.pathname,
      pushState: false
    });
  },

  _animate: function() {
    var view = this;
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        view.screen.model.clock.refresh();
        view.controls.update();
        view._animate();
      });
    });
  },


  routes: {
    '': 'loadSetup',
    'setup/:setupId': 'loadSetup',
  },

  loadSetup: function(setupId) {
    console.time(setupId);

    var router = this;
    setupId = setupId || 'local-demo-3d-zeropaper';
    router.info.setupId = setupId;

    function done(err, setup) {
      console.timeEnd(setupId);
      if (err) throw err;
      router.info.title = setup.title || 'No Title';
      router.info.author = setup.author || 'Anonymous';
      router.info.audio.stream = setup.audio.stream;
      console.info('bpm', setup.bpm, setup.clock.bpm, router.screen.model.clock.bpm);
    }

    if (setupId.indexOf('local-') === 0) {
      router._loadLocal(setupId, done);
    // }
    // else {
    //   router._loadGist(setupId, done);
    }
  },

  _loadLocal: function(setupId, done) {
    done = typeof done === 'function' ? done : function(err) {
      if(err) console.error('localforage error', err.message);
    };

    this.listenToOnce(this.screen.model, 'app:broadcast:storageLoad', function(data) {
      done(data.error, data.setup);
    });

    this.worker.postMessage({
      command: 'storageLoad',
      payload: {
        setupId: setupId
      }
    });
  // },

  // _loadGist: function(gistId, done) {
  //   var gistView = this.view.gistView;
  //   var same = gistView.gistId === gistId;
  //   gistView.gistId = gistId;
  //   if (!same) {
  //     gistView._loadGist(function(err, content) {
  //       if (err) return done(err);
  //       done(null, fromYaml(content));
  //     });
  //   }
  }
});



var router = new EmbeddedRouter({});
console.info('router', router);
// ---------------------------------------------------------------
}, 'screen-view');
}, 'screen-state');
}, 'ampersand-view');
}, 'ampersand-data');