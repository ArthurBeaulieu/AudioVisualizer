import VisuComponentMono from '../utils/VisuComponentMono.js';
import CanvasUtils from '../utils/CanvasUtils.js';
import ColorUtils from '../utils/ColorUtils.js';
'use strict';


class FrequencyBars extends VisuComponentMono {


  constructor(options) {
    super(options);
    // Peak gradient
    this._barGradient = [
      { color: options.colors ? options.colors.min || ColorUtils.defaultAudioGradient[0] : ColorUtils.defaultAudioGradient[0], index: 0 }, // Green
      { color: options.colors ? options.colors.step0 || ColorUtils.defaultAudioGradient[1] : ColorUtils.defaultAudioGradient[1], index: 0.7 }, // Light Green
      { color: options.colors ? options.colors.step1 || ColorUtils.defaultAudioGradient[2] : ColorUtils.defaultAudioGradient[2], index: 0.833 }, // Orange
      { color: options.colors ? options.colors.step2 || ColorUtils.defaultAudioGradient[3] : ColorUtils.defaultAudioGradient[3], index: 0.9 }, // Red
      { color: options.colors ? options.colors.max || ColorUtils.defaultAudioGradient[4] : ColorUtils.defaultAudioGradient[4], index: 1 } // Light Red
    ];
    // Update canvas CSS background color
    this._canvas.style.backgroundColor = options.colors ? options.colors.background || ColorUtils.defaultBackgroundColor : ColorUtils.defaultBackgroundColor;
  }


  /*  ----------  FrequencyBars internal methods  ----------  */


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
