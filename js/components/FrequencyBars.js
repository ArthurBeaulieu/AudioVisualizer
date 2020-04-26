import VisuComponentMono from '../utils/VisuComponentMono.js';
import CanvasUtils from '../utils/CanvasUtils.js';
import ColorUtils from '../utils/ColorUtils.js';


class FrequencyBars extends VisuComponentMono {


  constructor(options) {
    super(options);
  }


  /*  ----------  VisuComponentMono overrides  ----------  */


  _fillAttributes(options) {
    super._fillAttributes(options);
    // Frequency bars specific attributes
    this._color = options.color || '#56D45B';
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
        CanvasUtils.drawVerticalFrequencyBar(this._canvas, {
          frequencyHeight: frequencyHeight,
          frequencyWidth: frequencyWidth,
          colors: [
            { color: this._color, center: 0 },
            { color: ColorUtils.lightenDarkenColor(this._color, 50), center: 0.4 },
            { color: '#FFAD67', center: 0.8 },
            { color: '#FF6B67', center: 0.95 },
            { color: '#FFBAB8', center: 1 }
          ],
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
