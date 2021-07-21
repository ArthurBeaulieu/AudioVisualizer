import VisuComponentMono from '../utils/VisuComponentMono.js';
import CanvasUtils from '../utils/CanvasUtils.js';
import ColorUtils from '../utils/ColorUtils.js';


class FrequencyBars extends VisuComponentMono {


  /** @summary FrequencyBars displays the audio spectrum as frequency bars in real time.
   * @author Arthur Beaulieu
   * @since 2020
   * @augments VisuComponentMono
   * @description <blockquote>This will display a single canvas with frequency from left to right be bass to high. The bar
   * height depends on audio bin intensity. The audio graph is then draw with a gradient from bottom to top that is from
   * green to red. Those color can be custom ones (see constructor options).</blockquote>
   * @param {object} options - The frequency bars options
   * @param {string} options.type - The component type as string
   * @param {object} options.player - The player to take as processing input (if inputNode is given, player source will be ignored)
   * @param {object} options.renderTo - The DOM element to render canvas in
   * @param {number} options.fftSize - The FFT size for analysis. Must be a power of 2. High values may lead to heavy CPU cost
   * @param {object} [options.audioContext=null] - The audio context to base analysis from
   * @param {object} [options.inputNode=null] - The audio node to take source instead of player's one
   * @param {object[]} [options.colors] - The peak meter gradient colors, must be objects with color (in Hex/RGB/HSL) and index (in Float[0,1]) properties **/
  constructor(options) {
    super(options);
    // Peak gradient
    if (!options.colors || !options.colors.gradient) {
      this._barGradient = ColorUtils.defaultAudioGradient;
    } else {
      this._barGradient = options.colors.gradient;
    }
    // Update canvas CSS background color
    this._canvas.style.backgroundColor = options.colors ? options.colors.background || ColorUtils.defaultBackgroundColor : ColorUtils.defaultBackgroundColor;
  }


  /*  --------------------------------------------------------------------------------------------------------------- */
  /*  --------------------------------------  VISUCOMPONENTMONO OVERRIDES  -----------------------------------------  */
  /*  --------------------------------------------------------------------------------------------------------------- */


  /** @method
   * @name _processAudioBin
   * @private
   * @override
   * @memberof FrequencyBars
   * @author Arthur Beaulieu
   * @since 2020
   * @description <blockquote>Real time method called by WebAudioAPI to process PCM data. Here we make a 8 bit frequency
   * analysis. Then we use utils method to draw bar for each audio bin in studied audio spectrum.</blockquote> **/
  _processAudioBin() {
    // Only fill again the canvas if player is playing
    if (this._isPlaying === true) {
      this._clearCanvas();
      // Get frequency data for current bin in node analyser
      const frequencyData = new Uint8Array(this._nodes.analyser.frequencyBinCount);
      this._nodes.analyser.getByteFrequencyData(frequencyData);
      // Compute single frequency width according to analyser node
      const frequencyWidth = (this._canvas.width / this._nodes.analyser.frequencyBinCount);
      // Iterate over data to build each bar
      let cursorX = 0; // X origin for items in loop
      for (let i = 0; i < this._nodes.analyser.frequencyBinCount; ++i) {
        // Compute frequency height in px, relative to the canvas height
        let frequencyHeight = (frequencyData[i] / 255) * (this._canvas.height);
        CanvasUtils.drawVerticalBar(this._canvas, {
          height: frequencyHeight,
          width: frequencyWidth,
          colors: this._barGradient,
          originX: cursorX
        });
        // Update cursor position
        cursorX += frequencyWidth;
      }
      // Draw next frame
      requestAnimationFrame(this._processAudioBin);
    }
  }


}


export default FrequencyBars;
