'use strict';
var View = require('ampersand-view');

var LayerView = View.extend({
  template: function() {
    return `
      <div id="${this.model.getId()}" view-id="${this.cid}" class="missing-layer-view" style="will-change:transform, opacity, backfaceVisibility;width:100%;height:100%;display:table">
        <div style="display:table-cell;color:#666;vertical-align:middle;text-align:center;font-weight:700;font-size:30px;text-shadow:0 0 4px #000">
          Missing
          <span data-hook="type"></span> for
          <span data-hook="name"></span>
          layer view
          <br/>
          <span data-hook="frametime"></span>
        </div>
      </div>
    `;
  },

  updateParameter: function(parameter) {
    if (!parameter) return;
    this.setProperty('--' + parameter.name, parameter.value);
  },

  initialize: function() {
    this.listenTo(this.model.parameters, 'change:value', this.updateParameter);
    this.model.parameters.forEach(this.updateParameter, this);
  },

  derived: {
    styleEl: {
      deps: [],
      fn: function() {
        var id = this.model.getId();
        var el = document.getElementById('style-' + id);
        if (!el) {
          el = document.createElement('style');
          el.id = 'style-' + id;
          el.appendChild(document.createTextNode(''));
          document.head.appendChild(el);
        }
        return el;
      }
    },
    sheet: {
      deps: ['styleEl'],
      fn: function() {
        return this.styleEl.sheet;
      }
    },
    cssRule: {
      deps: ['sheet', 'model.layerStyles'],
      fn: function() {
        if (this.sheet.cssRules.length === 0) {
          this.addRule('', this.model.layerStyles);
        }
        return this.sheet.cssRules[0];
      }
    },
    layerStyleObj: {
      deps: ['model', 'model.layerStyles'],
      fn: function() {
        var exp = /[\s]*([^:]+)[\s]*:[\s]*([^;]+)[\s]*;[\s]*/gim;
        return ((this.model.layerStyles || '').match(exp) || [])
          .map(s => s
            .trim()
            .split(':')
              .map(ss => ss
                .replace(';', '')
                .trim()));
      }
    }
  },

  session: {
    width: ['number', true, 400],
    height: ['number', true, 300]
  },

  bindings: {
    'model.type': '[data-hook=type]',
    'model.name': '[data-hook=name]',
    'model.active': {type: 'toggle'},
    'model.layerStyles': {
      type: function() {
        var style = this.cssRule.style;
        this.layerStyleObj.forEach(function(arr) {
          style[arr[0]] = arr[1];
        });
      }
    },
    'model.zIndex': {
      type: function(el, val) {
        this.cssRule.style.zIndex = val;
      }
    }
  },

  setProperty: function(...args) {
    this.cssRule.style.setProperty(...args);
  },

  addRule: function(selector, parameters) {
    var sheet = this.sheet;
    var prefix = '#'+ this.model.getId() +' ';
    var index = sheet.cssRules.length;
    selector = (selector.indexOf('@') === 0 ? selector : prefix + selector).trim();
    for (var i = index - 1; i >= 0; i--) {
      if (sheet.cssRules[i].selectorText === selector) {
        sheet.deleteRule(i);
      }
    }


    index = sheet.cssRules.length;

    sheet.insertRule(selector + ' { ' + parameters + ' } ', index);
    return this;
  },

  remove: function() {
    // they are some issues with bootstraping a new setup if the element is removed
    // var styleEl = this.styleEl;
    // if (styleEl && styleEl.parentNode) {
    //   styleEl.parentNode.removeChild(styleEl);
    // }
    return View.prototype.remove.apply(this, arguments);
  },

  update: function() {
    this.model.parameters.forEach(this.updateParameter, this);
  }
});
LayerView.types = {};
module.exports = LayerView;