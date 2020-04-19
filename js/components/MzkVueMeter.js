import VisuComponentStereo from '../utils/VisuComponentStereo.js';


class MzkVueMeter extends VisuComponentStereo {


  constructor(options) {
    super(options);
    // VueMeter utils
    this._amplitudeL = null;
    this._amplitudeR = null;
    this._peakL = null;
    this._peakR = null;
    this._peakSetTimeL = null;
    this._peakSetTimeR = null;
    this._prevAmplitudeL = null;
    this._prevAmplitudeR = null;
    this._orientation = null;

    this._setupVueMeter(options);
  }


  _setupVueMeter(options) {
    this._orientation = options.orientation || 'vertical';
    this._amplitudeL = 0;
    this._peakL = -1;
    this._prevAmplitudeL = 0;
    this._amplitudeR = 0;
    this._peakR = -1;
    this._prevAmplitudeR = 0;

    this._peakSetTimeL = this._audioCtx.currentTime;
    this._peakSetTimeR = this._audioCtx.currentTime;

    if (this._orientation === 'horizontal') {
      this._dom.container.classList.add('horizontal-vuemeter');
      this._canvasL.width = this._renderTo.offsetWidth;
      this._canvasR.width = this._renderTo.offsetWidth;
      this._canvasL.height = this._renderTo.offsetHeight / 2;
      this._canvasR.height = this._renderTo.offsetHeight / 2;
    } else if (this._orientation === 'vertical') {
      this._canvasL.width = this._renderTo.offsetWidth / 2;
      this._canvasR.width = this._renderTo.offsetWidth / 2;
      this._canvasL.height = this._renderTo.offsetHeight;
      this._canvasR.height = this._renderTo.offsetHeight;
    }

    this.drawLiveMeter(this._canvasL, this._amplitudeL, this._peakL);
    this.drawLiveMeter(this._canvasR, this._amplitudeR, this._peakR);
  }


  _processAudioBin() {
    var dataL = new Float32Array(this._fftSize);
    var dataR = new Float32Array(this._fftSize);
    this._nodes.analyserL.getFloatTimeDomainData(dataL);
    this._nodes.analyserR.getFloatTimeDomainData(dataR);
    /* LEFT */
    // use rms to calculate the average amplitude over the this._fftSize samples
    this._amplitudeL = Math.sqrt(dataL.reduce((prev,cur) => {
      return prev + (cur * cur);
    }, 0) / dataL.length);

    // calculate the peak position
    // special cases - peak = -1 means peak expired and waiting for amplitude to rise
    // peak = 0 means amplitude is rising, waiting for peak
    if (this._amplitudeL < this._prevAmplitudeL && this._peakL < this._prevAmplitudeL && this._peakL !== -1) {
      this._peakL = this._prevAmplitudeL;
      this._peakSetTimeL = this._audioCtx.currentTime;
    } else if (this._amplitudeL > this._prevAmplitudeL) {
      this._peakL = 0;
    }

    // draw the peak for 2 seconds, then remove it
    if (this._audioCtx.currentTime - this._peakSetTimeL > 2 && this._peakL !== 0) {
      this._peakL = -1;
    }

    this._prevAmplitudeL = this._amplitudeL;
    /* RIGHT */
    this._amplitudeR = Math.sqrt(dataR.reduce((prev,cur) => {
      return prev + (cur * cur);
    }, 0) / dataR.length);

    // calculate the peak position
    // special cases - peak = -1 means peak expired and waiting for amplitude to rise
    // peak = 0 means amplitude is rising, waiting for peak
    if (this._amplitudeR < this._prevAmplitudeR && this._peakR < this._prevAmplitudeR && this._peakR !== -1) {
      this._peakR = this._prevAmplitudeR;
      this._peakSetTimeR = this._audioCtx.currentTime;
    } else if (this._amplitudeR > this._prevAmplitudeR) {
      this._peakR = 0;
    }

    // draw the peak for 2 seconds, then remove it
    if (this._audioCtx.currentTime - this._peakSetTimeR > 2 && this._peakR !== 0) {
      this._peakR = -1;
    }

    this._prevAmplitudeR = this._amplitudeR;

    this.drawLiveMeter(this._canvasL, this._amplitudeL, this._peakL);
    this.drawLiveMeter(this._canvasR, this._amplitudeR, this._peakR);
  }


  ledGradient (canvas, ctx) {
    var gradient = null;

    if (this._orientation === 'horizontal') {
      gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    } else if (this._orientation === 'vertical') {
      gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
    } else {
      return;
    }

    gradient.addColorStop(0, 'green');
    gradient.addColorStop(0.6, 'lightgreen');
    gradient.addColorStop(0.8, 'yellow');
    gradient.addColorStop(1, 'red');

    return gradient;
  }


  drawLed(canvas, ctx, amplitude) {
    ctx.fillStyle = this.ledGradient(canvas, ctx);

    if (this._orientation === 'horizontal') {
      var ledWidth = canvas.width * amplitude;
      ctx.fillRect(0, 0, ledWidth, canvas.height);
    } else if (this._orientation === 'vertical') {
      var ledHeight = canvas.height * amplitude;
      ctx.fillRect(0, canvas.height - ledHeight, canvas.width, ledHeight);
    }
  }


  drawPeak(canvas, ctx, amplitude) {
    ctx.fillStyle = this.ledGradient(canvas, ctx);

    if (this._orientation === 'horizontal') {
      var ledWidth = canvas.width * amplitude;
      ctx.fillRect(ledWidth, 0, 1, canvas.height);
    } else if (this._orientation === 'vertical') {
      var ledHeight = canvas.height * amplitude;
      ctx.fillRect(0, canvas.height - ledHeight, canvas.width, 1);
    }
  }


  drawLiveMeter(canvas, amplitude, peak) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.drawLed(canvas, ctx, amplitude);
    this.drawPeak(canvas, ctx, peak);
  }


  _onResizeOverride() {
    if (this._orientation === 'horizontal') {
      this._canvasL.width = this._renderTo.offsetWidth - 2;
      this._canvasR.width = this._renderTo.offsetWidth - 1;
      this._canvasL.height = (this._renderTo.offsetHeight - 2) / 2;
      this._canvasR.height = (this._renderTo.offsetHeight - 2) / 2;
    } else if (this._orientation === 'vertical') {
      this._canvasL.width = (this._renderTo.offsetWidth - 4) / 2; // 2px borders times two channels
      this._canvasR.width = (this._renderTo.offsetWidth - 4) / 2; // 2px borders times two channels
      this._canvasL.height = this._renderTo.offsetHeight - 2; // 2px borders
      this._canvasR.height = this._renderTo.offsetHeight - 2; // 2px borders
    }
  }


}


export default MzkVueMeter;
