'use strict';
function fastValues(selector = 'canvas', width = 100, height = 31) {
  return {
    binding: function(el, val) {
      var style = getComputedStyle(el);
      console.info('font', style.font);
      var ctx = this.ctx;
      if (!ctx) return;
      var h = ctx.canvas.height;
      var hh = h * 0.5;
      var w = ctx.canvas.width;
      var hw = w * 0.5;
      ctx.clearRect(0, 0, w, h);
      ctx.font = style.font;// hh + 'px monospace';
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      // ctx.strokeStyle = 'black';
      // ctx.strokeText(val, hw, hh);
      ctx.fillStyle = style.color;
      ctx.fillText(val, hw, hh);
    },

    derived: {
      ctx: {
        deps: ['el'],
        fn: function() {
          var canvas = this.query(selector);
          if (!canvas) return;
          canvas.width = width;
          canvas.height = canvas.nextElementSibling.clientHeight || height;
          return canvas.getContext('2d');
        }
      }
    }
  };
}
module.exports = fastValues;