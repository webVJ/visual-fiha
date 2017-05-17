'use strict';
var assign = require('lodash.assign');
var View = require('./control-view');
var objectPath = require('./../utils/object-path');
var ParameterListView = require('./../parameter/list-view');


var DetailsView = View.extend({
  template: `
    <section class="row rows">
      <header class="row no-grow">
        <div class="columns">
          <h3 class="column">Details for <span data-hook="name"></span> <small data-hook="type"></small></h3>
        </div>
        <h5 data-hook="object-path"></h5>
      </header>

      <div class="content"></div>
    </section>
  `,

  initialize: function() {
    this.listenTo(this.rootView, 'all', function(evtName) {
      if (evtName.indexOf('app:') === 0 && evtName.indexOf('Mapping') > 0) {
        this.trigger('change:model', this.model);
      }
      else if (evtName === 'blink') {
        if(this.modelPath === arguments[1]) this.blink();
      }
    });
  },

  derived: {


    modelPath: {
      deps: ['model'],
      fn: function() {
        return objectPath(this.model);
      }
    }
  },

  editFunction: function(propName, options = {}) {
    var rootView = this.rootView;
    var path = objectPath(this.model);
    var script = this.model.get(propName) || '';
    rootView.getEditor(assign({}, {
      tabName: this.model.getId() + ' ' + propName.replace('Function', ''),
      script: script,
      language: 'javascript',
      title: path + '.' + propName.replace('Function', ''),
      onshoworigin: function() {
        rootView.trigger('blink', path);
      },
      autoApply: true,
      onvalidchange: function doneEditingFunction(str) {
        rootView.sendCommand('propChange', {
          path: path,
          property: propName,
          value: str
        });
      }
    }, options));
  },

  subviews: {
    parameterList: {
      waitFor: ['el'],
      selector: '.content',
      constructor: ParameterListView
    }
  },

  render: function() {
    View.prototype.render.apply(this, arguments);

    if (this.parameters) {
      this.parameters.remove();
    }

    this.trigger('change:model');
    this.trigger('change:model.name');
    this.trigger('change:modelPath');
    return this;
  },

  bindings: {
    'model.name': '[data-hook=name]',
    'model.type': [
      {
        selector: '[name=parameter-type]',
        type: function(el, val) {
          if (document.activeElement === el) return;
          el.querySelectorAll('option').forEach(o => { o.selected = false; });
          var selectedOption = el.querySelector('option[value="' + val + '"]');
          if (selectedOption) selectedOption.selected = true;
        }
      },
      {
        selector: '[data-hook=type]',
        type: 'text'
      },
      {
        type: function(el, val, prev) {
          if (prev) el.classList.remove('details-' + prev);
          el.classList.add('details');
          el.classList.add('details-' + val);
        }
      }
    ],
    modelPath: '[data-hook="object-path"]'
  }
});

module.exports = DetailsView;
