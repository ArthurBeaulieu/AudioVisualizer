import VisuComponentMono from '../utils/VisuComponentMono.js';
import ColorUtils from '../utils/ColorUtils.js';
'use strict';


class Waveform extends VisuComponentMono {


  /** @summary Waveform displays the track audio waveform.
   * @author Arthur Beaulieu
   * @since 2020
   * @augments VisuComponentMono
   * @description <blockquote>This component will perform an offline analysis to display the whole track audio shape,
   * and provide different colors to track the audio progress. It is interactive and will update the player's
   * current time value to match the clicked one. This class extends VisuComponentMono only because it performs an offline
   * analysis on audio and the stereo information are already held in audio buffer.</blockquote>
   * @param {object} options - The waveform options
   * @param {string} options.type - The component type as string
   * @param {object} options.player - The player to take as processing input (if inputNode is given, player source will be ignored)
   * @param {object} options.renderTo - The DOM element to render canvas in
   * @param {number} options.fftSize - The FFT size for analysis. Must be a power of 2. High values may lead to heavy CPU cost
   * @param {object} [options.audioContext=null] - The audio context to base analysis from
   * @param {object} [options.inputNode=null] - The audio node to take source instead of player's one
   * @param {object} [options.animation] - The track progress animation to be with <code>gradient</code> color
   * @param {object} [options.wave] - Wave potions
   * @param {string} [options.wave.align='center'] - Wave alignment in <code>top</code>/<code>center</code>/<code>bottom</code>
   * @param {number} [options.wave.barWidth=1] - The bar width in px
   * @param {number} [options.wave.barMarginScale=0.125] - The margin scale of bar width in Float[0,1]
   * @param {boolean} [options.wave.merged=true] - Symmetry if wave is align center
   * @param {boolean} [options.wave.noSignalLine=true] - Display a line when no signal
   * @param {object} [options.colors] - Waveform color potions
   * @param {object} [options.colors.background='#1D1E25'] - Canvas background color in Hex/RGB/HSL
   * @param {object} [options.colors.track='#E7E9E7'] - The waveform background color in Hex/RGB/HSL
   * @param {object} [options.colors.progress='#56D45B'] - The waveform progress color in Hex/RGB/HSL **/
  constructor(options) {
    super(options);

    this._colors = {
      background: options.colors ? options.colors.background || ColorUtils.defaultBackgroundColor : ColorUtils.defaultBackgroundColor,
      track: options.colors ? options.colors.track || ColorUtils.defaultTextColor : ColorUtils.defaultTextColor,
      progress: options.colors ? options.colors.progress || ColorUtils.defaultPrimaryColor : ColorUtils.defaultPrimaryColor
    };

    this._canvas.style.backgroundColor = this._colors.background;

    if (this._player.src !== '') {
      this._getPlayerSourceFile();
    }
  }


  /*  ----------  VisuComponentMono overrides  ----------  */



  /** @method
   * @name _fillAttributes
   * @private
   * @override
   * @memberof Waveform
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Internal method to fill internal properties from options object sent to constructor.</blockquote>
   * @param {object} options - The frequency circle options
   * @param {string} options.type - The component type as string
   * @param {object} options.player - The player to take as processing input (if inputNode is given, player source will be ignored)
   * @param {object} options.renderTo - The DOM element to render canvas in
   * @param {number} options.fftSize - The FFT size for analysis. Must be a power of 2. High values may lead to heavy CPU cost
   * @param {object} [options.audioContext=null] - The audio context to base analysis from
   * @param {object} [options.inputNode=null] - The audio node to take source instead of player's one
   * @param {object} [options.wave] - Waveform potions
   * @param {string} [options.wave.align='center'] - Waveform alignment in <code>top</code>/<code>center</code>/<code>bottom</code>
   * @param {number} [options.wave.barWidth=1] - The bar width in px
   * @param {number} [options.wave.barMarginScale=0] - The margin scale of bar width in Float[0,1]
   * @param {boolean} [options.wave.merged=true] - Symmetry if wave is aligned to center
   * @param {boolean} [options.wave.noSignalLine=true] - Display a line when no signal **/
  _fillAttributes(options) {
    super._fillAttributes(options);
    this._animation = options.animation;
    this._wave = {
      align: options.wave ? options.wave.align || 'center' : 'center',
      barWidth: options.wave ? options.wave.barWidth || 1 : 1,
      barMarginScale: options.wave ? (options.wave.barMarginScale / 2) : 0.125, // Divide by 2 because true range is [0, 0.5]
      merged: options.wave ? options.wave.merged || true : true,
      noSignalLine: options.wave.noSignalLine ? options.wave.noSignalLine || true : false
    };
    this._bars = null; // Computed on build or resize
    this._offlineCtx = null;
    this._offlineBuffer = null;
    // Raw channel data for whole audio file
    this._dataL = [];
    this._dataR = [];
    // Event binding
    this._trackLoaded = this._trackLoaded.bind(this);
    this._seekPlayer = this._seekPlayer.bind(this);
  }


