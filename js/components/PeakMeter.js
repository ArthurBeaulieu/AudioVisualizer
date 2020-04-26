import VisuComponentStereo from '../utils/VisuComponentStereo.js';
import CanvasUtils from '../utils/CanvasUtils.js';


// https://github.com/esonderegger/web-audio-peak-meter

class PeakMeter extends VisuComponentStereo {


  constructor(options) {
    super(options);
  }


  /*  ----------  VisuComponentStereo overrides  ----------  */


  _fillAttributes(options) {
    super._fillAttributes(options);
    this._orientation = options.orientation || 'horizontal';
    this._dbScaleMin = options.dbScaleMin || 60;
    this._dbScaleTicks = options.dbScaleTicks || 15;
    this._amplitudeL = 0;
    this._amplitudeR = 0;
    this._peakL = 0;
    this._peakR = 0;
    this._peakSetTimeL = null;
    this._peakSetTimeR = null;
    this._dom.scaleContainer = null;
    this._dom.labels = [];
  }


  _buildUI() {
    super._buildUI();
    this._dom.scaleContainer = document.createElement('DIV');
    this._dom.scaleContainer.classList.add('scale-container');

    if (this._orientation === 'horizontal') {
      this._dom.container.classList.add('horizontal-peakmeter');
    }

    this._dom.container.insertBefore(this._dom.scaleContainer, this._dom.container.firstChild);

    this._updateDimensions();
    this._createPeakLabel();
    this._createScaleTicks();
  }


  _setAudioNodes() {
    super._setAudioNodes();
    this._peakSetTimeL = this._audioCtx.currentTime;
    this._peakSetTimeR = this._audioCtx.currentTime;
  }


  _pause() {
    super._pause();
    this._dom.labels[0].textContent = '-∞';
    this._dom.labels[1].textContent = '-∞';
  }


  _onResize() {
    super._onResize();
    this._updateDimensions();
    this._createPeakLabel();
    this._createScaleTicks();
  }


  /*  ----------  Oscilloscope internal methods  ----------  */


  _processAudioBin() {
    if (this._isPlaying === true) {
      this._clearCanvas();
      const dataL = new Float32Array(this._fftSize);
      const dataR = new Float32Array(this._fftSize);
      this._nodes.analyserL.getFloatTimeDomainData(dataL);
      this._nodes.analyserR.getFloatTimeDomainData(dataR);
      // Compute average power over the interval and average power attenuation in DB
      let sumOfSquaresL = 0;
      let sumOfSquaresR = 0;
      for (let i = 0; i < dataL.length; i++) {
        sumOfSquaresL += dataL[i] ** 2;
        sumOfSquaresR += dataR[i] ** 2;
      }
      const avgPowerDecibelsL = 10 * Math.log10(sumOfSquaresL / dataL.length);
      const avgPowerDecibelsR = 10 * Math.log10(sumOfSquaresR / dataR.length);
      // Compure amplitude from width or height depending on orientation
      const dbScaleBound = this._dbScaleMin * -1;
      if (this._orientation === 'horizontal') {
        this._amplitudeL = Math.floor((avgPowerDecibelsL * this._canvasL.width) / dbScaleBound);
        this._amplitudeR = Math.floor((avgPowerDecibelsR * this._canvasR.width) / dbScaleBound);
      } else if (this._orientation === 'vertical') {
        this._amplitudeL = Math.floor((avgPowerDecibelsL * this._canvasL.height) / dbScaleBound);
        this._amplitudeR = Math.floor((avgPowerDecibelsR * this._canvasR.height) / dbScaleBound);
      }
      // Left channel
      // Found a new max value (peak) [-this._dbScaleMin, 0] interval
      if (this._peakL > this._amplitudeL) {
        this._peakL = this._amplitudeL;
        this._peakSetTimeL = this._audioCtx.currentTime;
        // Update peak label
        avgPowerDecibelsL !== -Infinity ? this._dom.labels[0].textContent = CanvasUtils.precisionRound(avgPowerDecibelsL, 1) : null;
      } else if (this._audioCtx.currentTime - this._peakSetTimeL > 1) {
        this._peakL = this._amplitudeL;
        this._peakSetTimeL = this._audioCtx.currentTime;
        // Update peak label
        avgPowerDecibelsL !== -Infinity ? this._dom.labels[0].textContent = CanvasUtils.precisionRound(avgPowerDecibelsL, 1) : null;
      }
      // Right channel
      // Found a new max value (peak) [-this._dbScaleMin, 0] interval
      if (this._peakR > this._amplitudeR) {
        this._peakR = this._amplitudeR;
        this._peakSetTimeR = this._audioCtx.currentTime;
        // Update peak label
        avgPowerDecibelsR !== -Infinity ? this._dom.labels[1].textContent = CanvasUtils.precisionRound(avgPowerDecibelsR, 1) : null;
      } else if (this._audioCtx.currentTime - this._peakSetTimeR > 1) {
        this._peakR = this._amplitudeL;
        this._peakSetTimeR = this._audioCtx.currentTime;
        // Update peak label
        avgPowerDecibelsR !== -Infinity ? this._dom.labels[1].textContent = CanvasUtils.precisionRound(avgPowerDecibelsR, 1) : null;
      }
      // Peak gradient
      const peakGradient = [
        { color: '#56D45B', center: 0 }, // Green
        { color: '#AFF2B3', center: 0.7 }, // Light Green
        { color: '#FFAD67', center: 0.833 }, // Orange
        { color: '#FF6B67', center: 0.9 }, // Red
        { color: '#FFBAB8', center: 1 } // Light Red
      ];
      // Draw left and right peak meters
      CanvasUtils.drawPeakMeter(this._canvasL, {
        amplitude: this._amplitudeL,
        peak: this._peakL,
        orientation: this._orientation,
        colors: peakGradient
      });
      CanvasUtils.drawPeakMeter(this._canvasR, {
        amplitude: this._amplitudeR,
        peak: this._peakR,
        orientation: this._orientation,
        colors: peakGradient
      });
      // Draw next frame
      requestAnimationFrame(this._processAudioBin);
    }
  }


