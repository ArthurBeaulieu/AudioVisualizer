import VisuComponentStereo from '../utils/VisuComponentStereo.js';


class PeakMeter extends VisuComponentStereo {


  constructor(options) {
    super(options);

    this._dbScaleMin = null;
    this._dbScaleTicks = null;
    // VueMeter utils
    this._amplitudeL = null;
    this._amplitudeR = null;
    this._peakL = null;
    this._peakR = null;
    this._peakSetTimeL = null;
    this._peakSetTimeR = null;
    this._orientation = null;

    this._dom.scaleContainer = null;
    this._dom.labels = [];

    this._setupVueMeter(options);
  }


  _setupVueMeter(options) {
    this._orientation = options.orientation || 'horizontal';
    this._dbScaleMin = options.dbScaleMin || 60;
    this._dbScaleTicks = options.dbScaleTicks || 15;
    this._amplitudeL = 0;
    this._amplitudeR = 0;
    this._peakL = 0;
    this._peakR = 0;

    this._peakSetTimeL = this._audioCtx.currentTime;
    this._peakSetTimeR = this._audioCtx.currentTime;

    this._dom.scaleContainer = document.createElement('DIV');
    this._dom.scaleContainer.classList.add('scale-container');

    if (this._orientation === 'horizontal') {
      this._dom.container.classList.add('horizontal-peakmeter');
      this._canvasL.width = this._renderTo.offsetWidth - 30; // 2px borders + 28 px with for label
      this._canvasR.width = this._renderTo.offsetWidth - 30; // 2px borders + 28 px with for label
      this._canvasL.height = (this._renderTo.offsetHeight - 14) / 2 - 2; // 2px border + scale height 14px
      this._canvasR.height = (this._renderTo.offsetHeight - 14) / 2 - 2; // 2px border + scale height 14px
      this._dom.scaleContainer.style.width = this._canvasL.width + 'px';
    } else if (this._orientation === 'vertical') {
      this._canvasL.width = (this._renderTo.offsetWidth - 18) / 2 - 2; // 2px border + scale width 18px
      this._canvasR.width = (this._renderTo.offsetWidth - 18) / 2 - 2; // 2px border + scale width 18px
      this._canvasL.height = this._renderTo.offsetHeight - 18; // 2px borders + 16px height for label
      this._canvasR.height = this._renderTo.offsetHeight - 18; // 2px borders + 16px height for label
      this._dom.scaleContainer.style.height = this._canvasL.height + 'px';
    }

    this._dom.container.insertBefore(this._dom.scaleContainer, this._dom.container.firstChild);

    this._createPeakLabel();
    this._createScaleTicks();
    this.drawLiveMeter(this._canvasL, this._amplitudeL, this._peakL);
    this.drawLiveMeter(this._canvasR, this._amplitudeR, this._peakR);
  }


  _createScaleTicks() {
    var dbTickLabel = 0;
    var numTicks = Math.floor(this._dbScaleMin / this._dbScaleTicks);
    this._dom.scaleContainer.innerHTML = '';
    if (this._orientation === 'horizontal') {
      var tickWidth = this._canvasL.width / numTicks;
      for (var i = 0; i < numTicks; i++) {
        var dbTick = document.createElement('DIV');
        this._dom.scaleContainer.appendChild(dbTick);
        dbTick.style.width = tickWidth + 'px';
        dbTick.textContent = dbTickLabel + '';
        dbTickLabel -= this._dbScaleTicks;
      }
    } else {
      var tickHeight = this._canvasL.height / numTicks;
      for (var i = 0; i < numTicks; i++) {
        var dbTick = document.createElement('DIV');
        this._dom.scaleContainer.appendChild(dbTick);
        dbTick.style.height = tickHeight + 'px';
        dbTick.textContent = dbTickLabel + '';
        dbTickLabel -= this._dbScaleTicks;
      }
    }
  }


