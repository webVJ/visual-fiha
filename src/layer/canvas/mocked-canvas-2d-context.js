'use strict';
var noop = function(){};
var mockedCtx = {
  save: noop,
  restore: noop,
  scale: noop,
  rotate: noop,
  translate: noop,
  transform: noop,
  setTransform: noop,
  resetTransform: noop,
  createLinearGradient: noop,
  createRadialGradient: noop,
  createPattern: noop,
  clearRect: noop,
  fillRect: noop,
  strokeRect: noop,
  beginPath: noop,
  fill: noop,
  stroke: noop,
  drawFocusIfNeeded: noop,
  clip: noop,
  isPointInPath: noop,
  isPointInStroke: noop,
  fillText: noop,
  strokeText: noop,
  measureText: noop,
  drawImage: noop,
  createImageData: noop,
  getImageData: noop,
  putImageData: noop,
  getContextAttributes: noop,
  setLineDash: noop,
  getLineDash: noop,
  closePath: noop,
  moveTo: noop,
  lineTo: noop,
  quadraticCurveTo: noop,
  bezierCurveTo: noop,
  arcTo: noop,
  rect: noop,
  arc: noop,
  ellipse: noop,
  // properties
  globalAlpha: 1,
  globalCompositeOperation: 'source-over',
  filter: 'none',
  imageSmoothingEnabled: true,
  imageSmoothingQuality: 'low',
  strokeStyle: '#000000',
  fillStyle: '#000000',
  shadowOffsetX: 0,
  shadowOffsetY: 0,
  shadowBlur: 0,
  shadowColor: 'rgba(0, 0, 0, 0)',
  lineWidth: 1,
  lineCap: 'butt',
  lineJoin: 'miter',
  miterLimit: 10,
  lineDashOffset: 0,
  font: '10px sans-serif',
  textAlign: 'start',
  textBaseline: 'alphabetic',
  canvas: {width: 400, height: 300},
  // utilities
  _: {}
};
mockedCtx._.methods = Object.keys(mockedCtx)
  .filter(function(name) {
    return typeof mockedCtx[name] === 'function';
  });
mockedCtx._.properties = Object.keys(mockedCtx)
  .filter(function(name) {
    return name != '_' && typeof mockedCtx[name] !== 'function';
  });
module.exports = mockedCtx;