  /** @method
   * @name _buildUI
   * @private
   * @override
   * @memberof Waveform
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Create and configure canvas then append it to given DOM element.</blockquote> **/
  _buildUI() {
    super._buildUI();
    this._bars = this._canvas.width / this._wave.barWidth;
  }


  /** @method
   * @name _addEvents
   * @private
   * @override
   * @memberof Waveform
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Add component events (resize, play, pause, dbclick).</blockquote> **/
  _addEvents() {
    super._addEvents();
    this._player.addEventListener('loadedmetadata', this._trackLoaded, false);
    this._dom.container.addEventListener('click', this._seekPlayer, false);
  }


  /** @method
   * @name _removeEvents
   * @private
   * @override
   * @memberof Waveform
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Remove component events (resize, play, pause, dbclick).</blockquote> **/
  _removeEvents() {
    super._removeEvents();
    this._player.removeEventListener('loadedmetadata', this._trackLoaded, false);
    this._dom.container.removeEventListener('click', this._seekPlayer, false);
  }


  /** @method
   * @name _onResize
   * @private
   * @override
   * @memberof Waveform
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>On resize event callback.</blockquote> **/
  _onResize() {
    super._onResize();
    this._bars = this._canvas.width / this._wave.barWidth;
    this._fillData();
    this._clearCanvas();
    this._drawFileWaveform(this._player.currentTime / this._player.duration);
  }


  /** @method
   * @name _dblClick
   * @private
   * @override
   * @memberof Waveform
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>On double click event callback.</blockquote> **/
  _dblClick() {
    // Required to revoke fullscreen toggle from parent class, as it interferes with seek feature
  }


  /** @method
   * @name _processAudioBin
   * @private
   * @override
   * @memberof Waveform
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Real time method called by WebAudioAPI to process PCM data. Here we make a 8 bit frequency
   * and time analysis.</blockquote> **/
  _processAudioBin() {
    if (this._isPlaying === true) {
      this._clearCanvas();
      this._drawFileWaveform(this._player.currentTime / this._player.duration);
      requestAnimationFrame(this._processAudioBin);
    }
  }


  /*  ----------  Waveform internal methods  ----------  */


  /** @method
   * @name _trackLoaded
   * @private
   * @memberof Waveform
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Player callback on track loaded.</blockquote> **/
  _trackLoaded() {
    cancelAnimationFrame(this._processAudioBin);
    this._clearCanvas(); // Clear previous canvas
    // Do XHR to request file and parse it
    this._getPlayerSourceFile();
  }


  /** @method
   * @name _seekPlayer
   * @private
   * @memberof Waveform
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Update waveform progress according to mouse seek event.</blockquote>
   * @param {object} event - The mouse event **/
  _seekPlayer(event) {
    const boundingBox = event.target.getBoundingClientRect();
    const xOffset = event.clientX - boundingBox.left;
    this._player.currentTime = (xOffset / this._canvas.width) * this._player.duration;
    this._clearCanvas();
    this._drawFileWaveform(this._player.currentTime / this._player.duration);
  }


