'use strict';
var State = require('ampersand-state');

var Extractor = State.extend({
  autoRender: true,
  template: '<div style="display: none"></div>',

  extractStyles: function() {
    var styles = {};
    var existingStyles = this.model.svgStyles || {};

    this.svg.querySelectorAll('[style][id]').forEach(function(styledEl) {
      styles['#' + styledEl.id] = existingStyles['#' + styledEl.id] || styledEl.getAttribute('style');
      styledEl.style = null;
    });

    return styles;
  },

  removeStylesFromContent: function() {
    this.svg.querySelectorAll('[style][id]').forEach(function(styledEl) {
      styledEl.style = null;
    });
    return this;
  },

  setPathLengths: function() {
    var paths = this.el.querySelectorAll('path');
    for (var p = 0; p < paths.length; p++) {
      paths[p].style.setProperty('--path-length', paths[p].getTotalLength());
    }
    return this;
  },

  extractProps: function() {
    var props = [];
    var name, value;

    for (var p = 0; p < this.svg.style.length; p++) {
      name = this.svg.style[p].slice(2);
      value = this.svg.style.getPropertyValue(name).trim();
      props.push({
        name: name,
        value: value,
        default: value
      });
    }

    this.svg.style = null;

    var previousParameters = this.model.parameters.serialize();
    return props.concat(previousParameters);
  },

  extract: function() {
    if (!this.el || this.el.innerHTML === this.model.content) return;
    this.el.innerHTML = this.model.content;

    this.svg = this.el.querySelector('svg');
    if (!this.svg) return;
    var svgState = this.model;

    var layer = {};
    layer[svgState.idAttribute] = svgState.getId();

    layer.svgStyles = Object.keys(svgState.svgStyles).length ? this.removeStylesFromContent().model.svgStyles : this.extractStyles();

    this.model.parameters.set(this.setPathLengths().extractProps());
    layer.parameters = this.model.parameters.serialize();

    layer.content = this.el.innerHTML;

    svgState.once('change:svgStyles', function() { svgState.trigger('svg:extracted'); });
    svgState.trigger('sendCommand', 'updateLayer', {layer: layer, broadcast: true});

    svgState.set('content', layer.content, {silent: true});

    return this;
  },

  initialize: function(options) {
    this.model = options.model;
    this.el = document.createElement('div');
    this.listenToAndRun(this.model, 'change:content', this.extract);
  }
});
module.exports = Extractor;