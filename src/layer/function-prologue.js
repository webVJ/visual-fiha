'use strict';
module.exports = `
const model = this.model;

const store = this.store = this.store || {};
const frametime = model.screenState.clock.frametime;
const bpm = model.screenState.clock.bpm;
const beatnum = model.screenState.clock.beatnum;
const beatprct = model.screenState.clock.beatprct;
const beatlength = model.screenState.clock.beatlength;
const latency = model.screenState.clock.latency;

const fps = this.parent.fps;
const usedHeap = this.parent.usedHeap;

const width = this.width || 400;
const height = this.height || 300;
const vw = width / 100;
const vh = height / 100;
const vmax = vw > vh ? vw : vh;
const vmin = vw < vh ? vw : vh;

const param = function(...args) { return model.parameters.getValue(...args); };

const audioRange = model.screenState.audio.bufferLength || 128;

const bufferLength = function() { return model.screenState.audio.bufferLength || 128; };

const vol = function vol(x) {
  var arr = (model.screenState.audio.timeDomain || []);
  if (x === 'min') return arr.reduce((a, b) => Math.min(a, b), 1000);
  if (x === 'max') return arr.reduce((a, b) => Math.max(a, b), 0);
  if (typeof x === 'undefined') return arr.reduce((a, b) => a + b, 0) / arr.length;
  return arr[x] || 0;
};
const frq = function frq(x) {
  var arr = (model.screenState.audio.frequency || []);
  if (x === 'min') return arr.reduce((a, b) => Math.min(a, b), 1000);
  if (x === 'max') return arr.reduce((a, b) => Math.max(a, b), 0);
  if (typeof x === 'undefined') return arr.reduce((a, b) => a + b, 0) / arr.length;
  return arr[x] || 0;
};
`;
