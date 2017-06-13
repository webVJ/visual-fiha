'use strict';
var ControlView = require('./../controller/control-view');

module.exports = ControlView.extend({
  session: {
    mode: ['string', true, 'info']
  },

  events: {
    'click [name=mode-info]': '_setModeInfo'
  },

  _setModeInfo: function() {
    this.mode = 'info';
  },

  bindings: {
    mode: {
      type: 'class'
    },
    'model.title': '.title',
    'model.author': '.author',
    'model.setupId': '.setup-id'
  },

  commands: {

  },

  update: function() {}
});