  _createPeakLabel() {
    if (this._dom.labels.length === 2) {
      this._dom.container.removeChild(this._dom.labels[0]);
      this._dom.container.removeChild(this._dom.labels[1]);
      this._dom.labels = [];
    }

    var peakLabelL = document.createElement('DIV');
    var peakLabelR = document.createElement('DIV');
    peakLabelL.classList.add('peak-value-container');
    peakLabelR.classList.add('peak-value-container');
    peakLabelL.textContent = '-∞';
    peakLabelR.textContent = '-∞';

    if (this._orientation === 'horizontal') {
      peakLabelL.style.width = '28px';
      peakLabelL.style.height = this._canvasL.height + 2 + 'px';
      peakLabelL.style.top = '14px';

      peakLabelR.style.width = '28px';
      peakLabelR.style.height = this._canvasL.height + 2 + 'px';
      peakLabelR.style.top = 14 + this._canvasL.height + 2 + 'px';
    } else {
      peakLabelL.style.width = this._canvasL.width + 2 + 'px';
      peakLabelL.style.left = '18px';

      peakLabelR.style.width = this._canvasL.width + 2 + 'px';
      peakLabelR.style.left = 18 + this._canvasL.width + 2 + 'px';
    }

    this._dom.labels.push(peakLabelL);
    this._dom.labels.push(peakLabelR);
    this._dom.container.appendChild(this._dom.labels[0]);
    this._dom.container.appendChild(this._dom.labels[1]);
  }


  _processAudioBin() {
    this._clearCanvas();

    if (this._isPlaying === true) {
      var dataL = new Float32Array(this._fftSize);
      var dataR = new Float32Array(this._fftSize);
      this._nodes.analyserL.getFloatTimeDomainData(dataL);
      this._nodes.analyserR.getFloatTimeDomainData(dataR);
      // Compute average power over the interval.
      let sumOfSquaresL = 0;
      let sumOfSquaresR = 0;
      for (let i = 0; i < dataL.length; i++) {
        sumOfSquaresL += dataL[i] ** 2;
        sumOfSquaresR += dataR[i] ** 2;
      }
      const avgPowerDecibelsL = 10 * Math.log10(sumOfSquaresL / dataL.length);
      const avgPowerDecibelsR = 10 * Math.log10(sumOfSquaresR / dataR.length);
      // Compute peak instantaneous power over the interval.
      // let peakInstantaneousPower = 0;
      // for (let i = 0; i < dataL.length; i++) {
      //   const power = dataL[i] ** 2;
      //   peakInstantaneousPower = Math.max(power, peakInstantaneousPower);
      // }
      // const peakInstantaneousPowerDecibels = 10 * Math.log10(peakInstantaneousPower);
      // Left channel handling
      var d = this._dbScaleMin * -1;
      if (this._orientation === 'horizontal') {
        this._amplitudeL = Math.floor((avgPowerDecibelsL * this._canvasL.width) / d);
        this._amplitudeR = Math.floor((avgPowerDecibelsR * this._canvasR.width) / d);
      } else if (this._orientation === 'vertical') {
        this._amplitudeL = Math.floor((avgPowerDecibelsL * this._canvasL.height) / d);
        this._amplitudeR = Math.floor((avgPowerDecibelsR * this._canvasR.height) / d);
      }

      if (this._peakL > this._amplitudeL) { // Found a new max value (peak) [-this._dbScaleMin, 0] interval
        this._peakL = this._amplitudeL;
        this._peakSetTimeL = this._audioCtx.currentTime;
        avgPowerDecibelsL !== -Infinity ? this._dom.labels[0].textContent = PeakMeter.precisionRound(avgPowerDecibelsL, 1) : null;
      } else if (this._audioCtx.currentTime - this._peakSetTimeL > 1) {
        this._peakL = this._amplitudeL;
        this._peakSetTimeL = this._audioCtx.currentTime;
        avgPowerDecibelsL !== -Infinity ? this._dom.labels[0].textContent = PeakMeter.precisionRound(avgPowerDecibelsL, 1) : null;
      }
      // Right channel handling
      if (this._peakR > this._amplitudeR) { // Found a new max value (peak) [-this._dbScaleMin, 0] interval
        this._peakR = this._amplitudeR;
        this._peakSetTimeR = this._audioCtx.currentTime;
        avgPowerDecibelsR !== -Infinity ? this._dom.labels[1].textContent = PeakMeter.precisionRound(avgPowerDecibelsR, 1) : null;
      } else if (this._audioCtx.currentTime - this._peakSetTimeR > 1) {
        this._peakR = this._amplitudeL;
        this._peakSetTimeR = this._audioCtx.currentTime;
        avgPowerDecibelsR !== -Infinity ? this._dom.labels[1].textContent = PeakMeter.precisionRound(avgPowerDecibelsR, 1) : null;
      }

      this.drawLiveMeter(this._canvasL, this._amplitudeL, this._peakL);
      this.drawLiveMeter(this._canvasR, this._amplitudeR, this._peakR);
      requestAnimationFrame(this._processAudioBin);
    }
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

    gradient.addColorStop(0, '#56D45B');
    gradient.addColorStop(0.7, '#AFF2B3');
    gradient.addColorStop(0.833, '#FFAD67');
    gradient.addColorStop(0.9, '#FF6B67');
    gradient.addColorStop(1, '#FFBAB8');

    return gradient;
  }