  _createScaleTicks() {
    const numTicks = Math.floor(this._dbScaleMin / this._dbScaleTicks);
    let dbTickLabel = 0;
    this._dom.scaleContainer.innerHTML = '';
    if (this._orientation === 'horizontal') {
      const tickWidth = this._canvasL.width / numTicks;
      for (let i = 0; i < numTicks; ++i) {
        const dbTick = document.createElement('DIV');
        this._dom.scaleContainer.appendChild(dbTick);
        dbTick.style.width = `${tickWidth}px`;
        dbTick.textContent = `${dbTickLabel}`;
        dbTickLabel -= this._dbScaleTicks;
      }
    } else {
      const tickHeight = this._canvasL.height / numTicks;
      for (let i = 0; i < numTicks; ++i) {
        const dbTick = document.createElement('DIV');
        this._dom.scaleContainer.appendChild(dbTick);
        dbTick.style.height = `${tickHeight}px`;
        dbTick.textContent = `${dbTickLabel}`;
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

    const peakLabelL = document.createElement('DIV');
    const peakLabelR = document.createElement('DIV');
    peakLabelL.classList.add('peak-value-container');
    peakLabelR.classList.add('peak-value-container');
    peakLabelL.textContent = '-∞';
    peakLabelR.textContent = '-∞';

    if (this._orientation === 'horizontal') {
      peakLabelL.style.width = '28px';
      peakLabelL.style.height = `${this._canvasL.height + 2}px`; // 2 px borders
      peakLabelL.style.top = '14px';
      peakLabelR.style.width = '28px';
      peakLabelR.style.height = `${this._canvasL.height + 2}px`; // 2 px borders
      peakLabelR.style.top = `${this._canvasL.height + 16}px`; // 2px borders + 14px height
    } else {
      peakLabelL.style.width = `${this._canvasL.width + 2}px`; // 2 px borders
      peakLabelL.style.left = '18px';
      peakLabelR.style.width = `${this._canvasL.width + 2}px`; // 2 px borders
      peakLabelR.style.left = `${this._canvasL.width + 20}px`; // 2px borders + 18px width
    }

    this._dom.labels.push(peakLabelL);
    this._dom.labels.push(peakLabelR);
    this._dom.container.appendChild(this._dom.labels[0]);
    this._dom.container.appendChild(this._dom.labels[1]);
  }


  _updateDimensions() {
    if (this._orientation === 'horizontal') {
      this._canvasL.width = this._renderTo.offsetWidth - 30; // 2px borders + 28 px with for label
      this._canvasR.width = this._renderTo.offsetWidth - 30; // 2px borders + 28 px with for label
      this._canvasL.height = (this._renderTo.offsetHeight - 14) / 2 - 2; // 2px border + scale height 14px
      this._canvasR.height = (this._renderTo.offsetHeight - 14) / 2 - 2; // 2px border + scale height 14px
      this._dom.scaleContainer.style.width = `${this._canvasL.width}px`;
    } else if (this._orientation === 'vertical') {
      this._canvasL.width = (this._renderTo.offsetWidth - 18) / 2 - 2; // 2px border + scale width 18px
      this._canvasR.width = (this._renderTo.offsetWidth - 18) / 2 - 2; // 2px border + scale width 18px
      this._canvasL.height = this._renderTo.offsetHeight - 18; // 2px borders + 16px height for label
      this._canvasR.height = this._renderTo.offsetHeight - 18; // 2px borders + 16px height for label
      this._dom.scaleContainer.style.height = `${this._canvasL.height}px`;
      this._dom.scaleContainer.style.width = '18px';
    }
  }


}


export default PeakMeter;