  /** @method
   * @name _processAudioFile
   * @private
   * @memberof Waveform
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Perform an offline analysis on whole track.</blockquote>
   * @param {object} response - HTTP response for audio track to extract buffer from **/
  _processAudioFile(response) {
    // Set offline context according to track duration to get its full samples
    this._offlineCtx = new OfflineAudioContext(2, this._audioCtx.sampleRate * this._player.duration, this._audioCtx.sampleRate);
    this._offlineSource = this._offlineCtx.createBufferSource();
    this._audioCtx.decodeAudioData(response, buffer => {
      this._offlineSource.buffer = buffer;
      this._offlineSource.connect(this._offlineCtx.destination);
      this._offlineSource.start();
      this._offlineCtx.startRendering().then(renderedBuffer => {
        this._offlineBuffer = renderedBuffer;
        this._fillData();
        this._drawFileWaveform(this._player.currentTime / this._player.duration);
      }).catch(function(err) {
        console.log('Rendering failed: ' + err);
      });
    });
  }


  /** @method
   * @name _fillData
   * @private
   * @memberof Waveform
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Generate merged or stereo data from audio buffer.</blockquote> **/
  _fillData() {
    if (this._offlineBuffer) {
      if (this._wave.merged === true) {
        // Mono output will only use L array to store L/R averages
        this._dataL = this._genScaledMonoData(this._offlineBuffer);
      } else {
        this._dataL = this._genScaledData(this._offlineBuffer.getChannelData(0));
        this._dataR = this._genScaledData(this._offlineBuffer.getChannelData(1));
      }
    }
  }


  /** @method
   * @name _genScaledData
   * @private
   * @memberof Waveform
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>L/R Sub sample channel data to compute average value, depending on bar count.</blockquote>
   * @param {Float32Array} data - Channel data (L/R here)
   * @return {number[]} Array of height per sub samples **/
  _genScaledData(data) {
    const subSampleSize = Math.floor(data.length / this._bars);
    const output = [];
    // We need to sub sample raw data according to the bar number. We average fq values
    for (let i = 0; i <= (data.length - subSampleSize); i += subSampleSize) {
      let sum = 0;
      for (let j = 0; j < subSampleSize; ++j) {
        sum += Math.abs(data[i + j]);
      }

      output.push(sum / subSampleSize);
    }

    return this._scaleDataToHeight(output);
  }


  /** @method
   * @name _genScaledMonoData
   * @private
   * @memberof Waveform
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Merged L/R Sub sample channel data to compute average value, depending on bar count.</blockquote>
   * @param {object} buffer - Audio buffer
   * @return {number[]} Array of height per sub samples **/
  _genScaledMonoData(buffer) {
    const dataL = buffer.getChannelData(0);
    const dataR = buffer.getChannelData(1);
    const subSampleSize = Math.floor(dataL.length / this._bars);
    const output = [];

    // We need to sub sample raw data according to the bar number. We average fq values
    for (let i = 0; i <= dataL.length - subSampleSize; i += subSampleSize) {
      let sum = 0;
      for (let j = 0; j < subSampleSize; ++j) {
        sum += (Math.abs(dataL[i + j]) + Math.abs(dataR[i + j])) / 2;
      }

      output.push(sum / subSampleSize);
    }

    return this._scaleDataToHeight(output);
  }


  /** @method
   * @name _scaleDataToHeight
   * @private
   * @memberof Waveform
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Scale channel data into an array of height to be used in canvas on draw.</blockquote>
   * @param {number[]} sampledData - Channel data
   * @return {number[]} Array of height per sub samples **/
  _scaleDataToHeight(sampledData) {
    // Convert a range to another, maintaining ratio
    // oldRange = (oldMax - oldMin)
    // newRange = (newMax - newMin)
    // newValue = (((oldValue - oldMin) * newRange) / oldRange) + NewMin */
    // We take max value of sampled data as 90% height in canvas as ref
    const oldMax = Math.max(...sampledData);
    const oldMin = Math.min(...sampledData);

    const oldRange = oldMax - oldMin;
    const newRange = this._canvas.height * .9;

    let scaledData = [];
    for (let i = 0; i < sampledData.length; ++i) {
      scaledData.push(((sampledData[i] - oldMin) * newRange) / oldRange);
    }

    return scaledData;
  }