  drawLed(canvas, ctx, amplitude) {
    ctx.fillStyle = this.ledGradient(canvas, ctx);

    if (this._orientation === 'horizontal') {
      var ledWidth = canvas.width - amplitude;
      ctx.fillRect(0, 0, ledWidth, canvas.height);
    } else if (this._orientation === 'vertical') {
      var ledHeight = canvas.height - amplitude;
      ctx.fillRect(0, canvas.height - ledHeight, canvas.width, ledHeight);
    }
  }


  drawPeak(canvas, ctx, peak) {
    ctx.fillStyle = '#FF6B67';
    if (this._orientation === 'horizontal') {
      var ledWidth = canvas.width - peak;
      ctx.fillRect(ledWidth, 0, 1, canvas.height);
    } else if (this._orientation === 'vertical') {
      var ledHeight = canvas.height - peak;
      ctx.fillRect(0, canvas.height - ledHeight, canvas.width, 1);
    }
  }


  drawLiveMeter(canvas, amplitude, peak) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.drawLed(canvas, ctx, amplitude);
    this.drawPeak(canvas, ctx, peak);
  }


  _pause() {
    super._pause();
    this._dom.labels[0].textContent = '-∞';
    this._dom.labels[1].textContent = '-∞';
  }


  _onResizeOverride() {
    if (this._orientation === 'horizontal') {
      this._canvasL.width = this._renderTo.offsetWidth - 30; // 2px borders + 28 px with for label
      this._canvasR.width = this._renderTo.offsetWidth - 30; // 2px borders + 28 px with for label
      this._canvasL.height = (this._renderTo.offsetHeight - 14) / 2 - 2; // 2px border + scale height 14px
      this._canvasR.height = (this._renderTo.offsetHeight - 14) / 2 - 2; // 2px border + scale height 14px
      this._dom.scaleContainer.style.width = this._canvasL.width + 'px';
    } else if (this._orientation === 'vertical') {
      this._canvasL.width = (this._renderTo.offsetWidth - 18) / 2 - 2; // 2px border + scale width 18px
      this._canvasR.width = (this._renderTo.offsetWidth - 18) / 2 - 2; // 2px border + scale width 18px
      this._canvasL.height = this._renderTo.offsetHeight - 18; // 2px borders + 16px height for label
      this._canvasR.height = this._renderTo.offsetHeight - 18; // 2px borders + 16px height for label
      this._dom.scaleContainer.style.height = this._canvasL.height + 'px';
      this._dom.scaleContainer.style.width = '18px';
    }

    this._createPeakLabel();
    this._createScaleTicks();
  }


  static precisionRound(value, precision) {
    const multiplier = Math.pow(10, precision || 0);
    return Math.round(value * multiplier) / multiplier;
  }


}


export default PeakMeter;
