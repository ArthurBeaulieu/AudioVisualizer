import VisuComponentStereo from '../utils/VisuComponentStereo.js';
import CanvasUtils from '../utils/CanvasUtils.js';
import ColorUtils from '../utils/ColorUtils.js';


class Oscilloscope extends VisuComponentStereo {


  /** @summary Oscilloscope displays a merged or L/R oscilloscope in real time.
   * @author Arthur Beaulieu
   * @since 2020
   * @augments VisuComponentStereo
   * @description <blockquote>This will display a single/dual canvas with frequency displayed with.</blockquote>
   * @param {object} options - The oscilloscope options
   * @param {string} options.type - The component type as string
   * @param {object} options.player - The player to take as processing input (if inputNode is given, player source will be ignored)
   * @param {object} options.renderTo - The DOM element to render canvas in
   * @param {number} options.fftSize - The FFT size for analysis. Must be a power of 2. High values may lead to heavy CPU cost
   * @param {object} [options.audioContext=null] - The audio context to base analysis from
   * @param {object} [options.inputNode=null] - The audio node to take source instead of player's one
   * @param {boolean} [options.merged=false] - Merge left and right channel into one output
   * @param {string} [options.colors] - The oscilloscope background and signal color
   * @param {string} [options.colors.signal=ColorUtils.defaultPrimaryColor] - The signal color
   * @param {string} [options.colors.background=ColorUtils.defaultPrimaryColor] - The background color **/
  constructor(options) {
    super(options);
    // Save color
    this._colors = {
      signal: options.colors ? options.colors.signal || ColorUtils.defaultPrimaryColor : ColorUtils.defaultPrimaryColor
    };
    // Update canvas CSS background color
    const bgColor = (options.colors ? options.colors.background || ColorUtils.defaultBackgroundColor : ColorUtils.defaultBackgroundColor);
    if (this._merged === true) {
      this._canvas.style.backgroundColor = bgColor;
    } else {
      this._canvasL.style.backgroundColor = bgColor;
      this._canvasR.style.backgroundColor = bgColor;
    }
    // Init oscilloscope dimensions
    this._updateDimensions();
  }


  /*  --------------------------------------------------------------------------------------------------------------- */
  /*  -------------------------------------  VISUCOMPONENTSTEREO OVERRIDES  ----------------------------------------  */
  /*  --------------------------------------------------------------------------------------------------------------- */



  /** @method
   * @name _fillAttributes
   * @private
   * @override
   * @memberof Oscilloscope
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Internal method to fill internal properties from options object sent to constructor.</blockquote>
   * @param {object} options - The oscilloscope options
   * @param {string} options.type - The component type as string
   * @param {object} options.player - The player to take as processing input (if inputNode is given, player source will be ignored)
   * @param {object} options.renderTo - The DOM element to render canvas in
   * @param {number} options.fftSize - The FFT size for analysis. Must be a power of 2. High values may lead to heavy CPU cost
   * @param {object} [options.audioContext=null] - The audio context to base analysis from
   * @param {object} [options.inputNode=null] - The audio node to take source instead of player's one **/
  _fillAttributes(options) {
    super._fillAttributes(options)

    // Dimensions will be computed when canvas have been created
    this._dimension = {
      height: null,
      canvasHeight: null,
      width: null
    };
  }


  /** @method
   * @name _buildUI
   * @private
   * @override
   * @memberof Oscilloscope
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Create and configure canvas then append it to given DOM element.</blockquote> **/
  _buildUI() {
    super._buildUI();

    if (this._merged === true) {
      this._dom.container.removeChild(this._canvasR);
    }
  }


  /** @method
   * @name _onResize
   * @private
   * @override
   * @memberof Oscilloscope
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>On resize event callback.</blockquote> **/
  _onResize() {
    super._onResize();
    this._updateDimensions();
  }


  /** @method
   * @name _processAudioBin
   * @private
   * @override
   * @memberof Oscilloscope
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Real time method called by WebAudioAPI to process PCM data. Here we make a 8 bit time
   * analysis.</blockquote> **/
  _processAudioBin() {
    if (this._isPlaying === true) {
      this._clearCanvas();

      if (this._merged === true) {
        this._mergedStereoAnalysis();
      } else {
        this._stereoAnalysis();
      }
      // Draw next frame
      requestAnimationFrame(this._processAudioBin);
    }
  }


  /*  ----------  Oscilloscope internal methods  ----------  */


  /** @method
   * @name _mergedStereoAnalysis
   * @private
   * @memberof Oscilloscope
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Perform a merged Left and Right analysis with 8 bit time domain data.</blockquote> **/
  _mergedStereoAnalysis() {
    // Create TimeDomain array with frequency bin length
    let timeDomain = new Uint8Array(this._nodes.analyser.frequencyBinCount);
    // Left/Right channel
    this._nodes.analyser.getByteTimeDomainData(timeDomain);
    CanvasUtils.drawOscilloscope(this._canvasL, {
      samples: this._nodes.analyser.frequencyBinCount,
      timeDomain: timeDomain,
      color: this._colors.signal
    });
  }


  /** @method
   * @name _stereoAnalysis
   * @private
   * @memberof Oscilloscope
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Perform a separated Left and Right analysis with 8 bit time domain data.</blockquote> **/
  _stereoAnalysis() {
    // Create TimeDomain array with freqency bin length
    let timeDomain = new Uint8Array(this._nodes.analyserL.frequencyBinCount);
    // Left channel
    this._nodes.analyserL.getByteTimeDomainData(timeDomain);
    CanvasUtils.drawOscilloscope(this._canvasL, {
      samples: this._nodes.analyserL.frequencyBinCount,
      timeDomain: timeDomain,
      color: this._colors.signal
    });
    // Right channel
    this._nodes.analyserR.getByteTimeDomainData(timeDomain);
    CanvasUtils.drawOscilloscope(this._canvasR, {
      samples: this._nodes.analyserR.frequencyBinCount,
      timeDomain: timeDomain,
      color: this._colors.signal
    });
  }


  /** @method
   * @name _updateDimensions
   * @private
   * @memberof Oscilloscope
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Usually called on resize event, update canvas dimension to fit render to DOM object.</blockquote> **/
  _updateDimensions() {
    this._dimension.height = this._renderTo.offsetHeight - 4; // 2px borders times two channels
    this._dimension.width = this._renderTo.offsetWidth - 2; // 2px borders
    this._dimension.canvasHeight = this._dimension.height / 2;

    if (this._merged === true) {
      this._canvasL.width = this._dimension.width;
      this._canvasL.height = this._dimension.canvasHeight * 2;
    } else {
      this._canvasL.width = this._dimension.width;
      this._canvasL.height = this._dimension.canvasHeight;
      this._canvasR.width = this._dimension.width;
      this._canvasR.height = this._dimension.canvasHeight;
    }
  }


}


export default Oscilloscope;