  /** @method
   * @name _drawFileWaveform
   * @private
   * @memberof Waveform
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Draw waveform with a given progress.</blockquote>
   * @param {number} progressPercentage - Track progress percentage **/
  _drawFileWaveform(progressPercentage) {
    const x = this._canvas.width / this._bars;
    const margin = x * this._wave.barMarginScale;

    this._ctx.beginPath();
    // Iterate bar data
    for (let i = 0; i < this._dataL.length; ++i) {
      // Determine Y pos for Up and Down rectangles to draw (in mono, we only use merged data in dataL array)
      const yU = this._dataL[i] / 2;
      const yD = (this._wave.merged === true) ? this._dataL[i] / 2 : this._dataR[i] / 2;
      // Determine bar color according to progress.
      this._ctx.fillStyle = this._colors.track; // White by default (un-read yet)
      if ((x * (i + 1)) / this._canvas.width > progressPercentage && (x * i) / this._canvas.width < progressPercentage) {
        // Create linear gradient on bar X dimension
        const gradient = this._ctx.createLinearGradient(
          x * i + margin, 0, // Bar X start
          x * (i + 1) - margin, 0 // Bar X end
        );
        // Get bar range in px
        let barRange = ((x * (i + 1))) - ((x * i));
        // We get progress X position according to canvas width
        let progressX = progressPercentage * this._canvas.width;
        // Convert this width into a percentage of barWidth progression
        let barProgressPercentage = (Math.abs(progressX - (x * i))) / (barRange);
        if (this._animation === 'gradient') {
          if (barProgressPercentage + 0.01 < 1) {
            gradient.addColorStop(0, this._colors.progress); // Green
            gradient.addColorStop(barProgressPercentage, this._colors.progress); // Green
            gradient.addColorStop(barProgressPercentage + 0.01, this._colors.track); // Not progressive gradient
            gradient.addColorStop(1, this._colors.track);
            this._ctx.fillStyle = gradient; // Gradient from green to white with correct progression in bar
          } else {
            this._ctx.fillStyle = this._colors.progress; // Green full for last position in bars
          }
        } else {
          const amount = Math.round(barProgressPercentage * 255);
          this._ctx.fillStyle = ColorUtils.lightenDarkenColor(this._colors.progress, 255 - amount); // Green full for last position in bars
        }
     } else if (i / this._dataL.length < progressPercentage) {
        this._ctx.fillStyle = this._colors.progress; // Green for already played bars
      }
      // Draw up and down rectangles for current bar
      if (this._wave.align === 'center') {
        this._ctx.fillRect(x * i + margin, (this._canvas.height / 2) - yU, x - margin * 2, yU);
        this._ctx.fillRect(x * i + margin, this._canvas.height / 2, x - margin * 2, yD);
        // Add tiny centered line
        if (this._wave.noSignalLine) {        
          this._ctx.fillRect(x * i + margin, this._canvas.height / 2 - 0.5, x - margin * 2, 1);
        }
      } else if (this._wave.align === 'bottom') {
        this._ctx.fillRect(x * i + margin, this._canvas.height - yU, x - margin * 2, yU);
        this._ctx.fillRect(x * i + margin, this._canvas.height - yU - yD + 1, x - margin * 2, yD); // Offset one pixel origin to blend channel properly
      } else if (this._wave.align === 'top') { // Stack L/R on each other
        this._ctx.fillRect(x * i + margin, 0, x - margin * 2, yU);
        this._ctx.fillRect(x * i + margin, yU - 1, x - margin * 2, yD); // Offset one pixel origin to blend channel properly
      }
    }

    this._ctx.closePath();
  }


  /** @method
   * @name _getPlayerSourceFile
   * @private
   * @memberof Waveform
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Fetch audio file using xmlHTTP request.</blockquote> **/
  _getPlayerSourceFile() {
    const request = new XMLHttpRequest();
    request.open('GET', this._player.src, true);
    request.responseType = 'arraybuffer';
    request.onload = () => { this._processAudioFile(request.response); };
    request.send();
  }


}


export default Waveform;
